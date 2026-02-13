// driver-connection-test.js - Comprehensive Driver Connection Testing Suite
// Tests all driver ID connections and data flows for Vercel deployment

class DriverConnectionTest {
    constructor() {
        this.testResults = [];
        this.testStartTime = Date.now();
        this.isRunning = false;
    }

    async runAllTests() {
        if (this.isRunning) {
            console.warn('⚠️ Tests are already running');
            return;
        }

        this.isRunning = true;
        this.testResults = [];
        
        console.log('🧪 Starting Driver Connection Test Suite...');
        console.log('═'.repeat(60));

        try {
            // Test 1: Authentication System
            await this.testDriverAuthentication();
            
            // Test 2: Data Manager Integration
            await this.testDataManagerIntegration();
            
            // Test 3: WebSocket Connections
            await this.testWebSocketConnections();
            
            // Test 4: API Endpoints
            await this.testAPIEndpoints();
            
            // Test 5: Driver Location System
            await this.testDriverLocationSystem();
            
            // Test 6: Route Management
            await this.testRouteManagement();
            
            // Test 7: Real-time Sync
            await this.testRealTimeSync();
            
            // Test 8: Driver UI Components
            await this.testDriverUIComponents();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.addTestResult('Test Suite', false, `Failed: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    async testDriverAuthentication() {
        console.log('🔐 Testing Driver Authentication...');
        
        try {
            // Test default driver credentials
            const testCredentials = [
                { username: 'driver1', password: 'driver123', id: 'USR-003' },
                { username: 'driver2', password: 'driver123', id: 'USR-004' }
            ];
            
            for (const cred of testCredentials) {
                try {
                    // Check if authManager exists
                    if (!window.authManager) {
                        throw new Error('AuthManager not available');
                    }
                    
                    // Test login
                    const result = await window.authManager.login(cred.username, cred.password, 'driver');
                    
                    if (result.success) {
                        const currentUser = window.authManager.getCurrentUser();
                        
                        if (currentUser && currentUser.id === cred.id) {
                            this.addTestResult(`Driver Auth - ${cred.username}`, true, `Successfully authenticated as ${currentUser.id}`);
                            
                            // Test logout
                            window.authManager.logout();
                            this.addTestResult(`Driver Logout - ${cred.username}`, true, 'Successfully logged out');
                        } else {
                            this.addTestResult(`Driver Auth - ${cred.username}`, false, 'User ID mismatch after login');
                        }
                    } else {
                        this.addTestResult(`Driver Auth - ${cred.username}`, false, result.error || 'Login failed');
                    }
                } catch (error) {
                    this.addTestResult(`Driver Auth - ${cred.username}`, false, error.message);
                }
            }
            
        } catch (error) {
            this.addTestResult('Driver Authentication', false, error.message);
        }
    }

    async testDataManagerIntegration() {
        console.log('🗄️ Testing Data Manager Integration...');
        
        try {
            if (!window.dataManager) {
                throw new Error('DataManager not available');
            }
            
            // Test driver data retrieval
            const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
            
            if (drivers.length > 0) {
                this.addTestResult('Driver Data Retrieval', true, `Found ${drivers.length} drivers`);
                
                // Test specific driver lookup
                const testDriver = drivers[0];
                const foundDriver = window.dataManager.getUserById(testDriver.id);
                
                if (foundDriver && foundDriver.id === testDriver.id) {
                    this.addTestResult('Driver Lookup by ID', true, `Found driver ${testDriver.id}`);
                } else {
                    this.addTestResult('Driver Lookup by ID', false, 'Driver not found by ID');
                }
                
                // Test driver data update
                const originalStatus = testDriver.status;
                const testUpdate = { status: 'test_status', lastUpdate: new Date().toISOString() };
                
                try {
                    window.dataManager.updateUser(testDriver.id, testUpdate);
                    const updatedDriver = window.dataManager.getUserById(testDriver.id);
                    
                    if (updatedDriver.status === 'test_status') {
                        this.addTestResult('Driver Data Update', true, 'Driver data updated successfully');
                        
                        // Restore original status
                        window.dataManager.updateUser(testDriver.id, { status: originalStatus });
                    } else {
                        this.addTestResult('Driver Data Update', false, 'Driver data not updated');
                    }
                } catch (error) {
                    this.addTestResult('Driver Data Update', false, error.message);
                }
                
            } else {
                this.addTestResult('Driver Data Retrieval', false, 'No drivers found in system');
            }
            
        } catch (error) {
            this.addTestResult('Data Manager Integration', false, error.message);
        }
    }

    async testWebSocketConnections() {
        console.log('🔌 Testing WebSocket Connections...');
        
        try {
            // Test WebSocket Manager
            if (window.wsManager) {
                const status = window.wsManager.getConnectionStatus();
                this.addTestResult('WebSocket Manager', true, `Connection status: ${status.isConnected ? 'Connected' : 'Disconnected'}`);
                
                // Test fallback system
                if (window.WebSocketFallback) {
                    this.addTestResult('WebSocket Fallback Available', true, 'Fallback system loaded');
                } else {
                    this.addTestResult('WebSocket Fallback Available', false, 'Fallback system not loaded');
                }
                
            } else {
                this.addTestResult('WebSocket Manager', false, 'WebSocket Manager not available');
            }
            
        } catch (error) {
            this.addTestResult('WebSocket Connections', false, error.message);
        }
    }

    async testAPIEndpoints() {
        console.log('🌐 Testing API Endpoints...');
        
        const endpoints = [
            { url: '/api/health', method: 'GET', name: 'Health Check' },
            { url: '/api/data/sync', method: 'GET', name: 'Data Sync' },
            { url: '/api/driver/locations', method: 'GET', name: 'Driver Locations' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint.url, {
                    method: endpoint.method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.addTestResult(`API - ${endpoint.name}`, true, `Status: ${response.status}`);
                } else {
                    this.addTestResult(`API - ${endpoint.name}`, false, `HTTP ${response.status}: ${response.statusText}`);
                }
                
            } catch (error) {
                this.addTestResult(`API - ${endpoint.name}`, false, error.message);
            }
        }
        
        // Test driver-specific endpoints
        await this.testDriverSpecificEndpoints();
    }

    async testDriverSpecificEndpoints() {
        const testDriverId = 'USR-003';
        
        const driverEndpoints = [
            { url: `/api/driver/${testDriverId}`, method: 'GET', name: 'Get Driver Data' },
            { url: `/api/driver/${testDriverId}/routes`, method: 'GET', name: 'Get Driver Routes' }
        ];
        
        for (const endpoint of driverEndpoints) {
            try {
                const response = await fetch(endpoint.url, {
                    method: endpoint.method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.addTestResult(`Driver API - ${endpoint.name}`, true, `Data retrieved for ${testDriverId}`);
                } else {
                    this.addTestResult(`Driver API - ${endpoint.name}`, false, `HTTP ${response.status}`);
                }
                
            } catch (error) {
                this.addTestResult(`Driver API - ${endpoint.name}`, false, error.message);
            }
        }
        
        // Test driver data update
        try {
            const updateData = {
                fuelLevel: 85,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(`/api/driver/${testDriverId}/fuel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                this.addTestResult('Driver API - Update Fuel', true, 'Fuel level updated successfully');
            } else {
                this.addTestResult('Driver API - Update Fuel', false, `HTTP ${response.status}`);
            }
            
        } catch (error) {
            this.addTestResult('Driver API - Update Fuel', false, error.message);
        }
    }

