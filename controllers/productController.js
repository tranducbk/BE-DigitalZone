const ProductModel = require('../models/productModel');
const { validateProduct } = require('../validation/product');
const Comment = require('../models/commentModel');
const Rating = require('../models/ratingModel');
const { log } = require('console');

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

const addReview = async (req, res) => {
  const { productId, userId, rating, text } = req.body;

  if (!productId || !userId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "All fields are required, and 'rating' must be between 1 and 5." });
  }

  try {
    // 1. Lưu review mới
    await Comment.create({ productId, userId, rating, text });

    // 2. Lấy tất cả review của sản phẩm này
    const comments = await Comment.find({ productId });

    // 3. Tính lại số lượng từng mức sao và rating trung bình
    let star1 = 0, star2 = 0, star3 = 0, star4 = 0, star5 = 0, sum = 0;
    comments.forEach(c => {
      sum += c.rating;
      if (c.rating === 1) star1++;
      if (c.rating === 2) star2++;
      if (c.rating === 3) star3++;
      if (c.rating === 4) star4++;
      if (c.rating === 5) star5++;
    });
    const avg = comments.length > 0 ? (sum / comments.length) : 0;

    // 4. Cập nhật lại sản phẩm
    await ProductModel.findByIdAndUpdate(productId, {
      rating: avg,
      star1, star2, star3, star4, star5
    });

    res.status(200).json({ message: "Review added successfully" });
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

// Lấy tất cả loại sản phẩm (category)
const getAllCategories = async (req, res) => {
  try {
    const products = await ProductModel.find({}, 'category');
    const categories = await ProductModel.distinct('category');

    // Lọc bỏ các giá trị null, undefined hoặc chuỗi rỗng
    const validCategories = categories.filter(category => {
      const isValid = category && category.trim() !== '';
      return isValid;
    });
    // Sắp xếp danh mục theo thứ tự alphabet
    const sortedCategories = validCategories.sort();
    // Kiểm tra xem đã lấy danh sách category chưa
    if (sortedCategories.length === 0) {
      return res.status(404).json({
        message: 'Không có danh mục nào được tìm thấy'
      });
    }

    res.status(200).json({ 
      message: 'Danh sách loại sản phẩm được lấy thành công',
      categories: sortedCategories
    });
  } catch (error) {
    console.error('Lỗi chi tiết khi lấy danh sách loại sản phẩm:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách loại sản phẩm',
      error: error.message 
    });
  }
};

// Lấy tất cả thương hiệu (brands)
const getAllBrands = async (req, res) => {
  try {
    
    // Lấy tất cả sản phẩm để kiểm tra cấu trúc dữ liệu
    const products = await ProductModel.find({}, 'brand');
    // Lấy danh sách các brand duy nhất
    const brands = await ProductModel.aggregate([
      { $group: { _id: "$brand.name", image: { $first: "$brand.image" } } },
      { $project: { _id: 0, name: "$_id", image: 1 } },
      { $sort: { name: 1 } }
    ]);

    // Kiểm tra xem đã lấy danh sách brand chưa
    if (brands.length === 0) {
      console.log('Không tìm thấy thương hiệu nào');
      return res.status(404).json({
        message: 'Không có thương hiệu nào được tìm thấy'
      });
    }

    res.status(200).json({ 
      message: 'Danh sách thương hiệu được lấy thành công',
      brands: brands
    });
  } catch (error) {
    console.error('Lỗi chi tiết khi lấy danh sách thương hiệu:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách thương hiệu',
      error: error.message 
    });
  }
};

// Thêm thương hiệu mới
const addBrand = async (req, res) => {
  const { brandName, logoUrl } = req.body;

  if (!brandName) {
    return res.status(400).json({
      message: 'Tên thương hiệu là bắt buộc'
    });
  }

  try {
    // Kiểm tra xem brand đã tồn tại chưa
    const existingBrand = await ProductModel.findOne({ brand: brandName });
    if (existingBrand) {
      return res.status(400).json({
        message: 'Thương hiệu này đã tồn tại'
      });
    }

    // Tạo một sản phẩm mẫu với brand mới
    const newProduct = new ProductModel({
      brand: brandName,
      name: 'Mẫu sản phẩm',
      price: 0,
      description: 'Sản phẩm mẫu cho thương hiệu mới',
      category: 'Chưa phân loại',
      imageUrl: logoUrl || ''
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Thêm thương hiệu mới thành công',
      brand: {
        brandId: newProduct._id,
        brandName: brandName,
        logoUrl: logoUrl
      }
    });
  } catch (error) {
    console.error('Lỗi khi thêm thương hiệu mới:', error);
    res.status(500).json({
      message: 'Lỗi khi thêm thương hiệu mới',
      error: error.message
    });
  }
};

