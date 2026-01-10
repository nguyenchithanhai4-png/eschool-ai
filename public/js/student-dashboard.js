/**
 * Student Dashboard Logic - Clean Version
 */

document.addEventListener('DOMContentLoaded', () => {
    initUser();
    setupNavigation();
    setupTrafficFeature();
});

// --- User Management ---
function initUser() {
    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) {
            window.location.href = '/login.html';
            return;
        }
        const user = JSON.parse(userJson);

        // Update Sidebar
        document.querySelectorAll('.user-name, #u-name').forEach(el => el.textContent = user.fullname || 'Học sinh');

        // Avatar
        const avatarUrl = user.avatar || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/icons/person-circle.svg';
        document.querySelectorAll('.user-avatar, #sidebar-avatar').forEach(el => {
            el.style.backgroundImage = `url('${avatarUrl}')`;
            el.style.backgroundSize = 'cover';
            el.innerHTML = '';
        });

    } catch (e) {
        console.error('Error loading user:', e);
        window.location.href = '/login.html';
    }
}

// --- Navigation ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Sidebar Active State
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show Section
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                sections.forEach(sec => sec.classList.remove('active'));
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    // Special layout for traffic view if needed
                    if (targetId === 'view-traffic') {
                        const trafficView = document.getElementById('traffic-view');
                        if (trafficView) trafficView.style.display = 'flex';
                    }
                }
            }
        });
    });
}

// --- Traffic Feature ---
function setupTrafficFeature() {
    // Re-bind global function for HTML onclick attributes
    window.checkTrafficFinePage = async function () {
        // Logic same as teacher, can be modularized
        const plateInput = document.getElementById('traffic-plate-page') || document.getElementById('traffic-plate-input');
        const resultDiv = document.getElementById('traffic-result-page') || document.getElementById('traffic-result');
        const btn = document.getElementById('btn-check-traffic-page') || document.getElementById('btn-check-traffic');

        if (!plateInput || !plateInput.value.trim()) {
            alert('Vui lòng nhập biển số xe!');
            return;
        }

        const plate = plateInput.value.trim().toUpperCase();

        // UI Loading
        if (btn) btn.disabled = true;

        try {
            const response = await fetch('/api/traffic-lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plate: plate })
            });
            const data = await response.json();

            // Simple Alert or Result Injection
            if (data.success && data.violations && data.violations.length > 0) {
                alert(`Tìm thấy ${data.violations.length} lỗi vi phạm! Kiểm tra chi tiết bên dưới.`);
                // Render logic here matches HTML structure
            } else {
                alert('Không tìm thấy lỗi vi phạm nào.');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi kết nối tra cứu.');
        } finally {
            if (btn) btn.disabled = false;
        }
    };
}

// --- Logout ---
window.logout = function () {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
};
