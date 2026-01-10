
/**
 * New Features Logic
 * Implements AI Exam Prediction, Code Compiler, Universal Converter, Locker, etc.
 */

// ============================================
// 1. AI EXAM PREDICTION
// ============================================
async function generateExam() {
    const subject = document.getElementById('exam-subject')?.value || 'Toán';
    const level = document.getElementById('exam-level')?.value || '10';
    const fileInput = document.getElementById('exam-syllabus-file');

    if (!subject) return toast.warning('Vui lòng chọn môn học!');

    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo đề...';
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('level', level);
        if (fileInput?.files[0]) {
            formData.append('syllabus', fileInput.files[0]);
        }

        const res = await fetch('/api/ai/predict-exam', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            renderExamResult(data.exam);
            toast.success('Đã tạo đề thi thành công!');
        } else {
            toast.error(data.message || 'Lỗi tạo đề thi');
        }
    } catch (e) {
        console.error(e);
        toast.error('Lỗi kết nối server');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function renderExamResult(exam) {
    const container = document.getElementById('exam-result-container');
    if (!container) return;

    let html = `<h5 class="text-success fw-bold mb-3">Kết quả dự đoán:</h5>`;

    if (exam.questions && exam.questions.length > 0) {
        exam.questions.forEach((q, i) => {
            html += `
                <div class="glass-card p-3 mb-3">
                    <p class="fw-bold mb-2">Câu ${i + 1}: ${q.q}</p>
                    <div class="row g-2">
                        ${q.a.map((ans, idx) => `
                            <div class="col-6">
                                <div class="p-2 rounded border border-white border-opacity-10 small ${idx === q.correct ? 'bg-success bg-opacity-25' : ''}">
                                    ${String.fromCharCode(65 + idx)}. ${ans}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }

    if (exam.essay) {
        html += `<div class="glass-card p-3 mb-3 border-start border-4 border-warning">
            <h6 class="fw-bold text-warning">Bài Tự Luận:</h6>
            <p>${exam.essay}</p>
        </div>`;
    }

    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// 2. CODE COMPILER
// ============================================
// ============================================
// 2. CODE COMPILER
// ============================================
async function runCode() {
    console.log("Run Code button clicked (new-features.js)");
    const lang = document.getElementById('compiler-lang')?.value || 'javascript';
    const code = document.getElementById('code-editor')?.value;
    const outputDiv = document.getElementById('compiler-output');

    if (!outputDiv) {
        console.error("Output div not found!");
        return;
    }

    if (!code) {
        outputDiv.innerHTML = '<span class="text-warning">Vui lòng nhập code!</span>';
        return;
    }

    outputDiv.innerHTML = '> Compiling...';
    outputDiv.style.color = '#9ca3af';

    // Use short timeout to simulate processing and allow UI update
    setTimeout(async () => {
        let output = "";

        if (lang === 'javascript') {
            try {
                const logs = [];
                const originalLog = console.log;
                // Capture console.log
                console.log = (...args) => {
                    logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                };

                output += `> node main.js\n`;
                try {
                    // Execute Code
                    new Function(code)();
                } catch (runErr) {
                    logs.push(`Runtime Error: ${runErr.message}`);
                    console.error(runErr);
                }

                // Restore console.log
                console.log = originalLog;

                if (logs.length > 0) output += logs.join('\n');
                else output += "[No output]";

                output += `\n\n[Done] exited with code=0`;
                outputDiv.innerHTML = `<span style="color: #4ade80">${output}</span>`;

            } catch (e) {
                output = `Error: ${e.message}`;
                outputDiv.innerHTML = `<span style="color: #ef4444">${output}</span>`;
            }
        } else {
            // Use Piston API for Python/C++ (Real Execution)
            const languageMap = {
                'python': { language: 'python', version: '3.10.0' },
                'cpp': { language: 'c++', version: '10.2.0' }
            };

            const selectedconfig = languageMap[lang];

            try {
                const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: selectedconfig.language,
                        version: selectedconfig.version,
                        files: [{ content: code }]
                    })
                });

                const result = await response.json();

                if (result.run) {
                    let finalOut = result.run.stdout || "";
                    let finalErr = result.run.stderr || "";

                    if (finalErr) {
                        outputDiv.innerHTML = `<span style="color: #ef4444">${finalErr}</span>`;
                    } else {
                        outputDiv.innerHTML = `<span style="color: #e2e8f0">${finalOut}</span>`;
                    }

                    outputDiv.innerHTML += `\n\n<span style="color: #64748b">[Done] exited with code=${result.run.code}</span>`;
                } else {
                    throw new Error("API Error");
                }

            } catch (err) {
                console.warn("Piston API failed, falling back to mock:", err);

                // Fallback Mock logic
                let mockOut = "";
                if (lang === 'python') mockOut = `> python3 main.py\n`;
                if (lang === 'cpp') mockOut = `> g++ main.cpp -o main && ./main\n`;

                if (code.includes('print') || code.includes('cout')) {
                    const match = code.match(/["'](.*?)["']/);
                    mockOut += match ? match[1] : "Hello, E-School AI!";
                } else {
                    mockOut += "Hello, E-School AI!";
                }

                mockOut += `\n\n[Done] exited with code=0 (Simulated)`;
                outputDiv.innerHTML = `<span style="color: #9ca3af">${mockOut}</span>`;
            }
        }
    }, 200);
}

// ============================================
// 3. UNIVERSAL CONVERTER
// ============================================
async function convertFile() {
    const fileInput = document.getElementById('convert-file');
    const format = document.getElementById('convert-format')?.value;

    if (!fileInput?.files[0]) return toast.warning('Vui lòng chọn file!');

    const btn = event.target;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('format', format);

        const res = await fetch('/api/tools/convert', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            toast.success(data.message);
            // Show download link
            const resultDiv = document.getElementById('convert-result');
            if (resultDiv) {
                resultDiv.innerHTML = `<a href="${data.downloadUrl}" class="btn btn-success rounded-pill mt-3"><i class="fa-solid fa-download me-2"></i>Tải kết quả</a>`;
            }
        } else {
            toast.error(data.message || 'Lỗi chuyển đổi');
        }
    } catch (e) {
        toast.error('Lỗi kết nối');
    } finally {
        btn.innerHTML = 'Chuyển đổi ngay';
        btn.disabled = false;
    }
}

// ============================================
// 4. DIGITAL LOCKER
// ============================================
function loadLockerItems() {
    const items = JSON.parse(localStorage.getItem('locker_items') || '[]');
    const textItems = JSON.parse(localStorage.getItem('locker_texts') || '[]');
    const container = document.getElementById('locker-items');
    if (!container) return;

    container.innerHTML = '';

    // Render Uploaded Items
    items.forEach(item => {
        container.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="glass-card p-3 text-center h-100 position-relative">
                    <button class="btn btn-sm btn-icon position-absolute top-0 end-0 m-2 text-danger" onclick="removeLockerItem(${item.id})">&times;</button>
                    <i class="fa-solid fa-file-lines fa-3x mb-3 text-info"></i>
                    <h6 class="text-truncate">${item.name}</h6>
                    <small class="text-white-50">${new Date(item.date).toLocaleDateString()}</small>
                </div>
            </div>
        `;
    });

    // Render Text Notes
    textItems.forEach(note => {
        container.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="glass-card p-3 h-100 position-relative" style="background: rgba(255, 255, 0, 0.1);">
                    <button class="btn btn-sm btn-icon position-absolute top-0 end-0 m-2 text-danger" onclick="removeLockerNote(${note.id})">&times;</button>
                    <i class="fa-solid fa-sticky-note fa-2x mb-2 text-warning"></i>
                    <h6 class="fw-bold mb-1">${note.title}</h6>
                    <p class="small text-white-50 text-truncate-3" style="font-size: 0.8rem;">${note.content}</p>
                </div>
            </div>
        `;
    });
}

function addLockerItem() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const items = JSON.parse(localStorage.getItem('locker_items') || '[]');
            items.push({ id: Date.now(), name: file.name, size: file.size, date: new Date().toISOString() });
            localStorage.setItem('locker_items', JSON.stringify(items));
            loadLockerItems();
            toast.success('Đã thêm vào tủ đồ!');
        }
    };
    input.click();
}

