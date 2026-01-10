/**
 * Activity Models - Hoạt động và theo dõi
 */
const mongoose = require('mongoose');

// Assignment Schema (Bài tập)
const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: String,
    classId: String,
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

// Notification Schema
const notificationSchema = new mongoose.Schema({
    type: { type: String, default: 'general' },
    level: { type: String, default: 'info' },
    title: String,
    content: String,
    sender: {
        id: String,
        name: String,
        role: { type: String, enum: ['admin', 'school', 'teacher'] },
        schoolCode: String
    },
    recipients: {
        type: { type: String, enum: ['all', 'school', 'teachers', 'students', 'class'], default: 'all' },
        schoolCode: String,
        classId: String,
        userIds: [String]
    },
    readBy: [String],
    sentBy: String
}, { timestamps: true });

// Activity Log Schema
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

// AI Usage Schema
const aiUsageSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    date: String,
    count: { type: Number, default: 0 }
}, { timestamps: true });

// Connection Schema (Kết nối học sinh - giáo viên)
const connectionSchema = new mongoose.Schema({
    studentUsername: { type: String, required: true },
    studentName: String,
    studentEmail: String,
    teacherEmail: { type: String, required: true },
    teacherName: String,
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] }
}, { timestamps: true });

// Template Schema
const templateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: Buffer, required: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = {
    AssignmentModel: mongoose.model('Assignment', assignmentSchema),
    NotificationModel: mongoose.model('Notification', notificationSchema),
    ActivityLogModel: mongoose.model('ActivityLog', activityLogSchema),
    AIUsageModel: mongoose.model('AIUsage', aiUsageSchema),
    ConnectionModel: mongoose.model('Connection', connectionSchema),
    TemplateModel: mongoose.model('Template', templateSchema)
};
