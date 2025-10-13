const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
    createTeam,
    getTeamDetails,
    inviteMember,
    removeMember,
    updateTeamDetails,
} = require("../controllers/teamControllers");

router.use(protect);
router.post("/", createTeam);
// Các route thao tác trên team hiện tại của người dùng
router.get("/my-team", getTeamDetails);
router.patch("/my-team", updateTeamDetails);

// Các route quản lý thành viên trong team
router.post("/my-team/invitations", inviteMember);
router.delete("/my-team/members/:userId", removeMember);

module.exports = router;