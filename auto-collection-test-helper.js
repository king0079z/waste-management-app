/**
 * Test helper for auto-collection (driver-at-bin) without being at a real bin.
 * Simulates driver position at a chosen bin so the auto-collection logic runs.
 * Use ?testAutoCollection=1 in the URL to show the test button, or press Ctrl+Shift+A.
 */
(function() {
    'use strict';

    const POSITION_CHECKS_NEEDED = 3;  // Same as driver-at-bin-collection-reminder
    const DELAY_BETWEEN_CHECKS_MS = 600;
    const STORAGE_PREFIX = 'driverAtBin_';

    function showTestPanel() {
        var user = typeof authManager !== 'undefined' && authManager.getCurrentUser ? authManager.getCurrentUser() : null;
        if (!user || user.type !== 'driver') {
            if (window.app && typeof window.app.showAlert === 'function') {
                window.app.showAlert('Driver required', 'Log in as a driver to test auto-collection.', 'warning', 4000);
            } else {
                alert('Log in as a driver to test auto-collection.');
            }
            return;
        }

        var bins = typeof dataManager !== 'undefined' && dataManager.getBins ? dataManager.getBins() : [];
        bins = bins.filter(function(b) { return b && b.lat != null && b.lng != null; });
        if (bins.length === 0) {
            if (window.app && typeof window.app.showAlert === 'function') {
                window.app.showAlert('No bins', 'No bins with coordinates found. Add or load demo bins first.', 'warning', 4000);
            } else {
                alert('No bins with coordinates found. Add or load demo bins first.');
            }
            return;
        }

        var panel = document.getElementById('auto-collection-test-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'auto-collection-test-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Test auto-collection');
        panel.style.cssText = 'position:fixed;top:80px;right:16px;width:320px;max-height:80vh;overflow:auto;' +
            'background:#1a1d23;color:#e4e6eb;border:1px solid #3a3f4b;border-radius:12px;' +
            'box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:99999;padding:16px;font-family:system-ui,sans-serif;font-size:14px;';

        var title = document.createElement('h3');
        title.style.cssText = 'margin:0 0 12px 0;font-size:16px;';
        title.textContent = 'Test auto-collection (demo bins)';
        panel.appendChild(title);

        var desc = document.createElement('p');
        desc.style.cssText = 'margin:0 0 12px 0;color:#9ca3af;font-size:12px;line-height:1.4;';
        desc.textContent = 'Simulate your position at a bin. After 3 checks (~2s), collection will auto-record. Re-open anytime: Ctrl+Shift+A or autoCollectionTestHelper.showPanel() in console.';
        panel.appendChild(desc);

        var clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear cooldown (re-test same bin)';
        clearBtn.style.cssText = 'margin-bottom:12px;padding:8px 12px;background:#374151;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;';
        clearBtn.onclick = function() {
            try {
                var keys = [];
                for (var i = 0; i < localStorage.length; i++) {
                    var k = localStorage.key(i);
                    if (k && k.indexOf(STORAGE_PREFIX) === 0) keys.push(k);
                }
                keys.forEach(function(k) { localStorage.removeItem(k); });
                if (window.app && typeof window.app.showAlert === 'function') {
                    window.app.showAlert('Cooldown cleared', 'You can re-test the same bin.', 'success', 2000);
                }
            } catch (e) {}
        };
        panel.appendChild(clearBtn);

        var list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
        bins.forEach(function(bin) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;background:#252830;border-radius:8px;flex-wrap:wrap;';
            var label = document.createElement('span');
            label.style.cssText = 'flex:1;min-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            label.textContent = (bin.location || bin.id || 'Bin') + ' (' + (bin.id || '') + ')';
            var btnWrap = document.createElement('div');
            btnWrap.style.cssText = 'display:flex;gap:6px;';
            var btn = document.createElement('button');
            btn.textContent = "Simulate I'm here";
            btn.style.cssText = 'padding:6px 10px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;white-space:nowrap;';
            btn.onclick = function() { runSimulation(bin, user.id); };
            var btnReal = document.createElement('button');
            btnReal.textContent = 'Test real auto (3 checks)';
            btnReal.style.cssText = 'padding:6px 10px;background:#1e40af;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;white-space:nowrap;';
            btnReal.title = 'Triggers Driver-at-Bin auto path (3 position checks). Clear cooldown first to re-test same bin.';
            btnReal.onclick = function() { testRealAutoCollection(bin.id); };
            btnWrap.appendChild(btn);
            btnWrap.appendChild(btnReal);
            row.appendChild(label);
            row.appendChild(btnWrap);
            list.appendChild(row);
        });
        panel.appendChild(list);

        var closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = 'margin-top:12px;width:100%;padding:8px;background:#374151;color:#fff;border:none;border-radius:8px;cursor:pointer;';
        closeBtn.onclick = function() { panel.style.display = 'none'; };
        panel.appendChild(closeBtn);

        document.body.appendChild(panel);
    }

    function runSimulation(bin, driverId) {
        if (typeof dataManager === 'undefined' || !dataManager.setDriverLocation) {
            if (window.app && window.app.showAlert) window.app.showAlert('Error', 'Data manager not available.', 'danger');
            else alert('Data manager not available.');
            return;
        }
        if (typeof window.markBinCollected !== 'function') {
            if (window.app && window.app.showAlert) window.app.showAlert('Error', 'Collection action not available. Refresh and try again.', 'danger');
            else alert('Collection action not available.');
            return;
        }

        // Set driver position at bin (so map shows driver at bin)
        dataManager.setDriverLocation(driverId, { lat: bin.lat, lng: bin.lng });
        if (window.app && typeof window.app.showAlert === 'function') {
            window.app.showAlert('Simulating...', 'Recording collection at ' + (bin.location || bin.id) + '...', 'info', 2000);
        }

        // Directly record collection so "Simulate I'm here" always has a visible effect
        var binLabel = (bin.location || bin.id || '').substring(0, 40);
        setTimeout(function() {
            try {
                if (typeof window.markBinCollected === 'function') {
                    window.markBinCollected(bin.id);
                    if (window.app && typeof window.app.showAlert === 'function') {
                        window.app.showAlert('Collection recorded', 'Simulated collection at ' + binLabel + ' was recorded.', 'success', 4000);
                    }
                }
            } catch (err) {
                if (window.app && window.app.showAlert) window.app.showAlert('Error', (err && err.message) || 'Failed to record collection.', 'danger');
            }
        }, 500);
    }

    function init() {
        var showByParam = typeof URLSearchParams !== 'undefined' && new URLSearchParams(document.location.search).get('testAutoCollection') === '1';
        if (!showByParam) {
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                    e.preventDefault();
                    showTestPanel();
                }
            });
            return;
        }

        var btn = document.createElement('button');
        btn.id = 'auto-collection-test-btn';
        btn.textContent = 'Test auto-collection';
        btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99998;padding:10px 16px;' +
            'background:#059669;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        btn.onclick = showTestPanel;
        document.body.appendChild(btn);
    }

    /** Test the real Driver-at-Bin auto path: set driver at bin, run check 3 times so position history has 3 entries and auto-record triggers (if cooldown allows). */
    function testRealAutoCollection(binId) {
        var user = typeof authManager !== 'undefined' && authManager.getCurrentUser ? authManager.getCurrentUser() : null;
        if (!user || user.type !== 'driver') {
            if (window.app && window.app.showAlert) window.app.showAlert('Driver required', 'Log in as a driver to test.', 'warning', 4000);
            return Promise.reject(new Error('Driver required'));
        }
        var bin = typeof dataManager !== 'undefined' && dataManager.getBinById ? dataManager.getBinById(binId) : null;
        if (!bin || bin.lat == null || bin.lng == null) {
            if (window.app && window.app.showAlert) window.app.showAlert('Bin not found', 'Bin must have lat/lng.', 'warning', 4000);
            return Promise.reject(new Error('Bin not found'));
        }
        if (!window.driverAtBinReminder || typeof window.driverAtBinReminder.check !== 'function') {
            if (window.app && window.app.showAlert) window.app.showAlert('Reminder not loaded', 'driver-at-bin-collection-reminder.js must be loaded.', 'warning', 4000);
            return Promise.reject(new Error('driverAtBinReminder.check not available'));
        }
        dataManager.setDriverLocation(user.id, { lat: bin.lat, lng: bin.lng, timestamp: new Date().toISOString() });
        if (window.app && window.app.showAlert) window.app.showAlert('Testing real auto...', 'Running 3 position checks at bin. If cooldown allows, collection will auto-record.', 'info', 3000);
        return new Promise(function(resolve) {
            var run = 0;
            function runCheck() {
                window.driverAtBinReminder.check();
                run++;
                if (run < 3) setTimeout(runCheck, 350);
                else resolve();
            }
            setTimeout(runCheck, 200);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 1000); });
    } else {
        setTimeout(init, 1000);
    }

    window.autoCollectionTestHelper = { showPanel: showTestPanel, testRealAutoCollection: testRealAutoCollection };
})();
