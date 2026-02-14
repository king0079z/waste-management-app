// safe-storage.js - Run early so Tracking Prevention / storage block doesn't break the app.
// One in-memory fallback when localStorage is blocked; avoids repeated console errors.
(function () {
    try {
        var key = 'safe_storage_test';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        return;
    } catch (e) {
        if (e.name !== 'SecurityError' && e.code !== 18 && (e.message || '').indexOf('storage') === -1 && (e.message || '').indexOf('Tracking') === -1) return;
    }
    var store = Object.create(null);
    var safe = {
        getItem: function (k) { return store[k] != null ? String(store[k]) : null; },
        setItem: function (k, v) { store[k] = String(v); },
        removeItem: function (k) { delete store[k]; },
        clear: function () { store = Object.create(null); },
        key: function (i) { var keys = Object.keys(store); return keys[i] || null; },
        get length() { return Object.keys(store).length; }
    };
    try {
        Object.defineProperty(window, 'localStorage', { value: safe, configurable: true, writable: true });
    } catch (_) {
        window.localStorage = safe;
    }
})();
