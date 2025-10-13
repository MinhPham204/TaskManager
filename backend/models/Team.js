const mongoose = require("mongoose");
const teamSchema = new mongoose.Schema(
    {
        // --- Thông tin cơ bản ---
        name: {
            type: String,
            required: [true, "Tên team là bắt buộc"],
            trim: true, // Tự động xóa khoảng trắng thừa
            unique: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        logoUrl: {
            type: String,
            default: null,
        },

        // --- Quản lý thành viên và quyền hạn ---
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true, // Người tạo ra team
        },
        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Danh sách những người có quyền admin trong team
        }],
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Tất cả thành viên trong team (bao gồm cả owner và admins)
        }],

        // --- Hệ thống mời (Invitation System) ---
        pendingInvitations: [{
            email: {
                type: String,
                required: true,
            },
            role: {
                type: String,
                enum: ['admin', 'user'],
                default: 'user',
            },
            // Bạn có thể thêm token và ngày hết hạn cho lời mời ở đây
            // inviteToken: String,
            // inviteExpires: Date,
        }],
    },
    { timestamps: true }
);

// Tự động thêm owner vào danh sách admin và member khi tạo team mới
teamSchema.pre('save', function(next) {
    if (this.isNew) {
        // Đảm bảo owner cũng là admin và member
        if (!this.admins.includes(this.owner)) {
            this.admins.push(this.owner);
        }
        if (!this.members.includes(this.owner)) {
            this.members.push(this.owner);
        }
    }
    next();
});


module.exports = mongoose.model("Team", teamSchema);