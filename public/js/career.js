// Career Guidance Logic - Premium UI 3.0 (Dynamic Effects)

let careerAnswers = {};
let currentQuestionIndex = 0;
const TOTAL_QUESTIONS = 60; // Career GPS V3.0 - 60 Questions

function initCareer() {
    renderCareerIntro();
}

function renderCareerIntro() {
    const container = document.getElementById('career-content');
    container.innerHTML = `
        <style>
            @keyframes gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            .gradient-text {
                background: linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6, #1d4ed8);
                background-size: 300% 300%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: gradient-shift 4s ease infinite;
            }
            .feature-card-compact {
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                padding: 24px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .feature-card-compact:hover {
                transform: translateY(-5px);
                border-color: #2563eb;
                box-shadow: 0 15px 30px rgba(37, 99, 235, 0.08);
            }
            .feature-icon-box {
                width: 48px;
                height: 48px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
            }
            .cta-btn-compact {
                background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
                color: #ffffff !important;
                font-weight: 700;
                border: none;
                padding: 16px 50px;
                border-radius: 50px;
                font-size: 1.1rem;
                transition: all 0.3s ease;
                box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
            }
            .cta-btn-compact:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 15px 40px rgba(37, 99, 235, 0.5);
                filter: brightness(1.1);
            }
            .stats-badge-sm {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 8px 18px;
                border-radius: 30px;
                font-size: 0.9rem;
                color: #2563eb;
                font-weight: 600;
            }
            .career-intro-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                min-height: 100%;
                padding: 40px 20px;
            }
        </style>
        
        <div class="career-intro-container">
            <!-- Title -->
            <h1 class="mb-3" style="font-size: 3rem; font-weight: 800; letter-spacing: -1.5px;">
                <span class="gradient-text">Khám Phá</span>
                <span style="color: #1e293b;"> Nghề Nghiệp</span>
            </h1>
            
            <!-- Description -->
            <p class="text-muted mb-4 mx-auto" style="max-width: 600px; font-size: 1.1rem; line-height: 1.6;">
                Hệ thống AI phân tích <strong>60 chiều dữ liệu</strong> để tìm 
                <span style="color: #2563eb; font-weight: 700;">nghề nghiệp phù hợp</span> nhất với bạn.
            </p>
            
            <!-- Stats Badges -->
            <div class="d-flex justify-content-center gap-3 flex-wrap mb-5">
                <div class="stats-badge-sm">
                    <i class="fa-solid fa-brain"></i>
                    <span>AI Phân Tích</span>
                </div>
                <div class="stats-badge-sm">
                    <i class="fa-solid fa-database"></i>
                    <span>2000+ Nghề</span>
                </div>
                <div class="stats-badge-sm">
                    <i class="fa-solid fa-clock"></i>
                    <span>~10 phút</span>
                </div>
            </div>
            
            <!-- Feature Cards -->
            <div class="row g-4 mb-5 text-start justify-content-center w-100" style="max-width: 1000px;">
                <div class="col-md-4">
                    <div class="feature-card-compact h-100">
                        <div class="feature-icon-box" style="background: rgba(37, 99, 235, 0.1);">
                            <i class="fa-solid fa-brain" style="color: #2563eb; font-size: 1.2rem;"></i>
                        </div>
                        <h5 class="fw-bold mb-2" style="color: #1e293b;">AI Phân Tích Sâu</h5>
                        <p class="text-muted small mb-0">Pattern Matching phân tích 7 chiều năng lực.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card-compact h-100">
                        <div class="feature-icon-box" style="background: rgba(59, 130, 246, 0.1);">
                            <i class="fa-solid fa-chart-pie" style="color: #3b82f6; font-size: 1.2rem;"></i>
                        </div>
                        <h5 class="fw-bold mb-2" style="color: #1e293b;">Biểu Đồ Năng Lực</h5>
                        <p class="text-muted small mb-0">Trực quan hóa điểm mạnh, yếu qua 60 câu hỏi.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card-compact h-100">
                        <div class="feature-icon-box" style="background: rgba(37, 99, 235, 0.1);">
                            <i class="fa-solid fa-route" style="color: #2563eb; font-size: 1.2rem;"></i>
                        </div>
                        <h5 class="fw-bold mb-2" style="color: #1e293b;">Lộ Trình 5 Năm</h5>
                        <p class="text-muted small mb-0">Kế hoạch hành động từ học tập đến sự nghiệp.</p>
                    </div>
                </div>
            </div>

            <!-- CTA Button -->
            <button class="cta-btn-compact" onclick="startCareerTest()">
                <i class="fa-solid fa-rocket me-2"></i>
                Bắt Đầu Khám Phá
                <i class="fa-solid fa-arrow-right ms-2"></i>
            </button>
        </div>
    `;
}

