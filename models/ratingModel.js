const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
