// database-manager.js - Cloud Database Manager for Production Deployment
// Supports multiple database backends for Vercel deployment

const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');

class DatabaseManager {
    constructor() {
        this.initialized = false;
        this.initializing = false; // Lock to prevent double initialization
        this.initPromise = null; // Store the init promise for waiting
        const rawUri = process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGODB_URL || '';
        this.connectionString = (typeof rawUri === 'string' ? rawUri : String(rawUri || ''))
            .replace(/\uFEFF/g, '')
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/[\r\n]+/g, '')
            .trim() || 'mongodb://localhost:27017';
        if (this.connectionString && (this.connectionString.startsWith('mongodb://') || this.connectionString.startsWith('mongodb+srv://'))) {
            this.dbType = process.env.DATABASE_TYPE || process.env.DB_TYPE || 'mongodb';
        } else {
            this.dbType = process.env.DATABASE_TYPE || process.env.DB_TYPE || 'json';
        }
        const rawDb = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'waste_management';
        this.databaseName = (typeof rawDb === 'string' ? rawDb : String(rawDb || '')).trim().replace(/^["']|["']$/g, '') || 'waste_management';
        this.mongoClient = null;
        this.mongoDb = null;
        this.fallbackStorage = new Map(); // In-memory fallback
        this.syncInterval = null;
        this.lastSync = null;
        this.dataFilePath = path.join(__dirname, 'data.json'); // File for persistent storage
    }

    async initialize() {
        // Prevent double initialization
        if (this.initialized) {
            return;
        }
        
        // If already initializing, wait for the existing promise
        if (this.initializing && this.initPromise) {
            return this.initPromise;
        }
        
        // Set lock and create promise
        this.initializing = true;
        this.initPromise = this._doInitialize();
        
        return this.initPromise;
    }
    
    async _doInitialize() {
        try {
            console.log(`🗄️ Initializing database manager (type: ${this.dbType})`);
            
            switch (this.dbType) {
                case 'mongodb':
                    await this.initMongoDB();
                    break;
                case 'postgresql':
                    await this.initPostgreSQL();
                    break;
                case 'json':
                default:
                    await this.initJSONStorage();
                    break;
            }
            
            this.initialized = true;
            this.initializing = false;
            this.startSyncProcess();
            console.log('✅ Database manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            console.log('📦 Falling back to in-memory storage');
            this.initialized = true; // Continue with fallback
            this.initializing = false;
        }
    }

    async initJSONStorage() {
        // For Vercel, we'll use external JSON storage or API
        // This could be connected to services like MongoDB Atlas, Firebase, or custom API
        console.log('📄 Initializing JSON-based storage');
        
        // Initialize default data structure
        this.defaultData = {
            users: this.createDefaultUsers(),
            bins: this.createDefaultBins(),
            routes: [],
            collections: [],
            complaints: [],
            alerts: [],
            pendingRegistrations: [],
            systemLogs: [],
            driverLocations: {},
            analytics: {},
            sensors: [], // Initialize sensors array for persistence
            driverMessages: {}, // Driver–manager communications: { driverId: [messages] }
            chatHistoryAudit: [], // All chat messages app-wide for auditing (MongoDB + JSON)
            deletedBins: [],    // Bin IDs considered deleted (MongoDB-persisted when dbType is mongodb)
            clientErrorLogs: [], // Console errors from all users (admin tracking)
            initialized: true,
            lastUpdate: new Date().toISOString()
        };
        
        // Try to load existing data
        await this.loadInitialData();
    }

    async initMongoDB() {
        try {
            const uri = this.connectionString.trim();
            if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
                throw new Error('Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://". Got: ' + (uri ? uri.substring(0, 30) + '...' : 'empty'));
            }
            console.log('🍃 Initializing MongoDB connection...');
            console.log(`   Connection: ${uri.replace(/\/\/.*@/, '//***@')}`);
            console.log(`   Database: ${this.databaseName}`);
            
            this.mongoClient = new MongoClient(uri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
                maxPoolSize: 10,
                minPoolSize: 2,
            });
            
            await this.mongoClient.connect();
            await this.mongoClient.db('admin').command({ ping: 1 });
            this.mongoDb = this.mongoClient.db(this.databaseName);
            
            // Create indexes for optimal performance
            await this.createMongoIndexes();
            
            // Load initial data from MongoDB
            await this.loadMongoData();
            
            console.log('✅ MongoDB initialized successfully');
        } catch (error) {
            console.error('❌ MongoDB initialization failed:', error.message);
            console.log('📦 Falling back to JSON storage');
            await this.initJSONStorage();
        }
    }