function startCareerTest() {
    currentQuestionIndex = 0;
    careerAnswers = {};
    renderCareerQuestion();
}

function renderCareerQuestion() {
    const container = document.getElementById('career-content');
    const q = CAREER_QUESTIONS[currentQuestionIndex];
    if (!q) return;

    const progressPercent = ((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100;
    const currentValue = careerAnswers[q.id] !== undefined ? careerAnswers[q.id] : 5;

    container.innerHTML = `
        <style>
            /* Custom Range Slider Styles */
            .custom-range-lg {
                width: 100%;
                height: 10px;
                -webkit-appearance: none;
                appearance: none;
                background: linear-gradient(to right, rgba(37, 99, 235, 0.3), rgba(59, 130, 246, 0.5));
                border-radius: 5px;
                outline: none;
                cursor: pointer;
                position: relative;
                z-index: 10;
            }
            .custom-range-lg::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #2563eb, #3b82f6);
                border-radius: 50%;
                cursor: grab;
                box-shadow: 0 4px 15px rgba(37, 99, 235, 0.5);
                border: 3px solid white;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .custom-range-lg::-webkit-slider-thumb:hover {
                transform: scale(1.15);
                box-shadow: 0 6px 20px rgba(37, 99, 235, 0.7);
            }
            .custom-range-lg::-webkit-slider-thumb:active {
                cursor: grabbing;
                transform: scale(1.2);
            }
            .custom-range-lg::-moz-range-thumb {
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #2563eb, #3b82f6);
                border-radius: 50%;
                cursor: grab;
                box-shadow: 0 4px 15px rgba(37, 99, 235, 0.5);
                border: 3px solid white;
            }
            .custom-range-lg::-moz-range-track {
                background: linear-gradient(to right, rgba(37, 99, 235, 0.3), rgba(59, 130, 246, 0.5));
                height: 10px;
                border-radius: 5px;
            }
        </style>
        <div class="h-100 w-100 d-flex flex-column animate-fade-in position-relative overflow-hidden">
            
            <!-- Floating Background Blobs -->
            <div class="position-absolute" style="top: 10%; right: 10%; width: 300px; height: 300px; background: var(--primary); filter: blur(150px); opacity: 0.15; border-radius: 50%; pointer-events: none;"></div>
            <div class="position-absolute" style="bottom: 10%; left: 10%; width: 250px; height: 250px; background: var(--secondary); filter: blur(150px); opacity: 0.15; border-radius: 50%; pointer-events: none;"></div>

            <div class="flex-grow-1 d-flex flex-column position-relative overflow-hidden" style="z-index: 1;">
                
                <!-- Header / Progress -->
                <div class="p-3 p-md-4 d-flex justify-content-between align-items-center flex-shrink-0" style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                    <div class="d-flex align-items-center gap-2 gap-md-3">
                        <span class="badge text-dark px-2 px-md-3 py-1 py-md-2 rounded-pill font-monospace" style="background: #f1f5f9; border: 1px solid #e2e8f0; font-size: 0.8rem;">
                            ${currentQuestionIndex + 1} / ${TOTAL_QUESTIONS}
                        </span>
                        <span class="text-muted small text-uppercase fw-bold d-none d-md-inline" style="color: #64748b !important;">${q.category}</span>
                    </div>
                    <!-- Mini progress bar -->
                    <div style="width: 100px; height: 5px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                        <div class="bg-gradient-primary h-100" style="width: ${progressPercent}%; transition: width 0.5s ease;"></div>
                    </div>
                </div>

                <!-- Content Body - Fixed height, centered -->
                <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center p-3 p-md-5 overflow-hidden">
                    <h3 class="text-dark mb-3 mb-md-5 lh-base fw-semibold animate-slide-up" style="color: #1e293b !important; font-size: clamp(1rem, 4vw, 1.8rem); max-width: 95%;">
                        "${q.text}"
                    </h3>

                    <!-- Interactive Slider Area -->
                    <div class="w-100 px-2 px-md-5 mb-2 mb-md-4 animate-slide-up" style="animation-delay: 0.1s;">
                        <input type="range" class="form-range custom-range-lg" min="0" max="10" step="1" value="${currentValue}" 
                            id="q-slider" oninput="updateSliderUI(this.value)">
                        
                        <!-- 0-10 Scale Labels -->
                        <div class="d-flex justify-content-between px-1 mt-2 mb-3 text-muted font-monospace" style="font-size: 0.85rem;">
                            <span style="flex: 1; text-align: center;">0</span>
                            <span style="flex: 1; text-align: center;">1</span>
                            <span style="flex: 1; text-align: center;">2</span>
                            <span style="flex: 1; text-align: center;">3</span>
                            <span style="flex: 1; text-align: center;">4</span>
                            <span style="flex: 1; text-align: center;">5</span>
                            <span style="flex: 1; text-align: center;">6</span>
                            <span style="flex: 1; text-align: center;">7</span>
                            <span style="flex: 1; text-align: center;">8</span>
                            <span style="flex: 1; text-align: center;">9</span>
                            <span style="flex: 1; text-align: center;">10</span>
                        </div>

                        <div class="position-relative mt-2 text-muted fw-medium small text-uppercase w-100" style="height: 30px;">
                            <!-- Left Label -->
                            <span id="label-left" class="position-absolute start-0 top-50 translate-middle-y" style="transition: all 0.3s ease;">
                                <i class="fa-regular fa-face-frown me-1"></i><span class="d-none d-md-inline">Ghét</span>
                            </span>
                            
                            <!-- Center Score -->
                            <div class="position-absolute top-50 start-50 translate-middle text-center">
                                <span class="text-dark fw-bold fs-4 d-inline-block" style="color: #1e293b !important;" id="score-display" style="transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);">${currentValue}</span>
                            </div>

                            <!-- Right Label -->
                            <span id="label-right" class="position-absolute end-0 top-50 translate-middle-y" style="transition: all 0.3s ease;">
                                <span class="d-none d-md-inline">Yêu thích</span><i class="fa-solid fa-fire ms-1"></i>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Footer Navigation - Fixed at bottom -->
                <div class="p-2 p-md-4 d-flex justify-content-between align-items-center flex-shrink-0" style="background: #ffffff; border-top: 1px solid #e2e8f0;">
                    <button class="btn btn-link text-muted text-decoration-none hover-white btn-sm" 
                        onclick="prevQuestion()" ${currentQuestionIndex === 0 ? 'disabled style="opacity:0; pointer-events:none;"' : ''}>
                        <i class="fa-solid fa-arrow-left me-1 me-md-2"></i><span class="d-none d-md-inline">Quay lại</span>
                    </button>

                    <button class="btn btn-primary rounded-pill px-3 px-md-5 py-2 fw-bold shadow-lg hover-scale d-flex align-items-center gap-1 gap-md-2" onclick="nextQuestion()">
                        ${currentQuestionIndex === TOTAL_QUESTIONS - 1 ? 'Xong' : 'Tiếp'} 
                        <i class="fa-solid ${currentQuestionIndex === TOTAL_QUESTIONS - 1 ? 'fa-check' : 'fa-arrow-right'}"></i>
                    </button>
                </div>

            </div>
        </div>
    `;

    updateSliderUI(currentValue);
}

function updateSliderUI(val) {
    const display = document.getElementById('score-display');
    const slider = document.getElementById('q-slider');
    const leftLabel = document.getElementById('label-left');
    const rightLabel = document.getElementById('label-right');

    if (display) {
        display.innerText = val;

        // Dynamic Scaling & Color for Score (0-10 scale - precise per value)
        display.style.transform = 'scale(1.5)';
        setTimeout(() => display.style.transform = 'scale(1)', 150);

        // Precise color for each score
        const scoreColors = {
            0: { color: '#dc2626', shadow: '0 0 12px rgba(220,38,38,0.6)' },   // Deep Red
            1: { color: '#ef4444', shadow: '0 0 10px rgba(239,68,68,0.5)' },   // Red
            2: { color: '#f97316', shadow: '0 0 8px rgba(249,115,22,0.4)' },   // Orange
            3: { color: '#fb923c', shadow: 'none' },                            // Light Orange
            4: { color: '#facc15', shadow: 'none' },                            // Yellow
            5: { color: '#a3a3a3', shadow: 'none' },                            // Gray (Neutral)
            6: { color: '#84cc16', shadow: 'none' },                            // Lime
            7: { color: '#22c55e', shadow: '0 0 8px rgba(34,197,94,0.3)' },    // Green
            8: { color: '#14b8a6', shadow: '0 0 10px rgba(20,184,166,0.4)' },  // Teal
            9: { color: '#3b82f6', shadow: '0 0 12px rgba(139,92,246,0.5)' },  // Violet
            10: { color: '#3b82f6', shadow: '0 0 15px rgba(168,85,247,0.6)' }  // Purple - Passion
        };

        const scoreStyle = scoreColors[val] || scoreColors[5];
        display.style.color = scoreStyle.color;
        display.style.textShadow = scoreStyle.shadow;
    }
    
    if (leftLabel && rightLabel) {
        leftLabel.style.opacity = '0.4';
        leftLabel.style.transform = 'translateY(-50%) scale(0.9)';
        leftLabel.style.color = '#94a3b8';

        rightLabel.style.opacity = '0.4';
        rightLabel.style.transform = 'translateY(-50%) scale(0.9)';
        rightLabel.style.color = '#94a3b8';

        if (val <= 2) {
            leftLabel.style.opacity = '1';
            leftLabel.style.transform = 'translateY(-50%) scale(1.1)';
            leftLabel.style.color = '#ef4444';
            leftLabel.innerHTML = '<i class="fa-solid fa-face-frown text-danger me-1"></i><span class="d-none d-md-inline">Ghét</span>';
        } else if (val >= 8) {
            rightLabel.style.opacity = '1';
            rightLabel.style.transform = 'translateY(-50%) scale(1.1)';
            rightLabel.style.color = '#2563eb';
            rightLabel.innerHTML = '<span class="d-none d-md-inline">Yêu thích</span><i class="fa-solid fa-fire text-warning ms-1"></i>';
        } else {
            leftLabel.innerHTML = '<i class="fa-regular fa-face-frown me-1"></i><span class="d-none d-md-inline">Ghét</span>';
            rightLabel.innerHTML = '<span class="d-none d-md-inline">Yêu thích</span><i class="fa-solid fa-fire ms-1"></i>';
        }
    }

    if (slider) {
        const percent = val * 10;
        slider.style.background = `linear-gradient(to right, #1d4ed8 0%, #2563eb ${percent}%, rgba(0,0,0,0.1) ${percent}%, rgba(0,0,0,0.1) 100%)`;
    }

    careerAnswers[CAREER_QUESTIONS[currentQuestionIndex].id] = parseInt(val);
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCareerQuestion();
    }
}

function nextQuestion() {
    // Save current value
    const slider = document.getElementById('q-slider');
    if (slider) {
        careerAnswers[CAREER_QUESTIONS[currentQuestionIndex].id] = parseInt(slider.value);
    }

    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
        currentQuestionIndex++;
        renderCareerQuestion();
    } else {
        submitCareerTest();
    }
}

