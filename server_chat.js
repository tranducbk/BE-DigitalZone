// Import các thư viện cần thiết
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Tạo ứng dụng Express và server HTTP
const app = express();
const server = http.createServer(app);

// Thiết lập socket.io để kết nối với server
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000'], // Địa chỉ client
        methods: ['GET', 'POST'],
    },
});

// Lưu trữ thông tin người dùng
const connectedUsers = {};

// Xử lý kết nối của client
io.on('connection', (socket) => {
    console.log('Một người dùng đã kết nối:', socket.id);

    // Lắng nghe sự kiện thiết lập userId
    socket.on('set_userid', (userId) => {
        connectedUsers[socket.id] = userId; // Lưu userId kèm socket.id
        console.log(`Người dùng kết nối: userId = ${userId}, socketId = ${socket.id}`);
    });

    // Lắng nghe sự kiện gửi tin nhắn từ client
    socket.on('send_message', (data) => {
        const userId = connectedUsers[socket.id]; // Lấy userId từ socket
        console.log(`Tin nhắn từ userId ${userId}:`, data);

        // Phát tin nhắn đến tất cả các client khác (trừ client gửi tin)
        socket.broadcast.emit('receive_message', { userId, message: data.message });
    });

    // Lắng nghe sự kiện ngắt kết nối
    socket.on('disconnect', () => {
        const userId = connectedUsers[socket.id]; // Lấy userId từ socket
        console.log(`Người dùng ngắt kết nối: userId = ${userId}, socketId = ${socket.id}`);
        delete connectedUsers[socket.id]; // Xóa userId khỏi danh sách
    });
});

// Khởi động server trên cổng 5000 hoặc cổng được chỉ định trong biến môi trường
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server chat đang chạy trên cổng ${PORT}`);
});
