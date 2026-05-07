/**
 * MONITORING SYSTEM PRO (MediaPipe Edition)
 * Advanced Head Pose Estimation using 3D Landmark Analysis
 * 
 * Detection capabilities:
 * - Quay đầu trái/phải (Yaw) - nhìn bài bạn
 * - Ngẩng đầu nhìn lên trời (Pitch Up)
 * - Cúi đầu quá thấp / nhìn xuống bàn khác (Pitch Down excessive)
 * - Quay đầu nhìn ra đằng sau (Extreme Yaw + Roll)
 * - Rời vị trí / không thấy mặt (No Face)
 * - Roll detection (nghiêng đầu bất thường)
 */
let isMonitoring = false;
let faceMesh = null;
let camera = null;
let lastAlertTime = 0;

// Smoothed pose values for stability
let smoothYaw = 0;
let smoothPitch = 0;
let smoothRoll = 0;
const SMOOTH_FACTOR = 0.4; // Lower = smoother but slower response

async function startMonitoring() {
    const video = document.getElementById('monitoring-video');
    const placeholder = document.getElementById('monitoring-placeholder');
    const canvas = document.getElementById('monitoring-canvas');
    const startBtn = document.getElementById('btn-start-monitoring');
    const stopBtn = document.getElementById('btn-stop-monitoring');

    if (!video || !canvas) return;

    try {
        if (!faceMesh) {
            faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            });
            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6
            });
            faceMesh.onResults(renderProctoring);
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, frameRate: { ideal: 30 } } 
        });
        video.srcObject = stream;
        
        // Immediate UI update
        video.style.display = 'block';
        canvas.style.display = 'block';
        if (placeholder) {
            placeholder.style.display = 'none';
            placeholder.classList.add('d-none');
        }

        video.onloadedmetadata = () => {
            video.play();
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };

        if (!camera) {
            camera = new Camera(video, {
                onFrame: async () => {
                    if (isMonitoring) await faceMesh.send({ image: video });
                },
                width: 640,
                height: 480
            });
        }
        camera.start();

        isMonitoring = true;
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'block';
        
        const statusEl = document.getElementById('monitoring-status');
        if (statusEl) statusEl.textContent = 'Status: Live';
        
        if (typeof toast !== 'undefined') toast.success('Hệ thống giám sát đã kích hoạt.');
    } catch (err) {
        console.error('Monitoring Start Error:', err);
        if (typeof toast !== 'undefined') toast.error('Không thể mở camera.');
    }
}

/**
 * Calculate 3D head pose angles from MediaPipe Face Mesh landmarks.
 * Uses key anatomical landmarks for accurate estimation:
 * - Nose tip (1), Chin (152), Left eye corner (33), Right eye corner (263)
 * - Forehead (10), Left cheek (234), Right cheek (454)
 */
