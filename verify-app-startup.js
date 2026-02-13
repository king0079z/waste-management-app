#!/usr/bin/env node
// verify-app-startup.js - Quick check that server dependencies load and key modules exist

'use strict';

let failed = 0;

function check(name, fn) {
    try {
        fn();
        console.log('OK', name);
        return true;
    } catch (e) {
        console.error('FAIL', name, e.message);
        failed++;
        return false;
    }
}

check('dotenv', () => require('dotenv').config());
check('env-loader', () => {
    const env = require('./env-loader.js');
    if (typeof env.getEnvVar !== 'function') throw new Error('getEnvVar missing');
});
check('findy-config', () => {
    const c = require('./findy-config.js');
    if (!c.findy || !c.findy.baseURL) throw new Error('findy config missing');
});
check('findy-api-service', () => {
    const F = require('./findy-api-service.js');
    const api = new F();
    if (typeof api.login !== 'function') throw new Error('login missing');
});
check('database-manager', () => {
    const D = require('./database-manager.js');
    const db = new D();
    if (typeof db.initialize !== 'function') throw new Error('initialize missing');
});
check('express + core deps', () => {
    require('express');
    require('path');
    require('http');
    require('ws');
});

if (failed > 0) {
    console.error('\n' + failed + ' check(s) failed.');
    process.exit(1);
}
console.log('\nAll checks passed. You can run: npm start');
process.exit(0);
