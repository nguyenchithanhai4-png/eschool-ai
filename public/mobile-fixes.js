/**
 * Mobile App Navigation Fixes for Capacitor WebView
 * This script fixes navigation issues in the Android APK
 */

(function () {
    'use strict';

    // Detect if running in Capacitor
    const isCapacitor = window.Capacitor !== undefined ||
        window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'http:' && window.location.hostname === 'localhost';

    // Fix viewport rendering on load
    function forceRepaint() {
        document.body.style.display = 'none';
        document.body.offsetHeight; // Force reflow
        document.body.style.display = '';

        // Scroll to trigger proper rendering
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 0), 50);
    }

    // Fix all navigation links to work properly in Capacitor
    function fixNavigationLinks() {
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');

            // Skip external links, anchors, and javascript
            if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
                href.startsWith('http://') || href.startsWith('https://')) {
                return;
            }

            // Fix relative paths for Capacitor
            link.addEventListener('click', function (e) {
                e.preventDefault();

                let targetPath = href;

                // Ensure path starts with /
                if (!targetPath.startsWith('/')) {
                    targetPath = '/' + targetPath;
                }

                // Add .html extension if missing
                if (!targetPath.includes('.html') && !targetPath.includes('.')) {
                    targetPath = targetPath + '.html';
                }

                // Navigate using window.location for Capacitor compatibility
                window.location.href = targetPath;
            });
        });
    }

    // Fix login/register form submissions
    function fixFormNavigation() {
        // Override any existing goToDashboard function
        window.goToDashboard = function (role, view) {
            let dashboardUrl = '/';

            if (role === 'student') {
                dashboardUrl = '/student-dashboard.html';
            } else if (role === 'teacher') {
                dashboardUrl = '/teacher-dashboard.html';
            } else if (role === 'admin' || role === 'system-admin') {
                dashboardUrl = '/system-admin.html';
            }

            if (view) {
                dashboardUrl += '#' + view;
            }

            window.location.href = dashboardUrl;
        };

        // Fix goToUserDashboard
        window.goToUserDashboard = function () {
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    const role = user.role || 'student';
                    window.goToDashboard(role);
                } catch (e) {
                    window.location.href = '/student-dashboard.html';
                }
            } else {
                window.location.href = '/login.html';
            }
        };
    }

    // Fix for initial viewport rendering
    function fixViewportRendering() {
        // Set viewport meta tag dynamically
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }

        // Force sections to be visible
        document.querySelectorAll('.view-section.active').forEach(section => {
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            section.style.display = 'block';
        });
    }

    // Initialize fixes
    function init() {
        fixViewportRendering();
        fixNavigationLinks();
        fixFormNavigation();

        // Delay repaint to ensure DOM is ready
        setTimeout(forceRepaint, 100);

        // Add resize handler for orientation changes
        window.addEventListener('resize', () => {
            setTimeout(forceRepaint, 200);
        });

        console.log('[MobileFix] Navigation and viewport fixes applied');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also run after load event for safety
    window.addEventListener('load', () => {
        setTimeout(forceRepaint, 300);
    });

})();
