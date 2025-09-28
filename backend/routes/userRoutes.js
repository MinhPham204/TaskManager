const express = require("express");
const {protect, adminOnly} = require("../middlewares/authMiddleware");
const router = express.Router();
const {getUser, getUserById} = require("../controllers/userControllers");

router.get("/", protect, adminOnly, getUser); //Get all users
router.get("/:id", protect, getUserById);

module.exports = router;
