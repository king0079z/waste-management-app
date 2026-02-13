// mongodb-migration.js - World-Class MongoDB Migration Script
// Safely migrates all data from JSON file to MongoDB with zero data loss

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class MongoDBMigration {
    constructor() {
        this.client = null;
        this.db = null;
        this.connectionString = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017';
        this.databaseName = process.env.MONGODB_DATABASE || 'waste_management';
        this.dataFilePath = path.join(__dirname, 'data.json');
        this.backupDir = path.join(__dirname, 'backups');
        this.migrationLog = [];
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        this.migrationLog.push(logEntry);
        console.log(logEntry);
    }

    async connect() {
        try {
            this.log(`Connecting to MongoDB at ${this.connectionString.replace(/\/\/.*@/, '//***@')}...`);
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
            });
            
            await this.client.connect();
            await this.client.db('admin').command({ ping: 1 });
            this.db = this.client.db(this.databaseName);
            this.log('✅ Successfully connected to MongoDB', 'success');
            return true;
        } catch (error) {
            this.log(`❌ Failed to connect to MongoDB: ${error.message}`, 'error');
            this.log('💡 Make sure MongoDB is running and connection string is correct', 'info');
            throw error;
        }
    }

    async createBackup() {
        try {
            // Create backup directory if it doesn't exist
            await fs.mkdir(this.backupDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, `data-backup-${timestamp}.json`);
            
            this.log('📦 Creating backup of current data.json...');
            const data = await fs.readFile(this.dataFilePath, 'utf8');
            await fs.writeFile(backupPath, data, 'utf8');
            
            this.log(`✅ Backup created: ${backupPath}`, 'success');
            return backupPath;
        } catch (error) {
            this.log(`⚠️ Backup creation failed: ${error.message}`, 'warn');
            // Continue anyway - migration can still proceed
            return null;
        }
    }

    async loadJSONData() {
        try {
            this.log('📂 Loading data from data.json...');
            const data = await fs.readFile(this.dataFilePath, 'utf8');
            const jsonData = JSON.parse(data);
            
            const stats = {
                users: jsonData.users?.length || 0,
                bins: jsonData.bins?.length || 0,
                routes: jsonData.routes?.length || 0,
                collections: jsonData.collections?.length || 0,
                complaints: jsonData.complaints?.length || 0,
                alerts: jsonData.alerts?.length || 0,
                sensors: jsonData.sensors?.length || 0,
                systemLogs: jsonData.systemLogs?.length || 0,
            };
            
            this.log(`📊 Data loaded: ${JSON.stringify(stats, null, 2)}`, 'info');
            return jsonData;
        } catch (error) {
            this.log(`❌ Failed to load JSON data: ${error.message}`, 'error');
            throw error;
        }
    }

    async createIndexes() {
        try {
            this.log('🔧 Creating database indexes for optimal performance...');
            
            // Users collection indexes
            const usersCollection = this.db.collection('users');
            
            // Check existing indexes to avoid conflicts
            const existingIndexes = await usersCollection.indexes();
            const indexNames = existingIndexes.map(idx => idx.name);
            
            // Drop problematic email_1 index if it exists
            if (indexNames.includes('email_1')) {
                try {
                    await usersCollection.dropIndex('email_1');
                    this.log('🗑️ Dropped old email_1 index to recreate with proper config');
                } catch (dropErr) {
                    // Ignore if already dropped
                }
            }
            
            await usersCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_user_id' });
            await usersCollection.createIndex({ username: 1 }, { unique: true, name: 'idx_user_username' });
            await usersCollection.createIndex({ email: 1 }, { unique: true, name: 'idx_user_email' });
            await usersCollection.createIndex({ type: 1 }, { name: 'idx_user_type' });
            await usersCollection.createIndex({ status: 1 }, { name: 'idx_user_status' });
            
            // Bins collection indexes
            const binsCollection = this.db.collection('bins');
            await binsCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_bin_id' });
            await binsCollection.createIndex({ location: 'text' }, { name: 'idx_bin_location_text' });
            await binsCollection.createIndex({ lat: 1, lng: 1 }, { name: 'idx_bin_coords' });
            await binsCollection.createIndex({ status: 1 }, { name: 'idx_bin_status' });
            await binsCollection.createIndex({ type: 1 }, { name: 'idx_bin_type' });
            
            // Routes collection indexes
            const routesCollection = this.db.collection('routes');
            await routesCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_route_id' });
            await routesCollection.createIndex({ driverId: 1 }, { name: 'idx_route_driver' });
            await routesCollection.createIndex({ status: 1 }, { name: 'idx_route_status' });
            await routesCollection.createIndex({ createdAt: -1 }, { name: 'idx_route_created' });
            
            // Collections collection indexes
            const collectionsCollection = this.db.collection('collections');
            await collectionsCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_collection_id' });
            await collectionsCollection.createIndex({ binId: 1 }, { name: 'idx_collection_bin' });
            await collectionsCollection.createIndex({ driverId: 1 }, { name: 'idx_collection_driver' });
            await collectionsCollection.createIndex({ timestamp: -1 }, { name: 'idx_collection_time' });
            
            // Complaints collection indexes
            const complaintsCollection = this.db.collection('complaints');
            await complaintsCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_complaint_id' });
            await complaintsCollection.createIndex({ status: 1 });
            await complaintsCollection.createIndex({ createdAt: -1 });
            
            // Alerts collection indexes
            const alertsCollection = this.db.collection('alerts');
            await alertsCollection.createIndex({ id: 1 }, { unique: true });
            await alertsCollection.createIndex({ type: 1 });
            await alertsCollection.createIndex({ status: 1 });
            await alertsCollection.createIndex({ timestamp: -1 });
            
            // Sensors collection indexes
            const sensorsCollection = this.db.collection('sensors');
            if (sensorsCollection) {
                await sensorsCollection.createIndex({ imei: 1 }, { unique: true, sparse: true });
                await sensorsCollection.createIndex({ binId: 1 });
            }
            
            this.log('✅ All indexes created successfully', 'success');
        } catch (error) {
            this.log(`⚠️ Index creation warning: ${error.message}`, 'warn');
            // Continue - indexes are optional for migration
        }
    }

    async migrateCollection(collectionName, data, options = {}) {
        try {
            if (!data || !Array.isArray(data) || data.length === 0) {
                this.log(`⏭️  Skipping empty collection: ${collectionName}`, 'info');
                return { inserted: 0, skipped: 0 };
            }

            const collection = this.db.collection(collectionName);
            const uniqueField = options.uniqueField || 'id';
            
            this.log(`📤 Migrating ${collectionName}: ${data.length} documents...`);
            
            // Use bulk operations for better performance
            const operations = [];
            let inserted = 0;
            let updated = 0;
            let skipped = 0;

            // First, get all existing documents to avoid _id conflicts
            // Use the appropriate unique field for each collection
            const existingDocs = await collection.find({}).toArray();
            const existingIds = new Set(existingDocs.map(d => {
                if (collectionName === 'sensors') {
                    return d.imei || d._id?.toString();
                }
                return d[uniqueField] || d._id?.toString();
            }));
            
            for (const doc of data) {
                const docId = doc[uniqueField];
                if (!docId) {
                    skipped++;
                    continue;
                }
                
                // Prepare document - remove _id to avoid conflicts
                const { _id, ...docWithoutId } = doc;
                
                // Add migration metadata
                docWithoutId.migratedAt = new Date().toISOString();
                docWithoutId.migrationVersion = '1.0.0';

                const docExists = existingIds.has(docId);
                
                if (docExists) {
                    // Document exists - update without _id
                    operations.push({
                        updateOne: {
                            filter: { [uniqueField]: docId },
                            update: { $set: docWithoutId }
                        }
                    });
                } else {
                    // Document doesn't exist - use replaceOne with upsert for safety
                    // This ensures _id is set correctly on insert
                    operations.push({
                        replaceOne: {
                            filter: { [uniqueField]: docId },
                            replacement: { ...docWithoutId, _id: docId },
                            upsert: true
                        }
                    });
                }

                // Execute in batches of 1000
                if (operations.length >= 1000) {
                    try {
                        const result = await collection.bulkWrite(operations, { ordered: false });
                        inserted += result.insertedCount + result.upsertedCount;
                        updated += result.modifiedCount;
                    } catch (batchError) {
                        // If batch fails, try individual operations
                        this.log(`⚠️ Batch write failed, processing individually...`, 'warn');
                        for (const op of operations) {
                            try {
                                if (op.insertOne) {
                                    await collection.insertOne(op.insertOne.document);
                                    inserted++;
                                } else if (op.updateOne) {
                                    await collection.updateOne(op.updateOne.filter, op.updateOne.update);
                                    updated++;
                                }
                            } catch (individualError) {
                                // If duplicate key error on insert, try update instead
                                if (individualError.code === 11000 && op.insertOne) {
                                    try {
                                        const { _id, ...docToUpdate } = op.insertOne.document;
                                        await collection.updateOne(
                                            { [uniqueField]: docId },
                                            { $set: docToUpdate }
                                        );
                                        updated++;
                                    } catch (updateError) {
                                        this.log(`⚠️ Failed to migrate document: ${updateError.message}`, 'warn');
                                        skipped++;
                                    }
                                } else {
                                    this.log(`⚠️ Failed to migrate document: ${individualError.message}`, 'warn');
                                    skipped++;
                                }
                            }
                        }
                    }
                    operations.length = 0;
                }
            }

            // Execute remaining operations
            if (operations.length > 0) {
                try {
                    const result = await collection.bulkWrite(operations, { ordered: false });
                    inserted += result.insertedCount + result.upsertedCount;
                    updated += result.modifiedCount;
                } catch (bulkError) {
                    // If bulk write fails, try individual operations
                    this.log(`⚠️ Bulk write failed, trying individual operations...`, 'warn');
                    for (const op of operations) {
                        try {
                            if (op.replaceOne) {
                                const result = await collection.replaceOne(
                                    op.replaceOne.filter,
                                    op.replaceOne.replacement,
                                    { upsert: true }
                                );
                                if (result.upsertedCount > 0) {
                                    inserted++;
                                } else if (result.modifiedCount > 0) {
                                    updated++;
                                }
                            } else if (op.insertOne) {
                                await collection.insertOne(op.insertOne.document);
                                inserted++;
                            } else if (op.updateOne) {
                                await collection.updateOne(op.updateOne.filter, op.updateOne.update);
                                updated++;
                            }
                        } catch (individualError) {
                            // If duplicate key error, try update instead
                            if (individualError.code === 11000) {
                                try {
                                    if (op.replaceOne) {
                                        const { _id, ...docToUpdate } = op.replaceOne.replacement;
                                        await collection.updateOne(
                                            op.replaceOne.filter,
                                            { $set: docToUpdate }
                                        );
                                        updated++;
                                    } else if (op.insertOne) {
                                        const { _id, ...docToUpdate } = op.insertOne.document;
                                        await collection.updateOne(
                                            { [uniqueField]: docToUpdate[uniqueField] },
                                            { $set: docToUpdate }
                                        );
                                        updated++;
                                    }
                                } catch (updateError) {
                                    this.log(`⚠️ Failed to migrate document: ${updateError.message}`, 'warn');
                                    skipped++;
                                }
                            } else {
                                this.log(`⚠️ Failed to migrate document: ${individualError.message}`, 'warn');
                                skipped++;
                            }
                        }
                    }
                }
            }

            this.log(`✅ ${collectionName}: ${inserted} inserted, ${updated} updated`, 'success');
            return { inserted, updated, skipped };
        } catch (error) {
            this.log(`❌ Failed to migrate ${collectionName}: ${error.message}`, 'error');
            throw error;
        }
    }

    async migrateObjectData(collectionName, data) {
        try {
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                this.log(`⏭️  Skipping invalid object data: ${collectionName}`, 'info');
                return { inserted: 0 };
            }

            const collection = this.db.collection(collectionName);
            
            // Convert object to array of key-value pairs
            const documents = Object.entries(data).map(([key, value]) => ({
                _id: key,
                key: key,
                value: value,
                migratedAt: new Date().toISOString(),
                migrationVersion: '1.0.0'
            }));

            if (documents.length === 0) {
                this.log(`⏭️  Skipping empty object: ${collectionName}`, 'info');
                return { inserted: 0 };
            }

            this.log(`📤 Migrating ${collectionName}: ${documents.length} key-value pairs...`);
            
            const result = await collection.insertMany(documents, { ordered: false });
            this.log(`✅ ${collectionName}: ${result.insertedCount} documents inserted`, 'success');
            
            return { inserted: result.insertedCount };
        } catch (error) {
            // If it's a duplicate key error, try upsert instead
            if (error.code === 11000) {
                this.log(`⚠️ Duplicate keys detected in ${collectionName}, using upsert...`, 'warn');
                const collection = this.db.collection(collectionName);
                const documents = Object.entries(data).map(([key, value]) => ({
                    _id: key,
                    key: key,
                    value: value,
                    migratedAt: new Date().toISOString(),
                    migrationVersion: '1.0.0'
                }));

                let inserted = 0;
                for (const doc of documents) {
                    await collection.updateOne(
                        { _id: doc._id },
                        { $set: doc },
                        { upsert: true }
                    );
                    inserted++;
                }
                this.log(`✅ ${collectionName}: ${inserted} documents upserted`, 'success');
                return { inserted };
            }
            this.log(`❌ Failed to migrate ${collectionName}: ${error.message}`, 'error');
            throw error;
        }
    }

    async finalComprehensiveCheck(jsonData) {
        try {
            this.log('🔍 Performing final comprehensive data check...', 'info');
            
            let allDataMigrated = true;
            const checkResults = {};
            
            // Check all array collections
            const arrayCollections = ['users', 'bins', 'routes', 'collections', 'complaints', 'alerts', 'sensors', 'systemLogs', 'pendingRegistrations'];
            
            for (const collectionName of arrayCollections) {
                const jsonArray = jsonData[collectionName] || [];
                if (jsonArray.length === 0) continue;
                
                const collection = this.db.collection(collectionName);
                const mongoCount = await collection.countDocuments();
                
                // Verify each document by ID
                let foundCount = 0;
                // Determine the unique field based on collection type
                let uniqueField = 'id';
                if (collectionName === 'sensors') {
                    uniqueField = 'imei';
                }
                
                for (const doc of jsonArray) {
                    const idField = doc[uniqueField] || doc.id || doc.imei;
                    if (idField) {
                        const found = await collection.findOne({ [uniqueField]: idField });
                        if (found) foundCount++;
                    }
                }
                
                checkResults[collectionName] = {
                    jsonCount: jsonArray.length,
                    mongoCount: mongoCount,
                    foundCount: foundCount,
                    match: foundCount === jsonArray.length  // Success if all JSON docs are found
                };
                
                if (foundCount === jsonArray.length) {
                    // All documents found - success (even if MongoDB has more)
                    if (mongoCount === jsonArray.length) {
                        this.log(`✅ ${collectionName}: All ${jsonArray.length} documents verified (exact match)`, 'success');
                    } else {
                        this.log(`✅ ${collectionName}: All ${jsonArray.length} documents verified (MongoDB has ${mongoCount} total - extra from previous migrations)`, 'success');
                    }
                } else {
                    allDataMigrated = false;
                    this.log(`⚠️ ${collectionName}: ${foundCount}/${jsonArray.length} documents verified`, 'warn');
                }
            }
            
            // Check object collections
            if (jsonData.driverLocations) {
                const jsonKeys = Object.keys(jsonData.driverLocations);
                const collection = this.db.collection('driverLocations');
                const mongoDocs = await collection.find({}).toArray();
                
                let foundCount = 0;
                for (const key of jsonKeys) {
                    const found = mongoDocs.find(doc => doc.key === key || doc._id === key);
                    if (found) foundCount++;
                }
                
                checkResults.driverLocations = {
                    jsonCount: jsonKeys.length,
                    mongoCount: mongoDocs.length,
                    foundCount: foundCount,
                    match: foundCount === jsonKeys.length  // Success if all keys are found
                };
                
                if (foundCount === jsonKeys.length) {
                    if (mongoDocs.length === jsonKeys.length) {
                        this.log(`✅ driverLocations: All ${jsonKeys.length} keys verified (exact match)`, 'success');
                    } else {
                        this.log(`✅ driverLocations: All ${jsonKeys.length} keys verified (MongoDB has ${mongoDocs.length} total)`, 'success');
                    }
                } else {
                    allDataMigrated = false;
                    this.log(`⚠️ driverLocations: ${foundCount}/${jsonKeys.length} keys verified`, 'warn');
                }
            }
            
            if (jsonData.analytics) {
                const jsonKeys = Object.keys(jsonData.analytics);
                const collection = this.db.collection('analytics');
                const mongoDocs = await collection.find({}).toArray();
                
                let foundCount = 0;
                for (const key of jsonKeys) {
                    const found = mongoDocs.find(doc => doc.key === key || doc._id === key);
                    if (found) foundCount++;
                }
                
                checkResults.analytics = {
                    jsonCount: jsonKeys.length,
                    mongoCount: mongoDocs.length,
                    foundCount: foundCount,
                    match: foundCount === jsonKeys.length  // Success if all keys are found
                };
                
                if (foundCount === jsonKeys.length) {
                    if (mongoDocs.length === jsonKeys.length) {
                        this.log(`✅ analytics: All ${jsonKeys.length} keys verified (exact match)`, 'success');
                    } else {
                        this.log(`✅ analytics: All ${jsonKeys.length} keys verified (MongoDB has ${mongoDocs.length} total)`, 'success');
                    }
                } else {
                    allDataMigrated = false;
                    this.log(`⚠️ analytics: ${foundCount}/${jsonKeys.length} keys verified`, 'warn');
                }
            }
            
            return { allDataMigrated, checkResults };
        } catch (error) {
            this.log(`❌ Final check failed: ${error.message}`, 'error');
            return { allDataMigrated: false, error: error.message };
        }
    }

    async validateMigration(jsonData) {
        try {
            this.log('🔍 Validating migration...');
            
            const validation = {
                users: { expected: jsonData.users?.length || 0, actual: 0 },
                bins: { expected: jsonData.bins?.length || 0, actual: 0 },
                routes: { expected: jsonData.routes?.length || 0, actual: 0 },
                collections: { expected: jsonData.collections?.length || 0, actual: 0 },
                complaints: { expected: jsonData.complaints?.length || 0, actual: 0 },
                alerts: { expected: jsonData.alerts?.length || 0, actual: 0 },
                sensors: { expected: jsonData.sensors?.length || 0, actual: 0 },
            };

            // Count documents in each collection
            validation.users.actual = await this.db.collection('users').countDocuments();
            validation.bins.actual = await this.db.collection('bins').countDocuments();
            validation.routes.actual = await this.db.collection('routes').countDocuments();
            validation.collections.actual = await this.db.collection('collections').countDocuments();
            validation.complaints.actual = await this.db.collection('complaints').countDocuments();
            validation.alerts.actual = await this.db.collection('alerts').countDocuments();
            
            if (jsonData.sensors) {
                validation.sensors.actual = await this.db.collection('sensors').countDocuments();
            }

            // Check driverLocations
            if (jsonData.driverLocations) {
                const driverLocationsCount = await this.db.collection('driverLocations').countDocuments();
                const expectedLocations = Object.keys(jsonData.driverLocations).length;
                validation.driverLocations = { expected: expectedLocations, actual: driverLocationsCount };
            }

            // Log validation results
            // Note: MongoDB may have more documents than JSON (from previous migrations)
            // This is safe - we just need to ensure all JSON data is present
            let allValid = true;
            for (const [key, val] of Object.entries(validation)) {
                if (val.expected > val.actual) {
                    // Missing data - this is a problem
                    this.log(`❌ ${key}: Expected ${val.expected}, Got ${val.actual} (MISSING DATA)`, 'error');
                    allValid = false;
                } else if (val.expected === val.actual) {
                    this.log(`✅ ${key}: ${val.actual} documents (exact match)`, 'success');
                } else {
                    // MongoDB has more - this is safe (from previous migrations)
                    this.log(`✅ ${key}: ${val.expected} expected, ${val.actual} in MongoDB (all data present, extra from previous migrations)`, 'success');
                }
            }
            
            if (allValid) {
                this.log('✅ Migration validation passed! All data is present in MongoDB.', 'success');
            } else {
                this.log('⚠️ Migration validation completed with warnings - some data may be missing', 'warn');
            }
            
            // Update allDataMigrated based on whether all expected data is present (not exact count)
            const allDataPresent = Object.values(validation).every(v => {
                if (!v || typeof v !== 'object') return true;
                return v.actual >= (v.expected || 0);  // MongoDB has at least as many as expected
            });
            
            return { valid: allValid, allDataPresent: allDataPresent, details: validation };
        } catch (error) {
            this.log(`❌ Validation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async migrate() {
        const startTime = Date.now();
        this.log('🚀 Starting MongoDB Migration...', 'info');
        this.log('='.repeat(60), 'info');

        try {
            // Step 1: Create backup
            await this.createBackup();

            // Step 2: Connect to MongoDB
            await this.connect();

            // Step 3: Load JSON data
            const jsonData = await this.loadJSONData();

            // Step 4: Create indexes
            await this.createIndexes();

            // Step 5: Migrate collections
            this.log('📦 Starting data migration...', 'info');
            
            const migrationResults = {};

            // Migrate array collections
            if (jsonData.users) {
                migrationResults.users = await this.migrateCollection('users', jsonData.users, { uniqueField: 'id' });
            }
            if (jsonData.bins) {
                migrationResults.bins = await this.migrateCollection('bins', jsonData.bins, { uniqueField: 'id' });
            }
            if (jsonData.routes) {
                migrationResults.routes = await this.migrateCollection('routes', jsonData.routes, { uniqueField: 'id' });
            }
            if (jsonData.collections) {
                migrationResults.collections = await this.migrateCollection('collections', jsonData.collections, { uniqueField: 'id' });
            }
            if (jsonData.complaints) {
                migrationResults.complaints = await this.migrateCollection('complaints', jsonData.complaints, { uniqueField: 'id' });
            }
            if (jsonData.alerts) {
                migrationResults.alerts = await this.migrateCollection('alerts', jsonData.alerts, { uniqueField: 'id' });
            }
            if (jsonData.sensors) {
                migrationResults.sensors = await this.migrateCollection('sensors', jsonData.sensors, { uniqueField: 'imei' });
            }
            if (jsonData.systemLogs) {
                migrationResults.systemLogs = await this.migrateCollection('systemLogs', jsonData.systemLogs);
            }
            if (jsonData.pendingRegistrations) {
                migrationResults.pendingRegistrations = await this.migrateCollection('pendingRegistrations', jsonData.pendingRegistrations);
            }

            // Migrate object data (driverLocations, analytics, etc.)
            if (jsonData.driverLocations) {
                migrationResults.driverLocations = await this.migrateObjectData('driverLocations', jsonData.driverLocations);
            }
            if (jsonData.analytics) {
                migrationResults.analytics = await this.migrateObjectData('analytics', jsonData.analytics);
            }

            // Store metadata
            const metadata = {
                migrationDate: new Date().toISOString(),
                migrationVersion: '1.0.0',
                sourceFile: this.dataFilePath,
                databaseName: this.databaseName,
                results: migrationResults,
                originalDataKeys: Object.keys(jsonData)
            };

            await this.db.collection('_migration_metadata').insertOne(metadata);
            this.log('✅ Migration metadata stored', 'success');

            // Step 6: Validate migration
            const validation = await this.validateMigration(jsonData);

            // Step 7: Final verification - ensure nothing was missed
            this.log('🔍 Performing final comprehensive check...', 'info');
            const finalCheck = await this.finalComprehensiveCheck(jsonData);
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.log('='.repeat(60), 'info');
            
            // Check if all data is present (even if MongoDB has more from previous migrations)
            const allDataPresent = validation.allDataPresent !== false && 
                                 (finalCheck.allDataMigrated || finalCheck.checkResults && 
                                  Object.values(finalCheck.checkResults).every(r => r.foundCount === r.jsonCount));
            
            if (validation.valid && allDataPresent) {
                this.log(`✅ Migration completed successfully in ${duration} seconds!`, 'success');
                this.log('✅ ALL DATA VERIFIED - ZERO DATA LOSS', 'success');
            } else {
                this.log(`⚠️ Migration completed in ${duration} seconds with warnings`, 'warn');
                this.log('⚠️ Please review validation results and re-run if needed', 'warn');
            }
            
            this.log('='.repeat(60), 'info');

            // Save migration log
            const logPath = path.join(this.backupDir, `migration-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
            await fs.mkdir(this.backupDir, { recursive: true });
            await fs.writeFile(logPath, this.migrationLog.join('\n'), 'utf8');
            this.log(`📝 Migration log saved: ${logPath}`, 'info');

            // Determine if all data is migrated (all JSON data exists in MongoDB)
            const allDataMigrated = validation.allDataPresent !== false && 
                                  (finalCheck.allDataMigrated || 
                                   (finalCheck.checkResults && Object.values(finalCheck.checkResults).every(r => 
                                    r.foundCount === r.jsonCount)));
            
            return {
                success: true,
                duration,
                validation,
                finalCheck,
                results: migrationResults,
                allDataMigrated: allDataMigrated
            };

        } catch (error) {
            this.log(`❌ Migration failed: ${error.message}`, 'error');
            this.log(error.stack, 'error');
            throw error;
        } finally {
            if (this.client) {
                await this.client.close();
                this.log('🔌 MongoDB connection closed', 'info');
            }
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    const migration = new MongoDBMigration();
    
    migration.migrate()
        .then(result => {
            console.log('\n🎉 Migration Summary:');
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = MongoDBMigration;
