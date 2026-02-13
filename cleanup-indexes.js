/**
 * MongoDB Index Cleanup Script
 * Removes problematic auto-generated indexes and recreates with explicit names
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'waste_management';

async function cleanupIndexes() {
    console.log('🔧 MongoDB Index Cleanup Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let client;
    
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        console.log(`   URI: ${MONGODB_URI}`);
        console.log(`   Database: ${DB_NAME}\n`);
        
        client = await MongoClient.connect(MONGODB_URI, {
            useUnifiedTopology: true
        });
        
        const db = client.db(DB_NAME);
        console.log('✅ Connected to MongoDB\n');
        
        // Users collection cleanup
        console.log('👥 Cleaning up users collection indexes...');
        await cleanupUsersIndexes(db);
        
        // Bins collection cleanup
        console.log('\n📦 Cleaning up bins collection indexes...');
        await cleanupBinsIndexes(db);
        
        // Routes collection cleanup
        console.log('\n🚚 Cleaning up routes collection indexes...');
        await cleanupRoutesIndexes(db);
        
        // Collections collection cleanup
        console.log('\n🗑️ Cleaning up collections collection indexes...');
        await cleanupCollectionsIndexes(db);
        
        // Sensors collection cleanup
        console.log('\n📡 Cleaning up sensors collection indexes...');
        await cleanupSensorsIndexes(db);
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ALL INDEXES CLEANED UP SUCCESSFULLY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🔄 Please restart your server now:');
        console.log('   1. Stop server: Ctrl+C');
        console.log('   2. Start server: node server.js\n');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 MongoDB connection closed');
        }
    }
}

async function cleanupUsersIndexes(db) {
    const collection = db.collection('users');
    
    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('   Current indexes:', indexes.map(idx => idx.name).join(', '));
    
    const problematicIndexes = ['email_1', 'id_1', 'username_1', 'type_1', 'status_1'];
    
    for (const indexName of problematicIndexes) {
        if (indexes.some(idx => idx.name === indexName)) {
            try {
                await collection.dropIndex(indexName);
                console.log(`   ✓ Dropped ${indexName}`);
            } catch (err) {
                console.log(`   ⚠️ Could not drop ${indexName}:`, err.message);
            }
        }
    }
    
    // Create new indexes with explicit names
    await collection.createIndex({ id: 1 }, { unique: true, name: 'idx_user_id' });
    await collection.createIndex({ username: 1 }, { unique: true, name: 'idx_user_username' });
    await collection.createIndex({ email: 1 }, { unique: true, name: 'idx_user_email' });
    await collection.createIndex({ type: 1 }, { name: 'idx_user_type' });
    await collection.createIndex({ status: 1 }, { name: 'idx_user_status' });
    
    console.log('   ✓ Created new indexes with explicit names');
}

async function cleanupBinsIndexes(db) {
    const collection = db.collection('bins');
    
    const indexes = await collection.indexes();
    console.log('   Current indexes:', indexes.map(idx => idx.name).join(', '));
    
    const problematicIndexes = ['id_1', 'lat_1_lng_1', 'status_1'];
    
    for (const indexName of problematicIndexes) {
        if (indexes.some(idx => idx.name === indexName)) {
            try {
                await collection.dropIndex(indexName);
                console.log(`   ✓ Dropped ${indexName}`);
            } catch (err) {
                console.log(`   ⚠️ Could not drop ${indexName}:`, err.message);
            }
        }
    }
    
    await collection.createIndex({ id: 1 }, { unique: true, name: 'idx_bin_id' });
    await collection.createIndex({ lat: 1, lng: 1 }, { name: 'idx_bin_location' });
    await collection.createIndex({ status: 1 }, { name: 'idx_bin_status' });
    
    console.log('   ✓ Created new indexes with explicit names');
}

async function cleanupRoutesIndexes(db) {
    const collection = db.collection('routes');
    
    const indexes = await collection.indexes();
    console.log('   Current indexes:', indexes.map(idx => idx.name).join(', '));
    
    const problematicIndexes = ['id_1', 'driverId_1', 'status_1'];
    
    for (const indexName of problematicIndexes) {
        if (indexes.some(idx => idx.name === indexName)) {
            try {
                await collection.dropIndex(indexName);
                console.log(`   ✓ Dropped ${indexName}`);
            } catch (err) {
                console.log(`   ⚠️ Could not drop ${indexName}:`, err.message);
            }
        }
    }
    
    await collection.createIndex({ id: 1 }, { unique: true, name: 'idx_route_id' });
    await collection.createIndex({ driverId: 1 }, { name: 'idx_route_driver' });
    await collection.createIndex({ status: 1 }, { name: 'idx_route_status' });
    
    console.log('   ✓ Created new indexes with explicit names');
}

async function cleanupCollectionsIndexes(db) {
    const collection = db.collection('collections');
    
    const indexes = await collection.indexes();
    console.log('   Current indexes:', indexes.map(idx => idx.name).join(', '));
    
    const problematicIndexes = ['id_1', 'binId_1', 'driverId_1'];
    
    for (const indexName of problematicIndexes) {
        if (indexes.some(idx => idx.name === indexName)) {
            try {
                await collection.dropIndex(indexName);
                console.log(`   ✓ Dropped ${indexName}`);
            } catch (err) {
                console.log(`   ⚠️ Could not drop ${indexName}:`, err.message);
            }
        }
    }
    
    await collection.createIndex({ id: 1 }, { unique: true, name: 'idx_collection_id' });
    await collection.createIndex({ binId: 1 }, { name: 'idx_collection_bin' });
    await collection.createIndex({ driverId: 1 }, { name: 'idx_collection_driver' });
    
    console.log('   ✓ Created new indexes with explicit names');
}

async function cleanupSensorsIndexes(db) {
    const collection = db.collection('sensors');
    
    const indexes = await collection.indexes();
    console.log('   Current indexes:', indexes.map(idx => idx.name).join(', '));
    
    const problematicIndexes = ['imei_1', 'binId_1'];
    
    for (const indexName of problematicIndexes) {
        if (indexes.some(idx => idx.name === indexName)) {
            try {
                await collection.dropIndex(indexName);
                console.log(`   ✓ Dropped ${indexName}`);
            } catch (err) {
                console.log(`   ⚠️ Could not drop ${indexName}:`, err.message);
            }
        }
    }
    
    await collection.createIndex({ imei: 1 }, { unique: true, sparse: true, name: 'idx_sensor_imei' });
    await collection.createIndex({ binId: 1 }, { name: 'idx_sensor_bin' });
    
    console.log('   ✓ Created new indexes with explicit names');
}

// Run cleanup
cleanupIndexes().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
