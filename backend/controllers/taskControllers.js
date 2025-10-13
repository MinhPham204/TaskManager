const Task = require("../models/Task");

// Lấy danh sách task
const getTasks = async (req, res) => {
    try {
        const { status } = req.query;
        let baseFilter = { team: req.user.team };

        if (req.user.role === "admin") {
            if (status) baseFilter.status = status;
        } else {
            baseFilter.assignedTo = req.user._id;
            if (status) baseFilter.status = status;
        }

        const tasks = await Task.find(baseFilter)
            .populate("assignedTo", "name email profileImageUrl");

        const allTeamTasks = await Task.find({ team: req.user.team });

        const statusSummary = {
            all: allTeamTasks.length,
            pending: allTeamTasks.filter(t => t.status === 'Pending').length,
            inProgress: allTeamTasks.filter(t => t.status === 'In Progress').length,
            completed: allTeamTasks.filter(t => t.status === 'Completed').length,
        };

        res.json({
            tasks,
            statusSummary,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Lấy task theo id
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, team: req.user.team })
            .populate("assignedTo", "email name profileImageUrl");

        if (!task) return res.status(404).json({ message: "Task not found" });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Tạo task
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoCheckList,
        } = req.body;

        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            team: req.user.team,
            todoCheckList,
            attachments,
        });

        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Cập nhật task
const updateTask = async (req, res) => {
    try {
        const updatedTask = await Task.findOneAndUpdate(
            { _id: req.params.id, team: req.user.team },
            req.body,
            { new: true }
        );

        if (!updatedTask) return res.status(404).json({ message: "Task not found" });
        
        res.json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Xóa task
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, team: req.user.team });

        if (!task) return res.status(404).json({ message: "Task not found" });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Cập nhật trạng thái task
const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, team: req.user.team });
        if (!task) return res.status(404).json({ message: "Task not found" });

        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );

        if (!isAssigned && req.user.role !== "admin")
            return res.status(403).json({ message: "Not authorized" });

        task.status = req.body.status || task.status;

        if (task.status === "Completed") {
            task.todoCheckList.forEach((item) => (item.completed = true));
            task.progress = 100;
        }

        await task.save();
        res.json({ message: "Task status updated", task });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Cập nhật checklist
const updateTaskChecklist = async (req, res) => {
    try {
        const { todoCheckList } = req.body;
        const task = await Task.findOne({ _id: req.params.id, team: req.user.team });

        if (!task) return res.status(404).json({ message: "Task not found" });

        if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin")
            return res.status(403).json({ message: "Not authorized" });

        task.todoCheckList = todoCheckList;

        // Auto update progress
        const completedCount = task.todoCheckList.filter((item) => item.completed).length;
        const totalItems = task.todoCheckList.length;
        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        // Auto update status
        if (task.progress === 100) {
            task.status = "Completed";
        } else if (task.progress > 0) {
            task.status = "In Progress";
        } else {
            task.status = "Pending";
        }

        await task.save();
        const updatedTask = await Task.findById(req.params.id)
            .populate("assignedTo", "email name profileImageUrl");

        res.json({ message: "Task checklist updated", task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Dashboard cho admin
const getDashboardData = async (req, res) => {
    try {
        const teamFilter = { team: req.user.team };

        const totalTasks = await Task.countDocuments(teamFilter);
        const pendingTasks = await Task.countDocuments({ ...teamFilter, status: "Pending" });
        const completedTasks = await Task.countDocuments({ ...teamFilter, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            ...teamFilter,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() },
        });

        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: teamFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] =
                taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: teamFilter },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] =
                taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await Task.find(teamFilter)
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");

        res.status(200).json({
            statistics: { totalTasks, pendingTasks, completedTasks, overdueTasks },
            charts: { taskDistribution, taskPriorityLevels },
            recentTasks,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Dashboard cho user
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const userFilter = { assignedTo: userId, team: req.user.team };

        const totalTasks = await Task.countDocuments(userFilter);
        const pendingTasks = await Task.countDocuments({ ...userFilter, status: "Pending" });
        const completedTasks = await Task.countDocuments({ ...userFilter, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            ...userFilter,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() },
        });

        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: userFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] =
                taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: userFilter },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] =
                taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await Task.find(userFilter)
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");

        res.status(200).json({
            statistics: { totalTasks, pendingTasks, completedTasks, overdueTasks },
            charts: { taskDistribution, taskPriorityLevels },
            recentTasks,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getTaskById,
    getDashboardData,
    getUserDashboardData,
};