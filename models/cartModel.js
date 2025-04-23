const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.Mixed, required: true },
    quantity: { type: Number, required: true, default: 1 },
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

const CartModel = mongoose.model('Cart', cartSchema, 'carts');

module.exports = CartModel;
