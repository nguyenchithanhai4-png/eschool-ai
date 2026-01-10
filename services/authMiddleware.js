/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         AUTH MIDDLEWARE                                       ║
 * ║                         Xác thực người dùng cho API                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Middleware này kiểm tra xem user đã đăng nhập chưa trước khi cho phép
 * truy cập vào các API nhạy cảm.
 * 
 * SỬ DỤNG:
 * - Thêm middleware vào routes cần bảo vệ
 * - Có thể kiểm tra role (student, teacher, school, admin)
 */

/**
 * Middleware xác thực cơ bản
 * Kiểm tra header 'x-username' hoặc body.username
 * 
 * LƯU Ý: Đây là xác thực đơn giản cho development.
 * Production nên dùng JWT hoặc session-based auth.
 */
function requireAuth(req, res, next) {
    // Lấy username từ nhiều nguồn có thể có
    const username = req.headers['x-username'] ||
        req.body?.username ||
        req.query?.username;

    if (!username) {
        return res.status(401).json({
            success: false,
            error: 'Vui lòng đăng nhập để sử dụng tính năng này',
            code: 'AUTH_REQUIRED'
        });
    }

    // Lưu username vào request để các route có thể sử dụng
    req.currentUser = { username };
    next();
}

/**
 * Middleware kiểm tra role
 * Cho phép giới hạn truy cập theo vai trò
 * 
 * @param {string[]} allowedRoles - Mảng các role được phép (ví dụ: ['teacher', 'admin'])
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const role = req.headers['x-role'] || req.body?.role;

        if (!role) {
            return res.status(401).json({
                success: false,
                error: 'Không xác định được vai trò người dùng',
                code: 'ROLE_REQUIRED'
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                error: `Tính năng này yêu cầu quyền: ${allowedRoles.join(' hoặc ')}`,
                code: 'FORBIDDEN'
            });
        }

        req.currentUser = { ...req.currentUser, role };
        next();
    };
}

/**
 * Middleware kiểm tra admin
 * Chỉ cho phép admin truy cập
 */
function requireAdmin(req, res, next) {
    const role = req.headers['x-role'] || req.body?.role;

    if (role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Chỉ Admin mới có quyền truy cập',
            code: 'ADMIN_ONLY'
        });
    }

    next();
}

/**
 * Middleware kiểm tra school hoặc admin
 * Cho phép school managers và admin
 */
function requireSchoolOrAdmin(req, res, next) {
    const role = req.headers['x-role'] || req.body?.role;

    if (!['school', 'admin'].includes(role)) {
        return res.status(403).json({
            success: false,
            error: 'Chỉ Quản lý trường hoặc Admin mới có quyền',
            code: 'SCHOOL_ADMIN_ONLY'
        });
    }

    next();
}

/**
 * Middleware kiểm tra teacher trở lên
 * Cho phép teacher, school, admin
 */
function requireTeacherOrAbove(req, res, next) {
    const role = req.headers['x-role'] || req.body?.role;

    if (!['teacher', 'school', 'admin'].includes(role)) {
        return res.status(403).json({
            success: false,
            error: 'Tính năng này dành cho Giáo viên trở lên',
            code: 'TEACHER_REQUIRED'
        });
    }

    next();
}

/**
 * Middleware để log API calls (cho debugging/monitoring)
 */
function logAPICall(req, res, next) {
    const username = req.headers['x-username'] || 'anonymous';
    const role = req.headers['x-role'] || 'unknown';
    console.log(`[API] ${new Date().toISOString()} | ${req.method} ${req.path} | User: ${username} (${role})`);
    next();
}

module.exports = {
    requireAuth,
    requireRole,
    requireAdmin,
    requireSchoolOrAdmin,
    requireTeacherOrAbove,
    logAPICall
};
