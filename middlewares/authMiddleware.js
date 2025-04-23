const User = require('../models/userModel'); 
const jwt = require('jsonwebtoken'); 


// Middleware xác thực người dùng
const protect = async (req, res, next) => {
    let token;

    // Kiểm tra xem token có tồn tại trong header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token và lấy userId
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded JWT: ", decoded); // In ra thông tin đã giải mã để kiểm tra
            
            
            req.userId = decoded.id;
            
            next(); // Nếu thành công, tiếp tục với request

        } catch (error) {
            console.error("JWT Verify Error: ", error); 
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};


// Middleware kiểm tra quyền admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'admin') {
            console.log('User is not an admin');
            return res.status(403).json({ message: 'Forbidden: Only admins can access this resource' });
        }
        console.log('User is admin');
        next();
    } catch (error) {
        console.error('Error during admin check:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = { protect, isAdmin };