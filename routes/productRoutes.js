const express = require('express');
const { getProducts, getProductById, addReview, getComments, getRelatedProducts } = require('../controllers/productController');

const router = express.Router();
    
router.get('/', getProducts);

router.get('/:productId', getProductById);

router.post('/:productId/review', addReview);

router.get('/:productId/comments', getComments);

// API lấy sản phẩm liên quan
router.get('/:productId/related', getRelatedProducts);

module.exports = router;