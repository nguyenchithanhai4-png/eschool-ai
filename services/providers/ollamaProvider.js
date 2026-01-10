/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    OLLAMA LOCAL AI PROVIDER                                   ║
 * ║                    E-School AI - Tích hợp AI Cục bộ                          ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  MÔ TẢ:                                                                       ║
 * ║  File này cung cấp giao diện để kết nối với Ollama - một phần mềm chạy       ║
 * ║  AI trên máy tính cục bộ (local), không cần internet.                        ║
 * ║                                                                               ║
 * ║  TẠI SAO DÙNG OLLAMA?                                                        ║
 * ║  1. Miễn phí 100% - không tốn tiền API như các dịch vụ cloud                ║
 * ║  2. Bảo mật - dữ liệu không ra khỏi máy tính                                 ║
 * ║  3. Nhanh - không phụ thuộc vào tốc độ mạng                                  ║
 * ║  4. Hoạt động offline - có thể dùng khi mất mạng                             ║
 * ║                                                                               ║
 * ║  CÁC MODEL SỬ DỤNG:                                                          ║
 * ║  - qwen2.5:7b     → Model xử lý văn bản (text), 7 tỷ tham số                  ║
 * ║  - qwen2.5vl:7b   → Model xử lý hình ảnh (vision), 7 tỷ tham số               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Đọc các biến môi trường từ file .env
require('dotenv').config();

// ============================================
// CẤU HÌNH LLAMA.CPP SERVER (CONFIGURATION)
// Định nghĩa các thông số kết nối tới llama.cpp server
// ============================================
const CONFIG = {
    // URL gốc của llama.cpp server (mặc định chạy trên cổng 8080)
    baseUrl: process.env.LOCAL_AI_URL || 'http://127.0.0.1:8080',

    // URL để gọi API chat (OpenAI-compatible endpoint)
    chatUrl: process.env.LOCAL_AI_CHAT_URL || 'http://127.0.0.1:8080/v1/chat/completions',

    // Tên model AI (Qwen2.5-VL-7B hỗ trợ cả text và vision)
    model: process.env.LOCAL_AI_MODEL || 'qwen2.5-vl-7b',

    // Thời gian chờ tối đa (120 giây = 2 phút)
    // AI cần thời gian để "suy nghĩ" và tạo câu trả lời
    timeout: parseInt(process.env.LOCAL_AI_TIMEOUT) || 120000
};

// ============================================
// LƯU TRỮ LỊCH SỬ CHAT (CHAT HISTORY STORAGE)
// Lưu các cuộc hội thoại để AI nhớ ngữ cảnh
// ============================================

// Map lưu lịch sử chat theo username
// Ví dụ: { "hocsinh01": [{role: "user", content: "..."}, {role: "assistant", content: "..."}] }
const chatHistories = new Map();

// Giới hạn số tin nhắn lưu trữ (10 cặp hỏi-đáp = 20 tin nhắn)
// Giúp tiết kiệm bộ nhớ và tránh context quá dài
const MAX_HISTORY_LENGTH = 10;

// ============================================
// KIỂM TRA OLLAMA CÓ SẴN SÀNG KHÔNG (AVAILABILITY CHECK)
// Hàm này kiểm tra xem Ollama server có đang chạy không
// ============================================

/**
 * HÀM KIỂM TRA OLLAMA CÓ SẴN SÀNG KHÔNG
 * -----------------------------------------
 * Mục đích: Kiểm tra xem Ollama server có đang chạy trên máy không
 * 
 * Cách hoạt động:
 * 1. Gọi API /api/tags của Ollama để lấy danh sách models
 * 2. Nếu nhận được phản hồi OK → Ollama đang chạy
 * 3. Nếu lỗi hoặc timeout (5 giây) → Ollama không sẵn sàng
 * 
 * @returns {Promise<boolean>} - true nếu Ollama đang chạy, false nếu không
 */
/**
 * HÀM KIỂM TRA OLLAMA CÓ SẴN SÀNG KHÔNG
 * -----------------------------------------
 * Mục đích: Kiểm tra xem Ollama server có đang chạy trên máy không
 * Cải tiến: Sử dụng TCP Socket thay vì HTTP request để kiểm tra nhanh và chính xác hơn
 * 
 * @returns {Promise<boolean>} - true nếu Ollama đang chạy, false nếu không
 */