    async createMongoIndexes() {
        try {
            const usersCollection = this.mongoDb.collection('users');
            
            // Check existing indexes to avoid conflicts
            const existingIndexes = await usersCollection.indexes();
            const indexNames = existingIndexes.map(idx => idx.name);
            
            // Drop ALL old auto-generated indexes before creating new ones
            const oldIndexesToDrop = ['id_1', 'username_1', 'email_1', 'type_1', 'status_1'];
            for (const oldIndex of oldIndexesToDrop) {
                if (indexNames.includes(oldIndex)) {
                    try {
                        await usersCollection.dropIndex(oldIndex);
                    } catch (dropErr) {
                        // Ignore if can't drop
                    }
                }
            }
            
            // Users indexes - create with explicit names
            await usersCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_user_id' });
            await usersCollection.createIndex({ username: 1 }, { unique: true, name: 'idx_user_username' });
            await usersCollection.createIndex({ email: 1 }, { unique: true, name: 'idx_user_email' });
            await usersCollection.createIndex({ type: 1 }, { name: 'idx_user_type' });
            
            // Bins indexes (compound lat/lng for bbox range queries; supports 1M+ bins)
            const binsCol = this.mongoDb.collection('bins');
            await binsCol.createIndex({ id: 1 }, { unique: true, name: 'idx_bin_id' });
            await binsCol.createIndex({ lat: 1, lng: 1 }, { name: 'idx_bin_location' });
            await binsCol.createIndex({ status: 1 }, { name: 'idx_bin_status' });
            
            // Routes indexes
            await this.mongoDb.collection('routes').createIndex({ id: 1 }, { unique: true, name: 'idx_route_id' });
            await this.mongoDb.collection('routes').createIndex({ driverId: 1 }, { name: 'idx_route_driver' });
            await this.mongoDb.collection('routes').createIndex({ status: 1 }, { name: 'idx_route_status' });
            
            // Collections indexes
            await this.mongoDb.collection('collections').createIndex({ id: 1 }, { unique: true, name: 'idx_collection_id' });
            await this.mongoDb.collection('collections').createIndex({ binId: 1 }, { name: 'idx_collection_bin' });
            await this.mongoDb.collection('collections').createIndex({ driverId: 1 }, { name: 'idx_collection_driver' });
            
            // Sensors indexes
            await this.mongoDb.collection('sensors').createIndex({ imei: 1 }, { unique: true, sparse: true, name: 'idx_sensor_imei' });
            await this.mongoDb.collection('sensors').createIndex({ binId: 1 }, { name: 'idx_sensor_bin' });
            
            // Driver messages index (for getDriverMessages by driverId)
            try {
                await this.mongoDb.collection('driverMessages').createIndex({ driverId: 1 }, { name: 'idx_driver_messages_driver' });
            } catch (e) { /* ignore if exists */ }

            // Client console errors (all users) for admin tracking
            try {
                await this.mongoDb.collection('clientErrorLogs').createIndex({ timestamp: -1 }, { name: 'idx_client_errors_time' });
                await this.mongoDb.collection('clientErrorLogs').createIndex({ userId: 1 }, { name: 'idx_client_errors_user' });
            } catch (e) { /* ignore if exists */ }

            // Chat history audit (all app chat for auditing)
            try {
                await this.mongoDb.collection('chatHistoryAudit').createIndex({ timestamp: -1 }, { name: 'idx_chat_audit_time' });
                await this.mongoDb.collection('chatHistoryAudit').createIndex({ senderId: 1 }, { name: 'idx_chat_audit_sender' });
                await this.mongoDb.collection('chatHistoryAudit').createIndex({ receiverId: 1 }, { name: 'idx_chat_audit_receiver' });
            } catch (e) { /* ignore if exists */ }
            
            console.log('✅ MongoDB indexes created');
        } catch (error) {
            console.warn('⚠️ Index creation warning:', error.message);
        }
    }

    /** Returns MongoDB connection status for health checks. */
    async getConnectionStatus() {
        if (!this.initialized) {
            try { await this.initialize(); } catch (e) {
                return { ok: false, dbType: this.dbType, error: e.message };
            }
        }
        if (this.dbType === 'mongodb' && this.mongoClient) {
            try {
                await this.mongoClient.db('admin').command({ ping: 1 });
                return { ok: true, dbType: 'mongodb', database: this.databaseName };
            } catch (e) {
                return { ok: false, dbType: 'mongodb', error: e.message };
            }
        }
        return { ok: true, dbType: this.dbType || 'json', database: null };
    }

