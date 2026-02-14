/**
 * World-class auto-collection: shared config and cooldown
 * Used by driver-at-bin-collection-reminder.js and ENHANCED_DRIVER_SYSTEM_COMPLETE.js
 * so both systems share the same cooldown and configurable thresholds.
 */
(function() {
    'use strict';

    var COOLDOWN_KEY = 'autoCollectionCooldown_';
    var CONFIG_KEY = 'autoCollectionConfig';

    var defaultConfig = {
        // Driver-at-bin: consider "at bin" within this distance (meters)
        nearBinMeters: 30,
        // How many consecutive position checks must be near the bin (driver-at-bin)
        positionHistorySize: 3,
        // Interval between position checks for driver-at-bin (ms)
        checkIntervalDriverAtBinMs: 15000,
        // Proximity (Enhanced): trigger when driver within this distance (meters)
        proximityMeters: 15,
        // Proximity: check interval (ms)
        proximityCheckIntervalMs: 3000,
        // Proximity: min time driver must be near bin before trusting fill drop (ms)
        minDwellNearBinMs: 12000,
        // Proximity: treat as "emptied" when fill drops below this (0 = strict 0 only)
        minFillDropPercent: 0,
        // Proximity: also trigger when fill drops from above this to below minFillDropPercent
        fillWasAbovePercent: 20,
        // Shared: do not auto-record same bin again within this period (ms) — 2 hours
        cooldownMs: 2 * 60 * 60 * 1000
    };

    function loadConfig() {
        try {
            var s = localStorage.getItem(CONFIG_KEY);
            if (s) {
                var parsed = JSON.parse(s);
                return Object.assign({}, defaultConfig, parsed);
            }
        } catch (e) {}
        return Object.assign({}, defaultConfig);
    }

    function saveConfig(config) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        } catch (e) {}
    }

    var config = loadConfig();

    function isBinInCooldown(binId) {
        var key = COOLDOWN_KEY + binId;
        var ts = parseInt(localStorage.getItem(key) || '0', 10);
        return ts && (Date.now() - ts < config.cooldownMs);
    }

    function setCooldown(binId) {
        var key = COOLDOWN_KEY + binId;
        var now = String(Date.now());
        try {
            localStorage.setItem(key, now);
        } catch (e) {}
    }

    function getConfig() {
        return Object.assign({}, config);
    }

    function updateConfig(updates) {
        config = Object.assign({}, config, updates);
        saveConfig(config);
        return config;
    }

    window.autoCollectionConfig = config;
    window.autoCollectionCooldown = {
        isBinInCooldown: isBinInCooldown,
        setCooldown: setCooldown
    };
    window.autoCollectionConfigAPI = {
        getConfig: getConfig,
        updateConfig: updateConfig
    };
})();
