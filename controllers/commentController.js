const Comment = require('../models/commentModel');
const Product = require('../models/productModel');

// Add a comment
const addComment = async (req, res) => {
  const { productId, userId, text, rating } = req.body;

  if (!productId || !userId || !text) {
    return res.status(400).json({ message: 'Product ID, User ID, and text are required.' });
  }

  try {
    // 1. Lưu comment mới
    const comment = new Comment({ productId, userId, text, rating });
    await comment.save();

    // 2. Lấy tất cả comment của sản phẩm này
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
    await Product.findByIdAndUpdate(productId, {
      rating: avg,
      star1, star2, star3, star4, star5
    });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Get all comments for a product
const getComments = async (req, res) => {
  const { productId } = req.params;

  try {
    // Lấy comment từ collection Comment
    const comments = await Comment.find({ productId });

    res.status(200).json({ message: 'Comments fetched successfully', comments });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

module.exports = { addComment, getComments };
