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
                background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #6366f1);
                background-size: 300% 300%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: gradient-shift 4s ease infinite;
            }
            .feature-card-compact {
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
                border: 1px solid rgba(99, 102, 241, 0.15);
                border-radius: 16px;
                padding: 16px;
                transition: all 0.3s ease;
            }
            .feature-card-compact:hover {
                transform: translateY(-5px);
                border-color: rgba(99, 102, 241, 0.35);
                box-shadow: 0 15px 30px rgba(99, 102, 241, 0.1);
            }
            .feature-icon-box {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 10px;
            }
            .cta-btn-compact {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
                color: white;
                font-weight: 600;
                border: none;
                padding: 14px 40px;
                border-radius: 50px;
                font-size: 1rem;
                transition: all 0.3s ease;
                box-shadow: 0 8px 30px rgba(99, 102, 241, 0.35);
            }
            .cta-btn-compact:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 12px 40px rgba(99, 102, 241, 0.45);
            }
            .stats-badge-sm {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(99, 102, 241, 0.1);
                border: 1px solid rgba(99, 102, 241, 0.2);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.8rem;
                color: #a5b4fc;
            }
            .career-intro-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 100%;
                padding: 20px;
            }
            @media (max-width: 768px) {
                .career-intro-container { 
                    padding: 15px 10px; 
                    min-height: 100%;
                }
                .cta-btn-compact { padding: 12px 32px; font-size: 0.95rem; }
                .stats-badge-sm { padding: 5px 10px; font-size: 0.7rem; gap: 4px; }
                .mobile-title { font-size: 1.6rem !important; }
                .mobile-desc { font-size: 0.85rem !important; }
                .feature-card-compact { padding: 12px; }
                .feature-icon-box { width: 36px; height: 36px; margin-bottom: 8px; }
                .feature-card-compact h6 { font-size: 0.75rem !important; }
                .feature-card-compact small { font-size: 0.65rem !important; }
            }
        </style>
        
        <div class="career-intro-container position-relative">
            <!-- Title -->
            <h1 class="mb-2 mobile-title" style="font-size: 2.2rem; font-weight: 700; letter-spacing: -1px; line-height: 1.15;">
                <span class="gradient-text">Khám Phá</span>
                <span class="text-white"> Nghề Nghiệp</span>
            </h1>
            
            <!-- Description -->
            <p class="text-white-50 mb-3 mx-auto mobile-desc" style="max-width: 500px; font-size: 0.95rem; line-height: 1.6;">
                Hệ thống AI phân tích <strong class="text-white">60 chiều dữ liệu</strong> để tìm 
                <span class="gradient-text fw-bold">nghề nghiệp phù hợp</span> nhất với bạn.
            </p>
            
            <!-- Stats Badges -->
            <div class="d-flex justify-content-center gap-2 flex-wrap mb-3">
                <div class="stats-badge-sm">
                    <i class="fa-solid fa-brain"></i>
                    <span>AI Phân Tích</span>
                </div>
                <div class="stats-badge-sm">
                    <i class="fa-solid fa-database"></i>
                    <span>800+ Nghề</span>
                </div>
                <div class="stats-badge-sm">
                    <i class="fa-solid fa-clock"></i>
                    <span>~10 phút</span>
                </div>
            </div>
            
            <!-- Feature Cards -->
            <div class="row g-2 g-md-3 mb-4 text-start justify-content-center w-100" style="max-width: 800px;">
                <div class="col-4">
                    <div class="feature-card-compact h-100">
                        <div class="feature-icon-box" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1));">
                            <i class="fa-solid fa-brain" style="color: #818cf8;"></i>
                        </div>
                        <h6 class="text-white fw-bold mb-1" style="font-size: 0.85rem;">AI Phân Tích Sâu</h6>
                        <small class="text-white-50" style="font-size: 0.7rem;">Pattern Matching phân tích 7 chiều năng lực.</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="feature-card-compact h-100">
                        <div class="feature-icon-box" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1));">
                            <i class="fa-solid fa-chart-pie" style="color: #a78bfa;"></i>
                        </div>
                        <h6 class="text-white fw-bold mb-1" style="font-size: 0.85rem;">Biểu Đồ Năng Lực</h6>
                        <small class="text-white-50" style="font-size: 0.7rem;">Trực quan hóa điểm mạnh, yếu qua 60 câu hỏi.</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="feature-card-compact h-100">
                        <div class="feature-icon-box" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1));">
                            <i class="fa-solid fa-route" style="color: #c084fc;"></i>
                        </div>
                        <h6 class="text-white fw-bold mb-1" style="font-size: 0.85rem;">Lộ Trình 5 Năm</h6>
                        <small class="text-white-50" style="font-size: 0.7rem;">Kế hoạch hành động từ học tập đến sự nghiệp.</small>
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
                background: linear-gradient(to right, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.5));
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
                background: linear-gradient(135deg, #6366f1, #a855f7);
                border-radius: 50%;
                cursor: grab;
                box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);
                border: 3px solid white;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .custom-range-lg::-webkit-slider-thumb:hover {
                transform: scale(1.15);
                box-shadow: 0 6px 20px rgba(99, 102, 241, 0.7);
            }
            .custom-range-lg::-webkit-slider-thumb:active {
                cursor: grabbing;
                transform: scale(1.2);
            }
            .custom-range-lg::-moz-range-thumb {
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #6366f1, #a855f7);
                border-radius: 50%;
                cursor: grab;
                box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);
                border: 3px solid white;
            }
            .custom-range-lg::-moz-range-track {
                background: linear-gradient(to right, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.5));
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
                <div class="p-3 p-md-4 d-flex justify-content-between align-items-center flex-shrink-0" style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <div class="d-flex align-items-center gap-2 gap-md-3">
                        <span class="badge text-white px-2 px-md-3 py-1 py-md-2 rounded-pill font-monospace" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem;">
                            ${currentQuestionIndex + 1} / ${TOTAL_QUESTIONS}
                        </span>
                        <span class="text-white-50 small text-uppercase fw-bold d-none d-md-inline">${q.category}</span>
                    </div>
                    <!-- Mini progress bar -->
                    <div style="width: 100px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                        <div class="bg-gradient-primary h-100" style="width: ${progressPercent}%; transition: width 0.5s ease;"></div>
                    </div>
                </div>

                <!-- Content Body - Fixed height, centered -->
                <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center p-3 p-md-5 overflow-hidden">
                    <h3 class="text-white mb-3 mb-md-5 lh-base fw-semibold animate-slide-up" style="font-size: clamp(1rem, 4vw, 1.8rem); max-width: 95%;">
                        "${q.text}"
                    </h3>

                    <!-- Interactive Slider Area -->
                    <div class="w-100 px-2 px-md-5 mb-2 mb-md-4 animate-slide-up" style="animation-delay: 0.1s;">
                        <input type="range" class="form-range custom-range-lg" min="0" max="10" step="1" value="${currentValue}" 
                            id="q-slider" oninput="updateSliderUI(this.value)">
                        
                        <!-- 0-10 Scale Labels -->
                        <div class="d-flex justify-content-between px-1 mt-2 mb-3 text-white-50 font-monospace" style="font-size: 0.85rem;">
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

                        <div class="position-relative mt-2 text-white-50 fw-medium small text-uppercase w-100" style="height: 30px;">
                            <!-- Left Label -->
                            <span id="label-left" class="position-absolute start-0 top-50 translate-middle-y" style="transition: all 0.3s ease;">
                                <i class="fa-regular fa-face-frown me-1"></i><span class="d-none d-md-inline">Ghét</span>
                            </span>
                            
                            <!-- Center Score -->
                            <div class="position-absolute top-50 start-50 translate-middle text-center">
                                <span class="text-white fw-bold fs-4 d-inline-block" id="score-display" style="transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);">${currentValue}</span>
                            </div>

                            <!-- Right Label -->
                            <span id="label-right" class="position-absolute end-0 top-50 translate-middle-y" style="transition: all 0.3s ease;">
                                <span class="d-none d-md-inline">Yêu thích</span><i class="fa-solid fa-fire ms-1"></i>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Footer Navigation - Fixed at bottom -->
                <div class="p-2 p-md-4 d-flex justify-content-between align-items-center flex-shrink-0" style="background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.08);">
                    <button class="btn btn-link text-white-50 text-decoration-none hover-white btn-sm" 
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
            9: { color: '#8b5cf6', shadow: '0 0 12px rgba(139,92,246,0.5)' },  // Violet
            10: { color: '#a855f7', shadow: '0 0 15px rgba(168,85,247,0.6)' }  // Purple - Passion
        };

        const scoreStyle = scoreColors[val] || scoreColors[5];
        display.style.color = scoreStyle.color;
        display.style.textShadow = scoreStyle.shadow;
    }

    // Label Logic - Highlight extremes (0-10 scale)
    if (leftLabel && rightLabel) {
        // Reset default state
        leftLabel.style.opacity = '0.4';
        leftLabel.style.transform = 'translateY(-50%) scale(0.9)';
        leftLabel.style.color = '#94a3b8';

        rightLabel.style.opacity = '0.4';
        rightLabel.style.transform = 'translateY(-50%) scale(0.9)';
        rightLabel.style.color = '#94a3b8';

        if (val <= 2) {
            // Activate Left (Dislike)
            leftLabel.style.opacity = '1';
            leftLabel.style.transform = 'translateY(-50%) scale(1.1)';
            leftLabel.style.color = '#ef4444';
            leftLabel.innerHTML = '<i class="fa-solid fa-face-frown text-danger me-1"></i><span class="d-none d-md-inline">Ghét</span>';
        } else if (val >= 8) {
            // Activate Right (Love)
            rightLabel.style.opacity = '1';
            rightLabel.style.transform = 'translateY(-50%) scale(1.1)';
            rightLabel.style.color = '#a855f7';
            rightLabel.innerHTML = '<span class="d-none d-md-inline">Yêu thích</span><i class="fa-solid fa-fire text-warning ms-1"></i>';
        } else {
            // Neutral
            leftLabel.innerHTML = '<i class="fa-regular fa-face-frown me-1"></i><span class="d-none d-md-inline">Ghét</span>';
            rightLabel.innerHTML = '<span class="d-none d-md-inline">Yêu thích</span><i class="fa-solid fa-fire ms-1"></i>';
        }
    }

    // Update slider background gradient (0-10 scale = val * 10%)
    if (slider) {
        const percent = val * 10;
        slider.style.background = `linear-gradient(to right, #6366f1 0%, #a855f7 ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`;
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

const CAREER_DATASET = `
NHÓM 1: CÔNG NGHỆ, DỮ LIỆU & KHOA HỌC (STEM)
Lập trình viên (Web, Mobile, Game, AI, Blockchain, VR/AR, Nhúng), Kỹ sư phần mềm, Kỹ sư cầu nối (BrSE), Kiến trúc sư hệ thống, Kỹ sư dữ liệu, Nhà khoa học dữ liệu, Chuyên gia bảo mật mạng, Hacker mũ trắng, Quản trị mạng, Quản trị cơ sở dữ liệu, Kỹ sư DevOps, Kỹ sư đám mây (Cloud), Kỹ sư phần cứng, Kỹ sư vi mạch, Tester (QA/QC), Scrum Master, Product Owner, Chuyên gia IoT, Nhà toán học, Nhà vật lý (hạt nhân, lý thuyết, thiên văn, quang học), Nhà hóa học (hữu cơ, vô cơ, phân tích), Nhà sinh học (di truyền, vi sinh, tế bào, biển), Nhà địa chất, Nhà khí tượng, Nhà khảo cổ, Nhà nhân chủng học, Nhà xã hội học, Nhà sử học, Nhà ngôn ngữ học, Nhà thần kinh học, Chuyên gia thống kê, Kỹ sư robot, Kỹ sư hàng không vũ trụ, Kỹ sư công nghệ nano, Kỹ sư vật liệu mới, Chuyên gia tin học tội phạm, Kỹ sư Prompt (AI), Chuyên gia tính toán lượng tử.

NHÓM 2: Y TẾ, SỨC KHỎE & THẨM MỸ
Bác sĩ đa khoa, Bác sĩ ngoại khoa (Tim, Não, Chỉnh hình, Thẩm mỹ, Tiêu hóa), Bác sĩ nội khoa, Bác sĩ nhi, Bác sĩ sản, Bác sĩ da liễu, Bác sĩ mắt, Bác sĩ tai mũi họng, Bác sĩ tâm thần, Bác sĩ pháp y, Bác sĩ thú y, Bác sĩ y học cổ truyền, Bác sĩ châm cứu, Nha sĩ, Dược sĩ, Điều dưỡng/Y tá (phòng mổ, hồi sức, cộng đồng), Hộ sinh, Kỹ thuật viên xét nghiệm, Kỹ thuật viên chẩn đoán hình ảnh (X-quang, MRI), Chuyên gia vật lý trị liệu, Chuyên gia phục hồi chức năng, Chuyên gia dinh dưỡng, Chuyên gia thính học, Chuyên gia ngôn ngữ trị liệu, Bác sĩ nắn xương (Chiropractor), Nhân viên cấp cứu (Paramedic), Hộ lý, Chuyên viên Spa, Kỹ thuật viên Massage, Chuyên gia trang điểm (Makeup Artist), Thợ làm móng (Nail), Thợ nối mi, Thợ xăm hình, Chuyên gia tư vấn sắc đẹp.

NHÓM 3: KINH DOANH, TÀI CHÍNH & QUẢN TRỊ
CEO, CFO, CMO, CTO, CHRO, CPO, Giám đốc kinh doanh, Giám đốc dự án, Giám đốc sáng tạo, Quản lý sản xuất, Quản lý chất lượng, Quản lý rủi ro, Quản lý chuỗi cung ứng, Chuyên viên nhân sự (Tuyển dụng, C&B, Đào tạo), Headhunter, Kế toán (Tổng hợp, Thuế, Kho, Công nợ), Kiểm toán viên, Chuyên viên phân tích tài chính, Chuyên viên tư vấn đầu tư, Môi giới chứng khoán, Trader (Forex, Crypto, Gold), Chuyên viên tín dụng, Giao dịch viên ngân hàng, Chuyên viên định phí bảo hiểm (Actuary), Đại lý bảo hiểm, Môi giới bất động sản, Chuyên viên thẩm định giá, Đấu giá viên, Chuyên viên xuất nhập khẩu, Nhân viên mua hàng (Purchasing), Thư ký, Trợ lý giám đốc, Nhân viên hành chính, Lễ tân văn phòng, Nhân viên nhập liệu.

NHÓM 4: MARKETING, TRUYỀN THÔNG & NGHỆ THUẬT
Digital Marketer, SEO Specialist, Content Creator, Copywriter, Biên tập viên, Phóng viên, Nhà báo, Quay phim, Nhiếp ảnh gia (Chân dung, Sự kiện, Sản phẩm, Cưới), Dựng phim, Đạo diễn (Phim, MV, Sự kiện), Nhà sản xuất, Biên kịch, Kỹ thuật viên âm thanh, Kỹ thuật viên ánh sáng, Thiết kế đồ họa, Thiết kế 3D, Thiết kế nội thất, Thiết kế thời trang, Thiết kế web (UI/UX), Giám đốc nghệ thuật, Họa sĩ (Truyện tranh, Minh họa, Sơn dầu, Digital), Nhạc sĩ, Ca sĩ (Pop, Rock, Opera, Indie), Rapper, DJ, Nhạc công (Piano, Guitar, Violin, Trống, Sáo...), Nhạc trưởng, Vũ công, Biên đạo múa, Diễn viên (Điện ảnh, Kịch, Lồng tiếng, Đóng thế), Người mẫu, MC, Streamer, Youtuber, Tiktoker, KOL, Influencer, Chuyên gia PR, Tổ chức sự kiện.

NHÓM 5: KỸ THUẬT, SẢN XUẤT & VẬN TẢI
Kỹ sư cơ khí, Kỹ sư điện, Kỹ sư điện tử, Kỹ sư tự động hóa, Kỹ sư xây dựng, Kỹ sư cầu đường, Kỹ sư môi trường, Kỹ sư nông nghiệp, Kỹ sư lâm nghiệp, Kỹ sư thủy sản, Kỹ sư dầu khí, Kiến trúc sư, Kiến trúc sư cảnh quan, Nhà quy hoạch đô thị, Phi công, Tiếp viên hàng không, Kiểm soát không lưu, Thuyền trưởng, Thủy thủ, Lái tàu hỏa, Tài xế (Taxi, Xe tải, Container, Xe buýt, Xe cứu thương, Xe cứu hỏa), Thợ máy ô tô, Thợ sửa xe máy, Thợ hàn, Thợ tiện, Thợ phay, Thợ mộc, Thợ nề, Thợ sơn, Thợ điện nước, Thợ sửa điện lạnh, Thợ may, Thợ vận hành máy (CNC, In, Dệt), Công nhân lắp ráp, Công nhân vệ sinh, Nhân viên kho, Shipper.

NHÓM 6: DỊCH VỤ, DU LỊCH & ĐỜI SỐNG
Đầu bếp (Bếp trưởng, Bếp phó, Bếp bánh, Bếp lạnh), Phụ bếp, Bartender, Barista, Sommelier (Rượu vang), Phục vụ bàn, Quản lý nhà hàng/khách sạn, Lễ tân khách sạn, Buồng phòng, Hướng dẫn viên du lịch, Điều hành tour, Bảo vệ, Vệ sĩ, Thám tử tư, Luật sư, Thẩm phán, Kiểm sát viên, Công chứng viên, Công an, Cảnh sát, Bộ đội, Lính cứu hỏa, Giáo viên (Mầm non, Tiểu học, Toán, Lý, Hóa, Văn, Anh, Nhạc, Họa, Thể dục...), Giảng viên đại học, Gia sư, Huấn luyện viên thể hình (PT), HLV Yoga, HLV Bơi lội, HLV Võ thuật, Trọng tài, Cầu thủ bóng đá, VĐV chuyên nghiệp, Tu sĩ/Nhà sư/Mục sư, Chuyên gia phong thủy, Chuyên gia tâm lý, Nhân viên xã hội.

NHÓM 7: NGHỀ NGÁCH, THỦ CÔNG & ĐỘC LẠ
Nghệ nhân gốm, Nghệ nhân thổi thủy tinh, Thợ đóng giày thủ công, Thợ sửa đồng hồ, Thợ kim hoàn, Thợ khóa, Người nuôi ong, Người huấn luyện thú, Người chăm sóc thú (Zookeeper), Kiểm lâm, Thợ lặn công nghiệp, Thợ lặn dò mìn, Chuyên gia nước hoa (Perfumer), Chuyên gia nếm trà/cà phê, Chuyên gia thử đồ ăn, Người ngủ thuê, Người xếp hàng thuê, Người khóc thuê, Người mẫu bàn tay, Chuyên gia đặt tên, Chuyên gia phục chế đồ cổ, Người viết điếu văn, Thợ làm tóc giả, Người dò tìm kim loại, Chuyên gia săn ma (nghiên cứu hiện tượng siêu nhiên), Người dọn dẹp hiện trường vụ án, Chuyên gia ướp xác, Người điều khiển rối, Nghệ sĩ xiếc, Ảo thuật gia, Người đọc bài Tarot, Nhà chiêm tinh, Chuyên gia e-Sport, Game thủ chuyên nghiệp, Hacker mũ xám, Người săn tiền thưởng (Bounty Hunter - ở nước ngoài), Lính đánh thuê, Chuyên gia đàm phán con tin, Nhà nghiên cứu UFO.

NHÓM 8: NÔNG - LÂM - NGƯ NGHIỆP CỤ THỂ
Nông dân công nghệ cao, Kỹ thuật viên trại giống, Người trồng nấm, Người trồng hoa lan, Người tỉa cây cảnh (Bonsai), Người thu hoạch cà phê/hồ tiêu, Ngư dân đánh bắt xa bờ, Ngư dân nuôi trồng thủy sản (Tôm, Cá tra), Người làm muối (Diêm dân), Người khai thác mủ cao su, Người nuôi yến, Người nuôi dế/côn trùng thực phẩm.

KHỐI 9: CHUYÊN GIA SINH HỌC & TỰ NHIÊN
Nhà nghiên cứu loài bò sát (Herpetologist), Nhà nghiên cứu các loài cá (Ichthyologist), Nhà nghiên cứu chim (Ornithologist), Nhà nghiên cứu côn trùng cánh vẩy (Lepidopterist - bướm), Nhà nghiên cứu linh trưởng (Primatologist), Nhà nghiên cứu rêu (Bryologist), Nhà nghiên cứu nấm mốc, Chuyên gia định danh thực vật, Nhà nghiên cứu ký sinh trùng đường ruột, Chuyên gia bảo tồn rùa biển, Người nhân giống chó nghiệp vụ, Người huấn luyện cá heo, Người chăm sóc gấu trúc, Chuyên gia phục hồi rạn san hô, Nhà nghiên cứu vi khuẩn học, Nhà nghiên cứu virus học thực vật, Kỹ thuật viên ngân hàng gen, Chuyên gia lai tạo giống lúa, Người kiểm định chất lượng gỗ, Nhà nghiên cứu đất ngập nước, Chuyên gia về động vật chân đốt, Người nuôi trùn quế, Người nuôi dế mèn thương phẩm, Kỹ sư cảnh quan sân golf, Chuyên gia cắt tỉa cây xanh đô thị (Arborist - leo cây cắt cành), Người thu hoạch tổ yến vách đá.

KHỐI 10: ẨM THỰC & CHẾ BIẾN CHUYÊN SÂU
Thợ làm phô mai (Cheesemaker), Thợ làm xúc xích thủ công (Charcutier), Thợ làm socola (Chocolatier), Chuyên gia nếm dầu oliu, Chuyên gia nếm bia (Cicerone), Chuyên gia rang xay cà phê (Coffee Roaster), Thợ làm bánh mì men tự nhiên (Sourdough Baker), Thợ làm kem Gelato, Nghệ nhân cắt tỉa rau củ (Fruit Carving), Đầu bếp Teppanyaki (biểu diễn), Đầu bếp Sushi (Itamae), Chuyên gia ủ rượu Whiskey, Chuyên gia pha chế thuốc lá (Tobacco Blender), Người kiểm tra độ tươi hải sản, Thợ lóc xương cá ngừ đại dương, Thợ mổ heo, Thợ làm bún/phở thủ công, Người làm nước mắm truyền thống, Chuyên gia lên men (Kombucha/Kimchi), Food Stylist (Trang trí món ăn để chụp hình), Food Blogger, Vlogger Mukbang (Ăn uống trên sóng livestream), Người phê bình nhà hàng ẩn danh.

KHỐI 11: ĐIỆN ẢNH, SÂN KHẤU & HẬU TRƯỜNG (CREW)
Chỉ đạo ánh sáng (Gaffer), Trợ lý ánh sáng (Best Boy Electric), Kỹ thuật viên cầm sào micro (Boom Operator), Thư ký trường quay (Script Supervisor), Người tìm bối cảnh (Location Scout), Giám đốc casting, Chuyên gia đóng thế (Stunt Coordinator), Người điều khiển rối dây, Người hóa trang vết thương giả, Thợ làm tóc cổ trang, Người phụ trách đạo cụ (Prop Master), Người tạo tiếng động (Foley Artist), Người chỉnh màu phim (Colorist), Người viết phụ đề (Subtitler), Đạo diễn lồng tiếng, Người vận hành máy nhắc chữ (Teleprompter), Kỹ thuật viên pháo hoa sân khấu, Người điều khiển đèn Follow (Spotlight Operator), Thợ mộc dựng cảnh, Thợ sơn phông nền, Người mẫu bàn tay (cho quảng cáo nhẫn/kem), Người đóng vai quần chúng (Extra).

KHỐI 12: THỜI TRANG, DỆT MAY & XA XỈ PHẨM
Thợ đóng giày thửa (Bespoke Shoemaker), Thợ may Vest nam (Tailor), Thợ may đầm dạ hội (Couturier), Thợ thêu Kimono, Thợ nhuộm vải tự nhiên (Indigo), Thợ thuộc da cá sấu, Thợ làm túi xách thủ công, Thợ sửa túi hiệu (Bag Spa), Thợ đánh bóng đồng hồ cao cấp, Thợ khảm kim cương (Diamond Setter), Chuyên gia giám định túi Hermes/Chanel thật giả, Personal Shopper (Người mua sắm thuê cho giới siêu giàu), Chuyên gia tư vấn màu sắc cá nhân (Personal Color Analysis), Người mẫu nội y, Người mẫu Big size, Người mẫu tóc, Nhà thiết kế hoa văn vải (Print Designer), Kỹ thuật viên rập (Pattern Maker), Merchandiser (Điều phối hàng hóa thời trang), Visual Merchandiser (Trang trí window cửa hàng).

KHỐI 13: CÔNG NGHIỆP, CƠ KHÍ & VẬN TẢI ĐẶC THÙ
Thợ hàn dưới nước (Underwater Welder), Thợ hàn TIG/MIG, Thợ vận hành máy tiện CNC, Thợ vận hành máy phay, Thợ vận hành máy cắt Laser, Thợ vận hành lò hơi, Thợ sửa chữa tuabin gió (Wind Turbine Technician - làm việc trên cao), Thợ sửa chữa giàn khoan dầu khí, Thợ lặn bão hòa (Saturation Diver), Thủy thủ tàu phá băng, Lái xe siêu trường siêu trọng, Lái xe cẩu bánh xích, Người vận hành cảng biển (Stevedore), Kiểm định viên không phá hủy (NDT Technician), Kỹ sư luyện kim bột, Kỹ sư gốm kỹ thuật, Thợ thổi thủy tinh phòng thí nghiệm, Thợ mài dao kéo chuyên nghiệp, Thợ sửa khóa két sắt, Thợ sửa chữa máy bay trực thăng.

KHỐI 14: Y TẾ & SỨC KHỎE NGÁCH (ALLIED HEALTH)
Bác sĩ chuyên khoa chân (Podiatrist), Bác sĩ chuyên khoa lão (Geriatrician), Chuyên gia nắn xương khớp (Osteopath), Chuyên gia liệu pháp mùi hương (Aromatherapist), Chuyên gia thôi miên trị liệu (Hypnotherapist), Chuyên gia châm cứu thú y, Hộ lý chăm sóc cuối đời (Hospice Nurse), Kỹ thuật viên chạy thận nhân tạo, Kỹ thuật viên tim phổi nhân tạo (Perfusionist), Chuyên gia dinh dưỡng cho bệnh nhân tiểu đường, Chuyên gia tư vấn giấc ngủ cho trẻ sơ sinh, Huấn luyện viên Pilates, Huấn luyện viên Doula (người hỗ trợ sinh nở phi y tế), Người lấy nọc độc rắn (để chế huyết thanh), Người hiến máu/tiểu cầu chuyên nghiệp (ở một số nước có trả phí), Người thử thuốc lâm sàng.

KHỐI 15: LỊCH SỬ, VĂN HÓA & TÔN GIÁO
Nhà Ai Cập học (Egyptologist), Nhà Hán Nôm học, Chuyên gia phục chế tranh sơn dầu, Chuyên gia phục chế sách cổ, Người ướp xác (Embalmer), Người đào huyệt, Người quản trang, Thầy cúng, Thầy pháp, Mục sư tuyên úy (trong quân đội/bệnh viện), Người đọc kinh, Người rung chuông nhà thờ, Nghệ nhân đúc tượng phật, Nghệ nhân làm giấy dó, Nghệ nhân làm tranh Đông Hồ, Nghệ nhân múa rối nước, Người kể chuyện dân gian, Hướng dẫn viên du lịch tâm linh, Nhà nghiên cứu văn hóa Chăm/Khmer.

KHỐI 16: THỂ THAO & GAME
Trọng tài bóng đá (FIFA), Trọng tài Tennis, Trọng tài Bida, Caddie (Người kéo gậy Golf), Greenkeeper (Người chăm sóc cỏ sân Golf/Sân vận động), Người mài giày trượt băng, Người lái xe Zamboni (xe làm phẳng mặt băng), Pit Crew (Thợ thay lốp F1), Người nhặt bóng (Ball boy/girl), Huấn luyện viên E-sport, Streamer Game, Bình luận viên Game (Caster), Người cày thuê (Booster), Người bán vật phẩm ảo (RMT), Nhà thiết kế màn chơi (Level Designer), Nhà thiết kế kinh tế trong game (Game Economy Designer), Tester Game (chuyên tìm lỗi tường/vật lý), Vận động viên dù lượn, Vận động viên leo núi trong nhà.

KHỐI 17: CÔNG NGHỆ TƯƠNG LAI & DỮ LIỆU
Kỹ sư Blockchain, Chuyên gia đào tiền ảo (Crypto Miner), Chuyên gia phân tích On-chain, Chuyên gia thiết kế Metaverse, Kiến trúc sư thực tế ảo, Bác sĩ phẫu thuật từ xa (Telesurgeon), Kỹ sư in nội tạng 3D (Bioprinting), Chuyên gia đạo đức AI (AI Ethicist), Chuyên gia gỡ bỏ tin giả (Misinformation Analyst), Người huấn luyện Chatbot, Kỹ sư xe tự hành, Kỹ sư pin xe điện, Chuyên gia năng lượng hydro, Kỹ sư thu hồi carbon, Nông dân canh tác thẳng đứng (Vertical Farmer), Chuyên gia thịt nhân tạo (Lab-grown meat scientist), Người dọn rác vũ trụ (lý thuyết/tương lai).

KHỐI 18: DỊCH VỤ ĐỘC, LẠ & FREELANCE
Người xếp hàng mua iPhone/Giày thuê, Người đi đám ma thuê, Người đóng giả bạn trai/bạn gái, Người ôm chuyên nghiệp (Professional Cuddler), Người lắng nghe tâm sự (thu phí theo giờ), Người viết thư tình thuê, Người đặt tên cho công ty/thương hiệu, Người săn đồ cũ (Thrifter/Reseller), Người chuyên review khách sạn (Mystery Guest), Người kiểm tra máng trượt công viên nước, Người ngửi nách (kiểm tra lăn khử mùi), Người nếm thức ăn cho chó mèo, Người vắt sữa rắn, Người săn bão (Storm Chaser), Thám tử thú cưng (tìm chó mèo lạc), Người dọn dẹp hiện trường tai nạn/án mạng, Người trục vớt gỗ dưới lòng hồ, Người đãi vàng sa khoáng.

KHỐI 19: CÔNG NGHIỆP, SẢN XUẤT & VẬN HÀNH MÁY (CỰC KỲ CỤ THỂ)
Thợ vận hành máy phay CNC, Thợ vận hành máy tiện CNC, Thợ vận hành máy cắt dây EDM, Thợ vận hành máy mài phẳng, Thợ vận hành máy mài tròn, Thợ vận hành máy doa, Thợ vận hành máy bào, Thợ vận hành máy chuốt, Thợ vận hành máy cưa vòng, Thợ vận hành máy cắt laser kim loại, Thợ vận hành máy cắt tia nước (Waterjet), Thợ vận hành máy đột dập, Thợ vận hành máy chấn tôn, Thợ vận hành máy cán tôn, Thợ vận hành máy uốn ống, Thợ vận hành máy đúc áp lực, Thợ vận hành máy ép nhựa, Thợ vận hành máy thổi chai PET, Thợ vận hành máy đùn nhôm, Thợ vận hành máy cán thép, Thợ vận hành máy kéo dây, Thợ vận hành máy bện cáp, Thợ vận hành máy dệt kim tròn, Thợ vận hành máy dệt thoi, Thợ vận hành máy nhuộm cao áp, Thợ vận hành máy in Offset, Thợ vận hành máy in Flexo, Thợ vận hành máy in ống đồng, Thợ vận hành máy bế hộp, Thợ vận hành máy dán hộp, Thợ vận hành máy đóng sách, Thợ vận hành lò hơi công nghiệp, Thợ vận hành hệ thống lạnh trung tâm (Chiller), Thợ vận hành máy nén khí công nghiệp, Thợ vận hành trạm xử lý nước thải, Thợ vận hành trạm biến áp, Thợ vận hành máy phát điện dự phòng, Thợ vận hành cầu trục, Thợ vận hành cổng trục, Thợ vận hành xe nâng người (Boom lift), Thợ vận hành máy xúc lật, Thợ vận hành máy đào gầu ngoạm, Thợ vận hành máy rải thảm nhựa đường, Thợ vận hành máy lu rung.

KHỐI 20: QUÂN SỰ, AN NINH & TÌNH BÁO (NHÓM ĐẶC THÙ)
Lính bộ binh, Lính pháo binh, Lính tăng thiết giáp, Lính công binh (Xây dựng/Gỡ mìn), Lính đặc công nước, Lính đặc công bộ, Lính dù, Lính biên phòng, Cảnh sát biển, Lính hải quân đánh bộ, Phi công tiêm kích, Phi công trực thăng vũ trang, Nhân viên kỹ thuật vũ khí đạn, Nhân viên quân khí, Nhân viên quân nhu, Nhân viên quân y, Bác sĩ quân y, Y tá quân y, Nhân viên thông tin liên lạc quân sự, Nhân viên cơ yếu (Mã thám/Mật mã), Trinh sát viên, Xạ thủ tỉa (Sniper), Quan sát viên pháo binh, Nhân viên điều khiển UAV quân sự, Chuyên gia tác chiến điện tử, Chuyên gia an ninh mạng quân đội, Cảnh sát hình sự, Cảnh sát giao thông, Cảnh sát cơ động (SWAT), Cảnh sát môi trường, Cảnh sát phòng cháy chữa cháy, Cảnh sát điều tra tội phạm ma túy, Cảnh sát điều tra tội phạm công nghệ cao, Quản giáo (Cai ngục), Chuyên gia giám định pháp y súng đạn, Chuyên gia đàm phán giải cứu con tin, Vệ sĩ yếu nhân (VIP Protection), Lính đánh thuê (Nhà thầu an ninh tư nhân), Nhân viên tình báo chiến lược, Điệp viên nằm vùng.

KHỐI 21: Y HỌC & CHĂM SÓC SỨC KHỎE (PHÂN NHÁNH SÂU)
Bác sĩ chuyên khoa gan mật, Bác sĩ chuyên khoa hậu môn trực tràng, Bác sĩ chuyên khoa dị ứng miễn dịch, Bác sĩ chuyên khoa lão khoa, Bác sĩ chuyên khoa y học thể thao, Bác sĩ chuyên khoa y học hạt nhân, Bác sĩ chuyên khoa y học lao động, Bác sĩ chuyên khoa y học biển, Bác sĩ chuyên khoa bỏng, Bác sĩ phẫu thuật lồng ngực, Bác sĩ phẫu thuật mạch máu, Bác sĩ phẫu thuật thần kinh cột sống, Bác sĩ phẫu thuật bàn tay, Bác sĩ phẫu thuật tạo hình thẩm mỹ, Chuyên gia phôi học (IVF), Chuyên gia di truyền y học, Kỹ thuật viên khúc xạ nhãn khoa, Kỹ thuật viên dụng cụ chỉnh hình (Chân tay giả), Kỹ thuật viên nha khoa phục hình (Làm răng sứ), Điều dưỡng phòng mổ (Scrub Nurse), Điều dưỡng gây mê, Điều dưỡng hồi sức cấp cứu (ICU), Điều dưỡng chăm sóc vết thương, Điều dưỡng cộng đồng, Hộ lý chăm sóc người già tại nhà, Chuyên gia tâm lý học đường, Chuyên gia tâm lý lâm sàng, Chuyên gia trị liệu ngôn ngữ cho trẻ tự kỷ, Chuyên gia trị liệu vận động thô, Chuyên gia trị liệu vận động tinh, Chuyên gia tư vấn dinh dưỡng bệnh lý (Tiểu đường/Gout), Dược sĩ lâm sàng, Dược sĩ bào chế, Dược sĩ kiểm nghiệm thuốc.

KHỐI 22: NÔNG NGHIỆP, SINH HỌC & MÔI TRƯỜNG (CHI TIẾT)
Kỹ sư nông học chuyên về lúa, Kỹ sư nông học chuyên về cây ăn quả, Kỹ sư nông học chuyên về rau màu, Kỹ sư bảo vệ thực vật, Chuyên gia bệnh học cây trồng, Chuyên gia côn trùng học nông nghiệp, Chuyên gia lai tạo giống cây trồng, Kỹ sư chăn nuôi heo, Kỹ sư chăn nuôi bò sữa, Kỹ sư chăn nuôi gia cầm, Kỹ sư thủy sản nước ngọt, Kỹ sư thủy sản nước mặn (Tôm/Cá biển), Chuyên gia bệnh học thủy sản, Kỹ sư lâm sinh (Trồng rừng), Kỹ sư chế biến lâm sản, Kiểm lâm viên bảo tồn thiên nhiên, Nhân viên tuần tra rừng, Chuyên gia bảo tồn động vật hoang dã, Người nhân giống chó cảnh, Người huấn luyện chó nghiệp vụ, Người huấn luyện chim ưng, Người nuôi ong lấy mật, Người nuôi tằm lấy tơ, Người trồng nấm dược liệu (Linh chi/Đông trùng hạ thảo), Người trồng hoa lan cấy mô, Kỹ sư công nghệ sinh học thực vật, Kỹ sư công nghệ sinh học động vật, Kỹ sư vi sinh vật học, Chuyên gia xử lý rác thải sinh hoạt, Chuyên gia xử lý chất thải nguy hại, Kỹ sư cấp thoát nước đô thị, Chuyên gia quan trắc môi trường.

KHỐI 23: GIAO THÔNG, VẬN TẢI & HẬU CẦN (LOGISTICS)
Tài xế xe đầu kéo container, Tài xế xe tải đông lạnh, Tài xế xe bồn xăng dầu, Tài xế xe bồn bê tông, Tài xế xe cứu hộ giao thông, Tài xế xe buýt trường học, Tài xế xe khách đường dài, Tài xế xe taxi công nghệ, Tài xế xe ôm công nghệ, Lái tàu hỏa chở khách, Lái tàu hỏa chở hàng, Lái tàu điện ngầm (Metro), Lái tàu điện trên cao, Thuyền trưởng tàu hàng rời, Thuyền trưởng tàu dầu, Thuyền trưởng tàu container, Thuyền phó, Máy trưởng tàu biển, Máy hai, Máy ba, Thợ điện tàu biển, Thủy thủ boong, Thủy thủ buồng máy, Hoa tiêu cảng vụ, Nhân viên điều độ cảng, Nhân viên khai báo hải quan, Nhân viên giao nhận hiện trường (Ops), Nhân viên chứng từ xuất nhập khẩu (Docs), Nhân viên thu mua quốc tế, Nhân viên kho hàng thương mại điện tử, Nhân viên đóng gói hàng hóa, Nhân viên kiểm đếm hàng hóa, Nhân viên vận hành băng chuyền hành lý sân bay, Nhân viên điều phối bay (Dispatcher), Nhân viên cân bằng trọng tải máy bay (Load Control), Nhân viên lái xe thang máy bay, Nhân viên lái xe suất ăn hàng không, Nhân viên an ninh soi chiếu sân bay.

KHỐI 24: XÂY DỰNG, KIẾN TRÚC & ĐỊA ỐC
Kiến trúc sư quy hoạch vùng, Kiến trúc sư thiết kế công trình công cộng, Kiến trúc sư thiết kế nhà ở, Kiến trúc sư bảo tồn di sản, Kỹ sư kết cấu thép, Kỹ sư kết cấu bê tông cốt thép, Kỹ sư địa kỹ thuật (Móng cọc), Kỹ sư cấp thoát nước công trình, Kỹ sư hệ thống điện công trình (M&E), Kỹ sư hệ thống thông gió và điều hòa không khí (HVAC), Kỹ sư phòng cháy chữa cháy, Kỹ sư dự toán (QS), Chỉ huy trưởng công trường, Giám sát an toàn lao động công trường, Thợ nề (Xây trát), Thợ ốp lát, Thợ sơn bả, Thợ làm trần thạch cao, Thợ làm vách ngăn, Thợ lắp đặt cửa nhôm kính, Thợ sắt (Gia công cửa cổng), Thợ mộc cốp pha, Thợ uốn sắt xây dựng, Thợ chống thấm, Thợ lắp đặt giàn giáo, Thợ vận hành cẩu tháp, Thợ khoan cọc nhồi, Thợ ép cọc bê tông, Chuyên viên môi giới đất nền, Chuyên viên môi giới chung cư, Chuyên viên môi giới văn phòng cho thuê, Chuyên viên quản lý tòa nhà (Building Manager), Nhân viên kỹ thuật tòa nhà.

KHỐI 25: GIÁO DỤC, NGHIÊN CỨU & HỌC THUẬT (NHIỀU LĨNH VỰC)
Giáo sư Toán học, Giáo sư Vật lý, Giáo sư Hóa học, Giáo sư Văn học, Giáo sư Lịch sử, Giáo sư Triết học, Giáo sư Xã hội học, Giáo sư Tâm lý học, Giáo sư Kinh tế học, Giáo sư Luật học, Giảng viên Marketing, Giảng viên Tài chính, Giảng viên Kế toán, Giảng viên Công nghệ thông tin, Giảng viên Du lịch, Giáo viên Mầm non, Giáo viên Tiểu học, Giáo viên Toán THCS/THPT, Giáo viên Văn THCS/THPT, Giáo viên Anh văn THCS/THPT, Giáo viên Vật lý, Giáo viên Hóa học, Giáo viên Sinh học, Giáo viên Lịch sử, Giáo viên Địa lý, Giáo viên Giáo dục công dân, Giáo viên Thể dục, Giáo viên Quốc phòng an ninh, Giáo viên Âm nhạc, Giáo viên Mỹ thuật, Giáo viên dạy nghề điện, Giáo viên dạy nghề cơ khí, Giáo viên dạy lái xe ô tô, Giáo viên dạy bơi, Giáo viên dạy đàn Piano, Giáo viên dạy đàn Guitar, Giáo viên dạy vẽ, Giáo viên dạy múa, Giáo viên dạy cờ vua, Gia sư tại nhà, Nghiên cứu viên viện hàn lâm, Thủ thư thư viện, Cán bộ quản lý giáo dục.

KHỐI 26: NGHỆ THUẬT, GIẢI TRÍ & TRUYỀN THÔNG (SÁNG TẠO)
Đạo diễn phim truyện, Đạo diễn phim tài liệu, Đạo diễn phim hoạt hình, Đạo diễn MV ca nhạc, Đạo diễn sự kiện, Biên kịch phim, Biên kịch gameshow, Biên tập viên truyền hình, Biên tập viên báo in, Biên tập viên báo điện tử, Phóng viên thời sự, Phóng viên điều tra, Phóng viên thể thao, Phóng viên văn hóa văn nghệ, Nhiếp ảnh gia báo chí, Nhiếp ảnh gia thời trang, Nhiếp ảnh gia phong cảnh, Nhiếp ảnh gia ẩm thực, Nhiếp ảnh gia kiến trúc, Quay phim truyền hình, Quay phim điện ảnh, Dựng phim, Kỹ thuật viên đồ họa chuyển động (Motion Graphic), Kỹ thuật viên kỹ xảo điện ảnh (VFX), Họa sĩ thiết kế bối cảnh, Họa sĩ thiết kế phục trang, Họa sĩ Storyboard, Nhạc sĩ sáng tác, Nhạc sĩ hòa âm phối khí, Kỹ thuật viên thu âm, Kỹ thuật viên Mix/Master nhạc, Ca sĩ thính phòng, Ca sĩ nhạc nhẹ, Ca sĩ nhạc dân gian, Rapper, DJ, Vũ công Ballet, Vũ công Hiphop, Vũ công đương đại, Diễn viên kịch nói, Diễn viên hài, Diễn viên xiếc, Ảo thuật gia, Người mẫu catwalk, Người mẫu ảnh, Streamer, Youtuber, Tiktoker, Podcaster, Blogger du lịch, Blogger ẩm thực, Blogger công nghệ.

KHỐI 27: DỊCH VỤ, DU LỊCH & KHÁCH SẠN (VARIANTS)
Tổng quản lý khách sạn (GM), Giám đốc bộ phận tiền sảnh (FOM), Giám đốc bộ phận buồng phòng (Executive Housekeeper), Giám đốc bộ phận ẩm thực (F&B Director), Bếp trưởng điều hành (Executive Chef), Bếp trưởng bếp Á, Bếp trưởng bếp Âu, Bếp trưởng bếp Bánh, Bếp phó, Tổ trưởng bếp, Đầu bếp chính (Commis), Phụ bếp, Nhân viên rửa bát (Steward), Quản lý nhà hàng, Giám sát nhà hàng, Tổ trưởng bàn, Nhân viên phục vụ bàn, Nhân viên pha chế rượu (Bartender), Nhân viên pha chế cà phê (Barista), Nhân viên Sommelier (Tư vấn rượu vang), Lễ tân khách sạn, Nhân viên đặt phòng (Reservation), Nhân viên tổng đài khách sạn, Nhân viên hành lý (Bellman), Nhân viên mở cửa (Doorman), Nhân viên đỗ xe (Valet), Nhân viên buồng phòng, Nhân viên giặt là, Nhân viên vệ sinh công cộng (Public Area), Hướng dẫn viên du lịch quốc tế (Inbound/Outbound), Hướng dẫn viên du lịch nội địa, Hướng dẫn viên tại điểm, Thuyết minh viên bảo tàng, Điều hành tour du lịch, Nhân viên sales du lịch, Nhân viên ticketing (Vé máy bay).

KHỐI 28: TÀI CHÍNH, NGÂN HÀNG & PHÁP LÝ (CHI TIẾT)
Giám đốc chi nhánh ngân hàng, Trưởng phòng giao dịch, Kiểm soát viên ngân hàng, Giao dịch viên, Chuyên viên quan hệ khách hàng cá nhân (RM cá nhân), Chuyên viên quan hệ khách hàng doanh nghiệp (RM doanh nghiệp), Chuyên viên thẩm định tín dụng, Chuyên viên phê duyệt tín dụng, Chuyên viên xử lý nợ, Chuyên viên thanh toán quốc tế, Chuyên viên kinh doanh ngoại hối, Chuyên viên quản lý rủi ro thị trường, Chuyên viên quản lý rủi ro tín dụng, Chuyên viên quản lý rủi ro hoạt động, Chuyên viên kiểm toán nội bộ ngân hàng, Chuyên viên tuân thủ (Compliance), Chuyên viên môi giới chứng khoán, Chuyên viên phân tích chứng khoán, Chuyên viên tư vấn tài chính cá nhân, Chuyên viên định phí bảo hiểm nhân thọ, Chuyên viên định phí bảo hiểm phi nhân thọ, Chuyên viên giải quyết quyền lợi bảo hiểm, Luật sư tranh tụng, Luật sư tư vấn doanh nghiệp, Luật sư tư vấn đầu tư, Luật sư tư vấn sở hữu trí tuệ, Luật sư tư vấn hôn nhân gia đình, Công chứng viên, Thừa phát lại, Quản tài viên, Đấu giá viên.
`;

async function submitCareerTest() {
    const container = document.getElementById('career-content');

    // Loading State
    container.innerHTML = `
        <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center animate-fade-in">
            <div class="glass-card p-5" style="max-width: 600px; width: 100%;">
                <div class="spinner-border text-primary mb-4" style="width: 3rem; height: 3rem;" role="status"></div>
                <h3 class="text-white mb-3">AI Đang Quét 1000+ Nghề Nghiệp...</h3>
                
                <div class="text-start bg-black rounded-3 p-3 font-monospace small text-success border border-white border-opacity-10" style="min-height: 150px; opacity: 0.9;">
                    <div id="loading-log">
                        > Accessing Global Job Database... OK<br>
                        > Loading Dataset (1000+ entries)... OK<br>
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
                <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-white border-opacity-10">
                    <h3 class="text-white mb-0"><i class="fa-solid fa-compass-drafting text-primary me-2"></i> Kết Quả Định Hướng</h3>
                    <button class="btn btn-outline-light btn-sm rounded-pill px-3" onclick="initCareer()">
                        <i class="fa-solid fa-rotate-left me-2"></i>Làm Lại
                    </button>
                </div>
                <div class="flex-grow-1 overflow-auto custom-scrollbar p-2">
                    <div class="glass-card p-4">
                        <div id="ai-result-markdown" class="markdown-body text-white"></div>
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
                    <h4 class="text-white">Đã xảy ra lỗi!</h4>
                    <p class="text-white-50">Không thể kết nối với AI Server.</p>
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
        .text-gradient { background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .bg-gradient-primary { background: linear-gradient(90deg, #6366f1, #a855f7); }
        
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; transform: translateY(20px); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

        .feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
        .feature-card:hover { background: rgba(255,255,255,0.06); transform: translateY(-5px); border-color: rgba(99,102,241,0.3); }

        .custom-range-lg {
            -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px; outline: none; transition: 0.2s;
        }
        .custom-range-lg::-webkit-slider-thumb {
            -webkit-appearance: none; width: 28px; height: 28px; background: #fff; border-radius: 50%; cursor: pointer;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3), 0 4px 10px rgba(0,0,0,0.3); transition: 0.2s; margin-top: -10px;
        }
        .custom-range-lg::-webkit-slider-thumb:hover { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.2), 0 4px 15px rgba(0,0,0,0.4); }
        .custom-range-lg::-webkit-slider-runnable-track { width: 100%; height: 8px; cursor: pointer; border-radius: 4px; }

        .hover-scale { transition: 0.3s cubic-bezier(0.3, 2, 0.6, 1); }
        .hover-scale:hover { transform: scale(1.05); box-shadow: 0 10px 40px rgba(99, 102, 241, 0.4) !important; }
        .hover-white:hover { color: #fff !important; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        
        /* Markdown Table Styles with Borders */
        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            background: rgba(255, 255, 255, 0.03);
            display: block;
            overflow-x: auto;
            white-space: nowrap;
        }
        .markdown-body table th,
        .markdown-body table td {
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 8px 10px;
            text-align: left;
            font-size: 0.85rem;
        }
        .markdown-body table th {
            background: rgba(99, 102, 241, 0.2);
            font-weight: 600;
            color: #a5b4fc;
            white-space: nowrap;
        }
        .markdown-body table tr:nth-child(even) {
            background: rgba(255, 255, 255, 0.02);
        }
        .markdown-body table tr:hover {
            background: rgba(99, 102, 241, 0.1);
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
