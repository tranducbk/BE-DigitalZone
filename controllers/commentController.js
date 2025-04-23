const Comment = require('../models/commentModel');
const Product = require('../models/productModel');

// Add a comment
const addComment = async (req, res) => {
  const { productId, userId, text, rating } = req.body;

  if (!productId || !userId || !text) {
    return res.status(400).json({ message: 'Product ID, User ID, and text are required.' });
  }

  try {
    const comment = new Comment({ productId, userId, text, rating});
    await comment.save();
    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Get all comments for a product
const getComments = async (req, res) => {
  const { productId } = req.params;

  try {
    const comments = await Comment.find({ productId }).populate('userId', 'name email');

    if (!comments.length) {
      return res.status(404).json({ message: 'No comments found for this product' });
    }

    res.status(200).json({ message: 'Comments fetched successfully', comments });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

module.exports = { addComment, getComments };
