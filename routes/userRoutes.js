const express = require('express');
const { registerUser, loginUser, registerGoogle, loginGoogle, getProfile, updateProfile, changePassword } = require('../controllers/userController');
const authMiddleware = require('../middlewares/userMiddleware');

const router = express.Router();

// Đăng ký người dùng
router.post('/register', registerUser);

// Đăng nhập người dùng
router.post('/login', loginUser);

// Đăng ký bằng Google
router.post('/register-google', registerGoogle);

// Đăng nhập bằng Google
router.post('/login-google', loginGoogle);

// Xem hồ sơ người dùng
router.get('/profile', authMiddleware, getProfile);

// Chỉnh sửa thông tin cá nhân
router.put('/profile', authMiddleware, updateProfile);

// Đổi mật khẩu
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
