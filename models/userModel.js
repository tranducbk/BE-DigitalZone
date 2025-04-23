const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    phoneNumber: { type: String }, // Đảm bảo số điện thoại là duy nhất
    password: { type: String, required: true },
    diaChi: { type: {
        city: { type: String, required: true },
        district: { type: String, required: true },
        ward: { type: String, required: true },
    }, required: true },
    email: { type: String },
    role: { type: String, default: "user" }
}, {
    timestamps: true, versionKey :false
});

module.exports = mongoose.model('User', userSchema, 'Users');
