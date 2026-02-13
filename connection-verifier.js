// connection-verifier.js - Startup Connection Verification
// Verifies all application connections are working properly

class ConnectionVerifier {
    constructor() {
        this.results = {};
        this.allPassed = true;
    }

    async verifyAll() {
        console.log('🔍 ═══════════════════════════════════════════════════════');
        console.log('🔍 CONNECTION VERIFICATION STARTING...');
        console.log('🔍 ═══════════════════════════════════════════════════════');

        // Verify database connection
        await this.verifyDatabase();

        // Verify Findy API connection
        await this.verifyFindyAPI();

        // Verify WebSocket connection
        await this.verifyWebSocket();

        // Verify Sync Manager
        await this.verifySyncManager();

        // Verify Sensor Integration
        await this.verifySensorIntegration();

        // Print summary
        this.printSummary();

        return this.allPassed;
    }

    async verifyDatabase() {
        console.log('\n📊 Checking Database Connection...');
        try {
            if (typeof dataManager !== 'undefined') {
                const users = dataManager.getUsers();
                const bins = dataManager.getBins();
                const sensors = dataManager.getSensors ? dataManager.getSensors() : [];
                
                this.results.database = {
                    passed: true,
                    message: `Connected - ${users.length} users, ${bins.length} bins, ${sensors.length} sensors`
                };
                console.log(`   ✅ Database: ${this.results.database.message}`);
            } else {
                throw new Error('DataManager not available');
            }
        } catch (error) {
            this.results.database = {
                passed: false,
                message: error.message
            };
            this.allPassed = false;
            console.log(`   ❌ Database: ${error.message}`);
        }
    }

    async verifyFindyAPI() {
        console.log('\n📡 Checking Findy IoT API Connection...');
        try {
            if (typeof findyClient !== 'undefined' || window.findyClient) {
                const client = findyClient || window.findyClient;
                const health = await client.healthCheck();
                
                if (health.success && health.authenticated) {
                    this.results.findyAPI = {
                        passed: true,
                        message: 'Authenticated and ready'
                    };
                    console.log(`   ✅ Findy API: ${this.results.findyAPI.message}`);
                } else {
                    this.results.findyAPI = {
                        passed: false,
                        message: health.message || 'Not authenticated'
                    };
                    this.allPassed = false;
                    console.log(`   ⚠️ Findy API: ${this.results.findyAPI.message}`);
                }
            } else {
                this.results.findyAPI = {
                    passed: false,
                    message: 'FindyClient not loaded'
                };
                console.log(`   ⚠️ Findy API: ${this.results.findyAPI.message}`);
            }
        } catch (error) {
            this.results.findyAPI = {
                passed: false,
                message: error.message
            };
            console.log(`   ❌ Findy API: ${error.message}`);
        }
    }

    async verifyWebSocket() {
        console.log('\n🔌 Checking WebSocket Connection...');
        try {
            if (typeof webSocketManager !== 'undefined' || window.webSocketManager) {
                const wsm = webSocketManager || window.webSocketManager;
                const status = wsm.getStatus();
                
                if (status.connected) {
                    this.results.websocket = {
                        passed: true,
                        message: 'Connected and ready'
                    };
                    console.log(`   ✅ WebSocket: ${this.results.websocket.message}`);
                } else if (wsm.usesFallback) {
                    this.results.websocket = {
                        passed: true,
                        message: 'Using fallback mode (HTTP polling)'
                    };
                    console.log(`   ⚠️ WebSocket: ${this.results.websocket.message}`);
                } else {
                    this.results.websocket = {
                        passed: false,
                        message: `Disconnected - ${status.reconnectAttempts} reconnect attempts`
                    };
                    this.allPassed = false;
                    console.log(`   ❌ WebSocket: ${this.results.websocket.message}`);
                }
            } else {
                this.results.websocket = {
                    passed: false,
                    message: 'WebSocketManager not loaded'
                };
                console.log(`   ⚠️ WebSocket: ${this.results.websocket.message}`);
            }
        } catch (error) {
            this.results.websocket = {
                passed: false,
                message: error.message
            };
            console.log(`   ❌ WebSocket: ${error.message}`);
        }
    }

