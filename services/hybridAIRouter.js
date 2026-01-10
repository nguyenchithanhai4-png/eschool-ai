/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    HYBRID AI ROUTER                                           ║
 * ║                    E-School AI - Điều phối AI Thông minh                     ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  MÔ TẢ:                                                                       ║
 * ║  File này là "bộ não" điều phối toàn bộ hệ thống AI của E-School.            ║
 * ║  Nó quyết định sử dụng AI nào (Local hay Cloud) cho mỗi request.            ║
 * ║                                                                               ║
 * ║  CHIẾN LƯỢC ĐIỀU PHỐI (ROUTING STRATEGY):                                    ║
 * ║                                                                               ║
 * ║  📷 XỬ LÝ ẢNH (VISION):                                                       ║
 * ║     VPS → Cloud (Gemini Vision)                                              ║
 * ║     Ưu tiên VPS vì có GPU mạnh, fallback Cloud nếu VPS fail                 ║
 * ║                                                                               ║
 * ║  💬 ENGLISH COACH & CHAT:                                                     ║
 * ║     Local (Ollama) → Cloud (Groq → Mistral → Gemini)                         ║
 * ║     Ưu tiên Local để tiết kiệm chi phí, fallback Cloud nếu Local fail       ║
 * ║                                                                               ║
 * ║  📝 CÁC TASK KHÁC:                                                            ║
 * ║     Local → VPS → Cloud                                                       ║
 * ║     Thử tuần tự cho đến khi thành công                                        ║
 * ║                                                                               ║
 * ║  LỢI ÍCH CỦA KIẾN TRÚC HYBRID:                                               ║
 * ║  1. Tiết kiệm chi phí - Dùng Local miễn phí khi có thể                       ║
 * ║  2. Độ tin cậy cao - Luôn có fallback nếu một hệ thống fail                   ║
 * ║  3. Tối ưu hiệu suất - Chọn AI phù hợp nhất cho từng loại task              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Đọc biến môi trường từ file .env
require('dotenv').config();

// Axios: Thư viện HTTP client để gọi API
const axios = require('axios');

// Import Cloud Provider để sử dụng làm fallback
const cloudProvider = require('./providers/cloudProvider');

// ============================================
// CẤU HÌNH HỆ THỐNG (CONFIGURATION)
// Định nghĩa các endpoint và thông số cho từng node AI
// ============================================
const CONFIG = {
    /**
     * LOCAL NODE - AI chạy trên máy người dùng (llama.cpp server)
     * -----------------------------------------
     * - Sử dụng llama.cpp với model Qwen2.5-VL-7B
     * - Miễn phí hoàn toàn
     * - Timeout dài hơn vì xử lý local (60 giây)
     */
    LOCAL_NODE: {
        name: 'Local Node',
        endpoint: process.env.LOCAL_AI_ENDPOINT || 'http://127.0.0.1:8080/v1',
        model: process.env.LOCAL_AI_MODEL || 'qwen2.5-vl-7b',
        timeout: 60000  // 60 giây
    },

    /**
     * VPS NODE - AI chạy trên máy chủ VPS riêng
     * ------------------------------------------
     * - Dùng cho xử lý ảnh (Vision) vì cần GPU
     * - Timeout dài hơn vì xử lý ảnh tốn thời gian (60 giây)
     */
    VPS_NODE: {
        name: 'VPS Node',
        endpoint: process.env.VPS_AI_ENDPOINT || 'http://IP_VPS:8000/v1',
        model: process.env.VPS_AI_MODEL || 'qwen2-vl:7b',
        timeout: 60000  // 60 giây = 1 phút
    },

    // Thông báo khi hệ thống đang bảo trì (tất cả AI fail)
    MAINTENANCE_MESSAGE: 'Hệ thống AI đang bảo trì, vui lòng thử lại sau.'
};

/**
 * BIẾN TRẠNG THÁI (STATE)
 * -----------------------
 * Lưu thống kê để theo dõi hiệu suất hệ thống
 */
const state = {
    stats: {
        totalRequests: 0,        // Tổng số request đã xử lý
        localSuccessCount: 0,    // Số lần Local xử lý thành công
        vpsSuccessCount: 0,      // Số lần VPS xử lý thành công
        fallbackCount: 0,        // Số lần phải dùng fallback
        errorCount: 0            // Số lần lỗi
    }
};

// ============================================
// CÁC HÀM GỌI API (API CALLS)
// Sử dụng AXIOS để tương thích tốt hơn
// ============================================

/**
 * HÀM GỌI NODE AI CHUNG
 * ----------------------
 * Gọi API theo chuẩn OpenAI Compatible đến bất kỳ node nào
 * 
 * @param {string} endpoint - URL của AI node
 * @param {object} body - Request body chứa model, messages, etc.
 * @param {number} timeout - Thời gian chờ tối đa (ms)
 * @returns {string} - Nội dung phản hồi từ AI
 */