function addLockerNote() {
    const title = prompt('Tiêu đề ghi chú:');
    if (!title) return;
    const content = prompt('Nội dung:');

    const notes = JSON.parse(localStorage.getItem('locker_texts') || '[]');
    notes.push({ id: Date.now(), title, content });
    localStorage.setItem('locker_texts', JSON.stringify(notes));
    loadLockerItems();
}

function removeLockerItem(id) {
    if (!confirm('Xóa item này?')) return;
    let items = JSON.parse(localStorage.getItem('locker_items') || '[]');
    items = items.filter(i => i.id !== id);
    localStorage.setItem('locker_items', JSON.stringify(items));
    loadLockerItems();
}

function removeLockerNote(id) {
    if (!confirm('Xóa ghi chú này?')) return;
    let items = JSON.parse(localStorage.getItem('locker_texts') || '[]');
    items = items.filter(i => i.id !== id);
    localStorage.setItem('locker_texts', JSON.stringify(items));
    loadLockerItems();
}

// ============================================
// 5. MENTOR MARKETPLACE
// ============================================
async function loadMentors() {
    const list = document.getElementById('mentor-list');
    if (!list) return;

    try {
        const res = await fetch('/api/mentor/list');
        const data = await res.json(); // If dummy, returns basic list

        list.innerHTML = '';
        (data.mentors || []).forEach(m => {
            list.innerHTML += `
                <div class="glass-card p-3 d-flex align-items-center mb-3">
                    <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/icons/person-circle.svg" class="rounded-circle me-3" width="50" height="50">
                    <div class="flex-grow-1">
                        <h6 class="fw-bold mb-0">${m.name} <i class="fa-solid fa-circle-check text-primary small"></i></h6>
                        <div class="small text-white-50">Chuyên môn: ${m.subject} • ⭐ ${m.rating}</div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-warning">${m.price} Coin/h</div>
                        <button class="btn btn-sm btn-primary rounded-pill mt-1" onclick="toast.info('Đã gửi yêu cầu tới mentor!')">Thuê ngay</button>
                    </div>
                </div>
            `;
        });
    } catch (e) { console.error(e); }
}

