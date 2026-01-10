/**
 * User Model - Thông tin người dùng
 * Roles: student, teacher, school, admin
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // === THÔNG TIN ĐĂNG NHẬP ===
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },

    // === THÔNG TIN CÁ NHÂN ===
    fullname: String,
    email: String,
    phone: String,
    studentClass: String,
    birthday: String,
    gender: String,
    address: String,

    // === THÔNG TIN GIÁO VIÊN ===
    subject: String,
    school: String,
    experience: Number,

    // === VAI TRÒ VÀ QUYỀN HẠN ===
    role: {
        type: String,
        default: 'student',
        enum: ['student', 'teacher', 'school', 'admin']
    },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

    // === TRẠNG THÁI TÀI KHOẢN ===
    approvalStatus: {
        type: String,
        default: 'approved',
        enum: ['pending', 'approved', 'rejected']
    },
    isVip: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    // === METADATA ===
    avatarUrl: String,
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
    settings: mongoose.Schema.Types.ObjectId,
    twoFactorEnabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
