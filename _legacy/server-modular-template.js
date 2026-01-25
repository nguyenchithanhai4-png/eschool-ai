/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                         E-SCHOOL AI SERVER (REFACTORED)                     ║
 * ║                         Entry Point - Import từ modules                     ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 * ║  Đây là phiên bản refactored của server.js                                 ║
 * ║  Tất cả logic được tách vào các modules riêng                              ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Rename server.js -> server.backup.js
 * 2. Rename server-refactored.js -> server.js
 * 3. npm start
 */

// ============================================
// 1. IMPORTS - CÁC THƯ VIỆN CẦN THIẾT
// ============================================
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ExpressPeerServer } = require('peer');

// ============================================
// 2. IMPORT TỪ CÁC MODULES ĐÃ TÁCH
// ============================================

// Models - Import TẤT CẢ từ một file
const {
    UserModel, SchoolModel, ClassModel, ClassDiaryModel, ClassRankingModel,
    PostModel, BookModel, MethodModel, QuizModel, MessageModel,
    NoteModel, FlashcardModel, ResourceModel, AssignmentModel,
    NotificationModel, ActivityLogModel, AIUsageModel, ConnectionModel,
    TemplateModel, SystemSettings
} = require('./models');

// Services
const { requireAuth, requireRole, requireAdmin, requireSchoolOrAdmin, requireTeacherOrAbove, logAPICall } = require('./services/authMiddleware');
const mongoManager = require('./services/mongoManager');
const hybridAIRouter = require('./services/hybridAIRouter');
const aiRouter = require('./services/aiRouter');

// Config
const { OLLAMA_CONFIG, PROVIDERS, ROUTING_RULES, SETTINGS, SYSTEM_PROMPTS } = require('./config/aiConfig');

// Routes
const routes = require('./routes');

// ============================================
// 3. KHỞI TẠO APP VÀ SERVER
// ============================================
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ============================================
// 4. MIDDLEWARE SETUP
// ============================================

// Compression
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// Security Headers (CSP đã disable tạm thời)
app.use((req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
    next();
});

// Rate Limiters
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, error: 'Quá nhiều request! Vui lòng thử lại sau 1 phút.' }
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, error: 'Đã vượt quá giới hạn AI! Thử lại sau 1 phút.' }
});

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: 'Quá nhiều lần đăng nhập! Thử lại sau 1 phút.' }
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/chat', aiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/login', loginLimiter);

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'e-school-ai-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// PeerJS Server
const peerServer = ExpressPeerServer(server, { debug: true, path: '/' });
app.use('/peerjs', peerServer);

// ============================================
// 5. DATABASE CONNECTION
// ============================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eschool_ai';
const mongo = mongoManager.init(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
});

mongo.connect();
mongo.on('connected', () => {
    console.log('✅ MongoDB connected!');
    hybridAIRouter.syncConfigFromDB(SystemSettings);
});
mongo.on('disconnected', () => console.log('⚠️ MongoDB disconnected!'));

// ============================================
// 6. SOCKET.IO SETUP
// ============================================
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    process.env.PRODUCTION_URL
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (process.env.NODE_ENV === 'production') {
                if (ALLOWED_ORIGINS.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            } else {
                callback(null, true);
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// ============================================
// 7. MOUNT ROUTES
// ============================================

// API Log
app.use('/api/', logAPICall);

// Protected Routes
app.use('/api/system', requireAuth, requireAdmin);
app.use('/api/school-admin', requireAuth, requireSchoolOrAdmin);

// Profile Routes (sử dụng module đã tách)
app.use('/api/profile', routes.profile({ UserModel }));

// ============================================
// 8. LEGACY ROUTES (TỪ server.js CŨ)
// ============================================
// TODO: Dần dần migrate các routes này vào routes/

/*
 * Các API endpoints còn lại từ server.js cũ
 * Bạn có thể copy từng nhóm routes vào đây
 * hoặc tạo file routes mới và mount
 */

// Ví dụ structure cho routes mới:
// app.use('/api/auth', require('./routes/auth.routes')({ UserModel, SchoolModel }));
// app.use('/api/school', require('./routes/school.routes')({ SchoolModel, ClassModel }));
// app.use('/api/admin', require('./routes/admin.routes')({ UserModel, SchoolModel }));
// app.use('/api/ai', require('./routes/ai.routes')({ aiRouter, hybridAIRouter }));

// ============================================
// 9. ERROR HANDLERS
// ============================================
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// ============================================
// 10. START SERVER
// ============================================
server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║            E-SCHOOL AI (REFACTORED)                ║');
    console.log('║        HỆ THỐNG SINH THÁI GIÁO DỤC ONLINE          ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║        Running on: http://localhost:${PORT}        ║`);
    console.log('║               All systems ready!                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
});

// ============================================
// EXPORTS (cho testing)
// ============================================
module.exports = { app, server, io };