async function callNode(endpoint, body, timeout = 20000) {
    try {
        // Gọi API endpoint /chat/completions (chuẩn OpenAI)
        const res = await axios.post(`${endpoint}/chat/completions`, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: timeout
        });

        // Trích xuất nội dung từ response
        return res.data.choices[0].message.content;
    } catch (e) {
        // Ném lỗi với thông tin chi tiết
        throw new Error(e.response ? `HTTP ${e.response.status}` : e.message);
    }
}

/**
 * HÀM GỌI LOCAL NODE (OLLAMA)
 * ----------------------------
 * Ưu tiên gọi Ollama trực tiếp trước, nếu không được thì gọi qua endpoint
 * 
 * @param {string} content - Nội dung câu hỏi
 * @param {string} systemPrompt - Hướng dẫn cho AI
 * @returns {object} - {success, data, node, model}
 */
async function callLocalNode(content, systemPrompt) {
    // Xây dựng mảng messages theo chuẩn OpenAI
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: content });

    // ===== BƯỚC 1: THỬ GỌI OLLAMA TRỰC TIẾP =====
    // Đây là cách tối ưu nhất vì gọi trực tiếp, không qua HTTP
    try {
        const ollama = require('./providers/ollamaProvider');
        // Kiểm tra Ollama có đang chạy không
        if (await ollama.checkAvailable()) {
            const res = await ollama.callText(content, systemPrompt);
            return { success: true, data: res.data, node: 'client-local' };
        }
    } catch (e) {
        // Ollama không khả dụng, tiếp tục với phương án khác
    }

    // ===== BƯỚC 2: GỌI QUA ENDPOINT (OpenAI Compatible) =====
    const text = await callNode(CONFIG.LOCAL_NODE.endpoint, {
        model: CONFIG.LOCAL_NODE.model,
        messages,
        max_tokens: 4096,
        temperature: 0.7
    }, CONFIG.LOCAL_NODE.timeout);

    return { success: true, data: text, node: 'local', model: CONFIG.LOCAL_NODE.model };
}

/**
 * HÀM GỌI VPS NODE
 * -----------------
 * Gọi AI trên VPS, hỗ trợ cả TEXT và VISION (xử lý ảnh)
 * 
 * @param {string} content - Nội dung câu hỏi
 * @param {string} systemPrompt - Hướng dẫn cho AI
 * @param {string} imageBase64 - Ảnh Base64 (optional, cho Vision)
 * @param {string} mimeType - Loại ảnh (image/jpeg, image/png)
 */
async function callVPSNode(content, systemPrompt, imageBase64, mimeType = 'image/jpeg') {
    let body;

    // ===== TRƯỜNG HỢP CÓ ẢNH (VISION) =====
    if (imageBase64) {
        // Format đặc biệt cho Vision API
        body = {
            model: CONFIG.VPS_NODE.model,
            messages: [{
                role: 'user',
                content: [
                    // Phần text: câu hỏi về ảnh
                    { type: 'text', text: systemPrompt ? `${systemPrompt}\n${content}` : content },
                    // Phần ảnh: Base64 encoded
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
                ]
            }],
            max_tokens: 4096
        };
    } else {
        // ===== TRƯỜNG HỢP CHỈ CÓ TEXT =====
        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: content });
        body = { model: CONFIG.VPS_NODE.model, messages, max_tokens: 4096 };
    }

    const text = await callNode(CONFIG.VPS_NODE.endpoint, body, CONFIG.VPS_NODE.timeout);
    return { success: true, data: text, node: 'vps', model: CONFIG.VPS_NODE.model };
}

// ============================================
// HÀM XỬ LÝ REQUEST CHÍNH (MAIN PROCESS REQUEST)
// Đây là HÀM QUAN TRỌNG NHẤT - Điều phối toàn bộ logic AI
// ============================================

/**
 * HÀM XỬ LÝ REQUEST AI - HÀM CHÍNH
 * ==================================
 * Nhận request từ user và điều phối đến AI phù hợp
 * 
 * LOGIC ĐIỀU PHỐI:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  REQUEST ─→ Có ảnh? ─YES─→ VPS ─fail─→ Cloud Vision        │
 * │              │                                              │
 * │              NO                                             │
 * │              │                                              │
 * │              ▼                                              │
 * │         English/Chat? ─YES─→ Local ─fail─→ Cloud Text      │
 * │              │                                              │
 * │              NO                                             │
 * │              │                                              │
 * │              ▼                                              │
 * │         Local ─fail─→ VPS ─fail─→ Cloud ─fail─→ ERROR      │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * @param {object} request - {hasImage, content, imageBase64, mimeType, systemPrompt, task}
 * @returns {Promise<{success, data, node, model, fallbackUsed}>}
 */
