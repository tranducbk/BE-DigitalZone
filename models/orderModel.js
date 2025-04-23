const mongoose = require('mongoose');
 
// Schema cho sản phẩm trong đơn hàng
const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.Mixed, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true } // Giá tại thời điểm đặt hàng
});
 
// Schema cho đơn hàng
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Credit Card', 'PayPal', 'Cash on Delivery'], required: true },
    orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' }
},{
    timestamps: true, 
    versionKey: false 
});
 
const OrderModel = mongoose.model('Order', orderSchema, 'Orders');
 
module.exports = OrderModel;