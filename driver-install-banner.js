// Driver install app banner – shown once per driver on mobile with OS-specific install link / steps.
(function () {
    const STORAGE_KEY = 'driver_install_banner_dismissed';
    const SHOW_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    function isMobile() {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent || '';
        return /Android|iPhone|iPad|iPod|webOS|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (navigator.maxTouchPoints > 0 && window.innerWidth <= 900);
    }

    function isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    }

    function isAndroid() {
        return /Android/i.test(navigator.userAgent || '');
    }

    function shouldShowBanner() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return true;
            const n = parseInt(raw, 10);
            if (!isNaN(n)) return Date.now() - n > SHOW_AGAIN_AFTER_MS;
            if (raw === 'forever') return false;
            return true;
        } catch (e) {
            return true;
        }
    }

    function setDismissed(forever) {
        try {
            localStorage.setItem(STORAGE_KEY, forever ? 'forever' : String(Date.now()));
        } catch (e) {}
    }

    let deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredInstallPrompt = e;
    });

    function showBanner() {
        if (!isMobile()) return;
        const user = typeof authManager !== 'undefined' && authManager && typeof authManager.getCurrentUser === 'function' ? authManager.getCurrentUser() : null;
        if (!user || user.type !== 'driver') return;
        if (!shouldShowBanner()) return;

        const isIos = isIOS();
        const isAndroidDevice = isAndroid();
        const appUrl = typeof location !== 'undefined' ? (location.origin + (location.pathname || '/')) : '';

        const title = 'Get the app';
        const androidBody = 'Install the Autonautics app for a better experience: fewer freezes and faster chat. Tap Install below.';
        const iosBody = 'Add Autonautics to your Home Screen for a better experience: open the link below in Safari, then tap Share → "Add to Home Screen".';
        const genericBody = 'Install the app for a better experience on your phone.';

        let body = genericBody;
        let primaryLabel = 'How to install';
        let primaryHref = appUrl;
        let usePrimaryButtonAsLink = true;

        if (isAndroidDevice && deferredInstallPrompt) {
            body = androidBody;
            primaryLabel = 'Install app';
            usePrimaryButtonAsLink = false;
        } else if (isAndroidDevice) {
            body = androidBody + ' Open this page in Chrome and use the browser menu (⋮) → "Install app" or "Add to Home screen".';
            primaryLabel = 'Open in Chrome';
            primaryHref = appUrl;
        } else if (isIos) {
            body = 'Add Autonautics to your Home Screen for a better experience. In Safari: tap the Share button (□↑) at the bottom, then "Add to Home Screen". If you\'re in another browser, open this page in Safari first.';
            primaryLabel = 'Got it';
            primaryHref = appUrl;
            usePrimaryButtonAsLink = false;
        }

        const wrap = document.createElement('div');
        wrap.id = 'driverInstallBanner';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-label', title);
        wrap.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);padding:16px;box-sizing:border-box;';
        wrap.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:360px;width:100%;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">' +
            '<h3 style="margin:0 0 12px;font-size:1.25rem;">' + title + '</h3>' +
            '<p style="margin:0 0 20px;color:#444;font-size:0.95rem;line-height:1.5;">' + body + '</p>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" id="driverInstallBannerPrimary" style="flex:1;min-width:120px;padding:12px 16px;border:none;border-radius:8px;background:#1e3a5f;color:#fff;font-weight:600;cursor:pointer;font-size:1rem;">' + primaryLabel + '</button>' +
            '<button type="button" id="driverInstallBannerLater" style="padding:12px 16px;border:1px solid #ccc;border-radius:8px;background:#fff;color:#555;cursor:pointer;font-size:0.95rem;">Not now</button>' +
            '<button type="button" id="driverInstallBannerDismiss" style="padding:12px 16px;border:none;background:transparent;color:#888;cursor:pointer;font-size:0.85rem;">Don\'t show again</button>' +
            '</div></div>';

        document.body.appendChild(wrap);

        const primaryBtn = document.getElementById('driverInstallBannerPrimary');
        const laterBtn = document.getElementById('driverInstallBannerLater');
        const dismissBtn = document.getElementById('driverInstallBannerDismiss');

        function close() {
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        }

        primaryBtn.addEventListener('click', function () {
            if (!usePrimaryButtonAsLink && deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
                deferredInstallPrompt.userChoice.then(function (choice) {
                    if (choice.outcome === 'accepted') close();
                    deferredInstallPrompt = null;
                });
                close();
            } else if (usePrimaryButtonAsLink && primaryHref) {
                window.open(primaryHref, '_self');
                close();
            } else {
                close();
            }
        });

        laterBtn.addEventListener('click', function () {
            setDismissed(false);
            close();
        });

        dismissBtn.addEventListener('click', function () {
            setDismissed(true);
            close();
        });

        wrap.addEventListener('click', function (e) {
            if (e.target === wrap) {
                setDismissed(false);
                close();
            }
        });
    }

    window.showDriverInstallAppBanner = showBanner;
})();