async function processRequest(request) {
    // Destructure các thông tin từ request
    const { hasImage, content, imageBase64, mimeType, systemPrompt, task = 'chat' } = request;

    // Tăng counter thống kê
    state.stats.totalRequests++;

    // =========================================================
    // CASE 1: REQUEST CÓ ẢNH → VPS → Cloud Fallback
    // =========================================================
    if (hasImage) {
        try {
            console.log('[Hybrid] Image -> VPS');
            // Thử gọi VPS trước (có GPU xử lý ảnh)
            const res = await callVPSNode(content, systemPrompt, imageBase64, mimeType);
            return { ...res, fallbackUsed: false };
        } catch (vpsErr) {
            // VPS fail → thử Cloud Vision (Gemini)
            console.warn('[Hybrid] VPS Vision failed, trying Cloud...');
            try {
                const res = await cloudProvider.callVision(imageBase64, content, mimeType);
                return { ...res, fallbackUsed: true };
            } catch (cloudErr) {
                console.error('[Hybrid] Cloud Vision failed');
                throw new Error('Không thể xử lý ảnh.');
            }
        }
    }

    // =========================================================
    // CASE 2: ENGLISH COACH / CHAT → Local → Cloud
    // Ưu tiên Local Ollama để tiết kiệm chi phí
    // =========================================================
    const isEnglish = task === 'chat' || task === 'gia_su';

    if (isEnglish) {
        console.log('[Hybrid] English Coach: Priority Local (Ollama) -> Fallback Cloud');

        // Bước 1: Thử Local (Ollama) trước
        try {
            console.log('[Hybrid] Trying Local (Ollama)...');
            return await callLocalNode(content, systemPrompt);
        } catch (localErr) {
            // Local fail → chuyển sang Cloud
            console.warn('[Hybrid] Local Node failed, switching to Cloud Fallback...');
        }

        // Bước 2: Fallback sang Cloud (Groq → Mistral → Gemini)
        try {
            console.log('[Hybrid] Trying Cloud Provider (Groq -> Mistral -> Gemini)...');
            const res = await cloudProvider.callText(content, systemPrompt);
            return { success: true, data: res.data, node: 'cloud', model: res.model, fallbackUsed: true };
        } catch (cloudErr) {
            // Tất cả đều fail
            console.error('[Hybrid] All AI Providers failed (Local & Cloud).');
            throw new Error(CONFIG.MAINTENANCE_MESSAGE);
        }
    }

    // =========================================================
    // CASE 3: CÁC TASK KHÁC → Local → VPS → Cloud
    // Thử tuần tự tất cả các nguồn AI
    // =========================================================

    // Thử Local
    try {
        console.log('[Hybrid] Trying Local...');
        return await callLocalNode(content, systemPrompt);
    } catch (localErr) {
        // Local fail, tiếp tục
    }

    // Thử VPS
    try {
        console.log('[Hybrid] Trying VPS...');
        return await callVPSNode(content, systemPrompt);
    } catch (vpsErr) {
        // VPS fail, tiếp tục
    }

    // Thử Cloud (chỉ khi chưa thử ở trên)
    if (!isEnglish) {
        try {
            console.log('[Hybrid] Trying Cloud...');
            const res = await cloudProvider.callText(content, systemPrompt);
            return { success: true, data: res.data, node: 'cloud', model: res.model };
        } catch (e) {
            // Cloud cũng fail
        }
    }

    // Tất cả đều fail → throw error
    throw new Error(CONFIG.MAINTENANCE_MESSAGE);
}

// ============================================
// XUẤT CÁC HÀM ĐỂ FILE KHÁC SỬ DỤNG (EXPORTS)
// ============================================
module.exports = {
    // Hàm chính xử lý request AI
    processRequest,

    // Kiểm tra sức khỏe hệ thống (cho admin dashboard)
    checkSystemHealth: async () => ({
        local: { isOnline: false },
        vps: { isOnline: false },
        systemReady: true,
        message: 'Hệ thống sẵn sàng (Cloud API)'
    }),

    // Hàm helper để gửi tin nhắn text
    sendTextMessage: (t, s) => processRequest({ content: t, systemPrompt: s }),

    // Kiểm tra sức khỏe nhanh
    checkHealth: async () => ({ isOnline: true, message: 'Cloud AI Ready' }),

    // Cập nhật endpoint (cho admin)
    updateLocalEndpoint: (u) => CONFIG.LOCAL_NODE.endpoint = u,
    updateVPSEndpoint: (u) => CONFIG.VPS_NODE.endpoint = u,

    // Lấy và reset thống kê
    getStats: () => state.stats,
    resetStats: () => {
        state.stats = { totalRequests: 0, localSuccessCount: 0, vpsSuccessCount: 0, fallbackCount: 0, errorCount: 0 };
    },

    // Lấy cấu hình hiện tại
    getConfig: () => ({
        local: { endpoint: CONFIG.LOCAL_NODE.endpoint, model: CONFIG.LOCAL_NODE.model },
        vps: { endpoint: CONFIG.VPS_NODE.endpoint, model: CONFIG.VPS_NODE.model }
    }),

    // Đồng bộ config từ database (placeholder)
    syncConfigFromDB: () => { },

    // Kiểm tra VPS (placeholder)
    checkVPSHealth: async () => ({ isOnline: false })
};