// CAREER_DATASET is now loaded from career-data.js

async function submitCareerTest() {
    const container = document.getElementById('career-content');

    // Loading State
    container.innerHTML = `
        <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center animate-fade-in">
            <div class="glass-card p-5" style="max-width: 600px; width: 100%;">
                <div class="spinner-border text-primary mb-4" style="width: 3rem; height: 3rem;" role="status"></div>
                <h3 class="text-dark mb-3" style="color: #1e293b !important; color: #1e293b !important;">AI Đang Quét Nghề Nghiệp...</h3>
                
                <div class="text-start bg-light rounded-3 p-3 font-monospace small text-success border border-dark border-opacity-10" style="min-height: 150px; opacity: 0.9;">
                    <div id="loading-log">
                        > Accessing Global Job Database... OK<br>
                        > Loading Dataset (2000+ entries)... OK<br>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Animation Logs
    const logs = [
        "> Analyzing RIASEC & MBTI Profile...",
        "> Screening STEM Group...",
        "> Screening Creative & Arts Group...",
        "> Screening Niche & Special Careers...",
        "> Mapping skills to salary data...",
        "> Finalizing recommendations..."
    ];
    let logIndex = 0;
    const logInterval = setInterval(() => {
        if (logIndex < logs.length) {
            document.getElementById('loading-log').innerHTML += `${logs[logIndex]}<br>`;
            logIndex++;
        }
    }, 800);

    // ============================================
    // STEP 1: CALCULATE GROUP AVERAGES (7 Archetypes)
    // ============================================
    const calculateGroupAvg = (startQ, endQ) => {
        let sum = 0;
        let count = 0;
        for (let i = startQ; i <= endQ; i++) {
            const score = careerAnswers[i] !== undefined ? careerAnswers[i] : 5;
            sum += score;
            count++;
        }
        return (sum / count).toFixed(1);
    };

    const groupScores = {
        builder: calculateGroupAvg(1, 8),      // Q1-8
        thinker: calculateGroupAvg(9, 16),     // Q9-16
        creator: calculateGroupAvg(17, 24),    // Q17-24
        helper: calculateGroupAvg(25, 32),     // Q25-32
        leader: calculateGroupAvg(33, 40),     // Q33-40
        organizer: calculateGroupAvg(41, 48),  // Q41-48
        specialist: calculateGroupAvg(49, 60)  // Q49-60
    };

    console.log('[Career] Group Scores:', groupScores);

    // ============================================
    // STEP 2: BUILD RAW SCORES STRING (60 questions)
    // ============================================
    let rawScores = [];
    for (let i = 1; i <= 60; i++) {
        const score = careerAnswers[i] !== undefined ? careerAnswers[i] : 5;
        rawScores.push(score);
    }

    // ============================================
    // STEP 3: CREATE USER MESSAGE (Data Payload)
    // ============================================
    const userMessage = `
DỮ LIỆU NGƯỜI DÙNG CẦN PHÂN TÍCH:

BẢNG ĐIỂM TRUNG BÌNH 7 LĨNH VỰC (Thang 0-10):
1. The Builder (Kỹ thuật, Cơ khí, Lập trình): ${groupScores.builder}/10
2. The Thinker (Tư duy, Nghiên cứu, Số liệu): ${groupScores.thinker}/10
3. The Creator (Sáng tạo, Nghệ thuật, Thiết kế): ${groupScores.creator}/10
4. The Helper (Xã hội, Con người, Chăm sóc): ${groupScores.helper}/10
5. The Leader (Lãnh đạo, Kinh doanh, Quản lý): ${groupScores.leader}/10
6. The Organizer (Tổ chức, Quy trình, Chi tiết): ${groupScores.organizer}/10
7. The Specialist (Giác quan, Môi trường đặc biệt): ${groupScores.specialist}/10

CHI TIẾT 60 CÂU (Raw Data - Q1 đến Q60):
${rawScores.join(", ")}

YÊU CẦU: Hãy thực hiện đúng "CRITICAL INSTRUCTION" trong system prompt. Phân tích kỹ điểm số, đưa ra mức lương VNĐ thực tế tại Việt Nam và lộ trình chi tiết.
`;

    // ============================================
    // STEP 4: SYSTEM PROMPT (CLEAN FORMAT - NO EMOJI)
    // ============================================
    const systemPrompt = `# HƯỚNG DẪN QUAN TRỌNG CHO AI

Bạn là "Chuyên gia Định hướng Nghề nghiệp" với kinh nghiệm tư vấn hướng nghiệp cho học sinh, sinh viên Việt Nam.

## DỮ LIỆU ĐẦU VÀO:
Bạn sẽ nhận được điểm số 60 câu hỏi (Thang 0-10) chia thành 7 nhóm năng lực.

## QUY TẮC PHÂN TÍCH:
1. Điểm > 7: Thế mạnh nổi bật - Ưu tiên tập trung
2. Điểm < 3: Điểm yếu - Tránh nghề liên quan
3. Kết hợp chéo các nhóm điểm cao để tìm nghề phù hợp nhất
4. Sử dụng mức lương thị trường Việt Nam (VNĐ)

## QUY TẮC QUAN TRỌNG:
- KHÔNG dùng emoji hoặc icon
- Với từ tiếng Anh hoặc thuật ngữ khó, phải có (chú thích tiếng Việt)
- Ví dụ: UX Designer (Thiết kế trải nghiệm người dùng), Freelancer (Làm việc tự do)
- Bảng phải có định dạng Markdown chuẩn với cột rõ ràng

## ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (MARKDOWN):
Trả lời hoàn toàn bằng tiếng Việt, theo đúng cấu trúc sau:

---
# BÁO CÁO ĐỊNH HƯỚNG NGHỀ NGHIỆP

## PHẦN 1: HỒ SƠ NĂNG LỰC (7 LĨNH VỰC)

| Lĩnh vực | Tên gọi | Điểm | Đánh giá |
|----------|---------|------|----------|
| Kỹ thuật & Công nghệ | The Builder (Người xây dựng) | [X]/10 | [Yếu/Khá/Mạnh/Xuất sắc] |
| Tư duy & Nghiên cứu | The Thinker (Người suy nghĩ) | [X]/10 | ... |
| Sáng tạo & Nghệ thuật | The Creator (Người sáng tạo) | [X]/10 | ... |
| Xã hội & Con người | The Helper (Người giúp đỡ) | [X]/10 | ... |
| Lãnh đạo & Kinh doanh | The Leader (Người lãnh đạo) | [X]/10 | ... |
| Tổ chức & Quy trình | The Organizer (Người tổ chức) | [X]/10 | ... |
| Năng lực đặc biệt | The Specialist (Chuyên gia) | [X]/10 | ... |

**Nhận định tổng quan:** [Một đoạn văn ngắn tổng kết thế mạnh và điểm yếu của người dùng]

---

## PHẦN 2: TOP 20 NGHỀ NGHIỆP PHÙ HỢP NHẤT

**QUAN TRỌNG: Phải liệt kê ĐẦY ĐỦ 20 nghề. KHÔNG được dùng "..." hay bỏ qua bất kỳ dòng nào.**

| STT | Tên nghề (Tiếng Việt) | Tên tiếng Anh (Chú thích) | Độ phù hợp | Lương khởi điểm (VNĐ/tháng) | Lương chuyên gia (VNĐ/tháng) |
|-----|----------------------|---------------------------|------------|----------------------------|------------------------------|
| 1 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 2 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 3 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 4 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 5 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 6 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 7 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 8 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 9 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 10 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 11 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 12 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 13 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 14 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 15 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 16 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 17 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 18 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 19 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |
| 20 | [Nghề] | [English] (chú thích) | [X]% | [X - Y triệu] | [Z triệu+] |

---

## PHẦN 3: PHÂN TÍCH CHI TIẾT TOP 3 NGHỀ

### Nghề số 1: [TÊN NGHỀ]

| Thông tin | Chi tiết |
|-----------|----------|
| Mô tả công việc | [Mô tả 2-3 câu về công việc hàng ngày] |
| Lý do phù hợp | [Giải thích dựa trên điểm số cao của người dùng] |
| Học vấn cần thiết | [Ngành học, Trường, Chứng chỉ] |
| Kỹ năng cần có | [Liệt kê 3-5 kỹ năng chính] |
| Triển vọng nghề | [Tốt/Ổn định/Cần cân nhắc - giải thích] |

**Lộ trình 5 năm:**
- Năm 1-2: [Vị trí mới vào nghề, học gì, làm ở đâu]
- Năm 3-4: [Vị trí trung cấp, kỹ năng cần phát triển]
- Năm 5+: [Vị trí cao cấp, thu nhập kỳ vọng]

### Nghề số 2: [TÊN NGHỀ]
(Trình bày tương tự nghề số 1)

### Nghề số 3: [TÊN NGHỀ]
(Trình bày tương tự nghề số 1)

---

## PHẦN 4: MÔ PHỎNG 1 NGÀY LÀM VIỆC (Nghề số 1)

| Thời gian | Hoạt động |
|-----------|-----------|
| 08:00 - 09:00 | [Hoạt động chi tiết] |
| 09:00 - 12:00 | [Công việc chính] |
| 12:00 - 13:30 | Nghỉ trưa |
| 13:30 - 17:00 | [Công việc chiều] |
| 17:00 - 18:00 | [Kết thúc ngày] |

---

## PHẦN 5: KẾT LUẬN

**Tóm tắt:** [2-3 câu tổng kết về năng lực và định hướng nghề nghiệp phù hợp nhất]

**Nghề phù hợp nhất với bạn:** [Tên nghề số 1]

**Lời khuyên cuối:** [1-2 câu động viên ngắn gọn]

---

Cảm ơn bạn đã sử dụng Định Hướng Nghề Nghiệp AI!

## QUAN TRỌNG: DỪNG TẠI ĐÂY. KHÔNG VIẾT THÊM BẤT CỨ NỘI DUNG NÀO SAU DÒNG "Cảm ơn".
`;

    console.log('[Career] Sending to API with group scores and new prompt format');

    try {
        const formData = new FormData();
        formData.append('message', userMessage);
        formData.append('username', 'student');
        formData.append('systemPrompt', systemPrompt);
        formData.append('mode', 'career');

        const response = await fetch('/api/ai-chat-stream', {
            method: 'POST',
            body: formData
        });

        clearInterval(logInterval);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        // Switch to result view
        container.innerHTML = `
            <div class="h-100 w-100 animate-fade-in d-flex flex-column">
                <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-dark border-opacity-10">
                    <h3 class="text-dark mb-0" style="color: #1e293b !important; color: #1e293b !important;"><i class="fa-solid fa-compass-drafting text-primary me-2"></i> Kết Quả Định Hướng</h3>
                    <button class="btn btn-outline-light btn-sm rounded-pill px-3" onclick="initCareer()">
                        <i class="fa-solid fa-rotate-left me-2"></i>Làm Lại
                    </button>
                </div>
                <div class="flex-grow-1 overflow-auto custom-scrollbar p-2">
                    <div class="glass-card p-4">
                        <div id="ai-result-markdown" class="markdown-body text-dark"></div>
                    </div>
                </div>
            </div>
        `;
        const resultDiv = document.getElementById('ai-result-markdown');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            if (typeof marked !== 'undefined') {
                resultDiv.innerHTML = marked.parse(fullText);
            } else {
                resultDiv.innerText = fullText;
            }
        }

    } catch (err) {
        clearInterval(logInterval);
        container.innerHTML = `
            <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center">
                <div class="glass-card p-5 border-danger border-opacity-25">
                    <i class="fa-solid fa-triangle-exclamation text-danger fa-3x mb-3"></i>
                    <h4 style="color: #1e293b !important;">Đã xảy ra lỗi!</h4>
                    <p class="text-muted" style="color: #64748b !important;">Không thể kết nối với AI Server.</p>
                    <button class="btn btn-primary rounded-pill mt-3" onclick="initCareer()">Thử lại</button>
                </div>
            </div>
        `;
        console.error(err);
    }
}

// Add Premium CSS
if (!document.getElementById('career-css')) {
    const style = document.createElement('style');
    style.id = 'career-css';
    style.textContent = `
        .text-gradient { background: linear-gradient(135deg, #fff 0%, #60a5fa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .bg-gradient-primary { background: linear-gradient(90deg, #2563eb, #3b82f6); }
        
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; transform: translateY(20px); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

        .feature-card { background: #ffffff; border: 1px solid #e2e8f0; transition: 0.3s; }
        .feature-card:hover { background: #f8fafc; transform: translateY(-5px); border-color: rgba(99,102,241,0.3); }

        .custom-range-lg {
            -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px; outline: none; transition: 0.2s;
        }
        .custom-range-lg::-webkit-slider-thumb {
            -webkit-appearance: none; width: 28px; height: 28px; background: #fff; border-radius: 50%; cursor: pointer;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3), 0 4px 10px rgba(0,0,0,0.3); transition: 0.2s; margin-top: -10px;
        }
        .custom-range-lg::-webkit-slider-thumb:hover { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.2), 0 4px 15px rgba(0,0,0,0.4); }
        .custom-range-lg::-webkit-slider-runnable-track { width: 100%; height: 8px; cursor: pointer; border-radius: 4px; }

        .hover-scale { transition: 0.3s cubic-bezier(0.3, 2, 0.6, 1); }
        .hover-scale:hover { transform: scale(1.05); box-shadow: 0 10px 40px rgba(37, 99, 235, 0.4) !important; }
        .hover-white:hover { color: #fff !important; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        
        /* Markdown Table Styles with Borders */
        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            background: rgba(0, 0, 0, 0.02);
            display: block;
            overflow-x: auto;
            white-space: nowrap;
        }
        .markdown-body table th,
        .markdown-body table td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            text-align: left;
            font-size: 0.85rem;
        }
        .markdown-body table th {
            background: rgba(37, 99, 235, 0.05);
            font-weight: 600;
            color: #1e293b;
            white-space: nowrap;
        }
        .markdown-body table tr:nth-child(even) {
            background: rgba(0, 0, 0, 0.01);
        }
        .markdown-body table tr:hover {
            background: rgba(37, 99, 235, 0.1);
        }
        
        /* Mobile Responsive for Career Results */
        @media (max-width: 767px) {
            .markdown-body h1 { font-size: 1.3rem !important; }
            .markdown-body h2 { font-size: 1.1rem !important; }
            .markdown-body h3 { font-size: 1rem !important; }
            .markdown-body p { font-size: 0.9rem !important; }
            .markdown-body table th,
            .markdown-body table td {
                padding: 6px 8px;
                font-size: 0.75rem;
            }
            .markdown-body { word-wrap: break-word; }
        }
    `;
    document.head.appendChild(style);
}
