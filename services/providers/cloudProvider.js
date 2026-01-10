/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    CLOUD AI PROVIDER                                          ║
 * ║                    E-School AI - Tích hợp AI Đám mây                         ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  MÔ TẢ:                                                                       ║
 * ║  File này cung cấp giao diện để kết nối với các dịch vụ AI trên cloud.       ║
 * ║  Được sử dụng như FALLBACK khi Ollama local không khả dụng.                  ║
 * ║                                                                               ║
 * ║  TẠI SAO CẦN CLOUD AI?                                                       ║
 * ║  1. Dự phòng khi máy local quá yếu hoặc Ollama không chạy được               ║
 * ║  2. Xử lý hình ảnh phức tạp (Gemini Vision mạnh hơn Ollama Vision)          ║
 * ║  3. Đảm bảo hệ thống luôn hoạt động 24/7                                     ║
 * ║                                                                               ║
 * ║  THỨ TỰ ƯU TIÊN (Text):                                                      ║
 * ║  1. Groq    → Nhanh nhất (chạy trên chip LPU đặc biệt)                       ║
 * ║  2. Mistral → AI của Pháp, tốt cho tiếng Anh/Pháp                           ║
 * ║  3. Gemini  → AI của Google, đa năng và ổn định                              ║
 * ║                                                                               ║
 * ║  THỨ TỰ ƯU TIÊN (Xử lý ảnh - Vision):                                       ║
 * ║  - Gemini → Duy nhất hỗ trợ Vision trong danh sách này                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Đọc các biến môi trường từ file .env
require('dotenv').config();

// Axios: Thư viện để gọi HTTP API, tương thích tốt với nhiều môi trường
const axios = require('axios');

// Google Generative AI SDK: Thư viện chính thức của Google để gọi Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================
// CẤU HÌNH CHUNG (CONFIGURATION)
// Các thông số timeout và retry cho tất cả providers
// ============================================
const CONFIG = {
    // Thời gian chờ tối đa cho mỗi request (30 giây)
    timeout: parseInt(process.env.AI_TIMEOUT_MS) || 30000,

    // Số lần thử lại tối đa khi gặp lỗi (3 lần)
    maxRetries: parseInt(process.env.AI_MAX_RETRIES) || 3,

    // Thời gian chờ giữa các lần thử lại (500ms)
    retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS) || 500
};

// ============================================
// ĐỊNH NGHĨA CÁC PROVIDER (PROVIDER DEFINITIONS)
// Thông tin cấu hình cho từng dịch vụ AI cloud
// ============================================
const PROVIDERS = {
    /**
     * GROQ - Dịch vụ AI siêu nhanh
     * ----------------------------
     * - Sử dụng chip LPU (Language Processing Unit) đặc biệt
     * - Tốc độ inference nhanh gấp 10-20 lần GPU thông thường
     * - Model: LLaMA 3 (Meta) - 8 tỷ tham số
     * - Miễn phí sử dụng với giới hạn nhất định
     */
    groq: {
        name: 'Groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions', // API endpoint
        model: 'llama3-8b-8192',              // Model text (LLaMA 3, 8B params, 8192 context)
        visionModel: 'llama-3.2-11b-vision-preview', // Model vision (preview)
        type: 'openai-compatible',             // Dùng format API giống OpenAI
        keys: (process.env.GROQ_KEYS || '').split(',').filter(k => k.trim()), // Mảng API keys
        currentKeyIndex: 0,                    // Index key đang sử dụng (round-robin)
        failedKeys: new Set()                  // Set chứa các key đã fail
    },

    /**
     * MISTRAL AI - Dịch vụ AI của Pháp
     * ---------------------------------
     * - Công ty AI hàng đầu châu Âu
     * - Model: Mistral Small - 7 tỷ tham số
     * - Tốt cho tiếng Anh và tiếng Pháp
     * - Có tier miễn phí
     */
    mistral: {
        name: 'Mistral AI',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-small-latest',         // Model nhỏ gọn, nhanh
        type: 'openai-compatible',
        keys: (process.env.MISTRAL_KEYS || '').split(',').filter(k => k.trim()),
        currentKeyIndex: 0,
        failedKeys: new Set()
    },

    /**
     * GOOGLE GEMINI - AI mạnh nhất của Google
     * ----------------------------------------
     * - Model đa năng: text, code, vision, audio
     * - gemini-2.0-flash: Phiên bản nhanh, tiết kiệm token
     * - Hỗ trợ xử lý hình ảnh (Vision) rất mạnh
     * - Sử dụng SDK riêng của Google (không phải OpenAI format)
     */
    gemini: {
        name: 'Google Gemini',
        model: 'gemini-2.0-flash',             // Model text
        visionModel: 'gemini-2.0-flash',       // Model vision (cùng model với text)
        type: 'google-sdk',                    // Sử dụng Google SDK
        keys: (process.env.GEMINI_KEYS || '').split(',').filter(k => k.trim()),
        currentKeyIndex: 0,
        failedKeys: new Set()
    }
};

