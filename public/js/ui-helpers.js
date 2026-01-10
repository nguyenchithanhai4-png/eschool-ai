
/**
 * UI Helpers for E-School AI
 * Provides custom Toast notifications and Confirm dialogs
 * Replacing native alert() and confirm()
 */

// === POPUP NOTIFICATION SYSTEM ===
function showPopup(message, type = 'success', autoClose = true) {
    const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation-triangle', info: 'fa-info' };
    const titles = { success: 'Thành công!', error: 'Lỗi!', warning: 'Chú ý!', info: 'Thông báo' };
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#6366f1' };

    // Remove existing popups to prevent stacking
    const existing = document.querySelectorAll('.custom-popup-overlay');
    existing.forEach(el => el.remove());

    const overlay = document.createElement('div');
    overlay.className = 'custom-popup-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:999999;animation: fadeIn 0.2s ease-out;';

    overlay.innerHTML = `
        <div style="background:rgba(30,30,50,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px 50px;text-align:center;min-width:300px;box-shadow: 0 20px 50px rgba(0,0,0,0.5);transform: scale(0.9);animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
            <div style="width:70px;height:70px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:${colors[type]}20;border:2px solid ${colors[type]}80;color:${colors[type]};">
                <i class="fa-solid ${icons[type]}"></i>
            </div>
            <div style="font-size:1.3rem;font-weight:700;margin-bottom:10px;color:white;">${titles[type]}</div>
            <div style="font-size:1rem;opacity:0.8;margin-bottom:25px;color:white;line-height:1.5;">${message}</div>
            <button class="popup-btn" style="padding:12px 40px;border-radius:12px;border:none;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);transition: transform 0.2s;">OK</button>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .popup-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6) !important; }
            .popup-btn:active { transform: translateY(0); }
        </style>
    `;

    document.body.appendChild(overlay);

    const close = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('.popup-btn').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    if (autoClose && type !== 'error') setTimeout(close, 2500);
}

const toast = {
    success: (msg) => showPopup(msg, 'success'),
    error: (msg) => showPopup(msg, 'error', false), // Errors should be acknowledged
    warning: (msg) => showPopup(msg, 'warning', false),
    info: (msg) => showPopup(msg, 'info')
};

// === CONFIRM DIALOG (Beautiful Replacement for confirm()) ===
// Usage: if (await showConfirm('Are you sure?')) { ... }
function showConfirm(message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
    return new Promise((resolve) => {
        // Remove existing overlays
        const existing = document.querySelectorAll('.custom-confirm-overlay');
        existing.forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:999999;animation: fadeIn 0.2s ease-out;';

        overlay.innerHTML = `
            <div style="background:rgba(30,30,50,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px 50px;text-align:center;min-width:320px;box-shadow: 0 20px 50px rgba(0,0,0,0.5);transform: scale(0.9);animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
                <div style="width:70px;height:70px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f59e0b20;border:2px solid #f59e0b80;color:#f59e0b;">
                    <i class="fa-solid fa-question"></i>
                </div>
                <div style="font-size:1.3rem;font-weight:700;margin-bottom:10px;color:white;">Xác nhận</div>
                <div style="font-size:1rem;opacity:0.8;margin-bottom:25px;color:white;line-height:1.5;">${message}</div>
                <div style="display:flex;gap:15px;justify-content:center;">
                    <button class="btn-cancel" style="padding:12px 30px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);font-weight:600;cursor:pointer;background:transparent;color:white;transition: all 0.2s;">${cancelText}</button>
                    <button class="btn-confirm" style="padding:12px 30px;border-radius:12px;border:none;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);transition: all 0.2s;">${confirmText}</button>
                </div>
            </div>
            <style>
                .btn-cancel:hover { background: rgba(255,255,255,0.1) !important; }
                .btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6) !important; }
                .btn-confirm:active { transform: translateY(0); }
            </style>
        `;

        document.body.appendChild(overlay);

        const close = (val) => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                resolve(val);
            }, 200);
        };

        overlay.querySelector('.btn-cancel').onclick = () => close(false);
        overlay.querySelector('.btn-confirm').onclick = () => close(true);
        overlay.onclick = (e) => { if (e.target === overlay) close(false); };

        // Escape key support
        const onKey = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', onKey);
                close(false);
            }
        };
        document.addEventListener('keydown', onKey);
    });
}
