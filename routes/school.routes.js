/**
 * School Routes - API endpoints cho quản lý trường học
 * 
 * Routes:
 * - GET /api/school/info - Lấy thông tin trường
 * - GET /api/school/members - Lấy danh sách thành viên
 * - GET /api/school/classes - Lấy danh sách lớp
 * - POST /api/school/classes - Tạo lớp mới
 * - GET /api/school/rankings - Bảng thi đua
 */
const express = require('express');
const router = express.Router();

/**
 * Factory function để tạo router với dependencies
 * @param {Object} deps - { SchoolModel, ClassModel, UserModel, ClassRankingModel }
 */
module.exports = function (deps) {
    const { SchoolModel, ClassModel, UserModel, ClassRankingModel, ActivityLogModel } = deps;

    // ============================================
    // GET /info - Lấy thông tin trường
    // ============================================
    router.get('/info', async (req, res) => {
        try {
            const { schoolId, schoolCode } = req.query;

            let school;
            if (schoolId) {
                school = await SchoolModel.findById(schoolId);
            } else if (schoolCode) {
                school = await SchoolModel.findOne({ schoolCode });
            }

            if (!school) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy trường'
                });
            }

            res.json({ success: true, school });
        } catch (err) {
            console.error('[School] Get info error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // GET /members - Lấy danh sách thành viên
    // ============================================
    router.get('/members', async (req, res) => {
        try {
            const { schoolId, role } = req.query;

            if (!schoolId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing schoolId'
                });
            }

            const query = { schoolId };
            if (role) query.role = role;

            const members = await UserModel.find(query)
                .select('-password')
                .sort({ createdAt: -1 });

            res.json({ success: true, members, count: members.length });
        } catch (err) {
            console.error('[School] Get members error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // GET /classes - Lấy danh sách lớp
    // ============================================
    router.get('/classes', async (req, res) => {
        try {
            const { schoolId } = req.query;

            if (!schoolId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing schoolId'
                });
            }

            const classes = await ClassModel.find({ schoolId, isActive: true })
                .sort({ grade: 1, name: 1 });

            res.json({ success: true, classes });
        } catch (err) {
            console.error('[School] Get classes error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // POST /classes - Tạo lớp mới
    // ============================================
    router.post('/classes', async (req, res) => {
        try {
            const { schoolId, name, grade, homeroomTeacherId, homeroomTeacherName } = req.body;

            if (!schoolId || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            // Check duplicate
            const existing = await ClassModel.findOne({ schoolId, name });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Lớp đã tồn tại'
                });
            }

            const newClass = new ClassModel({
                schoolId,
                name,
                grade: grade || parseInt(name.match(/\d+/)?.[0]) || 10,
                homeroomTeacherId,
                homeroomTeacherName
            });

            await newClass.save();

            // Log activity
            if (ActivityLogModel) {
                await new ActivityLogModel({
                    schoolId,
                    type: 'new_class',
                    icon: '📚',
                    title: 'Tạo lớp mới',
                    description: `Lớp ${name} đã được tạo`
                }).save();
            }

            res.json({ success: true, message: 'Tạo lớp thành công', class: newClass });
        } catch (err) {
            console.error('[School] Create class error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // GET /rankings - Bảng thi đua
    // ============================================
    router.get('/rankings', async (req, res) => {
        try {
            const { schoolId, week } = req.query;

            if (!schoolId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing schoolId'
                });
            }

            // Calculate week number
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const targetWeek = week ? parseInt(week) : Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
            const targetYear = now.getFullYear();

            // Get classes
            const classes = await ClassModel.find({ schoolId, isActive: true });

            const rankings = [];
            for (const cls of classes) {
                let ranking = await ClassRankingModel.findOne({
                    schoolId,
                    classId: cls._id,
                    weekNumber: targetWeek,
                    year: targetYear
                });

                if (!ranking) {
                    ranking = new ClassRankingModel({
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

            // Sort by score
            rankings.sort((a, b) => b.totalScore - a.totalScore);

            res.json({ success: true, rankings, week: targetWeek, year: targetYear });
        } catch (err) {
            console.error('[School] Get rankings error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================
    // GET /activity - Hoạt động gần đây
    // ============================================
    router.get('/activity', async (req, res) => {
        try {
            const { schoolId, limit = 20 } = req.query;

            if (!schoolId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing schoolId'
                });
            }

            const activities = await ActivityLogModel.find({ schoolId })
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            res.json({ success: true, activities });
        } catch (err) {
            console.error('[School] Get activity error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
