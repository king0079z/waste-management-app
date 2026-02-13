#!/usr/bin/env node
/**
 * Seed many bins for map/API load testing (e.g. 10,000 bins).
 * Run with: node scripts/seed-bins.js [count]
 * Default count: 10000. Requires server running (node server.js) and MongoDB.
 * Example: node scripts/seed-bins.js 10000
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || process.env.API_URL || 'http://localhost:8080';
const DEFAULT_COUNT = parseInt(process.env.SEED_COUNT, 10) || 10000;
const BULK_CHUNK = 2000;

// Doha-area bounding box (approximate)
const MIN_LAT = 25.15;
const MAX_LAT = 25.45;
const MIN_LNG = 51.35;
const MAX_LNG = 51.65;

function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const lib = u.protocol === 'https:' ? https : http;
        const req = lib.request(url, { method: options.method || 'GET', ...options }, (res) => {
            let data = '';
            res.on('data', (ch) => (data += ch));
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        req.end();
    });
}

function generateBins(count) {
    const bins = [];
    const types = ['paper', 'general', 'mixed'];
    const statuses = ['normal', 'warning', 'needs_attention'];
    for (let i = 0; i < count; i++) {
        const lat = MIN_LAT + Math.random() * (MAX_LAT - MIN_LAT);
        const lng = MIN_LNG + Math.random() * (MAX_LNG - MIN_LNG);
        bins.push({
            id: `SEED-${Date.now()}-${i}`,
            location: `Seed bin ${i + 1}`,
            lat: Math.round(lat * 1e6) / 1e6,
            lng: Math.round(lng * 1e6) / 1e6,
            fill: Math.floor(Math.random() * 100),
            type: types[Math.floor(Math.random() * types.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            capacity: 100,
            batteryLevel: 70 + Math.floor(Math.random() * 30),
            temperature: 20 + Math.floor(Math.random() * 15),
            lastUpdate: new Date().toISOString(),
            lastCollection: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return bins;
}

async function run() {
    const count = parseInt(process.argv[2], 10) || DEFAULT_COUNT;
    console.log(`Seeding ${count} bins to ${BASE_URL} (chunks of ${BULK_CHUNK})...`);

    const allBins = generateBins(count);
    let totalAdded = 0;
    for (let offset = 0; offset < allBins.length; offset += BULK_CHUNK) {
        const chunk = allBins.slice(offset, offset + BULK_CHUNK);
        const { status, data } = await request(`${BASE_URL}/api/bins/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bins: chunk })
        });
        if (status !== 200 || !data.success) {
            console.error(`Chunk failed: ${status}`, data);
            process.exitCode = 1;
            return;
        }
        totalAdded += data.added || chunk.length;
        console.log(`  ${offset + chunk.length}/${count} – total on server: ${data.total}`);
    }

    console.log(`Done. ${totalAdded} bins added. Test map with bbox API or set window.__WASTE_USE_BBOX_BINS__ = true for bbox-based loading.`);
}

run().catch((e) => {
    console.error('Error:', e.message);
    if (e.code === 'ECONNREFUSED') {
        console.error('Start the server first: node server.js');
    }
    process.exit(1);
});
