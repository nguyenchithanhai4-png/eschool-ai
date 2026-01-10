/**
 * Content Models - Nội dung người dùng tạo
 */
const mongoose = require('mongoose');

// Post Schema (Bài đăng)
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

// Book Schema (Sách)
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: String,
    cover: String,
    link: String
}, { timestamps: true });

// Method Schema (Phương pháp học)
const methodSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: String,
    tag: String,
    views: { type: Number, default: 0 }
}, { timestamps: true });

// Quiz Schema
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

// Message Schema (Tin nhắn)
const messageSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    content: String,
    fromName: String,
    fromAvatar: String,
    read: { type: Boolean, default: false }
}, { timestamps: true });

// Note Schema (Ghi chú)
const noteSchema = new mongoose.Schema({
    username: { type: String, required: true },
    title: String,
    content: String,
    category: String,
    color: String
}, { timestamps: true });

// Flashcard Schema
const flashcardSchema = new mongoose.Schema({
    username: { type: String, required: true },
    title: String,
    cards: [{ front: String, back: String }],
    category: String
}, { timestamps: true });

// Resource Schema (Tài liệu)
const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: String,
    desc: String,
    fileUrl: String,
    uploadedBy: String,
    uploadedByName: String,
    downloads: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = {
    PostModel: mongoose.model('Post', postSchema),
    BookModel: mongoose.model('Book', bookSchema),
    MethodModel: mongoose.model('Method', methodSchema),
    QuizModel: mongoose.model('Quiz', quizSchema),
    MessageModel: mongoose.model('Message', messageSchema),
    NoteModel: mongoose.model('Note', noteSchema),
    FlashcardModel: mongoose.model('Flashcard', flashcardSchema),
    ResourceModel: mongoose.model('Resource', resourceSchema)
};
