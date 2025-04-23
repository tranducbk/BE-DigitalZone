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
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            console.log('User not found');
            return res.status(200).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password');
            return res.status(200).json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1002h' });
        res.json({ success: true, token, userName: user.userName, role: user.role, phoneNumber:user.phoneNumber, userID: user._id });
        console.log('Đăng nhập thành công! ', user.userName, token );

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ!' });
    }
};

exports.registerGoogle = async (req, res) => {
    const { tokenGoogle, userName, email } = req.body;
    console.log('Received Google login request:', req.body);
    try {
        // Kiểm tra xem người dùng đã tồn tại chưa
        let user = await User.findOne({ email });
        if (!user) {
            // Nếu người dùng chưa tồn tại, tạo người dùng mới
            user = new User({
                email,
                userName,
                password: tokenGoogle,
                phoneNumber: '',
                diaChi: {
                    city: 'Tỉnh/Thành phố',
                    district: 'Quận/huyện',
                    ward: 'Phường/xã'
                }
            });
            console.log(user);
            
            
            // Lưu người dùng vào cơ sở dữ liệu
            await user.save();
        }
        else {
            return res.status(200).json({
                success: false, 
                message: 'Người dùng đã tồn tại!'
            });
        }
        // Trả về thông tin người dùng và token
        res.status(200).json({
            success: true,
            message: 'Đăng kí thành công! Đang chuyển hướng sang đăng nhập',
            user  // Trả về thông tin người dùng
        });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

exports.loginGoogle = async (req, res) => {
    const { tokenGoogle, email } = req.body;
    console.log('Received Google login request:', req.body);
    try {
        // Kiểm tra xem người dùng đã tồn tại chưa
        let user = await User.findOne({ email });
        console.log('User found:', user);
        if (!user) {
            console.log('User not found');
            return res.status(200).json({ success: false, message: 'User not found' });
        }

        if (!tokenGoogle) {
            console.log('Invalid password');
            return res.status(200).json({ success: false, message: 'Invalid password' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1002h' });
        console.log('Đăng nhập thành công! ', user.userName, token );
        
        // Trả về thông tin người dùng và token
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,  // Trả về token
            user,  // Trả về thông tin người dùng
        });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }

}