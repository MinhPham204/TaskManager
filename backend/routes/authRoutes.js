const express = require("express");
const router = express.Router();
const {registerUser, verifyOtp, setPasswordUser, loginUser, getUserProfile, updateUserProfile, changePassword, forgotPassword, resetPassword} = require("../controllers/authControllers");
const {protect, adminOnly} = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
// Auth Routes
router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/set-password", setPasswordUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


router.post("/upload-image", upload.single("image"), (req, res) => {
    if(!req.file){
        return res.status(400).json({message: "No file uploaded"});
    }
    const imageUrl = `${req.protocol}://${req.get("host")}//uploads${req.file.filename}`;
    res.status(200).json({imageUrl});
});


module.exports = router;