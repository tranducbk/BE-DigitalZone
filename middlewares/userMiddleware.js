const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization']; // Lấy header Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Bạn chưa đăng nhập' });
    }

    const token = authHeader.split(' ')[1]; // Lấy phần token sau "Bearer"

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token không hợp lệ!' });
        }

        req.user = decoded; // Gắn thông tin đã giải mã vào request
        next(); // Chuyển tiếp yêu cầu tới controller
    });
};

module.exports = authMiddleware;