// ============================================
// 6. VIRTUAL LAB & MUSEUM (REMOVED - Using 3D Labs in student-dashboard.html)
// ============================================
// The openLab function is now defined in student-dashboard.html
// with proper 3D lab overlays (physics-3d-overlay, chemistry-3d-overlay, biology-3d-overlay)

function startTour(location) {
    alert(`Bắt đầu tham quan 3D: ${location}\n(Tính năng này yêu cầu WebGL - Giả lập đang chạy)`);
    // Could execute actual 3D logic if libraries were present
}

// ============================================
// 7. 1v1 ARENA
// ============================================
function findMatch() {
    const btn = event.target;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tìm đối thủ...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = 'Tìm trận đấu';
        btn.disabled = false;
        toast.info('Không tìm thấy đối thủ phù hợp lúc này. Vui lòng thử lại sau!');
    }, 3000);
}

// ============================================
// 8. CV & PORTFOLIO
// ============================================
function previewPortfolio() {
    window.open('/portfolio-preview.html', '_blank'); // Hypothetical preview page
    // OR create a modal preview
    toast.success('Đang tạo bản xem trước...');
}

function exportCV() {
    toast.success('Đang xuất CV ra PDF...');
    setTimeout(() => toast.info('Đã tải xuống CV_HocSinh.pdf'), 1500);
}

// ============================================
// 9. AI INTERVIEW
// ============================================
// ============================================
// 9. AI INTERVIEW INTERACTIVE LOGIC
// ============================================

function selectDifficulty(btn, level) {
    document.getElementById('interview-level').value = level;
    // Reset active class
    const container = btn.parentElement;
    Array.from(container.children).forEach(c => {
        c.classList.remove('active', 'text-white');
        c.classList.add('text-white-50');
    });
    // Set active
    btn.classList.add('active', 'text-white');
    btn.classList.remove('text-white-50');
}

function startInterviewSession() {
    const topic = document.getElementById('interview-topic').value;
    const role = document.getElementById('interview-role').value;
    const level = document.getElementById('interview-level').value;

    const welcomeScreen = document.getElementById('interview-welcome');
    const interfaceScreen = document.getElementById('interview-interface');
    const chatBox = document.getElementById('interview-chat-box');

    // UI Transition
    if (welcomeScreen) welcomeScreen.classList.add('d-none');
    if (interfaceScreen) interfaceScreen.classList.remove('d-none');
    if (interfaceScreen) interfaceScreen.style.display = 'flex'; // Force flex

    // Clear previous chat
    if (chatBox) chatBox.innerHTML = '';

    // Simulate AI connecting
    addSystemMessage('Đang kết nối với máy chủ AI...');

    setTimeout(() => {
        addSystemMessage('Đã kết nối. Bắt đầu phiên phỏng vấn.');

        // Initial AI Message based on Context
        const greetings = {
            'hr': `Xin chào! Cảm ơn bạn đã quan tâm đến vị trí <strong>${role}</strong>. Tôi là AI Recruiter. Bạn có thể giới thiệu ngắn gọn về bản thân được không?`,
            'scholarship': `Chào bạn! Tôi là Hội đồng phỏng vấn học bổng. Rất vui được gặp bạn. Hãy cho tôi biết lý do bạn xứng đáng nhận học bổng này?`,
            'ielts': `Hello! This is the Speaking Test. Can you tell me your full name and where you are from?`,
            'technical': `Chào bạn. Chúng ta bắt đầu bài phỏng vấn Technical cho vị trí <strong>${role}</strong> nhé. Bạn hãy mô tả project phức tạp nhất bạn từng làm?`
        };

        const msg = greetings[topic] || greetings['hr'];
        addAiMessage(msg);

    }, 1500);
}

