/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         AI ROUTER - TRUNG TÂM ĐIỀU PHỐI                       ║
 * ║                         E-School AI - Kiến trúc mới                           ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  MÔ TẢ:                                                                       ║
 * ║  Đây là ĐIỂM VÀO DUY NHẤT cho tất cả requests AI trong hệ thống.             ║
 * ║  Nó nhận request, phân loại, xếp hàng và route đến provider phù hợp.        ║
 * ║                                                                               ║
 * ║  LUỒNG XỬ LÝ (FLOW):                                                         ║
 * ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
 * ║  │  1. Nhận request { type, task, content, image?, meta }                  │  ║
 * ║  │  2. Validate (kiểm tra hợp lệ)                                          │  ║
 * ║  │  3. Phân loại: TEXT / IMAGE / FILE                                      │  ║
 * ║  │  4. Xếp hàng qua aiQueue (tránh quá tải GPU)                           │  ║
 * ║  │  5. Route tới provider phù hợp (ưu tiên LOCAL trước)                   │  ║
 * ║  │  6. Return { provider, model, response, latency_ms }                   │  ║
 * ║  └─────────────────────────────────────────────────────────────────────────┘  ║
 * ║                                                                               ║
 * ║  QUY TẮC ƯU TIÊN (PRIORITY RULES):                                           ║
 * ║  • TEXT:  Qwen 2.5-VL-7B (Local) → Cloud Fallback                            ║
 * ║  • IMAGE: Qwen 2.5-VL-7B Vision (Local) → Cloud Fallback                      ║
 * ║  • FILE:  Trích xuất text → gửi LLM (không gửi file thô)                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Import các provider và queue
const ollamaProvider = require('./providers/ollamaProvider');  // AI Local
const cloudProvider = require('./providers/cloudProvider');    // AI Cloud
const aiQueue = require('./aiQueue');                          // Hàng đợi xử lý

// ============================================
// SYSTEM PROMPTS CHO TỪNG LOẠI TASK
// Định nghĩa "nhân cách" của AI cho mỗi nhiệm vụ
// ============================================
const TASK_PROMPTS = {
    /**
     * GIA SƯ - Hỗ trợ học tập chung
     * Phong cách: Thân thiện, giải thích chi tiết, dễ hiểu
     */
    gia_su: `Bạn là gia sư AI thông minh. Hãy giải thích chi tiết, dễ hiểu như đang dạy học sinh.`,

    /**
     * SOẠN BÀI - Tạo bài giảng cho giáo viên
     * Output: Cấu trúc bài giảng hoàn chỉnh
     */
    soan_bai: `Bạn là giáo viên soạn bài giảng. Tạo nội dung bài học có cấu trúc rõ ràng với:
    1. Mục tiêu bài học
    2. Nội dung chính (chia thành các phần)
    3. Ví dụ minh họa
    4. Câu hỏi kiểm tra`,

    /**
     * CHẤM BÀI - Đánh giá bài làm học sinh
     * Output: Điểm số, nhận xét, lời khuyên
     */
    cham_bai: `Bạn là giáo viên chấm bài. Phân tích bài làm và đưa ra:
    1. Điểm số (thang 10)
    2. Nhận xét chi tiết
    3. Những điểm cần cải thiện
    4. Lời khuyên cho học sinh`,

    /**
     * GIẢI TOÁN - Hướng dẫn giải bài Toán
     * Output: Bài giải chi tiết với LaTeX
     * Đặc biệt: Sử dụng $...$ cho công thức toán
     */
    giai_toan: `Bạn là gia sư Toán. Giải bài toán chi tiết từng bước:
    1. Phân tích đề bài
    2. Xác định phương pháp giải
    3. Thực hiện từng bước (viết công thức LaTeX trong $...$)
    4. Kết luận và kiểm tra`,

    /**
     * DỊCH THUẬT - Dịch văn bản
     * Phong cách: Chính xác, tự nhiên
     */
    dich: `Bạn là dịch giả chuyên nghiệp. Dịch chính xác và tự nhiên, giữ nguyên ý nghĩa và văn phong.`,

    /**
     * TÓM TẮT - Rút gọn văn bản dài
     * Output: Tóm tắt ngắn gọn, đầy đủ ý chính
     */
    tom_tat: `Bạn là chuyên gia tóm tắt văn bản. Tóm tắt ngắn gọn nhưng đầy đủ ý chính, dễ hiểu.`,

    /**
     * CHAT - Trò chuyện thông thường
     * Sử dụng system prompt mặc định của AI
     */
    chat: null  // null = không có system prompt đặc biệt
};