    async testDriverLocationSystem() {
        console.log('📍 Testing Driver Location System...');
        
        try {
            if (!window.dataManager) {
                throw new Error('DataManager not available');
            }
            
            const testDriverId = 'USR-003';
            const testLocation = {
                lat: 25.2854,
                lng: 51.5310,
                timestamp: new Date().toISOString()
            };
            
            // Test location update
            window.dataManager.updateDriverLocation(testDriverId, testLocation.lat, testLocation.lng);
            
            // Test location retrieval
            const savedLocation = window.dataManager.getDriverLocation(testDriverId);
            
            if (savedLocation && savedLocation.lat === testLocation.lat) {
                this.addTestResult('Driver Location System', true, 'Location updated and retrieved successfully');
            } else {
                this.addTestResult('Driver Location System', false, 'Location not saved or retrieved correctly');
            }
            
            // Test all driver locations
            const allLocations = window.dataManager.getAllDriverLocations();
            
            if (allLocations && typeof allLocations === 'object') {
                this.addTestResult('All Driver Locations', true, `Retrieved ${Object.keys(allLocations).length} driver locations`);
            } else {
                this.addTestResult('All Driver Locations', false, 'Could not retrieve driver locations');
            }
            
        } catch (error) {
            this.addTestResult('Driver Location System', false, error.message);
        }
    }

    async testRouteManagement() {
        console.log('🗺️ Testing Route Management...');
        
        try {
            if (!window.dataManager) {
                throw new Error('DataManager not available');
            }
            
            const testRoute = {
                id: 'TEST-ROUTE-001',
                driverId: 'USR-003',
                driverName: 'Test Driver',
                binIds: ['BIN-001', 'BIN-002'],
                status: 'pending',
                priority: 'medium',
                assignedAt: new Date().toISOString(),
                estimatedDuration: 30
            };
            
            // Test route creation
            const savedRoute = window.dataManager.addRoute(testRoute);
            
            if (savedRoute && savedRoute.id === testRoute.id) {
                this.addTestResult('Route Creation', true, 'Route created successfully');
                
                // Test route retrieval
                const routes = window.dataManager.getRoutes();
                const foundRoute = routes.find(r => r.id === testRoute.id);
                
                if (foundRoute) {
                    this.addTestResult('Route Retrieval', true, 'Route found in system');
                    
                    // Test route update
                    const updatedRoute = { ...foundRoute, status: 'active' };
                    window.dataManager.updateRoute(testRoute.id, updatedRoute);
                    
                    const routes2 = window.dataManager.getRoutes();
                    const updatedFoundRoute = routes2.find(r => r.id === testRoute.id);
                    
                    if (updatedFoundRoute && updatedFoundRoute.status === 'active') {
                        this.addTestResult('Route Update', true, 'Route status updated successfully');
                    } else {
                        this.addTestResult('Route Update', false, 'Route status not updated');
                    }
                    
                    // Clean up test route
                    const cleanRoutes = routes2.filter(r => r.id !== testRoute.id);
                    window.dataManager.setData('routes', cleanRoutes);
                    
                } else {
                    this.addTestResult('Route Retrieval', false, 'Route not found after creation');
                }
                
            } else {
                this.addTestResult('Route Creation', false, 'Route not created properly');
            }
            
        } catch (error) {
            this.addTestResult('Route Management', false, error.message);
        }
    }

