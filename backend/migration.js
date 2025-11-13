const mongoose = require('mongoose');
const User = require('./models/User'); // Đảm bảo đường dẫn này đúng
const Task = require('./models/Task'); // Đảm bảo đường dẫn này đúng
require('dotenv').config(); // Cần thiết nếu bạn lưu chuỗi kết nối DB trong file .env

// ====================================================================
// CHỈNH SỬA DÒNG NÀY
// Dán cái _id của Team bạn vừa copy ở Bước 4.1 vào đây
const DEFAULT_TEAM_ID = '68ecea80953fe5363cabcbd0'; 
// ====================================================================


const migrateData = async () => {
    // Kiểm tra xem ID có hợp lệ không
    if (!DEFAULT_TEAM_ID || DEFAULT_TEAM_ID.length < 24) {
        console.error('LỖI: Vui lòng dán một Team ID hợp lệ vào biến DEFAULT_TEAM_ID.');
        return;
    }
    
    try {
        // 1. Kết nối tới Database
        console.log('Đang kết nối tới database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Kết nối thành công!');

        // 2. Cập nhật tất cả các User chưa có trường 'team'
        console.log('\nBắt đầu cập nhật Users...');
        const userUpdateResult = await User.updateMany(
            { team: { $exists: false } }, // TÌM: tất cả user không có trường 'team'
            { $set: { team: DEFAULT_TEAM_ID } }   // LÀM: đặt trường 'team' bằng ID mặc định
        );
        console.log(`- Đã cập nhật ${userUpdateResult.modifiedCount} users.`);

        // 3. Cập nhật tất cả các Task chưa có trường 'team'
        console.log('Bắt đầu cập nhật Tasks...');
        const taskUpdateResult = await Task.updateMany(
            { team: { $exists: false } }, // TÌM: tất cả task không có trường 'team'
            { $set: { team: DEFAULT_TEAM_ID } }   // LÀM: đặt trường 'team' bằng ID mặc định
        );
        console.log(`- Đã cập nhật ${taskUpdateResult.modifiedCount} tasks.`);

        console.log('\n🎉 Quá trình chuyển đổi dữ liệu đã hoàn tất!');
        process.exit(0); // Thoát script sau khi thành công
    } catch (error) {
        console.error('\n❌ Đã xảy ra lỗi trong quá trình chuyển đổi:', error);
        process.exit(1); // Thoát script với mã lỗi
    }
};

// Chạy hàm chính
migrateData();