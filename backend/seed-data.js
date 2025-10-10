require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("./models/Task"); // đường dẫn đến file bạn đã export Task model

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    console.log("🔍 MONGO_URI:", process.env.MONGO_URI);


    const tasks = [
      {
        title: "Thiết kế giao diện Dashboard",
        description: "Tạo layout chính cho trang Dashboard của hệ thống TaskManager, bao gồm biểu đồ và danh sách công việc.",
        priority: "High",
        status: "In Progress",
        dueDate: new Date("2025-10-15"),
        assignedTo: ["68c46456ea29575aab44b564"],
        createdBy: "68c6ed56b9968d8bb03e28a3",
        attachments: ["https://drive.google.com/file/d/abc123/view"],
        todoCheckList: [
          { text: "Tạo wireframe tổng thể", completed: true },
          { text: "Xây dựng component sidebar", completed: false },
          { text: "Thêm biểu đồ tiến độ", completed: false }
        ],
        progress: 40
      },
      {
        title: "Viết API quản lý công việc",
        description: "Xây dựng REST API cho CRUD task, bao gồm lọc theo trạng thái và độ ưu tiên.",
        priority: "Medium",
        status: "Pending",
        dueDate: new Date("2025-10-20"),
        assignedTo: ["68c6ed56b9968d8bb03e28a3"],
        createdBy: "68c46456ea29575aab44b564",
        attachments: [],
        todoCheckList: [
          { text: "Tạo route /api/tasks", completed: true },
          { text: "Thêm validate dữ liệu", completed: false },
          { text: "Kết nối MongoDB", completed: false }
        ],
        progress: 30
      },
      {
        title: "Kiểm thử hệ thống và viết tài liệu",
        description: "Thực hiện kiểm thử toàn bộ hệ thống TaskManager và ghi lại hướng dẫn sử dụng.",
        priority: "Low",
        status: "Pending",
        dueDate: new Date("2025-10-30"),
        assignedTo: ["68c46456ea29575aab44b564", "68c6ed56b9968d8bb03e28a3"],
        createdBy: "68c6ed56b9968d8bb03e28a3",
        attachments: [],
        todoCheckList: [
          { text: "Viết test case cho API", completed: false },
          { text: "Tạo file hướng dẫn sử dụng", completed: false }
        ],
        progress: 0
      }
    ];

    await Task.insertMany(tasks);
    console.log("🎉 Sample tasks inserted successfully!");
    process.exit();
  })
  .catch((err) => console.error("❌ Error:", err));
