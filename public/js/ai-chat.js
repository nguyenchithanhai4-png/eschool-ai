/**
 * AI Chat & Hybrid Router Integration
 * Handles communication with the Hybrid AI Router (Local + VPS)
 * Features: Voice Input, Answer Modes, File Attachment
 */

const AIChat = {
    // State
    status: {
        local: false,
        vps: false,
        activeNode: 'loading' // 'local', 'vps', 'none'
    },

    config: {
        apiBase: '/api/ai'
    },

    // Answer Mode
    answerMode: 'comprehensive', // 'answer-only', 'guidance', 'comprehensive'

    // Voice Recognition
    recognition: null,
    isRecording: false,

    // File Attachment
    currentFile: null,
    currentFileContent: null,

    // UI Elements
    elements: {
        statusIndicator: null,
        chatBox: null,
        input: null,
        sendBtn: null,
        imageInput: null,
        previewArea: null,
        voiceBtn: null,
        fileInput: null,
        modeSelector: null
    },

    /**
     * Initialize the AI Chat module
     */
    init: async function () {
        console.log('[AIChat] Initializing with Voice, Modes & File features...');

        // Cache DOM elements
        this.elements.chatBox = document.getElementById('tutor-chat-box');
        this.elements.input = document.getElementById('tutor-input');
        this.elements.sendBtn = document.getElementById('send-btn');
        this.elements.imageInput = document.getElementById('tutor-img-input');
        this.elements.previewArea = document.getElementById('tutor-preview-area');
        this.elements.voiceBtn = document.getElementById('tutor-voice-btn');
        this.elements.fileInput = document.getElementById('tutor-file-input');
        this.elements.modeSelector = document.getElementById('tutor-mode-selector');

        // Initialize Voice Recognition
        this.initVoiceRecognition();

        // Bind Events
        this.bindEvents();

        // Setup Auto-LaTeX Rendering (Fix for reload issue)
        this.setupAutoLatex();
    },

    /**
     * Setup Auto LaTeX Rendering for Chat
     * Uses MutationObserver to render math in new/restored messages
     */
    setupAutoLatex: function () {
        const chatBox = this.elements.chatBox;
        if (!chatBox) return;

        const renderOptions = {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false,
            ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        };

        // 1. Initial Render (for any content already there)
        if (window.renderMathInElement) {
            window.renderMathInElement(chatBox, renderOptions);
        }

        // 2. Observer for dynamic content (history load, etc.)
        const observer = new MutationObserver((mutations) => {
            if (!window.renderMathInElement) return;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        window.renderMathInElement(node, renderOptions);
                    }
                });
            });
        });

        observer.observe(chatBox, { childList: true, subtree: true });
    },

    /**
     * Initialize Web Speech API for Voice Input
     */
    initVoiceRecognition: function () {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('[AIChat] Web Speech API not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'vi-VN'; // Vietnamese
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
            console.log('[AIChat] Voice recording started');
            this.isRecording = true;
            this.updateVoiceButtonUI(true);
        };

        this.recognition.onend = () => {
            console.log('[AIChat] Voice recording ended');
            this.isRecording = false;
            this.updateVoiceButtonUI(false);
        };

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            if (this.elements.input) {
                this.elements.input.value = transcript;
            }
        };

        this.recognition.onerror = (event) => {
            console.error('[AIChat] Voice recognition error:', event.error);
            this.isRecording = false;
            this.updateVoiceButtonUI(false);
        };
    },

    /**
     * Update Voice Button UI
     */
    updateVoiceButtonUI: function (isRecording) {
        const btn = this.elements.voiceBtn;
        if (!btn) return;

        if (isRecording) {
            btn.innerHTML = '<i class="fa-solid fa-stop text-danger"></i>';
            btn.classList.add('recording');
            btn.style.animation = 'pulse 1s infinite';
        } else {
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            btn.classList.remove('recording');
            btn.style.animation = '';
        }
    },

    /**
     * Toggle Voice Recording
     */
    toggleVoiceRecording: function () {
        if (!this.recognition) {
            alert('Trình duyệt không hỗ trợ ghi âm giọng nói. Vui lòng dùng Chrome.');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    },

    /**
     * Bind UI Events
     */
    bindEvents: function () {
        // Send Button
        if (this.elements.sendBtn) {
            const newBtn = this.elements.sendBtn.cloneNode(true);
            this.elements.sendBtn.parentNode.replaceChild(newBtn, this.elements.sendBtn);
            this.elements.sendBtn = newBtn;
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Enter key in Input
        if (this.elements.input) {
            this.elements.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Image Input Change (Preview)
        if (this.elements.imageInput) {
            this.elements.imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }

        // Voice Button
        if (this.elements.voiceBtn) {
            this.elements.voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        }

        // File Input
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Mode Selector
        if (this.elements.modeSelector) {
            this.elements.modeSelector.addEventListener('change', (e) => {
                this.answerMode = e.target.value;
                console.log('[AIChat] Answer mode changed to:', this.answerMode);
            });
        }

        // Expose global functions
        // NOTE: clearTutorImage and clearTutorFile are defined in student-dashboard.html
        // Do NOT overwrite them here as they have full logic for multi-file handling
        window.toggleTutorVoice = () => this.toggleVoiceRecording();
        window.setTutorMode = (mode) => { this.answerMode = mode; };
    },

    /**
     * Handle File Selection (PDF, TXT, DOCX)
     */
    handleFileSelect: function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
            alert('Chỉ hỗ trợ file: PDF, TXT, DOCX');
            return;
        }

        this.currentFile = file;

        // Read file content
        const reader = new FileReader();

        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            reader.onload = (event) => {
                this.currentFileContent = event.target.result;
                this.showFilePreview(file.name, 'txt');
            };
            reader.readAsText(file);
        } else if (file.type === 'application/pdf') {
            // For PDF, we'll send to server for extraction
            reader.onload = (event) => {
                this.currentFileContent = event.target.result; // base64
                this.showFilePreview(file.name, 'pdf');
            };
            reader.readAsDataURL(file);
        } else {
            // DOCX
            reader.onload = (event) => {
                this.currentFileContent = event.target.result; // base64
                this.showFilePreview(file.name, 'docx');
            };
            reader.readAsDataURL(file);
        }
    },

    /**
     * Show File Preview
     */
    showFilePreview: function (fileName, fileType) {
        const previewArea = document.getElementById('tutor-file-preview');
        if (!previewArea) return;

        const icons = {
            'pdf': 'fa-file-pdf text-danger',
            'txt': 'fa-file-lines text-info',
            'docx': 'fa-file-word text-primary'
        };

        previewArea.innerHTML = `
            <div class="d-flex align-items-center gap-2 p-2 rounded" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3);">
                <i class="fa-solid ${icons[fileType] || 'fa-file'}"></i>
                <span class="text-white-50 small text-truncate" style="max-width: 150px;">${fileName}</span>
                <button class="btn btn-sm p-0 ms-auto" onclick="clearTutorFile()" style="color: #ef4444;">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `;
        previewArea.style.display = 'block';
    },

    /**
     * Clear File
     */
    clearFile: function () {
        this.currentFile = null;
        this.currentFileContent = null;

        const previewArea = document.getElementById('tutor-file-preview');
        if (previewArea) {
            previewArea.style.display = 'none';
            previewArea.innerHTML = '';
        }

        if (this.elements.fileInput) {
            this.elements.fileInput.value = '';
        }
    },

    /**
     * Handle Image Selection
     */
    handleImageSelect: function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const previewImg = document.getElementById('tutor-preview-img');
            const previewArea = document.getElementById('tutor-preview-area');

            if (previewImg && previewArea) {
                previewImg.src = event.target.result;
                previewArea.style.display = 'flex';
                this.elements.currentImageBase64 = event.target.result;
            }
        };
        reader.readAsDataURL(file);
    },

    /**
     * Clear Selected Image
     */
    clearImage: function () {
        const previewArea = document.getElementById('tutor-preview-area');
        const input = document.getElementById('tutor-img-input');

        if (previewArea) previewArea.style.display = 'none';
        if (input) input.value = '';
        this.elements.currentImageBase64 = null;
    },

    /**
     * Get System Prompt based on Answer Mode
     */
    getSystemPrompt: function () {
        const modePrompts = {
            'answer-only': `Bạn là Gia sư AI người Việt Nam. Nhiệm vụ: CHỈ đưa ra đáp án trực tiếp bằng Tiếng Việt, không giải thích dài dòng. TUYỆT ĐỐI KHÔNG dùng tiếng Trung Quốc.`,
            'guidance': `Bạn là Gia sư AI người Việt Nam. Nhiệm vụ: Hướng dẫn học sinh từng bước bằng Tiếng Việt để tìm ra lời giải. KHÔNG đưa đáp án ngay. TUYỆT ĐỐI KHÔNG dùng tiếng Trung Quốc.`,
            'comprehensive': `Bạn là Gia sư AI người Việt Nam nhiệt tình và thân thiện. Nhiệm vụ:
1. Giải thích chi tiết, dễ hiểu bằng Tiếng Việt chuẩn.
2. TUYỆT ĐỐI KHÔNG sử dụng bất kỳ ký tự tiếng Trung Quốc nào (Kanji/Hanzi).
3. Nếu gặp thuật ngữ chuyên ngành, hãy dùng từ tiếng Việt tương đương hoặc giữ nguyên tiếng Anh nếu phổ biến.
4. Trình bày công thức toán học đẹp mắt.`
        };

        return modePrompts[this.answerMode] || modePrompts['comprehensive'];
    },

    /**
     * Send Message Logic
     */
    sendMessage: async function () {
        const content = this.elements.input.value.trim();
        const hasImage = !!this.elements.currentImageBase64;
        const hasFile = !!this.currentFileContent;

        if (!content && !hasImage && !hasFile) return;

        // Build message with file content
        let fullMessage = content;
        if (hasFile && this.currentFile) {
            if (this.currentFile.type === 'text/plain' || this.currentFile.name.endsWith('.txt')) {
                fullMessage = `[File đính kèm: ${this.currentFile.name}]\n\nNội dung file:\n${this.currentFileContent}\n\nCâu hỏi: ${content}`;
            } else {
                fullMessage = `[File đính kèm: ${this.currentFile.name}]\n\nCâu hỏi: ${content}`;
            }
        }

        // Add User Message to Chat
        this.appendMessage('user', content, this.elements.currentImageBase64);

        // Clear Input
        this.elements.input.value = '';
        this.clearImage();
        this.clearFile();
        this.setLoading(true);

        try {
            // Prepare Payload
            const payload = {
                content: fullMessage,
                hasImage: hasImage,
                systemPrompt: this.getSystemPrompt(),
                mode: this.answerMode
            };

            if (hasImage) {
                payload.imageBase64 = this.elements.currentImageBase64;
            }

            // Send Request
            const response = await fetch(`${this.config.apiBase}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            this.setLoading(false);

            if (data.success) {
                this.appendMessage('ai', data.data, null, data.node);
            } else {
                this.appendMessage('error', data.message || 'Có lỗi xảy ra khi xử lý yêu cầu.');
            }

        } catch (error) {
            console.error('[AIChat] Send failed:', error);
            this.setLoading(false);
            this.appendMessage('error', 'Không thể kết nối tới máy chủ AI.');
        }
    },

    /**
     * Append Message to Chat Box
     */
    appendMessage: function (role, text, image = null, nodeInfo = null) {
        const chatBox = this.elements.chatBox;
        if (!chatBox) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${role}`;

        let headerHtml = '';
        let contentHtml = '';

        if (role === 'user') {
            headerHtml = `
                <div class="msg-sender">Bạn</div>
                <div class="avatar"><i class="fa-solid fa-user"></i></div>
            `;

            let imgHtml = image ? `<div class="msg-image"><img src="${image}" style="max-width: 200px; border-radius: 8px; margin-bottom: 10px;"></div>` : '';
            contentHtml = `<div class="bubble">${imgHtml}${text.replace(/\n/g, '<br>')}</div>`;

            msgDiv.innerHTML = `<div class="msg-header" style="justify-content: flex-end;">${headerHtml}</div>${contentHtml}`;
        } else if (role === 'ai') {
            headerHtml = `
                <div class="avatar"><i class="fa-solid fa-atom"></i></div>
                <div class="msg-sender">Gia sư AI</div>
            `;

            let parsedText = text;

            // Pre-process LaTeX: Convert [ ... ] format to \[ ... \] for KaTeX
            // 1. Block math [ ... ] -> \[ ... \]
            parsedText = parsedText.replace(/\[\s*((?:[^[\]]*\\[a-zA-Z]+[^[\]]*|.*?[_=].*?)+)\s*\]/g, '\\[$1\\]');

            // Fix inline math: a_n, a_1, (n-1)d -> Wrap in $...$ if not already

            // 2. Wrap parenthesized math expressions: ( S_n ) -> $S_n$, ( a_1 = ... ) -> $a_1 = ...$
            // Match (...) containing at least one math char: _ = \ ^ or operator
            parsedText = parsedText.replace(/\(\s*([^()]*?[_=^\\+\-*/][^()]*?)\s*\)/g, '$$$1$$');

            // 3. Variables with subscript: a_n, S_n, a_{10} (outside of existing $...$)
            // Handle both a_n and a_{10} formats
            parsedText = parsedText.replace(/(^|[\s(])([a-zA-Z](?:_[a-zA-Z0-9]+|_{[^}]+}))(?=[\s).,!?]|$)/g, '$1$$$2$$');

            // 4. Double parentheses ((...)) -> eliminate double, wrap in $
            parsedText = parsedText.replace(/\(\(([^)]+)\)\)/g, '$$$1$$');

            if (typeof marked !== 'undefined') {
                parsedText = marked.parse(parsedText);
            } else {
                parsedText = parsedText.replace(/\n/g, '<br>');
            }

            contentHtml = `<div class="bubble ai-response">${parsedText}</div>`;

            msgDiv.innerHTML = `<div class="msg-header">${headerHtml}</div>${contentHtml}`;

            // Render Math (KaTeX)
            if (window.renderMathInElement) {
                setTimeout(() => {
                    renderMathInElement(msgDiv, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false,
                        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                    });
                }, 10);
            }
        } else {
            msgDiv.className = 'msg ai';
            contentHtml = `<div class="bubble" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5;">
                <i class="fa-solid fa-triangle-exclamation me-2"></i> ${text}
            </div>`;
            msgDiv.innerHTML = contentHtml;
        }

        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    },

    /**
     * Set Loading State
     */
    setLoading: function (isLoading) {
        const chatBox = this.elements.chatBox;
        const existingLoader = document.getElementById('ai-loading-indicator');

        if (isLoading) {
            if (!existingLoader) {
                const loader = document.createElement('div');
                loader.id = 'ai-loading-indicator';
                loader.className = 'msg ai';
                loader.innerHTML = `
                    <div class="msg-header">
                        <div class="avatar"><i class="fa-solid fa-atom"></i></div>
                        <div class="msg-sender">Gia sư AI</div>
                    </div>
                    <div class="bubble">
                        <div class="d-flex align-items-center gap-2">
                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                            <span class="text-white-50">Đang suy nghĩ...</span>
                        </div>
                    </div>
                `;
                chatBox.appendChild(loader);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        } else {
            if (existingLoader) {
                existingLoader.remove();
            }
        }
    }
};

// Pulse animation for voice recording
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.7; }
    }
    .recording {
        background: rgba(239, 68, 68, 0.2) !important;
        border-color: #ef4444 !important;
    }
`;
document.head.appendChild(style);

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    AIChat.init();
});
