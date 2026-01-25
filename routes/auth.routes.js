/**
 * Auth Routes - API endpoints cho xác thực
 * 
 * Routes:
 * - POST /api/auth/login - Đăng nhập
 * - POST /api/auth/register - Đăng ký
 * - POST /api/auth/logout - Đăng xuất
 * - GET /api/auth/check - Kiểm tra phiên đăng nhập
 * - POST /api/auth/change-password - Đổi mật khẩu
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

/**
 * Factory function để tạo router với dependencies
 * @param {Object} deps - { UserModel, passport }
 */
module.exports = function (deps) {
    const { UserModel, passport } = deps;

    // ============================================
    // POST /login - Đăng nhập
    // ============================================
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Vui lòng nhập tên đăng nhập và mật khẩu'
                });
            }

            const user = await UserModel.findOne({ username });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Tài khoản không tồn tại'
                });
            }

            // Check if account is blocked
            if (user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    error: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.'
                });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    error: 'Mật khẩu không đúng'
                });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Return user info (exclude password)
            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                user: {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    isVip: user.isVip,
                    schoolId: user.schoolId
                }
            });

        } catch (err) {
            console.error('[Auth] Login error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // POST /register - Đăng ký tài khoản mới
    // ============================================
    router.post('/register', async (req, res) => {
        try {
            const { username, password, email, fullname, role = 'student' } = req.body;

            // Validate required fields
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Vui lòng nhập tên đăng nhập và mật khẩu'
                });
            }

            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Mật khẩu phải có ít nhất 6 ký tự'
                });
            }

            // Sanitize username (lowercase, no special chars)
            const cleanUsername = username.toLowerCase().trim();

            // Check if username exists
            const existingUser = await UserModel.findOne({ username: cleanUsername });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Tên đăng nhập đã tồn tại'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create new user
            const newUser = new UserModel({
                username: cleanUsername,
                password: hashedPassword,
                email: email ? email.toLowerCase().trim() : undefined,
                fullname,
                role,
                approvalStatus: role === 'student' ? 'approved' : 'pending'
            });

            await newUser.save();

            res.json({
                success: true,
                message: 'Đăng ký thành công',
                user: {
                    _id: newUser._id,
                    username: newUser.username,
                    fullname: newUser.fullname,
                    role: newUser.role
                }
            });

        } catch (err) {
            console.error('[Auth] Register error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // POST /logout - Đăng xuất
    // ============================================
    router.post('/logout', (req, res) => {
        req.logout && req.logout();
        req.session && req.session.destroy();
        res.json({ success: true, message: 'Đăng xuất thành công' });
    });

    // ============================================
    // GET /check - Kiểm tra phiên đăng nhập
    // ============================================
    router.get('/check', (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
            res.json({
                success: true,
                authenticated: true,
                user: req.user
            });
        } else {
            res.json({
                success: true,
                authenticated: false
            });
        }
    });

    // ============================================
    // POST /change-password - Đổi mật khẩu
    // ============================================
    router.post('/change-password', async (req, res) => {
        try {
            const { username, currentPassword, newPassword } = req.body;

            if (!username || !currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Vui lòng điền đầy đủ thông tin'
                });
            }

            const user = await UserModel.findOne({ username });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Tài khoản không tồn tại'
                });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    error: 'Mật khẩu hiện tại không đúng'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();

            res.json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });

        } catch (err) {
            console.error('[Auth] Change password error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // Google OAuth Routes (nếu passport được cấu hình)
    // ============================================
    if (passport) {
        router.get('/google', passport.authenticate('google', {
            scope: ['profile', 'email']
        }));

        router.get('/google/callback',
            passport.authenticate('google', { failureRedirect: '/login.html' }),
            (req, res) => {
                const role = req.user.role || 'student';
                const dashboards = {
                    admin: '/system-admin.html',
                    school: '/school-dashboard.html',
                    teacher: '/teacher-dashboard.html',
                    student: '/student-dashboard.html'
                };
                res.redirect(dashboards[role] || '/student-dashboard.html');
            }
        );
    }

    return router;
};
