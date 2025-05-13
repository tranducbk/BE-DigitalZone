const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../validation/user');

// Xem hồ sơ người dùng
exports.getProfile = async (req, res) => {
    try {
        console.log('Received request to get user profile:', req.user); // Log thông tin người dùng từ token
        const userId = req.user.id || localStorage.getItem('userID'); // ID người dùng từ token
        const user = await User.findById(userId).select('-password'); // Không trả về mật khẩu

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Chỉnh sửa thông tin cá nhân
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { userName, email, phoneNumber, diaChi } = req.body.userData;

        // Kiểm tra dữ liệu địa chỉ
        const { city, district, ward } = diaChi;
        
        // Cập nhật thông tin người dùng
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                userName,
                email,
                phoneNumber,
                diaChi: {
                    city,
                    district,
                    ward
                }
            },
            { new: true } // Trả về đối tượng đã được cập nhật
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }
        const savedUser = await updatedUser.save(); // Lưu lại thay đổi
        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công.',
            user: savedUser
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        // Validate input data
        const { error } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map(detail => detail.message).join(', ')
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect old password' });
        }

        // Băm mật khẩu mới và cập nhật
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Đăng ký người dùng
exports.registerUser = async (req, res) => {

    const { userName, phoneNumber, password, diaChi, email } = req.body;

    try {
        // Kiểm tra xem người dùng đã tồn tại chưa
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            console.log('User with this phone number already exists');
            return res.status(200).json({
                success: false, 
                message: 'Người dùng đã tồn tại!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            userName,
            phoneNumber,
            password: hashedPassword,
            diaChi,
            email
        });

        await newUser.save();
        console.log('User registered successfully');

        // Trả về thông tin người dùng mới đăng ký
        res.status(201).json({ 
            success: true, 
            message: 'Đăng ký thành công!',
            user: {
                id: newUser._id,
                userName: newUser.userName,
                phoneNumber: newUser.phoneNumber,
                diaChi: newUser.diaChi,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ!' 
        });
    }
};

// Đăng nhập người dùng
exports.loginUser = async (req, res) => {
    console.log('Received login request:', req.body);

    // Validate input data
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details.map(detail => detail.message).join(', ') });
    }

    const { phoneNumber, password } = req.body;

    try {
        // Tìm user và lấy đầy đủ thông tin
        const user = await User.findOne({ phoneNumber }).select('+password');
        if (!user) {
            console.log('User not found');
            return res.status(200).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Sai mật khẩu! Vui lòng thử lại');
            return res.status(200).json({ success: false, message: 'Sai mật khẩu! Vui lòng thử lại' });
        }

        // Tạo token với thông tin user
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1002h' });
        
        // Trả về đầy đủ thông tin cần thiết
        res.json({ 
            success: true, 
            token, 
            userName: user.userName, 
            role: user.role, 
            phoneNumber: user.phoneNumber, 
            userID: user._id,
            email: user.email,
            diaChi: user.diaChi
        });
        
        console.log('Đăng nhập thành công! ', user.userName, token);

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ!' });
    }
};

exports.loginGoogle = async (req, res) => {
    const { email, userName } = req.body;
    try {
        // Tìm user theo email
        let user = await User.findOne({ email });

        if (!user) {
            // Nếu chưa có, tạo mới user
            user = new User({
                email,
                userName,
                password: 'google_oauth', // Đảm bảo không rỗng!
                phoneNumber: '',
                diaChi: {
                    city: 'Tỉnh/Thành phố',
                    district: 'Quận/huyện',
                    ward: 'Phường/xã'
                }
            });
            await user.save();
        }

        // Tạo token cho user
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1002h' });

        // Trả về thông tin user và token
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: {
                _id: user._id,
                userName: user.userName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error during Google login:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}