async function checkAvailable() {
    return new Promise((resolve) => {
        const net = require('net');
        const url = new URL(CONFIG.baseUrl);
        const port = url.port || 8080;
        const host = url.hostname || '127.0.0.1';

        const socket = new net.Socket();
        socket.setTimeout(3000); // 3 giây timeout (nhanh hơn HTTP)

        socket.on('connect', () => {
            socket.destroy();
            resolve(true); // Kết nối thành công -> AI đang chạy
        });

        socket.on('timeout', () => {
            socket.destroy();
            console.log('[Qwen AI] Check timeout (TCP)');
            resolve(false);
        });

        socket.on('error', (err) => {
            socket.destroy();
            // console.log('[Qwen AI] Not available (TCP):', err.message);
            resolve(false);
        });

        socket.connect(port, host);
    });
}

// ============================================
// TẠO VĂN BẢN (TEXT GENERATION)
// Hàm này gửi câu hỏi văn bản đến AI và nhận câu trả lời
// ============================================

/**
 * HÀM GỌI OLLAMA ĐỂ TẠO VĂN BẢN
 * -----------------------------------------
 * Mục đích: Gửi câu hỏi của người dùng đến AI và nhận câu trả lời
 * 
 * Điểm đặc biệt:
 * - Có lưu lịch sử chat → AI nhớ được cuộc hội thoại trước đó
 * - Có system prompt → Định hướng cách AI trả lời
 * 
 * @param {string} prompt - Câu hỏi của người dùng
 * @param {string} systemPrompt - Hướng dẫn cho AI (VD: "Bạn là gia sư Toán")
 * @param {string} username - Tên người dùng (để lưu lịch sử riêng)
 * @returns {Promise<{success: boolean, data: string, model: string}>}
 * 
 * Cách hoạt động:
 * 1. Lấy lịch sử chat của user (nếu có)
 * 2. Xây dựng mảng messages: [system prompt] + [lịch sử] + [câu hỏi mới]
 * 3. Gửi request đến Ollama API
 * 4. Lưu câu hỏi + câu trả lời vào lịch sử
 * 5. Trả về câu trả lời của AI
 */
async function callText(prompt, systemPrompt = null, username = 'anonymous') {
    // ===== BƯỚC 1: LẤY HOẶC TẠO LỊCH SỬ CHAT =====
    // Mỗi user có lịch sử chat riêng biệt
    if (!chatHistories.has(username)) {
        chatHistories.set(username, []);
    }
    const history = chatHistories.get(username);

    // ===== BƯỚC 2: XÂY DỰNG MẢNG TIN NHẮN =====
    const messages = [];

    // Thêm system prompt (nếu có) - Đây là "nhân cách" của AI
    // Ví dụ: "Bạn là gia sư AI thông minh, giải thích dễ hiểu..."
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    // Thêm lịch sử cuộc hội thoại trước đó
    // Giúp AI nhớ ngữ cảnh, ví dụ: "Ở câu trước em hỏi về phương trình bậc 2..."
    messages.push(...history);

    // Thêm câu hỏi hiện tại của người dùng
    messages.push({ role: 'user', content: prompt });

    // ===== BƯỚC 3: TẠO CONTROLLER ĐỂ QUẢN LÝ TIMEOUT =====
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
        // ===== BƯỚC 4: GỌI LLAMA.CPP API (OpenAI-compatible) =====
        const response = await fetch(CONFIG.chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.model,           // Model AI (qwen2.5-vl-7b)
                messages: messages,            // Mảng tin nhắn đã xây dựng
                temperature: 0.7,              // Độ sáng tạo (0-1): 0.7 = cân bằng
                max_tokens: 4096               // Số token tối đa AI được tạo ra
            }),
            signal: controller.signal
        });

        // Xóa timeout vì đã nhận được phản hồi
        clearTimeout(timeoutId);

        // Kiểm tra lỗi HTTP
        if (!response.ok) {
            throw new Error(`LocalAI HTTP ${response.status}`);
        }

        // Parse JSON response (OpenAI format)
        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content || '';

        // ===== BƯỚC 5: CẬP NHẬT LỊCH SỬ CHAT =====
        // Lưu cả câu hỏi của user và câu trả lời của AI
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'assistant', content: assistantMessage });

        // Giới hạn độ dài lịch sử để tiết kiệm bộ nhớ
        // MAX_HISTORY_LENGTH * 2 vì mỗi cặp hỏi-đáp = 2 tin nhắn
        while (history.length > MAX_HISTORY_LENGTH * 2) {
            history.shift(); // Xóa tin nhắn cũ nhất
        }

        // ===== BƯỚC 6: TRẢ VỀ KẾT QUẢ =====
        return {
            success: true,
            data: assistantMessage,    // Câu trả lời của AI
            model: CONFIG.model        // Model đã sử dụng
        };

    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ============================================
