/**
 * Models Index - Export tất cả models
 * Usage: const { UserModel, SchoolModel, ... } = require('./models');
 */

const UserModel = require('./User');
const { SchoolModel, SystemSettings } = require('./School');
const { ClassModel, ClassDiaryModel, ClassRankingModel } = require('./Class');
const {
    PostModel, BookModel, MethodModel, QuizModel,
    MessageModel, NoteModel, FlashcardModel, ResourceModel
} = require('./Content');
const {
    AssignmentModel, NotificationModel, ActivityLogModel,
    AIUsageModel, ConnectionModel, TemplateModel
} = require('./Activity');

module.exports = {
    // User & Auth
    UserModel,

    // School
    SchoolModel,
    SystemSettings,

    // Class
    ClassModel,
    ClassDiaryModel,
    ClassRankingModel,

    // Content
    PostModel,
    BookModel,
    MethodModel,
    QuizModel,
    MessageModel,
    NoteModel,
    FlashcardModel,
    ResourceModel,

    // Activity
    AssignmentModel,
    NotificationModel,
    ActivityLogModel,
    AIUsageModel,
    ConnectionModel,
    TemplateModel
};
