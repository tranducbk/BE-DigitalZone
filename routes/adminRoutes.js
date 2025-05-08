const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware'); 
const {
  getAdminDashboard,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  manageUsers,
  manageProducts,
  deleteUser,
  createProduct,
  deleteProduct,
  updateProduct,
  getAllOrders,
  updateOrderStatus,
  getUserById,
  updateUser
} = require('../controllers/adminController');

// Lấy thông tin tổng quan admin
router.get('/', protect, isAdmin, getAdminDashboard);

// Lấy thông tin admin
router.get('/profile', protect, isAdmin, getAdminProfile);

// Cập nhật thông tin admin
router.put('/profile', protect, isAdmin, updateAdminProfile);

// Đổi mật khẩu admin
router.patch('/change-password', protect, isAdmin, changeAdminPassword);

// Quản lý người dùng
router.get('/users', protect, isAdmin, manageUsers);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.get('/users/:id', protect, isAdmin, getUserById);
router.put('/users/:id', protect, isAdmin, updateUser);

// Quản lý sản phẩm
router.get('/products', protect, isAdmin, manageProducts);
router.post('/products', protect, isAdmin, createProduct);
router.delete('/products/:id', protect, isAdmin, deleteProduct);
router.patch('/products/:id', protect, isAdmin, updateProduct);

//Quản lý đơn hàng
router.get('/order', protect, isAdmin, getAllOrders);
router.put('/order/update-status', protect, isAdmin, updateOrderStatus);

module.exports = router;