// XỬ LÝ HÌNH ẢNH (VISION GENERATION)
// Hàm này gửi ảnh + câu hỏi đến AI và nhận câu trả lời
// Ví dụ: Upload ảnh bài toán → AI giải và trả lời
// ============================================

/**
 * HÀM GỌI LLAMA.CPP VISION ĐỂ XỬ LÝ HÌNH ẢNH
 * -----------------------------------------
 * Mục đích: Gửi ảnh kèm câu hỏi đến AI và nhận phân tích
 * 
 * Ứng dụng thực tế:
 * - Upload ảnh bài toán → AI giải bài
 * - Upload ảnh chữ viết tay → AI đọc và chấm
 * - Upload biểu đồ → AI phân tích
 * 
 * @param {string} imageBase64 - Ảnh đã mã hóa Base64
 * @param {string} prompt - Câu hỏi về ảnh (VD: "Giải bài toán này")
 * @param {string} mimeType - Loại ảnh (image/jpeg, image/png)
 * @returns {Promise<{success: boolean, data: string, model: string}>}
 */
async function callVision(imageBase64, prompt = 'Mô tả chi tiết nội dung trong ảnh này.', mimeType = 'image/jpeg') {
    // Tạo controller quản lý timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
        // Gọi llama.cpp API với OpenAI-compatible Vision format
        const response = await fetch(CONFIG.chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.model,     // Model hỗ trợ cả text và vision
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.7,
                max_tokens: 4096
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`LocalAI Vision HTTP ${response.status}`);
        }

        // Parse JSON response (OpenAI format)
        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content || '';

        return {
            success: true,
            data: assistantMessage,
            model: CONFIG.model
        };

    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ============================================
// QUẢN LÝ LỊCH SỬ CHAT (CHAT HISTORY MANAGEMENT)
// Các hàm hỗ trợ quản lý memory của AI
// ============================================

/**
 * HÀM XÓA LỊCH SỬ CHAT CỦA NGƯỜI DÙNG
 * -----------------------------------------
 * Mục đích: Bắt đầu cuộc hội thoại mới, AI sẽ "quên" các cuộc nói chuyện trước
 * 
 * Khi nào cần dùng:
 * - Người dùng muốn bắt đầu chủ đề mới
 * - Reset AI khi bị "lú" do ngữ cảnh cũ
 * 
 * @param {string} username - Tên người dùng cần xóa lịch sử
 */
function resetChatHistory(username) {
    chatHistories.delete(username);
    console.log(`[OllamaProvider] Chat history reset for: ${username}`);
}

/**
 * HÀM LẤY TRẠNG THÁI HIỆN TẠI CỦA OLLAMA PROVIDER
 * -----------------------------------------
 * Mục đích: Hiển thị thông tin cấu hình cho admin/debug
 * 
 * @returns {object} - Thông tin cấu hình và trạng thái
 */
function getStatus() {
    return {
        model: CONFIG.model,                    // Model text đang dùng
        visionModel: CONFIG.visionModel,        // Model vision đang dùng
        baseUrl: CONFIG.baseUrl,                // URL Ollama server
        timeout: CONFIG.timeout,                // Timeout hiện tại
        activeSessions: chatHistories.size      // Số user đang có lịch sử chat
    };
}

// ============================================
// XUẤT CÁC HÀM ĐỂ SỬ DỤNG Ở FILE KHÁC (EXPORTS)
// module.exports cho phép các file khác import và sử dụng các hàm này
// Ví dụ: const ollama = require('./ollamaProvider'); ollama.callText(...)
// ============================================
module.exports = {
    checkAvailable,      // Kiểm tra Ollama có sẵn sàng không
    callText,            // Gọi AI với văn bản
    callVision,          // Gọi AI với hình ảnh
    resetChatHistory,    // Xóa lịch sử chat
    getStatus,           // Lấy trạng thái
    CONFIG               // Export cấu hình (để debug)
};