// ============================================
// KIỂM TRA DỮ LIỆU ĐẦU VÀO (REQUEST VALIDATION)
// Đảm bảo request có đủ thông tin cần thiết
// ============================================

/**
 * HÀM KIỂM TRA REQUEST HỢP LỆ
 * ----------------------------
 * Kiểm tra xem request có đầy đủ và đúng format không
 * 
 * Các validation rules:
 * - TEXT: bắt buộc có content
 * - IMAGE: bắt buộc có image (base64)
 * - FILE: bắt buộc có content (text đã trích xuất)
 * 
 * @param {Object} request - Request cần validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateRequest(request) {
    if (!request) {
        return { valid: false, error: 'Request is required' };
    }

    const { type, content, image } = request;

    // Phải có type và type phải thuộc 3 loại hợp lệ
    if (!type || !['text', 'image', 'file'].includes(type)) {
        return { valid: false, error: 'Invalid type. Must be: text, image, or file' };
    }

    // TEXT yêu cầu phải có content (câu hỏi)
    if (type === 'text' && !content) {
        return { valid: false, error: 'Content is required for text requests' };
    }

    // IMAGE yêu cầu phải có image (base64)
    if (type === 'image' && !image) {
        return { valid: false, error: 'Image is required for image requests' };
    }

    // FILE yêu cầu phải có content (text đã trích xuất từ file)
    if (type === 'file' && !content) {
        return { valid: false, error: 'Extracted text content is required for file requests' };
    }

    return { valid: true };
}

// ============================================
// XỬ LÝ VĂN BẢN (TEXT HANDLER)
// Ưu tiên: Ollama → Cloud
// ============================================

/**
 * HÀM XỬ LÝ REQUEST VĂN BẢN
 * ---------------------------
 * Nhận câu hỏi văn bản và trả về câu trả lời từ AI
 * 
 * Logic:
 * 1. Lấy system prompt theo task
 * 2. Thử Ollama Local trước (miễn phí)
 * 3. Nếu fail → fallback sang Cloud
 * 
 * @param {string} content - Câu hỏi của người dùng
 * @param {string} task - Loại task (gia_su, giai_toan, ...)
 * @param {Object} meta - Metadata (username, fullname, ...)
 * @returns {Promise<{provider: string, model: string, response: string}>}
 */
async function handleText(content, task = 'chat', meta = {}) {
    // Lấy system prompt phù hợp với task
    const systemPrompt = TASK_PROMPTS[task] || null;
    const username = meta.username || 'anonymous';

    // Thêm tên người dùng vào context (nếu có)
    // Giúp AI có thể gọi tên học sinh trong câu trả lời
    let finalSystemPrompt = systemPrompt;
    if (meta.fullname && systemPrompt) {
        finalSystemPrompt = `[THÔNG TIN] Người dùng tên: ${meta.fullname}\n\n${systemPrompt}`;
    }

    // ===== BƯỚC 1: THỬ OLLAMA LOCAL TRƯỚC =====
    const ollamaAvailable = await ollamaProvider.checkAvailable();

    // Điều kiện để dùng Ollama:
    // - Ollama đang chạy
    // - Không có quá nhiều request trong queue
    if (ollamaAvailable && !aiQueue.isQueueBusy()) {
        try {
            console.log('[AIRouter] TEXT: Trying Ollama Local...');
            const result = await ollamaProvider.callText(content, finalSystemPrompt, username);
            return {
                provider: 'ollama',      // Đánh dấu dùng provider nào
                model: result.model,     // Model đã sử dụng
                response: result.data    // Câu trả lời
            };
        } catch (ollamaError) {
            // Ollama fail → log và kiểm tra xem có cho phép fallback không
            console.log('[AIRouter] TEXT: Ollama failed:', ollamaError.message);

            // Chỉ fallback sang cloud nếu có env USE_CLOUD_FALLBACK=true
            if (process.env.USE_CLOUD_FALLBACK !== 'true') {
                throw new Error('AI Local không khả dụng. Vui lòng đảm bảo AI đang chạy.');
            }
            console.log('[AIRouter] TEXT: Fallback to Cloud enabled, trying Cloud...');
        }
    } else if (!ollamaAvailable) {
        console.log('[AIRouter] TEXT: Ollama not available');

        // Chỉ fallback sang cloud nếu có env USE_CLOUD_FALLBACK=true
        if (process.env.USE_CLOUD_FALLBACK !== 'true') {
            throw new Error('AI Local không khả dụng. Vui lòng đảm bảo Ngrok tunnel đang chạy và LOCAL_AI_URL được cấu hình đúng.');
        }
        console.log('[AIRouter] TEXT: Fallback to Cloud enabled, trying Cloud...');
    } else {
        console.log('[AIRouter] TEXT: Queue busy, waiting...');
        // Nếu queue busy, vẫn thử cloud nếu được phép
        if (process.env.USE_CLOUD_FALLBACK !== 'true') {
            throw new Error('AI đang bận. Vui lòng thử lại sau.');
        }
    }

    // ===== BƯỚC 2: FALLBACK SANG CLOUD (chỉ khi được phép) =====
    console.log('[AIRouter] TEXT: Trying Cloud providers...');
    const result = await cloudProvider.callText(content, finalSystemPrompt);
    return {
        provider: result.provider,
        model: result.model,
        response: result.data
    };
}

