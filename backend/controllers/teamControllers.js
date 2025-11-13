const Team = require('../models/Team');
const User = require('../models/User');
const crypto = require('crypto');

const redisClient = require('../config/redisClient');

const sendEmail = require('../utils/sendEmail');
const createTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        const ownerId = req.user._id;

        if (!name) {
            return res.status(400).json({ message: "Team name is required" });
        }

        // Kiểm tra xem user đã thuộc team nào chưa
        if (req.user.team) {
            return res.status(400).json({ message: "You are already a member of another team" });
        }

        const newTeam = new Team({
            name,
            description,
            owner: ownerId,
        });

        const savedTeam = await newTeam.save();

        // Cập nhật lại team cho user đã tạo
        await User.findByIdAndUpdate(ownerId, { team: savedTeam._id });

        res.status(201).json({ message: "Team created successfully!", team: savedTeam });
    } catch (error) {
        if (error.code === 11000) { // Lỗi trùng tên team
            return res.status(400).json({ message: "This team name already exists" });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const getTeamDetails = async (req, res) => {
    try {
        const teamId = req.user.team;

        if (!teamId) {
            return res.status(404).json({ message: "You have not joined any team" });
        }

        const team = await Team.findById(teamId)
            .populate('owner', 'name email profileImageUrl')
            .populate('admins', 'name email profileImageUrl')
            .populate('members', 'name email profileImageUrl');

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        res.json(team);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const inviteMember = async (req, res) => {
    try {
        const { userId, role } = req.body; 
        const teamId = req.user.team;
        const inviter = req.user; // Dùng req.user thay vì inviterId

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // Kiểm tra quyền: Chỉ admin của team mới được mời
        if (!team.admins.map(id => id.toString()).includes(inviter._id.toString())) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        
        // Lấy thông tin user được mời (để lấy email của họ)
        const userToInvite = await User.findById(userId);
        if (!userToInvite) {
            return res.status(404).json({ message: "User to invite not found" });
        }
        
        const emailToInvite = userToInvite.email;

        // Kiểm tra xem user đã là thành viên chưa
        if (team.members.includes(userToInvite._id)) {
            return res.status(400).json({ message: "This user is already a member of the team" });
        }
        
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const redisKey = `invite:${inviteToken}`;
        const invitationData = JSON.stringify({
            email: emailToInvite,
            userId: userToInvite._id,
            role,
            teamId: team._id,
            inviterName: inviter.name // Chúng ta có inviterName ở đây
        });

// ----- BẮT ĐẦU DEBUG -----
        console.log("INVITE: Chuẩn bị GHI vào Redis. Key:", redisKey);
        try {
            const redisResult = await redisClient.set(redisKey, invitationData, { EX: 86400 });
            console.log("INVITE: Kết quả GHI Redis:", redisResult); // Phải in ra 'OK'
        } catch (redisError) {
            console.error("INVITE: LỖI GHI REDIS!", redisError);
            // Ném lỗi này để API thất bại, thay vì gửi mail "ma"
            return res.status(500).json({ message: "Server error: Could not save invitation token." });
        }
        // ----- KẾT THÚC DEBUG -----

        await redisClient.set(redisKey, invitationData, { EX: 86400 });
        // ---- Gửi Email ----
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const acceptLink = `${clientUrl}/accept-invite?token=${inviteToken}`;
        
        const subject = `Lời mời tham gia nhóm: ${team.name}`;

        // Lấy chữ cái đầu của người mời để làm avatar
        const inviterInitial = inviter.name[0]?.toUpperCase() || 'T';

        // Bắt đầu mẫu email
        const htmlContent = `
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="padding: 24px; text-align: center;">
                
                <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #007bff; color: white; font-size: 32px; line-height: 60px; margin: 0 auto 16px;">
                    ${inviterInitial}
                </div>
                
                <p style="font-size: 18px; font-weight: 600; color: #202124; margin: 0;">${inviter.name}</p>
                <p style="font-size: 14px; color: #5f6368; margin: 4px 0 0;">(${inviter.email})</p>
                
                <p style="font-size: 22px; color: #3c4043; margin: 24px 0;">
                    Bạn đã được mời tham gia nhóm
                </p>
                <p style="font-size: 28px; font-weight: bold; color: #202124; margin: 0 0 24px;">
                    ${team.name}
                </p>
                
                <a href="${acceptLink}" 
                target="_blank" 
                style="display: inline-block; text-decoration: none; background-color: #007bff; color: white; font-size: 16px; font-weight: 600; padding: 12px 32px; border-radius: 4px;">
                Tham gia nhóm
                </a>
                
            </div>
            <div style="background-color: #f8f9fa; padding: 16px 24px; text-align: center;">
                <p style="font-size: 12px; color: #5f6368; margin: 0;">
                    Bạn nhận được email này vì ${inviter.name} đã mời bạn tham gia Task Manager.
                </p>
            </div>
        </div>
        `;
        // kết thúc mẫu email

        await sendEmail({
            to: emailToInvite, 
            subject: subject, 
            html: htmlContent
        });

        // Ghi log để test
        console.log("Đang gửi email mời đến:", emailToInvite);
        console.log("Link mời:", acceptLink);

        res.json({ message: `Invitation sent to ${emailToInvite}` });
    } catch (error) {
        console.error("Lỗi khi mời thành viên:", error); // Thêm log lỗi chi tiết
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const removeMember = async (req, res) => {
    try {
        const { userId } = req.params;
        const teamId = req.user.team;
        const removerId = req.user._id.toString();

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // Kiểm tra quyền: Chỉ admin mới được xóa
        if (!team.admins.map(id => id.toString()).includes(removerId)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        // Kiểm tra logic: Không thể xóa owner
        if (team.owner.toString() === userId) {
            return res.status(400).json({ message: "Cannot remove the team owner" });
        }

        // Xóa user khỏi team
        await Team.findByIdAndUpdate(teamId, {
            $pull: {
                members: userId,
                admins: userId
            }
        });
        
        // Cập nhật lại user, set team của họ thành null
        await User.findByIdAndUpdate(userId, { team: null });

        res.json({ message: "Member removed from the team successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateTeamDetails = async (req, res) => {
    try {
        const { name, description } = req.body;
        const teamId = req.user.team;
        const updaterId = req.user._id.toString();

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // Kiểm tra quyền: Chỉ admin mới được sửa
        if (!team.admins.map(id => id.toString()).includes(updaterId)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        
        const updatedTeam = await Team.findByIdAndUpdate(
            teamId,
            { name, description },
            { new: true, runValidators: true } // new: true để trả về document đã cập nhật
        );

        res.json({ message: "Team details updated successfully", team: updatedTeam });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.body;
        const user = req.user; 

        if (!token) {
            return res.status(400).json({ message: "No invitation token provided" });
        }

        // 1. Tra cứu token trong Redis
        const redisKey = `invite:${token}`;
        const data = await redisClient.get(redisKey); 

        // ----- BẮT ĐẦU DEBUG -----
        console.log("ACCEPT: Chuẩn bị ĐỌC từ Redis. Key:", redisKey);
        try {
            console.log("ACCEPT: Kết quả ĐỌC Redis:", data); // QUAN TRỌNG: Đây phải là chuỗi JSON, không phải 'null'
        } catch (redisError) {
            console.error("ACCEPT: LỖI ĐỌC REDIS!", redisError);
            return res.status(500).json({ message: "Server error: Could not read invitation token." });
        }
        // ----- KẾT THÚC DEBUG -----

        if (!data) {
            return res.status(404).json({ message: "Invitation not found, may have expired" });
        }

        const invitationData = JSON.parse(data);

        // 2. Check Email của user đang đăng nhập có phải là email được mời không?
        if (invitationData.email !== user.email) {
            return res.status(403).json({ 
                message: "Invitation is for another email. Please log in with the invited account." 
            });
        }

        // 3. Kiểm tra xem user đã ở trong team nào chưa
        if (user.team) {
            // Xóa token đi để tránh spam
            // await redisClient.del(redisKey);
            return res.status(400).json({ message: "You are already a member of a team" });
        }

        // 4. Thêm user vào team
        const team = await Team.findById(invitationData.teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        team.members.push(user._id);
        // Thêm vào admin nếu vai trò là 'admin'
        if (invitationData.role === 'admin') {
            team.admins.push(user._id);
        }
        await team.save();

        // 5. Cập nhật team cho User
        await User.findByIdAndUpdate(user._id, { team: team._id });

        // 6. Xóa token khỏi Redis
        await redisClient.del(redisKey);

        res.json({ message: "Successfully joined the team!", team });

    } catch (error) {
        console.error("Error accepting invitation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createTeam,
    getTeamDetails,
    inviteMember,
    removeMember,
    updateTeamDetails,
    acceptInvitation,
};