// backup-utility.js - Data Backup Utility for MongoDB Migration
// Creates safe backups before and after migration

const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

class BackupUtility {
    constructor() {
        this.backupDir = path.join(__dirname, 'backups');
        this.connectionString = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017';
        this.databaseName = process.env.MONGODB_DATABASE || 'waste_management';
    }

    async ensureBackupDir() {
        await fs.mkdir(this.backupDir, { recursive: true });
    }

    async backupJSONFile() {
        try {
            await this.ensureBackupDir();
            const dataFilePath = path.join(__dirname, 'data.json');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, `data-json-backup-${timestamp}.json`);
            
            console.log('📦 Creating backup of data.json...');
            const data = await fs.readFile(dataFilePath, 'utf8');
            await fs.writeFile(backupPath, data, 'utf8');
            
            console.log(`✅ Backup created: ${backupPath}`);
            return backupPath;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('⚠️ data.json file not found, skipping backup');
                return null;
            }
            throw error;
        }
    }

    async backupMongoDB() {
        try {
            await this.ensureBackupDir();
            
            console.log('📦 Creating MongoDB backup...');
            const client = new MongoClient(this.connectionString);
            await client.connect();
            const db = client.db(this.databaseName);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, `mongodb-backup-${timestamp}.json`);
            
            const collections = await db.listCollections().toArray();
            const backup = {
                database: this.databaseName,
                timestamp: new Date().toISOString(),
                collections: {}
            };
            
            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                // Skip system collections
                if (collectionName.startsWith('system.')) continue;
                
                const collection = db.collection(collectionName);
                const documents = await collection.find({}).toArray();
                backup.collections[collectionName] = documents;
                console.log(`   Backed up ${collectionName}: ${documents.length} documents`);
            }
            
            await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');
            await client.close();
            
            console.log(`✅ MongoDB backup created: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error('❌ MongoDB backup failed:', error.message);
            throw error;
        }
    }

    async restoreFromBackup(backupPath) {
        try {
            console.log(`📥 Restoring from backup: ${backupPath}`);
            
            const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
            
            if (backupData.collections) {
                // MongoDB backup
                const client = new MongoClient(this.connectionString);
                await client.connect();
                const db = client.db(this.databaseName);
                
                for (const [collectionName, documents] of Object.entries(backupData.collections)) {
                    const collection = db.collection(collectionName);
                    await collection.deleteMany({});
                    if (documents.length > 0) {
                        await collection.insertMany(documents);
                    }
                    console.log(`   Restored ${collectionName}: ${documents.length} documents`);
                }
                
                await client.close();
                console.log('✅ MongoDB restore completed');
            } else {
                // JSON file backup
                const dataFilePath = path.join(__dirname, 'data.json');
                await fs.writeFile(dataFilePath, JSON.stringify(backupData, null, 2), 'utf8');
                console.log('✅ JSON file restore completed');
            }
        } catch (error) {
            console.error('❌ Restore failed:', error.message);
            throw error;
        }
    }

    async listBackups() {
        try {
            await this.ensureBackupDir();
            const files = await fs.readdir(this.backupDir);
            const backups = files.filter(f => f.endsWith('.json'));
            
            console.log(`📋 Found ${backups.length} backup(s):`);
            backups.forEach(backup => {
                console.log(`   - ${backup}`);
            });
            
            return backups.map(b => path.join(this.backupDir, b));
        } catch (error) {
            console.error('❌ Failed to list backups:', error.message);
            return [];
        }
    }
}

// CLI interface
if (require.main === module) {
    const backup = new BackupUtility();
    const command = process.argv[2];
    
    (async () => {
        try {
            switch (command) {
                case 'json':
                    await backup.backupJSONFile();
                    break;
                case 'mongo':
                    await backup.backupMongoDB();
                    break;
                case 'all':
                    await backup.backupJSONFile();
                    await backup.backupMongoDB();
                    break;
                case 'list':
                    await backup.listBackups();
                    break;
                case 'restore':
                    const backupPath = process.argv[3];
                    if (!backupPath) {
                        console.error('❌ Please provide backup file path');
                        process.exit(1);
                    }
                    await backup.restoreFromBackup(backupPath);
                    break;
                default:
                    console.log('Usage:');
                    console.log('  node backup-utility.js json    - Backup data.json');
                    console.log('  node backup-utility.js mongo   - Backup MongoDB');
                    console.log('  node backup-utility.js all     - Backup both');
                    console.log('  node backup-utility.js list    - List backups');
                    console.log('  node backup-utility.js restore <path> - Restore from backup');
            }
            process.exit(0);
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = BackupUtility;
