// freeze-detector-worker.js – runs off the main thread; if main thread stops responding, report to server.
// Lets the server (e.g. Render logs) see the main reason behind client freezes.

const PING_INTERVAL_MS = 5000;
const FREEZE_THRESHOLD_MS = 25000;
const REPORT_COOLDOWN_MS = 60000;
let lastPongAt = 0;
let lastReportAt = 0;
let pingTimer = null;
let lastPayload = {};

function getApiUrl() {
    try {
        const base = self.location.origin;
        return base + '/api/client-health';
    } catch (_) {
        return '/api/client-health';
    }
}

function sendFreezeReport(reason) {
    const url = getApiUrl();
    const body = JSON.stringify({
        reason,
        lastPongAt: lastPongAt ? new Date(lastPongAt).toISOString() : null,
        detectedAt: new Date().toISOString(),
        visibility: lastPayload.visibility,
        userId: lastPayload.userId,
        userType: lastPayload.userType,
        userName: lastPayload.userName,
        url: lastPayload.url || (typeof self.location !== 'undefined' ? self.location.href : ''),
        userAgent: lastPayload.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        context: Object.assign({ source: 'freeze_detector_worker' }, lastPayload.context || {})
    });
    try {
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true
        }).catch(() => {});
    } catch (_) {}
}

function checkFreeze() {
    const now = Date.now();
    if (lastPongAt > 0 && (now - lastPongAt) >= FREEZE_THRESHOLD_MS) {
        if (lastPayload.visibility !== 'hidden' && (now - lastReportAt) >= REPORT_COOLDOWN_MS) {
            lastReportAt = now;
            sendFreezeReport('main_thread_freeze');
        }
        lastPongAt = now;
    }
    pingTimer = self.setTimeout(schedulePing, PING_INTERVAL_MS);
}

function schedulePing() {
    self.postMessage({ type: 'ping', t: Date.now() });
    checkFreeze();
}

self.onmessage = function (e) {
    const d = e && e.data;
    if (d && d.type === 'pong') {
        lastPongAt = Date.now();
        if (d.visibility !== undefined) lastPayload.visibility = d.visibility;
        if (d.userId !== undefined) lastPayload.userId = d.userId;
        if (d.userType !== undefined) lastPayload.userType = d.userType;
        if (d.userName !== undefined) lastPayload.userName = d.userName;
        if (d.url !== undefined) lastPayload.url = d.url;
        if (d.userAgent !== undefined) lastPayload.userAgent = d.userAgent;
        if (d.context) lastPayload.context = d.context;
    } else if (d && d.type === 'visibility' && d.visibility !== undefined) {
        lastPayload.visibility = d.visibility;
    }
};

self.onmessageerror = function () {};

schedulePing();