    /**
     * Get bins with optional bbox (bounding box) and pagination. Scalable for 1M+ bins.
     * @param {Object} opts - { bbox: [minLng, minLat, maxLng, maxLat], limit, offset }
     * @returns {Promise<{ bins: Array, total: number }>}
     */
    async getBins(opts = {}) {
        if (!this.initialized) await this.initialize();
        const limit = Math.min(Number(opts.limit) || 5000, 10000);
        const offset = Math.max(0, Number(opts.offset) || 0);
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('bins');
                const deleted = await this.getDeletedBins();
                let filter = {};
                if (deleted.length > 0) {
                    filter.id = { $nin: deleted };
                }
                if (opts.bbox && Array.isArray(opts.bbox) && opts.bbox.length >= 4) {
                    const [minLng, minLat, maxLng, maxLat] = opts.bbox;
                    filter.lat = { $gte: minLat, $lte: maxLat };
                    filter.lng = { $gte: minLng, $lte: maxLng };
                }
                const cursor = col.find(filter).skip(offset).limit(limit);
                const bins = (await cursor.toArray()).map(doc => {
                    const { _id, migratedAt, migrationVersion, ...rest } = doc;
                    return rest;
                });
                const total = opts.bbox && deleted.length === 0 && offset === 0 && bins.length < limit
                    ? bins.length
                    : await col.countDocuments(filter);
                return { bins, total };
            } catch (e) {
                console.error('getBins error:', e.message);
                const all = await this.getData('bins') || [];
                const bbox = opts.bbox;
                let filtered = deleted.length ? all.filter(b => !deleted.includes(b.id)) : all;
                if (bbox && bbox.length >= 4) {
                    const [minLng, minLat, maxLng, maxLat] = bbox;
                    filtered = filtered.filter(b => b.lat >= minLat && b.lat <= maxLat && b.lng >= minLng && b.lng <= maxLng);
                }
                const total = filtered.length;
                const bins = filtered.slice(offset, offset + limit);
                return { bins, total };
            }
        }
        const all = (await this.getData('bins')) || [];
        const deleted = await this.getDeletedBins();
        let list = deleted.length ? all.filter(b => !deleted.includes(b.id)) : all;
        if (opts.bbox && opts.bbox.length >= 4) {
            const [minLng, minLat, maxLng, maxLat] = opts.bbox;
            list = list.filter(b => b.lat >= minLat && b.lat <= maxLat && b.lng >= minLng && b.lng <= maxLng);
        }
        const total = list.length;
        const bins = list.slice(offset, offset + limit);
        return { bins, total };
    }

    /**
     * Update a single bin by id. No full-sync; use for scalable updates.
     */
    async updateBin(id, updates) {
        if (!this.initialized) await this.initialize();
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('bins');
                const clean = { ...updates };
                delete clean._id;
                await col.updateOne(
                    { id: String(id) },
                    { $set: { ...clean, lastUpdate: new Date().toISOString() } }
                );
                const doc = await col.findOne({ id: String(id) });
                if (!doc) return null;
                const { _id, ...rest } = doc;
                return rest;
            } catch (e) {
                console.error('updateBin error:', e.message);
            }
        }
        const bins = (await this.getData('bins')) || [];
        const idx = bins.findIndex(b => b.id === id);
        if (idx === -1) return null;
        bins[idx] = { ...bins[idx], ...updates, lastUpdate: new Date().toISOString() };
        await this.setData('bins', bins);
        return bins[idx];
    }

    /** Get list of deleted bin IDs (persisted in MongoDB when dbType is mongodb). */
    async getDeletedBins() {
        if (!this.initialized) await this.initialize();
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('deletedBins');
                const doc = await col.findOne({ id: 'list' });
                return Array.isArray(doc?.ids) ? doc.ids : [];
            } catch (e) {
                console.error('getDeletedBins error:', e.message);
                return this.data?.deletedBins || [];
            }
        }
        return Array.isArray(this.data?.deletedBins) ? this.data.deletedBins : [];
    }

    /** Set full list of deleted bin IDs. */
    async setDeletedBins(ids) {
        const list = Array.isArray(ids) ? ids : [];
        if (!this.initialized) await this.initialize();
        if (this.data) {
            this.data.deletedBins = list;
            this.data.lastUpdate = new Date().toISOString();
        }
        this.fallbackStorage.set('deletedBins', list);
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('deletedBins');
                await col.updateOne({ id: 'list' }, { $set: { id: 'list', ids: list, lastUpdate: new Date().toISOString() } }, { upsert: true });
            } catch (e) {
                console.error('setDeletedBins error:', e.message);
            }
        }
        return list;
    }

    /** Add one or more bin IDs to deleted list. */
    async addDeletedBins(toAdd) {
        const add = Array.isArray(toAdd) ? toAdd : [toAdd].filter(Boolean);
        const current = await this.getDeletedBins();
        const set = new Set([...current, ...add]);
        return this.setDeletedBins([...set]);
    }

    async loadMongoData() {
        try {
            this.data = {};
            
            // Load all collections
            const collections = ['users', 'bins', 'routes', 'collections', 'complaints', 'alerts', 'sensors', 'systemLogs', 'pendingRegistrations'];
            
            for (const collectionName of collections) {
                const collection = this.mongoDb.collection(collectionName);
                const documents = await collection.find({}).toArray();
                // Remove MongoDB _id and migration metadata for compatibility
                this.data[collectionName] = documents.map(doc => {
                    const { _id, migratedAt, migrationVersion, ...rest } = doc;
                    return rest;
                });
            }
            
            // Load object-based collections
            const driverLocationsCollection = this.mongoDb.collection('driverLocations');
            const driverLocationsDocs = await driverLocationsCollection.find({}).toArray();
            this.data.driverLocations = {};
            driverLocationsDocs.forEach(doc => {
                if (doc.key && doc.value) {
                    this.data.driverLocations[doc.key] = doc.value;
                }
            });
            
            const analyticsCollection = this.mongoDb.collection('analytics');
            const analyticsDocs = await analyticsCollection.find({}).toArray();
            this.data.analytics = {};
            analyticsDocs.forEach(doc => {
                if (doc.key && doc.value) {
                    this.data.analytics[doc.key] = doc.value;
                }
            });
            
            // Initialize empty arrays if not found
            collections.forEach(col => {
                if (!this.data[col]) {
                    this.data[col] = [];
                }
            });
            
            if (!this.data.driverLocations) this.data.driverLocations = {};
            if (!this.data.analytics) this.data.analytics = {};
            try {
                const deletedCol = this.mongoDb.collection('deletedBins');
                const deletedDoc = await deletedCol.findOne({ id: 'list' });
                this.data.deletedBins = Array.isArray(deletedDoc?.ids) ? deletedDoc.ids : [];
            } catch (e) {
                this.data.deletedBins = [];
            }
            
            this.data.initialized = true;
            this.data.lastUpdate = new Date().toISOString();
            
            console.log(`📊 Loaded data from MongoDB: ${Object.keys(this.data).length} collections`);
        } catch (error) {
            console.error('❌ Failed to load MongoDB data:', error.message);
            // Initialize with defaults
            this.data = {
                users: [],
                bins: [],
                routes: [],
                collections: [],
                complaints: [],
                alerts: [],
                pendingRegistrations: [],
                systemLogs: [],
                driverLocations: {},
                analytics: {},
                sensors: [],
                deletedBins: [],
                initialized: true,
                lastUpdate: new Date().toISOString()
            };
        }
    }

    async initPostgreSQL() {
        // PostgreSQL implementation would go here
        // For now, fall back to JSON storage
        console.log('🐘 PostgreSQL not yet implemented, using JSON storage');
        await this.initJSONStorage();
    }

    async loadInitialData() {
        try {
            console.log(`📂 Looking for data file at: ${this.dataFilePath}`);
            
            // Try to load from file
            try {
                const fileData = await fs.readFile(this.dataFilePath, 'utf8');
                const parsedData = JSON.parse(fileData);
                
                console.log(`✅ Data file found and parsed. Keys: ${Object.keys(parsedData).join(', ')}`);
                
                // Merge with defaults to ensure all required fields exist
                this.data = {
                    ...this.defaultData,
                    ...parsedData,
                    // Ensure sensors array exists
                    sensors: parsedData.sensors || []
                };
                
                console.log(`📊 Loaded data from file: ${Object.keys(this.data).length} keys`);
                if (this.data.sensors) {
                    console.log(`📡 Loaded ${this.data.sensors.length} sensors from file`);
                    if (this.data.sensors.length > 0) {
                        console.log(`   Sensor IMEIs: ${this.data.sensors.map(s => s.imei).join(', ')}`);
                    }
                }
            } catch (fileError) {
                // File doesn't exist or is invalid, use defaults
                if (fileError.code === 'ENOENT') {
                    console.log(`📄 No existing data file at ${this.dataFilePath}, using defaults`);
                } else {
                    console.error(`❌ Error reading data file:`, fileError.message);
                }
                this.data = { ...this.defaultData, sensors: [] };
            }
        } catch (error) {
            console.warn('⚠️ Could not load initial data, using defaults:', error.message);
            this.data = { ...this.defaultData, sensors: [] };
        }
    }

    createDefaultUsers() {
        return [
            {
                id: 'USR-001',
                username: 'admin',
                password: 'admin123',
                name: 'System Administrator',
                email: 'admin@autonautics.com',
                phone: '+974-1234-5678',
                type: 'admin',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                permissions: ['all']
            },
            {
                id: 'USR-002',
                username: 'manager',
                password: 'manager123',
                name: 'Operations Manager',
                email: 'manager@autonautics.com',
                phone: '+974-2345-6789',
                type: 'manager',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                permissions: ['manage_routes', 'view_analytics', 'manage_drivers']
            },
            {
                id: 'USR-003',
                username: 'driver1',
                password: 'driver123',
                name: 'John Kirt',
                email: 'john.kirt@autonautics.com',
                phone: '+974-3456-7890',
                type: 'driver',
                vehicleId: 'VEH-001',
                license: 'QAT-12345',
                status: 'active',
                movementStatus: 'stationary',
                fuelLevel: 85,
                rating: 4.8,
                totalRoutes: 145,
                completedRoutes: 142,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                lastUpdate: new Date().toISOString(),
                currentLocation: { lat: 25.2854, lng: 51.5310 }
            },
            {
                id: 'USR-004',
                username: 'driver2',
                password: 'driver123',
                name: 'Mathew Williams',
                email: 'mathew.williams@autonautics.com',
                phone: '+974-4567-8901',
                type: 'driver',
                vehicleId: 'VEH-002',
                license: 'QAT-67890',
                status: 'active',
                movementStatus: 'moving',
                fuelLevel: 72,
                rating: 4.6,
                totalRoutes: 98,
                completedRoutes: 96,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                lastUpdate: new Date().toISOString(),
                currentLocation: { lat: 25.3548, lng: 51.1839 }
            }
        ];
    }

    createDefaultBins() {
        const locations = [
            { name: 'Souq Waqif', lat: 25.2967, lng: 51.5340 },
            { name: 'Katara Cultural Village', lat: 25.3548, lng: 51.1839 },
            { name: 'The Pearl-Qatar', lat: 25.3716, lng: 51.5378 },
            { name: 'Aspire Park', lat: 25.2631, lng: 51.5241 },
            { name: 'Villaggio Mall', lat: 25.2559, lng: 51.4460 }
        ];

        return locations.map((location, index) => ({
            id: `BIN-${String(index + 1).padStart(3, '0')}`,
            location: location.name,
            lat: location.lat,
            lng: location.lng,
            fill: Math.floor(Math.random() * 100),
            type: Math.random() > 0.5 ? 'paper' : 'general',
            status: Math.random() > 0.8 ? 'needs_attention' : 'normal',
            lastCollection: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            capacity: 100,
            batteryLevel: Math.floor(Math.random() * 100),
            temperature: Math.floor(Math.random() * 10) + 20,
            lastUpdate: new Date().toISOString()
        }));
    }

    // Data access methods
    async getData(key) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.dbType === 'mongodb' && this.mongoDb) {
            return await this.getMongoData(key);
        }
        
        if (this.data && this.data[key] !== undefined) {
            return this.data[key];
        }
        
        return this.fallbackStorage.get(key);
    }

    async getMongoData(key) {
        try {
            // Handle array collections
            const arrayCollections = ['users', 'bins', 'routes', 'collections', 'complaints', 'alerts', 'sensors', 'systemLogs', 'pendingRegistrations'];
            
            if (arrayCollections.includes(key)) {
                const collection = this.mongoDb.collection(key);
                const documents = await collection.find({}).toArray();
                return documents.map(doc => {
                    const { _id, migratedAt, migrationVersion, ...rest } = doc;
                    return rest;
                });
            }
            
            // Handle object collections
            if (key === 'driverLocations' || key === 'analytics') {
                const collection = this.mongoDb.collection(key);
                const documents = await collection.find({}).toArray();
                const result = {};
                documents.forEach(doc => {
                    if (doc.key && doc.value) {
                        result[doc.key] = doc.value;
                    }
                });
                return result;
            }
            
            return this.data?.[key];
        } catch (error) {
            console.error(`❌ Error getting MongoDB data for ${key}:`, error.message);
            return this.data?.[key] || this.fallbackStorage.get(key);
        }
    }

    async setData(key, value) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.dbType === 'mongodb' && this.mongoDb) {
            await this.setMongoData(key, value);
        }
        
        if (this.data) {
            this.data[key] = value;
            this.data.lastUpdate = new Date().toISOString();
        }
        
        this.fallbackStorage.set(key, value);
        
        // Schedule sync to external storage
        this.scheduleSyncToExternal();
    }

    async setMongoData(key, value) {
        try {
            const arrayCollections = ['users', 'vehicles', 'bins', 'routes', 'collections', 'complaints', 'alerts', 'sensors', 'systemLogs', 'pendingRegistrations'];
            
            if (arrayCollections.includes(key) && Array.isArray(value)) {
                const collection = this.mongoDb.collection(key);
                
                // Determine unique field based on collection type
                let uniqueField = 'id';
                if (key === 'sensors') {
                    uniqueField = 'imei';
                }
                
                // SPECIAL CASE: For bins, do full replacement to handle deletions
                if (key === 'bins') {
                    // Get IDs of bins to keep
                    const binIdsToKeep = value.map(bin => bin.id).filter(id => id);
                    
                    // Delete bins that are NOT in the new list
                    if (binIdsToKeep.length > 0) {
                        await collection.deleteMany({ 
                            id: { $nin: binIdsToKeep } 
                        });
                    }
                }
                
                // SPECIAL CASE: For routes, do full replacement so admin-deleted routes stay deleted
                if (key === 'routes') {
                    const routeIdsToKeep = value.map(r => r.id).filter(id => id);
                    if (routeIdsToKeep.length >= 0) {
                        const deleteResult = await collection.deleteMany({ id: { $nin: routeIdsToKeep } });
                        if (deleteResult.deletedCount > 0) {
                            console.log(`🗑️ MongoDB: Removed ${deleteResult.deletedCount} route(s) not in new list`);
                        }
                    }
                }
                
                // Use bulk write for efficiency
                // Remove _id from all documents (MongoDB doesn't allow updating _id)
                const operations = value.map(doc => {
                    const docId = doc[uniqueField] || doc.id || doc._id || doc.imei;
                    if (!docId) return null;
                    
                    // Remove _id from update operation
                    const { _id, ...docWithoutId } = doc;
                    
                    // Use updateOne with $set only (no _id manipulation)
                    // MongoDB will preserve existing _id automatically
                    return {
                        updateOne: {
                            filter: { [uniqueField]: docId },
                            update: { $set: docWithoutId },
                            upsert: true
                        }
                    };
                }).filter(op => op !== null);
                
                if (operations.length > 0) {
                    try {
                        await collection.bulkWrite(operations, { ordered: false });
                    } catch (bulkError) {
                        // If bulk write fails, try individual operations with error handling
                        // This is expected for some edge cases, so we don't log as error
                        for (const op of operations) {
                            try {
                                const docId = op.updateOne.filter[uniqueField];
                                const { _id, ...docWithoutId } = op.updateOne.update.$set;
                                
                                // Try update first (for existing documents)
                                const updateResult = await collection.updateOne(
                                    op.updateOne.filter,
                                    { $set: docWithoutId }
                                );
                                
                                // If no document was updated, insert new one
                                if (updateResult.matchedCount === 0) {
                                    try {
                                        await collection.insertOne({
                                            ...docWithoutId,
                                            [uniqueField]: docId
                                            // Let MongoDB generate _id automatically
                                        });
                                    } catch (insertError) {
                                        // If insert fails due to duplicate _id, just update
                                        if (insertError.code === 11000) {
                                            await collection.updateOne(
                                                op.updateOne.filter,
                                                { $set: docWithoutId }
                                            );
                                        } else {
                                            // Only log non-duplicate errors
                                            console.error(`⚠️ Failed to insert document in ${key}:`, insertError.message);
                                        }
                                    }
                                }
                            } catch (individualError) {
                                // If it's a duplicate key error, just update
                                if (individualError.code === 11000) {
                                    const docId = op.updateOne.filter[uniqueField];
                                    const { _id, ...docWithoutId } = op.updateOne.update.$set;
                                    await collection.updateOne(
                                        op.updateOne.filter,
                                        { $set: docWithoutId }
                                    );
                                } else {
                                    // Only log unexpected errors
                                    console.error(`⚠️ Failed to update document in ${key}:`, individualError.message);
                                }
                            }
                        }
                    }
                }
            } else if ((key === 'driverLocations' || key === 'analytics' || key === 'settings') && typeof value === 'object' && !Array.isArray(value)) {
                const collection = this.mongoDb.collection(key);
                
                // Use updateOne with $set and $setOnInsert for key-value pairs
                const operations = Object.entries(value).map(([k, v]) => ({
                    updateOne: {
                        filter: { key: k },
                        update: {
                            $set: { key: k, value: v },
                            $setOnInsert: { _id: k }  // Only set _id on insert
                        },
                        upsert: true
                    }
                }));
                
                if (operations.length > 0) {
                    try {
                        await collection.bulkWrite(operations, { ordered: false });
                    } catch (bulkError) {
                        // If bulk write fails, try individual operations
                        console.warn(`⚠️ Bulk write failed for ${key}, trying individual operations...`);
                        for (const op of operations) {
                            try {
                                const k = op.updateOne.filter.key;
                                const v = op.updateOne.update.$set.value;
                                
                                // Try update first
                                const updateResult = await collection.updateOne(
                                    { key: k },
                                    { $set: { key: k, value: v } }
                                );
                                
                                // If no document was updated, insert new one
                                if (updateResult.matchedCount === 0) {
                                    await collection.insertOne({ key: k, value: v, _id: k });
                                }
                            } catch (individualError) {
                                // If duplicate key, just update
                                if (individualError.code === 11000) {
                                    const k = op.updateOne.filter.key;
                                    const v = op.updateOne.update.$set.value;
                                    await collection.updateOne(
                                        { key: k },
                                        { $set: { key: k, value: v } }
                                    );
                                } else {
                                    console.error(`⚠️ Failed to update document in ${key}:`, individualError.message);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error setting MongoDB data for ${key}:`, error.message);
        }
    }

    async getAllData() {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.dbType === 'mongodb' && this.mongoDb) {
            return await this.getAllMongoData();
        }
        
        return this.data || Object.fromEntries(this.fallbackStorage);
    }

    async getAllMongoData() {
        try {
            const result = {};
            
            // Load all array collections
            const arrayCollections = ['users', 'vehicles', 'bins', 'routes', 'collections', 'complaints', 'alerts', 'sensors', 'systemLogs', 'pendingRegistrations'];
            
            for (const collectionName of arrayCollections) {
                const collection = this.mongoDb.collection(collectionName);
                const documents = await collection.find({}).toArray();
                result[collectionName] = documents.map(doc => {
                    const { _id, migratedAt, migrationVersion, ...rest } = doc;
                    return rest;
                });
                
                // Log bin count only in debug mode
                // Excessive logging removed for performance
            }
            
            // Load object collections
            const driverLocationsCollection = this.mongoDb.collection('driverLocations');
            const driverLocationsDocs = await driverLocationsCollection.find({}).toArray();
            result.driverLocations = {};
            driverLocationsDocs.forEach(doc => {
                if (doc.key && doc.value) {
                    result.driverLocations[doc.key] = doc.value;
                }
            });
            
            const analyticsCollection = this.mongoDb.collection('analytics');
            const analyticsDocs = await analyticsCollection.find({}).toArray();
            result.analytics = {};
            analyticsDocs.forEach(doc => {
                if (doc.key && doc.value) {
                    result.analytics[doc.key] = doc.value;
                }
            });
            
            try {
                const settingsCollection = this.mongoDb.collection('settings');
                const settingsDocs = await settingsCollection.find({}).toArray();
                result.settings = {};
                settingsDocs.forEach(doc => {
                    if (doc.key != null) result.settings[doc.key] = doc.value;
                });
            } catch (e) {
                result.settings = {};
            }
            
            result.deletedBins = await this.getDeletedBins();
            result.initialized = true;
            result.lastUpdate = new Date().toISOString();
            
            return result;
        } catch (error) {
            console.error('❌ Error getting all MongoDB data:', error.message);
            return this.data || Object.fromEntries(this.fallbackStorage);
        }
    }

    async updateData(updates) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.data) {
            // REPLACE bins list (client is source of truth for deletions)
            if (updates.bins && Array.isArray(updates.bins)) {
                const existingBins = this.data.bins || [];
                const clientBins = updates.bins;
                
                console.log(`📦 Replacing bins: ${existingBins.length} existing → ${clientBins.length} from client`);
                
                // CRITICAL: When client sends bins, it's the complete list
                // If a bin is missing from client, it means it was DELETED
                // So we REPLACE the entire list, not merge
                this.data.bins = clientBins;
                
                // Log if bins were deleted
                const deletedBins = existingBins.filter(eb => !clientBins.some(cb => cb.id === eb.id));
                if (deletedBins.length > 0) {
                    console.log(`🗑️ Deleted ${deletedBins.length} bin(s): ${deletedBins.map(b => b.id).join(', ')}`);
                }
                
                console.log(`✅ Bins updated: ${this.data.bins.length} bins on server`);
            }
            
            // Merge sensors by IMEI instead of replacing
            if (updates.sensors && Array.isArray(updates.sensors)) {
                const existingSensors = this.data.sensors || [];
                const mergedSensors = [...existingSensors];
                
                updates.sensors.forEach(updateSensor => {
                    const existingIndex = mergedSensors.findIndex(s => s.imei === updateSensor.imei);
                    if (existingIndex >= 0) {
                        mergedSensors[existingIndex] = { ...mergedSensors[existingIndex], ...updateSensor };
                    } else {
                        mergedSensors.push(updateSensor);
                    }
                });
                
                this.data.sensors = mergedSensors;
                console.log(`📡 Merged sensors array: ${mergedSensors.length} sensors (${updates.sensors.length} from update, ${existingSensors.length} existing)`);
            }
            
            // Merge other updates
            Object.assign(this.data, updates);
            this.data.lastUpdate = new Date().toISOString();
        }
        
        // Update fallback storage
        Object.entries(updates).forEach(([key, value]) => {
            this.fallbackStorage.set(key, value);
        });
        
            // Force immediate sync for critical updates (persist to MongoDB)
        if (this.dbType === 'mongodb' && this.mongoDb) {
            if (updates.bins && Array.isArray(updates.bins)) {
                await this.setMongoData('bins', this.data.bins);
            }
            if (updates.sensors && Array.isArray(updates.sensors)) {
                await this.setMongoData('sensors', this.data.sensors);
            }
            if (updates.users && Array.isArray(updates.users)) {
                await this.setMongoData('users', this.data.users);
            }
            if (updates.vehicles && Array.isArray(updates.vehicles)) {
                await this.setMongoData('vehicles', this.data.vehicles);
            }
            // CRITICAL: Persist collections and routes to MongoDB immediately
            if (updates.collections && Array.isArray(updates.collections)) {
                await this.setMongoData('collections', this.data.collections);
                console.log(`💾 Collections persisted to MongoDB: ${this.data.collections.length} records`);
            }
            if (updates.routes && Array.isArray(updates.routes)) {
                await this.setMongoData('routes', this.data.routes);
                console.log(`💾 Routes persisted to MongoDB: ${this.data.routes.length} records`);
            }
        }
        if (updates.bins || updates.sensors || updates.users || updates.vehicles || updates.collections || updates.routes) {
            await this.syncToExternal();
        } else {
            this.scheduleSyncToExternal();
        }
    }

    // Driver-specific methods
    async getDriverById(driverId) {
        const users = await this.getData('users') || [];
        return users.find(user => user.id === driverId && user.type === 'driver');
    }

    // Normalize rating to one decimal, clamp 0-5 (avoid huge decimals like 4.2524585626302045)
    _sanitizeDriverUpdates(updates) {
        const out = { ...updates };
        if (out.rating != null && typeof out.rating === 'number' && !isNaN(out.rating)) {
            out.rating = Math.min(5, Math.max(0, Math.round(out.rating * 10) / 10));
        }
        if (out.efficiency != null && typeof out.efficiency === 'number' && !isNaN(out.efficiency)) {
            out.efficiency = Math.min(100, Math.max(0, Math.round(out.efficiency * 10) / 10));
        }
        return out;
    }

    async updateDriverData(driverId, updates) {
        const users = await this.getData('users') || [];
        const driverIndex = users.findIndex(user => user.id === driverId && user.type === 'driver');
        
        if (driverIndex >= 0) {
            const sanitized = this._sanitizeDriverUpdates(updates);
            users[driverIndex] = { ...users[driverIndex], ...sanitized, lastUpdate: new Date().toISOString() };
            await this.setData('users', users);
            return users[driverIndex];
        }
        
        return null;
    }

    async updateDriverLocation(driverId, lat, lng, accuracy = null, speed = 0) {
        const driverLocations = await this.getData('driverLocations') || {};
        
        driverLocations[driverId] = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            timestamp: new Date().toISOString(),
            accuracy,
            speed
        };
        
        await this.setData('driverLocations', driverLocations);
        
        // Also update the driver's current location in user data
        await this.updateDriverData(driverId, {
            currentLocation: { lat: parseFloat(lat), lng: parseFloat(lng) }
        });
        
        return driverLocations[driverId];
    }

    async getDriverLocations() {
        return await this.getData('driverLocations') || {};
    }

    // Route management
    async addRoute(route) {
        const routes = await this.getData('routes') || [];
        routes.push(route);
        await this.setData('routes', routes);
        return route;
    }

    async updateRoute(routeId, updates) {
        const routes = await this.getData('routes') || [];
        const routeIndex = routes.findIndex(route => route.id === routeId);
        
        if (routeIndex >= 0) {
            routes[routeIndex] = { ...routes[routeIndex], ...updates };
            await this.setData('routes', routes);
            return routes[routeIndex];
        }
        
        return null;
    }

    async getDriverRoutes(driverId) {
        const routes = await this.getData('routes') || [];
        return routes.filter(route => route.driverId === driverId && route.status !== 'completed' && route.status !== 'cancelled');
    }

    // Driver messages (manager–driver communication history)
    async getDriverMessages(driverId) {
        if (!driverId) return [];
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('driverMessages');
                const doc = await col.findOne({ driverId: String(driverId) });
                return Array.isArray(doc?.messages) ? doc.messages : [];
            } catch (e) {
                console.error('getDriverMessages error:', e.message);
                return this.data?.driverMessages?.[driverId] || [];
            }
        }
        const all = this.data?.driverMessages || {};
        return Array.isArray(all[driverId]) ? all[driverId] : [];
    }

    /**
     * WhatsApp-style: paginated and delta fetches. Returns { messages, hasMore, nextBefore }.
     * - limit: max messages (default 50)
     * - before: ISO timestamp – return messages older than this (for "load older")
     * - since: ISO timestamp – return only messages newer than this (delta sync, no full reload)
     */
    async getDriverMessagesPaginated(driverId, opts = {}) {
        const limit = Math.min(Math.max(1, parseInt(opts.limit, 10) || 50), 100);
        const before = opts.before ? new Date(opts.before).getTime() : null;
        const since = opts.since ? new Date(opts.since).getTime() : null;
        const all = await this.getDriverMessages(driverId);
        const sorted = all.slice().sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
        let list;
        if (since != null && !isNaN(since)) {
            list = sorted.filter(m => new Date(m.timestamp || 0).getTime() > since);
            return { messages: list.slice(-limit), hasMore: false, nextBefore: null };
        }
        if (before != null && !isNaN(before)) {
            list = sorted.filter(m => new Date(m.timestamp || 0).getTime() < before);
            const page = list.slice(-limit);
            const nextTs = page.length ? page[0].timestamp : null;
            return { messages: page.reverse(), hasMore: list.length > limit, nextBefore: nextTs };
        }
        list = sorted.slice(-limit);
        const nextTs = sorted.length > limit ? sorted[sorted.length - limit - 1]?.timestamp : null;
        return { messages: list, hasMore: sorted.length > limit, nextBefore: nextTs };
    }

    async addDriverMessage(driverId, message) {
        if (!driverId || !message) return null;
        const msg = { ...message, serverTimestamp: new Date().toISOString() };
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('driverMessages');
                await col.updateOne(
                    { driverId: String(driverId) },
                    { $push: { messages: msg }, $set: { lastUpdate: new Date().toISOString() } },
                    { upsert: true }
                );
                if (this.data) {
                    if (!this.data.driverMessages) this.data.driverMessages = {};
                    if (!this.data.driverMessages[driverId]) this.data.driverMessages[driverId] = [];
                    this.data.driverMessages[driverId].push(msg);
                }
                return msg;
            } catch (e) {
                console.error('addDriverMessage error:', e.message);
                return null;
            }
        }
        if (!this.data.driverMessages) this.data.driverMessages = {};
        if (!this.data.driverMessages[driverId]) this.data.driverMessages[driverId] = [];
        this.data.driverMessages[driverId].push(msg);
        this.data.lastUpdate = new Date().toISOString();
        this.scheduleSyncToExternal();
        return msg;
    }

    /**
     * Append a single chat message to the app-wide audit log (MongoDB + JSON).
     * Used for auditing: every chat in the app is recorded here.
     */
    async addChatAuditLog(entry) {
        if (!entry || entry.message === undefined) return null;
        const doc = {
            id: entry.id || `CHAT-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            sender: entry.sender || 'unknown',
            senderId: entry.senderId || '',
            senderName: entry.senderName || '',
            receiverId: entry.receiverId || '',
            receiverName: entry.receiverName || '',
            message: String(entry.message),
            type: entry.type || 'text',
            timestamp: entry.timestamp || new Date().toISOString(),
            serverTimestamp: new Date().toISOString(),
            source: entry.source || 'driver-admin'
        };
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                await this.mongoDb.collection('chatHistoryAudit').insertOne(doc);
                if (this.data && Array.isArray(this.data.chatHistoryAudit)) {
                    this.data.chatHistoryAudit.push(doc);
                }
                return doc;
            } catch (e) {
                console.error('addChatAuditLog error:', e.message);
                return null;
            }
        }
        if (!this.data.chatHistoryAudit) this.data.chatHistoryAudit = [];
        this.data.chatHistoryAudit.push(doc);
        this.data.lastUpdate = new Date().toISOString();
        this.scheduleSyncToExternal();
        return doc;
    }

    /** Get chat audit log for auditing (paginated). */
    async getChatAuditLog(options = {}) {
        const { limit = 500, since, until, senderId, receiverId } = options;
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('chatHistoryAudit');
                const filter = {};
                if (since || until) {
                    filter.timestamp = {};
                    if (since) filter.timestamp.$gte = since;
                    if (until) filter.timestamp.$lte = until;
                }
                if (senderId) filter.senderId = String(senderId);
                if (receiverId) filter.receiverId = String(receiverId);
                const cursor = col.find(filter).sort({ timestamp: -1 }).limit(Math.min(limit, 2000));
                return await cursor.toArray();
            } catch (e) {
                console.error('getChatAuditLog error:', e.message);
                return [];
            }
        }
        let list = Array.isArray(this.data?.chatHistoryAudit) ? [...this.data.chatHistoryAudit] : [];
        if (senderId) list = list.filter(m => m.senderId === senderId);
        if (receiverId) list = list.filter(m => m.receiverId === receiverId);
        if (since) list = list.filter(m => (m.timestamp || m.serverTimestamp) >= since);
        if (until) list = list.filter(m => (m.timestamp || m.serverTimestamp) <= until);
        list.sort((a, b) => new Date(b.timestamp || b.serverTimestamp) - new Date(a.timestamp || a.serverTimestamp));
        return list.slice(0, Math.min(limit, 2000));
    }

    /** Store a client console error from any user (for admin tracking). */
    async addClientErrorLog(entry) {
        if (!entry || !entry.message) return null;
        const doc = {
            id: entry.id || `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            message: String(entry.message),
            stack: entry.stack || '',
            context: entry.context || {},
            userId: entry.userId || 'unknown',
            userType: entry.userType || 'unknown',
            userName: entry.userName || 'unknown',
            url: entry.url || '',
            userAgent: entry.userAgent || '',
            timestamp: entry.timestamp || new Date().toISOString()
        };
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                await this.mongoDb.collection('clientErrorLogs').insertOne(doc);
                return doc;
            } catch (e) {
                console.error('addClientErrorLog error:', e.message);
                return null;
            }
        }
        if (!this.data.clientErrorLogs) this.data.clientErrorLogs = [];
        this.data.clientErrorLogs.push(doc);
        return doc;
    }

    /** Get all client console errors (newest first), with optional limit/skip. */
    async getClientErrorLogs(options = {}) {
        const { limit = 500, skip = 0, userId = null } = options;
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                const col = this.mongoDb.collection('clientErrorLogs');
                const filter = userId ? { userId: String(userId) } : {};
                const cursor = col.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit);
                return await cursor.toArray();
            } catch (e) {
                console.error('getClientErrorLogs error:', e.message);
                return [];
            }
        }
        const list = Array.isArray(this.data?.clientErrorLogs) ? this.data.clientErrorLogs : [];
        const sorted = list.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return sorted.slice(skip, skip + limit);
    }

    /** Clear all client error logs (admin). */
    async clearClientErrorLogs() {
        if (this.dbType === 'mongodb' && this.mongoDb) {
            try {
                await this.mongoDb.collection('clientErrorLogs').deleteMany({});
                return { cleared: true };
            } catch (e) {
                console.error('clearClientErrorLogs error:', e.message);
                return { cleared: false };
            }
        }
        if (this.data) this.data.clientErrorLogs = [];
        return { cleared: true };
    }

    // Collection management
    async addCollection(collection) {
        const collections = await this.getData('collections') || [];
        collections.push(collection);
        await this.setData('collections', collections);
        return collection;
    }

    // Sync and persistence
    scheduleSyncToExternal() {
        // Debounce sync operations
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        
        this.syncTimeout = setTimeout(() => {
            this.syncToExternal();
        }, 5000); // Sync after 5 seconds of inactivity
    }

    async syncToExternal() {
        try {
            if (this.dbType === 'mongodb' && this.mongoDb) {
                // MongoDB sync is handled automatically via setData
                // But we can also create a backup to JSON file
                const allData = await this.getAllData();
                await fs.writeFile(
                    this.dataFilePath,
                    JSON.stringify({ ...allData, lastSync: new Date().toISOString() }, null, 2),
                    'utf8'
                );
                this.lastSync = new Date().toISOString();
                return;
            }
            
            if (!this.data) {
                console.log('⚠️ No data to sync');
                return; // Nothing to sync
            }
            
            // Save to file for persistence
            const dataToSave = {
                ...this.data,
                lastSync: new Date().toISOString()
            };
            
            // Log what we're saving
            console.log(`💾 Saving data to file: ${this.dataFilePath}`);
            if (dataToSave.sensors) {
                console.log(`   Sensors to save: ${dataToSave.sensors.length}`);
                if (dataToSave.sensors.length > 0) {
                    console.log(`   Sensor IMEIs: ${dataToSave.sensors.map(s => s.imei).join(', ')}`);
                }
            }
            
            await fs.writeFile(
                this.dataFilePath,
                JSON.stringify(dataToSave, null, 2),
                'utf8'
            );
            
            this.lastSync = new Date().toISOString();
            console.log('✅ Data saved successfully to file:', this.dataFilePath);
            
        } catch (error) {
            console.error('❌ External sync failed:', error);
            console.error('   Error details:', error.message);
            console.error('   Stack:', error.stack);
        }
    }

    startSyncProcess() {
        // Start periodic sync every 5 minutes
        this.syncInterval = setInterval(() => {
            this.syncToExternal();
        }, 5 * 60 * 1000);
    }

    stopSyncProcess() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        
        // Close MongoDB connection
        if (this.mongoClient) {
            this.mongoClient.close().catch(err => {
                console.error('Error closing MongoDB connection:', err);
            });
            this.mongoClient = null;
            this.mongoDb = null;
        }
    }

    // Health check
    async healthCheck() {
        return {
            initialized: this.initialized,
            dbType: this.dbType,
            lastSync: this.lastSync,
            dataKeys: this.data ? Object.keys(this.data) : [],
            fallbackKeys: Array.from(this.fallbackStorage.keys())
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
} else {
    window.DatabaseManager = DatabaseManager;
}
