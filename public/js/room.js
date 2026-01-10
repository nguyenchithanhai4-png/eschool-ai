/**
 * E-School AI - Video Room Module
 * Jitsi Meet Embedded - Skip lobby on create
 */

const VideoRoom = (function () {
    // ===== STATE =====
    let jitsiApi = null;
    let currentRoomId = null;
    let isInRoom = false;
    let jitsiLoadingToastShown = false;

    // ===== JITSI SERVER =====
    const JITSI_DOMAIN = 'meet.element.io';

    // ===== CHECK IF API LOADED =====
    function isJitsiLoaded() {
        return typeof JitsiMeetExternalAPI !== 'undefined';
    }

    // ===== INITIALIZE =====
    function init() {
        console.log('[VideoRoom] Module initialized');
        createRoomOverlay();
    }

    // ===== GENERATE ROOM CODE =====
    function generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // ===== CREATE OVERLAY =====
    function createRoomOverlay() {
        if (document.getElementById('video-room-overlay')) {
            return document.getElementById('video-room-overlay');
        }

        const overlay = document.createElement('div');
        overlay.id = 'video-room-overlay';
        overlay.className = 'video-room-overlay';
        overlay.innerHTML = `
            <div class="prejoin-lobby" id="prejoinLobby">
                <div class="prejoin-card">
                    <div class="prejoin-logo">
                        <span class="material-icons" style="font-size: 56px; color: #8ab4f8;">video_call</span>
                    </div>
                    <h2 class="prejoin-title">Tham Gia Phòng Họp</h2>
                    <p class="prejoin-subtitle">Nhập mã phòng để tham gia</p>
                    
                    <div class="prejoin-room-code" id="prejoinRoomCode">------</div>
                    
                    <div class="prejoin-input-group">
                        <label>Tên hiển thị</label>
                        <input type="text" id="prejoinDisplayName" class="prejoin-input" 
                               placeholder="Nhập tên của bạn...">
                    </div>
                    
                    <button class="prejoin-join-btn" onclick="VideoRoom.joinRoom()">
                        <span class="material-icons">video_call</span>
                        Tham gia cuộc họp
                    </button>
                    
                    <button class="prejoin-back-btn" onclick="VideoRoom.closeLobby()">
                        <span class="material-icons" style="font-size: 16px;">arrow_back</span>
                        Quay lại
                    </button>
                </div>
            </div>
            
            <div class="jitsi-container" id="jitsiContainer" style="display: none;">
                <div class="jitsi-header">
                    <div class="jitsi-room-info">
                        <span class="material-icons">video_call</span>
                        <span id="jitsiRoomName">E-School AI Meeting</span>
                    </div>
                    <button class="jitsi-leave-btn" onclick="VideoRoom.leaveRoom()">
                        <span class="material-icons">call_end</span>
                        Rời phòng
                    </button>
                </div>
                <div id="jitsiMeet" style="flex: 1; width: 100%;"></div>
            </div>
            
            <div class="room-toast-container" id="roomToastContainer"></div>
        `;

        document.body.appendChild(overlay);

        const savedName = localStorage.getItem('eschool_display_name') || '';
        const nameInput = overlay.querySelector('#prejoinDisplayName');
        if (nameInput && savedName) nameInput.value = savedName;

        return overlay;
    }

    // ===== OPEN LOBBY (for joining existing room) =====
    function openLobby(roomCode) {
        currentRoomId = roomCode;
        console.log('[VideoRoom] Opening lobby:', currentRoomId);

        const overlay = document.getElementById('video-room-overlay') || createRoomOverlay();
        overlay.classList.add('active');
        document.getElementById('prejoinLobby').style.display = 'flex';
        document.getElementById('jitsiContainer').style.display = 'none';
        document.getElementById('prejoinRoomCode').textContent = currentRoomId;
    }

    // ===== CREATE ROOM (skip lobby, join directly) =====
    function createRoom() {
        currentRoomId = generateRoomCode();
        console.log('[VideoRoom] Creating room directly:', currentRoomId);

        const displayName = localStorage.getItem('eschool_display_name') || 'Giáo viên';

        // Show overlay and Jitsi container directly
        const overlay = document.getElementById('video-room-overlay') || createRoomOverlay();
        overlay.classList.add('active');
        document.getElementById('prejoinLobby').style.display = 'none';
        document.getElementById('jitsiContainer').style.display = 'flex';
        document.getElementById('jitsiRoomName').textContent = `Phòng: ${currentRoomId}`;

        isInRoom = true;
        startJitsi(currentRoomId, displayName);
    }

    // ===== JOIN ROOM (from lobby) =====
    function joinRoom() {
        if (!currentRoomId) return;

        if (!isJitsiLoaded()) {
            if (!jitsiLoadingToastShown) {
                showToast('Đang tải Jitsi, vui lòng đợi...', 'info');
                jitsiLoadingToastShown = true;
            }
            setTimeout(() => joinRoom(), 1000);
            return;
        }
        jitsiLoadingToastShown = false;

        const nameInput = document.getElementById('prejoinDisplayName');
        const displayName = nameInput?.value?.trim() || 'Người tham gia';
        localStorage.setItem('eschool_display_name', displayName);

        console.log('[VideoRoom] Joining room:', currentRoomId, 'as:', displayName);
        isInRoom = true;

        document.getElementById('prejoinLobby').style.display = 'none';
        document.getElementById('jitsiContainer').style.display = 'flex';
        document.getElementById('jitsiRoomName').textContent = `Phòng: ${currentRoomId}`;

        startJitsi(currentRoomId, displayName);
    }

    // ===== START JITSI =====
    function startJitsi(roomId, displayName) {
        if (!isJitsiLoaded()) {
            if (!jitsiLoadingToastShown) {
                showToast('Đang tải Jitsi...', 'info');
                jitsiLoadingToastShown = true;
            }
            setTimeout(() => startJitsi(roomId, displayName), 1000);
            return;
        }
        jitsiLoadingToastShown = false;

        const jitsiRoomName = `ESchoolAI${roomId}`;

        try {
            jitsiApi = new JitsiMeetExternalAPI(JITSI_DOMAIN, {
                roomName: jitsiRoomName,
                parentNode: document.getElementById('jitsiMeet'),
                width: '100%',
                height: '100%',
                userInfo: {
                    displayName: displayName
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    enableWelcomePage: false,
                    enableClosePage: false,
                    resolution: 720
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'chat', 'raisehand',
                        'videoquality', 'tileview', 'settings'
                    ],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    DEFAULT_BACKGROUND: '#1a1a2e',
                    MOBILE_APP_PROMO: false,
                    HIDE_INVITE_MORE_HEADER: true
                }
            });

            jitsiApi.addListener('videoConferenceJoined', () => {
                console.log('[VideoRoom] Joined conference');
                showToast('Đã vào phòng họp!', 'success');
            });

            jitsiApi.addListener('readyToClose', () => {
                leaveRoom();
            });

        } catch (err) {
            console.error('[VideoRoom] Error:', err);
            showToast('Lỗi kết nối: ' + err.message, 'error');
            leaveRoom();
        }
    }

    // ===== LEAVE ROOM =====
    function leaveRoom() {
        console.log('[VideoRoom] Leaving room');
        isInRoom = false;

        if (jitsiApi) {
            jitsiApi.dispose();
            jitsiApi = null;
        }

        const jitsiMeet = document.getElementById('jitsiMeet');
        if (jitsiMeet) jitsiMeet.innerHTML = '';

        const overlay = document.getElementById('video-room-overlay');
        if (overlay) overlay.classList.remove('active');

        currentRoomId = null;
    }

    // ===== CLOSE LOBBY =====
    function closeLobby() {
        const overlay = document.getElementById('video-room-overlay');
        if (overlay) overlay.classList.remove('active');
        currentRoomId = null;
    }

    // ===== SHOW TOAST =====
    function showToast(message, type = 'info') {
        const container = document.getElementById('roomToastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `room-toast ${type}`;

        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';

        toast.innerHTML = `<span class="material-icons" style="font-size: 18px;">${icon}</span> ${message}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== PUBLIC API =====
    return {
        init,
        createRoom,
        openLobby,
        closeLobby,
        joinRoom,
        leaveRoom
    };
})();

document.addEventListener('DOMContentLoaded', () => VideoRoom.init());
