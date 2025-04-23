const ProductModel = require('../models/productModel');
const { validateProduct } = require('../validation/product');
const Comment = require('../models/commentModel');
const Rating = require('../models/ratingModel');

// Example route to create a new product
const createProduct = async (req, res) => {
  const { error } = validateProduct(req.body);

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details
    });
  }

  try {
    const newProduct = new ProductModel(req.body);
    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (err) {
    res.status(500).json({ message: 'Error saving product', error: err.message });
  }
};

// Route to get all products
const getProducts = async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await ProductModel.find();

    // Return the products in the response
    res.status(200).json({ 
      message: 'Products fetched successfully', 
      products 
    });
  } catch (err) {
    // Handle errors and send a response with status 500
    res.status(500).json({ 
      message: 'Error fetching products', 
      error: err.message 
    });
  }
};

// get product by id
const getProductById = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ 
      message: 'Product details fetched successfully', 
      product 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching product details', 
      error: err.message 
    });
  }
};

// Add a review (rating)
const addReview = async (req, res) => {
  const { productId, userId, stars, text } = req.body;

  //console.log(productId);
  //console.log(userId);
  //console.log(stars);
  //console.log(text);

  if (!productId || !userId || !stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "All fields are required, and 'stars' must be between 1 and 5." });
  }

  try {
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }


    // Add the review
    product.reviews.set(userId, stars, text);

    // Update the star-level count
    if (stars === 1) product.star1++;
    if (stars === 2) product.star2++;
    if (stars === 3) product.star3++;
    if (stars === 4) product.star4++;
    if (stars === 5) product.star5++;

    // Recalculate the average rating
    const totalReviews = product.star1 + product.star2 + product.star3 + product.star4 + product.star5;

    if (totalReviews === 0) {
      product.rating = 0; // Default to 0 if there are no reviews
    } else {
      const totalStars = product.star1 * 1 + product.star2 * 2 + product.star3 * 3 + product.star4 * 4 + product.star5 * 5;
      product.rating = totalStars / totalReviews;
    }

    await product.save();

    res.status(200).json({ message: "Review added successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err.message });
  }
};


const getComments = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.reviews || product.reviews.size === 0) {
      return res.status(200).json({ message: 'No comments found', comments: [] });
    }

    // If reviews is a Map, convert it to an array of values
    const comments = Array.from(product.reviews.values()).map((review) => review.text);

    res.status(200).json({ message: 'Comments fetched successfully', comments });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

const getRelatedProducts = async (req, res) => {
  const { productId } = req.params;

  try {
      // Tìm sản phẩm hiện tại
      const product = await ProductModel.findById(productId);
      if (!product) {
          return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      // Lấy danh sách sản phẩm liên quan dựa trên cùng danh mục
      const relatedProducts = await ProductModel.find({
          category: product.category, // Lọc theo danh mục
          _id: { $ne: productId },    // Loại bỏ sản phẩm hiện tại
      }).limit(10); // Giới hạn 5 sản phẩm liên quan

      res.status(200).json(relatedProducts);
  } catch (error) {
      console.error('Lỗi khi lấy sản phẩm liên quan:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi máy chủ' });
  }
};


module.exports = {createProduct, getProducts, getProductById, addReview, getComments, getRelatedProducts };