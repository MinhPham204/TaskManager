const Task = require("../models/Task");
const User = require("../models/User");
const excelJS = require("exceljs");

// ======================== EXPORT TASKS REPORT ========================
const exportTasksReport = async (req, res) => {
    try {
        const tasks = await Task.find().populate("assignedTo", "email name");

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tasks Report");

        worksheet.columns = [
            { header: "Task ID", key: "_id", width: 25 },
            { header: "Title", key: "title", width: 30 },
            { header: "Description", key: "description", width: 50 },
            { header: "Priority", key: "priority", width: 15 },
            { header: "Status", key: "status", width: 20 },
            { header: "Due Date", key: "dueDate", width: 20 },
            { header: "Assigned To", key: "assignedTo", width: 40 },
        ];

        tasks.forEach((task) => {
            const assignedTo =
                task.assignedTo && task.assignedTo.length > 0
                    ? task.assignedTo.map((user) => `${user.name} (${user.email})`).join(", ")
                    : "Unassigned";

            worksheet.addRow({
                _id: task._id.toString(),
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : "",
                assignedTo,
            });
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="tasks_report.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: "Error exporting tasks", error: error.message });
    }
};

// ======================== EXPORT USERS REPORT ========================
const exportUserReport = async (req, res) => {
    try {
        const users = await User.find().select("name email _id").lean();
        const userTasks = await Task.find().populate("assignedTo", "name email _id");

        // Map user -> task stats
        const userTaskMap = {};
        users.forEach((user) => {
            userTaskMap[user._id] = {
                name: user.name,
                email: user.email,
                taskCount: 0,
                pendingTasks: 0,
                inProgressTasks: 0,
                completedTasks: 0,
            };
        });

        // Count tasks for each user
        userTasks.forEach((task) => {
            if (task.assignedTo && task.assignedTo.length > 0) {
                task.assignedTo.forEach((assignedUser) => {
                    const stats = userTaskMap[assignedUser._id];
                    if (stats) {
                        stats.taskCount += 1;
                        if (task.status === "Pending") stats.pendingTasks += 1;
                        else if (task.status === "In Progress") stats.inProgressTasks += 1;
                        else if (task.status === "Completed") stats.completedTasks += 1;
                    }
                });
            }
        });

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("User Task Report");

        worksheet.columns = [
            { header: "User Name", key: "name", width: 30 },
            { header: "Email", key: "email", width: 40 },
            { header: "Total Assigned Tasks", key: "taskCount", width: 25 },
            { header: "Pending Tasks", key: "pendingTasks", width: 20 },
            { header: "In Progress Tasks", key: "inProgressTasks", width: 20 },
            { header: "Completed Tasks", key: "completedTasks", width: 20 },
        ];

        Object.values(userTaskMap).forEach((user) => {
            worksheet.addRow(user);
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="users_report.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: "Error exporting users", error: error.message });
    }
};

module.exports = { exportTasksReport, exportUserReport };
