const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");

// Lấy danh sách user trong team (Đã tối ưu và bảo mật)
const getUser = async (req, res) => {
    try {
        const teamId = req.user.team;

        // Lấy tất cả user trong team
        const users = await User.find({ team: teamId, role: 'user' }).select("-password").lean();

        // Dùng aggregate để đếm task cho tất cả user chỉ bằng MỘT lần gọi DB
        const taskCounts = await Task.aggregate([
            { $match: { team: teamId } }, // Chỉ xét các task trong team
            { $unwind: "$assignedTo" }, // Tách mảng assignedTo ra thành các document riêng
            {
                $group: {
                    _id: "$assignedTo", // Gom nhóm theo ID người được gán
                    pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                    inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
                    completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
                }
            }
        ]);

        // Tạo một map để tra cứu số lượng task hiệu quả
        const taskCountMap = new Map(taskCounts.map(item => [item._id.toString(), item]));

        // Ghép kết quả lại trong code
        const userWithTaskCounts = users.map(user => {
            const counts = taskCountMap.get(user._id.toString()) || { pendingTasks: 0, inProgressTasks: 0, completedTasks: 0 };
            return {
                ...user,
                pendingTasks: counts.pendingTasks,
                inProgressTasks: counts.inProgressTasks,
                completedTasks: counts.completedTasks,
            };
        });

        res.json(userWithTaskCounts);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Lấy user theo ID (Đã bảo mật)
const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, team: req.user.team }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found or not in your team" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Tạo user mới bởi Admin (Đã thêm team)
const createUserByAdmin = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            team: req.user.team // Tự động gán user mới vào team của Admin
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Xóa user bởi Admin (Đã bảo mật)
const deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;

        // Admin không thể tự xóa chính mình
        if (userIdToDelete === req.user.id) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const userToDelete = await User.findOneAndDelete({ _id: userIdToDelete, team: req.user.team });

        if (!userToDelete) {
            return res.status(404).json({ message: "User not found or not in your team" });
        }

        // Tùy chọn: Gỡ user này khỏi tất cả các task họ được gán
        await Task.updateMany(
            { team: req.user.team, assignedTo: userIdToDelete },
            { $pull: { assignedTo: userIdToDelete } }
        );

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { 
    getUser, 
    getUserById,
    createUserByAdmin, 
    deleteUser         
};