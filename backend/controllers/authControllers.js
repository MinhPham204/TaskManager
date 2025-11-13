const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redisClient");
const sendEmail = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");


const registerUser = async (req, res) => {
  try {
    const { email } = req.body;

    // Check email tồn tại
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email already registered" });

    // Tạo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP vào Redis (sống 5 phút)
    await redisClient.setEx(`otp:${email}`, 300, otp);

    // Gửi mail
    await sendEmail({
      to: email, 
      subject: "Your OTP Code", 
      text: `Your OTP is: ${otp}\n\nThis code is only valid for 5 minutes`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Register failed", error: err.message });
  }
};

// Xác minh OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp) return res.status(400).json({ message: "OTP expired or not found" });

    if (storedOtp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // Xóa OTP sau khi dùng
    await redisClient.del(`otp:${email}`);

    // Tạo verifiedToken (chỉ có hiệu lực ngắn, 10 phút)
    const verifiedToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    console.log("Generated verifiedToken:", verifiedToken);
    console.log("Decoded verifyOtp:", jwt.decode(verifiedToken));

    res.status(200).json({ message: "OTP verified successfully", verifiedToken });
  } catch (err) {
    res.status(500).json({ message: "Verify OTP failed", error: err.message });
  }
};

// Đặt mật khẩu và tạo tài khoản
const setPasswordUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Missing verified token" });
    }

    const verifiedToken = authHeader.split(" ")[1]; // lấy phần token
    console.log("Verified Token (header):", verifiedToken);

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(verifiedToken, process.env.JWT_SECRET);
      console.log("Decoded payload:", decoded);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const email = decoded.email;

    const { password, fullName } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: fullName,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Set password failed", error: err.message });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return user data with JWT
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    // Be tolerant: accept either req.user._id or req.user.id
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password"); // exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.profileImageUrl !== undefined) {
      user.profileImageUrl = req.body.profileImageUrl;
    }

    // if (req.body.password) {
    //   const salt = await bcrypt.genSalt(10);
    //   user.password = await bcrypt.hash(req.body.password, salt);
    // }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImageUrl: updatedUser.profileImageUrl,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new passwords are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // So sánh mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect current password" });
        }

        // Hash và cập nhật mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Dù user không tồn tại, vẫn trả về thông báo thành công để bảo mật
        if (!user) {
            return res.json({ message: "If an account with that email exists, a password reset OTP has been sent." });
        }

        // Tạo OTP và lưu vào Redis với prefix khác để tránh xung đột
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisClient.setEx(`reset-otp:${email}`, 300, otp); // Sống 5 phút

        // Gửi email
        await sendEmail(email, "Your Password Reset Code", `Your password reset OTP is: ${otp}\n\nThis code is only valid for 5 minutes`);

        res.json({ message: "If an account with that email exists, a password reset OTP has been sent." });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Xác minh OTP từ Redis
        const storedOtp = await redisClient.get(`reset-otp:${email}`);
        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Xóa OTP sau khi dùng
        await redisClient.del(`reset-otp:${email}`);

        // Hash và cập nhật mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne({ email }, { password: hashedPassword });

        res.json({ message: "Password has been reset successfully. You can now log in." });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

module.exports = { registerUser, verifyOtp, setPasswordUser, loginUser, getUserProfile, updateUserProfile, changePassword, forgotPassword, resetPassword };