function endInterview() {
    if (!confirm('Bạn có chắc muốn kết thúc buổi phỏng vấn này? Kết quả sẽ không được lưu.')) return;

    const welcomeScreen = document.getElementById('interview-welcome');
    const interfaceScreen = document.getElementById('interview-interface');

    if (welcomeScreen) welcomeScreen.classList.remove('d-none');
    if (interfaceScreen) interfaceScreen.classList.add('d-none');
}

function sendInterviewMessage() {
    const input = document.getElementById('interview-msg-input');
    const msg = input.value.trim();
    if (!msg) return;

    // Add User Message
    addUserMessage(msg);
    input.value = '';

    // Simulate AI thinking and replying
    const chatBox = document.getElementById('interview-chat-box');
    const loadingId = 'ai-loading-' + Date.now();

    // Typing indicator
    const typingHtml = `
        <div id="${loadingId}" class="d-flex align-items-start mb-4">
            <div class="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 avatar-pulse" 
                 style="width: 36px; height: 36px; background: linear-gradient(135deg, #a855f7, #ec4899);">
                 <i class="fa-solid fa-robot text-white" style="font-size: 0.8rem;"></i>
            </div>
            <div class="msg-bubble-ai text-white-50 p-3 shadow-sm" style="max-width: 80%;">
                <i class="fa-solid fa-circle fa-beat text-secondary" style="font-size: 0.5rem;"></i>
                <i class="fa-solid fa-circle fa-beat text-secondary ms-1" style="font-size: 0.5rem; animation-delay: 0.1s;"></i>
                <i class="fa-solid fa-circle fa-beat text-secondary ms-1" style="font-size: 0.5rem; animation-delay: 0.2s;"></i>
            </div>
        </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', typingHtml);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Fake Response Delay
    setTimeout(() => {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        // Simple Echo/Mock Logic (Can be replaced with real API later)
        const responses = [
            "Cảm ơn chia sẻ của bạn. Một câu trả lời rất thú vị.",
            "Bạn có thể nói rõ hơn về điểm này được không?",
            "Tuyệt vời. Vậy điểm mạnh lớn nhất của bạn là gì?",
            "Trong tình huống khó khăn, bạn thường xử lý thế nào?",
            "Nếu được nhận, bạn có kế hoạch gì trong 3 tháng đầu?"
        ];
        const randomResp = responses[Math.floor(Math.random() * responses.length)];
        addAiMessage(randomResp);

    }, 2000);
}

// --- Helper Functions ---

function addUserMessage(text) {
    const chatBox = document.getElementById('interview-chat-box');
    const html = `
        <div class="d-flex align-items-end justify-content-end mb-4">
            <div class="p-3 text-white shadow-sm msg-bubble-user" 
                 style="max-width: 80%;">
                ${text}
            </div>
        </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', html);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addAiMessage(text) {
    const chatBox = document.getElementById('interview-chat-box');
    const html = `
        <div class="d-flex align-items-start mb-4">
            <div class="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 avatar-pulse" 
                 style="width: 36px; height: 36px; background: linear-gradient(135deg, #a855f7, #ec4899);">
                 <i class="fa-solid fa-robot text-white" style="font-size: 0.8rem;"></i>
            </div>
            <div class="msg-bubble-ai text-white p-3 shadow-sm" style="max-width: 80%; line-height: 1.6;">
                ${text}
            </div>
        </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', html);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(text) {
    const chatBox = document.getElementById('interview-chat-box');
    const html = `
        <div class="text-center mb-4">
            <span class="badge bg-white bg-opacity-10 text-white-50 fw-normal border border-white border-opacity-10 px-3 py-2 rounded-pill">
                ${text}
            </span>
        </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', html);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Start-up initialization
document.addEventListener('DOMContentLoaded', () => {
    // Lazy load locker items if view is active
    if (document.getElementById('locker-view')) loadLockerItems();
    if (document.getElementById('mentor-market-view')) loadMentors();

    // Bind Run Code Button
    const runBtn = document.getElementById('run-code-btn');
    if (runBtn) runBtn.addEventListener('click', runCode);

    // Bind Language Change for Tab Update
    const langSelect = document.getElementById('compiler-lang');
    const fileTab = document.getElementById('compiler-file-tab');
    if (langSelect && fileTab) {
        langSelect.addEventListener('change', () => {
            const lang = langSelect.value;
            let icon = 'fa-js text-warning';
            let name = 'main.js';

            if (lang === 'python') { icon = 'fa-python text-info'; name = 'main.py'; }
            else if (lang === 'cpp') { icon = 'fa-c text-primary'; name = 'main.cpp'; }

            fileTab.innerHTML = `<i class="fa-brands ${icon}"></i> ${name} <i class="fa-solid fa-xmark ms-auto text-white-50" style="font-size: 0.7rem;"></i>`;
        });
    }
});
