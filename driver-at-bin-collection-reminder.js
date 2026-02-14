/**
 * Driver-at-Bin Auto-Collection (World-class)
 * Records a collection only when the driver was near the bin AND the bin fill % changed (dropped).
 * If the bin level % was not changed, no collection is recorded.
 * - Uses shared config (auto-collection-config.js) and cooldown.
 */
(function() {
    'use strict';

    function getCfg() {
        var c = window.autoCollectionConfig || {};
        return {
            nearBinKm: (c.nearBinMeters != null ? c.nearBinMeters : 30) / 1000,
            positionHistorySize: c.positionHistorySize != null ? c.positionHistorySize : 3,
            checkIntervalMs: c.checkIntervalDriverAtBinMs != null ? c.checkIntervalDriverAtBinMs : 15000
        };
    }

    let positionHistory = [];
    let checkTimer = null;
    // Track bins where driver is "at bin" and we have seen fill; only record when fill drops
    var atBinCandidates = {};

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
        if (window.autoCollectionCooldown && typeof window.autoCollectionCooldown.isBinInCooldown === 'function') {
            return window.autoCollectionCooldown.isBinInCooldown(binId);
        }
        return false;
    }

    function setAutoRecorded(binId) {
        if (window.autoCollectionCooldown && typeof window.autoCollectionCooldown.setCooldown === 'function') {
            window.autoCollectionCooldown.setCooldown(binId);
        }
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

    function getBinFill(bin) {
        var f = bin.fill != null ? bin.fill : bin.fillLevel;
        return typeof f === 'number' ? f : 0;
    }

    function checkDriverAtBin() {
        var user = getCurrentUser();
        if (!user || user.type !== 'driver') return;

        var loc = getDriverLocation(user.id);
        if (!loc || loc.lat == null || loc.lng == null) return;

        var cfg = getCfg();
        positionHistory.push({ lat: loc.lat, lng: loc.lng, ts: Date.now() });
        if (positionHistory.length > cfg.positionHistorySize) positionHistory.shift();

        if (positionHistory.length < cfg.positionHistorySize) return;

        var bins = getBins();
        var binsNearNow = [];
        for (var i = 0; i < bins.length; i++) {
            var bin = bins[i];
            if (!bin.lat || !bin.lng) continue;
            var allNear = true;
            for (var j = 0; j < positionHistory.length; j++) {
                var d = calculateDistance(positionHistory[j].lat, positionHistory[j].lng, bin.lat, bin.lng);
                if (d > cfg.nearBinKm) { allNear = false; break; }
            }
            if (allNear) binsNearNow.push(bin.id);
        }
        // Clear candidates for bins driver is no longer near
        Object.keys(atBinCandidates).forEach(function(binId) {
            if (binsNearNow.indexOf(binId) === -1) delete atBinCandidates[binId];
        });

        for (var i = 0; i < bins.length; i++) {
            var bin = bins[i];
            if (!bin.lat || !bin.lng || binsNearNow.indexOf(bin.id) === -1) continue;
            if (wasDriverRecentlyAtBin(user.id, bin.id)) continue;
            if (wasAutoRecordedRecently(bin.id)) continue;

            var currentFill = getBinFill(bin);
            var cand = atBinCandidates[bin.id];
            if (!cand) {
                atBinCandidates[bin.id] = { firstFill: currentFill, firstSeen: Date.now() };
                continue;
            }
            // Only record if bin fill % changed (dropped) after driver was near
            var fillDropped = currentFill < cand.firstFill - 1 || currentFill === 0;
            if (fillDropped) {
                autoRecordCollection(bin, user.id);
                delete atBinCandidates[bin.id];
                positionHistory = [];
                return;
            }
        }
        // Prune old candidates (e.g. > 5 min) to avoid unbounded growth
        var now = Date.now();
        Object.keys(atBinCandidates).forEach(function(binId) {
            if (now - atBinCandidates[binId].firstSeen > 5 * 60 * 1000) delete atBinCandidates[binId];
        });
    }

    function startReminder() {
        if (checkTimer) return;
        var cfg = getCfg();
        checkTimer = setInterval(checkDriverAtBin, cfg.checkIntervalMs);
        checkDriverAtBin();
    }

    function stopReminder() {
        if (checkTimer) {
            clearInterval(checkTimer);
            checkTimer = null;
        }
        positionHistory = [];
        atBinCandidates = {};
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
