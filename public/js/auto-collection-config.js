/**
 * World-class auto-collection: shared config and cooldown
 * Used by driver-at-bin-collection-reminder.js and ENHANCED_DRIVER_SYSTEM_COMPLETE.js
 */
(function() {
    'use strict';

    var COOLDOWN_KEY = 'autoCollectionCooldown_';
    var CONFIG_KEY = 'autoCollectionConfig';

    var defaultConfig = {
        nearBinMeters: 30,
        positionHistorySize: 3,
        checkIntervalDriverAtBinMs: 15000,
        proximityMeters: 15,
        proximityCheckIntervalMs: 3000,
        minDwellNearBinMs: 12000,
        minFillDropPercent: 0,
        fillWasAbovePercent: 20,
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
        try {
            localStorage.setItem(key, String(Date.now()));
        } catch (e) {}
    }

    window.autoCollectionConfig = config;
    window.autoCollectionCooldown = {
        isBinInCooldown: isBinInCooldown,
        setCooldown: setCooldown
    };
    window.autoCollectionConfigAPI = {
        getConfig: function() { return Object.assign({}, config); },
        updateConfig: function(updates) {
            config = Object.assign({}, config, updates);
            saveConfig(config);
            return config;
        }
    };
})();
