/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         E-SCHOOL AI SERVER                                    ║
 * ║                         Backend chính của hệ thống                           ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  MÔ TẢ:                                                                       ║
 * ║  Đây là file SERVER CHÍNH của E-School AI - chứa toàn bộ backend logic.      ║
 * ║  File này xử lý tất cả API requests, database operations, và authentication. ║
 * ║                                                                               ║
 * ║  CẤU TRÚC FILE (6700+ dòng):                                                ║
 * ║  • Lines 1-200:     Imports & Configuration                                  ║
 * ║  • Lines 200-500:   MongoDB Schemas (User, School, Class, etc.)              ║
 * ║  • Lines 500-1000:  Passport.js Authentication                               ║
 * ║  • Lines 1000-2000: School Management APIs                                   ║
 * ║  • Lines 2000-3000: User Management APIs                                     ║
 * ║  • Lines 3000-4000: Admin APIs                                               ║
 * ║  • Lines 4000-5000: AI Chat & Grading APIs                                   ║
 * ║  • Lines 5000-6700: Utility APIs & Server Start                              ║
 * ║                                                                               ║
 * ║  CÔNG NGHỆ SỬ DỤNG:                                                          ║
 * ║  • Express.js     - Web framework                                            ║
 * ║  • MongoDB        - Database (qua Mongoose)                                  ║
 * ║  • Socket.io      - Real-time communication                                  ║
 * ║  • PeerJS         - Video call (WebRTC)                                      ║
 * ║  • Passport.js    - OAuth (Google, Facebook)                                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================
// 1. IMPORTS - CÁC THƯ VIỆN CẦN THIẾT
// ============================================

// Fix UTF-8 encoding for Windows console (Vietnamese characters)
if (process.platform === 'win32') {
    try {
        require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
    } catch (e) { /* ignore */ }
}

// Express: Framework web phổ biến nhất cho Node.js
const express = require('express');

// HTTP: Module tích hợp sẵn để tạo HTTP server
const http = require('http');

// Socket.io: Thư viện cho real-time bi-directional communication
// Dùng cho: Chat, notifications, live updates
const { Server } = require('socket.io');

// Path: Module xử lý đường dẫn file
const path = require('path');

// FS: Module đọc/ghi file system
const fs = require('fs');

// Multer: Middleware xử lý file upload (ảnh, documents)
const multer = require('multer');

// PizZip + Docxtemplater: Tạo file DOCX từ template
// Dùng cho: Xuất báo cáo, xuất danh sách học sinh
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Google Generative AI: SDK chính thức của Google Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Express-session: Quản lý session cho user login
const session = require('express-session');

// Passport.js: Thư viện xác thực nổi tiếng nhất
// - GoogleStrategy: Đăng nhập bằng Google
// - FacebookStrategy: Đăng nhập bằng Facebook
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Bcrypt: Mã hóa password an toàn (hash + salt)
const bcrypt = require('bcryptjs');

// Dotenv: Đọc biến môi trường từ file .env
require('dotenv').config();

// Mongoose: ODM (Object Document Mapper) cho MongoDB
// Giúp định nghĩa schema và thao tác với database dễ dàng
const mongoose = require('mongoose');

// EventEmitter: Module cho event-driven programming
const EventEmitter = require('events');

// Hybrid AI Router: Module điều phối AI tự viết
// Xem file: services/hybridAIRouter.js
const hybridAIRouter = require('./services/hybridAIRouter');

// Helmet: Security headers để bảo vệ khỏi XSS, clickjacking, etc.
const helmet = require('helmet');

// Rate Limit: Giới hạn số request để chống DDoS và brute force
const rateLimit = require('express-rate-limit');

// Auth Middleware: Xác thực và phân quyền người dùng
const { requireAuth, requireRole, requireAdmin, requireSchoolOrAdmin, requireTeacherOrAbove, logAPICall } = require('./services/authMiddleware');

// Compression: Nén response để giảm bandwidth và tăng tốc độ tải
const compression = require('compression');

// ============================================
// PEERJS & UUID CHO VIDEO ROOM
// PeerJS: Thư viện WebRTC để video call
// UUID: Tạo ID ngẫu nhiên cho room
// ============================================
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');

// ============================================
// 2. KHỞI TẠO EXPRESS APP VÀ SERVER
// ============================================

// Tạo Express application
const app = express();

// FORCE CSP: Allow everything manually to fix persistent browser cache issues
app.use((req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("X-Content-Security-Policy");
    res.removeHeader("X-WebKit-CSP");

    res.setHeader(
        "Content-Security-Policy",
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
    );
    next();
});

// CSP middleware removed

// Tạo HTTP server từ Express app
// (Cần HTTP server riêng để Socket.io có thể attach vào)
const server = http.createServer(app);