// Cập nhật thương hiệu
const updateBrand = async (req, res) => {
  const { brandId } = req.params;
  const { brandName, logoUrl } = req.body;

  if (!brandName) {
    return res.status(400).json({
      message: 'Tên thương hiệu là bắt buộc'
    });
  }

  try {
    const product = await ProductModel.findById(brandId);
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy thương hiệu'
      });
    }

    // Kiểm tra xem tên mới có bị trùng không
    if (brandName !== product.brand) {
      const existingBrand = await ProductModel.findOne({ brand: brandName });
      if (existingBrand) {
        return res.status(400).json({
          message: 'Tên thương hiệu này đã tồn tại'
        });
      }
    }

    product.brand = brandName;
    if (logoUrl) {
      product.imageUrl = logoUrl;
    }

    await product.save();

    res.status(200).json({
      message: 'Cập nhật thương hiệu thành công',
      brand: {
        brandId: product._id,
        brandName: product.brand,
        logoUrl: product.imageUrl
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thương hiệu:', error);
    res.status(500).json({
      message: 'Lỗi khi cập nhật thương hiệu',
      error: error.message
    });
  }
};

// Xóa thương hiệu
const deleteBrand = async (req, res) => {
  const { brandId } = req.params;

  try {
    const product = await ProductModel.findById(brandId);
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy thương hiệu'
      });
    }

    await ProductModel.deleteOne({ _id: brandId });

    res.status(200).json({
      message: 'Xóa thương hiệu thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa thương hiệu:', error);
    res.status(500).json({
      message: 'Lỗi khi xóa thương hiệu',
      error: error.message
    });
  }
};

// Thêm danh mục mới
const addCategory = async (req, res) => {
  const { categoryName, imageUrl, description } = req.body;

  if (!categoryName) {
    return res.status(400).json({
      message: 'Tên danh mục là bắt buộc'
    });
  }

  try {
    // Kiểm tra xem category đã tồn tại chưa
    const existingCategory = await ProductModel.findOne({ category: categoryName });
    if (existingCategory) {
      return res.status(400).json({
        message: 'Danh mục này đã tồn tại'
      });
    }

    // Tạo một sản phẩm mẫu với category mới
    const newProduct = new ProductModel({
      category: categoryName,
      name: 'Mẫu sản phẩm',
      price: 0,
      description: description || 'Sản phẩm mẫu cho danh mục mới',
      brand: 'Chưa phân loại',
      imageUrl: imageUrl || ''
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Thêm danh mục mới thành công',
      category: {
        categoryId: newProduct._id,
        categoryName: categoryName,
        imageUrl: imageUrl,
        description: description
      }
    });
  } catch (error) {
    console.error('Lỗi khi thêm danh mục mới:', error);
    res.status(500).json({
      message: 'Lỗi khi thêm danh mục mới',
      error: error.message
    });
  }
};

// Cập nhật danh mục
const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { categoryName, imageUrl, description } = req.body;

  if (!categoryName) {
    return res.status(400).json({
      message: 'Tên danh mục là bắt buộc'
    });
  }

  try {
    const product = await ProductModel.findById(categoryId);
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy danh mục'
      });
    }

    // Kiểm tra xem tên mới có bị trùng không
    if (categoryName !== product.category) {
      const existingCategory = await ProductModel.findOne({ category: categoryName });
      if (existingCategory) {
        return res.status(400).json({
          message: 'Tên danh mục này đã tồn tại'
        });
      }
    }

    product.category = categoryName;
    if (imageUrl) {
      product.imageUrl = imageUrl;
    }
    if (description) {
      product.description = description;
    }

    await product.save();

    res.status(200).json({
      message: 'Cập nhật danh mục thành công',
      category: {
        categoryId: product._id,
        categoryName: product.category,
        imageUrl: product.imageUrl,
        description: product.description
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật danh mục:', error);
    res.status(500).json({
      message: 'Lỗi khi cập nhật danh mục',
      error: error.message
    });
  }
};

// Xóa danh mục
const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const product = await ProductModel.findById(categoryId);
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy danh mục'
      });
    }

    await ProductModel.deleteOne({ _id: categoryId });

    res.status(200).json({
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    res.status(500).json({
      message: 'Lỗi khi xóa danh mục',
      error: error.message
    });
  }
};

module.exports = {
  createProduct, 
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
};