const CartModel = require('../models/cartModel');
const ProductModel = require('../models/productModel');

// Thêm sản phẩm vào giỏ hàng
const addProductToCart = async (req, res) => {
    const { productId, variantColor, quantity } = req.body; // Lấy thông tin sản phẩm, biến thể (màu sắc) và số lượng từ yêu cầu
    const userId = req.userId; // Lấy userId từ middleware (được xác thực trước)

    console.log(req.body);

    try {
        // Tìm giỏ hàng của người dùng
        let cart = await CartModel.findOne({ userId });
        if (!cart) {
            // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
            cart = new CartModel({ userId, items: [] });
        }

        // Kiểm tra xem sản phẩm với biến thể đã có trong giỏ hàng chưa
        const existingItemIndex = cart.items.findIndex(
            item =>
                item.productId.toString() === productId && // Kiểm tra productId
                item.variant.color.toString() === variantColor // Kiểm tra nếu biến thể có màu sắc trùng khớp
        );

        if (existingItemIndex !== -1) {
            // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Nếu sản phẩm chưa có, tìm chi tiết sản phẩm và biến thể
            const product = await ProductModel.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            const variant = product.variants.find(v => v.color.toString() === variantColor);
            if (!variant) {
                return res.status(404).json({ message: "Variant not found" });
            }

            // Thêm sản phẩm mới với biến thể vào giỏ hàng
            cart.items.push({
                productId,
                variant,
                quantity,
            });
        }

        // Lưu giỏ hàng đã cập nhật
        await cart.save();
        res.status(200).json({ message: "Product added to cart", cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding product to cart", error: error.message });
    }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateProductQuantity = async (req, res) => {
    const { productId, variantColor, quantity } = req.body;
    const userId = req.userId; // Lấy userId từ middleware

    // console.log(productId, variantColor, quantity);

    try {
        // Tìm giỏ hàng của người dùng
        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(
            item =>
                item.productId.toString() === productId && // Kiểm tra productId
                item.variant.color.toString() === variantColor // Kiểm tra nếu biến thể có màu sắc trùng khớp
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        // Cập nhật số lượng nếu số lượng lớn hơn 0, nếu không xóa sản phẩm khỏi giỏ hàng
        if (quantity > 0) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            cart.items.splice(itemIndex, 1);
        }

        // Lưu giỏ hàng đã cập nhật
        await cart.save();
        res.status(200).json({ message: "Product quantity updated", cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating product quantity", error: error.message });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
const deleteProductFromCart = async (req, res) => {
    const { productId, variantColor } = req.body;
    const userId = req.userId; // Lấy userId từ middleware

    try {
        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            item =>
                item.productId.toString() === productId && // Kiểm tra productId
                item.variant.color.toString() === variantColor // Kiểm tra nếu biến thể có màu sắc trùng khớp
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        // Xóa sản phẩm khỏi giỏ hàng
        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.status(200).json({ message: 'Product removed from cart', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing product from cart', error: error.message });
    }
};

// Lấy giỏ hàng của người dùng
const getCart = async (req, res) => {
    try {
        const userId = req.userId; // Lấy userId từ middleware
        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        res.status(200).json({ message: "Cart fetched successfully", cart });
    } catch (error) {
        res.status(500).json({ message: "Error fetching cart", error: error.message });
    }
};

const removeOrderedItemsFromCart = async (userId, orderedItems) => {
    const cart = await CartModel.findOne({ userId });
    if (!cart) return;

    cart.items = cart.items.filter(item => {
        return !orderedItems.some(ordered =>
            item.productId.toString() === ordered.productId.toString() &&
            item.variant.color.toString() === ordered.variantColor.toString()
        );
    });

    await cart.save();
};

module.exports = {
    addProductToCart,
    updateProductQuantity,
    deleteProductFromCart,
    getCart,
    removeOrderedItemsFromCart
};