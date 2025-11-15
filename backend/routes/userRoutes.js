const express = require("express");
const {protect, adminOnly} = require("../middlewares/authMiddleware");
const router = express.Router();
const {getUser, getUserById, deleteUser, searchUsers} = require("../controllers/userControllers");

router.get("/", protect, getUser); //Get all users
router.get("/search", protect, searchUsers); // always above router getById
router.get("/:id", protect, getUserById);
router.delete("/", protect, adminOnly, deleteUser);

module.exports = router;