// ============================================
// XỬ LÝ HÌNH ẢNH (IMAGE HANDLER)
// Ưu tiên: Ollama Vision → Gemini Vision
// ============================================

/**
 * HÀM XỬ LÝ REQUEST HÌNH ẢNH
 * ----------------------------
 * Nhận ảnh + câu hỏi và trả về phân tích/giải bài từ AI
 * 
 * Ứng dụng thực tế:
 * - Upload ảnh bài toán → AI giải chi tiết
 * - Upload ảnh bài làm → AI chấm điểm
 * - Upload biểu đồ → AI phân tích
 * 
 * @param {string} imageBase64 - Ảnh đã mã hóa Base64
 * @param {string} content - Câu hỏi về ảnh
 * @param {string} task - Loại task (giai_toan, cham_bai, ...)
 * @param {Object} meta - Metadata
 */
async function handleImage(imageBase64, content, task = 'giai_toan', meta = {}) {
    // Xây dựng prompt dựa trên task
    let prompt = content || 'Hãy mô tả chi tiết nội dung trong ảnh này.';

    // Customize prompt theo task
    if (task === 'giai_toan') {
        prompt = `${content || 'Xem ảnh này'}\n\nHãy phân tích và giải chi tiết bài toán/bài tập trong ảnh. Giải thích từng bước rõ ràng bằng tiếng Việt.`;
    } else if (task === 'cham_bai') {
        prompt = `${content || 'Xem ảnh này'}\n\nHãy chấm bài làm trong ảnh. Đưa ra điểm số và nhận xét chi tiết.`;
    }

    // ===== BƯỚC 1: THỬ OLLAMA VISION TRƯỚC =====
    const ollamaAvailable = await ollamaProvider.checkAvailable();
    if (ollamaAvailable) {
        try {
            console.log('[AIRouter] IMAGE: Trying Ollama Vision...');
            const result = await ollamaProvider.callVision(imageBase64, prompt);
            return {
                provider: 'ollama',
                model: result.model,
                response: result.data
            };
        } catch (ollamaError) {
            console.log('[AIRouter] IMAGE: Ollama Vision failed, fallback to Gemini...', ollamaError.message);
        }
    } else {
        console.log('[AIRouter] IMAGE: Ollama not available, using Gemini Vision...');
    }

    // ===== BƯỚC 2: FALLBACK SANG GEMINI VISION =====
    console.log('[AIRouter] IMAGE: Trying Gemini Vision...');
    const mimeType = meta.mimeType || 'image/jpeg';
    const result = await cloudProvider.callVision(imageBase64, prompt, mimeType);
    return {
        provider: result.provider,
        model: result.model,
        response: result.data
    };
}

// ============================================
// XỬ LÝ FILE (FILE HANDLER)
// Flow: Trích xuất text → Gửi như TEXT request
// ============================================

/**
 * HÀM XỬ LÝ REQUEST FILE
 * ------------------------
 * Nhận text đã trích xuất từ file và xử lý
 * 
 * LƯU Ý QUAN TRỌNG:
 * - File phải được PRE-PROCESSED (trích xuất text) trước khi gửi
 * - Không gửi file thô (PDF, DOCX) đến LLM
 * - Nếu nội dung quá dài → tự động cắt bớt
 * 
 * @param {string} content - Text đã trích xuất từ file
 * @param {string} task - Loại task (tom_tat, dich, ...)
 * @param {Object} meta - Metadata
 */