function calculateHeadPose(landmarks) {
    // Key landmarks for 3D pose estimation
    const noseTip = landmarks[1];       // Nose tip
    const chin = landmarks[152];        // Chin bottom
    const leftEyeOuter = landmarks[33]; // Left eye outer corner
    const rightEyeOuter = landmarks[263]; // Right eye outer corner
    const forehead = landmarks[10];     // Forehead top center
    const leftCheek = landmarks[234];   // Left cheek
    const rightCheek = landmarks[454];  // Right cheek
    const noseBase = landmarks[168];    // Nose bridge (between eyes)

    // === YAW (Left/Right turn) ===
    // Compare nose tip position relative to the midpoint of the face
    const faceMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const faceWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
    
    // Also use cheek distances for more robust yaw
    const leftDist = Math.abs(noseTip.x - leftCheek.x);
    const rightDist = Math.abs(noseTip.x - rightCheek.x);
    const cheekRatio = (leftDist - rightDist) / (leftDist + rightDist + 0.001);
    
    // Combine nose offset and cheek ratio
    const noseOffset = (noseTip.x - faceMidX) / (faceWidth + 0.001);
    const yaw = noseOffset * 3.0 + cheekRatio * 2.0; // Weighted combination

    // === PITCH (Up/Down tilt) ===
    // Use vertical relationship between forehead, nose, and chin
    const faceHeight = Math.abs(forehead.y - chin.y);
    const noseToForehead = noseTip.y - forehead.y;
    const noseToChin = chin.y - noseTip.y;
    
    // When looking up: nose moves closer to forehead (ratio decreases)
    // When looking down: nose moves closer to chin (ratio increases)
    const verticalRatio = noseToForehead / (faceHeight + 0.001);
    const pitch = (verticalRatio - 0.55) * 6.0; // Centered around neutral pose (~0.55)
    
    // Also factor in the Z-depth difference for better pitch
    const depthPitch = (noseTip.z - noseBase.z) * 8.0;

    // === ROLL (Head tilt/lean) ===
    // Angle of the line connecting the eyes relative to horizontal
    const eyeDeltaY = rightEyeOuter.y - leftEyeOuter.y;
    const eyeDeltaX = rightEyeOuter.x - leftEyeOuter.x;
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI); // degrees

    return {
        yaw: yaw,
        pitch: pitch + depthPitch * 0.3,
        roll: roll,
        faceWidth: faceWidth,
        faceHeight: faceHeight
    };
}