/**
 * THỨ TỰ ƯU TIÊN CHO XỬ LÝ VĂN BẢN
 * ---------------------------------
 * Tại sao Groq đầu tiên? → Nhanh nhất
 * Tại sao Gemini cuối cùng? → Ổn định nhất, dùng làm "bảo hiểm"
 */
const TEXT_PROVIDER_ORDER = ['groq', 'mistral', 'gemini'];

// ============================================
// QUẢN LÝ API KEYS (KEY MANAGEMENT)
// Xoay vòng và quản lý các API key để tránh rate limit
// ============================================

/**
 * HÀM LẤY API KEY TIẾP THEO CHO MỘT PROVIDER
 * -------------------------------------------
 * Mục đích: Xoay vòng (round-robin) các API key để phân bổ tải
 * 
 * Cách hoạt động:
 * 1. Lấy key theo index hiện tại
 * 2. Tăng index cho lần lấy tiếp theo
 * 3. Bỏ qua các key đã bị đánh dấu failed
 * 4. Nếu tất cả key failed → reset và bắt đầu lại
 * 
 * @param {string} providerName - Tên provider ('groq', 'mistral', 'gemini')
 * @returns {string|null} - API key hoặc null nếu không có
 */
function getNextKey(providerName) {
    const provider = PROVIDERS[providerName];

    // Kiểm tra provider có tồn tại và có keys không
    if (!provider || provider.keys.length === 0) return null;

    let attempts = 0;
    // Thử tất cả các keys
    while (attempts < provider.keys.length) {
        // Lấy key theo index hiện tại
        const key = provider.keys[provider.currentKeyIndex];

        // Tăng index cho lần lấy tiếp theo (xoay vòng)
        provider.currentKeyIndex = (provider.currentKeyIndex + 1) % provider.keys.length;

        // Nếu key chưa bị fail → trả về
        if (!provider.failedKeys.has(key)) return key;

        attempts++;
    }

    // Tất cả keys đều failed → clear và thử lại từ đầu
    provider.failedKeys.clear();
    return provider.keys[0] || null;
}

/**
 * HÀM ĐÁNH DẤU MỘT KEY ĐÃ FAIL
 * -----------------------------
 * Khi một key bị rate limit (429) hoặc lỗi khác,
 * ta đánh dấu nó để không sử dụng nó nữa trong phiên hiện tại.
 */
function markKeyFailed(providerName, key, reason = 'unknown') {
    const provider = PROVIDERS[providerName];
    if (provider && key) {
        provider.failedKeys.add(key);
        // Log để debug (chỉ hiện 8 ký tự đầu của key để bảo mật)
        console.log(`[CloudProvider] ${providerName} key marked failed: ${key.substring(0, 8)}... (${reason})`);
    }
}

/**
 * HÀM RESET TẤT CẢ KEYS
 * ----------------------
 * Dùng khi muốn "refresh" toàn bộ hệ thống,
 * cho phép thử lại tất cả các keys đã bị đánh dấu failed.
 */
function resetAllKeys() {
    Object.keys(PROVIDERS).forEach(name => {
        PROVIDERS[name].failedKeys.clear();
        PROVIDERS[name].currentKeyIndex = 0;
    });
}

// ============================================
// CÁC HÀM GỌI API (API HELPERS)
// Các hàm thực hiện gọi API đến từng provider
// ============================================

/**
 * Hàm delay - tạo khoảng chờ
 * Dùng Promise để chờ đợi giữa các lần retry
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * HÀM GỌI API THEO CHUẨN OPENAI
 * ------------------------------
 * Mục đích: Gọi các API có format giống OpenAI (Groq, Mistral)
 * 
 * OpenAI Format:
 * - POST /v1/chat/completions
 * - Body: { model, messages: [{role, content}], max_tokens, temperature }
 * - Header: Authorization: Bearer <key>
 * 
 * @param {string} providerName - Tên provider
 * @param {string} apiKey - API key
 * @param {string} prompt - Câu hỏi của user
 * @param {string} systemPrompt - Hướng dẫn cho AI
 */
