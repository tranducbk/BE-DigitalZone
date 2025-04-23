const express = require('express');
const { addProductToCart, updateProductQuantity, deleteProductFromCart, getCart } = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/add', protect, addProductToCart);
router.put('/update', protect, updateProductQuantity);
router.delete('/delete', protect, deleteProductFromCart);
router.get('/', protect, getCart);

module.exports = router;