function renderProctoring(results) {
    const canvas = document.getElementById('monitoring-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const alertEl = document.getElementById('active-alert');
    const fpsEl = document.getElementById('monitoring-fps');
    let alertState = false;
    let alertType = "";

    // Thresholds - tuned for exam proctoring
    const YAW_THRESHOLD = 0.55;         // Quay trái/phải (nhìn bài bạn)
    const YAW_EXTREME = 0.85;           // Quay đầu cực mạnh (nhìn ra sau)
    const PITCH_UP_THRESHOLD = 0.5;     // Ngẩng đầu nhìn lên trời
    const PITCH_DOWN_THRESHOLD = -0.8;  // Cúi đầu quá mức (nhìn xuống bàn)
    const ROLL_THRESHOLD = 20;          // Nghiêng đầu bất thường (degrees)

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        // Reset no face count
        window._noFaceFrameCount = 0;

        const landmarks = results.multiFaceLandmarks[0];
        const pose = calculateHeadPose(landmarks);

        // Smooth the values
        smoothYaw = smoothYaw * (1 - SMOOTH_FACTOR) + pose.yaw * SMOOTH_FACTOR;
        smoothPitch = smoothPitch * (1 - SMOOTH_FACTOR) + pose.pitch * SMOOTH_FACTOR;
        smoothRoll = smoothRoll * (1 - SMOOTH_FACTOR) + pose.roll * SMOOTH_FACTOR;

        // === DETECTION LOGIC ===
        const absYaw = Math.abs(smoothYaw);
        const absRoll = Math.abs(smoothRoll);

        if (absYaw > YAW_EXTREME) {
            // Extreme turn - looking behind
            alertState = true;
            alertType = "QUAY ĐẦU RA SAU";
        } else if (absYaw > YAW_THRESHOLD) {
            // Moderate turn - looking at neighbor's paper
            alertState = true;
            alertType = smoothYaw > 0 ? "QUAY ĐẦU SANG PHẢI" : "QUAY ĐẦU SANG TRÁI";
        } else if (smoothPitch > PITCH_UP_THRESHOLD) {
            // Looking up at ceiling
            alertState = true;
            alertType = "NGẨNG ĐẦU NHÌN LÊN";
        } else if (smoothPitch < PITCH_DOWN_THRESHOLD) {
            // Looking down excessively (could be looking at phone under desk)
            alertState = true;
            alertType = "CÚI ĐẦU QUÁ THẤP";
        } else if (absRoll > ROLL_THRESHOLD) {
            // Tilting head abnormally (trying to see neighbor's paper from the side)
            alertState = true;
            alertType = "NGHIÊNG ĐẦU BẤT THƯỜNG";
        }

        // Alert Smoothing (Debounce) - only alert if sustained for multiple frames
        if (alertState) {
            window._alertFrameCount = (window._alertFrameCount || 0) + 1;
        } else {
            window._alertFrameCount = Math.max(0, (window._alertFrameCount || 0) - 2); // Decay faster
        }

        // Only actually alert if sustained for 8 frames (~250ms at 30fps)
        const isActuallyAlerting = (window._alertFrameCount > 8);
        const color = isActuallyAlerting ? '#ef4444' : '#00ff88';

        // 1. Calculate Dynamic Bounding Box from Landmarks
        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        landmarks.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        });

        const padding = 0.05;
        const x = (minX - padding) * canvas.width;
        const y = (minY - padding * 2) * canvas.height;
        const w = (maxX - minX + padding * 2) * canvas.width;
        const h = (maxY - minY + padding * 3) * canvas.height;

        // Draw bounding box with corner brackets (YOLO-style)
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        // Main box
        ctx.strokeRect(x, y, w, h);
        
        // Corner brackets for professional look
        const cornerLen = Math.min(w, h) * 0.15;
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        
        // Top-left corner
        ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
        // Top-right corner
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
        // Bottom-left corner
        ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke();
        // Bottom-right corner
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke();

        // 2. YOLO Label Style
        ctx.font = 'bold 13px Inter, Be Vietnam Pro, sans-serif';
        const label = isActuallyAlerting ? `⚠ ${alertType}` : "✓ TRACKING: OK";
        const tw = ctx.measureText(label).width;
        
        // Label background
        ctx.fillStyle = color;
        const labelH = 24;
        const labelY = y - labelH - 2;
        ctx.fillRect(x, labelY, tw + 16, labelH);
        
        // Label text
        ctx.fillStyle = isActuallyAlerting ? '#ffffff' : '#000000';
        ctx.fillText(label, x + 8, labelY + 16);

        // 3. Mini pose indicators (bottom of box)
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const poseText = `Y:${smoothYaw.toFixed(2)} P:${smoothPitch.toFixed(2)} R:${smoothRoll.toFixed(1)}°`;
        
        // Pose info background
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const ptw = ctx.measureText(poseText).width;
        ctx.fillRect(x, y + h + 4, ptw + 10, 16);
        ctx.fillStyle = color;
        ctx.fillText(poseText, x + 5, y + h + 15);

        // Update HUD FPS indicator
        if (fpsEl) {
            if (isActuallyAlerting) {
                fpsEl.textContent = `POSE: ${alertType}`;
                fpsEl.className = 'badge bg-danger bg-opacity-75 text-white';
            } else {
                fpsEl.textContent = 'POSE: OK';
                fpsEl.className = 'badge bg-success bg-opacity-50 text-white';
            }
        }

        // Log incident if alert persists
        if (isActuallyAlerting && Date.now() - lastAlertTime > 4000) {
            lastAlertTime = Date.now();
            addMonitoringIncident(alertType);
            playMonitoringAlert();
        }

        if (alertEl) alertEl.style.display = isActuallyAlerting ? 'flex' : 'none';
    } else {
        // No Face Found - Debounce this too
        window._noFaceFrameCount = (window._noFaceFrameCount || 0) + 1;
        
        if (window._noFaceFrameCount > 15) {
            if (alertEl) alertEl.style.display = 'flex';
            
            // Draw warning overlay
            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 22px Inter, Be Vietnam Pro, sans-serif';
            const msg = "⚠ KHÔNG TÌM THẤY THÍ SINH";
            const msgW = ctx.measureText(msg).width;
            ctx.fillText(msg, (canvas.width - msgW) / 2, canvas.height / 2 - 10);
            
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
            const sub = "Thí sinh có thể đã rời vị trí hoặc quay hoàn toàn ra sau";
            const subW = ctx.measureText(sub).width;
            ctx.fillText(sub, (canvas.width - subW) / 2, canvas.height / 2 + 20);

            if (fpsEl) {
                fpsEl.textContent = 'POSE: NO FACE';
                fpsEl.className = 'badge bg-danger bg-opacity-75 text-white';
            }
            
            if (Date.now() - lastAlertTime > 5000) {
                lastAlertTime = Date.now();
                addMonitoringIncident("RỜI VỊ TRÍ / KHÔNG THẤY MẶT");
            }
        }
    }
}

