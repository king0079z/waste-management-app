// add-sensor-to-mongodb.js - Add sensor 865456053885594 to MongoDB

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function addSensorToMongoDB() {
    console.log('🔧 Adding sensor 865456053885594 to MongoDB...\n');
    
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'waste_management';
    
    console.log(`Connecting to: ${mongoUrl}`);
    console.log(`Database: ${dbName}\n`);
    
    const client = new MongoClient(mongoUrl);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');
        
        const db = client.db(dbName);
        const sensorsCollection = db.collection('sensors');
        
        // Check if sensor already exists
        const existingSensor = await sensorsCollection.findOne({ imei: '865456053885594' });
        
        if (existingSensor) {
            console.log('ℹ️ Sensor 865456053885594 already exists in MongoDB:');
            console.log(JSON.stringify(existingSensor, null, 2));
        } else {
            // Add the sensor
            const newSensor = {
                imei: '865456053885594',
                binId: 'BIN-007',
                name: 'Barwa Madinatna Sensor',
                dateAdded: new Date().toISOString(),
                status: 'active',
                deviceInfo: null,
                deviceOwnerID: null,
                deviceGroupID: null,
                deviceStatusID: null,
                deviceVersionID: null,
                lastModTime: null,
                gps: {
                    lat: 25.2005,
                    lng: 51.5483,
                    source: 'initial'
                },
                lat: 25.2005,
                lng: 51.5483,
                country: 'Qatar',
                battery: null,
                batteryLevel: null,
                fillLevel: null,
                temperature: null,
                signal: null,
                locationName: 'Barwa Madinatna',
                lastSeen: new Date().toISOString(),
                lastUpdate: new Date().toISOString(),
                rawData: null
            };
            
            const result = await sensorsCollection.insertOne(newSensor);
            console.log('✅ Sensor added to MongoDB!');
            console.log(`   Insert ID: ${result.insertedId}`);
            console.log(`   IMEI: ${newSensor.imei}`);
            console.log(`   Linked to Bin: ${newSensor.binId}`);
        }
        
        // List all sensors
        console.log('\n📡 All sensors in MongoDB:');
        const allSensors = await sensorsCollection.find({}).toArray();
        allSensors.forEach((s, i) => {
            console.log(`   ${i + 1}. IMEI: ${s.imei}, Bin: ${s.binId || 'Not linked'}, Status: ${s.status || 'unknown'}`);
        });
        
        // Also update BIN-007 to have the sensorIMEI field
        const binsCollection = db.collection('bins');
        const bin007 = await binsCollection.findOne({ id: 'BIN-007' });
        
        if (bin007) {
            console.log('\n🗑️ Updating BIN-007 with sensor link...');
            await binsCollection.updateOne(
                { id: 'BIN-007' },
                { 
                    $set: { 
                        sensorIMEI: '865456053885594',
                        sensorStatus: 'active',
                        hasSensor: true
                    } 
                }
            );
            console.log('✅ BIN-007 updated with sensor link');
        } else {
            console.log('\n⚠️ BIN-007 not found in MongoDB');
        }
        
        console.log('\n✅ Done!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

addSensorToMongoDB().catch(console.error);
