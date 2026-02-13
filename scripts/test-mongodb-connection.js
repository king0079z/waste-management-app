#!/usr/bin/env node
/**
 * Test MongoDB and API connections for the waste management application.
 * Run with: node scripts/test-mongodb-connection.js
 * Ensure server is running (e.g. node server.js) or set BASE_URL.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function errMsg(e) {
    if (!e) return 'unknown error';
    return e.message || e.code || (typeof e === 'string' ? e : String(e));
}

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
                    resolve({ status: res.statusCode, data, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        req.end();
    });
}

async function run() {
    console.log('Testing connections to', BASE_URL);
    console.log('---');

    const issues = [];
    let passed = 0;
    let serverUnreachable = false;

    // 0. Quick check: is server reachable?
    try {
        await request(`${BASE_URL}/api/health/mongodb`);
    } catch (e) {
        const msg = errMsg(e);
        const code = e && (e.code || (e.message && e.message.split && e.message.split(' ')[0]));
        serverUnreachable = !!(msg && (
            (typeof msg === 'string' && (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('connect') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT'))) ||
            code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ECONNRESET' || code === 'ETIMEDOUT'
        ));
        if (serverUnreachable) {
            console.log('');
            console.log('*** SERVER NOT REACHABLE ***');
            console.log('Error:', msg);
            console.log('');
            console.log('Start the server first in another window:');
            console.log('  node server.js');
            console.log('');
            console.log('Then run this test again.');
            console.log('---');
            issues.push(`Server not reachable at ${BASE_URL} - ${msg}. Start server: node server.js`);
            console.log('Result: 0 checks passed, 1 issue (server not running)');
            process.exitCode = 1;
            return;
        }
    }

    // 1. MongoDB health
    try {
        const { status, data } = await request(`${BASE_URL}/api/health/mongodb`);
        if (status === 200 && data.ok) {
            console.log('OK  GET /api/health/mongodb ->', data.dbType || 'unknown', data.database || '');
            passed++;
        } else {
            issues.push(`/api/health/mongodb returned ${status} or ok:false - ${data.error || ''}`);
        }
    } catch (e) {
        issues.push(`/api/health/mongodb failed: ${errMsg(e)}`);
    }

    // 2. Data sync (full data from MongoDB when dbType is mongodb)
    try {
        const { status, data } = await request(`${BASE_URL}/api/data/sync`);
        if (status === 200 && data.success && data.data) {
            const d = data.data;
            const keys = Object.keys(d).filter((k) => k !== 'lastUpdate' && d[k] !== undefined);
            console.log('OK  GET /api/data/sync -> keys:', keys.join(', '));
            passed++;
            if (!keys.includes('users') || !keys.includes('bins')) {
                issues.push('GET /api/data/sync missing users or bins');
            }
            if (d.deletedBins === undefined && keys.length > 0) {
                console.log('    (deletedBins may be absent if using JSON storage)');
            } else if (Array.isArray(d.deletedBins)) {
                console.log('    deletedBins (MongoDB):', d.deletedBins.length);
            }
        } else {
            issues.push(`/api/data/sync returned ${status} or missing data`);
        }
    } catch (e) {
        issues.push(`/api/data/sync failed: ${errMsg(e)}`);
    }

    // 3. Deleted bins API
    try {
        const { status, data } = await request(`${BASE_URL}/api/bins/deleted`);
        if (status === 200 && data.success && Array.isArray(data.ids)) {
            console.log('OK  GET /api/bins/deleted -> ids:', data.ids.length);
            passed++;
        } else {
            issues.push(`/api/bins/deleted returned ${status} or invalid response`);
        }
    } catch (e) {
        issues.push(`/api/bins/deleted failed: ${errMsg(e)}`);
    }

    // 4. POST deleted bins (add then no-op)
    try {
        const { status } = await request(`${BASE_URL}/api/bins/deleted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ add: '__test_bin_id_remove_me' })
        });
        if (status === 200) {
            console.log('OK  POST /api/bins/deleted (add) -> 200');
            passed++;
        } else {
            issues.push(`POST /api/bins/deleted returned ${status}`);
        }
    } catch (e) {
        issues.push(`POST /api/bins/deleted failed: ${errMsg(e)}`);
    }

    // 5. Driver routes (requires at least one driver)
    try {
        const { status, data } = await request(`${BASE_URL}/api/driver/USR-003/routes`);
        if (status === 200 && data.success && Array.isArray(data.routes)) {
            console.log('OK  GET /api/driver/:id/routes -> routes:', data.routes.length);
            passed++;
        } else {
            issues.push(`/api/driver/:id/routes returned ${status}`);
        }
    } catch (e) {
        issues.push(`/api/driver/:id/routes failed: ${errMsg(e)}`);
    }

    // 6. Driver messages
    try {
        const { status, data } = await request(`${BASE_URL}/api/driver/USR-003/messages`);
        if (status === 200 && data.success && Array.isArray(data.messages)) {
            console.log('OK  GET /api/driver/:id/messages -> messages:', data.messages.length);
            passed++;
        } else {
            issues.push(`/api/driver/:id/messages returned ${status}`);
        }
    } catch (e) {
        issues.push(`/api/driver/:id/messages failed: ${errMsg(e)}`);
    }

    console.log('---');
    if (issues.length > 0) {
        console.log('Issues found:');
        issues.forEach((i) => console.log('  -', i));
        process.exitCode = 1;
    }
    console.log(`Result: ${passed} checks passed, ${issues.length} issues`);
}

run().catch((e) => {
    console.error('');
    console.error('CONNECTION ERROR:', errMsg(e));
    if (e && (e.code === 'ECONNREFUSED' || (e.message && e.message.includes('ECONNREFUSED')))) {
        console.error('');
        console.error('Server is not responding. Start the server first:');
        console.error('  node server.js');
        console.error('Then run this test again.');
    }
    process.exit(1);
});