function stopMonitoring() {
    isMonitoring = false;
    const video = document.getElementById('monitoring-video');
    const placeholder = document.getElementById('monitoring-placeholder');
    const startBtn = document.getElementById('btn-start-monitoring');
    const stopBtn = document.getElementById('btn-stop-monitoring');

    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
    }
    
    if (video) video.style.display = 'none';
    const canvas = document.getElementById('monitoring-canvas');
    if (canvas) canvas.style.display = 'none';
    if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.classList.remove('d-none');
    }
    if (startBtn) startBtn.style.display = 'block';
    if (stopBtn) stopBtn.style.display = 'none';
    
    const statusEl = document.getElementById('monitoring-status');
    if (statusEl) statusEl.textContent = 'Status: Standby';

    const fpsEl = document.getElementById('monitoring-fps');
    if (fpsEl) {
        fpsEl.textContent = 'POSE: OK';
        fpsEl.className = 'badge bg-dark bg-opacity-50 text-white';
    }

    // Reset smoothed values
    smoothYaw = 0;
    smoothPitch = 0;
    smoothRoll = 0;
}

function addMonitoringIncident(type) {
    const list = document.getElementById('incident-list');
    const noIncidents = document.getElementById('no-incidents');
    if (!list) return;
    if (noIncidents) noIncidents.style.display = 'none';
    
    // Determine severity icon
    const severityMap = {
        "QUAY ĐẦU RA SAU": { icon: "fa-arrows-rotate", level: "danger" },
        "QUAY ĐẦU SANG PHẢI": { icon: "fa-arrow-right", level: "warning" },
        "QUAY ĐẦU SANG TRÁI": { icon: "fa-arrow-left", level: "warning" },
        "NGẨNG ĐẦU NHÌN LÊN": { icon: "fa-arrow-up", level: "warning" },
        "CÚI ĐẦU QUÁ THẤP": { icon: "fa-arrow-down", level: "info" },
        "NGHIÊNG ĐẦU BẤT THƯỜNG": { icon: "fa-rotate", level: "warning" },
        "RỜI VỊ TRÍ / KHÔNG THẤY MẶT": { icon: "fa-user-slash", level: "danger" }
    };
    const info = severityMap[type] || { icon: "fa-exclamation", level: "warning" };
    
    const card = document.createElement('div');
    card.className = 'incident-card';
    card.innerHTML = `
        <div class="d-flex align-items-center gap-2 mb-1">
            <i class="fa-solid ${info.icon} text-${info.level}"></i>
            <span class="badge bg-${info.level} bg-opacity-10 text-${info.level} fw-bold">${type}</span>
        </div>
        <div class="small text-slate-400"><i class="fa-regular fa-clock me-1"></i>${new Date().toLocaleTimeString('vi-VN')}</div>
    `;
    card.style.animation = 'fadeIn 0.3s ease';
    list.prepend(card);
}

function clearIncidentLog() {
    const list = document.getElementById('incident-list');
    if (list) list.innerHTML = '';
    const noIncidents = document.getElementById('no-incidents');
    if (noIncidents) noIncidents.style.display = 'block';
}

function playMonitoringAlert() {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch(e) {}
}
