// freeze-detector.js – main thread pong responder; worker detects freezes and reports to server.
(function () {
    if (typeof Worker === 'undefined') return;
    var worker;
    try {
        worker = new Worker('freeze-detector-worker.js');
    } catch (e) {
        return;
    }
    function sendVisibility() {
        if (worker && typeof document !== 'undefined') {
            worker.postMessage({ type: 'visibility', visibility: document.hidden ? 'hidden' : 'visible' });
        }
    }
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', sendVisibility);
    }
    worker.onmessage = function (e) {
        var d = e && e.data;
        if (d && d.type === 'ping') {
            var user = (typeof authManager !== 'undefined' && authManager && typeof authManager.getCurrentUser === 'function')
                ? authManager.getCurrentUser() : null;
            worker.postMessage({
                type: 'pong',
                visibility: typeof document !== 'undefined' && document.hidden ? 'hidden' : 'visible',
                userId: user ? (user.id || '') : '',
                userType: user ? (user.type || '') : '',
                userName: user ? (user.name || '') : '',
                url: typeof location !== 'undefined' ? location.href : '',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
            });
        }
    };
    worker.onerror = function () {};
})();
