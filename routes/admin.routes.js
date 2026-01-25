/**
 * Admin Routes - API endpoints cho System Admin
 * 
 * Routes:
 * - GET /api/admin/stats - Thống kê hệ thống
 * - GET /api/admin/users - Danh sách users
 * - POST /api/admin/users/toggle-block - Block/Unblock user
 * - GET /api/admin/schools - Danh sách trường
 * - POST /api/admin/schools/approve - Duyệt trường
 */
const express = require('express');
const router = express.Router();

/**
 * Factory function để tạo router với dependencies
 * @param {Object} deps - { UserModel, SchoolModel, PostModel, AssignmentModel }
 */
module.exports = function (deps) {
    const { UserModel, SchoolModel, PostModel, AssignmentModel, NotificationModel } = deps;

    // ============================================
    // GET /stats - Thống kê hệ thống
    // ============================================
    router.get('/stats', async (req, res) => {
        try {
            const [users, posts, assignments, schools] = await Promise.all([
                UserModel.countDocuments(),
                PostModel ? PostModel.countDocuments() : 0,
                AssignmentModel ? AssignmentModel.countDocuments() : 0,
                SchoolModel.countDocuments()
            ]);

            const uptime = process.uptime();
            const memory = process.memoryUsage();

            res.json({
                success: true,
                stats: {
                    users,
                    posts,
                    assignments,
                    schools
                },
                server: {
                    uptime,
                    memory
                }
            });
        } catch (err) {
            console.error('[Admin] Get stats error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // GET /users - Danh sách users
    // ============================================
    router.get('/users', async (req, res) => {
        try {
            const { role, page = 1, limit = 50, search } = req.query;

            const query = {};
            if (role) query.role = role;
            if (search) {
                query.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { fullname: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await UserModel.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await UserModel.countDocuments(query);

            res.json({
                success: true,
                users,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (err) {
            console.error('[Admin] Get users error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // POST /users/toggle-block - Block/Unblock user
    // ============================================
    router.post('/users/toggle-block', async (req, res) => {
        try {
            const { userId, username } = req.body;

            const user = userId
                ? await UserModel.findById(userId)
                : await UserModel.findOne({ username });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User không tồn tại'
                });
            }

            user.isBlocked = !user.isBlocked;
            await user.save();

            res.json({
                success: true,
                message: user.isBlocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
                user: { username: user.username, isBlocked: user.isBlocked }
            });
        } catch (err) {
            console.error('[Admin] Toggle block error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // GET /schools - Danh sách trường
    // ============================================
    router.get('/schools', async (req, res) => {
        try {
            const { status, page = 1, limit = 50 } = req.query;

            const query = {};
            if (status) query.status = status;

            const schools = await SchoolModel.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await SchoolModel.countDocuments(query);

            res.json({
                success: true,
                schools,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (err) {
            console.error('[Admin] Get schools error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // POST /schools/approve - Duyệt trường
    // ============================================
    router.post('/schools/approve', async (req, res) => {
        try {
            const { schoolCode, schoolId } = req.body;

            const school = schoolId
                ? await SchoolModel.findById(schoolId)
                : await SchoolModel.findOne({ schoolCode });

            if (!school) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy trường'
                });
            }

            school.status = 'active';
            school.isActive = true;
            await school.save();

            // Update admin user status
            if (school.adminId) {
                await UserModel.findByIdAndUpdate(school.adminId, {
                    approvalStatus: 'approved'
                });
            }

            res.json({
                success: true,
                message: 'Đã duyệt trường thành công',
                school
            });
        } catch (err) {
            console.error('[Admin] Approve school error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // POST /schools/reject - Từ chối trường
    // ============================================
    router.post('/schools/reject', async (req, res) => {
        try {
            const { schoolCode, reason } = req.body;

            const school = await SchoolModel.findOne({ schoolCode });
            if (!school) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy trường'
                });
            }

            school.status = 'rejected';
            school.isActive = false;
            await school.save();

            res.json({
                success: true,
                message: 'Đã từ chối trường',
                reason
            });
        } catch (err) {
            console.error('[Admin] Reject school error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // POST /notifications/send - Gửi thông báo
    // ============================================
    router.post('/notifications/send', async (req, res) => {
        try {
            const { type, level, title, content, recipients } = req.body;

            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    error: 'Thiếu tiêu đề hoặc nội dung'
                });
            }

            const notification = new NotificationModel({
                type: type || 'general',
                level: level || 'info',
                title,
                content,
                sender: { id: 'system', name: 'Admin', role: 'admin' },
                recipients: recipients || { type: 'all' }
            });

            await notification.save();

            res.json({
                success: true,
                message: 'Đã gửi thông báo',
                notification
            });
        } catch (err) {
            console.error('[Admin] Send notification error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