async function callOpenAICompatible(providerName, apiKey, prompt, systemPrompt = null) {
    const provider = PROVIDERS[providerName];

    // Xây dựng mảng messages
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    try {
        // Gọi API bằng axios
        const response = await axios.post(provider.endpoint, {
            model: provider.model,         // Model sử dụng
            messages: messages,            // Mảng tin nhắn
            max_tokens: 4096,              // Số token tối đa
            temperature: 0.7               // Độ sáng tạo
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,  // Xác thực bằng Bearer token
                'Content-Type': 'application/json'
            },
            timeout: CONFIG.timeout
        });

        // Trích xuất nội dung từ response
        return response.data.choices?.[0]?.message?.content || '';
    } catch (error) {
        const status = error.response ? error.response.status : 'Network Error';
        throw new Error(`${providerName} HTTP ${status}: ${error.message}`);
    }
}

/**
 * HÀM GỌI GEMINI CHO VĂN BẢN
 * ---------------------------
 * Sử dụng Google SDK riêng (không phải OpenAI format)
 * 
 * @param {string} apiKey - Gemini API key
 * @param {string} prompt - Câu hỏi
 * @param {string} systemPrompt - Hướng dẫn cho AI
 */
async function callGeminiText(apiKey, prompt, systemPrompt = null) {
    // Khởi tạo client với API key
    const genAI = new GoogleGenerativeAI(apiKey);

    // Lấy model
    const model = genAI.getGenerativeModel({ model: PROVIDERS.gemini.model });

    // Ghép system prompt vào content (Gemini không có riêng system role)
    const content = systemPrompt ? `[SYSTEM]: ${systemPrompt}\n\n[USER]: ${prompt}` : prompt;

    // Gọi API và trả về text
    const result = await model.generateContent(content);
    return result.response.text();
}

/**
 * HÀM GỌI GEMINI CHO HÌNH ẢNH (VISION)
 * -------------------------------------
 * Gửi ảnh + câu hỏi đến Gemini để phân tích
 * 
 * Đây là HÀM DUY NHẤT xử lý hình ảnh trong Cloud Provider
 * (Groq và Mistral không hỗ trợ vision trong config này)
 * 
 * @param {string} apiKey - Gemini API key
 * @param {string} imageBase64 - Ảnh đã mã hóa Base64
 * @param {string} prompt - Câu hỏi về ảnh
 * @param {string} mimeType - Loại ảnh ('image/jpeg', 'image/png')
 */
async function callGeminiVision(apiKey, imageBase64, prompt, mimeType = 'image/jpeg') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: PROVIDERS.gemini.visionModel });

    // Gemini Vision yêu cầu content dạng mảng với text và image
    const content = [
        { text: prompt },                                    // Câu hỏi
        { inlineData: { mimeType: mimeType, data: imageBase64 } }  // Ảnh Base64
    ];

    const result = await model.generateContent(content);
    return result.response.text();
}

// ============================================
// CÁC HÀM CHÍNH XUẤT RA NGOÀI (MAIN EXPORTS)
// Đây là các hàm được sử dụng bởi các file khác
// ============================================

/**
 * HÀM GỌI AI CHO VĂN BẢN - HÀM CHÍNH
 * ------------------------------------
 * Mục đích: Gửi câu hỏi văn bản đến AI cloud và nhận trả lời
 * 
 * ĐẶC ĐIỂM QUAN TRỌNG - FALLBACK THÔNG MINH:
 * - Thử Groq trước (nhanh nhất)
 * - Nếu Groq fail → thử Mistral
 * - Nếu Mistral fail → thử Gemini (bảo hiểm cuối cùng)
 * - Mỗi provider được thử tối đa 3 lần với các key khác nhau
 * 
 * LÝ DO THIẾT KẾ NÀY:
 * - Đảm bảo hệ thống luôn hoạt động (high availability)
 * - Tận dụng quota miễn phí của nhiều provider
 * - Tránh bị rate limit (xoay vòng keys)
 * 
 * @param {string} prompt - Câu hỏi của người dùng
 * @param {string} systemPrompt - Hướng dẫn cho AI
 * @returns {Promise<{success, data, provider, model}>}
 */