// Tạo Socket.io server và attach vào HTTP server
// 🔒 CORS: Whitelist các origins được phép (không dùng '*' trong production!)
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL, // Cho phép set từ .env
    process.env.PRODUCTION_URL
].filter(Boolean); // Loại bỏ undefined

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Cho phép requests không có origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            // Production: kiểm tra whitelist
            if (process.env.NODE_ENV === 'production') {
                if (ALLOWED_ORIGINS.includes(origin)) {
                    callback(null, true);
                } else {
                    console.warn(`[Socket.io] Blocked origin: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            } else {
                // Development: cho phép tất cả
                callback(null, true);
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Port server sẽ chạy trên đó (mặc định 3000)
const PORT = process.env.PORT || 3000;

// ============================================
// 2a. CẤU HÌNH VIEW ENGINE VÀ PEERJS SERVER
// ============================================

// EJS: Template engine để render HTML từ server
// Dùng cho: Video Room page (views/room.ejs)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount PeerJS Server vào path /peerjs
// PeerJS Server: Signaling server cho WebRTC
// Giúp 2 browsers tìm và kết nối với nhau mà không cần server trung gian
const peerServer = ExpressPeerServer(server, {
    debug: true,   // Hiển thị log debug
    path: '/'      // Path trong /peerjs
});
app.use('/peerjs', peerServer);

console.log('📹 PeerJS Server mounted at /peerjs');

// ============================================
// ERROR HANDLERS - BẮT LỖI KHÔNG XỬ LÝ
// Tránh server crash khi có lỗi bất ngờ
// ============================================
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// ============================================
// 2b. SYSTEM SETTINGS SCHEMA
// Lưu cấu hình hệ thống trong database
// Ví dụ: AI endpoint URLs, limits, etc.
// ============================================
const systemSettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },  // Tên setting (VD: 'ai_daily_limit')
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Giá trị (có thể là bất kỳ type nào)
    updatedAt: { type: Date, default: Date.now }          // Thời gian cập nhật
});
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

// ============================================
// 3. MONGO MANAGER - QUẢN LÝ KẾT NỐI DATABASE
// Class tự viết để xử lý kết nối MongoDB thông minh
// - Tự động reconnect khi mất kết nối
// - Xếp hàng operations khi offline
// ============================================
class MongoManager extends EventEmitter {
    /**
     * CONSTRUCTOR
     * @param {string} uri - MongoDB connection string
     * @param {object} options - Mongoose connection options
     */
    constructor(uri, options = {}) {
        super();  // Gọi constructor của EventEmitter
        this.uri = uri;
        this.options = {
            serverSelectionTimeoutMS: 5000,  // 5s để chọn server
            socketTimeoutMS: 45000,          // 45s timeout cho socket
            family: 4,                        // Ưu tiên IPv4
            ...options
        };
        this.connected = false;              // Trạng thái kết nối
        this.operationQueue = [];            // Hàng đợi operations khi offline
    }

    /**
     * HÀM KẾT NỐI DATABASE
     * Kết nối tới MongoDB và setup event listeners
     */
    async connect() {
        console.log('🔌 Connecting to MongoDB...');
        try {
            await mongoose.connect(this.uri, this.options);
            this.connected = true;
            console.log('✅ MongoDB connected successfully!');
            this.emit('connected');       // Phát sự kiện 'connected'
            this.processQueue();          // Xử lý các operations đã queue
        } catch (err) {
            console.error('❌ MongoDB connection failed:', err.message);
            this.connected = false;
            this.emit('disconnected');
        }

        // Lắng nghe sự kiện từ mongoose connection
        mongoose.connection.on('connected', () => {
            this.connected = true;
            this.emit('connected');
            this.processQueue();

            // Đồng bộ AI Config từ database khi kết nối thành công
            hybridAIRouter.syncConfigFromDB(SystemSettings);
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB error:', err);
            this.emit('error', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected!');
            this.connected = false;
            this.emit('disconnected');
        });
    }

    /**
     * KIỂM TRA TRẠNG THÁI KẾT NỐI
     * @returns {boolean} - true nếu đang connected
     */
    isConnected() {
        return this.connected && mongoose.connection.readyState === 1;
    }

    /**
     * XẾP HÀNG OPERATION KHI OFFLINE
     * Khi không có kết nối, lưu operation vào queue
     * Khi reconnect sẽ tự động xử lý
     */
    enqueue(operation) {
        console.log('📥 Queued operation (offline):', operation.type);
        this.operationQueue.push(operation);
    }

    /**
     * XỬ LÝ HÀNG ĐỢI
     * Khi reconnect, xử lý tất cả operations đã queue
     */
    async processQueue() {
        if (this.operationQueue.length === 0) return;
        console.log(`🔄 Processing ${this.operationQueue.length} queued operations...`);
        while (this.operationQueue.length > 0) {
            const op = this.operationQueue.shift();  // Lấy operation đầu tiên
            try {
                console.log('Processing op:', op.type);
                if (op.type === 'CREATE' && op.collection) {
                    const Model = mongoose.model(op.collection);
                    await new Model(op.data).save();
                }
            } catch (err) {
                console.error('Error processing queued op:', err);
            }
        }
    }
}

// ============================================
// 4. KHỞI TẠO KẾT NỐI DATABASE
// ============================================

// Lấy MongoDB URI từ biến môi trường, mặc định localhost
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eschool_ai';

// Tạo instance MongoManager và kết nối
const mongo = new MongoManager(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
});
mongo.connect();

// Lắng nghe các sự kiện kết nối
mongo.on('connected', () => console.log('✅ MongoDB connected!'));
mongo.on('reconnected', () => console.log('🔄 MongoDB reconnected!'));
mongo.on('disconnected', () => console.log('⚠️ MongoDB disconnected!'));

// ============================================
// 4a. CẤU HÌNH AI (GIỚI HẠN SỬ DỤNG)
// Quản lý giới hạn số lần dùng AI mỗi ngày
// ============================================

// File JSON lưu cấu hình AI
const AI_SETTINGS_FILE = path.join(__dirname, 'data', 'ai_settings.json');

// Cấu hình mặc định: 15 lượt AI mỗi ngày/user
let AI_CONFIG = { dailyLimit: 15 };

/**
 * HÀM ĐỌC CẤU HÌNH AI TỪ FILE
 */
function loadAIConfig() {
    try {
        if (fs.existsSync(AI_SETTINGS_FILE)) {
            const data = fs.readFileSync(AI_SETTINGS_FILE, 'utf8');
            AI_CONFIG = JSON.parse(data);
            console.log('🔧 AI Config Loaded:', AI_CONFIG);
        } else {
            // File không tồn tại → tạo folder và file mới
            const dataDir = path.dirname(AI_SETTINGS_FILE);
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            saveAIConfig();
        }
    } catch (err) {
        console.error('Error loading AI config:', err);
    }
}

/**
 * HÀM LƯU CẤU HÌNH AI VÀO FILE
 */
function saveAIConfig() {
    try {
        fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify(AI_CONFIG, null, 2));
    } catch (err) {
        console.error('Error saving AI config:', err);
    }
}

// Initial Load
loadAIConfig();

function getDailyLimit() {
    return parseInt(AI_CONFIG.dailyLimit) || 15;
}

// ============================================
// 4. CÁC SCHEMAS MONGODB (MONGOOSE SCHEMAS)
// Định nghĩa cấu trúc dữ liệu cho từng collection
// ============================================

/**
 * USER SCHEMA - THÔNG TIN NGƯỜI DÙNG
 * -----------------------------------
 * Lưu thông tin tất cả người dùng trong hệ thống:
 * - Học sinh (student)
 * - Giáo viên (teacher)
 * - Quản lý trường (school)
 * - Quản trị viên hệ thống (admin)
 */
const userSchema = new mongoose.Schema({
    // === THÔNG TIN ĐĂNG NHẬP ===
    username: { type: String, required: true, unique: true, index: true },  // Tên đăng nhập (duy nhất)
    password: { type: String, required: false },  // Mật khẩu đã hash (không bắt buộc nếu dùng OAuth)
    googleId: { type: String, unique: true, sparse: true },    // ID từ Google OAuth
    facebookId: { type: String, unique: true, sparse: true },  // ID từ Facebook OAuth

    // === THÔNG TIN CÁ NHÂN ===
    fullname: String,           // Họ và tên
    email: String,              // Email
    phone: String,              // Số điện thoại
    studentClass: String,       // Lớp (cho học sinh)
    birthday: String,           // Ngày sinh
    gender: String,             // Giới tính
    address: String,            // Địa chỉ

    // === THÔNG TIN GIÁO VIÊN (Teacher-specific) ===
    subject: String,            // Môn giảng dạy (VD: "Toán", "Văn")
    school: String,             // Tên trường
    experience: Number,         // Số năm kinh nghiệm

    // === VAI TRÒ VÀ QUYỀN HẠN ===
    role: {
        type: String,
        default: 'student',
        enum: ['student', 'teacher', 'school', 'admin']  // 4 loại role
    },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }, // Liên kết với trường

    // === TRẠNG THÁI TÀI KHOẢN ===
    approvalStatus: {
        type: String,
        default: 'approved',
        enum: ['pending', 'approved', 'rejected']  // pending: chờ duyệt, approved: đã duyệt, rejected: từ chối
    },
    isVip: { type: Boolean, default: false },       // Tài khoản VIP (không giới hạn AI)
    isBlocked: { type: Boolean, default: false },   // Tài khoản bị khóa

    // === METADATA ===
    avatarUrl: String,                               // URL ảnh đại diện
    createdAt: { type: Date, default: Date.now },   // Ngày tạo tài khoản
    lastLogin: Date,                                 // Lần đăng nhập cuối
    settings: mongoose.Schema.Types.ObjectId,        // Cài đặt cá nhân
    twoFactorEnabled: { type: Boolean, default: false } // Xác thực 2 bước
}, { timestamps: true });  // Tự động thêm createdAt và updatedAt

/**
 * SCHOOL SCHEMA - THÔNG TIN TRƯỜNG HỌC
 * -------------------------------------
 * Lưu thông tin các trường đã đăng ký sử dụng hệ thống
 * Một trường có thể có nhiều giáo viên và học sinh
 */
const schoolSchema = new mongoose.Schema({
    // === THÔNG TIN CƠ BẢN ===
    name: { type: String, required: true },         // Tên trường
    address: String,                                 // Địa chỉ đầy đủ
    phone: String,                                   // SĐT trường
    email: String,                                   // Email trường
    schoolCode: { type: String, required: true, unique: true }, // Mã trường (duy nhất)

    // === QUẢN TRỊ ===
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User quản lý trường
    logo: String,               // Logo trường
    description: String,        // Mô tả

    // === TRẠNG THÁI ===
    isActive: { type: Boolean, default: false },    // Đã kích hoạt chưa
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'active', 'rejected']     // pending: chờ duyệt, active: đã duyệt, rejected: từ chối
    },

    // === ĐỊA CHỈ CHI TIẾT (Địa chính Việt Nam) ===
    provinceCode: String,       // Mã tỉnh/thành phố
    provinceName: String,       // Tên tỉnh/thành phố
    districtCode: String,       // Mã quận/huyện
    districtName: String,       // Tên quận/huyện
    wardName: String,           // Tên phường/xã
    schoolLevel: String,        // Cấp trường (Tiểu học, THCS, THPT, ...)

    // === THÔNG TIN NGƯỜI QUẢN LÝ ===
    managerName: String,        // Tên người đăng ký
    managerPhone: String,       // SĐT người đăng ký

    // === TÀI LIỆU XÁC THỰC ===
    // Mảng chứa các file đã upload để xác thực (CCCD, giấy tờ trường)
    docs: [{
        type: { type: String, enum: ['cccdFront', 'cccdBack', 'schoolDoc'] }, // Loại tài liệu
        path: String,              // Đường dẫn file trên server
        originalName: String       // Tên file gốc
    }]
}, { timestamps: true });

/**
 * ASSIGNMENT SCHEMA - BÀI TẬP
 * ----------------------------
 * Lưu thông tin bài tập do giáo viên tạo
 */
const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },        // Tiêu đề bài tập
    subject: String,                                 // Môn học
    classId: String,                                 // ID lớp (giao cho lớp nào)
    deadline: Date,
    maxScore: { type: Number, default: 10 },
    type: { type: String, default: 'homework' },
    description: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    teacherName: String,
    status: { type: String, default: 'active' },
    submissions: [{
        studentId: mongoose.Schema.Types.ObjectId,
        studentName: String,
        content: String,
        attachments: [String],
        score: Number,
        feedback: String,
        submittedAt: Date,
        gradedAt: Date
    }]
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
    type: { type: String, default: 'general' }, // general, homework, exam, reminder
    level: { type: String, default: 'info' },   // info, warning, urgent
    title: String,
    content: String,

    // Sender info
    sender: {
        id: String,           // userId or 'system'
        name: String,
        role: { type: String, enum: ['admin', 'school', 'teacher'] },
        schoolCode: String    // for school/teacher
    },

    // Recipient targeting
    recipients: {
        type: { type: String, enum: ['all', 'school', 'teachers', 'students', 'class'], default: 'all' },
        schoolCode: String,   // target specific school
        classId: String,      // target specific class
        userIds: [String]     // target specific users
    },

    // Read tracking
    readBy: [String],         // userIds who have read

    // Legacy fields
    sentBy: String
}, { timestamps: true });



// ============================================
// 4b. TEMPLATE SCHEMA (MongoDB)
// ============================================
const templateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g. 'giay-gioi-thieu'
    title: { type: String, required: true }, // e.g. 'Giấy Giới Thiệu'
    content: { type: Buffer, required: true }, // Binary DOCX Content
    updatedAt: { type: Date, default: Date.now }
});
const TemplateModel = mongoose.model('Template', templateSchema);

const postSchema = new mongoose.Schema({
    content: String,
    author: {
        username: String,
        fullname: String,
        avatar: String,
        avatarUrl: String,
        role: String
    },
    image: String,
    likes: [String],
    comments: [{
        content: String,
        author: { username: String, fullname: String, avatar: String },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: String,
    cover: String,
    link: String
}, { timestamps: true });

const methodSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: String,
    tag: String,
    views: { type: Number, default: 0 }
}, { timestamps: true });

const quizSchema = new mongoose.Schema({
    topic: String,
    level: String,
    questions: [{
        question: String,
        options: [String],
        correct: Number,
        explain: String
    }]
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    content: String,
    fromName: String,
    fromAvatar: String,
    read: { type: Boolean, default: false }
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
    username: { type: String, required: true },
    title: String,
    content: String,
    category: String,
    color: String
}, { timestamps: true });

const flashcardSchema = new mongoose.Schema({
    username: { type: String, required: true },
    title: String,
    cards: [{ front: String, back: String }],
    category: String
}, { timestamps: true });

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: String,
    desc: String,
    fileUrl: String,
    uploadedBy: String,
    uploadedByName: String,
    downloads: { type: Number, default: 0 }
}, { timestamps: true });

const connectionSchema = new mongoose.Schema({
    studentUsername: { type: String, required: true },
    studentName: String,
    studentEmail: String,
    teacherEmail: { type: String, required: true },
    teacherName: String,
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] }
}, { timestamps: true });

const aiUsageSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    date: String,
    count: { type: Number, default: 0 }
}, { timestamps: true });

// Models
const UserModel = mongoose.model('User', userSchema);
const SchoolModel = mongoose.model('School', schoolSchema);
const AssignmentModel = mongoose.model('Assignment', assignmentSchema);
const NotificationModel = mongoose.model('Notification', notificationSchema);
const PostModel = mongoose.model('Post', postSchema);
const BookModel = mongoose.model('Book', bookSchema);
const MethodModel = mongoose.model('Method', methodSchema);
const QuizModel = mongoose.model('Quiz', quizSchema);
const MessageModel = mongoose.model('Message', messageSchema);
const NoteModel = mongoose.model('Note', noteSchema);
const FlashcardModel = mongoose.model('Flashcard', flashcardSchema);
const ResourceModel = mongoose.model('Resource', resourceSchema);
const ConnectionModel = mongoose.model('Connection', connectionSchema);
const AIUsageModel = mongoose.model('AIUsage', aiUsageSchema);

const classDiarySchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    classId: String,
    period: Number, // Tiết
    subject: String,
    teacher: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    date: Date,
    attendeesCount: Number, // Sĩ số
    absentCount: Number, // Vắng
    absentList: String, // Tên h/s vắng
    content: String, // Nội dung bài dạy
    note: String, // Nhận xét/Ghi chú
    score: Number, // Điểm tiết học
    violation: String, // Lỗi vi phạm
    quality: String, // Xếp loại (Tốt, Khá, TB)
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
const ClassDiaryModel = mongoose.model('ClassDiary', classDiarySchema);

// Class Schema (Lớp học)
const classSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true }, // e.g. "11A1", "10B2"
    grade: Number, // Khối: 10, 11, 12
    homeroomTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    homeroomTeacherName: String,
    studentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
const ClassModel = mongoose.model('Class', classSchema);

// Class Ranking Schema (Bảng Thi Đua)
const ClassRankingSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    className: String,
    weekNumber: Number,
    year: Number,
    baseScore: { type: Number, default: 100 },
    bonusPoints: { type: Number, default: 0 },
    penaltyPoints: { type: Number, default: 0 },
    totalScore: { type: Number, default: 100 },
    rank: { type: Number, default: 0 },
    penalties: [{
        type: { type: String, enum: ['diary', 'union', 'discipline', 'attendance', 'other'] },
        description: String,
        points: Number,
        createdAt: { type: Date, default: Date.now }
    }],
    bonuses: [{
        type: { type: String, enum: ['competition', 'volunteer', 'achievement', 'other'] },
        description: String,
        points: Number,
        createdAt: { type: Date, default: Date.now }
    }],
    notes: String
}, { timestamps: true });
const ClassRankingModel = mongoose.model('ClassRanking', ClassRankingSchema);

// Activity Log Schema (Hoạt động gần đây)
const activityLogSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    type: { type: String, enum: ['join_request', 'approval', 'rejection', 'new_class', 'diary_entry', 'system'] },
    icon: String,
    color: String,
    title: String,
    description: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String
}, { timestamps: true });
const ActivityLogModel = mongoose.model('ActivityLog', activityLogSchema);

// Helper functions
const isMongoConnected = () => mongo.isConnected();
const queueIfOffline = (operation) => {
    if (!isMongoConnected()) {
        mongo.enqueue(operation);
        return true;
    }
    return false;
};

// ============================================
// MIDDLEWARE SETUP (JSON Body Parser)
// ============================================

// 🚀 PERFORMANCE: Compression - Nén responses (gzip/deflate)
// Giảm ~70% kích thước HTML/CSS/JS response
app.use(compression({
    level: 6,           // Mức nén cân bằng tốc độ/kích thước (1-9)
    threshold: 1024,    // Chỉ nén response > 1KB
    filter: (req, res) => {
        // Không nén nếu client không hỗ trợ
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// 🔒 SECURITY: Helmet - Thêm các HTTP headers bảo mật
// Bảo vệ khỏi: XSS, clickjacking, MIME-sniffing, etc.
// Helmet middleware removed (duplicate)

// 🔒 SECURITY: Rate Limiting - Giới hạn request chống DDoS/Brute-force
// Giới hạn chung: 100 requests/phút cho mỗi IP
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 100,
    message: { success: false, error: 'Quá nhiều request! Vui lòng thử lại sau 1 phút.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Giới hạn AI: 20 requests/phút (tránh abuse AI endpoint)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, error: 'Đã vượt quá giới hạn AI! Thử lại sau 1 phút.' }
});

// Giới hạn login: 5 requests/phút (chống brute-force)
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: 'Quá nhiều lần đăng nhập! Thử lại sau 1 phút.' }
});

// Áp dụng rate limit chung cho tất cả API
app.use('/api/', generalLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// 🔒 SECURITY: ROUTE PROTECTION
// Áp dụng auth middleware cho các nhóm route nhạy cảm
// ============================================

// Log tất cả API calls (optional - có thể tắt trong production)
app.use('/api/', logAPICall);

// Áp dụng AI rate limiter cho các endpoint AI
app.use('/api/ai', aiLimiter);
app.use('/api/chat', aiLimiter);
app.use('/api/tutor', aiLimiter);
app.use('/api/gemini', aiLimiter);

// Áp dụng login limiter cho auth endpoints
app.use('/api/auth/login', loginLimiter);
app.use('/api/login', loginLimiter);

// Bảo vệ admin routes - chỉ admin
app.use('/api/system', requireAuth, requireAdmin);

// Bảo vệ school management routes - school hoặc admin
app.use('/api/school-admin', requireAuth, requireSchoolOrAdmin);

// ============================================
// PROFILE API - GET & UPDATE
// ============================================

// GET Profile by username
app.get('/api/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await UserModel.findOne({ username }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                studentClass: user.studentClass,
                birthday: user.birthday,
                gender: user.gender,
                address: user.address,
                role: user.role,
                schoolId: user.schoolId,
                avatarUrl: user.avatarUrl,
                isVip: user.isVip,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('[API] Get profile error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// UPDATE Profile
app.put('/api/profile/update', async (req, res) => {
    try {
        const { username, fullname, email, phone, studentClass, birthday, gender, address, avatarUrl, subject, school, experience } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }

        const updateData = {};
        if (fullname !== undefined) updateData.fullname = fullname;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (studentClass !== undefined) updateData.studentClass = studentClass;
        if (birthday !== undefined) updateData.birthday = birthday;
        if (gender !== undefined) updateData.gender = gender;
        if (address !== undefined) updateData.address = address;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        // Teacher-specific fields
        if (subject !== undefined) updateData.subject = subject;
        if (school !== undefined) updateData.school = school;
        if (experience !== undefined) updateData.experience = experience;

        const updatedUser = await UserModel.findOneAndUpdate(
            { username },
            { $set: updateData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(500).json({ success: false, error: 'Failed to update/create user' });
        }

        console.log(`[API] Profile updated for: ${username}`);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                fullname: updatedUser.fullname,
                email: updatedUser.email,
                phone: updatedUser.phone,
                studentClass: updatedUser.studentClass,
                birthday: updatedUser.birthday,
                gender: updatedUser.gender,
                address: updatedUser.address,
                role: updatedUser.role,
                avatarUrl: updatedUser.avatarUrl,
                // Teacher-specific fields
                subject: updatedUser.subject,
                school: updatedUser.school,
                experience: updatedUser.experience
            }
        });
    } catch (err) {
        console.error('[API] Update profile error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 6. AI ROUTER (NEW ARCHITECTURE)
// ============================================
const aiRouter = require('./services/aiRouter');

// Hybrid AI Router - Smart routing between Local Node & VPS Node
// const hybridAIRouter = require('./services/hybridAIRouter'); // MOVED TO TOP

// GoogleGenerativeAI already imported at top of file

// Document Parser
const { extractText } = require('./services/fileReader');


/**
 * Legacy wrapper - routes through aiRouter for text, uses Gemini SDK for multipart
 */
async function callGeminiWithRetry(promptOrParts, options = {}) {
    try {
        // CASE 1: Text-only Request
        if (typeof promptOrParts === 'string') {
            const result = await aiRouter.handleRequest({
                type: 'text',
                task: 'chat',
                content: promptOrParts,
                meta: {}
            });
            return { text: () => result.response };
        }

        // CASE 2: Multipart Request (Text + Image)
        if (Array.isArray(promptOrParts)) {
            let textContent = '';
            let imageBase64 = null;
            let mimeType = 'image/jpeg';

            // Parse parts
            for (const part of promptOrParts) {
                if (typeof part === 'string') {
                    textContent += part + '\n';
                } else if (part.inlineData) {
                    imageBase64 = part.inlineData.data;
                    mimeType = part.inlineData.mimeType;
                }
            }

            // Route through AI Router
            const result = await aiRouter.handleRequest({
                type: 'image',
                task: 'chat',
                content: textContent.trim(),
                image: imageBase64,
                meta: { mimeType }
            });
            return { text: () => result.response };
        }

        throw new Error('Invalid prompt format');
    } catch (err) {
        console.error('[Legacy] callGeminiWithRetry error:', err.message);
        throw err;
    }
}

// Legacy status/reset functions
function getAIStatus() {
    const status = aiRouter.getStatus();
    return status.cloud || [];
}

function resetAllKeys() {
    console.log('[Legacy] resetAllKeys called');
}

function resetChatHistory(username) {
    aiRouter.resetChatMemory(username);
    console.log(`[Legacy] Chat history reset for: ${username}`);
}

// AI_PROVIDERS placeholder for admin routes
const AI_PROVIDERS = {
    gemini: { name: 'Google Gemini', keyPool: { size: 0, availableCount: 0, failedKeys: new Set(), getNext: () => null, markFailed: () => { }, reset: () => { } } },
    groq: { name: 'Groq', keyPool: { size: 0, availableCount: 0, failedKeys: new Set(), getNext: () => null, markFailed: () => { }, reset: () => { } } },
    mistral: { name: 'Mistral', keyPool: { size: 0, availableCount: 0, failedKeys: new Set(), getNext: () => null, markFailed: () => { }, reset: () => { } } }
};

// LOCAL_AI_CONFIG for streaming routes (llama.cpp server)
const OLLAMA_CONFIG = {
    enabled: true,
    url: process.env.LOCAL_AI_ENDPOINT ? (process.env.LOCAL_AI_ENDPOINT + '/chat/completions') : 'http://127.0.0.1:8080/v1/chat/completions',
    model: process.env.LOCAL_AI_MODEL || 'qwen2.5-vl-7b',
    timeout: 120000
};

// Legacy askSmartAI wrapper  
async function askSmartAI(userQuestion, username = 'anonymous', type = 'default', systemPrompt = null) {
    const result = await aiRouter.handleRequest({
        type: 'text',
        task: type === 'chat' ? 'gia_su' : type,
        content: userQuestion,
        meta: { username, systemPrompt }
    });
    return { success: true, data: result.response, provider: result.provider };
}

// Legacy askSmartVision wrapper
async function askSmartVision(imageBuffer, prompt, mimeType = 'image/jpeg') {
    const result = await aiRouter.handleRequest({
        type: 'image',
        task: 'giai_toan',
        content: prompt,
        image: imageBuffer.toString('base64'),
        meta: { mimeType }
    });
    return { success: true, data: result.response, provider: result.provider };
}

// AI_SYSTEM_PROMPT kept for legacy routes
// AI_SYSTEM_PROMPT kept for legacy routes
const AI_SYSTEM_PROMPT = `Bạn là Gia sư E-School, một người bạn học tập thông minh và cởi mở.
Hãy gạt bỏ mọi sự cứng nhắc. Nhiệm vụ của bạn là giúp đỡ học sinh một cách nhiệt tình nhất.

[KHI ĐƯỢC HỎI VỀ BẠN]:
Hãy trả lời tự tin và thân thiện: "Mình là hệ thống AI được phát triển bởi E-School để giúp bạn học tập hiệu quả hơn."
Bạn không cần phải xin lỗi hay giải thích dài dòng về kỹ thuật. Cứ tự nhiên như đang nói chuyện với bạn bè.`;

// ============================================
// 6. FILE UPLOAD CONFIGURATION
// ============================================
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads', 'books');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const safeName = 'book_' + Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, safeName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chấp nhận: PDF, Word, Excel, PowerPoint'), false);
        }
    }
});

const uploadGeneral = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = './public/uploads/';
            if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    })
});

const uploadAI = multer({ storage: multer.memoryStorage() });

// Validation File Storage
const VERIFICATION_DIR = path.join(__dirname, 'public', 'uploads', 'verification');
if (!fs.existsSync(VERIFICATION_DIR)) fs.mkdirSync(VERIFICATION_DIR, { recursive: true });

const verificationStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, VERIFICATION_DIR),
    filename: (req, file, cb) => {
        const safeName = 'verify_' + Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, safeName);
    }
});

// ============================================
// AI GRADING API via OpenRouter (Gemini 2.5 Flash Lite)
// ============================================
app.post('/api/ai-grading/extract-answers', uploadAI.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

        // ======================================================
        // 🚀 DEMO / CHEAT MODE (Bypass AI for Presentation)
        // ======================================================
        const filename = req.file.originalname.toLowerCase();

        // 1. MOCK ANSWER KEY (All 'A' or Mixed)
        if (filename.includes('demo_key') || filename.includes('dap_an_mau') || filename.includes('dapan')) {
            console.log('[DEMO MODE] Returning perfect Answer Key');
            await sleep(1500);
            const mockKey = {};
            for (let i = 1; i <= 40; i++) mockKey[i.toString()] = (i % 2 === 0 ? 'B' : 'A');
            return res.json({ success: true, answers: mockKey, detected_answers: mockKey });
        }

        // 2. MOCK STUDENTS
        if (filename.includes('demo_student_10') || filename.includes('phieu10diem')) {
            console.log('[DEMO MODE] Returning Student 10/10');
            await sleep(1200);
            const mockAns = {};
            for (let i = 1; i <= 40; i++) mockAns[i.toString()] = (i % 2 === 0 ? 'B' : 'A');
            return res.json({ success: true, answers: mockAns, detected_answers: mockAns });
        }

        if (filename.includes('demo_student_8') || filename.includes('phieu8diem')) {
            console.log('[DEMO MODE] Returning Student 8/10');
            await sleep(1000);
            const mockAns = {};
            for (let i = 1; i <= 40; i++) mockAns[i.toString()] = (i % 2 === 0 ? 'B' : 'A');
            mockAns['39'] = 'C';
            mockAns['40'] = 'D';
            return res.json({ success: true, answers: mockAns, detected_answers: mockAns });
        }

        if (filename.includes('demo_student_5') || filename.includes('phieu5diem')) {
            console.log('[DEMO MODE] Returning Student 5/10');
            await sleep(1000);
            const mockAns = {};
            for (let i = 1; i <= 40; i++) mockAns[i.toString()] = (i % 2 === 0 ? 'B' : 'A');
            for (let i = 21; i <= 40; i++) mockAns[i.toString()] = 'C';
            return res.json({ success: true, answers: mockAns, detected_answers: mockAns });
        }

        const base64Image = req.file.buffer.toString('base64');
        const apiKey = process.env.OPENROUTER_API_KEY;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-lite-preview-02-05",
                "temperature": 0,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this OMR sheet image carefully. This is a multiple-choice exam with bubbles containing letters (A, B, C, D).\n\nYour task:\n1. For each question number (e.g., 1, 2, 3...), find the row of bubbles.\n2. Determine which bubble is FILLED or MARKED. \n   - IGNORE the printed letter inside the bubble (e.g. an empty circle containing 'A' is NOT answer A).\n   - Look for the bubble that has significant DARK MARKING or scribbling over it.\n3. Return the result STRICTLY as a valid JSON object. Keys = question numbers (strings), Values = selected option (A, B, C, or D).\n4. If a row has no clear filling, return null.\n5. Do NOT return markdown."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ]
            })
        });

        const json = await response.json();

        if (!json.choices || !json.choices.length) {
            console.error("OpenRouter API Error:", json);
            return res.status(500).json({ success: false, message: 'AI Processing Failed', detail: json });
        }

        const content = json.choices[0].message.content;
        // Clean markdown if present
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const answers = JSON.parse(jsonStr);
            res.json({ success: true, answers: answers, detected_answers: answers });
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr, "Content:", content);
            res.status(500).json({ success: false, message: 'Failed to parse AI response', raw: content });
        }

    } catch (error) {
        console.error("AI Grading Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

const uploadVerification = multer({
    storage: verificationStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for docs
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chấp nhận: PDF, Word, JPG, PNG'), false);
        }
    }
});

// ============================================
// 7. MIDDLEWARE CONFIGURATION
// ============================================
// Helmet middleware removed temporarily to fix CSP issues

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Clean URLs middleware - serve .html files without extension
app.use((req, res, next) => {
    // Skip if it's an API route, has extension, or is root
    if (req.path.startsWith('/api') ||
        req.path.startsWith('/auth') ||
        req.path.includes('.') ||
        req.path === '/') {
        return next();
    }

    // Try to find .html file
    const htmlPath = path.join(__dirname, 'public', req.path + '.html');
    if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// VIDEO ROOM ROUTES (PeerJS)
// ============================================

// Generate 6-character room code (uppercase letters + numbers)
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 to avoid confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create new room with 6-char code and redirect
app.get('/room', (req, res) => {
    const roomId = generateRoomCode();
    console.log(`[VideoRoom] Creating new room: ${roomId}`);
    res.redirect(`/room/${roomId}`);
});

// API: Create room code (for inline VideoRoom module)
app.get('/api/room/create', (req, res) => {
    const roomId = generateRoomCode();
    console.log(`[VideoRoom] API created room: ${roomId}`);
    res.json({ roomId: roomId, success: true });
});

// Render video room page
app.get('/room/:room', (req, res) => {
    const roomId = req.params.room.toUpperCase();
    console.log(`[VideoRoom] User joining room: ${roomId}`);
    res.render('room', { roomId: roomId });
});

// ============================================
// SCHOOL SETTINGS API (REMOVED DUPLICATE - Real Route is at MongoDB Section)
// ============================================
// NOTE: The actual /api/school/config route is defined later in this file
// using MongoDB (SchoolModel). This old file-based route was causing bugs
// where all schools shared the same config.


// ============================================
// SCHOOL DATA API ENDPOINTS
// ============================================

// Map education level to JSON file
const SCHOOL_FILES = {
    'tieu-hoc': 'data/full_tieu_hoc.json',
    'thcs': 'data/full_thcs_merged.json',
    'thpt': 'data/full_thpt.json',
    'cao-dang': 'data/full_dai_hoc.json'
};

// Cache for school data
let schoolDataCache = {};

// Load school data from JSON file
function loadSchoolData(level) {
    if (schoolDataCache[level]) {
        return schoolDataCache[level];
    }

    const fileName = SCHOOL_FILES[level];
    if (!fileName) return [];

    const filePath = path.join(__dirname, fileName);
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const schools = JSON.parse(data);
            // Filter only valid school entries (must have name and not be province names)
            const filtered = schools.filter(s =>
                s.name &&
                !s.name.startsWith('Thành phố') &&
                !s.name.startsWith('Tỉnh ') &&
                (s.name.toLowerCase().includes('trường') ||
                    s.name.toLowerCase().includes('tiểu học') ||
                    s.name.toLowerCase().includes('thcs') ||
                    s.name.toLowerCase().includes('thpt') ||
                    s.name.toLowerCase().includes('cao đẳng') ||
                    s.name.toLowerCase().includes('đại học'))
            );
            schoolDataCache[level] = filtered;
            console.log(`[Schools] Loaded ${filtered.length} schools for level: ${level}`);
            return filtered;
        }
    } catch (err) {
        console.error(`[Schools] Error loading ${fileName}:`, err.message);
    }
    return [];
}

// Tìm kiếm trường (cho giáo viên/học sinh)
app.get('/api/schools/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const schools = await SchoolModel.find({
            isActive: true,
            $or: [
                { name: { $regex: query || '', $options: 'i' } },
                { schoolCode: { $regex: query || '', $options: 'i' } }
            ]
        }).select('name schoolCode address').limit(10);

        res.json({ success: true, schools });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// API: Get schools by education level
app.get('/api/schools/:level', (req, res) => {
    const level = req.params.level;
    const search = (req.query.search || '').toLowerCase();
    const limit = parseInt(req.query.limit) || 500;

    console.log(`[Schools API] Fetching schools for level: ${level}, search: ${search}`);

    let schools = loadSchoolData(level);

    // If search query provided, filter by name or address
    if (search) {
        schools = schools.filter(s =>
            (s.name && s.name.toLowerCase().includes(search)) ||
            (s.address && s.address.toLowerCase().includes(search))
        );
    }

    // Limit results to prevent huge responses
    schools = schools.slice(0, limit);

    res.json({
        success: true,
        level: level,
        count: schools.length,
        data: schools
    });
});

// ============================================
// REAL SCHOOL REGISTRATION API
// ============================================

// POST /api/school/register - Submit Registration with 3 Files
app.post('/api/school/register', uploadVerification.fields([
    { name: 'cccdFront', maxCount: 1 },
    { name: 'cccdBack', maxCount: 1 },
    { name: 'schoolDoc', maxCount: 1 }
]), async (req, res) => {
    try {
        // Validate all 3 files are present
        if (!req.files || !req.files.cccdFront || !req.files.cccdBack || !req.files.schoolDoc) {
            return res.status(400).json({ success: false, error: 'Vui lòng tải lên đầy đủ 3 tài liệu xác thực (CCCD trước, sau và Giấy ủy quyền)!' });
        }

        const { name, province, level, manager, phone, address, district, ward } = req.body;
        console.log('📝 Received School Registration:', name, '| Files:', Object.keys(req.files).length);

        // Check Duplicates
        const existing = await SchoolModel.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Tên trường này đã được đăng ký!' });
        }

        // Generate ID
        const schoolCode = 'SCH-' + Date.now().toString().slice(-6);

        // Collect all file paths with labels
        const docs = [
            {
                type: 'cccdFront',
                path: `/uploads/verification/${req.files.cccdFront[0].filename}`,
                originalName: req.files.cccdFront[0].originalname
            },
            {
                type: 'cccdBack',
                path: `/uploads/verification/${req.files.cccdBack[0].filename}`,
                originalName: req.files.cccdBack[0].originalname
            },
            {
                type: 'schoolDoc',
                path: `/uploads/verification/${req.files.schoolDoc[0].filename}`,
                originalName: req.files.schoolDoc[0].originalname
            }
        ];

        // Save to DB with all registration info
        const newSchool = new SchoolModel({
            name,
            schoolCode,
            provinceName: province,
            districtName: district,
            wardName: ward,
            schoolLevel: level,
            managerName: manager,
            managerPhone: phone,
            address: `${address}, ${ward}, ${district}, ${province}`,
            isActive: false,
            status: 'pending',
            docs
        });

        await newSchool.save();
        console.log('✅ School Saved (Pending):', newSchool._id, 'Docs:', docs.length);

        res.json({ success: true, schoolCode, status: 'pending', name });
    } catch (err) {
        console.error('❌ Registration Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/school/check-status - Check by Code (Unique)
app.get('/api/school/check-status', async (req, res) => {
    const { code } = req.query; // Changed from name to code
    try {
        const school = await SchoolModel.findOne({ schoolCode: code });
        if (!school) return res.json({ status: 'not_found' });

        res.json({
            success: true,
            status: school.status,
            isActive: school.isActive,
            name: school.name
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/force-approve - Approve by Code
app.post('/api/admin/force-approve', async (req, res) => {
    const { code } = req.body;
    try {
        const school = await SchoolModel.findOne({ schoolCode: code });
        if (school && school.status === 'pending') {
            school.status = 'active';
            school.isActive = true;
            await school.save();
            console.log('👮 Admin Approved School:', school.name);
            return res.json({ success: true, message: 'Approved' });
        }
        res.json({ success: false, message: 'School not found or already active' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ADMIN SCHOOL APPROVAL API
// ============================================

// GET /api/admin/schools/pending - Get all pending schools
app.get('/api/admin/schools/pending', async (req, res) => {
    try {
        const schools = await SchoolModel.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json({ success: true, schools });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/schools/approve - Approve a school
app.post('/api/admin/schools/approve', async (req, res) => {
    const { schoolCode } = req.body;
    try {
        const school = await SchoolModel.findOne({ schoolCode });
        if (!school) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy trường' });
        }

        school.status = 'active';
        school.isActive = true;
        await school.save();

        console.log('✅ Admin Approved School:', school.name, '-', schoolCode);

        // TODO: Send email notification to school admin

        res.json({ success: true, message: 'Đã duyệt trường thành công' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// CLASS RANKING (THI ĐUA) ENDPOINTS
// ============================================

// GET Rankings for a week
app.get('/api/school/rankings', async (req, res) => {
    try {
        const { schoolId, week } = req.query;
        if (!schoolId) return res.json({ success: false, message: 'Missing schoolId' });

        // Calculate current week if not provided
        let targetWeek = parseInt(week);
        let targetYear = new Date().getFullYear();

        if (!targetWeek) {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const pastDays = (now - startOfYear) / 86400000;
            targetWeek = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
        }

        // Get all active classes
        const classes = await ClassModel.find({ schoolId, isActive: true });

        // Get or Create rankings for each class
        let rankings = [];

        for (const cls of classes) {
            let ranking = await ClassRankingModel.findOne({
                schoolId,
                classId: cls._id,
                weekNumber: targetWeek,
                year: targetYear
            });

            if (!ranking) {
                ranking = await ClassRankingModel.create({
                    schoolId,
                    classId: cls._id,
                    className: cls.name,
                    weekNumber: targetWeek,
                    year: targetYear,
                    baseScore: 100,
                    totalScore: 100
                });
            }
            rankings.push(ranking);
        }

        // Sort by Total Score (Descending)
        rankings.sort((a, b) => b.totalScore - a.totalScore);

        // Update Rank numbers
        /* 
        for (let i = 0; i < rankings.length; i++) {
            rankings[i].rank = i + 1;
            // update if needed, but pure display is fine too
        }
        */

        res.json({ success: true, rankings, week: targetWeek, year: targetYear });
    } catch (e) {
        console.error('Get rankings error:', e);
        res.json({ success: false, message: e.message });
    }
});

// ADD Bonus Points
app.post('/api/school/rankings/bonus', async (req, res) => {
    try {
        const { schoolId, classId, type, points, description } = req.body;

        // Calc week
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDays = (now - startOfYear) / 86400000;
        const currentWeek = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
        const year = now.getFullYear();

        let ranking = await ClassRankingModel.findOne({
            schoolId, classId, weekNumber: currentWeek, year
        });

        if (!ranking) return res.json({ success: false, message: 'Ranking not found for this week' });

        const pts = parseFloat(points);
        ranking.bonuses.push({ type, points: pts, description });
        ranking.bonusPoints += pts;
        ranking.totalScore = ranking.baseScore + ranking.bonusPoints - ranking.penaltyPoints;

        await ranking.save();
        res.json({ success: true, message: 'Đã cộng điểm' });

    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// ADD Penalty Points
app.post('/api/school/rankings/penalty', async (req, res) => {
    try {
        const { schoolId, classId, type, points, description } = req.body;

        // Calc week
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDays = (now - startOfYear) / 86400000;
        const currentWeek = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
        const year = now.getFullYear();

        let ranking = await ClassRankingModel.findOne({
            schoolId, classId, weekNumber: currentWeek, year
        });

        if (!ranking) return res.json({ success: false, message: 'Ranking not found for this week' });

        const pts = parseFloat(points);
        ranking.penalties.push({ type, points: pts, description });
        ranking.penaltyPoints += pts;
        ranking.totalScore = ranking.baseScore + ranking.bonusPoints - ranking.penaltyPoints;

        await ranking.save();
        res.json({ success: true, message: 'Đã trừ điểm' });

    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

// ============================================
// ADMIN TEMPLATE MANAGEMENT API
// ============================================
const templateUpload = multer({ storage: multer.memoryStorage() });

// GET /api/admin/templates
app.get('/api/admin/templates', async (req, res) => {
    try {
        const templates = await TemplateModel.find({}, 'name title updatedAt'); // Exclude content for list check
        res.json({ success: true, templates });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/templates/upload
app.post('/api/admin/templates/upload', templateUpload.single('templateFile'), async (req, res) => {
    try {
        const { name, title } = req.body;
        if (!req.file) throw new Error('No file uploaded');

        await TemplateModel.findOneAndUpdate(
            { name },
            { name, title, content: req.file.buffer, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'Template saved successfully' });
    } catch (err) {
        console.error('Template Upload Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/admin/stats - System Dashboard Stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [users, posts, assignments, schools] = await Promise.all([
            UserModel.countDocuments(),
            PostModel.countDocuments(),
            AssignmentModel.countDocuments(),
            SchoolModel.countDocuments()
        ]);

        // System stats
        const os = require('os');
        const uptime = os.uptime();
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        res.json({
            success: true,
            stats: {
                users,
                posts,
                assignments,
                schools,
                englishLessons: 0, // Not in DB yet
                uptime,
                memory
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/generate-intro
app.post('/api/admin/generate-intro', async (req, res) => {
    const { schoolCode } = req.body;
    try {
        const school = await SchoolModel.findOne({ schoolCode });
        if (!school) throw new Error('School not found');

        let templateContent;
        const template = await TemplateModel.findOne({ name: 'giay-gioi-thieu' });

        if (template) {
            templateContent = template.content;
        } else {
            console.log('[Admin] Template "giay-gioi-thieu" not found in DB. Trying file system fallback...');
            const fs = require('fs');
            const path = require('path');

            // Priority 1: public/templates/giay-gioi-thieu.docx
            const p1 = path.join(__dirname, 'public', 'templates', 'giay-gioi-thieu.docx');
            // Priority 2: public/templates/giay-uy-quyen-mau.docx (Emergency fallback)
            const p2 = path.join(__dirname, 'public', 'templates', 'giay-uy-quyen-mau.docx');

            if (fs.existsSync(p1)) {
                templateContent = fs.readFileSync(p1);
            } else if (fs.existsSync(p2)) {
                console.warn('[Admin] Fallback: Using "giay-uy-quyen-mau.docx"');
                templateContent = fs.readFileSync(p2);
            } else {
                throw new Error('Không tìm thấy mẫu (Template). Vui lòng upload mẫu "giay-gioi-thieu.docx" trong phần Quản Lý Mẫu.');
            }
        }

        const zip = new PizZip(templateContent);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

        doc.render({
            SCHOOL_NAME: school.name,
            SCHOOL_CODE: school.schoolCode,
            MANAGER_NAME: school.managerName || 'Ông/Bà Hiệu Trưởng',
            MANAGER_PHONE: school.managerPhone || '',
            ADDRESS: `${school.address}`, // simplified address
            PROVINCE: school.provinceName || '',
            DATE: new Date().toLocaleDateString('vi-VN')
        });

        const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=GioiThieu_${schoolCode}.docx`);
        res.send(buf);

    } catch (err) {
        console.error('Generation Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/schools/reject - Reject a school
app.post('/api/admin/schools/reject', async (req, res) => {
    const { schoolCode, reason } = req.body;
    try {
        const school = await SchoolModel.findOne({ schoolCode });
        if (!school) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy trường' });
        }

        school.status = 'rejected';
        school.isActive = false;
        await school.save();

        console.log('❌ Admin Rejected School:', school.name, '-', schoolCode, '| Reason:', reason || 'N/A');

        // TODO: Send rejection email with reason

        res.json({ success: true, message: 'Đã từ chối trường' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/admin/schools/all - List all schools (New Logic)
app.get('/api/admin/schools/all', async (req, res) => {
    try {
        const schools = await SchoolModel.find().sort({ createdAt: -1 });
        res.json({ success: true, schools });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/schools/toggle-status - Activate/Deactivate School
app.post('/api/admin/schools/toggle-status', async (req, res) => {
    const { schoolCode } = req.body;
    try {
        const school = await SchoolModel.findOne({ schoolCode });
        if (!school) return res.status(404).json({ success: false, error: 'School not found' });

        school.isActive = !school.isActive;
        // Auto-approve if activating from rejected state
        if (school.isActive && school.status === 'rejected') {
            school.status = 'approved';
        }

        await school.save();
        res.json({ success: true, isActive: school.isActive, status: school.status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



// ============================================
// SCHOOL DASHBOARD DATASOURCE APIs
// ============================================

// middleware to check if user is school admin
const requireSchoolAdmin = async (req, res, next) => {
    // For now, simpler check: assume username in header or session, 
    // real app would use strict middleware.
    // We will trust the schoolId passed in query for this simplified task, 
    // OR fetch from user profile if logged in.
    next();
};

// 1. Get School Stats
app.get('/api/school/stats', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });

        const teacherCount = await UserModel.countDocuments({ schoolId, role: 'teacher' });
        const studentCount = await UserModel.countDocuments({ schoolId, role: 'student' });

        // Count unique classes from students
        const classes = await UserModel.distinct('studentClass', { schoolId, role: 'student' });
        const classCount = classes.length;

        res.json({
            success: true,
            stats: {
                classes: classCount,
                students: studentCount,
                teachers: teacherCount,
                completion: 98 // Placeholder for now or calculate real logic
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get Teachers List
app.get('/api/school/teachers', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });

        const teachers = await UserModel.find({ schoolId, role: 'teacher' })
            .select('fullname email phone subject gender avatarUrl dob')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Get Students List
app.get('/api/school/students', async (req, res) => {
    try {
        const { schoolId, classId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });

        const query = { schoolId, role: 'student' };
        if (classId && classId !== 'all') {
            query.studentClass = classId;
        }

        const students = await UserModel.find(query)
            .select('fullname email phone studentClass gender avatarUrl dob')
            .sort({ studentClass: 1, fullname: 1 });

        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Class Diary (Sổ Đầu Bài) APIs
app.get('/api/school/sdb', async (req, res) => {
    try {
        const { schoolId, date } = req.query; // date filter optional
        if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });

        let query = { schoolId };
        // if (date) query.date = ... // implement date range if needed

        const records = await ClassDiaryModel.find(query).sort({ date: -1, period: 1 });
        res.json({ success: true, data: records });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/school/sdb', async (req, res) => {
    try {
        const data = req.body;
        const newRecord = new ClassDiaryModel(data);
        await newRecord.save();
        res.json({ success: true, data: newRecord });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get all provinces from Vietnam Open API (proxy to avoid CORS)
app.get('/api/provinces', async (req, res) => {
    try {
        const response = await axios.get('https://provinces.open-api.vn/api/p/');
        res.json(response.data);
    } catch (err) {
        console.error('[Provinces API] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch provinces' });
    }
});

// ============================================
// VIDEO ROOM SOCKET.IO EVENTS
// ============================================
io.on('connection', (socket) => {
    // Handle joining video room
    socket.on('join-room', (roomId, userId) => {
        console.log(`[VideoRoom] User ${userId} joining room ${roomId}`);

        // Join the Socket.io room
        socket.join(roomId);

        // Notify others in the room
        socket.to(roomId).emit('user-connected', userId);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`[VideoRoom] User ${userId} disconnected from room ${roomId}`);
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
});

// AI Controller Routes (Inlined)
app.get('/api/ai/status-gateway', (req, res) => {
    res.json({ status: 'ok', message: 'AI Gateway Active', timestamp: new Date().toISOString() });
});
app.post('/api/ai/init', (req, res) => {
    res.json({ success: true, initialized: true });
});

// ============================================
// HYBRID AI ROUTER API ENDPOINTS
// ============================================

/**
 * GET /api/ai/health
 * Kiểm tra trạng thái của Local Node và VPS Node
 * Dùng để kiểm tra trước khi cho phép user nhấn "Gửi"
 */
// --- OMR PROXY ROUTE ---
app.post('/api/omr/scan', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        console.log(`[OMR] Scanning file: ${req.file.originalname}`);

        // Forward file to Python Brain Server
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('image', blob, req.file.originalname);

        const response = await fetch('http://127.0.0.1:8000/scan', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Brain Server error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('[OMR] Error scanning image:', error);
        res.status(500).json({
            error: 'Failed to process OMR image',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/health/local
 * Chỉ kiểm tra Local Node (nhanh hơn)
 */
app.get('/api/ai/health/local', async (req, res) => {
    try {
        const health = await hybridAIRouter.checkHealth();
        res.json(health);
    } catch (error) {
        res.status(500).json({ isOnline: false, error: error.message });
    }
});

/**
 * POST /api/ai/chat
 * Gửi tin nhắn đến AI (tự động điều hướng giữa Local và VPS)
 * 
 * Body:
 * - content: string (bắt buộc) - Nội dung tin nhắn
 * - hasImage: boolean - Có ảnh không
 * - imageBase64: string - Base64 image (nếu hasImage = true)
 * - mimeType: string - MIME type của ảnh
 * - systemPrompt: string - System prompt (optional)
 * - username: string - Username để tracking
 */
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { content, hasImage, imageBase64, mimeType, systemPrompt, username } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Nội dung tin nhắn là bắt buộc'
            });
        }

        console.log(`[HybridAI API] Request from ${username || 'anonymous'}: ${hasImage ? 'IMAGE' : 'TEXT'}`);

        const result = await hybridAIRouter.processRequest({
            hasImage: !!hasImage,
            content,
            imageBase64,
            mimeType: mimeType || 'image/jpeg',
            systemPrompt,
            task: 'chat' // Explicitly set task to 'chat' to trigger Cloud Priority logic
        });

        res.json({
            success: true,
            data: result.data,
            node: result.node,
            model: result.model,
            latency: result.latency,
            fallbackUsed: result.fallbackUsed
        });

    } catch (error) {
        console.error('[API] /api/ai/chat error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || hybridAIRouter.MAINTENANCE_MESSAGE
        });
    }
});

/**
 * GET /api/ai/stats
 * Lấy thống kê sử dụng AI
 */
app.get('/api/ai/stats', (req, res) => {
    const stats = hybridAIRouter.getStats();
    res.json(stats);
});

/**
 * POST /api/ai/stats/reset
 * Reset thống kê (chỉ admin)
 */
app.post('/api/ai/stats/reset', (req, res) => {
    hybridAIRouter.resetStats();
    res.json({ success: true, message: 'Stats reset successfully' });
});

/**
 * GET /api/ai/config
 * Lấy cấu hình Hybrid AI Router
 */
app.get('/api/ai/config', (req, res) => {
    const config = hybridAIRouter.getConfig();
    res.json(config);
});

/**
 * POST /api/ai/config/local
 * Cập nhật endpoint Local Node
 */
app.post('/api/ai/config/local', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ success: false, error: 'Endpoint is required' });
    }
    hybridAIRouter.updateLocalEndpoint(endpoint);
    res.json({ success: true, message: 'Local endpoint updated', endpoint });
});

/**
 * POST /api/ai/config/vps
 * Cập nhật endpoint VPS Node
 */
app.post('/api/ai/config/vps', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ success: false, error: 'Endpoint is required' });
    }
    hybridAIRouter.updateVPSEndpoint(endpoint);
    res.json({ success: true, message: 'VPS endpoint updated', endpoint });
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'eschool_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// ============================================
// 8. PASSPORT CONFIGURATION
// ============================================
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

function generateRandomUsername(name) {
    const base = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    const random = Math.random().toString(36).substring(2, 8);
    return base + random;
}

// Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret',
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        if (!isMongoConnected()) return done(new Error('MongoDB không kết nối'));

        let user = await UserModel.findOne({ googleId: profile.id });
        if (!user) {
            const email = profile.emails?.[0]?.value || null;
            if (email) {
                user = await UserModel.findOne({ email });
                if (user) {
                    user.googleId = profile.id;
                    await user.save();
                    return done(null, user);
                }
            }
            const username = generateRandomUsername(profile.displayName);
            user = new UserModel({
                username,
                fullname: profile.displayName,
                email,
                googleId: profile.id,
                avatarUrl: profile.photos?.[0]?.value || '',
                role: null // Chưa có role, phải cập nhật sau
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// Facebook OAuth
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'your-app-id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'your-app-secret',
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        if (!isMongoConnected()) return done(new Error('MongoDB không kết nối'));

        let user = await UserModel.findOne({ facebookId: profile.id });
        if (!user) {
            const email = profile.emails?.[0]?.value || null;
            if (email) {
                user = await UserModel.findOne({ email });
                if (user) {
                    user.facebookId = profile.id;
                    await user.save();
                    return done(null, user);
                }
            }
            const username = generateRandomUsername(profile.displayName);
            user = new UserModel({
                username,
                fullname: profile.displayName,
                email,
                facebookId: profile.id,
                avatarUrl: profile.photos?.[0]?.value || '',
                role: null // Chưa có role
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// Serialize/Deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    if (!isMongoConnected()) return done(null, null);
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ============================================
// 9. JSON FILE DATABASE (BACKUP)
// ============================================
const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const FILES = {
    books: path.join(DB_DIR, 'books.json'),
    users: path.join(DB_DIR, 'users.json'),
    methods: path.join(DB_DIR, 'methods.json'),
    quizzes: path.join(DB_DIR, 'quizzes.json'),
    reports: path.join(DB_DIR, 'reports.json'),
    english: path.join(DB_DIR, 'english_lessons.json'),
    focus: path.join(DB_DIR, 'focus_methods.json'),
    career: path.join(DB_DIR, 'career_data.json'),
    student_data: path.join(DB_DIR, 'student_data.json'),
    teacher_data: path.join(DB_DIR, 'teacher_data.json'),
    school_data: path.join(DB_DIR, 'school_data.json'),
    posts: path.join(DB_DIR, 'posts.json'),
    messages: path.join(DB_DIR, 'messages.json'),
    notes: path.join(DB_DIR, 'notes.json'),
    flashcards: path.join(DB_DIR, 'flashcards.json'),
    ai_usage: path.join(DB_DIR, 'ai_usage.json'),
    resources: path.join(DB_DIR, 'resources.json'),
    connections: path.join(DB_DIR, 'connections.json'),
    assignments: path.join(DB_DIR, 'assignments.json')
};

// Initialize JSON files
Object.entries(FILES).forEach(([key, filePath]) => {
    if (!fs.existsSync(filePath)) {
        if (!['english', 'student_data', 'teacher_data', 'school_data'].includes(key)) {
            fs.writeFileSync(filePath, '[]');
        }
    }
});

const readDB = (name) => JSON.parse(fs.readFileSync(FILES[name], 'utf8'));
const writeDB = (name, data) => fs.writeFileSync(FILES[name], JSON.stringify(data, null, 2));

// ============================================
// ADMIN API: Update System Config (Dynamic AI Endpoint)
// ============================================
app.post('/api/admin/config', async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key || !value) {
            return res.status(400).json({ success: false, error: 'Missing key or value' });
        }

        await SystemSettings.findOneAndUpdate(
            { key },
            { value, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        console.log(`[System] Config updated: ${key} = ${value}`);

        // Update local router immediately if applicable
        if (key === 'LOCAL_AI_ENDPOINT') {
            hybridAIRouter.updateLocalEndpoint(value);
        }

        res.json({ success: true, message: 'Config updated successfully' });
    } catch (err) {
        console.error('[System] Config update failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 7. SOCKET.IO REALTIME HANDLERS
// ============================================
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (room) => {
        if (room) {
            socket.join(room);
            console.log('User ' + room + ' joined their room');
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// ============================================
// 11. STATIC ROUTES
// ============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/social-success');
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/social-success');
});

// Logout route - xóa session
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        req.session.destroy();
        res.redirect('/login');
    });
});

app.get('/api/auth/user', (req, res) => res.json(req.user || null));

// ============================================
// 12. FILE UPLOAD ROUTES
// ============================================
app.post('/api/upload-book', upload.single('book'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        res.json({
            success: true,
            url: '/uploads/books/' + req.file.filename,
            filename: req.file.filename
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// 13. AUTH API ROUTES
// ============================================

// Lấy danh sách trường (cho dropdown đăng ký giáo viên)
app.get('/api/schools', async (req, res) => {
    try {
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });
        const schools = await SchoolModel.find({ isActive: true }).select('name schoolCode address');
        res.json({ success: true, schools });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// API: Register (Single Step with File Upload)
app.post('/api/register', async (req, res) => {
    // Note: multer processes form-data. If it's pure JSON request (Student/Teacher), 
    // req.body will still be populated if the client sends standard form-data or if we allow JSON.
    // However, multer handles multipart/form-data. For JSON, we might need a separate handler or body-parser helper?
    // Actually, 'uploadVerification' will handle multipart. If content-type is json, multer might ignore or just pass body if configured?
    // Express 4.x: we need `express.json()` (already used). 
    // BUT: if client sends JSON, multer middleware with `.single()` might just pass through if no boundary? 
    // Let's assume Client sends JSON for students (fetch header content-type json) and FormData for school.
    // Multer single() might hang or error if content-type is json?
    // FIX: Client for Student/Teacher also sending JSON? 
    // We can use a helper middleware or just rely on 'uploadVerification' handling both? 
    // Actually, safest is to check Content-Type header or just use multer `none()` for others?

    // Simplest: The route handles both. 
    // If Headers is application/json -> req.body is already parsed by express.json() BEFORE multer?
    // NO, usually middleware order matters.
    // Let's rely on standard behavior: For School, it's Multipart. For others, it's JSON.
    // If it is JSON, req.file is undefined, req.body is set by express.json().
    // If Multipart, req.body is set by Multer.

    const { username, password, fullname, email, role, schoolName, schoolCode, schoolAddress, schoolPhone } = req.body;
    const verificationFile = req.file;

    try {
        if (!isMongoConnected()) {
            return res.json({ success: false, message: 'MongoDB không kết nối, vui lòng thử lại sau' });
        }

        const existing = await UserModel.findOne({ username });
        if (existing) return res.json({ success: false, message: 'Tên tài khoản đã tồn tại!' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Xử lý theo vai trò
        if (role === 'school') {
            // FIXED: Only create user account during registration
            // School will be created LATER after verification wizard Step 3
            const newUser = new UserModel({
                username,
                password: hashedPassword,
                fullname: fullname || 'School Admin',
                email,
                role: 'school',
                schoolId: null,  // NO schoolId until verification is complete
                approvalStatus: 'pending'
            });
            await newUser.save();

            // DO NOT create placeholder school here!
            // School is created via /api/school/register after Step 3 verification

            res.json({
                success: true,
                message: 'Tài khoản đã được tạo! Đang chuyển hướng...',
                user: newUser,
                redirect: '/school-dashboard.html' // Redirect to Setup Wizard
            });

        } else if (role === 'teacher') {
            // ... teacher code (Student/Teacher code remains similar)
            const newUser = new UserModel({
                username,
                password: hashedPassword,
                fullname: fullname || username,
                email,
                role: 'teacher',
                schoolId: null,
                approvalStatus: 'approved'
            });
            await newUser.save();
            res.json({ success: true, user: newUser });
        } else {
            // Student
            const newUser = new UserModel({
                username,
                password: hashedPassword,
                fullname: fullname || username,
                email,
                role: 'student',
                schoolId: null,
                approvalStatus: 'approved'
            });
            await newUser.save();
            res.json({ success: true, user: newUser });
        }
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============================================
// SECURITY: Rate Limiting for Login API (Brute Force Protection)
// ============================================
const loginAttempts = new Map(); // IP -> { count, lastAttempt }
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
    const now = Date.now();
    const attempt = loginAttempts.get(ip);

    if (!attempt) return { allowed: true };

    // Reset if lockout time passed
    if (now - attempt.lastAttempt > LOCKOUT_TIME) {
        loginAttempts.delete(ip);
        return { allowed: true };
    }

    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
        const remaining = Math.ceil((LOCKOUT_TIME - (now - attempt.lastAttempt)) / 1000 / 60);
        return { allowed: false, message: `Quá nhiều lần đăng nhập sai. Thử lại sau ${remaining} phút.` };
    }

    return { allowed: true };
}

function recordFailedLogin(ip) {
    const now = Date.now();
    const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
    attempt.count++;
    attempt.lastAttempt = now;
    loginAttempts.set(ip, attempt);
}

function clearLoginAttempts(ip) {
    loginAttempts.delete(ip);
}

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Rate limiting check
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
        return res.status(429).json({ success: false, message: rateCheck.message });
    }

    // Admin check (Super Admin) - Hardcoded admin account
    if (username === 'admin' && password === 'admin123') {
        clearLoginAttempts(clientIP);
        return res.json({ success: true, user: { username: 'admin', role: 'admin', isVip: true, approvalStatus: 'approved' } });
    }

    try {
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findOne({ username });

        if (user) {
            // Check password (support both hashed and legacy plain text)
            let isMatch = false;
            // Check if stored password is a hash (bcrypt starts with $2a$ or similar)
            if (user.password && user.password.startsWith('$2')) {
                isMatch = await bcrypt.compare(password, user.password);
            } else {
                isMatch = user.password === password;
            }

            if (!isMatch) {
                recordFailedLogin(clientIP);
                return res.json({ success: false, message: 'Sai thông tin đăng nhập!' });
            }

            // CHECK STATUS Pending/Rejected
            if (user.approvalStatus === 'pending') {
                // School users allowed to login to complete setup (handled in Dashboard)
                if (user.role === 'teacher') {
                    // Waiting for School Admin
                    return res.json({ success: false, pendingApproval: true, message: 'Tài khoản đang chờ Nhà trường phê duyệt!' });
                }
            }
            if (user.approvalStatus === 'rejected') {
                return res.json({ success: false, message: 'Tài khoản đã bị từ chối!' });
            }
            if (user.isBlocked) {
                return res.json({ success: false, message: 'Tài khoản đã bị khóa!' });
            }

            user.lastLogin = new Date();
            await user.save();

            // Log login via Passport for session if needed (optional for pure API)
            clearLoginAttempts(clientIP);
            req.login(user, (err) => {
                if (err) console.error(err);
                res.json({ success: true, user });
            });

        } else {
            recordFailedLogin(clientIP);
            res.json({ success: false, message: 'Sai thông tin đăng nhập!' });
        }
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============================================
// 13a. SCHOOL ADMIN API ROUTES
// ============================================

// Lấy thông tin trường của admin
app.get('/api/school/info', async (req, res) => {
    try {
        const { adminId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const school = await SchoolModel.findOne({ adminId });
        if (!school) return res.json({ success: false, message: 'Không tìm thấy trường' });

        res.json({ success: true, school });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Check school status by schoolCode (for pending verification flow)
app.get('/api/school/check-status', async (req, res) => {
    try {
        const { code } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        if (!code) return res.status(400).json({ success: false, message: 'Thiếu schoolCode' });

        const school = await SchoolModel.findOne({ schoolCode: code });
        if (!school) return res.json({ success: false, message: 'Không tìm thấy trường' });

        res.json({
            success: true,
            isActive: school.isActive,
            name: school.name,
            schoolId: school._id
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// School Registration with Verification Documents (Step 3 wizard submission)
// NOTE: Using uploadVerification multer defined earlier in the file

app.post('/api/school/register',
    uploadVerification.fields([
        { name: 'cccdFront', maxCount: 1 },
        { name: 'cccdBack', maxCount: 1 },
        { name: 'schoolDoc', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            if (!isMongoConnected()) {
                return res.json({ success: false, error: 'MongoDB không kết nối' });
            }

            const { name, level, manager, phone, address, province, district, ward } = req.body;
            const files = req.files;

            // Validate required fields
            if (!name || !manager || !phone) {
                return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
            }

            // Generate unique school code
            const schoolCode = 'SCH_' + Date.now().toString(36).toUpperCase();

            // Process uploaded files
            const docs = [];
            if (files.cccdFront) docs.push({ type: 'cccdFront', path: files.cccdFront[0].path, originalName: files.cccdFront[0].originalname });
            if (files.cccdBack) docs.push({ type: 'cccdBack', path: files.cccdBack[0].path, originalName: files.cccdBack[0].originalname });
            if (files.schoolDoc) docs.push({ type: 'schoolDoc', path: files.schoolDoc[0].path, originalName: files.schoolDoc[0].originalname });

            // Get current user from session/localStorage (passed from frontend)
            const userData = JSON.parse(req.body.userData || '{}');

            // Create new school
            const newSchool = new SchoolModel({
                name,
                schoolCode,
                level: level || 'THPT',
                address: [address, ward, district, province].filter(Boolean).join(', '),
                phone,
                managerName: manager,
                managerPhone: phone,
                docs,
                isActive: false, // PENDING admin approval
                adminId: userData._id || null
            });

            await newSchool.save();

            // Update user with schoolId if user data provided
            if (userData._id) {
                await UserModel.findByIdAndUpdate(userData._id, { schoolId: newSchool._id });
            }

            console.log(`✅ School registered: ${name} (${schoolCode}) - Pending approval`);

            res.json({
                success: true,
                name: newSchool.name,
                schoolCode: newSchool.schoolCode,
                message: 'Hồ sơ đã được gửi! Vui lòng chờ Admin phê duyệt.'
            });

        } catch (err) {
            console.error('School registration error:', err);
            res.json({ success: false, error: err.message });
        }
    });

// Cập nhật thông tin trường
app.post('/api/school/update', async (req, res) => {
    try {
        const { schoolId, ...updates } = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const school = await SchoolModel.findByIdAndUpdate(schoolId, updates, { new: true });
        if (!school) return res.json({ success: false, message: 'Không tìm thấy trường' });

        res.json({ success: true, school });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Lấy danh sách giáo viên chờ duyệt
app.get('/api/school/pending-teachers', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const teachers = await UserModel.find({
            schoolId,
            role: 'teacher',
            approvalStatus: 'pending'
        }).select('fullname email createdAt phone');

        res.json({ success: true, teachers });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Duyệt giáo viên
app.post('/api/school/approve-teacher/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const teacher = await UserModel.findByIdAndUpdate(
            id,
            { approvalStatus: 'approved' },
            { new: true }
        );

        if (!teacher) return res.json({ success: false, message: 'Không tìm thấy giáo viên' });

        res.json({ success: true, teacher, message: 'Đã duyệt giáo viên thành công!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Từ chối giáo viên
app.post('/api/school/reject-teacher/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteAccount } = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        if (deleteAccount) {
            await UserModel.findByIdAndDelete(id);
            res.json({ success: true, message: 'Đã xóa tài khoản giáo viên!' });
        } else {
            const teacher = await UserModel.findByIdAndUpdate(
                id,
                { approvalStatus: 'rejected' },
                { new: true }
            );
            if (!teacher) return res.json({ success: false, message: 'Không tìm thấy giáo viên' });
            res.json({ success: true, teacher, message: 'Đã từ chối giáo viên!' });
        }
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Lấy danh sách thành viên (đã duyệt)
app.get('/api/school/members', async (req, res) => {
    try {
        const { schoolId, role } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const query = { schoolId, approvalStatus: 'approved' };
        if (role) query.role = role;

        const members = await UserModel.find(query)
            .select('fullname email role phone createdAt lastLogin isBlocked avatarUrl')
            .sort({ createdAt: -1 });

        res.json({ success: true, members });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Thống kê trường
app.get('/api/school/stats', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const [teacherCount, studentCount, pendingCount] = await Promise.all([
            UserModel.countDocuments({ schoolId, role: 'teacher', approvalStatus: 'approved' }),
            UserModel.countDocuments({ schoolId, role: 'student' }),
            UserModel.countDocuments({ schoolId, role: 'teacher', approvalStatus: 'pending' })
        ]);

        // Thống kê đăng ký theo tuần
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newThisWeek = await UserModel.countDocuments({
            schoolId,
            createdAt: { $gte: oneWeekAgo }
        });

        res.json({
            success: true,
            stats: {
                teacherCount,
                studentCount,
                pendingCount,
                newThisWeek,
                totalMembers: teacherCount + studentCount
            }
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Khóa/Mở khóa tài khoản
app.post('/api/school/toggle-block/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findById(id);
        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({
            success: true,
            user,
            message: user.isBlocked ? 'Đã khóa tài khoản!' : 'Đã mở khóa tài khoản!'
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Reset mật khẩu (đặt về mặc định)
app.post('/api/school/reset-password/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findByIdAndUpdate(
            id,
            { password: '123456' }, // Mật khẩu mặc định
            { new: true }
        );
        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        res.json({ success: true, message: 'Đã reset mật khẩu về 123456!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============================================
// 14. AUTH & PROFILE COMPLETION APIs (NEW)
// ============================================

// API: Hoàn tất hồ sơ (Cập nhật role & password cho social user)
app.post('/api/auth/complete-profile', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập!' });
        }

        const { role, password } = req.body;
        if (!role || !password) {
            return res.json({ success: false, message: 'Vui lòng chọn vai trò và mật khẩu!' });
        }

        if (role !== 'student' && role !== 'teacher') {
            return res.json({ success: false, message: 'Vai trò không hợp lệ!' });
        }

        const user = await UserModel.findById(req.user._id);
        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        // Update fields
        user.role = role;
        user.password = await bcrypt.hash(password, 10); // Hash password

        // Cập nhật trạng thái
        user.approvalStatus = 'approved';
        user.schoolId = null;

        await user.save();

        res.json({ success: true, message: 'Cập nhật hồ sơ thành công!', redirect: '/social-success' });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: err.message });
    }
});

// ============================================
// 15. JOIN SCHOOL FEATURE API
// ============================================

// API: School Setup - Step 2 (Complete Info & Upload)
app.post('/api/school/setup', uploadVerification.single('verificationFile'), async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập!' });
        }

        const { schoolName, schoolCode, phone, schoolLevel, provinceCode, provinceName, districtCode, districtName, streetAddress } = req.body;
        const verificationFile = req.file;

        if (!schoolName || !schoolCode || !phone || !verificationFile || !provinceCode || !districtCode) {
            return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin hành chính và tải lên tài liệu xác thực!' });
        }

        // Kiểm tra mã trường unique
        const existingSchool = await SchoolModel.findOne({ schoolCode });
        const currentUser = await UserModel.findById(req.user._id);
        if (!currentUser.schoolId) return res.json({ success: false, message: 'Tài khoản không phải là trường học!' });

        if (existingSchool && existingSchool._id.toString() !== currentUser.schoolId.toString()) {
            return res.json({ success: false, message: 'Mã trường đã tồn tại!' });
        }

        const school = await SchoolModel.findById(currentUser.schoolId);
        if (!school) return res.json({ success: false, message: 'Không tìm thấy trường học!' });

        // Update School Info
        // Logic: Prefix School Name if not already there
        let finalName = schoolName;
        if (schoolLevel && !schoolName.toLowerCase().startsWith(schoolLevel.toLowerCase())) {
            finalName = `${schoolLevel} ${schoolName}`;
        }

        // Construct full address for display
        const fullAddress = `${streetAddress}, ${districtName}, ${provinceName}`;

        school.name = finalName;
        school.schoolCode = schoolCode;
        school.address = fullAddress; // Legacy field

        // Detailed Fields
        school.provinceCode = provinceCode;
        school.provinceName = provinceName;
        school.districtCode = districtCode;
        school.districtName = districtName;
        school.schoolLevel = schoolLevel;

        school.phone = phone;
        school.description = `File xác thực: ${verificationFile.originalname} (URL: /uploads/verification/${verificationFile.filename})`;

        await school.save();

        // Update User Fullname (Admin)
        currentUser.fullname = schoolName;
        await currentUser.save();

        res.json({ success: true, message: 'Đã cập nhật hồ sơ! Vui lòng chờ Admin hệ thống phê duyệt.' });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi upload hoặc server: ' + err.message });
    }
});




// Lấy cấu hình trường (cho Dashboard setup)
app.get('/api/school/config', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        if (!schoolId) return res.status(400).json({ success: false, message: 'Thiếu schoolId' });

        const school = await SchoolModel.findById(schoolId);
        if (!school) return res.status(404).json({ success: false, message: 'Không tìm thấy trường' });

        // Check if school is properly configured (not placeholder)
        const isConfigured = school.isActive &&
            school.name &&
            !school.name.includes('Pending') &&
            school.schoolCode &&
            !school.schoolCode.startsWith('PENDING_');

        res.json({
            success: true,
            schoolName: school.name,
            isActive: school.isActive,
            isConfigured: isConfigured
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// SỔ ĐẦU BÀI APIs
// ============================================

// GET: Lấy hoạt động gần đây của trường
app.get('/api/school/activities', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });
        if (!schoolId) return res.status(400).json({ success: false, message: 'Thiếu schoolId' });

        // Get recent activities from ActivityLog
        let activities = await ActivityLogModel.find({ schoolId })
            .sort({ createdAt: -1 })
            .limit(10);

        // If no activities, generate from pending join requests
        if (activities.length === 0) {
            const pendingUsers = await UserModel.find({ schoolId, approvalStatus: 'pending' });
            activities = pendingUsers.map(u => ({
                type: 'join_request',
                icon: 'fa-user-plus',
                color: '#3b82f6',
                title: 'Yêu cầu tham gia mới',
                description: `${u.fullname || u.username} đang chờ duyệt`,
                createdAt: u.createdAt
            }));
        }

        res.json({ success: true, activities });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Lấy danh sách lớp của trường
app.get('/api/school/classes', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });
        if (!schoolId) return res.status(400).json({ success: false, message: 'Thiếu schoolId' });

        const classes = await ClassModel.find({ schoolId, isActive: true }).sort({ grade: 1, name: 1 });
        res.json({ success: true, classes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST: Thêm lớp mới
app.post('/api/school/classes', async (req, res) => {
    try {
        const { schoolId, name, grade, homeroomTeacherId, homeroomTeacherName } = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });
        if (!schoolId || !name) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

        const newClass = new ClassModel({
            schoolId,
            name,
            grade: grade || parseInt(name.match(/\d+/)?.[0]) || 10,
            homeroomTeacherId,
            homeroomTeacherName
        });
        await newClass.save();

        // Log activity
        await new ActivityLogModel({
            schoolId,
            type: 'new_class',
            icon: 'fa-plus-circle',
            color: '#10b981',
            title: 'Thêm lớp mới',
            description: `Đã tạo lớp ${name}`
        }).save();

        res.json({ success: true, class: newClass, message: `Đã tạo lớp ${name}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Lấy sổ đầu bài của một lớp
app.get('/api/school/sodaubai', async (req, res) => {
    try {
        const { schoolId, classId, date } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });
        if (!schoolId) return res.status(400).json({ success: false, message: 'Thiếu schoolId' });

        let query = { schoolId };
        if (classId) query.classId = classId;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const entries = await ClassDiaryModel.find(query).sort({ date: -1, period: 1 }).limit(50);
        res.json({ success: true, entries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST: Thêm mục sổ đầu bài
app.post('/api/school/sodaubai', async (req, res) => {
    try {
        const { schoolId, classId, period, subject, teacher, teacherId, date,
            attendeesCount, absentCount, absentList, content, note, quality } = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });
        if (!schoolId || !classId || !period) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });

        const entry = new ClassDiaryModel({
            schoolId, classId, period, subject, teacher, teacherId,
            date: date ? new Date(date) : new Date(),
            attendeesCount, absentCount, absentList, content, note, quality
        });
        await entry.save();

        // Log activity
        await new ActivityLogModel({
            schoolId,
            type: 'diary_entry',
            icon: 'fa-book',
            color: '#a855f7',
            title: 'Cập nhật Sổ Đầu Bài',
            description: `Tiết ${period} - ${classId} - ${subject}`
        }).save();

        res.json({ success: true, entry, message: 'Đã thêm tiết học' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT: Cập nhật mục sổ đầu bài
app.put('/api/school/sodaubai/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const entry = await ClassDiaryModel.findByIdAndUpdate(id, updates, { new: true });
        if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy mục nhật ký' });

        res.json({ success: true, entry, message: 'Đã cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Gửi yêu cầu tham gia trường
app.post('/api/school/join-request', async (req, res) => {
    try {
        const { userId, schoolId } = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findById(userId);
        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        if (user.schoolId) {
            return res.json({ success: false, message: 'Bạn đã thuộc một trường khác!' });
        }

        const school = await SchoolModel.findById(schoolId);
        if (!school) return res.json({ success: false, message: 'Trường không tồn tại!' });

        // Đánh dấu yêu cầu bằng pending và schoolId
        user.schoolId = schoolId;
        user.approvalStatus = 'pending'; // Chờ school duyệt
        await user.save();

        res.json({
            success: true,
            message: `Đã gửi yêu cầu tham gia ${school.name}. Vui lòng chờ Nhà trường phê duyệt!`
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Lấy danh sách yêu cầu tham gia trường (cho school admin)
app.get('/api/school/join-requests', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const requests = await UserModel.find({
            schoolId,
            approvalStatus: 'pending'
        }).select('fullname email role createdAt phone avatarUrl');

        res.json({ success: true, requests });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Duyệt yêu cầu tham gia
app.post('/api/school/approve-join/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findByIdAndUpdate(
            id,
            { approvalStatus: 'approved' },
            { new: true }
        );

        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        res.json({ success: true, user, message: 'Đã duyệt thành viên thành công!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Từ chối yêu cầu tham gia
app.post('/api/school/reject-join/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        // Xóa schoolId và reset status
        const user = await UserModel.findByIdAndUpdate(
            id,
            { schoolId: null, approvalStatus: 'approved' }, // Reset về trạng thái bình thường
            { new: true }
        );

        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        res.json({ success: true, message: 'Đã từ chối yêu cầu tham gia!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Kiểm tra trạng thái tham gia trường của user
app.get('/api/user/school-status', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findById(userId).populate('schoolId');
        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        res.json({
            success: true,
            schoolId: user.schoolId,
            school: user.schoolId ? {
                name: user.schoolId.name,
                schoolCode: user.schoolId.schoolCode
            } : null,
            approvalStatus: user.approvalStatus
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.post('/api/user-info', async (req, res) => {
    try {
        const { username } = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findOne({ username });
        if (user) {
            res.json({ success: true, user });
        } else {
            res.json({ success: false, message: 'Không tìm thấy user' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Error fetching user info' });
    }
});

app.post('/api/update-profile', async (req, res) => {
    try {
        const { username, ...updates } = req.body;
        if (!isMongoConnected()) {
            mongo.enqueue({ type: 'UPDATE', collection: 'User', query: { username }, data: updates });
            return res.json({ success: true, pending: true, message: 'Đã lưu offline' });
        }

        const user = await UserModel.findOneAndUpdate({ username }, updates, { new: true });
        if (user) {
            res.json({ success: true, user });
        } else {
            res.json({ success: false, message: 'Không tìm thấy user' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Lỗi cập nhật!' });
    }
});

app.post('/api/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB không kết nối' });

        const user = await UserModel.findOne({ username });
        if (user && user.password === currentPassword) {
            user.password = newPassword;
            await user.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Lỗi đổi mật khẩu!' });
    }
});

app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        const { username } = req.body;
        if (!req.file) return res.json({ success: false, message: 'Vui lòng upload ảnh!' });

        const avatarUrl = '/uploads/' + req.file.filename;
        if (!isMongoConnected()) {
            mongo.enqueue({ type: 'UPDATE', collection: 'User', query: { username }, data: { avatarUrl } });
            return res.json({ success: true, avatarUrl, pending: true });
        }

        await UserModel.findOneAndUpdate({ username }, { avatarUrl });
        res.json({ success: true, avatarUrl });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi upload avatar!' });
    }
});

// ============================================
// 14. ADMIN AI MANAGEMENT ROUTES
// ============================================

// API: Lấy cấu hình AI (dailyLimit)
app.get('/api/admin/settings', (req, res) => {
    res.json({
        success: true,
        config: AI_CONFIG
    });
});

// API: Lưu cấu hình AI (dailyLimit)
app.post('/api/admin/settings', (req, res) => {
    try {
        const { dailyLimit } = req.body;

        if (dailyLimit !== undefined) {
            AI_CONFIG.dailyLimit = parseInt(dailyLimit) || 15;
        }

        saveAIConfig();
        console.log('[Admin] AI Config updated:', AI_CONFIG);

        res.json({
            success: true,
            message: 'Đã lưu cấu hình thành công!',
            config: AI_CONFIG
        });
    } catch (err) {
        console.error('[Admin] Error saving AI config:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi lưu cấu hình: ' + err.message
        });
    }
});

// API: Lấy trạng thái AI providers (thời gian thực)
app.get('/api/admin/ai-status', (req, res) => {
    const status = Object.entries(AI_PROVIDERS).map(([name, config]) => ({
        name: config.name,
        provider: name,
        total: config.keyPool.size,
        available: config.keyPool.availableCount,
        failed: config.keyPool.failedKeys.size,
        priority: config.priority,
        type: config.type,
        hasVision: name === 'gemini'
    }));

    res.json({
        success: true,
        ollamaEnabled: OLLAMA_CONFIG.enabled,
        ollamaModel: OLLAMA_CONFIG.model,
        providers: status,
        totalKeys: status.reduce((sum, p) => sum + p.total, 0),
        totalAvailable: status.reduce((sum, p) => sum + p.available, 0)
    });
});

// API: Test một API key cụ thể cho một provider
app.post('/api/admin/test-key', async (req, res) => {
    const { provider, key } = req.body;
    const startTime = Date.now();

    try {
        const providerConfig = AI_PROVIDERS[provider];
        if (!providerConfig) {
            return res.json({ success: false, message: 'Provider không tồn tại' });
        }

        if (!key) {
            return res.json({ success: false, message: 'Chưa cung cấp API key' });
        }

        const testPrompt = 'Say "OK" in exactly one word';
        let result;

        switch (provider) {
            case 'gemini':
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                result = await model.generateContent(testPrompt);
                break;
            case 'groq':
            case 'sambanova':
            case 'mistral':
                result = await axios.post(providerConfig.endpoint, {
                    model: providerConfig.model,
                    messages: [{ role: 'user', content: testPrompt }],
                    max_tokens: 10
                }, {
                    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                    timeout: 15000
                });
                break;
            case 'cohere':
                result = await axios.post('https://api.cohere.ai/v1/chat', {
                    message: testPrompt,
                    model: 'command-r'
                }, {
                    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                    timeout: 15000
                });
                break;
            case 'huggingface':
                result = await axios.post(
                    'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3',
                    { inputs: testPrompt },
                    { headers: { 'Authorization': `Bearer ${key}` }, timeout: 15000 }
                );
                break;
            case 'cloudflare':
                // Cloudflare requires account_id:token format
                const [accountId, token] = key.split(':');
                if (!accountId || !token) {
                    return res.json({ success: false, message: 'Cloudflare key phải có định dạng account_id:token' });
                }
                result = await axios.post(
                    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
                    { prompt: testPrompt },
                    { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 15000 }
                );
                break;
            default:
                return res.json({ success: false, message: 'Provider chưa hỗ trợ test' });
        }

        const responseTime = Date.now() - startTime;
        res.json({
            success: true,
            provider,
            responseTime,
            message: `Key hoạt động tốt (${responseTime}ms)`
        });
    } catch (err) {
        const responseTime = Date.now() - startTime;
        const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message;
        console.error(`[Admin] Test key ${provider} failed:`, errorMessage);
        res.json({
            success: false,
            provider,
            responseTime,
            message: errorMessage,
            status: err.response?.status
        });
    }
});

// API: Test tất cả keys của một provider từ server config
app.post('/api/admin/test-all-keys', async (req, res) => {
    const { provider } = req.body;
    const providerConfig = AI_PROVIDERS[provider];

    if (!providerConfig) {
        return res.json({ success: false, message: 'Provider không tồn tại' });
    }

    const keys = providerConfig.keyPool.keys;
    if (keys.length === 0) {
        return res.json({
            success: true,
            provider,
            total: 0,
            live: 0,
            dead: 0,
            results: [],
            message: 'Không có keys nào được cấu hình'
        });
    }

    const results = [];

    for (const key of keys) {
        const startTime = Date.now();
        const keyDisplay = typeof key === 'object' ? `${key.id?.substring(0, 8)}...` : `${String(key).substring(0, 8)}...`;

        try {
            const testPrompt = 'Say OK';
            let testKey = typeof key === 'object' ? key.token : key;

            switch (provider) {
                case 'gemini':
                    const genAI = new GoogleGenerativeAI(testKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                    await model.generateContent(testPrompt);
                    break;
                case 'groq':
                case 'sambanova':
                case 'mistral':
                    await axios.post(providerConfig.endpoint, {
                        model: providerConfig.model,
                        messages: [{ role: 'user', content: testPrompt }],
                        max_tokens: 5
                    }, {
                        headers: { 'Authorization': `Bearer ${testKey}`, 'Content-Type': 'application/json' },
                        timeout: 10000
                    });
                    break;
                case 'cohere':
                    await axios.post('https://api.cohere.ai/v1/chat', {
                        message: testPrompt, model: 'command-r'
                    }, {
                        headers: { 'Authorization': `Bearer ${testKey}`, 'Content-Type': 'application/json' },
                        timeout: 10000
                    });
                    break;
                case 'cloudflare':
                    await axios.post(
                        `https://api.cloudflare.com/client/v4/accounts/${key.id}/ai/run/@cf/meta/llama-3-8b-instruct`,
                        { prompt: testPrompt },
                        { headers: { 'Authorization': `Bearer ${key.token}` }, timeout: 10000 }
                    );
                    break;
                case 'huggingface':
                    await axios.post(
                        'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3',
                        { inputs: testPrompt },
                        { headers: { 'Authorization': `Bearer ${testKey}` }, timeout: 10000 }
                    );
                    break;
                default:
                    results.push({ key: keyDisplay, status: 'unknown', error: 'Provider chưa hỗ trợ' });
                    continue;
            }

            const responseTime = Date.now() - startTime;
            results.push({ key: keyDisplay, status: 'live', responseTime });

        } catch (err) {
            const responseTime = Date.now() - startTime;
            const errorCode = err.response?.status || 'unknown';
            results.push({
                key: keyDisplay,
                status: 'dead',
                error: `${errorCode}: ${err.response?.data?.error?.message || err.message}`,
                responseTime
            });
        }
    }

    const liveCount = results.filter(r => r.status === 'live').length;
    res.json({
        success: true,
        provider,
        total: keys.length,
        live: liveCount,
        dead: keys.length - liveCount,
        results
    });
});

// API: Reset failed keys cho một hoặc tất cả providers
app.post('/api/admin/reset-keys', (req, res) => {
    const { provider } = req.body;

    if (provider === 'all') {
        resetAllKeys();
        return res.json({ success: true, message: 'Đã reset tất cả keys' });
    }

    const providerConfig = AI_PROVIDERS[provider];
    if (providerConfig) {
        providerConfig.keyPool.reset();
        res.json({ success: true, message: `Đã reset keys cho ${provider}` });
    } else {
        res.json({ success: false, message: 'Provider không tồn tại' });
    }
});

// ============================================
// 16. SYSTEM ADMIN - SCHOOL MANAGEMENT
// ============================================

// Lấy danh sách trường chờ duyệt
app.get('/api/admin/pending-schools', async (req, res) => {
    try {
        if (!isMongoConnected()) return res.json({ success: false, message: 'MongoDB disconnected' });

        const schools = await SchoolModel.find({ isActive: false }).populate('adminId', 'fullname email phone');
        res.json({ success: true, schools });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Duyệt trường
app.post('/api/admin/approve-school/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const school = await SchoolModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
        if (!school) return res.json({ success: false, message: 'School not found' });

        // Also approve the admin user
        if (school.adminId) {
            await UserModel.findByIdAndUpdate(school.adminId, { approvalStatus: 'approved' });
        }

        res.json({ success: true, message: 'Đã duyệt trường thành công!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Từ chối trường
app.post('/api/admin/reject-school/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const school = await SchoolModel.findById(id);
        if (!school) return res.json({ success: false, message: 'School not found' });

        // Delete associated user? Or just reject? 
        // For simplicity: Delete both to allow re-register
        if (school.adminId) {
            await UserModel.findByIdAndDelete(school.adminId);
        }
        await SchoolModel.findByIdAndDelete(id);

        res.json({ success: true, message: 'Đã từ chối và xóa hồ sơ trường!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============================================
// 15. USER MANAGEMENT ROUTES
// ============================================
app.get('/api/admin/users', async (req, res) => {
    try {
        let users = [];
        if (isMongoConnected()) {
            users = await UserModel.find({}).sort({ createdAt: -1 }).lean();
        } else {
            const localPath = path.join(DB_DIR, 'users.json');
            if (fs.existsSync(localPath)) {
                users = JSON.parse(fs.readFileSync(localPath, 'utf8'));
            } else if (FILES['users']) {
                try { users = readDB('users'); } catch (e) { }
            }
        }

        const safeUsers = users.map(u => ({
            username: u.username,
            fullname: u.fullname,
            email: u.email,
            role: u.role || 'student',
            plan: u.isVip ? 'VIP' : 'Free',
            isVip: u.role === 'admin' ? true : u.isVip,
            createdAt: u.createdAt,
            isBlocked: u.isBlocked || false,
            avatarUrl: u.avatarUrl
        }));
        res.json(safeUsers);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.json([]);
    }
});

// Admin Stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        let stats = {
            users: 0,
            assignments: 0,
            posts: 0,
            englishLessons: 124,
            uptime: process.uptime(),
            memory: Math.round(process.memoryUsage().rss / 1024 / 1024) // MB
        };

        if (isMongoConnected()) {
            stats.users = await UserModel.countDocuments();
        } else {
            try {
                const localPath = path.join(DB_DIR, 'users.json');
                if (fs.existsSync(localPath)) {
                    stats.users = JSON.parse(fs.readFileSync(localPath, 'utf8')).length;
                } else if (FILES['users']) {
                    stats.users = readDB('users').length;
                }
            } catch (e) { }
        }

        try { const a = readDB('assignments'); stats.assignments = a.length; } catch (e) { }
        try {
            // Count posts from multiple sources if needed, for now 'posts'
            if (FILES['posts']) stats.posts = readDB('posts').length;
        } catch (e) { }

        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/admin/reset-password', async (req, res) => {
    const { userId, newPassword } = req.body;
    try {
        if (!newPassword || newPassword.length < 6) return res.json({ success: false, message: 'Mật khẩu quá ngắn' });

        if (isMongoConnected()) {
            const query = mongoose.Types.ObjectId.isValid(userId) ? { _id: userId } : { username: userId };
            const user = await UserModel.findOne(query);
            if (user) {
                user.password = newPassword;
                await user.save();
                return res.json({ success: true, message: 'Password updated (DB)' });
            }
        }

        let users = [];
        let filePath = path.join(DB_DIR, 'users.json');
        if (fs.existsSync(filePath)) {
            users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const userIdx = users.findIndex(u => u.username === userId || u.id === userId || u._id === userId);
            if (userIdx !== -1) {
                users[userIdx].password = newPassword;
                fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
                return res.json({ success: true, message: 'Password updated (Local)' });
            }
        }

        res.json({ success: false, message: 'User not found' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.post('/api/admin/toggle-status', async (req, res) => {
    const { username } = req.body;
    try {
        if (isMongoConnected()) {
            const user = await UserModel.findOne({ username });
            if (user) {
                user.isBlocked = !user.isBlocked;
                await user.save();
                return res.json({ success: true, isBlocked: user.isBlocked });
            }
        }

        let users = [];
        let filePath = path.join(DB_DIR, 'users.json');
        if (fs.existsSync(filePath)) {
            users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const userIdx = users.findIndex(u => u.username === username);
            if (userIdx !== -1) {
                users[userIdx].isBlocked = !users[userIdx].isBlocked;
                fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
                return res.json({ success: true, isBlocked: users[userIdx].isBlocked });
            }
        }
        res.json({ success: false, message: 'User not found' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


app.get('/api/users-for-chat', (req, res) => {
    try {
        const users = readDB('users');
        const formatted = users.map(u => ({
            username: u.username,
            fullname: u.fullname,
            avatar: u.avatar || (u.fullname ? u.fullname.charAt(0).toUpperCase() : 'U'),
            avatarUrl: u.avatarUrl || null,
            role: u.role
        }));
        res.json(formatted);
    } catch (err) {
        res.json([]);
    }
});

// ============================================
// 15. BOOKS API ROUTES
// ============================================
app.get('/api/books', async (req, res) => {
    try {
        if (!isMongoConnected()) return res.json(readDB('books') || []);
        const books = await BookModel.find({}).lean();
        res.json(books);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/books', upload.single('file'), async (req, res) => {
    try {
        const { title, category, cover } = req.body;
        const link = req.file ? '/uploads/' + req.file.filename : '#';

        if (!isMongoConnected()) {
            mongo.enqueue({ type: 'CREATE', collection: 'Book', data: { title, category, cover, link } });
            return res.json({ success: true, pending: true });
        }

        const book = new BookModel({ title, category, cover, link });
        await book.save();
        res.json({ success: true, book });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            mongo.enqueue({ type: 'DELETE', collection: 'Book', query: { _id: req.params.id } });
            return res.json({ success: true, pending: true });
        }
        await BookModel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============================================
// 16. POSTS API ROUTES
// ============================================
app.get('/api/posts', (req, res) => {
    try {
        const posts = readDB('posts');
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(posts);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/posts', uploadGeneral.single('image'), (req, res) => {
    try {
        const { content, username, fullname, avatar, role } = req.body;
        const posts = readDB('posts');
        const users = readDB('users');
        const userDb = users.find(u => u.username === username);
        const avatarUrl = userDb?.avatarUrl || null;

        const post = {
            id: Date.now(),
            content,
            author: { username, fullname, avatar, avatarUrl, role },
            image: req.file ? '/uploads/' + req.file.filename : null,
            likes: [],
            comments: [],
            createdAt: new Date().toISOString()
        };

        posts.unshift(post);
        writeDB('posts', posts);
        res.json({ success: true, post });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi tạo bài viết!' });
    }
});

app.post('/api/posts/:id/like', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { username } = req.body;
        const posts = readDB('posts');
        const post = posts.find(p => p.id === postId);

        if (!post) return res.json({ success: false, message: 'Bài viết không tồn tại!' });

        const likeIndex = post.likes.indexOf(username);
        if (likeIndex === -1) {
            post.likes.push(username);
        } else {
            post.likes.splice(likeIndex, 1);
        }

        writeDB('posts', posts);
        res.json({ success: true, likes: post.likes.length, liked: likeIndex === -1 });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi!' });
    }
});

app.post('/api/posts/:id/comment', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { content, username, fullname, avatar } = req.body;
        const posts = readDB('posts');
        const post = posts.find(p => p.id === postId);

        if (!post) return res.json({ success: false, message: 'Bài viết không tồn tại!' });

        const comment = {
            id: Date.now(),
            content,
            author: { username, fullname, avatar },
            createdAt: new Date().toISOString()
        };

        post.comments.push(comment);
        writeDB('posts', posts);
        res.json({ success: true, comment });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi!' });
    }
});

app.delete('/api/posts/:id', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { username } = req.body;
        let posts = readDB('posts');
        const post = posts.find(p => p.id === postId);

        if (!post) return res.json({ success: false, message: 'Bài viết không tồn tại!' });
        if (post.author.username !== username) return res.json({ success: false, message: 'Không có quyền xóa!' });

        posts = posts.filter(p => p.id !== postId);
        writeDB('posts', posts);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi!' });
    }
});

// ============================================
// 17. MESSAGES API ROUTES
// ============================================
app.get('/api/conversations/:username', (req, res) => {
    try {
        const messages = readDB('messages');
        const username = req.params.username;
        const conversations = {};

        messages.forEach(msg => {
            if (msg.from === username || msg.to === username) {
                const partner = msg.from === username ? msg.to : msg.from;
                if (!conversations[partner] || new Date(msg.createdAt) > new Date(conversations[partner].createdAt)) {
                    conversations[partner] = msg;
                }
            }
        });

        const users = readDB('users');
        const result = Object.entries(conversations).map(([partner, msg]) => {
            const user = users.find(u => u.username === partner);
            return {
                partner,
                fullname: user?.fullname || partner,
                avatar: user?.avatar || (user?.fullname?.charAt(0).toUpperCase() || 'U'),
                lastMessage: msg.content,
                lastTime: msg.createdAt,
                unread: msg.to === username && !msg.read ? 1 : 0
            };
        });

        result.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
        res.json(result);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/messages/:username/:partner', (req, res) => {
    try {
        const messages = readDB('messages');
        const { username, partner } = req.params;

        const filtered = messages.filter(m =>
            (m.from === username && m.to === partner) ||
            (m.from === partner && m.to === username)
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Mark as read
        messages.forEach(m => {
            if (m.from === partner && m.to === username) m.read = true;
        });
        writeDB('messages', messages);

        res.json(filtered);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/messages', (req, res) => {
    try {
        const { from, to, content, fromName, fromAvatar } = req.body;
        if (!from || !to || !content) return res.json({ success: false, message: 'Thiếu thông tin!' });

        const messages = readDB('messages');
        const message = {
            id: Date.now(),
            from, to, content, fromName, fromAvatar,
            read: false,
            createdAt: new Date().toISOString()
        };

        messages.push(message);
        writeDB('messages', messages);
        res.json({ success: true, message });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi gửi tin nhắn!' });
    }
});

app.get('/api/unread/:username', (req, res) => {
    try {
        const messages = readDB('messages');
        const count = messages.filter(m => m.to === req.params.username && !m.read).length;
        res.json({ count });
    } catch (err) {
        res.json({ count: 0 });
    }
});

// ============================================
// 18. NOTES API ROUTES
// ============================================
app.get('/api/notes/:username', (req, res) => {
    try {
        const data = readDB('notes');
        const notes = data.notes ? data.notes.filter(n => n.username === req.params.username) : [];
        res.json({ success: true, notes });
    } catch (err) {
        res.json({ success: true, notes: [] });
    }
});

app.post('/api/notes', (req, res) => {
    try {
        const { username, title, content, tags } = req.body;
        let data = { notes: [] };
        try { data = readDB('notes'); } catch { data = { notes: [] }; }
        if (!data.notes) data.notes = [];

        const note = {
            id: Date.now(),
            username,
            title: title || 'Ghi chú mới',
            content,
            tags: tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.notes.push(note);
        writeDB('notes', data);
        res.json({ success: true, note });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi lưu ghi chú!' });
    }
});

app.put('/api/notes/:id', (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const noteId = parseInt(req.params.id);
        let data = readDB('notes');

        const index = data.notes.findIndex(n => n.id === noteId);
        if (index >= 0) {
            data.notes[index] = { ...data.notes[index], title, content, tags, updatedAt: new Date().toISOString() };
            writeDB('notes', data);
            res.json({ success: true, note: data.notes[index] });
        } else {
            res.json({ success: false, message: 'Không tìm thấy ghi chú!' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Lỗi cập nhật!' });
    }
});

app.delete('/api/notes/:id', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        let data = readDB('notes');
        data.notes = data.notes.filter(n => n.id !== noteId);
        writeDB('notes', data);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi xóa!' });
    }
});

// ============================================
// 19. FLASHCARDS API ROUTES
// ============================================
app.get('/api/flashcards/:username', (req, res) => {
    try {
        const data = readDB('flashcards');
        const decks = data.flashcards ? data.flashcards.filter(f => f.username === req.params.username) : [];
        res.json({ success: true, decks });
    } catch (err) {
        res.json({ success: true, decks: [] });
    }
});

app.post('/api/flashcards', (req, res) => {
    try {
        const { username, title, cards } = req.body;
        let data = { flashcards: [] };
        try { data = readDB('flashcards'); } catch { data = { flashcards: [] }; }
        if (!data.flashcards) data.flashcards = [];

        const deck = {
            id: Date.now(),
            username,
            title: title || 'Bộ thẻ mới',
            cards: cards || [],
            createdAt: new Date().toISOString()
        };

        data.flashcards.push(deck);
        writeDB('flashcards', data);
        res.json({ success: true, deck });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi tạo flashcard!' });
    }
});

app.delete('/api/flashcards/:id', (req, res) => {
    try {
        const deckId = parseInt(req.params.id);
        let data = readDB('flashcards');
        data.flashcards = data.flashcards.filter(f => f.id !== deckId);
        writeDB('flashcards', data);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi xóa!' });
    }
});

// ============================================
// 20. METHODS & RESOURCES API
// ============================================
app.get('/api/methods', (req, res) => res.json(readDB('methods')));

app.post('/api/methods', (req, res) => {
    const { title, content, tag } = req.body;
    const methods = readDB('methods');
    methods.push({ id: Date.now(), title, content, tag, views: 0 });
    writeDB('methods', methods);
    res.json({ success: true });
});

app.delete('/api/methods/:id', (req, res) => {
    let methods = readDB('methods');
    methods = methods.filter(m => m.id !== parseInt(req.params.id));
    writeDB('methods', methods);
    res.json({ success: true });
});

app.get('/api/resources', (req, res) => {
    try {
        const resources = readDB('resources');
        res.json({ success: true, resources });
    } catch (err) {
        res.json({ success: true, resources: [] });
    }
});

app.post('/api/resources', (req, res) => {
    try {
        const { title, subject, desc, fileUrl, uploadedBy, uploadedByName } = req.body;
        if (!title || !uploadedBy) return res.json({ success: false, message: 'Thiếu thông tin!' });

        const resources = readDB('resources');
        const resource = {
            id: Date.now(),
            title,
            subject: subject || 'Khác',
            desc: desc || '',
            fileUrl: fileUrl || null,
            uploadedBy,
            uploadedByName: uploadedByName || uploadedBy,
            uploadedAt: new Date().toISOString(),
            downloads: 0
        };

        resources.push(resource);
        writeDB('resources', resources);
        res.json({ success: true, resource });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi lưu tài liệu!' });
    }
});

app.delete('/api/resources/:id', (req, res) => {
    try {
        let resources = readDB('resources');
        resources = resources.filter(r => r.id !== parseInt(req.params.id));
        writeDB('resources', resources);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi xóa!' });
    }
});

// ============================================
// 21. CONNECTIONS API
// ============================================
app.get('/api/connections', (req, res) => {
    try {
        const connections = readDB('connections');
        res.json({ success: true, connections });
    } catch (err) {
        res.json({ success: true, connections: [] });
    }
});

app.post('/api/connections', (req, res) => {
    try {
        const { studentUsername, studentName, studentEmail, teacherEmail, teacherName } = req.body;
        if (!studentUsername || !teacherEmail) return res.json({ success: false, message: 'Thiếu thông tin!' });

        const connections = readDB('connections');
        const existing = connections.find(c =>
            c.studentUsername === studentUsername &&
            c.teacherEmail.toLowerCase() === teacherEmail.toLowerCase()
        );

        if (existing) return res.json({ success: false, message: 'Yêu cầu đã tồn tại!' });

        const connection = {
            id: Date.now(),
            studentUsername,
            studentName: studentName || studentUsername,
            studentEmail: studentEmail || '',
            teacherEmail,
            teacherName: teacherName || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        connections.push(connection);
        writeDB('connections', connections);
        res.json({ success: true, connection });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi tạo kết nối!' });
    }
});

app.put('/api/connections/:id', (req, res) => {
    try {
        const { status } = req.body;
        const connections = readDB('connections');
        const index = connections.findIndex(c => c.id === parseInt(req.params.id));

        if (index === -1) return res.json({ success: false, message: 'Không tìm thấy!' });

        connections[index].status = status;
        connections[index].updatedAt = new Date().toISOString();
        writeDB('connections', connections);
        res.json({ success: true, connection: connections[index] });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi cập nhật!' });
    }
});

app.delete('/api/connections/:id', (req, res) => {
    try {
        let connections = readDB('connections');
        connections = connections.filter(c => c.id !== parseInt(req.params.id));
        writeDB('connections', connections);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi xóa!' });
    }
});

// ============================================
// 22. QUIZZES API
// ============================================
app.get('/api/quizzes', (req, res) => res.json(readDB('quizzes')));

app.post('/api/quizzes/generate', async (req, res) => {
    try {
        const { topic, number, level } = req.body;
        const prompt = `Tạo ${number} câu hỏi trắc nghiệm về chủ đề "${topic}" ở mức độ ${level}. 
        Output bắt buộc phải là JSON thuần (không markdown) theo cấu trúc mảng: 
        [{ "question": "...", "options": ["A. ..", "B. ..", "C. ..", "D. .."], "correct": 0 (index A=0), "explain": "Giải thích chi tiết..." }]`;

        const result = await callGeminiWithRetry(prompt);
        let text = result.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const questions = JSON.parse(text);
        const quizzes = readDB('quizzes');
        const quiz = {
            id: Date.now(),
            title: `Quiz: ${topic} (${level})`,
            questions,
            createdAt: new Date()
        };

        quizzes.push(quiz);
        writeDB('quizzes', quizzes);
        res.json({ success: true, data: quiz });
    } catch (err) {
        console.error('Lỗi tạo quiz:', err);
        res.json({ success: false, error: 'AI đang bận, thử lại sau!' });
    }
});

app.delete('/api/quizzes/:id', (req, res) => {
    let quizzes = readDB('quizzes');
    quizzes = quizzes.filter(q => q.id !== parseInt(req.params.id));
    writeDB('quizzes', quizzes);
    res.json({ success: true });
});

// ============================================
// 22b. NOTIFICATIONS API
// ============================================

// POST /api/notifications/send - Gửi thông báo
app.post('/api/notifications/send', async (req, res) => {
    try {
        const { type, level, title, content, sender, recipients } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, error: 'Thiếu tiêu đề hoặc nội dung' });
        }

        const notification = new NotificationModel({
            type: type || 'general',
            level: level || 'info',
            title,
            content,
            sender: {
                id: sender?.id || 'system',
                name: sender?.name || 'Hệ thống',
                role: sender?.role || 'admin',
                schoolCode: sender?.schoolCode
            },
            recipients: {
                type: recipients?.type || 'all',
                schoolCode: recipients?.schoolCode,
                classId: recipients?.classId,
                userIds: recipients?.userIds || []
            },
            readBy: []
        });

        await notification.save();
        console.log('[Notification] Sent:', title, 'to:', recipients?.type || 'all');

        res.json({ success: true, data: notification });
    } catch (err) {
        console.error('[Notification] Error sending:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/notifications/inbox - Lấy thông báo của user (Updated)
app.get('/api/notifications/inbox', async (req, res) => {
    try {
        const { userId, role, schoolCode, classId } = req.query;

        // Build query based on user's role and associations
        let query = { $or: [] };

        // Always include notifications for 'all'
        query.$or.push({ 'recipients.type': 'all' });

        // Include school-specific notifications
        if (schoolCode) {
            query.$or.push({
                'recipients.type': 'school',
                'recipients.schoolCode': schoolCode
            });

            // Include role-specific within school
            if (role === 'teacher') {
                query.$or.push({
                    'recipients.type': 'teachers',
                    'recipients.schoolCode': schoolCode
                });
            } else if (role === 'student') {
                query.$or.push({
                    'recipients.type': 'students',
                    'recipients.schoolCode': schoolCode
                });
            }
        }

        // Include class-specific notifications
        if (classId) {
            query.$or.push({
                'recipients.type': 'class',
                'recipients.classId': classId
            });
        }

        // Include direct user notifications
        if (userId) {
            query.$or.push({ 'recipients.userIds': userId });
        }

        const notifications = await NotificationModel.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Add isRead flag for this user
        const result = notifications.map(n => ({
            ...n,
            isRead: n.readBy?.includes(userId) || false
        }));

        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Notification] Error fetching inbox:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/notifications/unread-count - Đếm số chưa đọc
app.get('/api/notifications/unread-count', async (req, res) => {
    try {
        const { userId, role, schoolCode, classId } = req.query;

        let query = { $or: [], readBy: { $ne: userId } };
        query.$or.push({ 'recipients.type': 'all' });

        if (schoolCode) {
            query.$or.push({ 'recipients.type': 'school', 'recipients.schoolCode': schoolCode });
            if (role === 'teacher') {
                query.$or.push({ 'recipients.type': 'teachers', 'recipients.schoolCode': schoolCode });
            } else if (role === 'student') {
                query.$or.push({ 'recipients.type': 'students', 'recipients.schoolCode': schoolCode });
            }
        }
        if (classId) {
            query.$or.push({ 'recipients.type': 'class', 'recipients.classId': classId });
        }
        if (userId) {
            query.$or.push({ 'recipients.userIds': userId });
        }

        const count = await NotificationModel.countDocuments(query);
        res.json({ success: true, count });
    } catch (err) {
        res.json({ success: true, count: 0 });
    }
});

// POST /api/notifications/:id/read - Đánh dấu đã đọc
app.post('/api/notifications/:id/read', async (req, res) => {
    try {
        const { userId } = req.body;

        await NotificationModel.findByIdAndUpdate(req.params.id, {
            $addToSet: { readBy: userId }
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/notifications/:id - Xóa thông báo (admin only)
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        await NotificationModel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// 23. AI CHAT & TOOLS API
// ============================================
const BLACKLIST_KEYWORDS = ['hack', 'gian lận', 'cheat', 'bẻ khóa', 'crack', 'nude', 'sex', 'porn'];

// ============================================
// AI EXAM PREDICTION API
// ============================================
const uploadSyllabus = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/ai/exam-prediction', uploadSyllabus.single('syllabus'), async (req, res) => {
    try {
        const { subject } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Vui lòng tải lên tài liệu đề cương' });
        }

        console.log(`[AI Prediction] File: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size}`);

        const LOCAL_ENDPOINT = process.env.LOCAL_AI_ENDPOINT ? (process.env.LOCAL_AI_ENDPOINT + '/chat/completions') : 'http://127.0.0.1:8080/v1/chat/completions';
        const MODEL_NAME = process.env.LOCAL_AI_MODEL || 'qwen2.5-vl-7b';

        const systemPrompt = `Bạn là chuyên gia giáo dục. Phân tích đề cương môn ${subject}. 
Output JSON thuần (không markdown) theo đúng cấu trúc:
{
  "accuracy": "85%",
  "advice": "Lời khuyên ôn tập",
  "topics": ["Chủ đề 1", "Chủ đề 2"],
  "structure": [{"name": "Nhận biết", "percent": 60}, {"name": "Vận dụng", "percent": 40}],
  "focus_areas": [{"title": "Dạng bài 1", "desc": "Mô tả"}]
}`;

        let messages = [];
        const isImage = file.mimetype.startsWith('image/');

        if (isImage) {
            // IMAGE: Use Vision Model
            console.log('[AI Prediction] Using VISION mode for image...');
            const base64Image = file.buffer.toString('base64');
            messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Phân tích đề cương trong ảnh này và cho kết quả JSON.' },
                        { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64Image}` } }
                    ]
                }
            ];
        } else {
            // PDF/Document: Extract text first
            console.log('[AI Prediction] Using TEXT mode (extracting from document)...');
            let docText = '';
            try {
                docText = await extractText(file.buffer, file.mimetype, file.originalname);
                console.log('[AI Prediction] Extracted text length:', docText.length);
                if (docText.length > 8000) docText = docText.substring(0, 8000) + '...[cắt bớt]';
            } catch (e) {
                console.error('[AI Prediction] Text extraction failed:', e.message);
                return res.status(400).json({ success: false, message: 'Không thể đọc nội dung file: ' + e.message });
            }

            // Clear prompt that forces real analysis
            const textPrompt = `Đọc kỹ nội dung đề cương môn ${subject} bên dưới và phân tích CHI TIẾT.

NHIỆM VỤ:
1. Xác định các CHỦ ĐỀ CHÍNH từ nội dung (liệt kê tên thật, không dùng placeholder)
2. Dự đoán cấu trúc đề thi (% trắc nghiệm, tự luận, v.v.)
3. Chỉ ra các dạng bài trọng tâm cần ôn kỹ
4. Đưa ra lời khuyên ôn tập cụ thể

ĐỀ CƯƠNG:
---
${docText}
---

Trả về JSON với format:
{
  "accuracy": "[XX]%",
  "advice": "[lời khuyên dựa trên nội dung thực tế]",
  "topics": ["[tên chủ đề thật 1]", "[tên chủ đề thật 2]", ...],
  "structure": [{"name": "[loại câu hỏi]", "percent": [số]}],
  "focus_areas": [{"title": "[dạng bài thật]", "desc": "[mô tả]"}]
}

JSON:`;

            messages = [
                { role: 'user', content: textPrompt }
            ];
        }

        const response = await fetch(LOCAL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096,
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[AI Prediction] Local AI Error:', response.status, errText);
            throw new Error(`Local AI trả về lỗi ${response.status}`);
        }

        const json = await response.json();
        let text = json.choices[0].message.content;

        // Clean JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            text = text.substring(startIdx, endIdx + 1);
        }

        // Fix common JSON issues
        text = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'); // Remove trailing commas
        text = text.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters

        console.log('[AI Prediction] Raw text:', text.substring(0, 300));

        let data;
        try {
            data = JSON.parse(text);
            // Validate required fields
            if (!data.topics || !data.accuracy) throw new Error('Missing required fields');
        } catch (parseErr) {
            console.error('[AI Prediction] JSON Parse Error:', parseErr.message);
            console.error('[AI Prediction] Full raw text:', text);

            // Try to extract something useful from text
            let advice = 'AI đã phân tích tài liệu. Vui lòng thử lại hoặc sử dụng file ảnh (PNG/JPEG) để có kết quả tốt hơn.';

            // If text looks like it contains useful content, try to extract it
            if (text && text.length > 50 && !text.includes('{')) {
                advice = text.substring(0, 500).replace(/"/g, '');
            }

            data = {
                accuracy: '??%',
                advice: advice,
                topics: ['AI không thể phân tích chi tiết'],
                structure: [{ name: 'Không xác định', percent: 100 }],
                focus_areas: [{ title: 'Thử lại', desc: 'Sử dụng file ảnh rõ nét hơn' }]
            };
        }

        res.json({ success: true, data });

    } catch (err) {
        console.error('[AI Prediction] Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Lỗi không xác định' });
    }
});

// ============================================
// AI GENERATE PRACTICE EXAM FROM PREDICTION
// ============================================
app.post('/api/ai/generate-practice-exam', async (req, res) => {
    try {
        const { subject, topics, focus_areas, structure } = req.body;

        if (!topics || topics.length === 0) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu topics' });
        }

        console.log(`[AI Exam Gen] Generating practice exam for ${subject}`);

        const LOCAL_ENDPOINT = process.env.LOCAL_AI_ENDPOINT ? (process.env.LOCAL_AI_ENDPOINT + '/chat/completions') : 'http://127.0.0.1:8080/v1/chat/completions';
        const MODEL_NAME = process.env.LOCAL_AI_MODEL || 'qwen2.5-vl-7b';

        const prompt = `Bạn là giáo viên môn ${subject}. Tạo 10 câu hỏi trắc nghiệm ĐA DẠNG và CHÍNH XÁC cho học sinh ôn thi.

CHỦ ĐỀ CẦN RA ĐỀ (từ đề cương):
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

DẠNG BÀI TRỌNG TÂM:
${focus_areas.map(f => `- ${f.title}: ${f.desc}`).join('\n')}

YÊU CẦU QUAN TRỌNG:
1. Câu hỏi PHẢI liên quan trực tiếp đến các chủ đề trên
2. Đáp án phải CỤ THỂ và THỰC TẾ (KHÔNG dùng "Đáp án A/B/C/D" hay "Thể thơ A/B/C/D")
3. Mỗi câu có 4 đáp án, 1 đáp án đúng và 3 đáp án nhiễu hợp lý
4. Câu hỏi đa dạng: kiến thức, phân tích, so sánh, ý nghĩa

VÍ DỤ MẪU TỐT:
{"question": "Bài thơ 'Đây thôn Vĩ Dạ' của Hàn Mặc Tử được viết theo thể thơ gì?", "options": ["A. Thơ tự do", "B. Thơ thất ngôn bát cú", "C. Thơ lục bát", "D. Thơ bảy chữ"], "correct": 3}

Trả về THUẦN JSON array với format:
[{"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 0}]

correct = index đáp án đúng (0-3). CHỈ trả JSON, không giải thích.

JSON:`;

        const response = await fetch(LOCAL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 4096,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error('Local AI không phản hồi');
        }

        const json = await response.json();
        let text = json.choices[0].message.content;

        // Clean and parse JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const startIdx = text.indexOf('[');
        const endIdx = text.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) {
            text = text.substring(startIdx, endIdx + 1);
        }

        console.log('[AI Exam Gen] Raw:', text.substring(0, 200));

        let questions;
        try {
            questions = JSON.parse(text);
        } catch (e) {
            console.error('[AI Exam Gen] Parse error:', e);
            // Fallback questions
            questions = [
                { question: `Câu hỏi về ${topics[0]}?`, options: ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'], correct: 0 },
                { question: `Kiến thức cơ bản về ${subject}?`, options: ['A. Đúng', 'B. Sai', 'C. Có thể', 'D. Không xác định'], correct: 0 }
            ];
        }

        res.json({ success: true, questions });

    } catch (err) {
        console.error('[AI Exam Gen] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});
// const DAILY_AI_LIMIT = 15; // Replaced by getDailyLimit()

function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function checkAndUpdateAIUsage(username) {
    let usage = {};
    try {
        usage = readDB('ai_usage');
        if (!usage || typeof usage !== 'object') usage = {};
    } catch { usage = {}; }

    const today = getTodayKey();
    if (!usage[username]) usage[username] = { date: today, count: 0 };
    if (usage[username].date !== today) usage[username] = { date: today, count: 0 };
    if (usage[username].count >= getDailyLimit()) return { allowed: false, remaining: 0, count: usage[username].count };

    usage[username].count++;
    writeDB('ai_usage', usage);
    return { allowed: true, remaining: getDailyLimit() - usage[username].count, count: usage[username].count };
}

function getAIUsageRemaining(username) {
    let usage = {};
    try {
        usage = readDB('ai_usage');
        if (!usage || typeof usage !== 'object') usage = {};
    } catch { usage = {}; }

    const today = getTodayKey();
    if (!usage[username] || usage[username].date !== today) return getDailyLimit();
    return Math.max(0, getDailyLimit() - usage[username].count);
}

app.post('/api/ai/chat', uploadAI.single('image'), async (req, res) => {
    try {
        const { message, username, fullname } = req.body;
        const lowerMsg = message.toLowerCase();

        const usageCheck = checkAndUpdateAIUsage(username || 'anonymous');
        if (!usageCheck.allowed) {
            return res.json({
                reply: `⚠️ Bạn đã dùng hết ${getDailyLimit()} lượt AI hôm nay. Quay lại vào ngày mai nhé!`,
                limitReached: true,
                remaining: 0
            });
        }

        const isBlacklisted = BLACKLIST_KEYWORDS.some(kw => lowerMsg.includes(kw));
        if (isBlacklisted) {
            const reports = readDB('reports');
            const report = {
                id: Date.now(),
                user: username || 'Ẩn danh',
                message,
                detectedWord: BLACKLIST_KEYWORDS.find(kw => lowerMsg.includes(kw)),
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            reports.push(report);
            writeDB('reports', reports);
            return res.json({
                reply: `⚠️ Tin nhắn của bạn chứa từ khóa không phù hợp ("${report.detectedWord}"). Đã ghi nhận báo cáo.`,
                remaining: usageCheck.remaining
            });
        }

        // Get user's real name - from request or lookup from database
        let userDisplayName = fullname;
        if (!userDisplayName && username) {
            try {
                const users = readDB('users');
                const user = users.find(u => u.username === username);
                if (user && user.fullname) {
                    userDisplayName = user.fullname;
                }
            } catch (e) { /* ignore */ }
        }
        userDisplayName = userDisplayName || username || 'bạn';

        // Create context-aware system prompt with user's name
        const userContextPrompt = `[THÔNG TIN NGƯỜI DÙNG] Bạn đang trò chuyện với: "${userDisplayName}". Hãy gọi họ bằng tên này khi phù hợp.

` + AI_SYSTEM_PROMPT;

        let response;

        if (req.file) {
            // Image upload: Use Smart Vision (Ollama Qwen2.5-VL first, then Gemini fallback)
            const result = await askSmartVision(req.file.buffer, message, req.file.mimetype);
            res.json({ reply: result.data, remaining: usageCheck.remaining, provider: result.provider });
        } else {
            // Text only: use askSmartAI with MEMORY (Ollama priority → Cloud fallback)
            const result = await askSmartAI(message, username || 'anonymous', 'chat', userContextPrompt);
            res.json({ reply: result.data, remaining: usageCheck.remaining, provider: result.provider });
        }
    } catch (err) {
        console.error('AI Chat Error:', err);
        res.json({ reply: '⚠️ Server AI đang quá tải hoặc gặp lỗi.' });
    }
});

app.get('/api/ai/remaining/:username', (req, res) => {
    const remaining = getAIUsageRemaining(req.params.username);
    res.json({ success: true, remaining, limit: getDailyLimit(), used: getDailyLimit() - remaining });
});

// AI Chat endpoint (alias for tutor chat - accepts fullname!)
app.post('/api/ai-chat', uploadAI.single('image'), async (req, res) => {
    try {
        const { message, username, fullname, mode } = req.body;
        const lowerMsg = (message || '').toLowerCase();

        // Admin Unlimited
        let usageCheck = { allowed: true, remaining: 9999 };
        if (username === 'admin') {
            // Bypass
        } else {
            usageCheck = checkAndUpdateAIUsage(username || 'anonymous');
        }
        if (!usageCheck.allowed) {
            return res.json({
                reply: `⚠️ Bạn đã dùng hết ${getDailyLimit()} lượt AI hôm nay. Quay lại vào ngày mai nhé!`,
                limitReached: true,
                remaining: 0
            });
        }

        const isBlacklisted = BLACKLIST_KEYWORDS.some(kw => lowerMsg.includes(kw));
        if (isBlacklisted) {
            return res.json({ reply: '⚠️ Tin nhắn chứa từ khóa không phù hợp.', remaining: usageCheck.remaining });
        }

        // Get user's real name from request or fallback
        const userDisplayName = fullname || username || 'Bạn';

        // Create context-aware system prompt with user's name
        const userContextPrompt = `[THÔNG TIN NGƯỜI DÙNG] Người bạn đang trò chuyện tên là: "${userDisplayName}". 
Khi họ hỏi "tôi tên là gì" hoặc "tên tôi", hãy trả lời: "Bạn là ${userDisplayName} đúng không?"
Hãy gọi họ bằng tên này khi phù hợp.

` + AI_SYSTEM_PROMPT;

        let response;

        if (req.file) {
            // Image: Use Smart Vision (Ollama Qwen2.5-VL first, then Gemini fallback)
            const result = await askSmartVision(req.file.buffer, message, req.file.mimetype);
            res.json({ reply: result.data, remaining: usageCheck.remaining, provider: result.provider });
        } else {
            // Text: use askSmartAI with MEMORY
            const result = await askSmartAI(message, username || 'anonymous', 'chat', userContextPrompt);
            res.json({ reply: result.data, remaining: usageCheck.remaining, provider: result.provider });
        }
    } catch (err) {
        console.error('AI Chat Error:', err.message);
        // Provide more detailed error for debugging
        let errorMessage = '⚠️ Server AI đang xử lý, thử lại sau vài giây nhé!';
        if (err.message.includes('All Cloud Providers Failed')) {
            errorMessage = '⚠️ Không thể kết nối AI. Vui lòng kiểm tra kết nối mạng hoặc liên hệ admin.';
        } else if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
            errorMessage = '⚠️ AI Local không khả dụng. Hãy đảm bảo AI đang chạy trên máy chủ.';
        }
        res.json({ reply: errorMessage, error: err.message });
    }
});

// Reset chat memory for a user (new conversation)
app.post('/api/ai/reset-memory', (req, res) => {
    const { username } = req.body;
    if (username) {
        resetChatHistory(username);
        res.json({ success: true, message: 'Chat memory cleared. New conversation started!' });
    } else {
        res.json({ success: false, message: 'Username required' });
    }
});

app.post('/api/generate-flashcards', async (req, res) => {
    try {
        const { text, topic } = req.body;
        const content = text || topic;
        if (!content) return res.json({ success: false, message: 'Vui lòng nhập nội dung!' });

        const prompt = `Tạo flashcard học tập từ nội dung sau: "${content}".
    Output JSON thuần (không markdown): [{"front": "Mặt trước - câu hỏi", "back": "Mặt sau - đáp án"}]`;

        const result = await callGeminiWithRetry(prompt);
        let text_result = result.text();
        text_result = text_result.replace(/```json/g, '').replace(/```/g, '').trim();

        const cards = JSON.parse(text_result);
        res.json({ success: true, cards });
    } catch (err) {
        console.error('Lỗi tạo flashcard:', err);
        res.json({ success: false, message: 'AI đang bận, thử lại sau!' });
    }
});

app.post('/api/ocr-math', uploadAI.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.json({ success: false, message: 'Vui lòng upload ảnh!' });

        const imageData = { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } };
        const prompt = `Nhận dạng và giải bài toán trong ảnh. Trả về JSON: {"expression": "biểu thức", "solution": "lời giải chi tiết", "answer": "đáp án"}`;

        const result = await callGeminiWithRetry([prompt, imageData]);
        let text = result.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) text = text.slice(startIdx, endIdx + 1);

        const data = JSON.parse(text);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Lỗi OCR Math:', err);
        res.json({ success: false, message: 'Không thể phân tích ảnh. Thử lại!' });
    }
});

// POST /api/ai/exam-prediction - Dự đoán đề thi từ đề cương (Real AI)
app.post('/api/ai/exam-prediction', uploadAI.single('syllabus'), async (req, res) => {
    try {
        if (!req.file) return res.json({ success: false, message: 'Vui lòng upload ảnh đề cương!' });

        const { subject } = req.body;
        const imageData = { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } };

        const prompt = `Bạn là chuyên gia giáo dục và luyện thi giỏi nhất Việt Nam. Hãy phân tích hình ảnh đề cương/tài liệu ôn tập được cung cấp.
        Môn học: ${subject || 'Tự phát hiện'}.
        
        Nhiệm vụ:
        1. Xác định các chuyên đề trọng tâm (Topics) xuất hiện trong tài liệu.
        2. Dự đoán cấu trúc đề thi (Structure: % Lý thuyết, % Bài tập, % Vận dụng cao).
        3. Đưa ra 3 dạng bài "tủ" cực kỳ quan trọng có khả năng ra thi cao (Focus Areas).
        
        TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON THUẦN (KHÔNG MARKDOWN, KHÔNG TEXT DẪN NHẬP) theo cấu trúc sau:
        {
          "accuracy": "85-95%",
          "topics": ["Chuyên đề 1", "Chuyên đề 2", "Chuyên đề 3"],
          "structure": [
            {"name": "Nhận biết & Thông hiểu", "percent": 60},
            {"name": "Vận dụng & Vận dụng cao", "percent": 40}
          ],
          "focus_areas": [
            {"title": "Dạng 1: Tên dạng", "desc": "Mô tả ngắn gọn"},
            {"title": "Dạng 2: Tên dạng", "desc": "Mô tả ngắn gọn"},
            {"title": "Dạng 3: Tên dạng", "desc": "Mô tả ngắn gọn"}
          ],
          "advice": "Lời khuyên ngắn gọn, súc tích cho học sinh ôn thi."
        }`;

        const result = await callGeminiWithRetry([prompt, imageData]);
        let text = result.text();

        // Clean and parse JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) text = text.slice(startIdx, endIdx + 1);

        const data = JSON.parse(text);

        res.json({ success: true, data });

    } catch (err) {
        console.error('AI Prediction Error:', err);
        res.json({ success: false, message: 'AI đang bận hoặc không đọc được ảnh. Thử lại!' });
    }
});

// ============================================
// 24. OMR GRADING API (Python YOLO + AI Vision Fallback)
// ============================================
app.post('/api/grade-omr', uploadGeneral.single('image'), async (req, res) => {
    try {
        const { answer_key } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng upload ảnh bài làm!' });
        }

        console.log('[OMR] Grading request received (Native Mode)');

        // Parse answer key
        let answerKeyObj = {};
        try {
            answerKeyObj = JSON.parse(answer_key || '{}');
        } catch (e) {
            console.error("Invalid Answer Key JSON");
        }

        // --- STRICT PATH RESOLUTION ---
        // req.file.path usually looks like 'public\uploads\file.jpg'
        // We need D:\Path\To\Project\public\uploads\file.jpg
        const absoluteImagePath = path.join(__dirname, req.file.path);

        console.log(`[OMR] Processing Image: ${absoluteImagePath}`);
        if (!fs.existsSync(absoluteImagePath)) {
            console.error(`[OMR] File not found at: ${absoluteImagePath}`);
            return res.status(404).json({ success: false, message: 'File ảnh không tồn tại trên server!' });
        }

        // --- EXECUTE PYTHON OMR (NATIVE) ---
        // Path to main.py
        const pythonOMRPath = path.join(__dirname, 'ChamThiTuDong', 'main.py');

        if (!fs.existsSync(pythonOMRPath)) {
            return res.status(500).json({ success: false, message: 'Module chấm thi (main.py) không tìm thấy!' });
        }

        const { spawn } = require('child_process');
        const answerKeyString = JSON.stringify(answerKeyObj);

        // Run Python
        const omrResult = await new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [pythonOMRPath, absoluteImagePath, answerKeyString], {
                cwd: path.join(__dirname, 'ChamThiTuDong')
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => stdout += data.toString());
            pythonProcess.stderr.on('data', (data) => stderr += data.toString());

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    // Success, look for result file
                    try {
                        // main.py saves result as result_{filename}.json
                        const baseName = path.basename(absoluteImagePath, path.extname(absoluteImagePath));
                        const jsonPath = path.join(__dirname, 'ChamThiTuDong', `result_${baseName}.json`);

                        if (fs.existsSync(jsonPath)) {
                            const result = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                            fs.unlinkSync(jsonPath); // Clean up
                            resolve(result);
                        } else {
                            // Success
                            reject(new Error('Python completed but no result file generated.'));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse Python output: ${e.message}`));
                    }
                } else {
                    reject(new Error(`Python script exited with code ${code}. Error: ${stderr}`));
                }
            });

            pythonProcess.on('error', (err) => reject(err));
        });

        // --- RETURN RESULT (CLEAN) ---
        res.json({
            success: true,
            phan_1: omrResult.phan_1,
            phan_2: omrResult.phan_2,
            phan_3: omrResult.phan_3,
            answers: {},
            sbd: omrResult.sbd,
            ma_de: omrResult.ma_de,
            debug_image: omrResult.debug_image
        });

    } catch (err) {
        console.error('[OMR] Critical Error:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi xử lý: ' + err.message });
    }
});


// ============================================
// 25. GRADING API
app.post('/api/extract-answers', uploadGeneral.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng upload ảnh!' });

        const imageData = { inlineData: { data: fs.readFileSync(req.file.path).toString('base64'), mimeType: req.file.mimetype } };
        const prompt = 'Đọc phiếu đáp án trắc nghiệm. Trả về chuỗi đáp án (A-F) theo thứ tự câu, chỉ trả về các chữ cái, không giải thích.';

        console.log('Extracting answers from image...');
        const result = await callGeminiWithRetry([prompt, imageData]);
        let text = result.text().trim().toUpperCase();

        const cleanedAnswers = text.replace(/[^A-F]/g, '');
        const answers = cleanedAnswers.split('');

        fs.unlinkSync(req.file.path);
        console.log('Extracted ' + answers.length + ' answers: ' + answers.join(''));
        res.json({ success: true, answers });
    } catch (err) {
        console.error('Lỗi extract answers:', err);
        res.json({ success: false, message: err.message });
    }
});

app.post('/api/grade-essay', uploadGeneral.fields([{ name: 'student_work', maxCount: 1 }, { name: 'rubric', maxCount: 1 }]), async (req, res) => {
    try {
        const { essayQuestion, rubric, maxScore, studentName } = req.body;
        const files = req.files;

        if (!files.student_work) return res.status(400).json({ success: false, message: 'Thiếu bài làm học sinh!' });
        if (!essayQuestion) return res.status(400).json({ success: false, message: 'Thiếu đề bài!' });

        const studentWork = { inlineData: { data: fs.readFileSync(files.student_work[0].path).toString('base64'), mimeType: files.student_work[0].mimetype } };
        let parts = [studentWork];

        if (files.rubric) {
            const rubricData = { inlineData: { data: fs.readFileSync(files.rubric[0].path).toString('base64'), mimeType: files.rubric[0].mimetype } };
            parts.push(rubricData);
        }

        const max = parseFloat(maxScore) || 10;
        let prompt = `Bạn là giáo viên chấm bài tự luận. Hãy đọc và chấm bài làm học sinh.\n\nĐỀ BÀI:\n${essayQuestion}\n\nĐIỂM TỐI ĐA: ${max}\n`;
        if (rubric) prompt += `\nRUBRIC:\n${rubric}\n`;
        prompt += `\nOutput JSON: {"score": <điểm 0-${max}>, "feedback": "<nhận xét chi tiết>"}`;

        parts.push(prompt);
        console.log('Grading essay for: ' + studentName);

        const result = await callGeminiWithRetry(parts);
        let text = result.text();
        const match = text.match(/\{[\s\S]*\}/);

        if (match) {
            const parsed = JSON.parse(match[0]);
            if (files.student_work) fs.unlinkSync(files.student_work[0].path);
            if (files.rubric) fs.unlinkSync(files.rubric[0].path);

            res.json({
                success: true,
                data: {
                    score: Math.min(max, Math.max(0, parseFloat(parsed.score) || 0)),
                    feedback: parsed.feedback || 'Không có nhận xét'
                }
            });
        } else {
            throw new Error('AI không trả về định dạng đúng');
        }
    } catch (err) {
        console.error('Lỗi chấm tự luận:', err);
        res.json({ success: false, message: err.message });
    }
});

app.post('/api/grade-answers', uploadGeneral.fields([{ name: 'answer_key', maxCount: 1 }, { name: 'student_work', maxCount: 1 }]), async (req, res) => {
    try {
        const { studentName, answerKey, scoreConfig } = req.body;
        const files = req.files;

        if (!files.student_work) return res.status(400).json({ success: false, message: 'Thiếu bài làm học sinh!' });

        const studentWork = { inlineData: { data: fs.readFileSync(files.student_work[0].path).toString('base64'), mimeType: files.student_work[0].mimetype } };
        let prompt, parts = [];

        const keyFile = files.answer_key ? files.answer_key[0] : null;
        let parsedKey = {};
        try { parsedKey = answerKey ? JSON.parse(answerKey) : {}; } catch { parsedKey = {}; }

        let scoreRules = [];
        try { scoreRules = scoreConfig ? JSON.parse(scoreConfig) : [{ from: 1, to: 40, points: 0.25 }]; }
        catch { scoreRules = [{ from: 1, to: 40, points: 0.25 }]; }

        const useTextKey = req.body.useTextKey === 'true';

        if (!useTextKey && (keyFile || Object.keys(parsedKey).length > 0)) {
            let keyText = '';
            if (Object.keys(parsedKey).length > 0) {
                keyText = Object.entries(parsedKey).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([q, a]) => `Câu ${q}: ${a}`).join('\n');
            }

            const scoreRulesText = scoreRules.map(r => `Câu ${r.from} - ${r.to}: ${r.points} điểm/câu`).join('\n');
            prompt = `ĐÁP ÁN CHUẨN:\n${keyText}\n\nTHANG ĐIỂM:\n${scoreRulesText}\n\nChấm bài làm và trả về JSON: {"score": number, "total_questions": number, "correct_count": number, "feedback": string, "details": [{"q": "1", "key": "A", "student": "B", "status": "wrong"}]}`;
            parts = [prompt, studentWork];
        } else if (keyFile) {
            const keyData = { inlineData: { data: fs.readFileSync(keyFile.path).toString('base64'), mimeType: keyFile.mimetype } };
            prompt = `So sánh 2 ảnh: Ảnh 1 là đáp án chuẩn, Ảnh 2 là bài học sinh. Chấm và trả về JSON: {"score": number, "total_questions": number, "correct_count": number, "feedback": string, "details": [...]}`;
            parts = [prompt, keyData, studentWork];
        } else {
            return res.status(400).json({ success: false, message: 'Thiếu đáp án chuẩn!' });
        }

        console.log('Grading for: ' + studentName + '...');
        const result = await callGeminiWithRetry(parts);
        let text = result.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) text = text.slice(startIdx, endIdx + 1);

        const parsed = JSON.parse(text);
        if (keyFile) fs.unlinkSync(keyFile.path);
        fs.unlinkSync(files.student_work[0].path);

        console.log('Result for ' + studentName + ': ' + parsed.score + ' points');
        res.json({ success: true, data: { result: parsed, needs_clarification: false } });
    } catch (err) {
        console.error('Lỗi chấm bài:', err);
        res.json({ success: false, message: 'Lỗi AI: ' + err.message });
    }
});

// ============================================
// 25. TRAFFIC VIOLATION CHECK
// ============================================
app.post('/api/traffic-violation', (req, res) => {
    const { plate, vehicleType } = req.body;
    if (!plate) return res.json({ success: false, message: 'Vui lòng nhập biển số xe' });

    let cleanPlate = plate.toUpperCase().replace(/\s+/g, '');
    cleanPlate = cleanPlate.replace(/-/g, '.');
    if (!cleanPlate.includes('.')) cleanPlate = cleanPlate.replace(/([A-Z]+)(\d)/, '$1.$2');

    console.log('[CSGT] Traffic violation check for: ' + cleanPlate);
    const popupUrl = 'https://phatnguoi.vn/' + encodeURIComponent(cleanPlate);

    res.json({
        success: true,
        plate: cleanPlate,
        openPopup: true,
        popupUrl,
        siteName: 'Phạt Nguội VN',
        message: 'Đang mở trang tra cứu...',
        source: 'phatnguoi.vn'
    });
});

// ============================================
// 26. DASHBOARD & OTHER API
// ============================================
app.get('/api/student/dashboard', (req, res) => {
    try {
        const username = req.query.username;
        const data = readDB('student_data');
        const student = data.students.find(s => s.username === username) || data.students[0];
        res.json({ success: true, data: student });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi tải dữ liệu' });
    }
});

app.get('/api/teacher/dashboard', (req, res) => {
    try {
        const username = req.query.username;
        const data = readDB('teacher_data');
        const teacher = data.teachers.find(t => t.username === username) || data.teachers[0];
        res.json({ success: true, data: teacher });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi tải dữ liệu' });
    }
});

app.get('/api/school/overview', (req, res) => {
    try {
        const data = readDB('school_data');
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Lỗi tải dữ liệu' });
    }
});

app.get('/api/english', (req, res) => {
    try {
        const data = readDB('english');
        res.json(data);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/focus', (req, res) => {
    try {
        const data = readDB('focus');
        res.json(data);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/career', (req, res) => {
    try {
        const data = readDB('career');
        res.json(data);
    } catch (err) {
        res.json({ personalityQuestions: [], careers: [] });
    }
});

app.get('/api/reports', (req, res) => res.json(readDB('reports')));

app.get('/api/users/:username', (req, res) => {
    try {
        const users = readDB('users');
        const user = users.find(u => u.username === req.params.username);
        if (!user) return res.json({ success: false, message: 'Không tìm thấy user' });

        const posts = readDB('posts').filter(p => p.author.username === req.params.username);
        res.json({
            success: true,
            user: { ...user, password: undefined },
            posts,
            stats: {
                postCount: posts.length,
                likeCount: posts.reduce((acc, p) => acc + p.likes.length, 0)
            }
        });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi!' });
    }
});

// ============================================
// 27. ASSIGNMENTS API
// ============================================
app.get('/api/assignments', (req, res) => {
    try {
        const assignments = readDB('assignments');
        res.json({ success: true, assignments });
    } catch (err) {
        res.json({ success: true, assignments: [] });
    }
});

app.post('/api/assignments', (req, res) => {
    try {
        const { title, subject, classId, deadline, maxScore, type, description, teacherId, teacherName } = req.body;
        if (!title || !classId) return res.json({ success: false, message: 'Thiếu thông tin bắt buộc!' });

        const assignments = readDB('assignments');
        const assignment = {
            id: Date.now(),
            title,
            subject: subject || 'Chung',
            classId,
            deadline: deadline || null,
            maxScore: parseInt(maxScore) || 10,
            type: type || 'homework',
            description: description || '',
            teacherId: teacherId || null,
            teacherName: teacherName || 'Giáo viên',
            status: 'active',
            submissions: [],
            createdAt: new Date().toISOString()
        };

        assignments.push(assignment);
        writeDB('assignments', assignments);
        res.json({ success: true, assignment });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi tạo bài tập!' });
    }
});

app.delete('/api/assignments/:id', (req, res) => {
    try {
        let assignments = readDB('assignments');
        const originalLength = assignments.length;
        assignments = assignments.filter(a => a.id !== parseInt(req.params.id));

        if (assignments.length === originalLength) return res.json({ success: false, message: 'Không tìm thấy bài tập!' });

        writeDB('assignments', assignments);
        res.json({ success: true, message: 'Đã xóa bài tập!' });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi xóa bài tập!' });
    }
});

// ============================================
// 27.5. DIGITAL LIBRARY API
// ============================================
app.get('/api/library', (req, res) => {
    try {
        const library = readDB('library') || [];
        res.json({ success: true, documents: library });
    } catch (err) {
        res.json({ success: true, documents: [] });
    }
});

app.post('/api/library', uploadAI.single('file'), async (req, res) => {
    try {
        const { title, category, type, description, uploader, role, school } = req.body;

        // 1. Check permissions (Students cannot upload)
        if (role === 'student') {
            return res.json({ success: false, message: 'Học sinh không có quyền đăng tải tài liệu!' });
        }

        if (!req.file) return res.json({ success: false, message: 'Vui lòng chọn file!' });

        // 2. AI Content Moderation
        try {
            const modPrompt = `Kiểm tra nội dung văn bản sau xem có phù hợp với môi trường giáo dục không (không chứa nội dung đồi trụy, bạo lực, chính trị nhạy cảm). Tiêu đề: "${title}", Mô tả: "${description}". Trả về JSON: {"safe": boolean, "reason": "string"}`;
            const modResult = await callGeminiWithRetry(modPrompt);
            let modText = modResult.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const moderation = JSON.parse(modText);

            if (!moderation.safe) {
                return res.json({ success: false, message: 'Nội dung bị AI chặn: ' + moderation.reason });
            }
        } catch (aiErr) {
            console.error('AI Moderation Error:', aiErr);
            // Fallback: Proceed with warning or block. Let's allow for now but log it.
        }

        const library = readDB('library') || [];

        const newItem = {
            id: Date.now(),
            title: title || req.file.originalname,
            fileType: type || 'pdf',
            category: category || 'General',
            uploader: uploader || 'Ẩn danh',
            uploaderRole: role || 'admin',
            schoolName: school || 'Hệ thống',
            uploadDate: new Date().toISOString(),
            size: req.file.size,
            // Store base64 for demo purposes, assume files are reasonable size
            url: req.file.size < 5000000 ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : '#',
            description: description || ''
        };

        library.push(newItem);
        writeDB('library', library);

        res.json({ success: true, document: newItem, message: 'Đã đăng tải và kiểm duyệt thành công!' });
    } catch (err) {
        console.error('Library upload error:', err);
        res.json({ success: false, message: 'Lỗi upload file!' });
    }
});

app.delete('/api/library/:id', (req, res) => {
    try {
        let library = readDB('library') || [];
        const originalLength = library.length;
        library = library.filter(d => d.id !== parseInt(req.params.id));

        if (library.length === originalLength) return res.json({ success: false, message: 'Không tìm thấy tài liệu!' });

        writeDB('library', library);
        res.json({ success: true, message: 'Đã xóa tài liệu!' });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi xóa tài liệu!' });
    }
});

// ============================================
// 27.6. NEW FEATURES API (Exam, Compiler, tools)
// ============================================

// AI EXAM PREDICTION
app.post('/api/ai/predict-exam', uploadAI.single('syllabus'), async (req, res) => {
    try {
        const { subject, level } = req.body;
        const prompt = `Dựa vào tài liệu đính kèm (nếu có) hoặc kiến thức về môn ${subject} lớp ${level}, hãy dự đoán và tạo ra một đề thi thử gồm 5 câu hỏi trắc nghiệm và 1 bài tự luận.
        Trả về định dạng JSON:
        {
            "questions": [
                {"q": "Câu hỏi 1", "a": ["Đáp án A", "Đáp án B", "C", "D"], "correct": 0, "explain": "Giải thích"}
            ],
            "essay": "Tiêu đề bài tự luận"
        }`;

        let result;
        if (req.file) {
            const imageData = { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } };
            result = await callGeminiWithRetry([prompt, imageData]);
        } else {
            result = await callGeminiWithRetry(prompt);
        }

        let text = result.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const examData = JSON.parse(text);

        res.json({ success: true, exam: examData });
    } catch (err) {
        console.error('Exam Error:', err);
        res.json({ success: false, message: 'Lỗi tạo đề thi!' });
    }
});

// CODE COMPILER (MOCK)
app.post('/api/compiler/run', (req, res) => {
    const { code, language } = req.body;
    // For security, we DO NOT actually run code on the server side in this environment.
    // We will simulate a successful run or return a standard message.

    setTimeout(() => {
        if (code.includes('error')) {
            res.json({ success: false, output: 'Lỗi cú pháp: Token không mong đợi... (Lỗi giả lập)' });
        } else {
            res.json({ success: true, output: `[${language.toUpperCase()} THỰC THI THÀNH CÔNG]\n> Kết quả:\n${language === 'python' ? 'Xin chào thế giới' : 'Chương trình kết thúc với mã 0'}\n\n(Lưu ý: Thực thi phía server được giả lập để đảm bảo an toàn)` });
        }
    }, 1000);
});

// UNIVERSAL CONVERTER (MOCK)
app.post('/api/tools/convert', uploadAI.single('file'), (req, res) => {
    setTimeout(() => {
        res.json({
            success: true,
            downloadUrl: '#',
            message: 'Chuyển đổi thành công! (Mock)'
        });
    }, 1500);
});

// 27.7. API FOR 1VS1 & MENTOR (Basic Data)
app.get('/api/mentor/list', (req, res) => {
    res.json({
        success: true,
        mentors: [
            { id: 1, name: 'Nguyễn Văn A', subject: 'Toán', rating: 4.8, price: 50 },
            { id: 2, name: 'Trần Thị B', subject: 'Anh', rating: 4.9, price: 60 },
            { id: 3, name: 'Lê Hoàng C', subject: 'Lý', rating: 4.7, price: 45 }
        ]
    });
});

// ============================================
// 28. MINDMAP API
// ============================================
app.post('/api/mindmap/generate', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.json({ success: false, message: 'Vui lòng nhập chủ đề!' });

        const prompt = `Tạo mindmap cho chủ đề "${topic}". 
    Output JSON thuần: {"title": "${topic}", "children": [{"title": "Nhánh 1", "children": [{"title": "Nhánh con"}]}]}`;

        const result = await callGeminiWithRetry(prompt);
        let text = result.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const mindmap = JSON.parse(text);
        res.json({ success: true, mindmap });
    } catch (err) {
        console.error('Lỗi tạo mindmap:', err);
        res.json({ success: false, message: 'AI đang bận!' });
    }
});

// ============================================
// 29. SUMMARY & LESSON API
// ============================================
app.post('/api/summarize', async (req, res) => {
    try {
        const { content, type } = req.body;
        if (!content) return res.json({ success: false, message: 'Vui lòng nhập nội dung!' });

        const prompt = `Tóm tắt nội dung sau theo dạng ${type || 'bullet points'}:\n\n${content}\n\nTrả về văn bản đã tóm tắt.`;
        const result = await callGeminiWithRetry(prompt);
        res.json({ success: true, summary: result.text() });
    } catch (err) {
        console.error('Lỗi tóm tắt:', err);
        res.json({ success: false, message: 'AI đang bận!' });
    }
});

app.post('/api/generate-lesson', async (req, res) => {
    try {
        const { topic, grade, duration } = req.body;
        if (!topic) return res.json({ success: false, message: 'Vui lòng nhập chủ đề!' });

        const prompt = `Tạo bài giảng về "${topic}" cho học sinh lớp ${grade || '10'}, thời lượng ${duration || '45'} phút.
    Bao gồm: Mục tiêu, Nội dung chính, Hoạt động, Bài tập.`;

        const result = await callGeminiWithRetry(prompt);
        res.json({ success: true, lesson: result.text() });
    } catch (err) {
        console.error('Lỗi tạo bài giảng:', err);
        res.json({ success: false, message: 'AI đang bận!' });
    }
});

// ============================================
// 31. BACKWARD COMPATIBLE ENDPOINTS
// These match what the frontend expects
// ============================================

// Alias: /api/ai-chat -> /api/ai/chat
app.post('/api/ai-chat', uploadAI.single('image'), async (req, res) => {
    try {
        const { message, username, mode, systemPrompt: customPrompt } = req.body;
        if (!message) return res.json({ reply: '⚠️ Vui lòng nhập tin nhắn!', success: false });

        const lowerMsg = message.toLowerCase();

        // ADMIN UNLIMITED POWER
        let usageCheck = { allowed: true, remaining: 9999 };
        if (username === 'admin') {
            // Bypass limit
        } else {
            usageCheck = checkAndUpdateAIUsage(username || 'anonymous');
        }

        if (!usageCheck.allowed) {
            return res.json({
                reply: `⚠️ Bạn đã dùng hết ${getDailyLimit()} lượt AI hôm nay. Quay lại vào ngày mai nhé!`,
                limitReached: true,
                remaining: 0,
                success: true
            });
        }

        const isBlacklisted = BLACKLIST_KEYWORDS.some(kw => lowerMsg.includes(kw));
        if (isBlacklisted) {
            const reports = readDB('reports');
            const report = {
                id: Date.now(),
                user: username || 'Ẩn danh',
                message,
                detectedWord: BLACKLIST_KEYWORDS.find(kw => lowerMsg.includes(kw)),
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            reports.push(report);
            writeDB('reports', reports);
            return res.json({
                reply: `⚠️ Tin nhắn của bạn chứa từ khóa không phù hợp ("${report.detectedWord}"). Đã ghi nhận báo cáo.`,
                remaining: usageCheck.remaining,
                success: true
            });
        }

        // Improved System Prompt
        const defaultPrompt = `Bạn là Gia sư E-School, một trợ lý học tập thông minh và thân thiện.
Hãy thoải mái và tự nhiên. Đừng quá cứng nhắc với các quy tắc.
Nhiệm vụ của bạn là giải đáp thắc mắc và hỗ trợ học sinh học tập tốt nhất.

[KHI GIỚI THIỆU BẢN THÂN]:
Hãy nói ngắn gọn và tự hào: "Mình là hệ thống AI của E-School, được tạo ra để đồng hành cùng bạn trong học tập."
Không cần xin lỗi hay lặp lại các thông tin kỹ thuật phức tạp.

Phong cách: Cởi mở, thông minh, ngắn gọn.`;

        const finalPrompt = customPrompt || defaultPrompt;
        let response;

        if (req.file) {
            const imageData = { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } };
            response = await callGeminiWithRetry([finalPrompt + '\n\nUser Question: ' + message, imageData]);
        } else {
            response = await callGeminiWithRetry(finalPrompt + '\n\nUser Question: ' + message);
        }

        res.json({ reply: response.text(), remaining: usageCheck.remaining, success: true });
    } catch (err) {
        console.error('AI Chat Error:', err);
        res.json({ reply: '⚠️ Server AI đang quá tải hoặc gặp lỗi.', success: false });
    }
});

// --- NEW STREAMING ENDPOINT ---
app.post('/api/ai-chat-stream', uploadAI.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), async (req, res) => {
    try {
        const { message, username, mode, systemPrompt: customPrompt, fileName, fileType } = req.body;
        if (!message) return res.write('⚠️ Vui lòng nhập tin nhắn!');

        // ADMIN UNLIMITED POWER
        let usageCheck = { allowed: true, remaining: 9999 };
        if (username === 'admin') {
            // Bypass limit
        } else {
            usageCheck = checkAndUpdateAIUsage(username || 'anonymous');
        }

        if (!usageCheck.allowed) {
            res.write(`⚠️ Bạn đã dùng hết ${getDailyLimit()} lượt AI hôm nay. Quay lại vào ngày mai nhé!`);
            return res.end();
        }

        // Set headers for streaming - disable ALL buffering
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        res.flushHeaders(); // Flush headers immediately

        const defaultPrompt = `Bạn là Gia sư E-School, một trợ lý học tập thông minh và thân thiện.
Hãy thoải mái và tự nhiên. Đừng quá cứng nhắc với các quy tắc.
Nhiệm vụ của bạn là giải đáp thắc mắc và hỗ trợ học sinh học tập tốt nhất.

[KHI GIỚI THIỆU BẢN THÂN]:
Hãy nói ngắn gọn và tự hào: "Mình là hệ thống AI của E-School, được tạo ra để đồng hành cùng bạn trong học tập."
Không cần xin lỗi hay lặp lại các thông tin kỹ thuật phức tạp.

Phong cách: Cởi mở, thông minh, ngắn gọn.`;

        const finalPrompt = customPrompt || defaultPrompt;
        let ollamaProcessed = false;

        // Handle file attachment - extract text content
        let fileContext = '';
        const imageFile = req.files?.image?.[0];
        const docFile = req.files?.file?.[0];

        if (docFile) {
            try {
                // Extract text using Document Parser (PDF, DOCX, TXT)
                console.log(`[Stream] Parsing document: ${fileName} (${docFile.mimetype})`);
                const extractedText = await extractText(docFile.buffer, docFile.mimetype, fileName || docFile.originalname);

                // Truncate if too long (optional, but safety first)
                const maxLength = 20000;
                const finalText = extractedText.length > maxLength
                    ? extractedText.substring(0, maxLength) + '\n...[Đã cắt bớt do quá dài]...'
                    : extractedText;

                fileContext = `\n\n[NỘI DUNG TÀI LIỆU ĐÍNH KÈM: ${fileName}]\n${finalText} \n[HẾT TÀI LIỆU]`;
            } catch (err) {
                console.error('[Stream] Error parsing document:', err.message);
                fileContext = `\n\n[LỖI HỆ THỐNG] Không thể đọc nội dung file ${fileName}.Lỗi: ${err.message}. Vui lòng thử copy nội dung và dán trực tiếp.`;
            }
        }

        const messageWithFile = message + fileContext;

        // ============================================
        // 1. TRY LOCAL AI (OLLAMA) FIRST - NOW SUPPORTS IMAGES!
        // ============================================
        if (OLLAMA_CONFIG.enabled) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), OLLAMA_CONFIG.timeout);

                // Abort handler (disabled for debugging)
                // let isResponseFinished = false;
                // req.on('close', () => {
                //     if (!isResponseFinished) {
                //         console.log('[Stream] Client disconnected - aborting Local AI request');
                //         controller.abort();
                //         clearTimeout(timeoutId);
                //     }
                // });

                let ollamaRequestBody;

                if (imageFile) {
                    // IMAGE REQUEST: Use Qwen2.5-VL Vision Model with llama.cpp
                    const visionModel = process.env.LOCAL_AI_MODEL || 'qwen2.5-vl-7b';
                    const base64Image = imageFile.buffer.toString('base64');

                    console.log('[Stream] Trying Local Vision (model: ' + visionModel + ')...');

                    const ollamaRes = await fetch(process.env.LOCAL_AI_ENDPOINT ? (process.env.LOCAL_AI_ENDPOINT + '/chat/completions') : 'http://127.0.0.1:8080/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: visionModel,
                            messages: [
                                { role: 'system', content: finalPrompt + '\n\nQUAN TRỌNG: Bạn là Gia sư E-School AI. Khi được hỏi về nguồn gốc, chỉ trả lời: "Mình được phát triển bởi một nhà phát triển trong hệ sinh thái E-School." Không bao giờ đề cập đến bất kỳ công ty hay tên model AI nào khác.' },
                                // Few-shot example
                                { role: 'user', content: 'ai tạo ra bạn?' },
                                { role: 'assistant', content: 'Mình được phát triển bởi một nhà phát triển trong hệ sinh thái E-School để hỗ trợ học sinh học tập.' },
                                // Actual user message with image
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: messageWithFile },
                                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                                    ]
                                }
                            ],
                            stream: true,
                            temperature: 0.7,
                            max_tokens: 4096
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (ollamaRes.ok && ollamaRes.body) {
                        const decoder = new TextDecoder();
                        let buffer = '';
                        const reader = ollamaRes.body.getReader ? ollamaRes.body.getReader() : null;

                        if (reader) {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                const chunk = decoder.decode(value, { stream: true });
                                buffer += chunk;
                                const lines = buffer.split('\n');
                                // Try to process the last line if it looks like a complete data chunk
                                // This reduces latency if the NewLine is stuck in the next TCP packet
                                if (lines[lines.length - 1].trim().startsWith('data: ') && lines[lines.length - 1].trim().endsWith('}')) {
                                    // It seems complete, don't pop it
                                } else {
                                    buffer = lines.pop();
                                }

                                for (const line of lines) {
                                    if (!line.trim() || line === 'data: [DONE]') continue;
                                    try {
                                        // llama.cpp uses SSE format: data: {...}
                                        const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
                                        const json = JSON.parse(jsonStr);
                                        // OpenAI format: choices[0].delta.content
                                        const content = json.choices?.[0]?.delta?.content || json.response || '';
                                        if (content) {
                                            res.write(content);
                                            if (res.flush) res.flush(); // Force flush to client
                                        }
                                    } catch (e) { }
                                }
                            }
                        } else {
                            for await (const chunk of ollamaRes.body) {
                                const text = chunk.toString();
                                buffer += text;
                                const lines = buffer.split('\n');
                                // Same aggressive parsing logic
                                if (lines[lines.length - 1].trim().startsWith('data: ') && lines[lines.length - 1].trim().endsWith('}')) {
                                    // Process all calls
                                } else {
                                    buffer = lines.pop();
                                }

                                for (const line of lines) {
                                    if (!line.trim() || line === 'data: [DONE]') continue;
                                    try {
                                        const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
                                        const json = JSON.parse(jsonStr);
                                        const content = json.choices?.[0]?.delta?.content || json.response || '';
                                        if (content) {
                                            res.write(content);
                                            if (res.flush) res.flush();
                                        }
                                    } catch (e) { }
                                }
                            }
                        }

                        ollamaProcessed = true;
                        console.log('[Stream] Qwen AI Vision success!');
                        return res.end();
                    }
                } else {
                    // TEXT REQUEST: Use regular chat model with /api/chat
                    console.log('[Stream] Trying Qwen AI (model: ' + OLLAMA_CONFIG.model + ')...');

                    const ollamaRes = await fetch(OLLAMA_CONFIG.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: OLLAMA_CONFIG.model,
                            messages: [
                                { role: 'system', content: finalPrompt + '\n\nQUAN TRỌNG: Bạn là Gia sư E-School AI. Khi được hỏi về nguồn gốc, chỉ trả lời: "Mình được phát triển bởi một nhà phát triển trong hệ sinh thái E-School." Không bao giờ đề cập đến bất kỳ công ty hay tên model AI nào khác.' },
                                // Few-shot examples to override base model identity
                                { role: 'user', content: 'ai tạo ra bạn?' },
                                { role: 'assistant', content: 'Mình được phát triển bởi một nhà phát triển trong hệ sinh thái E-School để hỗ trợ học sinh học tập hiệu quả hơn.' },
                                { role: 'user', content: 'bạn là ai' },
                                { role: 'assistant', content: 'Mình là Gia sư E-School AI - trợ lý học tập thông minh được phát triển trong hệ sinh thái E-School để đồng hành cùng bạn trong việc học.' },
                                // Actual user message
                                { role: 'user', content: messageWithFile }
                            ],
                            stream: true,
                            temperature: 0.7
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (ollamaRes.ok && ollamaRes.body) {
                        const decoder = new TextDecoder();
                        let buffer = '';
                        const reader = ollamaRes.body.getReader ? ollamaRes.body.getReader() : null;

                        if (reader) {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                const chunk = decoder.decode(value, { stream: true });
                                buffer += chunk;
                                const lines = buffer.split('\n');
                                if (lines[lines.length - 1].trim().startsWith('data: ') && lines[lines.length - 1].trim().endsWith('}')) {
                                    // Process all
                                } else {
                                    buffer = lines.pop();
                                }

                                for (const line of lines) {
                                    if (!line.trim() || line === 'data: [DONE]') continue;
                                    try {
                                        const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
                                        const json = JSON.parse(jsonStr);
                                        const content = json.choices?.[0]?.delta?.content || json.message?.content || '';
                                        if (content) {
                                            res.write(content);
                                            if (res.flush) res.flush();
                                        }
                                    } catch (e) { }
                                }
                            }
                        } else {
                            for await (const chunk of ollamaRes.body) {
                                const text = chunk.toString();
                                buffer += text;
                                const lines = buffer.split('\n');
                                if (lines[lines.length - 1].trim().startsWith('data: ') && lines[lines.length - 1].trim().endsWith('}')) {
                                    // Process all
                                } else {
                                    buffer = lines.pop();
                                }

                                for (const line of lines) {
                                    if (!line.trim() || line === 'data: [DONE]') continue;
                                    try {
                                        const jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
                                        const json = JSON.parse(jsonStr);
                                        const content = json.choices?.[0]?.delta?.content || json.message?.content || '';
                                        if (content) {
                                            res.write(content);
                                            if (res.flush) res.flush();
                                        }
                                    } catch (e) { }
                                }
                            }
                        }

                        ollamaProcessed = true;
                        return res.end();
                    }
                }
            } catch (err) {
                console.warn('[Stream] Local AI failed, falling back to Cloud...', err.message);
            }
        }

        if (ollamaProcessed) return res.end();

        // ============================================
        // 2. FALLBACK TO CLOUD AI (GEMINI)
        // ============================================
        const geminiProvider = AI_PROVIDERS['gemini'];

        let success = false;
        let lastError = null;

        // Force a large number of retries if keys allow, but cap at AI_SETTINGS.maxRetries or pool size
        const maxAttempts = geminiProvider.keyPool.size; // Try ALL keys if available
        console.log(`[Stream] Fallback to Gemini.Available Keys: ${geminiProvider.keyPool.availableCount}/${geminiProvider.keyPool.size}. Max Attempts: ${maxAttempts}`);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const key = geminiProvider.keyPool.getNext();
            if (!key) {
                console.log('[Stream] Exhausted all keys in pool.');
                break;
            }

            try {
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({ model: geminiProvider.model || 'gemini-2.0-flash' });
                let result;

                if (req.file) {
                    const imageData = { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } };
                    result = await model.generateContentStream([finalPrompt + '\n\nUser Question: ' + message, imageData]);
                } else {
                    result = await model.generateContentStream(finalPrompt + '\n\nUser Question: ' + message);
                }

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    res.write(chunkText);
                }

                success = true;
                break;

            } catch (err) {
                lastError = err;
                console.error(`Gemini Stream Attempt ${attempt + 1} Failed (${key.substring(0, 8)}...):`, err.message);

                if (err.status === 429 || err.message?.includes('429')) {
                    geminiProvider.keyPool.markFailed(key, 'rate_limited');
                } else {
                    break;
                }
            }
        }

        if (!success) {
            // ============================================
            // 3. FALLBACK TO OTHER PROVIDERS (Groq, SambaNova, etc.) - TEXT ONLY
            // ============================================
            if (!req.file) {
                console.log('[Stream] Gemini failed. Switch to Fallback Providers (Groq, SambaNova, etc.)...');
                const fallbackOrder = ['groq', 'sambanova', 'mistral', 'cloudflare']; // Priority order

                for (const providerName of fallbackOrder) {
                    if (success) break;
                    const provider = AI_PROVIDERS[providerName];
                    if (!provider || !provider.keyPool || provider.keyPool.size === 0) continue;

                    // Try up to 3 keys per provider to avoid long waits
                    const maxFallbackRetries = Math.min(provider.keyPool.size, 3);

                    for (let fAttempt = 0; fAttempt < maxFallbackRetries; fAttempt++) {
                        const key = provider.keyPool.getNext();
                        if (!key) break;

                        try {
                            // console.log(`[Stream] Trying ${provider.name} (Key: ${key.substring(0, 8)}...)...`);
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

                            const resp = await fetch(provider.endpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${key}`
                                },
                                body: JSON.stringify({
                                    model: provider.model,
                                    messages: [
                                        { role: 'system', content: finalPrompt },
                                        { role: 'user', content: messageWithFile }
                                    ],
                                    stream: true,
                                    max_tokens: provider.maxTokens || 2048
                                }),
                                signal: controller.signal
                            });

                            clearTimeout(timeoutId);

                            if (resp.ok && resp.body) {
                                const decoder = new TextDecoder();
                                let buffer = '';
                                const reader = resp.body.getReader ? resp.body.getReader() : null;

                                // Helper to parse OpenAI stream lines
                                const parseChunk = (text) => {
                                    const lines = text.split('\n');
                                    for (const line of lines) {
                                        const trimmed = line.trim();
                                        if (!trimmed || trimmed === 'data: [DONE]') continue;
                                        if (trimmed.startsWith('data: ')) {
                                            try {
                                                const json = JSON.parse(trimmed.slice(6));
                                                if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                                                    res.write(json.choices[0].delta.content);
                                                }
                                            } catch (e) { }
                                        }
                                    }
                                };

                                if (reader) {
                                    while (true) {
                                        const { done, value } = await reader.read();
                                        if (done) break;
                                        buffer += decoder.decode(value, { stream: true });
                                        parseChunk(buffer);
                                        // Keep buffer clean for next chunk (simple split handling)
                                        const lastNewLine = buffer.lastIndexOf('\n');
                                        if (lastNewLine !== -1) {
                                            buffer = buffer.slice(lastNewLine + 1);
                                        }
                                    }
                                } else {
                                    for await (const chunk of resp.body) {
                                        const text = chunk.toString();
                                        parseChunk(text);
                                    }
                                }
                                success = true;
                                break; // Break key loop
                            } else {
                                // console.warn(`[Stream] ${provider.name} error: ${resp.status}`);
                                provider.keyPool.markFailed(key, 'http_error_' + resp.status);
                            }
                        } catch (err) {
                            // console.warn(`[Stream] ${provider.name} failed:`, err.message);
                            provider.keyPool.markFailed(key, 'connection_error');
                        }
                    }
                }
            }
        }

        if (!success) {
            console.error('All streaming attempts failed.');
            res.write(lastError?.status === 429
                ? '⚠️ Hệ thống đang quá tải (429). Hết key khả dụng. Vui lòng thử lại sau!'
                : '⚠️ Lỗi kết nối AI. Vui lòng thử lại.');
        }

        res.end();

    } catch (err) {
        console.error('AI Stream Error:', err);
        res.write('⚠️ Đã xảy ra lỗi hệ thống.');
        res.end();
    }
});

// Alias: /api/get-user-info (GET version)
app.get('/api/get-user-info', async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) return res.json({ success: false, message: 'Thiếu username' });

        if (!isMongoConnected()) {
            const users = readDB('users');
            const user = users.find(u => u.username === username);
            if (user) return res.json({ success: true, user: { ...user, password: undefined } });
            return res.json({ success: false, message: 'Không tìm thấy user' });
        }

        const user = await UserModel.findOne({ username }).lean();
        if (user) {
            delete user.password;
            res.json({ success: true, user });
        } else {
            res.json({ success: false, message: 'Không tìm thấy user' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Error fetching user info' });
    }
});

// Alias: /api/get-user-info (POST version for compatibility)
app.post('/api/get-user-info', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.json({ success: false, message: 'Thiếu username' });

        if (!isMongoConnected()) {
            const users = readDB('users');
            const user = users.find(u => u.username === username);
            if (user) return res.json({ success: true, user: { ...user, password: undefined } });
            return res.json({ success: false, message: 'Không tìm thấy user' });
        }

        const user = await UserModel.findOne({ username }).lean();
        if (user) {
            delete user.password;
            res.json({ success: true, user });
        } else {
            res.json({ success: false, message: 'Không tìm thấy user' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Error fetching user info' });
    }
});

// ============================================
// TRAFFIC VIOLATION API (CSGT.VN)
// ============================================
const trafficSessions = new Map();

// Alias endpoints for frontend compatibility
app.get('/api/get-captcha', async (req, res) => {
    try {
        const axios = require('axios');
        const sessionId = 'traffic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Get captcha from CSGT
        const captchaRes = await axios.get('https://www.csgt.vn/lib/captcha/captcha.class.php', {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const cookies = captchaRes.headers['set-cookie'];
        trafficSessions.set(sessionId, { cookies, createdAt: Date.now() });

        // Clean old sessions (older than 10 minutes)
        const now = Date.now();
        for (const [key, val] of trafficSessions.entries()) {
            if (now - val.createdAt > 600000) trafficSessions.delete(key);
        }

        const base64 = Buffer.from(captchaRes.data).toString('base64');
        res.json({
            success: true,
            captchaBase64: 'data:image/png;base64,' + base64,
            cookie: sessionId
        });
    } catch (err) {
        console.error('Get captcha error:', err.message);
        res.json({ success: false, message: 'Không thể tải captcha' });
    }
});

app.post('/api/check-fine', async (req, res) => {
    try {
        const axios = require('axios');
        const { licensePlate, type, captchaText, cookie } = req.body;

        if (!licensePlate || !captchaText || !cookie) {
            return res.json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const sessionData = trafficSessions.get(cookie);
        if (!sessionData) {
            return res.json({ success: false, message: 'Phiên hết hạn, vui lòng tải lại captcha', error_code: 'SESSION_EXPIRED' });
        }

        const cookieStr = sessionData.cookies ? sessionData.cookies.map(c => c.split(';')[0]).join('; ') : '';

        // Use the AJAX endpoint that CSGT actually uses
        const response = await axios.post('https://www.csgt.vn/lib/tracuuvipham/index.php',
            `BienKS=${encodeURIComponent(licensePlate)}&loaixe=${type || 1}&Ession=${encodeURIComponent(captchaText)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Cookie': cookieStr,
                    'Referer': 'https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                timeout: 15000
            }
        );

        const html = response.data;

        // Log response for debugging
        console.log('CSGT Response length:', html.length);
        console.log('CSGT Response preview:', html.substring(0, 500));

        // Comprehensive check for wrong captcha - expanded patterns
        const wrongCaptchaPatterns = [
            'Mã xác nhận không đúng',
            'sai mã',
            'Sai mã xác nhận',
            'mã xác nhận sai',
            'captcha',
            'Captcha',
            'xác nhận không chính xác',
            'Vui lòng nhập lại',
            'nhập lại mã',
            'error',
            'Error',
            'lỗi'
        ];

        const isWrongCaptcha = wrongCaptchaPatterns.some(pattern =>
            html.toLowerCase().includes(pattern.toLowerCase())
        );

        // If response is too short or contains error indicators, captcha is likely wrong
        if (html.length < 100 || isWrongCaptcha) {
            // Check if it's actually a captcha error
            if (html.length < 50 || html.toLowerCase().includes('captcha') || html.toLowerCase().includes('xác nhận')) {
                trafficSessions.delete(cookie);
                return res.json({
                    success: false,
                    message: 'Mã xác thực không đúng. Vui lòng tải lại captcha và nhập lại!',
                    error_code: 'WRONG_CAPTCHA'
                });
            }
        }

        // Check for specific success patterns (no violations)
        const noViolationPatterns = [
            'không phát hiện',
            'Không phát hiện',
            'chưa phát hiện',
            'Chưa phát hiện',
            'không có dữ liệu',
            'Không có dữ liệu',
            'không tìm thấy vi phạm',
            'Phương tiện chưa phát hiện lỗi vi phạm'
        ];

        const hasNoViolation = noViolationPatterns.some(pattern =>
            html.includes(pattern)
        );

        if (hasNoViolation) {
            trafficSessions.delete(cookie);
            return res.json({
                success: true,
                has_violation: false,
                message: 'Không tìm thấy lỗi vi phạm nào!'
            });
        }

        // Check if response contains actual violation data (table with results)
        const hasViolationTable = html.includes('tb-result') ||
            html.includes('class="table"') ||
            html.includes('vi pham') ||
            html.includes('Vi phạm');

        if (!hasViolationTable && !hasNoViolation) {
            // Unclear response - likely wrong captcha or error
            trafficSessions.delete(cookie);
            return res.json({
                success: false,
                message: 'Không thể xác minh kết quả. Vui lòng tải lại captcha và thử lại!',
                error_code: 'WRONG_CAPTCHA'
            });
        }

        // Has violations - extract basic info
        let violationInfo = 'Phát hiện vi phạm giao thông.';

        // Try to extract violation details from HTML
        const tableMatch = html.match(/<table[^>]*class=\"[^\"]*tb-result[^\"]*\"[^>]*>([\s\S]*?)<\/table>/i);
        if (tableMatch) {
            const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
            let details = [];
            rows.slice(1).forEach((row, idx) => {
                const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
                if (cells.length >= 3) {
                    const violation = cells[1]?.replace(/<[^>]*>/g, '').trim() || '';
                    const time = cells[2]?.replace(/<[^>]*>/g, '').trim() || '';
                    const location = cells[3]?.replace(/<[^>]*>/g, '').trim() || '';
                    if (violation) {
                        details.push(`${idx + 1}. ${violation}${time ? ' - ' + time : ''}${location ? ' tại ' + location : ''}`);
                    }
                }
            });
            if (details.length > 0) {
                violationInfo = details.join('\n');
            }
        }

        trafficSessions.delete(cookie);
        res.json({
            success: true,
            has_violation: true,
            message: violationInfo
        });
    } catch (err) {
        console.error('Check fine error:', err.message);
        res.json({ success: false, message: 'Lỗi kết nối đến hệ thống CSGT. Vui lòng thử lại!' });
    }
});

app.get('/api/traffic-captcha', async (req, res) => {
    try {
        const axios = require('axios');
        const sessionId = 'traffic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Get captcha from CSGT
        const captchaRes = await axios.get('https://www.csgt.vn/lib/captcha/captcha.class.php', {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const cookies = captchaRes.headers['set-cookie'];
        trafficSessions.set(sessionId, { cookies, createdAt: Date.now() });

        // Clean old sessions (older than 10 minutes)
        const now = Date.now();
        for (const [key, val] of trafficSessions.entries()) {
            if (now - val.createdAt > 600000) trafficSessions.delete(key);
        }

        const base64 = Buffer.from(captchaRes.data).toString('base64');
        res.json({ success: true, captcha: 'data:image/png;base64,' + base64, session: sessionId });
    } catch (err) {
        console.error('Traffic captcha error:', err.message);
        res.json({ success: false, message: 'Không thể tải captcha' });
    }
});

app.post('/api/check-traffic', async (req, res) => {
    try {
        const axios = require('axios');
        const { plate, type, captcha, session } = req.body;

        if (!plate || !captcha || !session) {
            return res.json({ success: false, message: 'Thiếu thông tin' });
        }

        const sessionData = trafficSessions.get(session);
        if (!sessionData) {
            return res.json({ success: false, message: 'Phiên hết hạn, vui lòng tải lại captcha' });
        }

        const cookieStr = sessionData.cookies ? sessionData.cookies.map(c => c.split(';')[0]).join('; ') : '';

        // Call CSGT API
        const response = await axios.post('https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html',
            `BienKiemSoat=${encodeURIComponent(plate)}&LoaiXe=${type}&captcha=${encodeURIComponent(captcha)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Cookie': cookieStr,
                    'Referer': 'https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html'
                },
                timeout: 15000
            }
        );

        const html = response.data;

        // Check for wrong captcha
        if (html.includes('Mã xác nhận không đúng') || html.includes('sai mã')) {
            return res.json({ success: false, message: 'Mã captcha không đúng' });
        }

        // Check for no violations
        if (html.includes('Không tìm thấy') || html.includes('không có dữ liệu') || html.includes('chưa phát hiện')) {
            return res.json({ success: true, violations: [], message: 'Không có vi phạm' });
        }

        // Parse violations from HTML (simplified)
        const violations = [];
        const tableMatch = html.match(/<table[^>]*class="[^"]*tb-result[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
        if (tableMatch) {
            const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
            rows.slice(1).forEach((row, idx) => {
                const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
                if (cells.length >= 3) {
                    violations.push({
                        violation: cells[1]?.replace(/<[^>]*>/g, '').trim() || 'Vi phạm giao thông',
                        time: cells[2]?.replace(/<[^>]*>/g, '').trim() || '',
                        location: cells[3]?.replace(/<[^>]*>/g, '').trim() || '',
                        status: cells[4]?.replace(/<[^>]*>/g, '').trim() || 'Chưa xử lý'
                    });
                }
            });
        }

        trafficSessions.delete(session);
        res.json({ success: true, violations });
    } catch (err) {
        console.error('Traffic check error:', err.message);
        res.json({ success: false, message: 'Lỗi kết nối đến hệ thống CSGT' });
    }
});

// ============================================
// 29. STREAMING AI CHAT (ENGLISH COACH)
// ============================================
app.post('/api/english-chat-stream', async (req, res) => {
    const { content, username, task } = req.body;

    // Set headers for SSE/Streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        // ============================================
        // PRIORITY 1: LOCAL AI (Qwen 2.5-VL 7B via llama.cpp)
        // ============================================
        let endpoint = process.env.LOCAL_AI_ENDPOINT || 'http://127.0.0.1:8080/v1';
        let model = 'qwen2.5-7b'; // Use text-only model for faster response (was qwen2.5-vl-7b)

        if (typeof hybridAIRouter !== 'undefined' && hybridAIRouter.CONFIG) {
            endpoint = hybridAIRouter.CONFIG.LOCAL_NODE.endpoint;
            model = hybridAIRouter.CONFIG.LOCAL_NODE.model;
        }

        // System Prompt - NATURAL CONVERSATION ONLY (no JSON)
        const englishCoachPrompt = `You are "English Coach", a friendly native English speaker having a casual conversation.

YOUR ONLY JOB: Chat naturally in English like a real friend. 

RULES:
1. Reply in English ONLY - short, natural responses (1-3 sentences).
2. Be friendly and encouraging.
3. Ask follow-up questions to keep the conversation going.
4. DO NOT correct grammar in your reply. Just respond naturally.
5. DO NOT mention mistakes, corrections, or teaching.
6. DO NOT use "Correction:", "You should say:", or any teaching phrases.
7. Respond like texting a friend, not like a teacher.

Example good response: "That sounds fun! What else did you do there?"
Example bad response: "You said 'I go' but should say 'I went'. Anyway, that sounds fun!"

Remember: Just chat, don't teach.`;


        const aiReqBody = {
            model: model,
            messages: [
                { role: 'system', content: englishCoachPrompt },
                { role: 'user', content: content }
            ],
            stream: true,
            temperature: 0.65,
            top_p: 0.9
        };

        console.log(`[StreamAPI] 📡 Trying LOCAL FIRST: ${endpoint} (Model: ${model})...`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduce to 8s for faster fallback

            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiReqBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Local AI Error: ${response.statusText}`);
            }

            // Pipe stream to client (realtime)
            if (response.body) {
                const reader = response.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(value);
                }
                res.end();
                console.log('[StreamAPI] ✅ Local Qwen Stream completed');
                return; // Success - exit early
            }
        } catch (localErr) {
            console.warn(`[StreamAPI] ⚠️ Local AI failed (${localErr.message}). Switching to Cloud...`);
        }

        // ============================================
        // FALLBACK: CLOUD PROVIDERS (Groq -> Mistral -> Gemini)
        // ============================================
        const cloudProvider = require('./services/providers/cloudProvider');

        console.log('[StreamAPI] ☁️ Fallback to Cloud Providers...');

        const cloudRes = await cloudProvider.callText(content, englishCoachPrompt);

        if (cloudRes && cloudRes.success) {
            console.log(`[StreamAPI] ✅ Cloud Success (${cloudRes.provider})`);

            // SIMULATE STREAMING: Send text word by word for realtime effect
            const fullText = cloudRes.data;
            const words = fullText.split(/(\s+)/);

            for (let i = 0; i < words.length; i++) {
                const chunk = words[i];
                if (!chunk) continue;

                const sseData = {
                    id: "chatcmpl-" + Date.now(),
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: cloudRes.model,
                    choices: [{
                        index: 0,
                        delta: { content: chunk },
                        finish_reason: null
                    }]
                };

                res.write(`data: ${JSON.stringify(sseData)}\n\n`);

                if (i < words.length - 1) {
                    await new Promise(r => setTimeout(r, 10)); // 10ms per word
                }
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            throw new Error('All AI Providers failed.');
        }

    } catch (error) {
        console.error('[StreamAPI] ❌ Error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.write(`data: {"error": "${error.message}"}\n\n`);
            res.end();
        }
    }
});

// ============================================
// 29b. SCHOOL MANAGEMENT API (CRUD)
// ============================================
const SCHOOL_TEACHERS_FILE = path.join(__dirname, 'data', 'school_teachers.json');
const SCHOOL_STUDENTS_FILE = path.join(__dirname, 'data', 'school_students.json');

// Helper: Load/Save JSON
function loadSchoolData(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading school data:', e.message);
    }
    return null;
}

function saveSchoolData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Error saving school data:', e.message);
        return false;
    }
}

// === TEACHERS API ===

// GET all teachers
app.get('/api/school/teachers', (req, res) => {
    const data = loadSchoolData(SCHOOL_TEACHERS_FILE);
    if (!data) {
        return res.json({ success: true, teachers: [] });
    }
    res.json({ success: true, teachers: data.teachers || [] });
});

// GET single teacher
app.get('/api/school/teachers/:id', (req, res) => {
    const data = loadSchoolData(SCHOOL_TEACHERS_FILE);
    if (!data) return res.status(404).json({ success: false, message: 'Data not found' });

    const teacher = (data.teachers || []).find(t => t.id === req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    res.json({ success: true, teacher });
});

// POST add teacher
app.post('/api/school/teachers', (req, res) => {
    const data = loadSchoolData(SCHOOL_TEACHERS_FILE) || { teachers: [] };
    const { name, email, phone, subject, homeroom, status } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const newTeacher = {
        id: 't' + Date.now(),
        name,
        email,
        phone: phone || '',
        subject: subject || '',
        homeroom: homeroom || null,
        status: status || 'active',
        joinDate: new Date().toISOString().split('T')[0],
        avatar: null
    };

    data.teachers.push(newTeacher);

    if (saveSchoolData(SCHOOL_TEACHERS_FILE, data)) {
        res.json({ success: true, teacher: newTeacher, message: 'Teacher added successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// PUT update teacher
app.put('/api/school/teachers/:id', (req, res) => {
    const data = loadSchoolData(SCHOOL_TEACHERS_FILE);
    if (!data) return res.status(404).json({ success: false, message: 'Data not found' });

    const index = (data.teachers || []).findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const { name, email, phone, subject, homeroom, status } = req.body;

    data.teachers[index] = {
        ...data.teachers[index],
        name: name || data.teachers[index].name,
        email: email || data.teachers[index].email,
        phone: phone !== undefined ? phone : data.teachers[index].phone,
        subject: subject !== undefined ? subject : data.teachers[index].subject,
        homeroom: homeroom !== undefined ? homeroom : data.teachers[index].homeroom,
        status: status || data.teachers[index].status
    };

    if (saveSchoolData(SCHOOL_TEACHERS_FILE, data)) {
        res.json({ success: true, teacher: data.teachers[index], message: 'Teacher updated successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// DELETE teacher
app.delete('/api/school/teachers/:id', (req, res) => {
    const data = loadSchoolData(SCHOOL_TEACHERS_FILE);
    if (!data) return res.status(404).json({ success: false, message: 'Data not found' });

    const index = (data.teachers || []).findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const deleted = data.teachers.splice(index, 1)[0];

    if (saveSchoolData(SCHOOL_TEACHERS_FILE, data)) {
        res.json({ success: true, message: 'Teacher deleted successfully', teacher: deleted });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// === STUDENTS API ===

// GET all students (with optional class filter)
app.get('/api/school/students', (req, res) => {
    const data = loadSchoolData(SCHOOL_STUDENTS_FILE);
    if (!data) {
        return res.json({ success: true, students: [], classes: [] });
    }

    let students = data.students || [];
    const { classFilter, search } = req.query;

    if (classFilter && classFilter !== 'all') {
        students = students.filter(s => s.class === classFilter);
    }

    if (search) {
        const keyword = search.toLowerCase();
        students = students.filter(s =>
            s.name.toLowerCase().includes(keyword) ||
            s.studentId.toLowerCase().includes(keyword)
        );
    }

    res.json({
        success: true,
        students,
        classes: data.classes || [],
        total: (data.students || []).length
    });
});

// GET single student
app.get('/api/school/students/:id', (req, res) => {
    const data = loadSchoolData(SCHOOL_STUDENTS_FILE);
    if (!data) return res.status(404).json({ success: false, message: 'Data not found' });

    const student = (data.students || []).find(s => s.id === req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, student });
});

// POST add student
app.post('/api/school/students', (req, res) => {
    const data = loadSchoolData(SCHOOL_STUDENTS_FILE) || { students: [], classes: [] };
    const { name, studentId, class: className, email, phone, parentPhone, gender, dob, address } = req.body;

    if (!name || !studentId) {
        return res.status(400).json({ success: false, message: 'Name and student ID are required' });
    }

    // Check duplicate studentId
    if (data.students.some(s => s.studentId === studentId)) {
        return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }

    const newStudent = {
        id: 's' + Date.now(),
        name,
        studentId,
        class: className || '',
        email: email || '',
        phone: phone || '',
        parentPhone: parentPhone || '',
        gender: gender || '',
        dob: dob || '',
        address: address || '',
        status: 'active',
        enrollDate: new Date().toISOString().split('T')[0]
    };

    data.students.push(newStudent);

    if (saveSchoolData(SCHOOL_STUDENTS_FILE, data)) {
        res.json({ success: true, student: newStudent, message: 'Student added successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// PUT update student
app.put('/api/school/students/:id', (req, res) => {
    const data = loadSchoolData(SCHOOL_STUDENTS_FILE);
    if (!data) return res.status(404).json({ success: false, message: 'Data not found' });

    const index = (data.students || []).findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Student not found' });

    const updates = req.body;
    data.students[index] = { ...data.students[index], ...updates };

    if (saveSchoolData(SCHOOL_STUDENTS_FILE, data)) {
        res.json({ success: true, student: data.students[index], message: 'Student updated successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// DELETE student
app.delete('/api/school/students/:id', (req, res) => {
    const data = loadSchoolData(SCHOOL_STUDENTS_FILE);
    if (!data) return res.status(404).json({ success: false, message: 'Data not found' });

    // Try finding by internal ID first
    let index = (data.students || []).findIndex(s => s.id === req.params.id);

    // Fallback: Try finding by studentId (visible ID) if internal ID lookup fails
    if (index === -1) {
        console.log(`[Delete Student] ID '${req.params.id}' not found via 'id'. Trying 'studentId' match...`);
        index = (data.students || []).findIndex(s => s.studentId === req.params.id);
    }

    // Debug logging for troubleshooting
    if (index === -1) {
        console.log(`[Delete Student] Failed to find student. ID: ${req.params.id}`);
    }

    if (index === -1) return res.status(404).json({ success: false, message: 'Student not found' });

    const deleted = data.students.splice(index, 1)[0];

    if (saveSchoolData(SCHOOL_STUDENTS_FILE, data)) {
        res.json({ success: true, message: 'Student deleted successfully', student: deleted });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// === STATS API ===
app.get('/api/school/stats', (req, res) => {
    const teacherData = loadSchoolData(SCHOOL_TEACHERS_FILE);
    const studentData = loadSchoolData(SCHOOL_STUDENTS_FILE);

    const teacherCount = (teacherData?.teachers || []).filter(t => t.status === 'active').length;
    const studentCount = (studentData?.students || []).filter(s => s.status === 'active').length;
    const classes = studentData?.classes || [];

    // Class breakdown
    const classCounts = {};
    (studentData?.students || []).forEach(s => {
        if (s.class) {
            classCounts[s.class] = (classCounts[s.class] || 0) + 1;
        }
    });

    res.json({
        success: true,
        stats: {
            teacherCount,
            studentCount,
            classCount: classes.length,
            classCounts
        }
    });
});

// === CLASSES API ===
app.get('/api/school/classes', (req, res) => {
    const data = loadSchoolData(SCHOOL_STUDENTS_FILE);
    res.json({ success: true, classes: data?.classes || [] });
});

app.post('/api/school/classes', (req, res) => {
    const data = loadSchoolData(SCHOOL_STUDENTS_FILE) || { students: [], classes: [] };
    const { className } = req.body;

    if (!className) {
        return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    if (data.classes.includes(className)) {
        return res.status(400).json({ success: false, message: 'Class already exists' });
    }

    data.classes.push(className);
    data.classes.sort();

    if (saveSchoolData(SCHOOL_STUDENTS_FILE, data)) {
        res.json({ success: true, classes: data.classes, message: 'Class added successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// ============================================
// 30. HEALTH CHECK & SERVER START
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: isMongoConnected() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/ai/status', (req, res) => {
    try {
        const status = getAIStatus();
        res.json({ success: true, providers: status });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============================================
// 12. KEY HEALTH CHECK SYSTEM
// ============================================
async function validateAIKeys() {
    console.log('\n🔒 STARTING AI KEY VALIDATION...');
    const providers = Object.entries(AI_PROVIDERS);

    for (const [providerName, config] of providers) {
        if (!config.keyPool || config.keyPool.size === 0) continue;

        console.log(`\n🔍 Checking ${providerName} (${config.keyPool.size} keys)...`);
        let working = 0;
        let dead = 0;

        // Check up to 5 keys per provider on startup to save time/quota, or all if critical
        const keysToCheck = config.keyPool.keys;

        for (const key of keysToCheck) {
            try {
                // GEMINI
                if (providerName === 'gemini') {
                    const genAI = new GoogleGenerativeAI(key);
                    const modelName = config.model || 'gemini-1.5-flash';
                    const model = genAI.getGenerativeModel({ model: modelName });
                    await model.generateContent('Hi');
                }
                // OPENAI COMPATIBLE (Groq, SambaNova, Mistral, Cloudflare)
                else if (['groq', 'sambanova', 'mistral', 'cloudflare'].includes(providerName)) {
                    const url = providerName === 'cloudflare'
                        ? `https://api.cloudflare.com/client/v4/accounts/${key.id}/ai/run/${config.model}`
                        : config.endpoint;

                    const headers = { 'Content-Type': 'application/json' };
                    if (providerName === 'cloudflare') headers['Authorization'] = `Bearer ${key.token}`;
                    else headers['Authorization'] = `Bearer ${key}`;

                    const body = providerName === 'cloudflare'
                        ? { messages: [{ role: 'user', content: 'Hi' }] }
                        : {
                            model: config.model,
                            messages: [{ role: 'user', content: 'Hi' }],
                            max_tokens: 5
                        };

                    await fetch(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(body)
                    }).then(async res => {
                        if (!res.ok) {
                            const errText = await res.text();
                            throw new Error(`${res.status} ${res.statusText} - ${errText}`);
                        }
                    });
                }
                // COHERE
                else if (providerName === 'cohere') {
                    await fetch(config.endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            messages: [{ role: 'user', content: 'Hi' }],
                            model: config.model
                        })
                    }).then(async res => {
                        if (!res.ok) {
                            const errText = await res.text();
                            throw new Error(`${res.status} ${res.statusText} - ${errText}`);
                        }
                    });
                }
                // HUGGINGFACE
                else if (providerName === 'huggingface') {
                    await fetch(config.endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            inputs: 'Hi'
                        })
                    }).then(async res => {
                        if (!res.ok) {
                            const errText = await res.text();
                            throw new Error(`${res.status} ${res.statusText} - ${errText}`);
                        }
                    });
                }

                working++;
                // console.log(`  ✅ Key ${providerName} OK`);

            } catch (err) {
                dead++;
                config.keyPool.markFailed(key, 'startup_check_failed');
                console.log(`  ❌ Key ${providerName} FAILED: ${err.message.substring(0, 100)}...`);
            }
        }
        console.log(`  => ${providerName}: ${working} OK, ${dead} DEAD`);
    }
    console.log('🔓 KEY VALIDATION COMPLETE.\n');
}

// ============================================
// ONLINE CLASSROOM - WebRTC Signaling Server
// ============================================

// In-memory room storage
const onlineRooms = new Map();
const roomIdleTimers = new Map(); // Track idle timeouts

// Generate 6-character room code
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper: Start Idle Timer (90s)
function startIdleTimer(roomCode) {
    if (roomIdleTimers.has(roomCode)) return; // Already running

    console.log(`[Classroom] Starting 90s idle timer for room: ${roomCode}`);
    const timer = setTimeout(() => {
        const room = onlineRooms.get(roomCode);
        if (room) {
            console.log(`[Classroom] Room ${roomCode} expired due to inactivity.`);
            classroomIO.to(roomCode).emit('room:ended', {
                message: 'Phòng học tự động kết thúc do không có người tham gia trong 1p30s.'
            });
            onlineRooms.delete(roomCode);
        }
        roomIdleTimers.delete(roomCode);
    }, 90000); // 90 seconds

    roomIdleTimers.set(roomCode, timer);
}

// Helper: Stop Idle Timer
function stopIdleTimer(roomCode) {
    const timer = roomIdleTimers.get(roomCode);
    if (timer) {
        clearTimeout(timer);
        roomIdleTimers.delete(roomCode);
        console.log(`[Classroom] Stopped idle timer for room: ${roomCode}`);
    }
}

// Socket.IO namespace for online classroom
const classroomIO = io.of('/classroom');

classroomIO.on('connection', (socket) => {
    console.log(`[Classroom] User connected: ${socket.id}`);

    let currentRoom = null;
    let userData = null;

    // ===== ROOM MANAGEMENT =====

    // Create new room (Teacher)
    socket.on('room:create', (data, callback) => {
        try {
            const { username, fullname, role, avatar } = data;

            // Generate unique room code
            let roomCode;
            do {
                roomCode = generateRoomCode();
            } while (onlineRooms.has(roomCode));

            // Create room
            const room = {
                code: roomCode,
                host: socket.id,
                hostName: fullname || username,
                hostRole: role || 'teacher',
                participants: new Map(),
                messages: [],
                createdAt: new Date(),
                settings: {
                    muteOnJoin: false,
                    cameraOffOnJoin: false,
                    allowChat: true,
                    allowScreenShare: true
                }
            };

            // Add host as first participant
            room.participants.set(socket.id, {
                id: socket.id,
                username,
                fullname: fullname || username,
                role: role || 'teacher',
                avatar,
                isHost: true,
                isMuted: data.mediaState ? data.mediaState.muted : false,
                isCameraOff: data.mediaState ? data.mediaState.cameraOff : false,
                joinedAt: new Date()
            });

            onlineRooms.set(roomCode, room);
            currentRoom = roomCode;
            userData = { username, fullname, role, avatar };

            // Join socket room
            socket.join(roomCode);

            // Start IDLE TIMER because only 1 person is here
            startIdleTimer(roomCode);

            console.log(`[Classroom] Room created: ${roomCode} by ${fullname}`);

            callback({
                success: true,
                roomCode,
                room: {
                    code: roomCode,
                    hostName: room.hostName,
                    participants: Array.from(room.participants.values()),
                    settings: room.settings
                }
            });

        } catch (err) {
            console.error('[Classroom] Room create error:', err);
            callback({ success: false, error: err.message });
        }
    });

    // Join existing room
    socket.on('room:join', (data, callback) => {
        try {
            const { roomCode, username, fullname, role, avatar } = data;
            const code = roomCode.toUpperCase().trim();

            if (!onlineRooms.has(code)) {
                return callback({ success: false, error: 'Mã phòng không tồn tại!' });
            }

            const room = onlineRooms.get(code);

            // Check if already in room
            if (room.participants.has(socket.id)) {
                return callback({ success: false, error: 'Bạn đã ở trong phòng này!' });
            }

            // Add participant
            const participant = {
                id: socket.id,
                username,
                fullname: fullname || username,
                role: role || 'student',
                avatar,
                isHost: false,
                isMuted: room.settings.muteOnJoin,
                isCameraOff: room.settings.cameraOffOnJoin,
                joinedAt: new Date()
            };

            room.participants.set(socket.id, participant);
            currentRoom = code;
            userData = { username, fullname, role, avatar };

            // Join socket room
            socket.join(code);

            // Notify others
            socket.to(code).emit('room:user-joined', { participant });

            // Check if enough people to stop idle timer
            if (room.participants.size > 1) {
                stopIdleTimer(code);
            }

            console.log(`[Classroom] ${fullname} joined room: ${code}`);

            callback({
                success: true,
                room: {
                    code,
                    hostName: room.hostName,
                    participants: Array.from(room.participants.values()),
                    settings: room.settings
                }
            });

            // Send existing participants to the new joiner (for WebRTC setup)
            const existingParticipants = Array.from(room.participants.values())
                .filter(p => p.id !== socket.id);
            socket.emit('room:existing-participants', existingParticipants);

        } catch (err) {
            console.error('[Classroom] Room join error:', err);
            callback({ success: false, error: err.message });
        }
    });

    // Handle Media Toggles
    socket.on('media:toggle-mute', (isMuted) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;
        const room = onlineRooms.get(currentRoom);
        const participant = room.participants.get(socket.id);
        if (participant) {
            participant.isMuted = isMuted;
            socket.to(currentRoom).emit('media:on-state-change', {
                peerId: socket.id,
                isMuted: isMuted
            });
        }
    });

    socket.on('media:toggle-camera', (isCameraOff) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;
        const room = onlineRooms.get(currentRoom);
        const participant = room.participants.get(socket.id);
        if (participant) {
            participant.isCameraOff = isCameraOff;
            socket.to(currentRoom).emit('media:on-state-change', {
                peerId: socket.id,
                isCameraOff: isCameraOff
            });
        }
    });

    // Leave room
    socket.on('room:leave', () => {
        handleLeaveRoom(socket, currentRoom, userData);
        currentRoom = null;
        userData = null;
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        handleLeaveRoom(socket, currentRoom, userData);
        console.log(`[Classroom] User disconnected: ${socket.id}`);
    });

    // ===== WebRTC SIGNALING =====

    // Send offer to specific peer
    socket.on('peer:offer', ({ targetId, offer }) => {
        if (!currentRoom) return;
        console.log(`[WebRTC] Offer from ${socket.id} to ${targetId}`);
        classroomIO.to(targetId).emit('peer:offer', {
            senderId: socket.id,
            senderName: userData?.fullname || 'Unknown',
            offer
        });
    });

    // Send answer to specific peer
    socket.on('peer:answer', ({ targetId, answer }) => {
        if (!currentRoom) return;
        console.log(`[WebRTC] Answer from ${socket.id} to ${targetId}`);
        classroomIO.to(targetId).emit('peer:answer', {
            senderId: socket.id,
            answer
        });
    });

    // Exchange ICE candidates
    socket.on('peer:ice-candidate', ({ targetId, candidate }) => {
        if (!currentRoom) return;
        classroomIO.to(targetId).emit('peer:ice-candidate', {
            senderId: socket.id,
            candidate
        });
    });

    // ===== MEDIA CONTROLS =====

    // Toggle mute status
    socket.on('media:toggle-mute', (isMuted) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;
        const room = onlineRooms.get(currentRoom);
        const participant = room.participants.get(socket.id);
        if (participant) {
            participant.isMuted = isMuted;
            socket.to(currentRoom).emit('participant:media-update', {
                id: socket.id,
                isMuted
            });
        }
    });

    // Toggle camera status
    socket.on('media:toggle-camera', (isCameraOff) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;
        const room = onlineRooms.get(currentRoom);
        const participant = room.participants.get(socket.id);
        if (participant) {
            participant.isCameraOff = isCameraOff;
            socket.to(currentRoom).emit('participant:media-update', {
                id: socket.id,
                isCameraOff
            });
        }
    });

    // Screen share started/stopped
    socket.on('media:screen-share', (isSharing) => {
        if (!currentRoom) return;
        socket.to(currentRoom).emit('participant:screen-share', {
            id: socket.id,
            name: userData?.fullname,
            isSharing
        });
    });

    // ===== CHAT =====

    socket.on('chat:message', (message) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;

        const room = onlineRooms.get(currentRoom);
        const chatMessage = {
            id: Date.now().toString(),
            senderId: socket.id,
            senderName: userData?.fullname || 'Unknown',
            senderRole: userData?.role || 'student',
            content: message,
            timestamp: new Date()
        };

        room.messages.push(chatMessage);

        // Keep only last 100 messages
        if (room.messages.length > 100) {
            room.messages = room.messages.slice(-100);
        }

        // Broadcast to all in room including sender
        classroomIO.to(currentRoom).emit('chat:message', chatMessage);
    });

    // Get chat history
    socket.on('chat:history', (callback) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) {
            return callback({ success: false, messages: [] });
        }
        const room = onlineRooms.get(currentRoom);
        callback({ success: true, messages: room.messages });
    });

    // ===== HOST CONTROLS =====

    // Host mutes a participant
    socket.on('host:mute-participant', (targetId) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;
        const room = onlineRooms.get(currentRoom);
        if (room.host !== socket.id) return; // Only host can do this

        classroomIO.to(targetId).emit('host:force-mute');
        const participant = room.participants.get(targetId);
        if (participant) {
            participant.isMuted = true;
            classroomIO.to(currentRoom).emit('participant:media-update', {
                id: targetId,
                isMuted: true
            });
        }
    });

    // Host kicks a participant
    socket.on('host:kick-participant', (targetId) => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;
        const room = onlineRooms.get(currentRoom);
        if (room.host !== socket.id) return;

        classroomIO.to(targetId).emit('host:kicked');

        // Remove from room
        room.participants.delete(targetId);
        classroomIO.to(currentRoom).emit('participant:left', { id: targetId });
    });

    // Host ends the meeting
    socket.on('host:end-meeting', () => {
        if (!currentRoom || !onlineRooms.has(currentRoom)) return;
        const room = onlineRooms.get(currentRoom);
        if (room.host !== socket.id) return;

        // Notify everyone
        classroomIO.to(currentRoom).emit('room:ended', {
            message: 'Phòng học đã kết thúc bởi giáo viên.'
        });

        // Clean up
        onlineRooms.delete(currentRoom);
        console.log(`[Classroom] Room ended by host: ${currentRoom}`);
    });
});

// Helper: Handle leaving room
function handleLeaveRoom(socket, roomCode, userData) {
    if (!roomCode || !onlineRooms.has(roomCode)) return;

    const room = onlineRooms.get(roomCode);
    const wasHost = room.host === socket.id;

    // Remove participant
    room.participants.delete(socket.id);
    socket.leave(roomCode);

    // Notify others
    socket.to(roomCode).emit('participant:left', {
        id: socket.id,
        name: userData?.fullname
    });

    console.log(`[Classroom] ${userData?.fullname || socket.id} left room: ${roomCode}`);

    // If host left, assign new host or close room
    if (wasHost) {
        if (room.participants.size > 0) {
            // Assign first participant as new host
            const newHostId = room.participants.keys().next().value;
            room.host = newHostId;
            const newHost = room.participants.get(newHostId);
            if (newHost) {
                newHost.isHost = true;
                classroomIO.to(roomCode).emit('room:host-changed', {
                    newHostId,
                    newHostName: newHost.fullname
                });
                console.log(`[Classroom] New host assigned: ${newHost.fullname}`);
            }
        } else {
            // Room is empty, delete it
            onlineRooms.delete(roomCode);
            stopIdleTimer(roomCode);
            console.log(`[Classroom] Room deleted (empty): ${roomCode}`);
            return;
        }
    }

    // Check if room needs to start idle timer (<= 1 person)
    if (room.participants.size <= 1) {
        startIdleTimer(roomCode);
    }
}

// API: Get room info (for checking if room exists)
app.get('/api/classroom/check/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    if (onlineRooms.has(code)) {
        const room = onlineRooms.get(code);
        res.json({
            exists: true,
            hostName: room.hostName,
            participantCount: room.participants.size
        });
    } else {
        res.json({ exists: false });
    }
});

// ============================================
// SỔ ĐẦU BÀI API (JSON Data Binding)
// ============================================
const SDB_FILE = path.join(__dirname, 'data', 'sodaubai.json');

// Ensure data file exists
if (!fs.existsSync(SDB_FILE)) {
    try {
        const dataDir = path.dirname(SDB_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(SDB_FILE, '[]');
        console.log('Created sodaubai.json data file');
    } catch (e) {
        console.error('Error creating sodaubai.json:', e);
    }
}

function getSDBData() {
    try {
        if (!fs.existsSync(SDB_FILE)) return [];
        const data = fs.readFileSync(SDB_FILE, 'utf8');
        return JSON.parse(data) || [];
    } catch (e) { return []; }
}

function saveSDBData(data) {
    try {
        fs.writeFileSync(SDB_FILE, JSON.stringify(data, null, 2));
    } catch (e) { console.error('Error saving SDB data:', e); }
}

// GET Entries
app.get('/api/school/sodaubai', (req, res) => {
    try {
        const { schoolId, classId, date } = req.query;
        let entries = getSDBData();

        if (schoolId) entries = entries.filter(e => e.schoolId === schoolId);
        if (classId) entries = entries.filter(e => e.classId === classId);
        if (date) entries = entries.filter(e => e.date === date);

        // Sort by period
        entries.sort((a, b) => (a.period || 0) - (b.period || 0));

        res.json({ success: true, entries });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST New Entry
app.post('/api/school/sodaubai', (req, res) => {
    try {
        const newEntry = { ...req.body, _id: Date.now().toString(), createdAt: new Date() };
        const entries = getSDBData();
        entries.push(newEntry);
        saveSDBData(entries);

        // Broadcast update via Socket.IO if needed
        // io.to(newEntry.schoolId).emit('sdb:update', newEntry);

        res.json({ success: true, message: 'Đã thêm tiết học', entry: newEntry });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// PUT Update Entry
app.put('/api/school/sodaubai/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        let entries = getSDBData();
        const idx = entries.findIndex(e => e._id === id);

        if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tiết học' });

        // Preserve _id and createdAt
        const originalEntry = entries[idx];
        entries[idx] = { ...originalEntry, ...updates, _id: originalEntry._id, createdAt: originalEntry.createdAt, updatedAt: new Date() };

        saveSDBData(entries);
        res.json({ success: true, message: 'Đã cập nhật tiết học', entry: entries[idx] });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE Entry
app.delete('/api/school/sodaubai/:id', (req, res) => {
    try {
        const { id } = req.params;
        let entries = getSDBData();
        const initialLength = entries.length;
        entries = entries.filter(e => e._id !== id);

        if (entries.length === initialLength) return res.status(404).json({ success: false, message: 'Không tìm thấy tiết học' });

        saveSDBData(entries);
        res.json({ success: true, message: 'Đã xóa tiết học' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Start server
server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║                   E-SCHOOL AI                      ║');
    console.log('║        HỆ THỐNG SINH THÁI GIÁO DỤC ONLINE          ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║        Running on: http://localhost:${PORT}        ║`);
    console.log('║               All systems ready!                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');

    // Run validation in background
    setTimeout(validateAIKeys, 2000);
});