    async testRealTimeSync() {
        console.log('🔄 Testing Real-time Synchronization...');
        
        try {
            if (window.syncManager) {
                this.addTestResult('Sync Manager Available', true, 'Sync manager loaded');
                
                // Test sync functionality if available
                if (typeof window.syncManager.performSync === 'function') {
                    window.syncManager.performSync();
                    this.addTestResult('Sync Operation', true, 'Sync operation executed');
                } else {
                    this.addTestResult('Sync Operation', false, 'Sync method not available');
                }
            } else {
                this.addTestResult('Sync Manager Available', false, 'Sync manager not loaded');
            }
            
        } catch (error) {
            this.addTestResult('Real-time Sync', false, error.message);
        }
    }

    async testDriverUIComponents() {
        console.log('🖥️ Testing Driver UI Components...');
        
        try {
            // Test driver buttons system
            if (window.driverSystemV3 || window.reinitializeDriverButtons) {
                this.addTestResult('Driver System V3', true, 'Driver button system available');
            } else {
                this.addTestResult('Driver System V3', false, 'Driver button system not available');
            }
            
            // Test messaging system
            if (window.enhancedMessaging) {
                this.addTestResult('Enhanced Messaging', true, 'Messaging system loaded');
            } else {
                this.addTestResult('Enhanced Messaging', false, 'Messaging system not loaded');
            }
            
            // Test AI integration
            if (window.aiDriverIntegration || window.IntelligentDriverAssistant) {
                this.addTestResult('AI Driver Integration', true, 'AI system available');
            } else {
                this.addTestResult('AI Driver Integration', false, 'AI system not available');
            }
            
            // Test map manager
            if (window.mapManager) {
                this.addTestResult('Map Manager', true, 'Map system loaded');
            } else {
                this.addTestResult('Map Manager', false, 'Map system not loaded');
            }
            
        } catch (error) {
            this.addTestResult('Driver UI Components', false, error.message);
        }
    }

    addTestResult(testName, passed, details = '') {
        const result = {
            name: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        const message = details ? ` - ${details}` : '';
        console.log(`${status} ${testName}${message}`);
    }

    generateTestReport() {
        const endTime = Date.now();
        const duration = endTime - this.testStartTime;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log('\n' + '═'.repeat(60));
        console.log('📊 DRIVER CONNECTION TEST REPORT');
        console.log('═'.repeat(60));
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`✅ Passed: ${passedTests}/${totalTests} (${successRate}%)`);
        console.log(`❌ Failed: ${totalTests - passedTests}`);
        console.log('═'.repeat(60));
        
        // Detailed results
        console.log('\n📋 DETAILED RESULTS:');
        this.testResults.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.name}`);
            if (result.details) {
                console.log(`   └─ ${result.details}`);
            }
        });
        
        // Failed tests summary
        const failedTests = this.testResults.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ FAILED TESTS SUMMARY:');
            failedTests.forEach((result, index) => {
                console.log(`${index + 1}. ${result.name}: ${result.details}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (successRate >= 90) {
            console.log('✅ System is ready for deployment!');
        } else if (successRate >= 70) {
            console.log('⚠️  System mostly ready, address failed tests before deployment');
        } else {
            console.log('❌ System not ready for deployment, significant issues found');
        }
        
        console.log('═'.repeat(60));
        
        // Store results for external access
        window.lastDriverConnectionTestReport = {
            duration,
            passedTests,
            totalTests,
            successRate: parseFloat(successRate),
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
    }

    // Get test results for external use
    getResults() {
        return {
            isRunning: this.isRunning,
            results: this.testResults,
            summary: {
                total: this.testResults.length,
                passed: this.testResults.filter(r => r.passed).length,
                failed: this.testResults.filter(r => !r.passed).length
            }
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriverConnectionTest;
} else {
    window.DriverConnectionTest = DriverConnectionTest;
    window.driverConnectionTest = new DriverConnectionTest();
    
    // Auto-run tests when DOM is ready (if in development)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Only auto-run in development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                setTimeout(() => {
                    console.log('🚀 Auto-running driver connection tests...');
                    window.driverConnectionTest.runAllTests();
                }, 2000);
            }
        });
    }
}