async function callText(prompt, systemPrompt = null) {
    const errors = []; // Lưu các lỗi để debug

    // Duyệt qua từng provider theo thứ tự ưu tiên
    for (const providerName of TEXT_PROVIDER_ORDER) {
        const provider = PROVIDERS[providerName];

        // Bỏ qua nếu provider không có keys
        if (!provider || provider.keys.length === 0) continue;

        // Thử mỗi provider tối đa maxRetries lần
        for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
            const apiKey = getNextKey(providerName);
            if (!apiKey) break; // Hết keys khả dụng

            try {
                console.log(`[CloudProvider] Trying ${providerName} (Attempt ${attempt + 1})...`);

                let result;
                // Chọn hàm gọi phù hợp với loại provider
                if (provider.type === 'openai-compatible') {
                    result = await callOpenAICompatible(providerName, apiKey, prompt, systemPrompt);
                } else {
                    result = await callGeminiText(apiKey, prompt, systemPrompt);
                }

                // Thành công → trả về kết quả
                if (result) return { success: true, data: result, provider: providerName, model: provider.model };

            } catch (err) {
                // Xử lý lỗi
                const status = err.response ? err.response.status : null;
                const errorData = err.response ? JSON.stringify(err.response.data) : err.message;

                console.warn(`[CloudProvider] ${providerName} Error (HTTP ${status}): ${errorData}`);

                // PHÂN LOẠI LỖI ĐỂ XỬ LÝ PHÙ HỢP:
                // - 400: Bad Request (params sai) → không thử lại
                // - 401: Unauthorized (key sai) → đánh dấu key failed
                // - 403: Forbidden (không có quyền) → đánh dấu key failed
                // - 404: Not Found (model không tồn tại) → không thử lại
                // - 429: Rate Limit → đánh dấu key failed, thử key khác
                const isFatalError = status === 400 || status === 401 || status === 403 || status === 404;
                const isRateLimit = status === 429;

                if (isFatalError || isRateLimit) {
                    markKeyFailed(providerName, apiKey, `HTTP ${status}`);
                    // Lỗi 400 thường do params → chuyển sang provider khác ngay
                    if (status === 400) break;
                }

                // Chưa hết retry và không phải lỗi fatal → chờ rồi thử lại
                if (attempt < CONFIG.maxRetries - 1 && !isFatalError) {
                    await delay(CONFIG.retryDelayMs);
                } else {
                    // Ghi nhận lỗi
                    errors.push(`${providerName}: ${status} - ${errorData}`);
                }
            }
        }
    }

    // Tất cả providers đều failed
    throw new Error('All Cloud Providers Failed. Check API Keys in .env');
}

/**
 * HÀM GỌI AI CHO HÌNH ẢNH (VISION)
 * ----------------------------------
 * Mục đích: Gửi ảnh đến AI để phân tích
 * 
 * CHỈ SỬ DỤNG GEMINI vì:
 * - Gemini có khả năng Vision tốt nhất
 * - Groq và Mistral chưa ổn định với Vision
 * 
 * @param {string} imageBase64 - Ảnh Base64
 * @param {string} prompt - Câu hỏi về ảnh
 * @param {string} mimeType - Loại ảnh
 */
async function callVision(imageBase64, prompt, mimeType = 'image/jpeg') {
    // Thử tối đa maxRetries lần với Gemini
    for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
        const apiKey = getNextKey('gemini');
        if (!apiKey) throw new Error('No Gemini keys');

        try {
            const res = await callGeminiVision(apiKey, imageBase64, prompt, mimeType);
            return { success: true, data: res, provider: 'gemini', model: PROVIDERS.gemini.visionModel };
        } catch (err) {
            // Rate limit → đánh dấu key failed
            if (err.message.includes('429')) markKeyFailed('gemini', apiKey, 'rate_limit');

            // Đã hết retry → throw lỗi
            if (attempt === CONFIG.maxRetries - 1) throw err;

            // Chờ rồi thử lại
            await delay(CONFIG.retryDelayMs);
        }
    }
}

/**
 * HÀM GỌI TRỰC TIẾP MỘT PROVIDER CỤ THỂ
 * --------------------------------------
 * Dùng cho các trường hợp cần chỉ định cụ thể provider nào
 * (Ít dùng, chủ yếu để tương thích ngược - legacy)
 */
async function callProviderText(name, prompt, systemPrompt) {
    const apiKey = getNextKey(name);
    if (!apiKey) throw new Error('No key');

    if (PROVIDERS[name].type === 'openai-compatible') {
        return callOpenAICompatible(name, apiKey, prompt, systemPrompt);
    }
    return callGeminiText(apiKey, prompt, systemPrompt);
}

// ============================================
// XUẤT CÁC HÀM ĐỂ FILE KHÁC SỬ DỤNG (EXPORTS)
// ============================================
module.exports = {
    callText,           // Gọi AI với văn bản (Groq → Mistral → Gemini)
    callVision,         // Gọi AI với hình ảnh (Gemini only)
    callProviderText,   // Gọi một provider cụ thể
    resetAllKeys,       // Reset tất cả failed keys
    PROVIDERS           // Export config (để debug/admin)
};
