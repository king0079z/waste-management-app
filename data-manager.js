// data-manager.js - Fixed Data Management and Persistence Module

class DataManager {
    constructor() {
        this.storagePrefix = 'waste_mgmt_';
        this.initializeDefaultData();
    }

    // Initialize default data if not exists
    initializeDefaultData() {
        // Check if we have a large generated dataset (wrap for Tracking Prevention / storage block)
        let generatedBins = null, generatedDrivers = null;
        try {
            generatedBins = localStorage.getItem('generated_bins');
            generatedDrivers = localStorage.getItem('generated_drivers');
        } catch (e) {
            if (e.name === 'SecurityError' || (e.message && (e.message.indexOf('storage') !== -1 || e.message.indexOf('Tracking') !== -1))) {
                console.warn('Storage access blocked (e.g. Tracking Prevention). Using in-memory fallback.');
            }
        }
        if (generatedBins && generatedDrivers) {
            console.log('🏭 Loading large generated dataset...');
            this.loadGeneratedDataset();
            return;
        }
        
        // Check if already initialized
        const isInitialized = this.getData('initialized');
        const users = this.getData('users') || [];
        
        if (!isInitialized || users.length === 0) {
            console.log('🔧 Initializing demo accounts...');
            console.log('Current initialization status:', isInitialized);
            console.log('Current users count:', users.length);
            
            // Initialize demo accounts
            const demoAccounts = [
                { 
                    id: 'USR-001', 
                    username: 'admin', 
                    password: 'admin123', 
                    name: 'Admin User', 
                    type: 'admin', 
                    email: 'admin@autonautics.com', 
                    phone: '+974 1234 5678',
                    status: 'active', 
                    createdAt: new Date().toISOString() 
                },
                { 
                    id: 'USR-002', 
                    username: 'manager1', 
                    password: 'manager123', 
                    name: 'Sarah Manager', 
                    type: 'manager', 
                    email: 'sarah@autonautics.com', 
                    phone: '+974 2345 6789',
                    status: 'active', 
                    createdAt: new Date().toISOString() 
                },
                { 
                    id: 'USR-003', 
                    username: 'driver1', 
                    password: 'driver123', 
                    name: 'John Kirt', 
                    type: 'driver', 
                    email: 'john.kirt@autonautics.com', 
                    phone: '+974 3456 7890',
                    vehicleId: 'DA130-01', 
                    license: 'DL-12345',
                    status: 'active', 
                    rating: 5.0,
                    createdAt: new Date().toISOString() 
                },
                { 
                    id: 'USR-004', 
                    username: 'driver2', 
                    password: 'driver123', 
                    name: 'Mathew Williams', 
                    type: 'driver', 
                    email: 'mathew.williams@autonautics.com', 
                    phone: '+974 4567 8901',
                    vehicleId: 'DA130-02', 
                    license: 'DL-23456',
                    status: 'active', 
                    rating: 4.8,
                    createdAt: new Date().toISOString() 
                }
            ];
            
            // Set the users data with demo accounts
            this.setData('users', demoAccounts);

            // Initialize sample bins with Doha locations
            this.setData('bins', [
                {
                    id: 'DF703-001',
                    location: 'Pearl Qatar Tower A',
                    lat: 25.3682,
                    lng: 51.5511,
                    type: 'paper',
                    capacity: 100,
                    fill: 75,
                    status: 'warning',
                    lastCollection: 'Yesterday',
                    temperature: 28,
                    batteryLevel: 95,
                    signalStrength: -65,
                    sensorStatus: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'DF703-002',
                    location: 'West Bay Business District',
                    lat: 25.3215,
                    lng: 51.5309,
                    type: 'paper',
                    capacity: 100,
                    fill: 45,
                    status: 'normal',
                    lastCollection: '2 days ago',
                    temperature: 25,
                    batteryLevel: 100,
                    signalStrength: -70,
                    sensorStatus: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'DF703-003',
                    location: 'Katara Cultural Village',
                    lat: 25.3606,
                    lng: 51.5256,
                    type: 'mixed',
                    capacity: 150,
                    fill: 90,
                    status: 'critical',
                    lastCollection: '3 days ago',
                    temperature: 30,
                    batteryLevel: 88,
                    signalStrength: -72,
                    sensorStatus: 'active',
                    createdAt: new Date().toISOString()
                }
            ]);

            // Initialize sample routes
            this.setData('routes', [
                {
                    id: 'RTE-001',
                    driverId: 'USR-003',
                    binIds: ['DF703-001', 'DF703-003'],
                    status: 'pending',
                    assignedBy: 'USR-002',
                    createdAt: new Date().toISOString()
                }
            ]);

            // Initialize sample complaints
            this.setData('complaints', [
                {
                    id: 'CMP-001',
                    type: 'overflow',
                    location: 'Pearl Qatar Tower B',
                    description: 'Bin is overflowing with paper waste',
                    priority: 'high',
                    email: 'resident@pearl.qa',
                    status: 'open',
                    createdAt: new Date().toISOString()
                }
            ]);

            // Initialize collections
            this.setData('collections', []);
            
            // Initialize alerts
            this.setData('alerts', [
                {
                    id: 'ALT-001',
                    type: 'bin_overflow',
                    message: 'Bin DF703-003 is 90% full',
                    priority: 'high',
                    relatedId: 'DF703-003',
                    timestamp: new Date().toISOString(),
                    status: 'active'
                }
            ]);
            
            // Initialize pending registrations with a sample
            this.setData('pendingRegistrations', [
                {
                    id: 'REG-001',
                    userType: 'driver',
                    name: 'Ahmed Ali',
                    username: 'ahmed_driver',
                    email: 'ahmed@example.com',
                    phone: '+974 5678 9012',
                    password: 'driver123',
                    vehicleId: 'DA130-03',
                    license: 'DL-34567',
                    submittedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                    status: 'pending'
                }
            ]);
            
            // Initialize system logs
            this.setData('systemLogs', [
                {
                    id: 'LOG-001',
                    message: 'System initialized',
                    type: 'info',
                    timestamp: new Date().toISOString()
                }
            ]);
            
            // Initialize driver locations
            this.setData('driverLocations', {
                'USR-003': {
                    lat: 25.2854,
                    lng: 51.5310,
                    timestamp: new Date().toISOString()
                }
            });
            
            // Initialize analytics
            this.setData('analytics', {
                totalCollections: 125,
                totalPaperCollected: 2500,
                totalComplaints: 5,
                avgResponseTime: 25,
                citizenSatisfaction: 85,
                costReduction: 20,
                carbonReduction: 15
            });
            
            this.setData('initialized', true);
            this.addSystemLog('System initialized with default data', 'info');
            console.log('Default data initialized successfully');
        } else {
            console.log('Data already initialized');
            // Ensure demo accounts are always available
            this.ensureDemoAccounts();
        }
    }

