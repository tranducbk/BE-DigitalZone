// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI); // Loại bỏ các tùy chọn không còn cần thiết
        console.log('Kết nối đến MongoDB thành công!');
    } catch (error) {
        console.error('Kết nối đến MongoDB thất bại:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
