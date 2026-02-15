// Driver install app banner – shown once per driver on mobile with OS-specific install link / steps.
// Wrapped in try/catch so Tracking Prevention / storage block does not break the app.
(function () {
    const STORAGE_KEY = 'driver_install_banner_dismissed';
    const SHOW_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    function isMobile() {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent || '';
        const w = typeof window !== 'undefined' ? window.innerWidth : 0;
        return /Android|iPhone|iPad|iPod|webOS|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)
            || (navigator.maxTouchPoints > 0 && w <= 900)
            || w <= 480;
    }

    function isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    }

    function isAndroid() {
        return /Android/i.test(navigator.userAgent || '');
    }

    function getStorage() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage !== null) return localStorage;
        } catch (e) {}
        return null;
    }

    function shouldShowBanner() {
        var storage = getStorage();
        try {
            if (!storage) return true;
            const raw = storage.getItem(STORAGE_KEY);
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
        var storage = getStorage();
        try {
            if (storage) storage.setItem(STORAGE_KEY, forever ? 'forever' : String(Date.now()));
        } catch (e) {}
    }

    let deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredInstallPrompt = e;
    });

    function showBanner(forceShow) {
        const user = typeof authManager !== 'undefined' && authManager && typeof authManager.getCurrentUser === 'function' ? authManager.getCurrentUser() : null;
        if (!user || user.type !== 'driver') return;
        if (!forceShow && !isMobile()) return;
        if (!forceShow && !shouldShowBanner()) return;
        if (document.getElementById('driverInstallBanner')) return;

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
        var linkBlock = appUrl ? ('<p style="margin:0 0 12px;font-size:0.85rem;"><strong>App link:</strong><br><a id="driverInstallBannerUrl" href="' + appUrl + '" target="_blank" rel="noopener" style="color:#1e3a5f;word-break:break-all;">' + appUrl + '</a><br><button type="button" id="driverInstallBannerCopy" style="margin-top:6px;padding:6px 12px;border:1px solid #1e3a5f;border-radius:6px;background:#fff;color:#1e3a5f;cursor:pointer;font-size:0.85rem;">Copy link</button></p>') : '';
        wrap.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:360px;width:100%;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">' +
            '<h3 style="margin:0 0 12px;font-size:1.25rem;">' + title + '</h3>' +
            '<p style="margin:0 0 12px;color:#444;font-size:0.95rem;line-height:1.5;">' + body + '</p>' +
            linkBlock +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" id="driverInstallBannerPrimary" style="flex:1;min-width:120px;padding:12px 16px;border:none;border-radius:8px;background:#1e3a5f;color:#fff;font-weight:600;cursor:pointer;font-size:1rem;">' + primaryLabel + '</button>' +
            '<button type="button" id="driverInstallBannerLater" style="padding:12px 16px;border:1px solid #ccc;border-radius:8px;background:#fff;color:#555;cursor:pointer;font-size:0.95rem;">Not now</button>' +
            '<button type="button" id="driverInstallBannerDismiss" style="padding:12px 16px;border:none;background:transparent;color:#888;cursor:pointer;font-size:0.85rem;">Don\'t show again</button>' +
            '</div></div>';

        document.body.appendChild(wrap);

        const primaryBtn = document.getElementById('driverInstallBannerPrimary');
        const laterBtn = document.getElementById('driverInstallBannerLater');
        const dismissBtn = document.getElementById('driverInstallBannerDismiss');
        const copyBtn = document.getElementById('driverInstallBannerCopy');
        if (copyBtn && appUrl) {
            copyBtn.addEventListener('click', function () {
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(appUrl);
                        copyBtn.textContent = 'Copied!';
                        setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 2000);
                    } else {
                        var inp = document.createElement('input');
                        inp.value = appUrl;
                        document.body.appendChild(inp);
                        inp.select();
                        document.execCommand('copy');
                        document.body.removeChild(inp);
                        copyBtn.textContent = 'Copied!';
                        setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 2000);
                    }
                } catch (err) {}
            });
        }

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

    function fallbackOpenAppUrl() {
        var url = (typeof location !== 'undefined' && location.origin) ? (location.origin + (location.pathname || '/')) : '';
        if (url) window.open(url, '_blank');
    }

    try {
        window.showDriverInstallAppBanner = showBanner;
    } catch (e) {
        window.showDriverInstallAppBanner = fallbackOpenAppUrl;
    }

    function initDriverMoreAppLink() {
        var url = (typeof location !== 'undefined' && location.origin) ? (location.origin + (location.pathname || '/')) : '';
        var link = document.getElementById('driverMoreAppUrl');
        var copyBtn = document.getElementById('driverMoreCopyUrl');
        if (link && url) { link.href = url; link.textContent = url; }
        if (copyBtn && url) {
            copyBtn.addEventListener('click', function () {
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(url);
                        copyBtn.textContent = 'Copied!';
                        setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 2000);
                    } else {
                        var inp = document.createElement('input');
                        inp.value = url;
                        document.body.appendChild(inp);
                        inp.select();
                        document.execCommand('copy');
                        document.body.removeChild(inp);
                        copyBtn.textContent = 'Copied!';
                        setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 2000);
                    }
                } catch (err) {}
            });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDriverMoreAppLink);
    } else {
        initDriverMoreAppLink();
    }
})();
