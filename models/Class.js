/**
 * Class Models - Lớp học, Sổ đầu bài, Thi đua
 */
const mongoose = require('mongoose');

// Class Schema (Lớp học)
const classSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    grade: Number,
    homeroomTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    homeroomTeacherName: String,
    studentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Class Diary Schema (Sổ đầu bài)
const classDiarySchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    classId: String,
    period: Number,
    subject: String,
    teacher: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    date: Date,
    attendeesCount: Number,
    absentCount: Number,
    absentList: String,
    content: String,
    note: String,
    score: Number,
    violation: String,
    quality: String,
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Class Ranking Schema (Bảng Thi Đua)
const classRankingSchema = new mongoose.Schema({
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

module.exports = {
    ClassModel: mongoose.model('Class', classSchema),
    ClassDiaryModel: mongoose.model('ClassDiary', classDiarySchema),
    ClassRankingModel: mongoose.model('ClassRanking', classRankingSchema)
};
