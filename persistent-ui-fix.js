// Persistent UI Fix - Ensures fixes stay applied on navigation (throttled to avoid console spam)
(function() {
    'use strict';
    let _lastApply = 0;
    const THROTTLE_MS = 5000;
    const _log = typeof window !== 'undefined' && window.location && window.location.search.indexOf('debug=ui') !== -1;

    function forceApplyIconCentering() {
        const now = Date.now();
        if (now - _lastApply < THROTTLE_MS) return;
        _lastApply = now;

        const iconContainers = document.querySelectorAll(
            '.stat-icon, .metric-icon, .ai-module-icon, .status-stat-icon, ' +
            '[class*="stat-icon"], [class*="metric-icon"]'
        );
        iconContainers.forEach(icon => {
            icon.style.setProperty('display', 'flex', 'important');
            icon.style.setProperty('align-items', 'center', 'important');
            icon.style.setProperty('justify-content', 'center', 'important');
            if (!icon.style.margin || icon.style.margin === '') {
                icon.style.setProperty('margin-left', 'auto', 'important');
                icon.style.setProperty('margin-right', 'auto', 'important');
            }
        });

        const cards = document.querySelectorAll(
            '.fleet-stat-card, .dashboard-metric-card, .analytics-metric-card, .status-stat-card'
        );
        cards.forEach(card => {
            card.style.setProperty('text-align', 'center', 'important');
            card.style.setProperty('display', 'flex', 'important');
            card.style.setProperty('flex-direction', 'column', 'important');
            card.style.setProperty('align-items', 'center', 'important');
        });

        if (_log) console.log('✅ Persistent UI Fix applied to', iconContainers.length, 'icons');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceApplyIconCentering);
    } else {
        forceApplyIconCentering();
    }
    window.addEventListener('load', () => {
        forceApplyIconCentering();
        if (typeof applyNumberFormattingToPage === 'function') applyNumberFormattingToPage();
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setTimeout(forceApplyIconCentering, 100);
    });

    let _observerScheduled = false;
    const persistentUIObserver = new MutationObserver(() => {
        if (_observerScheduled) return;
        _observerScheduled = true;
        setTimeout(() => {
            _observerScheduled = false;
            forceApplyIconCentering();
        }, 300);
    });

    if (document.body) {
        persistentUIObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            if (document.body) persistentUIObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        });
    }
})();
