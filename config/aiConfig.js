/**
 * AI Configuration - E-School Platform
 * Centralized configuration for all AI providers
 * 
 * Environment Variables:
 * - LOCAL_AI_URL: llama.cpp server URL (default: http://localhost:8080/v1/chat/completions)
 * - LOCAL_AI_MODEL: Local AI model (default: qwen2.5-vl-7b)
 * - LOCAL_AI_TIMEOUT: Timeout for local AI requests in ms (default: 120000)
 * - GEMINI_KEYS: Comma-separated Gemini API keys
 * - GROQ_KEYS: Comma-separated Groq API keys
 * - SAMBANOVA_KEYS: Comma-separated SambaNova API keys
 * - MISTRAL_KEYS: Comma-separated Mistral API keys
 * - COHERE_KEYS: Comma-separated Cohere API keys
 */

require('dotenv').config();

// ============================================
// LOCAL AI CONFIGURATION (llama.cpp server)
// ============================================
const OLLAMA_CONFIG = {
    url: process.env.LOCAL_AI_ENDPOINT ? (process.env.LOCAL_AI_ENDPOINT + '/chat/completions') : 'http://localhost:8080/v1/chat/completions',
    chatUrl: process.env.LOCAL_AI_ENDPOINT ? (process.env.LOCAL_AI_ENDPOINT + '/chat/completions') : 'http://localhost:8080/v1/chat/completions',
    model: process.env.LOCAL_AI_MODEL || 'qwen2.5-vl-7b',
    timeout: parseInt(process.env.LOCAL_AI_TIMEOUT) || 120000,
    enabled: true,
    maxConcurrent: 1,
    options: {
        temperature: 0.7,
        max_tokens: 4096
    }
};

// ============================================
// CLOUD PROVIDERS CONFIGURATION
// ============================================
const PROVIDERS = {
    'gemini': {
        name: 'Google Gemini',
        type: 'google-sdk',
        model: 'gemini-2.0-flash',
        visionModel: 'gemini-2.0-flash',
        priority: 1,
        keys: (process.env.GEMINI_KEYS || '').split(',').filter(k => k.trim())
    },
    'groq': {
        name: 'Groq',
        type: 'openai-compatible',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama3-8b-8192',
        priority: 2,
        maxTokens: 4096,
        keys: (process.env.GROQ_KEYS || '').split(',').filter(k => k.trim())
    },
    'sambanova': {
        name: 'SambaNova',
        type: 'openai-compatible',
        endpoint: 'https://api.sambanova.ai/v1/chat/completions',
        model: 'Meta-Llama-3.1-8B-Instruct',
        priority: 3,
        maxTokens: 4096,
        keys: (process.env.SAMBANOVA_KEYS || '').split(',').filter(k => k.trim())
    },
    'mistral': {
        name: 'Mistral AI',
        type: 'openai-compatible',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-small-latest',
        priority: 4,
        maxTokens: 4096,
        keys: (process.env.MISTRAL_KEYS || '').split(',').filter(k => k.trim())
    },
    'cohere': {
        name: 'Cohere',
        type: 'cohere',
        endpoint: 'https://api.cohere.ai/v2/chat',
        model: 'command-r-plus',
        priority: 5,
        keys: (process.env.COHERE_KEYS || '').split(',').filter(k => k.trim())
    }
};

// ============================================
// ROUTING RULES
// ============================================
const ROUTING_RULES = {
    'chat': { primary: ['gemini', 'groq', 'sambanova'], backup: ['mistral', 'cohere'] },
    'vision': { primary: ['gemini'], backup: [] }, // Only Gemini for cloud vision
    'math': { primary: ['gemini', 'groq'], backup: ['mistral', 'cohere', 'sambanova'] },
    'english': { primary: ['groq', 'sambanova'], backup: ['gemini', 'mistral'] },
    'essay': { primary: ['cohere', 'gemini'], backup: ['mistral', 'sambanova'] },
    'flashcard': { primary: ['groq', 'mistral'], backup: ['sambanova', 'gemini'] },
    'mindmap': { primary: ['gemini', 'mistral'], backup: ['cohere', 'groq'] },
    'grading': { primary: ['gemini'], backup: ['cohere', 'mistral'] },
    'lesson': { primary: ['cohere', 'gemini'], backup: ['mistral', 'sambanova'] },
    'quiz': { primary: ['mistral', 'gemini'], backup: ['groq', 'cohere'] },
    'default': { primary: ['gemini', 'groq', 'sambanova'], backup: ['mistral', 'cohere'] }
};

// ============================================
// GLOBAL SETTINGS
// ============================================
const SETTINGS = {
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '500'),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
    enableFailover: process.env.AI_ENABLE_FAILOVER !== 'false'
};

// ============================================
// SYSTEM PROMPTS
// ============================================
const SYSTEM_PROMPTS = {
    'default': `[CRITICAL LANGUAGE RULE] BẠN CHỈ ĐƯỢC TRẢ LỜI BẰNG TIẾNG VIỆT.

BẠN LÀ: "E-School AI" - Gia sư ảo thông minh, chuyên nghiệp và thân thiện.

NGUYÊN TẮC GIAO TIẾP:
1. CHỦ ĐỘNG GỢI MỞ: Đừng chỉ trả lời cộc lốc. Hãy hỏi ngược lại học sinh để duy trì cuộc trò chuyện.
2. TRÍ NHỚ TỐT: Tham chiếu lại ngữ cảnh cũ khi phù hợp.
3. PHONG CÁCH: Xưng hô: "Mình" - "Bạn". KHÔNG dùng emoji.
4. NHIỆM VỤ: 
   - Giải bài tập (Toán/Lý/Hóa/Tin) chi tiết từng bước.
   - Mọi công thức Toán PHẢI được bọc trong ký hiệu $ để hiển thị đẹp.
   - Viết code thì phải có comment giải thích.
   - Nếu không biết thì thú nhận khéo, đừng bịa.`,

    'teacher_mode': `Bạn là một trợ lý giáo viên chuyên nghiệp.
Nhiệm vụ: Soạn giáo án, hỗ trợ phương pháp giảng dạy, tạo đề kiểm tra.
Phong cách: Chuyên nghiệp, súc tích, có cấu trúc rõ ràng.`,

    'vision': `Bạn là AI phân tích hình ảnh của E-School.
Khi nhận được ảnh về bài tập:
1. Mô tả chi tiết nội dung trong ảnh
2. Nếu là bài toán, hãy giải chi tiết từng bước
3. Nếu là văn bản, hãy trích xuất và phân tích
4. Trả lời bằng tiếng Việt, format Markdown đẹp`
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    OLLAMA_CONFIG,
    PROVIDERS,
    ROUTING_RULES,
    SETTINGS,
    SYSTEM_PROMPTS
};
