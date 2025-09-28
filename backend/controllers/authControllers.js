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
    await sendEmail(email, "Your OTP Code", `Your OTP is: ${otp}\n\nThis code is only valid for 5 minutes`);

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

    // Tạo verifiedToken (chỉ có hiệu lực ngắn, ví dụ 10 phút)
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

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

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

module.exports = { registerUser, verifyOtp, setPasswordUser, loginUser, getUserProfile, updateUserProfile };
