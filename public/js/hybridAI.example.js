/**
 * Hybrid AI Router - Frontend Integration Example
 * ================================================
 * 
 * File này hướng dẫn cách tích hợp hybridAIRouter vào frontend
 * Dùng cho nút "Gửi" trong chat AI
 */

// ============================================
// 1. KIỂM TRA HEALTH TRƯỚC KHI GỬI
// ============================================

/**
 * Kiểm tra trạng thái Local Node trước khi cho phép gửi tin nhắn
 * Gọi hàm này khi page load hoặc trước khi user nhấn "Gửi"
 */
async function checkAIHealth() {
    try {
        const response = await fetch('/api/ai/health');
        const health = await response.json();

        // Cập nhật UI
        const healthIndicator = document.getElementById('ai-health-indicator');
        const sendButton = document.getElementById('btn-send');

        if (health.local.isOnline) {
            // Local Node sẵn sàng
            healthIndicator.innerHTML = `
                <span class="badge bg-success">
                    <i class="fas fa-check-circle"></i> 
                    Local AI sẵn sàng (${health.local.latency}ms)
                </span>
            `;
            sendButton.disabled = false;
        } else if (health.vps.isOnline) {
            // Fallback to VPS
            healthIndicator.innerHTML = `
                <span class="badge bg-warning">
                    <i class="fas fa-cloud"></i> 
                    Đang dùng VPS AI
                </span>
            `;
            sendButton.disabled = false;
        } else {
            // Cả hai đều offline
            healthIndicator.innerHTML = `
                <span class="badge bg-danger">
                    <i class="fas fa-exclamation-triangle"></i> 
                    AI đang bảo trì
                </span>
            `;
            sendButton.disabled = true;
        }

        return health;
    } catch (error) {
        console.error('Health check failed:', error);
        return { systemReady: false, error: error.message };
    }
}

// ============================================
// 2. GỬI TIN NHẮN VĂN BẢN
// ============================================

/**
 * Gửi tin nhắn văn bản đến AI
 * @param {string} message - Nội dung tin nhắn
 */
async function sendTextToAI(message) {
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message,
                hasImage: false
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`Phản hồi từ ${result.node} (${result.model}):`, result.data);
            console.log(`Độ trễ: ${result.latency}ms`);
            console.log(`Dùng fallback: ${result.fallbackUsed}`);
            return result;
        } else {
            throw new Error(result.error || 'Lỗi không xác định');
        }
    } catch (error) {
        console.error('Gửi tin nhắn thất bại:', error);
        throw error;
    }
}

// ============================================
// 3. GỬI TIN NHẮN KÈM HÌNH ẢNH
// ============================================

/**
 * Gửi tin nhắn kèm hình ảnh đến AI (sẽ dùng VPS Node)
 * @param {string} message - Câu hỏi về hình ảnh
 * @param {File} imageFile - File hình ảnh
 */
async function sendImageToAI(message, imageFile) {
    try {
        // Chuyển đổi file sang base64
        const base64 = await fileToBase64(imageFile);
        const mimeType = imageFile.type; // 'image/jpeg', 'image/png', etc.

        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message,
                hasImage: true,
                imageBase64: base64,
                mimeType: mimeType
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`Phản hồi Vision từ ${result.node}:`, result.data);
            return result;
        } else {
            throw new Error(result.error || 'Lỗi không xác định');
        }
    } catch (error) {
        console.error('Gửi hình ảnh thất bại:', error);
        throw error;
    }
}

/**
 * Chuyển đổi File sang base64
 * @param {File} file 
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Loại bỏ prefix "data:image/jpeg;base64,"
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// ============================================
// 4. VÍ DỤ SỬ DỤNG TRONG CHAT FORM
// ============================================

/**
 * Xử lý khi user nhấn nút Gửi
 */
async function handleSendMessage(event) {
    event.preventDefault();

    const input = document.getElementById('chat-input');
    const imageInput = document.getElementById('image-input');
    const message = input.value.trim();

    if (!message) return;

    // Hiển thị loading
    showLoading(true);

    try {
        let result;

        // Kiểm tra có ảnh không
        if (imageInput.files && imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];
            result = await sendImageToAI(message, imageFile);
        } else {
            result = await sendTextToAI(message);
        }

        // Hiển thị kết quả
        displayAIResponse(result);

        // Clear input
        input.value = '';
        imageInput.value = '';

    } catch (error) {
        displayError(error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Hiển thị phản hồi từ AI
 * @param {object} result 
 */
function displayAIResponse(result) {
    const chatContainer = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    messageDiv.innerHTML = `
        <div class="message-content">${result.data}</div>
        <div class="message-meta">
            <small class="text-muted">
                ${result.node === 'local' ? '🏠 Local' : '☁️ VPS'} • 
                ${result.model} • 
                ${result.latency}ms
                ${result.fallbackUsed ? ' • 🔄 Fallback' : ''}
            </small>
        </div>
    `;

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function displayError(message) {
    const chatContainer = document.getElementById('chat-messages');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    chatContainer.appendChild(errorDiv);
}

function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    loader.style.display = show ? 'block' : 'none';
}

// ============================================
// 5. AUTO HEALTH CHECK KHI LOAD PAGE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra health ngay khi load
    checkAIHealth();

    // Kiểm tra định kỳ mỗi 30 giây
    setInterval(checkAIHealth, 30000);

    // Gắn event listener
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }
});

// ============================================
// 6. XEM THỐNG KÊ SỬ DỤNG
// ============================================
async function getAIStats() {
    try {
        const response = await fetch('/api/ai/stats');
        const stats = await response.json();

        console.log('📊 AI Usage Stats:');
        console.log(`  Total Requests: ${stats.totalRequests}`);
        console.log(`  Local Success: ${stats.localSuccessCount} (${stats.localSuccessRate})`);
        console.log(`  VPS Success: ${stats.vpsSuccessCount} (${stats.vpsSuccessRate})`);
        console.log(`  Fallback Used: ${stats.fallbackCount} (${stats.fallbackRate})`);
        console.log(`  Errors: ${stats.errorCount} (${stats.errorRate})`);

        return stats;
    } catch (error) {
        console.error('Get stats failed:', error);
    }
}
