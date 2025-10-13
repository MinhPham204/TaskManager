const Team = require('../models/Team');
const User = require('../models/User');

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
        const { email, role } = req.body;
        const teamId = req.user.team;
        const inviterId = req.user._id.toString();

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // Kiểm tra quyền: Chỉ admin của team mới được mời
        if (!team.admins.map(id => id.toString()).includes(inviterId)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        // Kiểm tra xem email đã được mời hoặc đã là thành viên chưa
        const isAlreadyInvited = team.pendingInvitations.some(inv => inv.email === email);
        if (isAlreadyInvited) {
            return res.status(400).json({ message: "This email has already been invited" });
        }
        const userExists = await User.findOne({ email });
        if (userExists && team.members.includes(userExists._id)) {
            return res.status(400).json({ message: "This user is already a member of the team" });
        }
        
        team.pendingInvitations.push({ email, role });
        await team.save();

        //  tích hợp dịch vụ gửi email để gửi lời mời (chưa phát triển)

        res.json({ message: `Invitation sent to ${email}` });
    } catch (error) {
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

module.exports = {
    createTeam,
    getTeamDetails,
    inviteMember,
    removeMember,
    updateTeamDetails,
};