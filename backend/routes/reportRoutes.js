const express = require("express");
const {protect, adminOnly} = require("../middlewares/authMiddleware");
const {exportTasksReport, exportUserReport} = require("../controllers/reportControllers");
const router = express.Router();

router.get("/export/tasks", protect, adminOnly, exportTasksReport);
router.get("/export/users", protect, adminOnly, exportUserReport);

module.exports = router;