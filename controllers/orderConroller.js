const { log } = require('console');
const OrderModel = require('../models/orderModel');
const ProductModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const { removeOrderedItemsFromCart } = require('./cartController');
const crypto = require('crypto');

function sortObject(obj) {
    console.log('=== SẮP XẾP PARAMS ===');
    console.log('Params trước khi sắp xếp:', obj);
    
    const sorted = {};
    const keys = Object.keys(obj).sort();
    console.log('Danh sách keys đã sắp xếp:', keys);
    
    for (let key of keys) {
        if (obj[key] !== null && obj[key] !== undefined) {
            sorted[key] = obj[key];
            console.log(`Thêm key ${key} với giá trị ${obj[key]}`);
        }
    }
    
    console.log('Params sau khi sắp xếp:', sorted);
    return sorted;
}

// Tạo đơn hàng mới
const createOrder = async (req, res) => {
  const { userId, items, paymentMethod, paymentStatus } = req.body;

  console.log(req.body);

  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let totalAmount = 0;

    // Kiểm tra và tính toán giá trị của các sản phẩm trong đơn hàng
    
    for (const item of items) {
      // Tìm sản phẩm trong database
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }

      // Tìm biến thể sản phẩm dựa trên màu sắc
      let variantFound = false;
      for (const variant of product.variants) {
        if (variant.color === item.variant.color) {
          variantFound = true;

          // Kiểm tra số lượng sản phẩm còn lại trong kho
          if (variant.quantity < item.quantity) {
            return res.status(400).json({ message: `Not enough stock for ${item.variant.color} variant of ${product.name}` });
          }
          // Tính giá bán sau giảm giá của biến thể
          const priceAfterDiscount = product.price - (product.price * (variant.sale / 100));

          // Tính tổng giá trị đơn hàng (dựa trên giá và số lượng của biến thể)
          totalAmount += item.quantity * priceAfterDiscount; 
          break; 
        }
      }
      // Nếu không tìm thấy biến thể phù hợp
      if (!variantFound) {
        return res.status(400).json({ message: `Variant with color ${item.variant.color} not found for product ${product.name}` });
      }
    }

    // Kiểm tra tổng tiền hợp lệ
    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Total amount is invalid" });
    }

    // Tạo đơn hàng
    const newOrder = new OrderModel({
      userId,
      items,
      totalAmount,
      paymentMethod,
      orderStatus: 'Processing', // Đơn hàng đang được xử lý
      paymentStatus,  // Trạng thái thanh toán là đang chờ xử lý
    });

    await newOrder.save();

    // Giảm số lượng sản phẩm trong kho
    for (const item of items) {
      // Tìm sản phẩm trong database
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }
    
      // Tìm biến thể sản phẩm dựa trên màu sắc
      const variant = product.variants.find(variant => variant.color === item.variant.color);
      if (variant) {
        // Kiểm tra số lượng biến thể còn lại trong kho
        if (variant.quantity < item.quantity) {
          return res.status(400).json({ message: `Not enough stock for ${item.variant.color} variant of ${product.name}` });
        }
    
        // Giảm số lượng của biến thể
        variant.quantity -= item.quantity;

        // Lưu thay đổi vào cơ sở dữ liệu
        await product.save();
      } else {
        return res.status(400).json({ message: `Variant with color ${item.variant.color} not found for product ${product.name}` });
      }
    } 
    
    await removeOrderedItemsFromCart(userId, items.map(i => ({
        productId: i.productId,
        variantColor: i.variant.color
    })));

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Lấy danh sách đơn hàng của người dùng
const getOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await OrderModel.find({ userId }).populate('items.productId', 'name price').populate('userId', 'name email');
    
    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
  const { orderId, newStatus } = req.body;
  if (!orderId || orderId.length !== 24) {
    return res.status(400).json({ message: 'orderId không hợp lệ' });
  }
  try {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    order.orderStatus = newStatus;
    await order.save();
    res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công', order });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng', error: error.message });
  }
};

// Xóa đơn hàng
const deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};