    // Ensure demo accounts exist
    ensureDemoAccounts() {
        let users = this.getUsers();  // Changed to 'let' instead of 'const'
        const demoUsernames = ['admin', 'manager1', 'driver1', 'driver2'];
        const existingUsernames = users.map(u => u.username);
        
        console.log('🔍 Checking demo accounts...');
        console.log('Current users:', users.length);
        console.log('Existing usernames:', existingUsernames);
        console.log('Expected usernames:', demoUsernames);
        
        // Remove duplicate users (keep only first occurrence of each username)
        const seenUsernames = new Set();
        const uniqueUsers = users.filter(user => {
            if (seenUsernames.has(user.username)) {
                console.log(`🔧 Removing duplicate user: ${user.username} (${user.id})`);
                return false;
            }
            seenUsernames.add(user.username);
            return true;
        });
        
        if (uniqueUsers.length < users.length) {
            console.log(`✅ Removed ${users.length - uniqueUsers.length} duplicate user(s)`);
            this.setData('users', uniqueUsers);
            users = uniqueUsers;  // Now this works because 'users' is declared with 'let'
        }
        
        const demoAccounts = [
            { 
                id: 'USR-001', 
                username: 'admin', 
                password: 'admin123', 
                name: 'Admin User', 
                type: 'admin', 
                email: 'admin@autonautics.com', 
                phone: '+974 1234 5678',
                status: 'active', 
                createdAt: new Date().toISOString() 
            },
            { 
                id: 'USR-002', 
                username: 'manager1', 
                password: 'manager123', 
                name: 'Sarah Manager', 
                type: 'manager', 
                email: 'sarah@autonautics.com', 
                phone: '+974 2345 6789',
                status: 'active', 
                createdAt: new Date().toISOString() 
            },
            { 
                id: 'USR-003', 
                username: 'driver1', 
                password: 'driver123', 
                name: 'John Kirt', 
                type: 'driver', 
                email: 'john.kirt@autonautics.com', 
                phone: '+974 3456 7890',
                vehicleId: 'DA130-01', 
                license: 'DL-12345',
                status: 'active', 
                rating: 5.0,
                createdAt: new Date().toISOString() 
            },
            { 
                id: 'USR-004', 
                username: 'driver2', 
                password: 'driver123', 
                name: 'Mathew Williams', 
                type: 'driver', 
                email: 'mathew.williams@autonautics.com', 
                phone: '+974 4567 8901',
                vehicleId: 'DA130-02', 
                license: 'DL-23456',
                status: 'active', 
                rating: 4.8,
                createdAt: new Date().toISOString() 
            }
        ];
        
        let updated = false;
        demoAccounts.forEach(demo => {
            if (!existingUsernames.includes(demo.username)) {
                users.push(demo);
                updated = true;
                console.log(`Added missing demo account: ${demo.username}`);
            }
        });
        
        if (updated) {
            this.setData('users', users);
            console.log('Demo accounts restored');
        }
    }

    // In-memory fallback when Tracking Prevention or privacy settings block localStorage
    _getMemoryFallback() {
        if (!this._memoryFallback) this._memoryFallback = Object.create(null);
        return this._memoryFallback;
    }

