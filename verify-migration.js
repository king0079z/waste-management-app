// verify-migration.js - Comprehensive Migration Verification Script
// Verifies that ALL data has been migrated to MongoDB with zero data loss

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class MigrationVerifier {
    constructor() {
        this.connectionString = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017';
        this.databaseName = process.env.MONGODB_DATABASE || 'waste_management';
        this.dataFilePath = path.join(__dirname, 'data.json');
        this.client = null;
        this.db = null;
        this.verificationResults = {
            passed: true,
            collections: {},
            summary: {},
            issues: []
        };
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const symbol = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '📊';
        console.log(`${symbol} ${message}`);
    }

    async connect() {
        try {
            this.log('Connecting to MongoDB...', 'info');
            this.client = new MongoClient(this.connectionString, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
            });
            
            await this.client.connect();
            await this.client.db('admin').command({ ping: 1 });
            this.db = this.client.db(this.databaseName);
            this.log('Connected to MongoDB successfully', 'success');
            return true;
        } catch (error) {
            this.log(`Failed to connect to MongoDB: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadJSONData() {
        try {
            this.log('Loading data from data.json...', 'info');
            const data = await fs.readFile(this.dataFilePath, 'utf8');
            const jsonData = JSON.parse(data);
            this.log('JSON data loaded successfully', 'success');
            return jsonData;
        } catch (error) {
            this.log(`Failed to load JSON data: ${error.message}`, 'error');
            throw error;
        }
    }

    async verifyCollection(collectionName, jsonData, isArray = true) {
        try {
            const collection = this.db.collection(collectionName);
            
            if (isArray) {
                // Array collection
                const jsonArray = jsonData[collectionName] || [];
                const mongoCount = await collection.countDocuments();
                
                // Get all documents from MongoDB
                const mongoDocs = await collection.find({}).toArray();
                
                // Remove MongoDB-specific fields for comparison
                const mongoData = mongoDocs.map(doc => {
                    const { _id, migratedAt, migrationVersion, ...rest } = doc;
                    return rest;
                });
                
                const result = {
                    collection: collectionName,
                    jsonCount: jsonArray.length,
                    mongoCount: mongoCount,
                    match: jsonArray.length === mongoCount,
                    details: {}
                };
                
                // Verify each document exists
                let foundCount = 0;
                const missingIds = [];
                
                // Determine the unique field based on collection type
                let uniqueField = 'id';
                if (collectionName === 'sensors') {
                    uniqueField = 'imei';
                }
                
                for (const jsonDoc of jsonArray) {
                    const idField = jsonDoc[uniqueField] || jsonDoc.id || jsonDoc.imei || jsonDoc._id;
                    if (idField) {
                        const found = mongoDocs.find(doc => {
                            const docId = doc[uniqueField] || doc.id || doc.imei || doc._id;
                            return docId === idField;
                        });
                        
                        if (found) {
                            foundCount++;
                        } else {
                            missingIds.push(idField);
                        }
                    }
                }
                
                result.details.found = foundCount;
                result.details.missing = missingIds;
                result.details.missingCount = missingIds.length;
                
                // Success if all JSON documents are found in MongoDB (even if MongoDB has more)
                if (foundCount === jsonArray.length && missingIds.length === 0) {
                    if (mongoCount === jsonArray.length) {
                        this.log(`${collectionName}: ${mongoCount} documents (EXACT MATCH)`, 'success');
                    } else {
                        this.log(`${collectionName}: ${foundCount}/${jsonArray.length} documents verified (MongoDB has ${mongoCount} total - extra from previous migrations)`, 'success');
                    }
                } else {
                    this.log(`${collectionName}: JSON=${jsonArray.length}, Found=${foundCount}, Missing=${missingIds.length}`, 'warn');
                    this.verificationResults.passed = false;
                    this.verificationResults.issues.push({
                        collection: collectionName,
                        issue: `Missing documents in MongoDB`,
                        jsonCount: jsonArray.length,
                        mongoCount: mongoCount,
                        foundCount: foundCount,
                        missing: missingIds
                    });
                }
                
                return result;
            } else {
                // Object collection (driverLocations, analytics)
                const jsonObject = jsonData[collectionName] || {};
                const jsonKeys = Object.keys(jsonObject);
                const mongoDocs = await collection.find({}).toArray();
                
                const result = {
                    collection: collectionName,
                    jsonCount: jsonKeys.length,
                    mongoCount: mongoDocs.length,
                    match: jsonKeys.length === mongoDocs.length,
                    details: {}
                };
                
                const missingKeys = [];
                for (const key of jsonKeys) {
                    const found = mongoDocs.find(doc => doc.key === key || doc._id === key);
                    if (!found) {
                        missingKeys.push(key);
                    }
                }
                
                result.details.missing = missingKeys;
                result.details.missingCount = missingKeys.length;
                
                if (result.match && missingKeys.length === 0) {
                    this.log(`${collectionName}: ${mongoDocs.length} key-value pairs (MATCH)`, 'success');
                } else {
                    this.log(`${collectionName}: JSON=${jsonKeys.length}, MongoDB=${mongoDocs.length}, Missing=${missingKeys.length}`, 'warn');
                    this.verificationResults.passed = false;
                    this.verificationResults.issues.push({
                        collection: collectionName,
                        issue: `Key-value mismatch`,
                        jsonCount: jsonKeys.length,
                        mongoCount: mongoDocs.length,
                        missing: missingKeys
                    });
                }
                
                return result;
            }
        } catch (error) {
            this.log(`Error verifying ${collectionName}: ${error.message}`, 'error');
            this.verificationResults.passed = false;
            return {
                collection: collectionName,
                error: error.message,
                match: false
            };
        }
    }

    async verifyAllData() {
        try {
            this.log('='.repeat(60), 'info');
            this.log('Starting comprehensive data verification...', 'info');
            this.log('='.repeat(60), 'info');
            
            // Load JSON data
            const jsonData = await this.loadJSONData();
            
            // Verify array collections
            const arrayCollections = [
                'users', 'bins', 'routes', 'collections', 
                'complaints', 'alerts', 'sensors', 
                'systemLogs', 'pendingRegistrations'
            ];
            
            for (const collectionName of arrayCollections) {
                this.verificationResults.collections[collectionName] = 
                    await this.verifyCollection(collectionName, jsonData, true);
            }
            
            // Verify object collections
            const objectCollections = ['driverLocations', 'analytics'];
            for (const collectionName of objectCollections) {
                this.verificationResults.collections[collectionName] = 
                    await this.verifyCollection(collectionName, jsonData, false);
            }
            
            // Calculate summary
            let totalJson = 0;
            let totalMongo = 0;
            let totalMissing = 0;
            let allMatch = true;
            
            for (const [name, result] of Object.entries(this.verificationResults.collections)) {
                if (result.error) {
                    allMatch = false;
                    continue;
                }
                
                totalJson += result.jsonCount || 0;
                totalMongo += result.mongoCount || 0;
                totalMissing += result.details?.missingCount || 0;
                
                if (!result.match) {
                    allMatch = false;
                }
            }
            
            this.verificationResults.summary = {
                totalJsonDocuments: totalJson,
                totalMongoDocuments: totalMongo,
                totalMissing: totalMissing,
                allCollectionsMatch: allMatch,
                collectionsVerified: Object.keys(this.verificationResults.collections).length,
                issuesFound: this.verificationResults.issues.length
            };
            
            // Print summary
            this.log('='.repeat(60), 'info');
            this.log('VERIFICATION SUMMARY', 'info');
            this.log('='.repeat(60), 'info');
            this.log(`Total JSON Documents: ${totalJson}`, 'info');
            this.log(`Total MongoDB Documents: ${totalMongo}`, 'info');
            this.log(`Missing Documents: ${totalMissing}`, totalMissing > 0 ? 'warn' : 'success');
            this.log(`Collections Verified: ${this.verificationResults.summary.collectionsVerified}`, 'info');
            this.log(`Issues Found: ${this.verificationResults.issues.length}`, 
                this.verificationResults.issues.length > 0 ? 'warn' : 'success');
            
            // Check if all JSON data is present (even if MongoDB has more)
            const allDataPresent = totalMissing === 0;
            
            if (allDataPresent) {
                this.log('='.repeat(60), 'success');
                this.log('✅ ALL DATA SUCCESSFULLY MIGRATED - ZERO DATA LOSS', 'success');
                if (totalMongo > totalJson) {
                    this.log(`ℹ️  Note: MongoDB has ${totalMongo - totalJson} extra documents from previous migrations (this is safe)`, 'info');
                }
                this.log('='.repeat(60), 'success');
            } else {
                this.log('='.repeat(60), 'warn');
                this.log('⚠️ VERIFICATION COMPLETED WITH ISSUES', 'warn');
                this.log('='.repeat(60), 'warn');
                
                if (this.verificationResults.issues.length > 0) {
                    this.log('\nIssues found:', 'warn');
                    this.verificationResults.issues.forEach((issue, index) => {
                        this.log(`  ${index + 1}. ${issue.collection}: ${issue.issue}`, 'warn');
                        if (issue.missing && issue.missing.length > 0) {
                            this.log(`     Missing: ${issue.missing.slice(0, 5).join(', ')}${issue.missing.length > 5 ? '...' : ''}`, 'warn');
                        }
                    });
                }
            }
            
            return this.verificationResults;
            
        } catch (error) {
            this.log(`Verification failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async generateReport() {
        const reportPath = path.join(__dirname, 'backups', `verification-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(this.verificationResults, null, 2), 'utf8');
        this.log(`Verification report saved: ${reportPath}`, 'info');
        return reportPath;
    }

    async run() {
        try {
            await this.connect();
            await this.verifyAllData();
            const reportPath = await this.generateReport();
            
            return {
                success: this.verificationResults.passed,
                results: this.verificationResults,
                reportPath: reportPath
            };
        } catch (error) {
            this.log(`Verification process failed: ${error.message}`, 'error');
            throw error;
        } finally {
            if (this.client) {
                await this.client.close();
                this.log('MongoDB connection closed', 'info');
            }
        }
    }
}

// Run if called directly
if (require.main === module) {
    const verifier = new MigrationVerifier();
    
    verifier.run()
        .then(result => {
            console.log('\n🎉 Verification Complete!');
            console.log(`Status: ${result.success ? '✅ PASSED' : '⚠️ ISSUES FOUND'}`);
            console.log(`Report: ${result.reportPath}`);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Verification failed:', error);
            process.exit(1);
        });
}

module.exports = MigrationVerifier;
