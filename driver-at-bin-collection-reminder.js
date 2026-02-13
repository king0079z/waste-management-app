/**
 * Driver-at-Bin Auto-Collection
 * When GPS shows the driver was at a bin but they didn't tap "Mark as collected",
 * the system automatically registers the collection for this driver (assigned or ad-hoc).
 * - Only runs when a driver is logged in and location is available.
 * - Requires driver to have been near the bin for a short dwell (consecutive position checks).
 * - Cooldown per bin so we don't record the same bin twice.
 */
(function() {
    'use strict';

    const NEAR_BIN_KM = 0.05;
    const POSITION_HISTORY_SIZE = 3;
    const CHECK_INTERVAL_MS = 20000;
    const AUTO_RECORD_COOLDOWN_MS = 2 * 60 * 60 * 1000;
    const STORAGE_KEY = 'driverAtBin_';

    let positionHistory = [];
    let lastAutoRecordedForBin = {};
    let checkTimer = null;

    function getCurrentUser() {
        return typeof authManager !== 'undefined' && authManager.getCurrentUser ? authManager.getCurrentUser() : null;
    }

    function getDriverLocation(driverId) {
        if (typeof dataManager === 'undefined' || !dataManager.getDriverLocation) return null;
        return dataManager.getDriverLocation(driverId);
    }

    function getBins() {
        if (typeof dataManager === 'undefined' || !dataManager.getBins) return [];
        return dataManager.getBins();
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        if (typeof dataManager !== 'undefined' && dataManager.calculateDistance) {
            return dataManager.calculateDistance(lat1, lon1, lat2, lon2);
        }
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function wasDriverRecentlyAtBin(driverId, binId) {
        const collections = typeof dataManager !== 'undefined' && dataManager.getCollections ? dataManager.getCollections() : [];
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        return collections.some(function(c) {
            return c.driverId === driverId && c.binId === binId && new Date(c.timestamp).getTime() > cutoff;
        });
    }

    function wasAutoRecordedRecently(binId) {
        var key = STORAGE_KEY + binId;
        var val = lastAutoRecordedForBin[key] || parseInt(localStorage.getItem(key) || '0', 10);
        if (val && (Date.now() - val < AUTO_RECORD_COOLDOWN_MS)) return true;
        return false;
    }

    function setAutoRecorded(binId) {
        lastAutoRecordedForBin[STORAGE_KEY + binId] = Date.now();
        try { localStorage.setItem(STORAGE_KEY + binId, String(Date.now())); } catch (e) {}
    }

    function autoRecordCollection(bin, driverId) {
        if (wasAutoRecordedRecently(bin.id)) return;
        setAutoRecorded(bin.id);

        if (typeof window.markBinCollected === 'function') {
            window.markBinCollected(bin.id, { isAutoCollection: true });
        }
        var loc = typeof bin.location === 'string' ? bin.location : (bin.location && bin.location.address) || bin.locationName || (bin.lat != null && bin.lng != null ? bin.lat.toFixed(4) + ', ' + bin.lng.toFixed(4) : bin.id);
        var locationLabel = String(loc || bin.id).substring(0, 40);
        if (window.app && typeof window.app.showAlert === 'function') {
            window.app.showAlert('Collection auto-recorded', 'Collection at ' + locationLabel + ' was automatically registered for you.', 'success', 5000);
        }
    }

    function checkDriverAtBin() {
        var user = getCurrentUser();
        if (!user || user.type !== 'driver') return;

        var loc = getDriverLocation(user.id);
        if (!loc || loc.lat == null || loc.lng == null) return;

        positionHistory.push({ lat: loc.lat, lng: loc.lng, ts: Date.now() });
        if (positionHistory.length > POSITION_HISTORY_SIZE) positionHistory.shift();

        if (positionHistory.length < POSITION_HISTORY_SIZE) return;

        var bins = getBins();
        for (var i = 0; i < bins.length; i++) {
            var bin = bins[i];
            if (!bin.lat || !bin.lng) continue;
            if (wasDriverRecentlyAtBin(user.id, bin.id)) continue;
            if (wasAutoRecordedRecently(bin.id)) continue;

            var allNear = true;
            for (var j = 0; j < positionHistory.length; j++) {
                var d = calculateDistance(positionHistory[j].lat, positionHistory[j].lng, bin.lat, bin.lng);
                if (d > NEAR_BIN_KM) { allNear = false; break; }
            }
            if (allNear) {
                autoRecordCollection(bin, user.id);
                positionHistory = [];
                return;
            }
        }
    }

    function startReminder() {
        if (checkTimer) return;
        checkTimer = setInterval(checkDriverAtBin, CHECK_INTERVAL_MS);
        checkDriverAtBin();
    }

    function stopReminder() {
        if (checkTimer) {
            clearInterval(checkTimer);
            checkTimer = null;
        }
        positionHistory = [];
    }

    function init() {
        function tick() {
            var user = getCurrentUser();
            if (user && user.type === 'driver') {
                startReminder();
            } else {
                stopReminder();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(tick, 3000);
            });
        } else {
            setTimeout(tick, 3000);
        }

        setInterval(tick, 60000);
    }

    document.addEventListener('collectionRecorded', function() {
        positionHistory = [];
    });

    window.addEventListener('dataChanged', function(e) {
        if (e.detail && e.detail.key === 'driverLocations') {
            if (window.driverAtBinReminder && typeof window.driverAtBinReminder.check === 'function') {
                setTimeout(window.driverAtBinReminder.check, 2000);
            }
        }
    });

    init();
    window.driverAtBinReminder = { start: startReminder, stop: stopReminder, check: checkDriverAtBin };
})();
