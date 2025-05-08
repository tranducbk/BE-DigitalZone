const express = require('express');
const { 
  getProducts, 
  getProductById, 
  addReview, 
  getComments, 
  getRelatedProducts, 
  getAllCategories,
  getAllBrands,
  addBrand,
  updateBrand,
  deleteBrand,
  addCategory,
  updateCategory,
  deleteCategory 
} = require('../controllers/productController');

const router = express.Router();
    
router.get('/', getProducts);

// Routes cho categories
router.get('/categories', getAllCategories);
router.post('/categories', addCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Routes cho brands
router.get('/brands', getAllBrands);
router.post('/brands', addBrand);
router.put('/brands/:brandId', updateBrand);
router.delete('/brands/:brandId', deleteBrand);

router.get('/:productId', getProductById);

router.post('/:productId/review', addReview);

router.get('/:productId/comments', getComments);

// API lấy sản phẩm liên quan
router.get('/:productId/related', getRelatedProducts);

module.exports = router;