#!/usr/bin/env node
// One-time fix: Set BIN-007 to correct Barwa Madinatna coordinates.
// Run: node fix-bin-007-coordinates.js
// Use when bin was showing at sensor/device GPS instead of the fixed installation address.

require('dotenv').config();
const { MongoClient } = require('mongodb');

const CORRECT_LAT = 25.1773;  // Barwa Madinatna area
const CORRECT_LNG = 51.6045;

async function fix() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'waste_management';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const bins = db.collection('bins');
        const result = await bins.updateOne(
            { id: 'BIN-007' },
            {
                $set: {
                    lat: CORRECT_LAT,
                    lng: CORRECT_LNG,
                    locationName: 'Barwa Madinatna'
                }
            }
        );
        if (result.matchedCount === 0) {
            console.log('BIN-007 not found in MongoDB (no change).');
        } else {
            console.log('BIN-007 coordinates updated to Barwa Madinatna:', CORRECT_LAT, CORRECT_LNG);
        }
    } finally {
        await client.close();
    }
}

fix().catch(e => {
    console.error(e);
    process.exit(1);
});
