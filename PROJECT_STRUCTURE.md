# 📁 E-School AI - Cấu Trúc Dự Án

> **Phiên bản:** 1.0  
> **Cập nhật:** 2026-01-16  
> **Mô tả:** Hệ thống sinh thái giáo dục AI

---

## 🌳 Cây Thư Mục

```
E-School-AI/
│
├── 📄 server.js                 # ⭐ FILE CHÍNH - Backend Express.js (7800+ lines)
├── 📄 package.json              # Dependencies và scripts
├── 📄 .env                      # Biến môi trường (API keys, DB config)
├── 📄 Dockerfile                # Docker container config
├── 📄 render.yaml               # Render.com deployment config
│
├── 📁 config/                   # ⚙️ CẤU HÌNH
│   └── aiConfig.js              # Cấu hình AI providers (Gemini, Groq, etc.)
│
├── 📁 models/                   # 🗃️ DATABASE SCHEMAS
│   ├── index.js                 # Export tất cả models
│   ├── User.js                  # Schema người dùng (student, teacher, admin)
│   ├── School.js                # Schema trường học
│   ├── Class.js                 # Schema lớp học & bảng thi đua
│   ├── Activity.js              # Schema bài tập, thông báo, AI usage
│   └── Content.js               # Schema posts, books, quizzes, messages
│
├── 📁 routes/                   # 🛤️ API ROUTES (Modular)
│   ├── index.js                 # Router aggregator
│   ├── profile.js               # API profile người dùng
│   ├── auth.routes.js           # API đăng nhập/đăng ký/OAuth
│   ├── school.routes.js         # API quản lý trường
│   └── admin.routes.js          # API system admin
│
├── 📁 services/                 # 🔧 BUSINESS LOGIC
│   ├── authMiddleware.js        # Xác thực & phân quyền
│   ├── mongoManager.js          # Quản lý kết nối MongoDB
│   ├── aiRouter.js              # Router điều phối AI
│   ├── hybridAIRouter.js        # AI Router hybrid (local + cloud)
│   ├── fileReader.js            # Đọc file documents
│   └── providers/               # AI Provider implementations
│
├── 📁 public/                   # 🌐 FRONTEND (Static Files)
│   ├── index.html               # Landing page
│   ├── login.html               # Trang đăng nhập
│   ├── student-dashboard.html   # Dashboard học sinh (849KB)
│   ├── teacher-dashboard.html   # Dashboard giáo viên
│   ├── school-dashboard.html    # Dashboard quản lý trường
│   ├── system-admin.html        # Dashboard admin hệ thống
│   ├── css/                     # Stylesheets
│   └── js/                      # JavaScript files
│
├── 📁 views/                    # 📺 EJS TEMPLATES
│   └── room.ejs                 # Video call room template
│
├── 📁 data/                     # 📊 DATA FILES
│   ├── ai_settings.json         # Cấu hình AI
│   ├── schools.json             # Dữ liệu trường học
│   └── careers/                 # Dữ liệu nghề nghiệp
│
├── 📁 tests/                    # 🧪 TEST FILES
│   ├── test-groq-direct.js      # Test Groq API
│   ├── test-inbox-api.js        # Test Inbox API
│   └── test-omr.js              # Test OMR grading
│
├── 📁 android/                  # 📱 ANDROID APP (Capacitor)
│
├── 📁 ChamThiTuDong/            # 📝 OMR GRADING MODULE (Python)
│
├── 📁 AI/                       # 🤖 AI MODELS & DATA
│
├── 📁 .agent/                   # 🧠 ANTIGRAVITY KIT (AI Skills)
│   ├── skills/                  # 35 AI expertise skills
│   ├── rules/                   # 10 coding rules
│   └── workflows/               # 2 workflows
│
├── 📁 _archive/                 # 📦 OLD DATA (Training, test images)
│
└── 📁 _legacy/                  # 🗄️ LEGACY FILES (Backup)
    ├── server-modular-template.js  # Template server mới (tham khảo)
    └── fix_*.py                    # Old Python scripts
```

---

## 📄 Chi Tiết Các File Quan Trọng

### 🔴 Files Cốt Lõi

| File | Dòng | Mô tả |
|------|------|-------|
| `server.js` | 7800+ | Backend Express.js chính - chứa toàn bộ API |
| `package.json` | - | Dependencies: express, mongoose, passport, socket.io |
| `.env` | - | API keys, MongoDB URI, session secrets |

### 🟢 Models (Database)

| File | Mô tả |
|------|-------|
| `User.js` | Người dùng: username, password, role, schoolId |
| `School.js` | Trường học: name, schoolCode, status, docs |
| `Class.js` | Lớp học, sổ đầu bài, bảng thi đua |
| `Activity.js` | Bài tập, thông báo, AI usage, connections |
| `Content.js` | Posts, books, quizzes, messages, notes |

### 🔵 Routes (API Endpoints)

| File | Endpoints |
|------|-----------|
| `auth.routes.js` | `/login`, `/register`, `/logout`, `/change-password` |
| `school.routes.js` | `/info`, `/members`, `/classes`, `/rankings` |
| `admin.routes.js` | `/stats`, `/users`, `/schools`, `/notifications` |
| `profile.js` | `/:username`, `/update` |

### 🟡 Services (Business Logic)

| File | Mô tả |
|------|-------|
| `authMiddleware.js` | `requireAuth`, `requireAdmin`, `requireRole` |
| `mongoManager.js` | Singleton MongoDB connection với auto-reconnect |
| `aiRouter.js` | Router cho AI requests |
| `hybridAIRouter.js` | Hybrid routing: local AI + cloud AI |

### 🟣 Config

| File | Mô tả |
|------|-------|
| `aiConfig.js` | OLLAMA_CONFIG, PROVIDERS, ROUTING_RULES, SYSTEM_PROMPTS |

---

## 🚀 Commands

```bash
# Chạy development server
npm start

# Hoặc
node server.js

# Chạy với nodemon (auto-reload)
npm run dev
```

---

## 📝 Ghi Chú

- **Trường học phải được duyệt** bởi admin trước khi hoạt động
- **AI có giới hạn** mặc định 15 lượt/ngày/user
- **OAuth** hỗ trợ Google và Facebook
- **Socket.IO** cho real-time chat và video call
- **PeerJS** cho WebRTC video conferencing
