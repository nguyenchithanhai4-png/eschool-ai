/**
 * School Model - Thông tin trường học
 */
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    // === THÔNG TIN CƠ BẢN ===
    name: { type: String, required: true },
    address: String,
    phone: String,
    email: String,
    schoolCode: { type: String, required: true, unique: true },

    // === QUẢN TRỊ ===
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    logo: String,
    description: String,

    // === TRẠNG THÁI ===
    isActive: { type: Boolean, default: false },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'active', 'rejected']
    },

    // === ĐỊA CHỈ CHI TIẾT ===
    provinceCode: String,
    provinceName: String,
    districtCode: String,
    districtName: String,
    wardName: String,
    schoolLevel: String,

    // === NGƯỜI QUẢN LÝ ===
    managerName: String,
    managerPhone: String,

    // === TÀI LIỆU XÁC THỰC ===
    docs: [{
        type: { type: String, enum: ['cccdFront', 'cccdBack', 'schoolDoc'] },
        path: String,
        originalName: String
    }]
}, { timestamps: true });

// System Settings Schema
const systemSettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = {
    SchoolModel: mongoose.model('School', schoolSchema),
    SystemSettings: mongoose.model('SystemSettings', systemSettingsSchema)
};