    // Generic data operations
    getData(key) {
        try {
            const data = localStorage.getItem(this.storagePrefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            if (error.name === 'SecurityError' || (error.message && (error.message.indexOf('storage') !== -1 || error.message.indexOf('Tracking') !== -1))) {
                const fallback = this._getMemoryFallback()[this.storagePrefix + key];
                return fallback !== undefined ? fallback : null;
            }
            console.error('Error getting data for key:', key, error);
            return null;
        }
    }

    setData(key, value) {
        try {
            // World-class data integrity: normalize bins on write so calibration and schema are consistent everywhere
            if (key === 'bins' && Array.isArray(value)) {
                value = value.map(b => this.normalizeBin(b));
            }
            
            const storageKey = this.storagePrefix + key;
            const jsonValue = JSON.stringify(value);
            localStorage.setItem(storageKey, jsonValue);
            
            // CRITICAL: Verify write succeeded immediately
            const readBack = localStorage.getItem(storageKey);
            if (readBack !== jsonValue) {
                console.error(`❌ CRITICAL: setData FAILED for ${key}! Write verification mismatch!`);
                console.error(`   Written length: ${jsonValue.length}, Read back length: ${readBack ? readBack.length : 'null'}`);
                return false;
            }
            this._getMemoryFallback()[storageKey] = value;
            return true;
        } catch (error) {
            if (error.name === 'SecurityError' || (error.message && (error.message.indexOf('storage') !== -1 || error.message.indexOf('Tracking') !== -1))) {
                try {
                    this._getMemoryFallback()[this.storagePrefix + key] = value;
                    return true;
                } catch (e) {}
            }
            console.error('Error setting data for key:', key, error);
            return false;
        }
    }

    /**
     * Normalize a bin for data integrity: preserve all keys, validate/coerce critical fields.
     * Ensures sensorDistanceEmptyCm / sensorDistanceFullCm (calibration) persist across sync and DB.
     */
    normalizeBin(bin) {
        if (!bin || typeof bin !== 'object') return bin;
        const b = { ...bin };
        if (b.id != null) b.id = String(b.id);
        if (b.lat != null) b.lat = Number(b.lat);
        if (b.lng != null) b.lng = Number(b.lng);
        const fill = b.fillLevel != null ? Number(b.fillLevel) : (b.fill != null ? Number(b.fill) : null);
        if (fill != null && !isNaN(fill)) {
            b.fillLevel = Math.round(Math.max(0, Math.min(100, fill)) * 10) / 10; // 1 decimal (no long decimals)
            b.fill = b.fillLevel;
        }
        // Preserve and validate calibration (distance in cm: empty = 0% fill, full = 100% fill)
        if (b.sensorDistanceEmptyCm != null && b.sensorDistanceEmptyCm !== '') {
            const v = Number(b.sensorDistanceEmptyCm);
            b.sensorDistanceEmptyCm = !isNaN(v) && v >= 0 && v <= 1000 ? v : 200;
        }
        if (b.sensorDistanceFullCm != null && b.sensorDistanceFullCm !== '') {
            const v = Number(b.sensorDistanceFullCm);
            b.sensorDistanceFullCm = !isNaN(v) && v >= 0 && v <= 1000 ? v : 0;
        }
        return b;
    }

    // User Management
    getUsers() {
        return this.getData('users') || [];
    }

    // Get all drivers
    getDrivers() {
        return this.getUsers().filter(u => u.type === 'driver') || [];
    }

    getUserById(userId) {
        const users = this.getUsers();
        return users.find(u => u.id === userId);
    }

    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username);
    }

    addUser(user) {
        const users = this.getUsers();
        user.id = user.id || this.generateId('USR');
        user.createdAt = new Date().toISOString();
        user.status = user.status || 'pending';
        users.push(user);
        this.setData('users', users);
        this.addSystemLog(`New user registered: ${user.name}`, 'info');
        console.log('User added:', user);
        return user;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            this.setData('users', users);
            console.log('📝 User updated locally:', users[index]);
            
            // Also sync to server if it's a driver
            if (users[index].type === 'driver') {
                this.syncDriverToServer(userId, updates);
            }
            
            return users[index];
        }
        console.log('User not found for update:', userId);
        return null;
    }

    // Sync driver data to server
    async syncDriverToServer(driverId, userData) {
        try {
            const response = await fetch(`/api/driver/${driverId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Driver data synced to server via dataManager:', result.message);
            } else {
                console.error('❌ Failed to sync driver data to server via dataManager:', response.status);
            }
        } catch (error) {
            console.error('❌ Error syncing driver data to server via dataManager:', error);
        }
    }

    // Bin Management
    getBins() {
        return this.getData('bins') || [];
    }

    getBinById(binId) {
        const bins = this.getBins();
        return bins.find(b => b.id === binId);
    }

    addBin(bin) {
        const bins = this.getBins();
        bin.id = bin.id || this.generateId('BIN');
        bin.createdAt = new Date().toISOString();
        bin.fill = bin.fill || 0;
        bin.status = 'normal';
        bin.lastCollection = 'Never';
        bin.temperature = 25;
        bin.batteryLevel = 100;
        bin.signalStrength = -70;
        bin.sensorStatus = 'active';
        
        // Ensure coordinates are set
        if (!bin.lat || !bin.lng) {
            console.warn(`⚠️ Bin ${bin.id} added without coordinates - will not appear on map`);
        }
        
        bins.push(bin);
        this.setData('bins', bins);
        this.addSystemLog(`New bin added: ${bin.id} at ${bin.location}`, 'info');
        console.log('Bin added:', bin);
        
        // Trigger map refresh if map is available
        setTimeout(() => {
            // Dispatch custom event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('bin:added', { 
                    detail: { binId: bin.id, bin: bin } 
                }));
            }
            
            if (typeof mapManager !== 'undefined' && mapManager.map && mapManager.loadBinsOnMap) {
                console.log(`🔄 Refreshing map after adding bin ${bin.id}...`);
                mapManager.loadBinsOnMap();
            }
            if (typeof window.forceRefreshBinsOnMap === 'function') {
                window.forceRefreshBinsOnMap();
            }
        }, 300);
        
        return bin;
    }

    /**
     * Get display string for bin location (so label updates when sensor/GPS moves bin to new area).
     * Prefers: location.address, locationName, then coordinates if location is object, then bin.location string.
     */
    getBinLocationDisplay(bin) {
        if (!bin) return '—';
        const loc = bin.location;
        if (loc && typeof loc === 'object' && loc.address) return loc.address;
        if (bin.locationName) return bin.locationName;
        if (typeof loc === 'string') return loc;
        if (bin.lat != null && bin.lng != null && !isNaN(Number(bin.lat)) && !isNaN(Number(bin.lng))) {
            return Number(bin.lat).toFixed(4) + ', ' + Number(bin.lng).toFixed(4);
        }
        return '—';
    }

    updateBin(binIdOrBinObject, updates) {
        // Handle both signatures: updateBin(binId, updates) OR updateBin(binObject)
        let binId, finalUpdates;
        if (typeof binIdOrBinObject === 'object' && binIdOrBinObject !== null && binIdOrBinObject.id) {
            // Called with updateBin(binObject) - extract id and use whole object as updates
            binId = binIdOrBinObject.id;
            finalUpdates = binIdOrBinObject;
            console.log(`🔧 updateBin called with bin object: ${binId}`);
        } else if (typeof binIdOrBinObject === 'string') {
            // Normal call: updateBin(binId, updates)
            binId = binIdOrBinObject;
            finalUpdates = updates || {};
        } else {
            console.error(`❌ updateBin called with invalid parameter type:`, typeof binIdOrBinObject, binIdOrBinObject);
            return null;
        }
        
        const bins = this.getBins();
        const index = bins.findIndex(b => b.id === binId);
        if (index !== -1) {
            const oldBin = { ...bins[index] };
            console.log(`🔧 updateBin ${binId}: BEFORE - fill=${oldBin.fill}%, status=${oldBin.status}`);
            bins[index] = { ...bins[index], ...finalUpdates, lastUpdated: new Date().toISOString() };
            console.log(`🔧 updateBin ${binId}: AFTER - fill=${bins[index].fill}%, status=${bins[index].status}, updates=`, finalUpdates);
            
            // Add to bin history if this is a significant change (use finalUpdates, not updates!)
            if (finalUpdates.fill !== undefined || finalUpdates.lastCollection !== undefined) {
                this.addBinHistoryEntry(binId, {
                    previousFill: oldBin.fill,
                    newFill: bins[index].fill,
                    action: finalUpdates.lastCollection ? 'collection' : 'sensor_update',
                    timestamp: new Date().toISOString(),
                    collectedBy: finalUpdates.collectedBy || null,
                    batteryLevel: bins[index].batteryLevel,
                    temperature: bins[index].temperature
                });
            }
            
            // Check for alerts
            if (bins[index].fill >= 85) {
                bins[index].status = 'critical';
                this.addAlert('bin_overflow', `Bin ${binId} is ${bins[index].fill}% full`, 'high', binId);
            } else if (bins[index].fill >= 70) {
                bins[index].status = 'warning';
            } else {
                bins[index].status = 'normal';
            }
            
            // Check temperature
            if (bins[index].temperature > 60) {
                bins[index].status = 'fire-risk';
                this.addAlert('fire_risk', `High temperature detected at bin ${binId}: ${bins[index].temperature}C`, 'critical', binId);
            }
            
            this.setData('bins', bins);
            console.log(`✅ updateBin ${binId}: setData called, verifying...`);
            const verified = this.getBinById(binId);
            console.log(`✅ Verification: getBinById(${binId}) returns fill=${verified ? verified.fill : 'NOT_FOUND'}%`);

            // Automatic collection %: when bin fill changes, update the most recent collection's fillAfter and collectedPercent
            const newFill = bins[index].fill ?? bins[index].fillLevel;
            if ((finalUpdates.fill !== undefined || finalUpdates.fillLevel !== undefined) && typeof newFill === 'number') {
                this.updateCollectionWithSensorFill(binId, newFill);
            }

            // World-class: notify map so marker icon (fill %) stays in sync for any update (sync, admin, sensor, future)
            if (typeof window !== 'undefined' && bins[index] && (finalUpdates.fill !== undefined || finalUpdates.fillLevel !== undefined || finalUpdates.sensorData !== undefined)) {
                window.dispatchEvent(new CustomEvent('bin:updated', { detail: { binId, fill: bins[index].fill } }));
            }
            return bins[index];
        }
        console.error(`❌ updateBin ${binId}: BIN NOT FOUND in array of ${bins.length} bins`);
        return null;
    }

    deleteBin(binId, deletedBy = null) {
        let bins = this.getBins();
        bins = bins.filter(b => b.id !== binId);
        this.setData('bins', bins);
        const logMsg = deletedBy
            ? `Bin ${binId} removed by admin: ${deletedBy}`
            : `Bin removed: ${binId}`;
        this.addSystemLog(logMsg, 'warning');
        console.log('Bin deleted:', binId, deletedBy ? `(by ${deletedBy})` : '');
    }

    // Sensor Management
    getSensors() {
        return this.getData('sensors') || [];
    }

    getSensorByImei(imei) {
        const sensors = this.getSensors();
        return sensors.find(s => s.imei === imei);
    }

    getSensorsByBinId(binId) {
        const sensors = this.getSensors();
        return sensors.filter(s => s.binId === binId);
    }

    addSensor(sensor) {
        const sensors = this.getSensors();
        sensor.createdAt = sensor.createdAt || new Date().toISOString();
        sensor.status = sensor.status || 'active';
        
        // Check if sensor with same IMEI already exists
        const existingIndex = sensors.findIndex(s => s.imei === sensor.imei);
        if (existingIndex >= 0) {
            // Update existing sensor
            sensors[existingIndex] = { ...sensors[existingIndex], ...sensor };
            console.log('📡 Sensor updated:', sensor.imei);
        } else {
            // Add new sensor
            sensors.push(sensor);
            console.log('📡 Sensor added:', sensor.imei);
        }
        
        this.setData('sensors', sensors);
        return sensor;
    }

    updateSensor(imei, updates) {
        const sensors = this.getSensors();
        const index = sensors.findIndex(s => s.imei === imei);
        if (index !== -1) {
            sensors[index] = { ...sensors[index], ...updates, lastUpdate: new Date().toISOString() };
            this.setData('sensors', sensors);
            console.log('📡 Sensor updated:', imei);
            return sensors[index];
        }
        return null;
    }

    linkSensorToBin(imei, binId) {
        // Update sensor
        const sensor = this.updateSensor(imei, { binId });
        
        // Update bin to include sensor reference
        if (sensor) {
            const bin = this.getBinById(binId);
            if (bin) {
                this.updateBin(binId, { 
                    sensorIMEI: imei, 
                    hasSensor: true 
                });
                console.log(`🔗 Linked sensor ${imei} to bin ${binId}`);
            }
        }
        
        return sensor;
    }

    unlinkSensorFromBin(imei) {
        const sensor = this.getSensorByImei(imei);
        if (sensor && sensor.binId) {
            const binId = sensor.binId;
            
            // Update bin to remove sensor reference
            this.updateBin(binId, { 
                sensorIMEI: null, 
                hasSensor: false 
            });
            
            // Update sensor
            this.updateSensor(imei, { binId: null });
            
            console.log(`🔓 Unlinked sensor ${imei} from bin ${binId}`);
        }
    }

    // Route Management
    getRoutes() {
        return this.getData('routes') || [];
    }

    addRoute(route) {
        const routes = this.getRoutes();
        route.id = this.generateId('RTE');
        route.createdAt = new Date().toISOString();
        route.status = route.status || 'pending';
        routes.push(route);
        this.setData('routes', routes);
        console.log('Route added:', route);
        return route;
    }

    updateRoute(routeId, updates) {
        const routes = this.getRoutes();
        const index = routes.findIndex(r => r.id === routeId);
        if (index !== -1) {
            routes[index] = { ...routes[index], ...updates };
            this.setData('routes', routes);
            console.log('Route updated:', routes[index]);
            return routes[index];
        }
        return null;
    }

    deleteRoute(routeId) {
        const routes = this.getRoutes();
        const index = routes.findIndex(r => r.id === routeId);
        if (index === -1) return null;
        const removed = routes.splice(index, 1)[0];
        this.setData('routes', routes);
        console.log('Route deleted:', routeId);
        return removed;
    }

    getDriverRoutes(driverId) {
        const routes = this.getRoutes();
        const filteredRoutes = routes.filter(r => r.driverId === driverId && r.status !== 'completed' && r.status !== 'cancelled');
        console.log(`📋 Found ${filteredRoutes.length} active routes for driver ${driverId} out of ${routes.length} total routes`);
        return filteredRoutes;
    }

    // Bin History Management
    getBinHistory(binId) {
        const allHistory = this.getData('binHistory') || {};
        return allHistory[binId] || [];
    }

    addBinHistoryEntry(binId, entry) {
        const allHistory = this.getData('binHistory') || {};
        if (!allHistory[binId]) {
            allHistory[binId] = [];
        }
        
        entry.id = this.generateId('BH');
        entry.timestamp = entry.timestamp || new Date().toISOString();
        allHistory[binId].unshift(entry); // Add to beginning for newest first
        
        // Keep only last 50 entries per bin
        if (allHistory[binId].length > 50) {
            allHistory[binId] = allHistory[binId].slice(0, 50);
        }
        
        this.setData('binHistory', allHistory);
        // Logging reduced for performance
        return entry;
    }

    getAllBinHistory() {
        return this.getData('binHistory') || {};
    }

    // Collection Management
    getCollections() {
        return this.getData('collections') || [];
    }

    /**
     * When bin fill is updated (e.g. from sensor), update the most recent collection for this bin
     * with fillAfter and collectedPercent = fillBefore - fillAfter (automatic % registration).
     * Lookback: 2 hours so we match the collection that just happened.
     */
    updateCollectionWithSensorFill(binId, newFill) {
        const collections = this.getCollections();
        const now = Date.now();
        const lookbackMs = 2 * 60 * 60 * 1000; // 2 hours
        const forBin = collections
            .filter(c => c.binId === binId && (now - new Date(c.timestamp).getTime()) <= lookbackMs)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (forBin.length === 0) return;
        const c = forBin[0];
        const fillBefore = c.fillBefore ?? c.originalFill ?? 0;
        const fillAfterNum = typeof newFill === 'number' ? newFill : parseFloat(newFill);
        if (isNaN(fillAfterNum)) return;
        c.fillAfter = fillAfterNum;
        c.collectedPercent = Math.max(0, Math.min(100, Math.round((fillBefore - fillAfterNum) * 10) / 10));
        // World-class: for pending_sensor collections, set verification from sensor
        if (c.collectionVerification === 'pending_sensor') {
            const SENSOR_EMPTY_THRESHOLD = 15; // treat as "emptied" if sensor reports <= 15%
            if (fillAfterNum <= SENSOR_EMPTY_THRESHOLD) {
                c.verifiedBySensor = true;
                c.collectionVerification = 'sensor_verified';
            } else {
                c.verifiedBySensor = false;
                c.sensorRejectedClaim = true; // driver claimed collection but sensor still shows fill
                c.collectionVerification = 'sensor_rejected';
            }
        }
        this.setData('collections', collections);
    }

    /**
     * Record a collection: bin emptied by a driver.
     * Works for both assigned-route and ad-hoc (unassigned) collections.
     * When a driver collects a bin not on their route, pass routeId: null / routeName: 'Direct Collection';
     * the collection is still stored to this driver and synced immediately.
     */
    addCollection(collection) {
        const collections = this.getCollections();
        collection.id = this.generateId('COL');
        collection.timestamp = new Date().toISOString();
        collection.completedAt = collection.completedAt || collection.timestamp;
        collection.status = 'completed';
        if (collection.routeId == null || collection.routeId === undefined) {
            collection.adHoc = true;
            collection.routeName = collection.routeName || 'Direct Collection (unassigned bin)';
        }
        
        // Get current bin data for better collection recording
        const currentBin = this.getBinById(collection.binId);
        if (currentBin) {
            // Ensure we always have meaningful data
            collection.originalFill = collection.originalFill ?? currentBin.fill ?? 75; // Default to 75% if no data
            collection.temperature = collection.temperature || currentBin.temperature || 22; // Default temp
            collection.binLocation = collection.binLocation || currentBin.location;
            collection.weight = collection.weight || Math.round((collection.originalFill * 0.6)); // Estimate weight from fill
        } else {
            // Fallback values if bin not found
            collection.originalFill = collection.originalFill || 75;
            collection.temperature = collection.temperature || 22;
            collection.weight = collection.weight || 45;
        }
        // Automatic % collected: fill before collection; fillAfter set when sensor updates (see updateCollectionWithSensorFill)
        collection.fillBefore = collection.fillBefore ?? collection.originalFill;
        collection.fillAfter = collection.fillAfter ?? null;
        collection.collectedPercent = collection.collectedPercent ?? null;

        // World-class: bins WITH sensor — do NOT set fill to 0 until sensor confirms (prevents fake "31% → 0%" when driver didn't empty)
        const binForSensorCheck = this.getBinById(collection.binId);
        const hasSensor = binForSensorCheck && (binForSensorCheck.sensorIMEI || binForSensorCheck.hasSensor || (this.getSensorsByBinId(collection.binId).length > 0));
        if (hasSensor) {
            collection.verifiedBySensor = false;
            collection.collectionVerification = 'pending_sensor'; // will become 'sensor_verified' or 'sensor_rejected' when sensor updates
        } else {
            collection.verifiedBySensor = null; // no sensor to verify
            collection.collectionVerification = 'no_sensor';
        }

        collections.push(collection);
        this.setData('collections', collections);

        if (hasSensor) {
            // Do NOT set bin fill to 0 — wait for sensor to report. Only update metadata.
            console.log(`📦 addCollection: Bin ${collection.binId} has sensor — waiting for sensor to confirm fill (not setting to 0%).`);
            const updatedBin = this.updateBin(collection.binId, {
                lastCollection: new Date().toLocaleString(),
                collectedBy: collection.driverName || collection.driverId,
                status: 'normal'
                // fill/fillLevel left unchanged — sensor will update when bin is actually emptied
            });
            if (updatedBin) {
                if (!window._recentlyCollectedBins) window._recentlyCollectedBins = {};
                window._recentlyCollectedBins[collection.binId] = { timestamp: Date.now(), fill: updatedBin.fill };
            }
        } else {
            // No sensor: trust driver, set fill to 0
            console.log(`📦 addCollection: Resetting bin ${collection.binId} fill to 0% (no sensor).`);
            const updatedBin = this.updateBin(collection.binId, {
                fill: 0,
                fillLevel: 0,
                lastCollection: new Date().toLocaleString(),
                collectedBy: collection.driverName || collection.driverId,
                status: 'normal'
            });
            if (updatedBin) {
                if (!window._recentlyCollectedBins) window._recentlyCollectedBins = {};
                window._recentlyCollectedBins[collection.binId] = { timestamp: Date.now(), fill: 0 };
            }
        }

        // Route completion protection (same for both paths)
        if (!window._recentlyCompletedRoutes) window._recentlyCompletedRoutes = {};
        const routes = this.getRoutes().filter(r =>
            r.driverId === collection.driverId &&
            (r.bins?.includes(collection.binId) || r.binIds?.includes(collection.binId) || r.binDetails?.some(b => b.id === collection.binId))
        );
        routes.forEach(route => {
            if (route.status === 'completed') {
                window._recentlyCompletedRoutes[route.id] = { timestamp: Date.now(), status: 'completed' };
            }
        });
        
        // Update analytics
        this.updateAnalytics('collection', collection);
        
        // Add to driver history (include autoCollection and collectedPercent when set)
        this.addDriverHistoryEntry(collection.driverId, {
            action: 'collection',
            binId: collection.binId,
            binLocation: collection.binLocation,
            weight: collection.weight,
            originalFill: collection.originalFill,
            fillBefore: collection.fillBefore,
            fillAfter: collection.fillAfter,
            collectedPercent: collection.collectedPercent,
            temperature: collection.temperature,
            timestamp: collection.timestamp,
            vehicleId: collection.vehicleId,
            route: collection.routeId || 'Direct Collection',
            routeName: collection.routeName,
            autoCollection: !!collection.autoCollection
        });
        
        this.addSystemLog(`Collection completed: ${collection.binId} by ${collection.driverId}${collection.adHoc ? ' (ad-hoc)' : ''}${collection.autoCollection ? ' (auto)' : ''}`, 'success');
        console.log('Collection added:', collection);
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('collectionRecorded', { detail: { collection, adHoc: !!collection.adHoc, autoCollection: !!collection.autoCollection } }));
            const binNow = this.getBinById(collection.binId);
            window.dispatchEvent(new CustomEvent('bin:updated', { detail: { binId: collection.binId, fill: binNow ? binNow.fill : (hasSensor ? collection.fillBefore : 0) } }));
        }
        return collection;
    }

    getTodayCollections() {
        const collections = this.getCollections();
        const today = new Date().toDateString();
        return collections.filter(c => new Date(c.timestamp).toDateString() === today);
    }

    getDriverCollections(driverId) {
        const collections = this.getCollections();
        return collections.filter(c => c.driverId === driverId);
    }

    // Driver History Management
    getDriverHistory(driverId) {
        const allHistory = this.getData('driverHistory') || {};
        return allHistory[driverId] || [];
    }

    addDriverHistoryEntry(driverId, entry) {
        const allHistory = this.getData('driverHistory') || {};
        if (!allHistory[driverId]) {
            allHistory[driverId] = [];
        }
        
        entry.id = this.generateId('DH');
        entry.timestamp = entry.timestamp || new Date().toISOString();
        allHistory[driverId].unshift(entry); // Add to beginning for newest first
        
        // Keep only last 100 entries per driver
        if (allHistory[driverId].length > 100) {
            allHistory[driverId] = allHistory[driverId].slice(0, 100);
        }
        
        this.setData('driverHistory', allHistory);
        console.log(`Driver history entry added for ${driverId}:`, entry);
        return entry;
    }

    getAllDriverHistory() {
        return this.getData('driverHistory') || {};
    }

    // Complaint Management
    getComplaints() {
        return this.getData('complaints') || [];
    }

    addComplaint(complaint) {
        const complaints = this.getComplaints();
        complaint.id = this.generateId('CMP');
        complaint.createdAt = new Date().toISOString();
        complaint.status = 'open';
        complaints.push(complaint);
        this.setData('complaints', complaints);
        this.addSystemLog(`New complaint: ${complaint.type} at ${complaint.location}`, 'warning');
        console.log('Complaint added:', complaint);
        return complaint;
    }

    updateComplaint(complaintId, updates) {
        const complaints = this.getComplaints();
        const index = complaints.findIndex(c => c.id === complaintId);
        if (index !== -1) {
            complaints[index] = { ...complaints[index], ...updates };
            this.setData('complaints', complaints);
            console.log('Complaint updated:', complaints[index]);
            return complaints[index];
        }
        return null;
    }

    getActiveComplaints() {
        const complaints = this.getComplaints();
        return complaints.filter(c => c.status !== 'resolved');
    }

    // Alert Management
    getAlerts() {
        return this.getData('alerts') || [];
    }

    addAlert(type, message, priority, relatedId = null) {
        const alerts = this.getAlerts();
        
        // DUPLICATE PREVENTION: Check if similar active alert exists within last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const existingAlert = alerts.find(a => 
            a.type === type && 
            a.relatedId === relatedId && 
            a.status === 'active' &&
            a.timestamp > fiveMinutesAgo
        );
        
        if (existingAlert) {
            // Update existing alert timestamp instead of creating duplicate
            existingAlert.timestamp = new Date().toISOString();
            existingAlert.message = message;
            this.setData('alerts', alerts);
            return existingAlert;
        }
        
        const alert = {
            id: this.generateId('ALT'),
            type,
            message,
            priority,
            relatedId,
            timestamp: new Date().toISOString(),
            status: 'active'
        };
        alerts.push(alert);
        this.setData('alerts', alerts);
        // Logging reduced for performance
        return alert;
    }

    getActiveAlerts() {
        const alerts = this.getAlerts();
        return alerts.filter(a => a.status === 'active');
    }

    dismissAlert(alertId) {
        const alerts = this.getAlerts();
        const index = alerts.findIndex(a => a.id === alertId);
        if (index !== -1) {
            alerts[index].status = 'dismissed';
            this.setData('alerts', alerts);
            console.log('Alert dismissed:', alertId);
        }
    }

    // Registration Management - Fixed
    getPendingRegistrations() {
        const registrations = this.getData('pendingRegistrations') || [];
        // Filter out any that have been there too long (optional)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return registrations.filter(r => 
            r.status === 'pending' && 
            new Date(r.submittedAt) > thirtyDaysAgo
        );
    }

    addPendingRegistration(registration) {
        const pending = this.getData('pendingRegistrations') || [];
        registration.id = this.generateId('REG');
        registration.submittedAt = new Date().toISOString();
        registration.status = 'pending';
        pending.push(registration);
        this.setData('pendingRegistrations', pending);
        this.addSystemLog(`New registration pending: ${registration.name} (${registration.userType})`, 'info');
        console.log('Pending registration added:', registration);
        return registration;
    }

    // Enhanced Driver Location Management
    updateDriverLocation(driverId, latitude, longitude, additionalData = {}) {
        const locations = this.getData('driverLocations') || {};
        const previousLocation = locations[driverId];
        
        // Calculate speed if previous location exists
        let speed = 0;
        if (previousLocation) {
            const distance = this.calculateDistance(
                previousLocation.lat, previousLocation.lng,
                latitude, longitude
            );
            const timeDiff = (new Date() - new Date(previousLocation.timestamp)) / 1000 / 3600; // hours
            speed = timeDiff > 0 ? distance / timeDiff : 0; // km/h
        }
        
        const nowIso = new Date().toISOString();
        locations[driverId] = {
            lat: latitude,
            lng: longitude,
            timestamp: additionalData.timestamp || nowIso,
            lastUpdate: nowIso,
            speed: Math.round(speed * 100) / 100, // Round to 2 decimal places
            accuracy: additionalData.accuracy || null,
            heading: additionalData.heading || null,
            altitude: additionalData.altitude || null,
            previousLocation: previousLocation || null
        };
        
        this.setData('driverLocations', locations);
        
        // Update driver status based on movement
        this.updateDriverMovementStatus(driverId, speed);
        
        // Log location update
        this.addSystemLog(`Driver ${driverId} location updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${speed.toFixed(1)} km/h)`, 'info');
        
        return locations[driverId];
    }

    getDriverLocation(driverId) {
        const locations = this.getData('driverLocations') || {};
        return locations[driverId];
    }

    // Set driver location (alias for updateDriverLocation for compatibility)
    setDriverLocation(driverId, locationData) {
        const locations = this.getData('driverLocations') || {};
        
        // If locationData has lat/lng, use updateDriverLocation
        if (locationData.lat && locationData.lng) {
            return this.updateDriverLocation(driverId, locationData.lat, locationData.lng, locationData);
        }
        
        // Otherwise, directly set the location data
        locations[driverId] = {
            ...locationData,
            timestamp: locationData.timestamp || new Date().toISOString(),
            lastUpdate: locationData.lastUpdate || new Date().toISOString()
        };
        
        this.setData('driverLocations', locations);
        
        console.log(`📍 Driver ${driverId} location set:`, locations[driverId]);
        return locations[driverId];
    }

    getAllDriverLocations() {
        return this.getData('driverLocations') || {};
    }

    // Update driver movement status based on speed
    updateDriverMovementStatus(driverId, speed) {
        const users = this.getUsers();
        const driverIndex = users.findIndex(u => u.id === driverId);
        
        if (driverIndex !== -1) {
            const driver = users[driverIndex];
            let movementStatus = 'stationary';
            
            if (speed > 0.5) movementStatus = 'moving';
            if (speed > 30) movementStatus = 'driving';
            if (speed > 80) movementStatus = 'highway';
            
            // Update driver with movement status
            users[driverIndex] = {
                ...driver,
                movementStatus,
                lastSpeed: speed,
                lastLocationUpdate: new Date().toISOString()
            };
            
            this.setData('users', users);
        }
    }

    // Get drivers within a radius of a location
    getDriversNearLocation(lat, lng, radiusKm = 5) {
        const drivers = this.getUsers().filter(u => u.type === 'driver');
        const locations = this.getAllDriverLocations();
        
        return drivers.filter(driver => {
            const location = locations[driver.id];
            if (!location) return false;
            
            const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
            return distance <= radiusKm;
        }).map(driver => ({
            ...driver,
            location: locations[driver.id],
            distance: this.calculateDistance(lat, lng, locations[driver.id].lat, locations[driver.id].lng)
        })).sort((a, b) => a.distance - b.distance);
    }

    // Get driver activity summary
    getDriverActivitySummary(driverId, days = 7) {
        const collections = this.getDriverCollections(driverId);
        const routes = this.getDriverRoutes(driverId);
        const location = this.getDriverLocation(driverId);
        
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const recentCollections = collections.filter(c => new Date(c.timestamp) > cutoffDate);
        
        return {
            driverId,
            totalCollections: recentCollections.length,
            pendingRoutes: routes.length,
            currentLocation: location,
            averageCollectionsPerDay: Math.round((recentCollections.length / days) * 100) / 100,
            lastActive: location ? location.timestamp : null,
            movementStatus: this.getUsers().find(u => u.id === driverId)?.movementStatus || 'unknown'
        };
    }

    // World-class: real team averages from actual driver data (for benchmarking)
    getTeamDriverMetrics(driverIdExclude = null) {
        const users = this.getUsers() || [];
        const drivers = users.filter(u => u.type === 'driver' && (!driverIdExclude || u.id !== driverIdExclude));
        if (drivers.length === 0) return { avgCollectionsPerDay7d: 0, avgRouteCompletionRate: 0, avgEfficiency: 0, driverCount: 0 };
        const days = 7;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        let totalCollections7d = 0;
        let totalCompletionRate = 0;
        let totalEfficiency = 0;
        const routes = this.getRoutes() || [];
        drivers.forEach(d => {
            const colls = this.getDriverCollections(d.id);
            const last7 = colls.filter(c => new Date(c.timestamp) > cutoff).length;
            totalCollections7d += last7;
            const driverRoutes = routes.filter(r => r.driverId === d.id);
            const completed = driverRoutes.filter(r => r.status === 'completed').length;
            const completionRate = driverRoutes.length > 0 ? completed / driverRoutes.length : 0;
            totalCompletionRate += completionRate;
            const binsInRoutes = driverRoutes.reduce((s, r) => s + (r.binIds?.length || r.bins?.length || r.binDetails?.length || 0), 0);
            const eff = binsInRoutes > 0 ? Math.min(1, colls.length / binsInRoutes) : completionRate;
            totalEfficiency += eff;
        });
        return {
            avgCollectionsPerDay7d: Math.round((totalCollections7d / days / Math.max(1, drivers.length)) * 100) / 100,
            avgRouteCompletionRate: drivers.length > 0 ? totalCompletionRate / drivers.length : 0,
            avgEfficiency: drivers.length > 0 ? totalEfficiency / drivers.length : 0,
            driverCount: drivers.length
        };
    }

    // Complaints linked to driver (by driverId or assignedDriverId if present)
    getDriverComplaintsCount(driverId, days = 30) {
        const complaints = this.getComplaints() || [];
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return complaints.filter(c => {
            const created = new Date(c.createdAt || c.timestamp || 0).getTime();
            if (created < cutoff.getTime()) return false;
            return (c.driverId === driverId) || (c.assignedDriverId === driverId);
        }).length;
    }

    // Analytics Management
    getAnalytics() {
        return this.getData('analytics') || {
            totalCollections: 0,
            totalPaperCollected: 0,
            totalComplaints: 0,
            avgResponseTime: 0,
            citizenSatisfaction: 0,
            costReduction: 0,
            carbonReduction: 0
        };
    }

    updateAnalytics(type, data) {
        const analytics = this.getAnalytics();
        
        switch(type) {
            case 'collection':
                analytics.totalCollections++;
                analytics.totalPaperCollected += data.weight || 50;
                break;
            case 'complaint':
                analytics.totalComplaints++;
                break;
            case 'response':
                // Update average response time
                const currentAvg = analytics.avgResponseTime || 0;
                const count = analytics.totalCollections || 1;
                analytics.avgResponseTime = ((currentAvg * count) + data.responseTime) / (count + 1);
                break;
        }
        
        // Calculate derived metrics
        analytics.citizenSatisfaction = Math.min(100, 100 - (analytics.totalComplaints * 2));
        analytics.costReduction = Math.min(50, analytics.totalCollections * 0.02);
        analytics.carbonReduction = Math.min(60, (analytics.totalPaperCollected / 1000) * 2);
        
        this.setData('analytics', analytics);
        return analytics;
    }

    // System Logs
    getSystemLogs() {
        return this.getData('systemLogs') || [];
    }

    addSystemLog(message, type = 'info') {
        const logs = this.getSystemLogs();
        logs.push({
            id: this.generateId('LOG'),
            message,
            type,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.shift();
        }
        
        this.setData('systemLogs', logs);
    }

    // Utility Functions
    generateId(prefix) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}-${timestamp}-${random}`;
    }

    clearAllData() {
        console.log('Clearing all data...');
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                localStorage.removeItem(key);
            }
        });
        this.initializeDefaultData();
        console.log('All data cleared and reinitialized');
    }
    
    // Fix corrupted user accounts
    fixCorruptedAccounts() {
        console.log('Checking for corrupted accounts...');
        const users = this.getUsers();
        let fixed = false;
        
        users.forEach(user => {
            // Fix invalid status values
            if (!['active', 'inactive', 'pending'].includes(user.status)) {
                console.log(`Fixing corrupted status for ${user.username}: ${user.status} -> active`);
                user.status = 'active';
                fixed = true;
            }
            
            // Ensure required fields exist
            if (!user.type) {
                console.log(`Fixing missing type for ${user.username}`);
                user.type = 'driver'; // Default to driver
                fixed = true;
            }
            
            if (!user.email) {
                console.log(`Adding missing email for ${user.username}`);
                user.email = `${user.username}@autonautics.com`;
                fixed = true;
            }
        });
        
        if (fixed) {
            this.setData('users', users);
            console.log('Corrupted accounts fixed');
        } else {
            console.log('No corrupted accounts found');
        }
        
        return fixed;
    }

    exportData() {
        const data = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                const cleanKey = key.replace(this.storagePrefix, '');
                data[cleanKey] = this.getData(cleanKey);
            }
        });
        return data;
    }

    importData(data) {
        Object.keys(data).forEach(key => {
            this.setData(key, data[key]);
        });
        this.addSystemLog('Data imported successfully', 'success');
        console.log('Data imported successfully');
    }

    // Statistics Functions
    getSystemStats() {
        const users = this.getUsers();
        const bins = this.getBins();
        const activeAlerts = this.getActiveAlerts();
        const pendingRegistrations = this.getPendingRegistrations();
        const todayCollections = this.getTodayCollections();
        const activeComplaints = this.getActiveComplaints();
        
        return {
            totalUsers: users.length,
            totalBins: bins.length,
            activeDrivers: users.filter(u => u.type === 'driver' && u.status === 'active').length,
            activeAlerts: activeAlerts.length,
            pendingRegistrations: pendingRegistrations.length,
            todayCollections: todayCollections.length,
            activeComplaints: activeComplaints.length
        };
    }

    // ML Predictions (Simulated)
    predictBinFillTime(binId) {
        const bin = this.getBinById(binId);
        if (!bin) return null;
        
        // Simple prediction based on current fill rate
        const fillRate = Math.random() * 5 + 2; // 2-7% per hour
        const remainingCapacity = 100 - bin.fill;
        const hoursToFull = remainingCapacity / fillRate;
        
        return {
            hoursToFull: Math.round(hoursToFull),
            fillRate: fillRate.toFixed(1),
            optimalCollection: hoursToFull < 6 ? 'Urgent' : hoursToFull < 24 ? 'Today' : 'Tomorrow'
        };
    }

    optimizeRoutes(driverId) {
        const bins = this.getBins();
        const driverLocation = this.getDriverLocation(driverId);
        
        if (!driverLocation) {
            return [];
        }
        
        // Simple optimization: sort by fill level and distance
        const prioritizedBins = bins
            .filter(b => b.fill >= 70)
            .map(bin => {
                const distance = this.calculateDistance(
                    driverLocation.lat,
                    driverLocation.lng,
                    bin.lat,
                    bin.lng
                );
                const priority = (bin.fill / 100) * 0.7 + (1 / (distance + 1)) * 0.3;
                return { ...bin, distance, priority };
            })
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5);
        
        return prioritizedBins;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Driver Route Management
    addDriverRoute(route) {
        const routes = this.getDriverRoutes(route.driverId);
        routes.push(route);
        localStorage.setItem(`driverRoutes_${route.driverId}`, JSON.stringify(routes));
        return route;
    }
    
    updateDriverRoute(routeId, updates) {
        const allRoutes = this.getAllDriverRoutes();
        const route = allRoutes.find(r => r.id === routeId);
        if (route) {
            Object.assign(route, updates);
            const driverRoutes = allRoutes.filter(r => r.driverId === route.driverId);
            localStorage.setItem(`driverRoutes_${route.driverId}`, JSON.stringify(driverRoutes));
        }
        return route;
    }
    
    getAllDriverRoutes() {
        const drivers = this.getUsers().filter(u => u.type === 'driver');
        let allRoutes = [];
        drivers.forEach(driver => {
            const routes = this.getDriverRoutes(driver.id);
            allRoutes = allRoutes.concat(routes);
        });
        return allRoutes;
    }
    
    getDriverRoutesFromStorage(driverId) {
        const stored = localStorage.getItem(`driverRoutes_${driverId}`);
        const routes = stored ? JSON.parse(stored) : [];
        // Filter out completed routes for consistency
        return routes.filter(r => r.status !== 'completed');
    }
    
    addDriverCollection(driverId, binId) {
        const collections = this.getDriverCollections(driverId);
        collections.push({
            binId,
            timestamp: new Date().toISOString(),
            driverId
        });
        localStorage.setItem(`driverCollections_${driverId}`, JSON.stringify(collections));
        return collections;
    }
    
    getDriverCollections(driverId) {
        const stored = localStorage.getItem(`driverCollections_${driverId}`);
        return stored ? JSON.parse(stored) : [];
    }

    // Vehicle Management
    addVehicle(vehicleData) {
        const vehicles = this.getVehicles();
        
        // Check if vehicle ID already exists
        if (vehicles.find(v => v.id === vehicleData.id)) {
            throw new Error(`Vehicle with ID ${vehicleData.id} already exists`);
        }
        
        // Generate unique ID if not provided
        if (!vehicleData.id) {
            vehicleData.id = this.generateId('VEH');
        }
        
        // Set defaults
        const vehicle = {
            ...vehicleData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        vehicles.push(vehicle);
        this.setData('vehicles', vehicles);
        
        this.addSystemLog(`Vehicle ${vehicle.id} registered`, 'success');
        return vehicle;
    }

    getVehicles() {
        return this.getData('vehicles') || [];
    }

    updateVehicle(vehicleId, updates) {
        const vehicles = this.getVehicles();
        const index = vehicles.findIndex(v => v.id === vehicleId);
        
        if (index === -1) {
            throw new Error(`Vehicle ${vehicleId} not found`);
        }
        
        vehicles[index] = {
            ...vehicles[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.setData('vehicles', vehicles);
        this.addSystemLog(`Vehicle ${vehicleId} updated`, 'info');
        return vehicles[index];
    }

    removeVehicle(vehicleId) {
        const vehicles = this.getVehicles();
        const index = vehicles.findIndex(v => v.id === vehicleId);
        
        if (index === -1) {
            throw new Error(`Vehicle ${vehicleId} not found`);
        }
        
        const removedVehicle = vehicles.splice(index, 1)[0];
        this.setData('vehicles', vehicles);
        
        this.addSystemLog(`Vehicle ${vehicleId} removed`, 'warning');
        return removedVehicle;
    }

    // Enhanced Bin Management
    removeBin(binId) {
        const bins = this.getBins();
        const index = bins.findIndex(b => b.id === binId);
        
        if (index === -1) {
            throw new Error(`Bin ${binId} not found`);
        }
        
        const removedBin = bins.splice(index, 1)[0];
        this.setData('bins', bins);
        
        // Also remove related data
        const collections = this.getCollections().filter(c => c.binId !== binId);
        this.setData('collections', collections);
        
        const binHistory = this.getData('binHistory') || {};
        delete binHistory[binId];
        this.setData('binHistory', binHistory);
        
        this.addSystemLog(`Bin ${binId} removed`, 'warning');
        return removedBin;
    }

    // Issue Management
    addIssue(issueData) {
        const issues = this.getIssues();
        
        // Generate unique ID if not provided
        if (!issueData.id) {
            issueData.id = this.generateId('ISSUE');
        }
        
        // Set defaults
        const issue = {
            status: 'open',
            priority: 'medium',
            assignedTo: null,
            resolvedAt: null,
            resolution: null,
            ...issueData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        issues.push(issue);
        this.setData('issues', issues);
        
        this.addSystemLog(`Issue ${issue.id} reported: ${issue.type}`, 'warning');
        return issue;
    }

    getIssues() {
        return this.getData('issues') || [];
    }

    updateIssue(issueId, updates) {
        const issues = this.getIssues();
        const index = issues.findIndex(i => i.id === issueId);
        
        if (index === -1) {
            throw new Error(`Issue ${issueId} not found`);
        }
        
        issues[index] = {
            ...issues[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        // If issue is being resolved
        if (updates.status === 'resolved' && !issues[index].resolvedAt) {
            issues[index].resolvedAt = new Date().toISOString();
        }
        
        this.setData('issues', issues);
        this.addSystemLog(`Issue ${issueId} updated`, 'info');
        return issues[index];
    }

    removeIssue(issueId) {
        const issues = this.getIssues();
        const index = issues.findIndex(i => i.id === issueId);
        
        if (index === -1) {
            throw new Error(`Issue ${issueId} not found`);
        }
        
        const removedIssue = issues.splice(index, 1)[0];
        this.setData('issues', issues);
        
        this.addSystemLog(`Issue ${issueId} removed`, 'warning');
        return removedIssue;
    }

    // User Management Enhancement
    removeUser(userId) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) {
            throw new Error(`User ${userId} not found`);
        }
        
        const removedUser = users.splice(index, 1)[0];
        this.setData('users', users);
        
        // Clean up related data
        if (removedUser.type === 'driver') {
            // Remove driver from vehicles
            const vehicles = this.getVehicles();
            vehicles.forEach(vehicle => {
                if (vehicle.assignedDriver === userId) {
                    vehicle.assignedDriver = null;
                }
            });
            this.setData('vehicles', vehicles);
            
            // Remove driver history
            const driverHistory = this.getData('driverHistory') || {};
            delete driverHistory[userId];
            this.setData('driverHistory', driverHistory);
        }
        
        this.addSystemLog(`User ${removedUser.username} (${removedUser.type}) removed`, 'warning');
        return removedUser;
    }

    // Error Logging System
    addErrorLog(error, context = {}) {
        const message = error?.message || (error && typeof error === 'object' && error.message) || (error ? error.toString() : 'Unknown error occurred');
        // Skip logging known benign or generic errors (chart, storage, cross-origin script, null addEventListener)
        if (typeof message === 'string' && (
            message.includes('Chart element is not attached to DOM') ||
            (message.includes('Chart element') && message.includes('not attached')) ||
            message === 'Unknown error occurred' ||
            message === 'Script error.' ||
            message.includes('Tracking Prevention') ||
            (message.includes('addEventListener') && message.includes('null')) ||
            (message.includes('querySelector') && message.includes('null'))
        )) {
            return null;
        }
        
        const errorLogs = this.getErrorLogs();
        
        // Safe access to authManager
        let currentUser = null;
        try {
            if (typeof window !== 'undefined' && window.authManager && typeof window.authManager.getCurrentUser === 'function') {
                currentUser = window.authManager.getCurrentUser();
            }
        } catch (e) {
            console.warn('Could not get current user for error logging:', e.message);
        }
        
        const errorLog = {
            id: this.generateId('ERR'),
            message: message,
            stack: error?.stack || 'Stack trace not available',
            context: context || {},
            userId: currentUser?.id || 'unknown',
            userType: currentUser?.type || 'unknown',
            userName: currentUser?.name || 'unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            timestamp: new Date().toISOString()
        };
        
        errorLogs.push(errorLog);
        
        // Keep only last 500 error logs
        if (errorLogs.length > 500) {
            errorLogs.splice(0, errorLogs.length - 500);
        }
        
        this.setData('errorLogs', errorLogs);

        // Send to server so admin can see console errors from all users
        const baseUrl = (typeof syncManager !== 'undefined' && syncManager.baseUrl) ? syncManager.baseUrl.replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
        if (baseUrl) {
            fetch(`${baseUrl}/api/errors/client`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorLog)
            }).catch(() => {});
        }
        
        const msg = errorLog?.message || errorLog?.error || (typeof errorLog === 'string' ? errorLog : (errorLog ? JSON.stringify(errorLog) : 'Unknown'));
        if (msg !== 'Unknown error occurred' && msg !== 'Script error.' && !String(msg).includes('addEventListener') && !String(msg).includes('querySelector')) {
            console.error('Error logged:', msg);
        }
        return errorLog;
    }

    getErrorLogs() {
        return this.getData('errorLogs') || [];
    }

    clearErrorLogs() {
        this.setData('errorLogs', []);
        this.addSystemLog('Error logs cleared', 'info');
    }

    // Enhanced utility function for export/import
    exportSystemData() {
        return {
            users: this.getUsers(),
            bins: this.getBins(),
            vehicles: this.getVehicles(),
            routes: this.getRoutes(),
            collections: this.getCollections(),
            complaints: this.getComplaints(),
            alerts: this.getAlerts(),
            issues: this.getIssues(),
            binHistory: this.getAllBinHistory(),
            driverHistory: this.getAllDriverHistory(),
            analytics: this.getAnalytics(),
            systemLogs: this.getSystemLogs(),
            errorLogs: this.getErrorLogs(),
            exportedAt: new Date().toISOString(),
            exportedBy: (typeof window !== 'undefined' && window.authManager != null && typeof window.authManager.getCurrentUser === 'function') ? (window.authManager.getCurrentUser()?.id || null) : null
        };
    }

    // Trigger data update event for real-time synchronization
    triggerDataUpdate(updateType, updateData) {
        console.log(`📢 Data update triggered: ${updateType}`, updateData);
        
        // Dispatch custom event for other systems to listen to
        const event = new CustomEvent('dataManagerUpdate', {
            detail: {
                type: updateType,
                data: updateData,
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
        
        // Also dispatch specific event type
        const specificEvent = new CustomEvent(`dataUpdate_${updateType}`, {
            detail: updateData
        });
        
        document.dispatchEvent(specificEvent);
        
        console.log(`✅ Data update event dispatched: ${updateType}`);
    }
}

// Create global instance
window.dataManager = new DataManager();

// Global error handler
window.addEventListener('error', function(event) {
    if (window.dataManager && typeof window.dataManager.addErrorLog === 'function') {
        window.dataManager.addErrorLog(event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: 'javascript_error'
        });
    } else {
        console.error('Global error (DataManager not available):', event.error);
    }
});

// Promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    if (window.dataManager && typeof window.dataManager.addErrorLog === 'function') {
        window.dataManager.addErrorLog(event.reason, {
            type: 'unhandled_promise_rejection'
        });
    } else {
        console.error('Unhandled promise rejection (DataManager not available):', event.reason);
    }
});

// Log initialization
console.log('DataManager initialized');

// Utility function to reset demo accounts (can be called from console)
window.resetDemoAccounts = function() {
    console.log('Resetting demo accounts...');
    dataManager.fixCorruptedAccounts();
    dataManager.ensureDemoAccounts();
    console.log('Demo accounts reset successfully!');
    console.log('You can now login with:');
    console.log('Admin: admin / admin123');
    console.log('Manager: manager1 / manager123');  
    console.log('Driver: driver1 / driver123');
};