async function handleFile(content, task = 'tom_tat', meta = {}) {
    // Giới hạn độ dài content (8000 ký tự)
    // Lý do: Token context có giới hạn, quá dài sẽ lỗi hoặc mất tiền
    const maxChunkSize = 8000;
    let processedContent = content;

    if (content.length > maxChunkSize) {
        console.log(`[AIRouter] FILE: Content too long (${content.length}), truncating...`);
        // Cắt và thêm thông báo
        processedContent = content.substring(0, maxChunkSize) + '\n\n[Nội dung đã được rút gọn do quá dài]';
    }

    // Xây dựng prompt dựa trên task
    let prompt;
    if (task === 'tom_tat') {
        prompt = `Tóm tắt nội dung văn bản sau:\n\n${processedContent}`;
    } else if (task === 'dich') {
        prompt = `Dịch văn bản sau sang tiếng Việt:\n\n${processedContent}`;
    } else {
        prompt = `Phân tích và trả lời về nội dung sau:\n\n${processedContent}`;
    }

    // Chuyển sang xử lý như TEXT request
    return handleText(prompt, task, meta);
}

// ============================================
// HÀM CHÍNH - XỬ LÝ REQUEST (MAIN HANDLER)
// Điểm vào duy nhất cho tất cả AI requests
// ============================================

/**
 * HÀM XỬ LÝ REQUEST AI - ENTRY POINT
 * ====================================
 * Đây là hàm CHÍNH được export và sử dụng bởi server.js
 * 
 * Flow xử lý:
 * 1. Validate request
 * 2. Xác định type (TEXT/IMAGE/FILE)
 * 3. Xếp vào queue (tránh quá tải GPU)
 * 4. Route đến handler phù hợp
 * 5. Return kết quả
 * 
 * @param {Object} request - { type, task, content, image?, meta? }
 * @returns {Promise<{provider: string, model: string, response: string}>}
 */
async function handleRequest(request) {
    // ===== BƯỚC 1: VALIDATE REQUEST =====
    const validation = validateRequest(request);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const { type, task, content, image, meta } = request;

    console.log(`[AIRouter] Received request: type=${type}, task=${task || 'chat'}`);

    // ===== BƯỚC 2: XẾP HÀNG VÀ XỬ LÝ =====
    // aiQueue.enqueue() đảm bảo:
    // - Không chạy quá nhiều request cùng lúc (quá tải GPU)
    // - Xử lý theo thứ tự FIFO (First In First Out)
    return aiQueue.enqueue(async () => {
        switch (type) {
            case 'text':
                return handleText(content, task, meta || {});

            case 'image':
                return handleImage(image, content, task, meta || {});

            case 'file':
                return handleFile(content, task, meta || {});

            default:
                throw new Error(`Unknown request type: ${type}`);
        }
    }, `${type}:${task || 'chat'}`);
}

// ============================================
// LẤY TRẠNG THÁI HỆ THỐNG (STATUS)
// Cho admin dashboard và monitoring
// ============================================

/**
 * HÀM LẤY TRẠNG THÁI TOÀN BỘ HỆ THỐNG AI
 * ----------------------------------------
 * Trả về thông tin về queue, Ollama và Cloud providers
 * Dùng để hiển thị trên admin dashboard
 */
function getStatus() {
    return {
        queue: aiQueue.getStats(),       // Thống kê hàng đợi
        ollama: ollamaProvider.getStatus(), // Trạng thái Ollama
        cloud: cloudProvider.getStatus()    // Trạng thái Cloud
    };
}

/**
 * HÀM XÓA LỊCH SỬ CHAT CHO MỘT USER
 * -----------------------------------
 * Khi user muốn bắt đầu cuộc hội thoại mới
 */
function resetChatMemory(username) {
    ollamaProvider.resetChatHistory(username);
}

// ============================================
// KHỞI TẠO (INITIALIZATION)
// Chạy khi file được import lần đầu
// ============================================

// Banner hiển thị khi khởi động
console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        🤖 AI ROUTER - INITIALIZED                         ║');
console.log('║        Priority: LOCAL (Qwen AI) → CLOUD (Fallback)      ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Kiểm tra Ollama khi khởi động
// Thông báo cho admin biết AI local có sẵn sàng không
ollamaProvider.checkAvailable().then(available => {
    if (available) {
        console.log('🦙 Qwen AI: READY');
    } else {
        console.log('⚠️ Qwen AI: NOT AVAILABLE (using Cloud only)');
    }
});

// ============================================
// XUẤT CÁC HÀM ĐỂ FILE KHÁC SỬ DỤNG (EXPORTS)
// ============================================
module.exports = {
    handleRequest,      // Hàm chính - xử lý request
    getStatus,          // Lấy trạng thái hệ thống
    resetChatMemory,    // Xóa lịch sử chat

    // Export các handler riêng lẻ (nếu cần gọi trực tiếp)
    handleText,         // Xử lý text
    handleImage,        // Xử lý ảnh
    handleFile          // Xử lý file
};