    async verifySyncManager() {
        console.log('\n🔄 Checking Sync Manager...');
        try {
            if (typeof syncManager !== 'undefined' || window.syncManager) {
                const sm = syncManager || window.syncManager;
                const status = sm.getSyncStatus();
                
                if (status.enabled && status.online) {
                    this.results.syncManager = {
                        passed: true,
                        message: `Online - Last sync: ${status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Never'}`
                    };
                    console.log(`   ✅ Sync Manager: ${this.results.syncManager.message}`);
                } else {
                    this.results.syncManager = {
                        passed: false,
                        message: `Offline - ${status.pendingUpdates} pending updates`
                    };
                    console.log(`   ⚠️ Sync Manager: ${this.results.syncManager.message}`);
                }
            } else {
                this.results.syncManager = {
                    passed: false,
                    message: 'SyncManager not loaded'
                };
                console.log(`   ⚠️ Sync Manager: ${this.results.syncManager.message}`);
            }
        } catch (error) {
            this.results.syncManager = {
                passed: false,
                message: error.message
            };
            console.log(`   ❌ Sync Manager: ${error.message}`);
        }
    }

    async verifySensorIntegration() {
        console.log('\n🗑️ Checking Sensor-Bin Integration...');
        try {
            if (typeof findyBinSensorIntegration !== 'undefined' || window.findyBinSensorIntegration) {
                const integration = findyBinSensorIntegration || window.findyBinSensorIntegration;
                const mappingCount = Object.keys(integration.binSensorMapping || {}).length;
                
                if (mappingCount > 0) {
                    this.results.sensorIntegration = {
                        passed: true,
                        message: `${mappingCount} bin-sensor mappings configured`
                    };
                    console.log(`   ✅ Sensor Integration: ${this.results.sensorIntegration.message}`);
                } else {
                    this.results.sensorIntegration = {
                        passed: true,
                        message: 'Ready (no sensors linked yet)'
                    };
                    console.log(`   ℹ️ Sensor Integration: ${this.results.sensorIntegration.message}`);
                }
            } else {
                this.results.sensorIntegration = {
                    passed: false,
                    message: 'FindyBinSensorIntegration not loaded'
                };
                console.log(`   ⚠️ Sensor Integration: ${this.results.sensorIntegration.message}`);
            }
        } catch (error) {
            this.results.sensorIntegration = {
                passed: false,
                message: error.message
            };
            console.log(`   ❌ Sensor Integration: ${error.message}`);
        }
    }

    printSummary() {
        console.log('\n🔍 ═══════════════════════════════════════════════════════');
        console.log('🔍 CONNECTION VERIFICATION SUMMARY');
        console.log('🔍 ═══════════════════════════════════════════════════════');
        
        const passedCount = Object.values(this.results).filter(r => r.passed).length;
        const totalCount = Object.keys(this.results).length;
        
        console.log(`\n   Total: ${passedCount}/${totalCount} checks passed`);
        
        if (this.allPassed) {
            console.log('\n   ✅ ALL SYSTEMS OPERATIONAL');
        } else {
            console.log('\n   ⚠️ SOME ISSUES DETECTED - Check logs above for details');
        }
        
        console.log('\n🔍 ═══════════════════════════════════════════════════════\n');
    }

    getResults() {
        return {
            allPassed: this.allPassed,
            results: this.results
        };
    }
}

// Create global instance
const connectionVerifier = new ConnectionVerifier();
window.connectionVerifier = connectionVerifier;

// Auto-verify on page load (after all scripts are loaded)
if (document.readyState === 'complete') {
    setTimeout(() => connectionVerifier.verifyAll(), 3000);
} else {
    window.addEventListener('load', () => {
        setTimeout(() => connectionVerifier.verifyAll(), 3000);
    });
}

// Expose verification function globally
window.verifyConnections = function() {
    return connectionVerifier.verifyAll();
};

console.log('✅ Connection Verifier loaded - run verifyConnections() to check status');