// Hủy đơn hàng
const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id; // Lấy `id` từ thông tin giải mã trong token

  try {
    // Tìm đơn hàng theo ID và kiểm tra người dùng sở hữu đơn hàng
    const order = await OrderModel.findById(orderId).populate('items.productId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });
    }

    // Kiểm tra nếu người dùng yêu cầu hủy đơn hàng không phải là chủ sở hữu
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    // Kiểm tra trạng thái đơn hàng (chỉ cho phép hủy nếu chưa giao hàng)
    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng đã được giao.' });
    }

    // Hoàn lại số lượng sản phẩm vào kho
    for (const item of order.items) {
      const product = await ProductModel.findById(item.productId._id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.productId._id} not found` });
      }

      // Tìm biến thể sản phẩm dựa trên màu sắc
      const variant = product.variants.find(variant => variant.color === item.variant.color);
      if (variant) {
        // Thêm số lượng sản phẩm vào kho
        variant.quantity += item.quantity;

        // Lưu thay đổi vào cơ sở dữ liệu
        await product.save();
      } else {
        return res.status(404).json({ success: false, message: `Variant with color ${item.variant.color} not found for product ${product.name}` });
      }
    }

    // Cập nhật trạng thái đơn hàng thành "Cancelled"
    order.orderStatus = 'Cancelled';
    await order.save();

    res.status(200).json({ success: true, message: 'Đơn hàng đã được hủy thành công và số lượng sản phẩm đã được hoàn lại vào kho.' });
  } catch (error) {
    console.error('Lỗi hủy đơn hàng:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi hủy đơn hàng.' });
  }
};

// Thanh toán VNPAY
const vnpayPayment = async (req, res) => {
  const { amount, bankCode, language } = req.body;

  try {
    // Tạo ngày thanh toán
    let date = new Date();
    let createDate = date.getFullYear().toString() + 
      ("0" + (date.getMonth() + 1)).slice(-2).toString() + 
      ("0" + date.getDate()).slice(-2).toString() + 
      ("0" + date.getHours()).slice(-2).toString() + 
      ("0" + date.getMinutes()).slice(-2).toString() + 
      ("0" + date.getSeconds()).slice(-2).toString();

    // Tạo mã đơn hàng ngẫu nhiên
    let orderId = ("0" + date.getHours()).slice(-2).toString() + 
      ("0" + date.getMinutes()).slice(-2).toString() + 
      ("0" + date.getSeconds()).slice(-2).toString() +
      Math.floor(Math.random() * 1000000).toString();

    // Cấu hình VNPAY
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: process.env.VNP_TMN_CODE,
      vnp_Locale: language || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: 'Thanh toan don hang: ' + orderId,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // Nhân 100 vì VNPAY yêu cầu số tiền nhỏ nhất là 100 đồng
      vnp_ReturnUrl: `${process.env.BASE_URL}/orders/vnpay-return`,
      vnp_IpAddr: req.ip,
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    // Xóa trường vnp_SecureHash và vnp_SecureHashType nếu có
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp key theo alphabet
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi query
    const signData = Object.entries(vnp_Params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Tạo hash
    const secureHash = crypto
      .createHmac('sha512', process.env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    vnp_Params.vnp_SecureHash = secureHash;

    // Log để debug
    console.log('=== THÔNG TIN THANH TOÁN VNPAY ===');
    console.log('Amount gốc:', amount);
    console.log('Amount sau khi nhân 100:', amount * 100);
    console.log('Chuỗi dữ liệu ký:', signData);
    console.log('Chữ ký:', secureHash);

    // Tạo URL thanh toán
    const vnpUrl = process.env.VNP_URL + '?' + 
      Object.keys(vnp_Params)
        .map(key => `${key}=${vnp_Params[key]}`)
        .join('&');

    res.status(200).json({ paymentUrl: vnpUrl });
  } catch (error) {
    console.error('Lỗi tạo URL thanh toán VNPAY:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi tạo URL thanh toán VNPAY'
    });
  }
};

// Xử lý kết quả trả về từ VNPAY
const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa các tham số không cần thiết
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp các tham số theo alphabet
    const sortedParams = sortObject(vnp_Params);

    // Tạo chuỗi query
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Tạo hash
    const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Log để debug
    console.log('Dữ liệu ký:', signData);
    console.log('Chữ ký nhận được:', secureHash);
    console.log('Chữ ký tính toán:', signed);
    console.log('Secret key:', process.env.VNP_HASH_SECRET);
    console.log('Tất cả params:', vnp_Params);

    // Kiểm tra tính hợp lệ của dữ liệu
    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const rspCode = vnp_Params['vnp_ResponseCode'];

      // Kiểm tra kết quả giao dịch
      if (rspCode === '00') {
        // Thanh toán thành công
        // Cập nhật trạng thái đơn hàng
        const order = await OrderModel.findOne({ _id: orderId });
        if (order) {
          order.paymentStatus = 'Paid';
          await order.save();
        }
        
        // Chuyển hướng đến trang thông báo thành công
        res.redirect('/checkout?status=success');
      } else {
        // Thanh toán thất bại
        res.redirect('/checkout?status=failed');
      }
    } else {
      console.log('Chữ ký không hợp lệ');
      // Dữ liệu không hợp lệ
      res.redirect('/checkout?status=invalid');
    }
  } catch (error) {
    console.error('Lỗi xử lý kết quả VNPAY:', error);
    res.redirect('/checkout?status=error');
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
  vnpayPayment,
  vnpayReturn
};