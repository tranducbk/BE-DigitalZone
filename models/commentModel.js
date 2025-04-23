const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    rating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
