// server.js - Waste Management System - World-Class Operations
// =============================================================================
// OPERATIONAL STANDARDS:
// - Health: /api/health for load balancers and monitoring
// - Graceful shutdown: SIGINT/SIGTERM close server, WebSocket, and DB cleanly
// - Request logging: mutation operations logged with timestamp
// - Data integrity: driver rating/efficiency sanitized; sync merges validated
// - Real-time: WebSocket broadcast for driver location and data updates
// =============================================================================

// Load environment variables FIRST
require('dotenv').config();

// Validate required env at startup (fail fast with clear message)
function validateEnv() {
    const dbType = (process.env.DATABASE_TYPE || process.env.DB_TYPE || 'json').toLowerCase();
    if (dbType === 'mongodb') {
        const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
        if (!uri || uri.includes('<') || uri.includes('xxxxx')) {
            console.warn('⚠️ MongoDB is set but MONGODB_URI/MONGODB_URL is missing or placeholder. Set it in .env or deployment env.');
        }
    }
    if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
        console.warn('⚠️ NODE_ENV=production: consider setting PORT explicitly.');
    }
}
validateEnv();

const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const DatabaseManager = require('./database-manager.js');
const FindyAPIService = require('./findy-api-service.js');

// Create Express app and HTTP server
const app = express();
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
});

// WebSocket connection handling
const clients = new Set();

// Route IDs deleted by server (admin); ignore these from client sync for 2 min so they stay deleted
const recentlyDeletedRouteIds = new Set();
const RECENTLY_DELETED_TTL_MS = 2 * 60 * 1000;
function markRouteRecentlyDeleted(routeId) {
    recentlyDeletedRouteIds.add(routeId);
    setTimeout(() => recentlyDeletedRouteIds.delete(routeId), RECENTLY_DELETED_TTL_MS);
}

// Heartbeat: detect dead connections (world-class live operation)
const WS_HEARTBEAT_INTERVAL_MS = 30000;
const wssHeartbeat = setInterval(() => {
    clients.forEach((client) => {
        if (client.isAlive === false) {
            clients.delete(client);
            try { client.terminate(); } catch (_) {}
            return;
        }
        client.isAlive = false;
        try {
            client.ping();
        } catch (_) {}
    });
}, WS_HEARTBEAT_INTERVAL_MS);

wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    console.log('🔌 New WebSocket connection established');
    clients.add(ws);
    
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString()
    }));
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                    break;
                case 'client_info':
                    // Handle both authenticated and anonymous clients
                    const userId = message.userId || 'anonymous';
                    const userType = message.userType || 'guest';
                    
                    if (message.userId) {
                        console.log(`👤 Client authenticated: ${message.userId} (${message.userType})`);
                        ws.userId = message.userId;
                        ws.userType = message.userType;
                        
                        // Enhanced logging for driver connections
                        if (message.userId.startsWith('USR-')) {
                            console.log(`🚗 Driver ${message.userId} connected via WebSocket`);
                        }
                    } else {
                        console.log('👤 Client connected (not authenticated yet)');
                        console.log('   User Agent:', message.userAgent?.substring(0, 50) + '...');
                    }
                    break;
                case 'chat_message':
                    handleChatMessage(ws, message);
                    break;
                case 'typing_indicator':
                    handleTypingIndicator(ws, message);
                    break;
                case 'sensor_update':
                    handleSensorUpdate(ws, message);
                    break;
                case 'bin_fill_update':
                    handleBinFillUpdate(ws, message);
                    break;
                case 'start_sensor_tracking':
                    handleStartSensorTracking(ws, message);
                    break;
                case 'stop_sensor_tracking':
                    handleStopSensorTracking(ws, message);
                    break;
                case 'driver_location':
                    handleDriverLocation(ws, message);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        clients.delete(ws);
    });
    
    ws.on('error', () => {
        clients.delete(ws);
    });
});

// Broadcast function for real-time updates
// REMOVED: Duplicate broadcastToClients function (conflicted with one at line 2442)
// The primary broadcastToClients function is defined near the end of the file

// WebSocket handler for sensor updates
function handleSensorUpdate(ws, message) {
    console.log(`📡 Sensor update received: ${message.imei}`);
    
    // Broadcast sensor update to all clients
    broadcastToClients({
        type: 'sensor_update',
        imei: message.imei,
        binId: message.binId,
        fillLevel: message.fillLevel,
        battery: message.battery,
        temperature: message.temperature,
        gps: message.gps,
        timestamp: new Date().toISOString()
    });
}

// WebSocket handler for bin fill level updates
function handleBinFillUpdate(ws, message) {
    console.log(`🗑️ Bin fill update received: ${message.binId}`);
    
    // Broadcast bin update to all clients
    broadcastToClients({
        type: 'bin_fill_update',
        binId: message.binId,
        fillLevel: message.fillLevel,
        status: message.status,
        timestamp: new Date().toISOString()
    });
}

// WebSocket handler to start sensor tracking
async function handleStartSensorTracking(ws, message) {
    const { imei } = message;
    console.log(`🎯 Starting sensor tracking for ${imei}`);
    
    try {
        const result = await findyAPI.startLiveTracking(imei, (data) => {
            // Broadcast sensor data to all clients
            broadcastToClients({
                type: 'findy_livetracking_update',
                imei,
                data,
                timestamp: new Date().toISOString()
            });
        });
        
        ws.send(JSON.stringify({
            type: 'sensor_tracking_started',
            imei,
            success: result.success,
            message: result.message
        }));
    } catch (error) {
        console.error(`❌ Error starting sensor tracking for ${imei}:`, error);
        ws.send(JSON.stringify({
            type: 'sensor_tracking_error',
            imei,
            error: error.message
        }));
    }
}

// WebSocket handler to stop sensor tracking
function handleStopSensorTracking(ws, message) {
    const { imei } = message;
    console.log(`🛑 Stopping sensor tracking for ${imei}`);
    
    const result = findyAPI.stopLiveTracking(imei);
    ws.send(JSON.stringify({
        type: 'sensor_tracking_stopped',
        imei,
        success: result.success,
        message: result.message
    }));
}

// WebSocket handler for live driver GPS (driver app sends; server persists and broadcasts to dashboard)
async function handleDriverLocation(ws, message) {
    const { driverId, lat, lng, timestamp, accuracy, speed, heading } = message;
    if (!driverId || lat == null || lng == null) {
        console.warn('⚠️ driver_location missing driverId or lat/lng');
        return;
    }
    try {
        if (dbManager && typeof dbManager.updateDriverLocation === 'function') {
            await dbManager.updateDriverLocation(
                driverId,
                parseFloat(lat),
                parseFloat(lng),
                accuracy != null ? parseFloat(accuracy) : null,
                speed != null ? parseFloat(speed) : 0
            );
        }
        const payload = {
            type: 'driver_location',
            driverId,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            timestamp: timestamp || new Date().toISOString(),
            accuracy: accuracy != null ? parseFloat(accuracy) : null,
            speed: speed != null ? parseFloat(speed) : null,
            heading: heading != null ? parseFloat(heading) : null
        };
        broadcastToClients(payload);
        if (clients.size > 0) {
            console.log(`📍 Driver ${driverId} GPS via WebSocket → broadcast to ${clients.size} client(s)`);
        }
    } catch (err) {
        console.error('❌ handleDriverLocation error:', err);
    }
}

// Broadcast sensor update to all clients
function broadcastSensorUpdate(imei, sensorData) {
    broadcastToClients({
        type: 'sensor_update',
        imei,
        data: sensorData,
        timestamp: new Date().toISOString()
    });
}

// Sensor polling service configuration
// Note: Sensor fill data cadence is configurable (Admin → Sensor Fill Data Interval; default 30 min).
const SENSOR_POLL_INTERVAL = 60000; // 60 seconds (server polls Findy; sensors push at admin-configured interval)
let sensorPollingActive = false;

// Start sensor polling service
async function startSensorPollingService() {
    if (sensorPollingActive) {
        console.log('⚠️ Sensor polling service already running');
        return;
    }

    console.log('🔄 Starting sensor polling service...');
    console.log(`📊 Polling interval: ${SENSOR_POLL_INTERVAL / 1000} seconds`);
    
    sensorPollingActive = true;

    // Initial poll
    await pollAllSensors();

    // Set up recurring polling
    setInterval(async () => {
        if (sensorPollingActive) {
            await pollAllSensors();
        }
    }, SENSOR_POLL_INTERVAL);
}

// Log Findy "credentials not configured" only once per process to avoid log spam
let _findyCredsWarningLogged = false;
let _findyCredsNotSetWarnLogged = false;

// Poll all active sensors - world-class: explicit return, broadcast auth failure and poll summary
async function pollAllSensors() {
    const pollStartTime = Date.now();
    try {
        if (!findyAPI.isAuthenticated()) {
            if (!_findyCredsWarningLogged) {
                _findyCredsWarningLogged = true;
                console.log('🔐 Findy API session expired or not authenticated, attempting auto-login...');
                console.log('   API URL:', findyAPI.baseUrl);
                console.log('   Username:', findyAPI.username ? '✓ Set' : '✗ Missing');
                console.log('   Password:', findyAPI.password ? '✓ Set' : '✗ Missing');
                console.log('   API Key:', findyAPI.apiKey ? '✓ Set' : '✗ Missing');
            }

            if (findyAPI.username && findyAPI.password) {
                try {
                    const authResult = await findyAPI.login();
                    if (authResult.success) {
                        console.log('✅ Findy API re-authentication successful');
                    } else {
                        console.error('❌ Findy API authentication FAILED:', authResult.error);
                        console.error('   ⚠️ SENSOR POLLING DISABLED until auth is fixed. Check .env credentials.');
                        broadcastToClients({
                            type: 'system_alert',
                            alertType: 'sensor_auth_failed',
                            message: 'Sensor API authentication failed - data may be stale',
                            timestamp: new Date().toISOString()
                        });
                        return { success: false, error: 'Authentication failed' };
                    }
                } catch (authError) {
                    console.error('❌ Authentication exception:', authError.message);
                    broadcastToClients({
                        type: 'system_alert',
                        alertType: 'sensor_auth_failed',
                        message: authError.message,
                        timestamp: new Date().toISOString()
                    });
                    return { success: false, error: authError.message };
                }
            } else {
                if (!_findyCredsNotSetWarnLogged) {
                    _findyCredsNotSetWarnLogged = true;
                    console.warn('⚠️ Findy API credentials not configured. Add FINDY_API_USERNAME and FINDY_API_PASSWORD in Render → Environment (or .env locally), then redeploy.');
                }
                return { success: false, error: 'Credentials not configured' };
            }
        }

        const allData = await dbManager.getAllData();
        sensorUpdateCache = { data: allData, lastFetch: Date.now() };
        const sensors = allData.sensors || [];

        if (sensors.length === 0) {
            console.log('ℹ️ No sensors registered in database');
            return { success: true, message: 'No sensors to poll' };
        }

        const activeSensors = sensors.filter(s =>
            s.imei &&
            s.status !== 'inactive' &&
            s.status !== 'offline' &&
            s.status !== 'removed'
        );

        console.log(`🔄 Polling ${activeSensors.length} active sensors (of ${sensors.length} total)...`);

        const pollResults = await Promise.allSettled(
            activeSensors.map(sensor => pollSensor(sensor, allData))
        );

        const successfulList = [];
        const failedList = [];
        pollResults.forEach((result, index) => {
            const sensor = activeSensors[index];
            if (result.status === 'fulfilled' && result.value?.success) {
                successfulList.push({ imei: sensor.imei, binId: sensor.binId, fillLevel: result.value.data?.fillLevel });
            } else {
                failedList.push({
                    imei: sensor.imei,
                    error: result.reason?.message || result.value?.error || 'Unknown error'
                });
            }
        });

        const pollDuration = Date.now() - pollStartTime;
        console.log(`✅ Sensor poll complete in ${pollDuration}ms: ${successfulList.length}/${activeSensors.length} success`);
        if (failedList.length > 0) {
            failedList.forEach(f => console.log(`   ✗ ${f.imei}: ${f.error}`));
        }

        broadcastToClients({
            type: 'sensor_poll_complete',
            successful: successfulList.length,
            failed: failedList.length,
            duration: pollDuration,
            timestamp: new Date().toISOString()
        });

        return { success: true, successful: successfulList.length, failed: failedList.length };
    } catch (error) {
        console.error('❌ Critical error in sensor polling:', error);
        broadcastToClients({
            type: 'system_error',
            errorType: 'sensor_poll_failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
        return { success: false, error: error.message };
    }
}

// Poll a single sensor - use getDevice for comprehensive data
async function pollSensor(sensor, cachedData = null) {
    try {
        const imei = sensor.imei;

        // Check if API is authenticated
        if (!findyAPI.isAuthenticated()) {
            console.warn(`⚠️ Cannot poll sensor ${imei}: Findy API not authenticated`);
            return { success: false, imei, error: 'Not authenticated' };
        }

        // Use getDevice for comprehensive sensor data (battery, measurements, etc.)
        // getLiveTracking only returns GPS data
        const result = await findyAPI.getDevice(imei);

        if (result.success && result.data) {
            // Parse the comprehensive device data (fill, battery, etc.)
            const deviceData = Array.isArray(result.data) ? result.data[0] : result.data;
            const sensorData = extractSensorDataFromDevice(deviceData, imei);

            // Fetch live GPS from Findy livetracking endpoint (GET /device/{imei}/livetracking)
            // GET /device/{imei} may not include ingps/incell; livetracking returns current position
            const liveResult = await findyAPI.getLiveTracking(imei);
            if (liveResult.success && liveResult.data && liveResult.data.gps) {
                const g = liveResult.data.gps;
                const lat = parseFloat(g.lat);
                const lng = parseFloat(g.lng);
                if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
                    sensorData.gps = {
                        lat,
                        lng,
                        speed: parseFloat(g.speed) || 0,
                        accuracy: parseFloat(g.accuracy) || 0,
                        type: 'GPS'
                    };
                    console.log(`📍 Live GPS from Findy (${imei.slice(-6)}): ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                }
            }

            // Update sensor in database (bin lat/lng will be set from sensorData.gps)
            await updateSensorAndBin(sensor, sensorData, cachedData);

            // Broadcast update to all connected clients
            broadcastSensorUpdate(imei, sensorData);

            return { success: true, imei, data: sensorData };
        } else {
            console.warn(`⚠️ Failed to get data for sensor ${imei}:`, result.error);
            return { success: false, imei, error: result.error };
        }
    } catch (error) {
        console.error(`❌ Error polling sensor ${sensor.imei}:`, error);
        return { success: false, imei: sensor.imei, error: error.message };
    }
}

// Extract sensor data from comprehensive device response
function extractSensorDataFromDevice(deviceData, imei) {
    if (!deviceData) {
        console.log(`⚠️ No device data for ${imei}`);
        return {
            imei,
            fillLevel: 0,
            battery: 0,
            temperature: 0,
            signal: 0,
            status: 'unknown',
            lastUpdate: new Date().toISOString()
        };
    }
    
    // Debug logging disabled for performance - enable if needed for troubleshooting
    // console.log(`📊 Raw device data structure for ${imei}:`, Object.keys(deviceData));
    
    // Extract battery from various locations
    let battery = 0;
    if (deviceData.battery !== undefined && deviceData.battery !== null) {
        battery = parseFloat(deviceData.battery) || 0;
    } else if (deviceData.deviceInfo?.battery !== undefined) {
        battery = parseFloat(deviceData.deviceInfo.battery) || 0;
    } else if (deviceData.passport?.battery !== undefined) {
        battery = parseFloat(deviceData.passport.battery) || 0;
    } else if (deviceData.report?.measurement) {
        // Search in measurement for battery-related dataTypes
        const measurement = deviceData.report.measurement;
        for (const key in measurement) {
            const item = measurement[key];
            if (item?.dataType?.name?.toLowerCase().includes('battery') ||
                item?.dataType?.uri?.toLowerCase().includes('battery')) {
                battery = parseFloat(item.value) || 0;
                break;
            }
        }
    }
    
    // Extract temperature from various locations  
    let temperature = 0;
    if (deviceData.temperature !== undefined && deviceData.temperature !== null) {
        temperature = parseFloat(deviceData.temperature) || 0;
    } else if (deviceData.deviceInfo?.temperature !== undefined) {
        temperature = parseFloat(deviceData.deviceInfo.temperature) || 0;
    } else if (deviceData.report?.measurement) {
        const measurement = deviceData.report.measurement;
        
        // Check OMA LwM2M Temperature object (3303)
        if (measurement['3303']) {
            const tempObj = measurement['3303'];
            // Findy uses nested format: 3303[instanceId].value
            // Check instance 0 first (most common)
            if (tempObj['0']?.value !== undefined) {
                temperature = parseFloat(tempObj['0'].value) || 0;
            } else if (tempObj['5700']?.value !== undefined) {
                // Resource 5700 is Sensor Value in standard LwM2M
                temperature = parseFloat(tempObj['5700'].value) || 0;
            } else if (tempObj.value !== undefined) {
                temperature = parseFloat(tempObj.value) || 0;
            } else {
                // Search nested resources for a value
                for (const resId in tempObj) {
                    if (resId !== 'imei' && resId !== 'name' && tempObj[resId]?.value !== undefined) {
                        const val = parseFloat(tempObj[resId].value);
                        if (!isNaN(val)) {
                            temperature = val;
                            break;
                        }
                    }
                }
            }
        }
        
        // Fallback: Search for temperature-related dataTypes
        if (temperature === 0) {
            for (const key in measurement) {
                const item = measurement[key];
                if (item?.dataType?.name?.toLowerCase().includes('temp') ||
                    item?.dataType?.uri?.toLowerCase().includes('temp')) {
                    temperature = parseFloat(item.value) || 0;
                    break;
                }
            }
        }
        
        // Convert from Kelvin if needed
        if (temperature > 200) {
            temperature = temperature - 273.15;
        }
    }
    
    // Extract fill from live sensor only – no hardcoded percentages. Prefer distance (cm) then API fill.
    let fillLevel = null;
    let distanceValue = null;
    
    function findDistance488(arr) {
        if (!Array.isArray(arr)) return null;
        for (const item of arr) {
            const dt = item.dataType || item.dataTypeID;
            let id = null;
            if (dt != null && typeof dt === 'object') { id = dt.datatypeID != null ? dt.datatypeID : dt.dataTypeID; }
            if (id == null && typeof item.datatypeID !== 'undefined') { id = item.datatypeID; }
            const name = (typeof dt === 'object' && dt && (dt.name || dt.dataTypeName)) ? (dt.name || dt.dataTypeName) : (item.name || '') || '';
            const isDistance = id === 488 || id === '488' || String(name).toLowerCase() === 'distance';
            if (isDistance && item.value !== undefined && item.value !== null && item.value !== '') {
                const v = parseFloat(item.value);
                if (!isNaN(v) && v >= 0 && v < 10000) return v;
            }
        }
        return null;
    }
    function searchDistanceInObject(obj, depth) {
        if (!obj || typeof obj !== 'object' || depth > 6) return null;
        if (obj.value !== undefined && obj.value !== null && obj.value !== '') {
            const dt = obj.dataType || {};
            const id = dt.datatypeID != null ? dt.datatypeID : (dt.dataTypeID != null ? dt.dataTypeID : obj.datatypeID);
            const name = (dt.name || '').toLowerCase();
            if (name.includes('battery') || name.includes('bat')) return null;
            const isDistance = id === 488 || id === '488' || name === 'distance';
            if (isDistance) {
                const v = parseFloat(obj.value);
                if (!isNaN(v) && v >= 0 && v < 10000) return v;
            }
        }
        for (const key of Object.keys(obj)) {
            if (key === 'imei' || key === 'name') continue;
            const val = obj[key];
            if (typeof val === 'object' && val !== null) {
                const found = searchDistanceInObject(val, (depth || 0) + 1);
                if (found != null) return found;
            }
        }
        return null;
    }
    
    if (deviceData.report) {
        const settings = deviceData.report.settings;
        distanceValue = findDistance488(settings) ?? (settings && searchDistanceInObject(settings, 0)) ?? null;
        if (distanceValue == null && deviceData.report.measurement) {
            const measurement = deviceData.report.measurement;
            if (measurement['3330']) {
                const distObj = measurement['3330'];
                if (distObj['0']?.value !== undefined) distanceValue = parseFloat(distObj['0'].value);
                else if (distObj['5700']?.value !== undefined) distanceValue = parseFloat(distObj['5700'].value);
                else if (distObj.value !== undefined) distanceValue = parseFloat(distObj.value);
                else {
                    for (const resId in distObj) {
                        if (resId !== 'imei' && resId !== 'name' && distObj[resId]?.value !== undefined) {
                            const val = parseFloat(distObj[resId].value);
                            if (!isNaN(val)) { distanceValue = val; break; }
                        }
                    }
                }
            }
            if (distanceValue == null) distanceValue = searchDistanceInObject(measurement, 0);
        }
    }
    if (deviceData.distance !== undefined && deviceData.distance !== null && distanceValue == null) {
        distanceValue = parseFloat(deviceData.distance) || null;
    }
    
    // Fill % is computed in updateSensorAndBin from distanceCm using bin calibration (no hardcoded % here)
    if (fillLevel === null && deviceData.fillLevel !== undefined && deviceData.fillLevel !== null) {
        const v = parseFloat(deviceData.fillLevel);
        if (!isNaN(v) && v >= 0 && v <= 100) fillLevel = Math.round(v);
    }
    if (fillLevel === null && deviceData.fill !== undefined && deviceData.fill !== null) {
        const v = parseFloat(deviceData.fill);
        if (!isNaN(v) && v >= 0 && v <= 100) fillLevel = Math.round(v);
    }
    if (fillLevel === null && deviceData.report?.measurement) {
        const measurement = deviceData.report.measurement;
        for (const key in measurement) {
            const item = measurement[key];
            const typeName = item?.dataType?.name?.toLowerCase() || '';
            const typeUri = item?.dataType?.uri?.toLowerCase() || '';
            if (typeName.includes('fill') || typeName.includes('level') || typeName.includes('distance') || typeName.includes('ultrasonic') || typeUri.includes('fill') || typeUri.includes('level')) {
                const val = parseFloat(item.value);
                if (!isNaN(val) && val >= 0 && val <= 100) { fillLevel = Math.round(val); break; }
            }
        }
    }
    if (fillLevel != null) fillLevel = Math.max(0, Math.min(100, fillLevel));
    
    // Extract GPS data
    let gps = null;
    if (deviceData.ingps) {
        gps = {
            lat: parseFloat(deviceData.ingps.lat) || 0,
            lng: parseFloat(deviceData.ingps.lon || deviceData.ingps.lng) || 0,
            speed: parseFloat(deviceData.ingps.speed) || 0,
            accuracy: parseFloat(deviceData.ingps.accuracy) || 0,
            type: 'GPS'
        };
    } else if (deviceData.incell) {
        gps = {
            lat: parseFloat(deviceData.incell.lat) || 0,
            lng: parseFloat(deviceData.incell.lon || deviceData.incell.lng) || 0,
            accuracy: parseFloat(deviceData.incell.accuracy) || 0,
            type: 'GSM'
        };
    }
    
    // Determine status
    let status = 'unknown';
    if (deviceData.deviceInfo?.deviceStatusID !== undefined) {
        const statusId = deviceData.deviceInfo.deviceStatusID;
        status = statusId === 1 ? 'online' : statusId === 0 ? 'offline' : 'unknown';
    }
    const lastModTime = deviceData.deviceInfo?.lastModTime;
    if (lastModTime) {
        const timeDiff = Date.now() - new Date(lastModTime).getTime();
        if (timeDiff < 3600000) status = 'online'; // < 1 hour
        else if (timeDiff < 86400000) status = 'idle'; // < 24 hours
        else status = 'offline';
    }
    
    // Extract signal strength
    let signal = 0;
    if (deviceData.signal !== undefined) {
        signal = parseFloat(deviceData.signal) || 0;
    } else if (deviceData.incell?.signal !== undefined) {
        signal = parseFloat(deviceData.incell.signal) || 0;
    }
    
    // Condensed logging - only log summary
    // console.log(`📦 Sensor ${imei}: fill=${fillLevel}%, battery=${battery}%, temp=${temperature}°C`);
    
    return {
        imei,
        fillLevel,
        distanceCm: distanceValue != null ? distanceValue : undefined,
        battery,
        temperature,
        signal,
        gps,
        status,
        lastUpdate: deviceData.deviceInfo?.lastModTime || new Date().toISOString(),
        rawData: deviceData
    };
}

// Update sensor and linked bin with fresh data
// Cache for sensor updates to reduce database calls
let sensorUpdateCache = { data: null, lastFetch: 0 };
const CACHE_TTL = 5000; // 5 seconds cache

// Reverse geocode lat/lng to place name (Nominatim, free, 1 req/sec). Returns null on failure.
const reverseGeocodeCache = new Map();
const REVERSE_GEO_CACHE_TTL_MS = 3600000; // 1 hour per coord key
async function reverseGeocode(lat, lng) {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = reverseGeocodeCache.get(key);
    if (cached && (Date.now() - cached.ts) < REVERSE_GEO_CACHE_TTL_MS) return cached.name;
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, {
            headers: { 'User-Agent': 'WasteManagementApp/1.0 (Autonautics)' },
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = await res.json();
        const name = data.display_name || data.address?.road || data.address?.suburb || data.address?.city || data.address?.state || null;
        if (name) reverseGeocodeCache.set(key, { name, ts: Date.now() });
        return name || null;
    } catch (e) {
        return null;
    }
}

async function updateSensorAndBin(sensor, sensorData, cachedData = null) {
    try {
        // Use cached data if available and fresh, otherwise fetch from database
        let allData;
        const now = Date.now();
        
        if (cachedData) {
            allData = cachedData;
        } else if (sensorUpdateCache.data && (now - sensorUpdateCache.lastFetch) < CACHE_TTL) {
            allData = sensorUpdateCache.data;
        } else {
            allData = await dbManager.getAllData();
            sensorUpdateCache = { data: allData, lastFetch: now };
        }
        
        const sensors = allData.sensors || [];
        const sensorIndex = sensors.findIndex(s => s.imei === sensor.imei);

        if (sensorIndex >= 0) {
            sensors[sensorIndex] = {
                ...sensors[sensorIndex],
                fillLevel: sensorData.fillLevel,
                battery: sensorData.battery,
                temperature: sensorData.temperature,
                signal: sensorData.signal,
                gps: sensorData.gps,
                status: sensorData.status || 'online',
                lastSeen: sensorData.lastUpdate || new Date().toISOString(),
                lastUpdate: new Date().toISOString()
            };

            await dbManager.setData('sensors', sensors);
            const fillDisplay = sensorData.fillLevel != null ? `${sensorData.fillLevel}%` : (sensorData.distanceCm != null ? '(distance only)' : 'N/A');
            console.log(`📡 Sensor ${sensor.imei.slice(-6)} updated: fill=${fillDisplay}, battery=${sensorData.battery}%`);
        } else {
            console.warn(`⚠️ Sensor ${sensor.imei} not found in database`);
        }

        // Update linked bin if exists – use only live data; fill % from distance + bin calibration (no hardcoded %)
        if (sensor.binId) {
            const bins = allData.bins || [];
            const binIndex = bins.findIndex(b => b.id === sensor.binId);

            if (binIndex >= 0) {
                const bin = bins[binIndex];
                const emptyCm = bin.sensorDistanceEmptyCm != null ? Number(bin.sensorDistanceEmptyCm) : 200;
                const fullCm = bin.sensorDistanceFullCm != null ? Number(bin.sensorDistanceFullCm) : 0;
                let liveFill = null;
                if (sensorData.distanceCm != null && !isNaN(sensorData.distanceCm)) {
                    if (emptyCm !== fullCm) {
                        liveFill = Math.round(100 * (emptyCm - sensorData.distanceCm) / (emptyCm - fullCm));
                        liveFill = Math.max(0, Math.min(100, liveFill));
                    }
                }
                if (liveFill === null && sensorData.fillLevel != null && !isNaN(sensorData.fillLevel)) {
                    liveFill = Math.max(0, Math.min(100, sensorData.fillLevel));
                }
                if (liveFill !== null) {
                    bin.fill = liveFill;
                    bin.fillLevel = liveFill;
                }
                bin.lastSensorUpdate = new Date().toISOString();
                bin.sensorData = {
                    imei: sensor.imei,
                    battery: sensorData.battery,
                    temperature: sensorData.temperature,
                    signal: sensorData.signal,
                    fillLevel: liveFill != null ? liveFill : bin.sensorData?.fillLevel,
                    distanceCm: sensorData.distanceCm,
                    lastSeen: sensorData.lastUpdate,
                    status: 'online'
                };

                // Bin location is based on the linked sensor's GPS (sensor drives bin position)
                if (sensorData.gps?.lat != null && sensorData.gps?.lng != null) {
                    const lat = parseFloat(sensorData.gps.lat);
                    const lng = parseFloat(sensorData.gps.lng);
                    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                        bin.lat = lat;
                        bin.lng = lng;
                        bin.location = typeof bin.location === 'object' && bin.location !== null ? bin.location : {};
                        bin.location.lat = lat;
                        bin.location.lng = lng;
                        // Update display location: use sensor name if provided, else coordinates; then try reverse geocode for place name
                        const coordLabel = lat.toFixed(4) + ', ' + lng.toFixed(4);
                        const fromSensor = sensorData.gps.address || sensorData.gps.placeName;
                        bin.location.address = fromSensor || coordLabel;
                        bin.locationName = bin.location.address;
                        bin.gpsUpdated = new Date().toISOString();
                        bin.gpsSource = sensorData.gps.type || 'sensor';
                        bin.sensorData.location = { lat, lng, type: sensorData.gps.type || 'sensor' };
                        // If we only have coordinates, resolve place name in background (Nominatim)
                        if (!fromSensor) {
                            setImmediate(async () => {
                                try {
                                    const placeName = await reverseGeocode(lat, lng);
                                    if (placeName) {
                                        const all = await dbManager.getAllData();
                                        const bins = all.bins || [];
                                        const idx = bins.findIndex(b => b.id === sensor.binId);
                                        if (idx >= 0) {
                                            if (!bins[idx].location || typeof bins[idx].location !== 'object') bins[idx].location = {};
                                            bins[idx].location.address = placeName;
                                            bins[idx].locationName = placeName;
                                            await dbManager.setData('bins', bins);
                                            broadcastToClients({ type: 'bin_fill_update', binId: sensor.binId, locationAddress: placeName, lat: bins[idx].lat, lng: bins[idx].lng, fillLevel: bins[idx].fill, status: bins[idx].status, timestamp: new Date().toISOString() });
                                        }
                                    }
                                } catch (e) { /* ignore */ }
                            });
                        }
                    }
                }

                // Status from live fill only (no hardcoded thresholds for display value)
                const fillForStatus = liveFill != null ? liveFill : bin.fill;
                if (typeof fillForStatus === 'number') {
                    if (fillForStatus >= 85) bin.status = 'critical';
                    else if (fillForStatus >= 70) bin.status = 'warning';
                    else bin.status = 'normal';
                }

                await dbManager.setData('bins', bins);
                console.log(`🗑️ Bin ${sensor.binId} updated from sensor: fill=${bin.fill}%, status=${bin.status}`);

                // Broadcast bin update with complete sensor data and position (so Live Monitoring map updates)
                broadcastToClients({
                    type: 'bin_fill_update',
                    binId: sensor.binId,
                    fillLevel: bin.fill,
                    status: bin.status,
                    lat: bin.lat,
                    lng: bin.lng,
                    locationAddress: bin.location && bin.location.address,
                    sensorIMEI: sensor.imei,
                    battery: sensorData.battery,
                    temperature: sensorData.temperature,
                    signal: sensorData.signal,
                    gps: sensorData.gps,
                    sensorData: bin.sensorData,
                    timestamp: new Date().toISOString()
                });
            } else {
                console.warn(`⚠️ Linked bin ${sensor.binId} not found for sensor ${sensor.imei}. Check bin ID or create the bin first.`);
            }
        } else {
            console.log(`ℹ️ Sensor ${sensor.imei.slice(-6)} has no linked bin - data saved but bin not updated`);
        }

        return { success: true };
    } catch (error) {
        const errMsg = (error && error.message) || String(error);
        console.error('❌ Error updating sensor and bin:', errMsg);
        return { success: false, error: errMsg };
    }
}

// Security: Helmet for secure headers (CSP disabled to allow existing inline scripts)
app.use(helmet({ contentSecurityPolicy: false }));

// Enable CORS
app.use(cors());

// Disable caching to prevent CSP cache issues in development
app.use((req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    next();
});

// Compress responses
app.use(compression());

// Serve static files from public (robust for Render: try __dirname then process.cwd())
const pathPublic = path.join(__dirname, 'public');
const pathPublicCwd = path.join(process.cwd(), 'public');
app.use(express.static(pathPublic));
if (pathPublicCwd !== pathPublic) {
    app.use(express.static(pathPublicCwd));
}

// Parse JSON bodies (with limit to prevent huge payloads)
const JSON_LIMIT = '12mb';
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));

// Input validation helpers (world-class: reject bad payloads early)
function validateBinPayload(bin) {
    if (!bin || typeof bin !== 'object') return { valid: false, error: 'Bin must be an object' };
    if (!bin.id || typeof bin.id !== 'string') return { valid: false, error: 'Bin id (string) is required' };
    if (bin.id.length > 120) return { valid: false, error: 'Bin id too long' };
    if (bin.lat != null && (typeof bin.lat !== 'number' || bin.lat < -90 || bin.lat > 90)) return { valid: false, error: 'Invalid lat' };
    if (bin.lng != null && (typeof bin.lng !== 'number' || bin.lng < -180 || bin.lng > 180)) return { valid: false, error: 'Invalid lng' };
    return { valid: true };
}
function validateSyncPayload(body) {
    if (body.bins && !Array.isArray(body.bins)) return { valid: false, error: 'bins must be an array' };
    if (body.data && body.data.bins && !Array.isArray(body.data.bins)) return { valid: false, error: 'data.bins must be an array' };
    if (body.bins && body.bins.length > 50000) return { valid: false, error: 'Too many bins in one sync (max 50000)' };
    return { valid: true };
}

// Initialize database manager for production deployment
const dbManager = new DatabaseManager();
let serverData = {}; // Will be populated from database

// Initialize Findy API Service for IoT sensor integration
const findyAPI = new FindyAPIService();

// Note: Findy API configuration is loaded from findy-config.js in FindyAPIService constructor
// If not available, it will try to use environment variables
// Check if credentials are properly configured
if (findyAPI.apiKey && findyAPI.username && findyAPI.password) {
    console.log('✅ Findy API configuration loaded successfully');
} else {
    console.warn('⚠️ Findy API credentials incomplete');
    if (!findyAPI.apiKey) console.warn('   Missing: FINDY_API_KEY');
    if (!findyAPI.username) console.warn('   Missing: FINDY_API_USERNAME');
    if (!findyAPI.password) console.warn('   Missing: FINDY_API_PASSWORD');
}

// Initialize database on startup (non-blocking)
(async () => {
    try {
        await dbManager.initialize();
        serverData = await dbManager.getAllData();
        console.log('📊 Server data loaded from database');

        // Rehydrate sensors from bins after DB load (sync sensorsData with serverData so API returns them)
        if (!serverData.sensors || serverData.sensors.length === 0) {
            const bins = serverData.bins || [];
            const existingImeis = new Set((sensorsData.sensors || []).map(s => s.imei).filter(Boolean));
            let added = 0;
            for (const bin of bins) {
                const imei = bin.sensorIMEI || (bin.hasSensor && bin.sensorId) || null;
                if (!imei || existingImeis.has(imei)) continue;
                sensorsData.sensors = sensorsData.sensors || [];
                sensorsData.sensors.push({
                    imei: String(imei),
                    binId: bin.id || null,
                    status: 'active',
                    addedAt: new Date().toISOString(),
                    source: 'rehydrated-from-bin'
                });
                existingImeis.add(imei);
                added++;
            }
            if (added > 0) {
                await dbManager.updateData({ sensors: sensorsData.sensors });
                console.log(`📡 Rehydrated ${added} sensor(s) from bins after DB load. Total sensors: ${sensorsData.sensors.length}`);
            }
        }
        
        if (serverData.sensors && serverData.sensors.length > 0) {
            sensorsData.sensors = serverData.sensors;
            console.log(`📡 Loaded ${serverData.sensors.length} sensors from database`);
            const activeSensors = serverData.sensors.filter(s => s.status !== 'inactive').length;
            console.log(`✅ ${activeSensors} active sensors ready`);
        } else if (!sensorsData.sensors || sensorsData.sensors.length === 0) {
            console.warn('⚠️ No sensors found in database');
        }
        
        // Initialize Findy API connection
        try {
            const healthCheck = await findyAPI.healthCheck();
            if (healthCheck.success) {
                console.log('✅ Findy IoT API connected and authenticated successfully');
            } else {
                console.warn('⚠️ Findy IoT API not ready:', healthCheck.error || healthCheck.message);
                if (!healthCheck.authenticated) {
                    console.warn('💡 To enable IoT sensor integration, update .env with valid Findy API credentials');
                }
            }
        } catch (error) {
            console.warn('⚠️ Findy IoT API health check failed:', error.message);
        }
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        // Fallback to in-memory data
        serverData = {
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
            initialized: false,
            lastUpdate: new Date().toISOString()
        };
    }
})().catch(err => {
    console.error('❌ Startup initialization error:', err);
});

// Logging middleware - reduced for performance (only log API mutations, not GET requests)
app.use((req, res, next) => {
    // Only log POST, PUT, DELETE requests to reduce noise
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// API Routes for Data Synchronization

// Get all data for sync (includes deletedBins when using MongoDB)
app.get('/api/data/sync', async (req, res) => {
    try {
        const data = await dbManager.getAllData();
        res.json({
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync data'
        });
    }
});

// MongoDB connection health check (for tests and monitoring)
app.get('/api/health/mongodb', async (req, res) => {
    try {
        const status = await dbManager.getConnectionStatus();
        res.json({
            success: status.ok,
            ...status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            ok: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get app settings (e.g. sensor reporting interval) – admin can adjust
app.get('/api/settings', async (req, res) => {
    try {
        const data = await dbManager.getAllData();
        const settings = data.settings || {};
        const sensorReportingIntervalMinutes = Math.max(5, Math.min(120, Number(settings.sensorReportingIntervalMinutes) || 30));
        res.json({
            success: true,
            settings: {
                sensorReportingIntervalMinutes
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            settings: { sensorReportingIntervalMinutes: 30 }
        });
    }
});

// Update app settings (admin only in production – protect with auth if needed)
app.put('/api/settings', async (req, res) => {
    try {
        const data = await dbManager.getAllData();
        const current = data.settings || {};
        const incoming = req.body || {};
        let sensorReportingIntervalMinutes = Number(incoming.sensorReportingIntervalMinutes);
        if (Number.isNaN(sensorReportingIntervalMinutes) || sensorReportingIntervalMinutes < 5 || sensorReportingIntervalMinutes > 120) {
            sensorReportingIntervalMinutes = current.sensorReportingIntervalMinutes != null ? current.sensorReportingIntervalMinutes : 30;
        }
        const merged = { ...current, sensorReportingIntervalMinutes };
        await dbManager.setData('settings', merged);
        console.log('📋 Settings updated: sensorReportingIntervalMinutes =', sensorReportingIntervalMinutes);
        res.json({
            success: true,
            settings: { sensorReportingIntervalMinutes },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Put settings error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get deleted bin IDs (MongoDB-persisted; used by clients to filter bins)
app.get('/api/bins/deleted', async (req, res) => {
    try {
        const ids = await dbManager.getDeletedBins();
        res.json({ success: true, ids: ids || [], timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Get deleted bins error:', error);
        res.status(500).json({ success: false, error: error.message, ids: [] });
    }
});

// Update deleted bin IDs (replace list or add one/many)
app.post('/api/bins/deleted', async (req, res) => {
    try {
        const { ids, add } = req.body;
        if (add !== undefined) {
            const toAdd = Array.isArray(add) ? add : [add];
            await dbManager.addDeletedBins(toAdd);
            const updated = await dbManager.getDeletedBins();
            return res.json({ success: true, ids: updated, timestamp: new Date().toISOString() });
        }
        if (ids !== undefined) {
            await dbManager.setDeletedBins(ids);
            const updated = await dbManager.getDeletedBins();
            return res.json({ success: true, ids: updated, timestamp: new Date().toISOString() });
        }
        res.status(400).json({ success: false, error: 'Provide ids (array) or add (id or array)' });
    } catch (error) {
        console.error('Post deleted bins error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Scalable bins API: bbox query (no full load) - for 1M+ bins
// GET /api/bins?bbox=minLng,minLat,maxLng,maxLat&limit=500&offset=0
app.get('/api/bins', async (req, res) => {
    try {
        const bbox = req.query.bbox ? req.query.bbox.split(',').map(Number) : null;
        if (bbox && bbox.length !== 4) {
            return res.status(400).json({ success: false, error: 'bbox must be minLng,minLat,maxLng,maxLat' });
        }
        const limit = Math.min(parseInt(req.query.limit, 10) || 2000, 10000);
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
        const result = await dbManager.getBins({ bbox, limit, offset });
        res.json({
            success: true,
            bins: result.bins,
            total: result.total,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('GET /api/bins error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bulk bins insert (for seeding / migration; max 15k per request)
app.post('/api/bins/bulk', async (req, res) => {
    try {
        const { bins: newBins } = req.body;
        if (!Array.isArray(newBins) || newBins.length === 0 || newBins.length > 15000) {
            return res.status(400).json({ success: false, error: 'bins array required (1–15000 items)' });
        }
        const existing = (await dbManager.getData('bins')) || [];
        const existingIds = new Set(existing.map(b => b.id));
        const toAdd = newBins.filter(b => b && b.id && !existingIds.has(b.id));
        const merged = [...existing, ...toAdd];
        await dbManager.updateData({ bins: merged });
        console.log(`📦 Bulk bins: added ${toAdd.length}, total ${merged.length}`);
        res.json({ success: true, added: toAdd.length, total: merged.length, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('POST /api/bins/bulk error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Single bin update (no full-sync) - PATCH /api/bins/:id
app.patch('/api/bins/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!id) return res.status(400).json({ success: false, error: 'Bin id required' });
        delete updates._id;
        delete updates.id;
        const bin = await dbManager.updateBin(id, updates);
        if (!bin) return res.status(404).json({ success: false, error: 'Bin not found' });
        broadcastToClients({ type: 'bin_updated', binId: id, bin, timestamp: new Date().toISOString() });
        res.json({ success: true, bin, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('PATCH /api/bins/:id error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rate limiting for sync endpoint (allow initial burst after load, then throttle)
const syncRateLimit = {
    lastSync: 0,
    minInterval: 2500, // Minimum 2.5 seconds between syncs
    pendingCount: 0,
    maxPending: 8,     // Allow more pending so initial load + multiple keys don't hit 429
    firstRequestAt: 0  // First request in window
};

// Update server data
app.post('/api/data/sync', async (req, res) => {
    try {
        const now = Date.now();
        const { data, timestamp, updateType, bins, _forceUpdate } = req.body;
        
        // Rate limiting: prevent sync flooding but allow initial burst (e.g. after syncFromServer triggers multiple setData)
        const timeSinceLast = now - syncRateLimit.lastSync;
        if (timeSinceLast < syncRateLimit.minInterval) {
            syncRateLimit.pendingCount++;
            // Reset pending count if it's been a while (new "burst window")
            if (timeSinceLast > 15000) syncRateLimit.pendingCount = 1;
            if (syncRateLimit.pendingCount > syncRateLimit.maxPending) {
                return res.status(429).json({
                    success: false,
                    error: 'Too many sync requests, please slow down',
                    retryAfter: Math.ceil((syncRateLimit.minInterval - timeSinceLast) / 1000)
                });
            }
        } else {
            syncRateLimit.pendingCount = 0;
        }
        syncRateLimit.lastSync = now;

        const syncValidation = validateSyncPayload(req.body);
        if (!syncValidation.valid) return res.status(400).json({ success: false, error: syncValidation.error });
        
        console.log(`Data update received: ${updateType || 'full'}`);
        
        let updatedData = {};
        
        // Handle legacy format (bins array directly)
        // MERGE: Keep server's sensor-updated bin data so frontend reflects live sensor data
        if (bins && Array.isArray(bins)) {
            const existingBins = await dbManager.getData('bins') || [];
            const serverBinById = new Map((existingBins || []).map(b => [b.id, b]));
            const mergedBins = bins.map(clientBin => {
                const serverBin = serverBinById.get(clientBin.id);
                
                // CRITICAL: Always use client data for recently collected bins (within 5 minutes)
                if (clientBin.lastCollection) {
                    try {
                        const collectionDate = new Date(clientBin.lastCollection);
                        const now = new Date();
                        const minutesSinceCollection = (now - collectionDate) / (1000 * 60);
                        if (minutesSinceCollection < 5 && clientBin.fill === 0) {
                            console.log(`🛡️ SERVER: Recently collected bin ${clientBin.id}, using client data (fill=0%)`);
                            return clientBin;  // Use client's 0% fill
                        }
                    } catch (e) {
                        // Date parsing failed, continue with normal logic
                    }
                }
                
                const hasSensor = !!(serverBin && (serverBin.sensorIMEI || serverBin.hasSensor));
                const serverNewer = serverBin && serverBin.lastSensorUpdate && clientBin.lastSensorUpdate &&
                    new Date(serverBin.lastSensorUpdate).getTime() >= new Date(clientBin.lastSensorUpdate).getTime();
                if (hasSensor && serverBin && (serverNewer || serverBin.lastSensorUpdate)) {
                    return serverBin;
                }
                return clientBin;
            });
            console.log(`📦 Merged bins: ${mergedBins.length} (sensor-updated bins kept from server)`);
            await dbManager.updateData({ bins: mergedBins });
            await dbManager.syncToExternal();
            updatedData = { bins: mergedBins };
        }
        // Handle new format (data: { bins, users, ... })
        else if (data) {
            if (data.bins && Array.isArray(data.bins)) {
                const existingBins = await dbManager.getData('bins') || [];
                const serverBinById = new Map((existingBins || []).map(b => [b.id, b]));
                const mergedBins = data.bins.map(clientBin => {
                    const serverBin = serverBinById.get(clientBin.id);
                    
                    // CRITICAL: Always use client data for recently collected bins (within 5 minutes)
                    if (clientBin.lastCollection) {
                        try {
                            const collectionDate = new Date(clientBin.lastCollection);
                            const now = new Date();
                            const minutesSinceCollection = (now - collectionDate) / (1000 * 60);
                            if (minutesSinceCollection < 5 && clientBin.fill === 0) {
                                console.log(`🛡️ SERVER: Recently collected bin ${clientBin.id}, using client data (fill=0%)`);
                                return clientBin;  // Use client's 0% fill
                            }
                        } catch (e) {
                            // Date parsing failed, continue with normal logic
                        }
                    }
                    
                    const hasSensor = !!(serverBin && (serverBin.sensorIMEI || serverBin.hasSensor));
                    const serverNewer = serverBin && serverBin.lastSensorUpdate && clientBin.lastSensorUpdate &&
                        new Date(serverBin.lastSensorUpdate).getTime() >= new Date(clientBin.lastSensorUpdate).getTime();
                    if (hasSensor && serverBin && (serverNewer || serverBin.lastSensorUpdate)) {
                        return serverBin;
                    }
                    return clientBin;
                });
                data.bins = mergedBins;
                console.log(`📦 Merged bins in data: ${mergedBins.length} (sensor bins kept from server)`);
            }
            // CRITICAL: Merge routes so a client full sync never overwrites server-only routes (e.g. admin-assigned)
            // and never re-adds routes the server just deleted (ignore recently deleted IDs from client)
            if (data.routes && Array.isArray(data.routes)) {
                const serverRoutes = await dbManager.getData('routes') || [];
                const byId = new Map(serverRoutes.map(r => [r.id, r]));
                const clientRoutesFiltered = data.routes.filter(r => !recentlyDeletedRouteIds.has(r.id));
                if (clientRoutesFiltered.length < data.routes.length) {
                    console.log(`🛣️ Ignoring ${data.routes.length - clientRoutesFiltered.length} route(s) from client (recently deleted on server)`);
                }
                clientRoutesFiltered.forEach(r => byId.set(r.id, r));
                data.routes = Array.from(byId.values());
                console.log(`🛣️ Merged routes: ${data.routes.length} total (${serverRoutes.length} server + client updates)`);
            }
            if (updateType === 'partial') {
                await dbManager.updateData(data);
            } else {
                await dbManager.updateData(data);
            }
            if (data.bins) await dbManager.syncToExternal();
            updatedData = data;
        } else {
            throw new Error('No data provided');
        }
        
        // REAL-TIME BROADCAST: Notify all connected clients of data update
        const broadcastCount = broadcastToClients({
            type: 'dataUpdate',
            updateType: updateType || 'full',
            data: updatedData,
            timestamp: new Date().toISOString()
        });
        console.log(`📡 Broadcast data update to ${broadcastCount} client(s)`);
        
        const currentTimestamp = new Date().toISOString();
        
        res.json({
            success: true,
            message: 'Data updated successfully',
            timestamp: currentTimestamp,
            broadcastCount: broadcastCount
        });
    } catch (error) {
        console.error('Data update error:', error);
        console.error('Error details:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Failed to update data',
            details: error.message
        });
    }
});

// Add bin endpoint
app.post('/api/bins/add', async (req, res) => {
    try {
        const bin = req.body;
        const v = validateBinPayload(bin);
        if (!v.valid) return res.status(400).json({ success: false, error: v.error });
        
        const bins = await dbManager.getData('bins') || [];
        
        // Check if bin already exists
        const exists = bins.find(b => b.id === bin.id);
        if (exists) {
            console.log(`ℹ️ Bin ${bin.id} already exists, updating instead`);
            // Update existing bin instead of erroring
            const index = bins.findIndex(b => b.id === bin.id);
            bins[index] = { ...bins[index], ...bin };
        } else {
            bins.push(bin);
        }
        
        await dbManager.updateData({ bins: bins });
        await dbManager.syncToExternal(); // Force immediate save
        
        const finalBins = await dbManager.getData('bins') || [];
        console.log(`📦 Bin ${exists ? 'updated' : 'added'}: ${bin.id}`);
        console.log(`📦 Total bins on server now: ${finalBins.length}`);
        
        // Broadcast bin update to all connected clients via WebSocket
        broadcastToClients({
            type: 'bin_added',
            binId: bin.id,
            bin: exists ? bins[bins.findIndex(b => b.id === bin.id)] : bin,
            totalBins: finalBins.length,
            timestamp: new Date().toISOString(),
            action: exists ? 'bin_updated' : 'bin_added'
        });
        console.log(`📡 Broadcasted bin ${exists ? 'update' : 'addition'} to all WebSocket clients`);
        
        // Always return success - updating existing bin is fine
        res.json({
            success: true,
            bin: exists ? bins[bins.findIndex(b => b.id === bin.id)] : bin,
            message: exists ? 'Bin updated' : 'Bin added',
            wasUpdate: exists,
            totalBins: finalBins.length
        });
    } catch (error) {
        console.error('❌ Add bin error:', error);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add bin',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Specific endpoints for real-time updates

// Update driver location (world-class live GPS: driver app pushes here; server broadcasts to dashboard)
// CRITICAL: Server-side rate limiting to prevent resource exhaustion
const driverLocationRateLimits = new Map(); // driverId -> { lastUpdate: timestamp, count: number }

app.post('/api/driver/:driverId/location', async (req, res) => {
    try {
        const { driverId } = req.params;
        const { lat, lng, timestamp, accuracy, speed, heading } = req.body;
        
        // Server-side throttling (3s to match client; avoids 429 when GPS + reconnect fire close together)
        const now = Date.now();
        const rateLimit = driverLocationRateLimits.get(driverId) || { lastUpdate: 0, count: 0 };
        
        const timeSinceLastUpdate = now - rateLimit.lastUpdate;
        const throttleMs = 3000;
        
        if (timeSinceLastUpdate < throttleMs) {
            res.status(429).json({ success: false, error: 'Rate limit exceeded', retryAfter: Math.ceil((throttleMs - timeSinceLastUpdate) / 1000) });
            return;
        }
        
        // Reset rate limit tracker
        driverLocationRateLimits.set(driverId, { lastUpdate: now, count: 0 });
        
        const location = await dbManager.updateDriverLocation(
            driverId, 
            lat, 
            lng, 
            accuracy || null, 
            speed || 0
        );
        
        const payload = {
            type: 'driver_location',
            driverId,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            timestamp: timestamp || location.timestamp,
            accuracy: accuracy != null ? parseFloat(accuracy) : null,
            speed: speed != null ? parseFloat(speed) : null,
            heading: heading != null ? parseFloat(heading) : null
        };
        // Safe broadcast (with try-catch to prevent crash)
        try {
            broadcastToClients(payload);
            
            const clientCount = typeof clients !== 'undefined' ? clients.size : 0;
            if (clientCount > 0) {
                console.log(`📍 Driver ${driverId} location broadcast to ${clientCount} client(s): ${lat}, ${lng}`);
            }
        } catch (broadcastError) {
            console.error('Broadcast error (non-fatal):', broadcastError.message);
        }
        
        res.json({
            success: true,
            message: 'Location updated',
            location: location
        });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update location'
        });
    }
});

// Get driver locations
app.get('/api/driver/locations', async (req, res) => {
    try {
        const locations = await dbManager.getDriverLocations();
        res.json({
            success: true,
            locations: locations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get locations'
        });
    }
});

// Batch driver location updates (high concurrency: 10k staff)
app.post('/api/drivers/batch', async (req, res) => {
    try {
        const { updates } = req.body; // [{ driverId, lat, lng, accuracy?, speed?, heading? }, ...]
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ success: false, error: 'updates array required' });
        }
        if (updates.length > 500) {
            return res.status(400).json({ success: false, error: 'Max 500 updates per batch' });
        }
        const now = Date.now();
        const throttleMs = 1000;
        const results = [];
        for (const u of updates) {
            const { driverId, lat, lng, accuracy, speed, heading } = u;
            if (!driverId || lat == null || lng == null) continue;
            const rateLimit = driverLocationRateLimits.get(driverId) || { lastUpdate: 0 };
            if (now - rateLimit.lastUpdate < throttleMs) continue;
            driverLocationRateLimits.set(driverId, { lastUpdate: now });
            const location = await dbManager.updateDriverLocation(driverId, lat, lng, accuracy, speed);
            results.push({ driverId, ok: true });
        }
        const broadcastCount = broadcastToClients({
            type: 'driver_locations_batch',
            count: results.length,
            timestamp: new Date().toISOString()
        });
        res.json({
            success: true,
            updated: results.length,
            results,
            broadcastCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('POST /api/drivers/batch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add/Update route – world-class: broadcast immediately so driver app sees assignment instantly
app.post('/api/routes', async (req, res) => {
    try {
        const route = req.body;
        
        let savedRoute;
        const routes = await dbManager.getData('routes') || [];
        const existingIndex = routes.findIndex(r => r.id === route.id);
        
        if (existingIndex >= 0) {
            // Update existing route
            savedRoute = await dbManager.updateRoute(route.id, route);
        } else {
            // Add new route
            savedRoute = await dbManager.addRoute(route);
        }
        
        console.log(`Route ${route.id} saved for driver ${route.driverId}`);
        
        // Broadcast full routes list to all clients (including driver) so assignment appears instantly
        const updatedRoutes = await dbManager.getData('routes') || [];
        const broadcastCount = broadcastToClients({
            type: 'dataUpdate',
            updateType: 'routes',
            data: { routes: updatedRoutes },
            timestamp: new Date().toISOString()
        });
        if (broadcastCount > 0) {
            console.log(`📡 Route assignment broadcast to ${broadcastCount} client(s) – driver sees it immediately`);
        }
        
        res.json({
            success: true,
            message: 'Route saved',
            route: savedRoute,
            broadcastCount
        });
    } catch (error) {
        console.error('Route save error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save route'
        });
    }
});

// Delete a route (admin/manager cancel – immediately reflected to driver via broadcast)
app.delete('/api/routes/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        const routes = await dbManager.getData('routes') || [];
        const index = routes.findIndex(r => r.id === routeId);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Route not found' });
        }
        const removed = routes.splice(index, 1)[0];
        await dbManager.setData('routes', routes);
        markRouteRecentlyDeleted(routeId);
        console.log(`Route ${routeId} deleted (cancelled for driver ${removed.driverId || 'unknown'})`);
        const broadcastCount = broadcastToClients({
            type: 'dataUpdate',
            updateType: 'routes',
            data: { routes },
            timestamp: new Date().toISOString()
        });
        if (broadcastCount > 0) {
            console.log(`📡 Route cancellation broadcast to ${broadcastCount} client(s)`);
        }
        res.json({ success: true, message: 'Route deleted', broadcastCount });
    } catch (error) {
        console.error('Route delete error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete route' });
    }
});

// Get routes for a driver
app.get('/api/driver/:driverId/routes', async (req, res) => {
    try {
        const { driverId } = req.params;
        
        const routes = await dbManager.getDriverRoutes(driverId);
        res.json({
            success: true,
            routes: routes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get routes'
        });
    }
});

// Get driver message history (manager–driver communications)
app.get('/api/driver/:driverId/messages', async (req, res) => {
    try {
        const { driverId } = req.params;
        const messages = await dbManager.getDriverMessages(driverId);
        res.json({
            success: true,
            messages: messages || [],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get driver messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get message history'
        });
    }
});

// Get full chat audit log for auditing (all app chat recorded in DB)
app.get('/api/chat/audit', async (req, res) => {
    try {
        if (!dbManager || typeof dbManager.getChatAuditLog !== 'function') {
            return res.status(503).json({ success: false, error: 'Chat audit not available' });
        }
        const limit = Math.min(parseInt(req.query.limit, 10) || 500, 2000);
        const since = req.query.since || null;
        const until = req.query.until || null;
        const senderId = req.query.senderId || null;
        const receiverId = req.query.receiverId || null;
        const entries = await dbManager.getChatAuditLog({ limit, since, until, senderId, receiverId });
        res.json({
            success: true,
            entries,
            count: entries.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get chat audit error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get chat audit log'
        });
    }
});

// Client health / freeze reports – so you can see in server logs why the app froze (Render dashboard, etc.)
app.post('/api/client-health', async (req, res) => {
    try {
        const body = req.body || {};
        const reason = body.reason || 'unknown';
        const ts = new Date().toISOString();
        const msg = `🔴 CLIENT_FREEZE/HEALTH | reason=${reason} | lastPongAt=${body.lastPongAt || '-'} | detectedAt=${body.detectedAt || ts} | visibility=${body.visibility || '-'} | userId=${body.userId || '-'} | userAgent=${(body.userAgent || '').slice(0, 60)}`;
        console.log(msg);
        if (body.context && typeof body.context === 'object') {
            console.log('   context:', JSON.stringify(body.context));
        }
        if (typeof dbManager.addClientErrorLog === 'function') {
            await dbManager.addClientErrorLog({
                message: `CLIENT_FREEZE: ${reason}`,
                stack: body.detectedAt || ts,
                context: { lastPongAt: body.lastPongAt, visibility: body.visibility, ...body.context },
                userId: body.userId || 'unknown',
                userType: body.userType || 'unknown',
                userName: body.userName || 'unknown',
                url: body.url || '',
                userAgent: body.userAgent || '',
                timestamp: body.detectedAt || ts
            });
        }
        res.status(200).json({ ok: true });
    } catch (e) {
        console.error('client-health report error:', e);
        res.status(500).json({ ok: false });
    }
});

// Client console errors (all users) - store and retrieve for admin
app.post('/api/errors/client', async (req, res) => {
    try {
        const entry = req.body || {};
        const saved = await dbManager.addClientErrorLog(entry);
        if (saved) {
            res.status(201).json({ success: true, id: saved.id });
        } else {
            res.status(400).json({ success: false, error: 'Invalid or missing message' });
        }
    } catch (error) {
        console.error('Post client error log:', error);
        res.status(500).json({ success: false, error: 'Failed to store error' });
    }
});

app.get('/api/errors/client', async (req, res) => {
    console.log('📋 GET /api/errors/client');
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 500, 1000);
        const skip = parseInt(req.query.skip, 10) || 0;
        const userId = req.query.userId || null;
        const logs = await dbManager.getClientErrorLogs({ limit, skip, userId });
        res.json({ success: true, logs, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Get client error logs:', error);
        res.status(500).json({ success: false, error: 'Failed to get error logs' });
    }
});

app.delete('/api/errors/client', async (req, res) => {
    try {
        await dbManager.clearClientErrorLogs();
        res.json({ success: true, message: 'Client error logs cleared' });
    } catch (error) {
        console.error('Clear client error logs:', error);
        res.status(500).json({ success: false, error: 'Failed to clear logs' });
    }
});

// Route completion endpoint
app.post('/api/driver/:driverId/route-completion', async (req, res) => {
    try {
        const { driverId } = req.params;
        const { completionTime, status, movementStatus } = req.body;
        
        console.log(`🏁 Route completion received for driver ${driverId}`);
        
        // Find and update driver
        const driver = await dbManager.getDriverById(driverId);
        if (driver) {
            // Update driver status
            const updatedDriver = await dbManager.updateDriverData(driverId, {
                movementStatus: movementStatus || 'stationary',
                status: 'available',
                lastRouteCompletion: completionTime,
                routeEndTime: completionTime,
                lastStatusUpdate: new Date().toISOString()
            });
            
            // Complete any active routes for this driver
            const routes = await dbManager.getData('routes') || [];
            for (const route of routes) {
                if (route.driverId === driverId && (route.status === 'active' || route.status === 'in-progress')) {
                    await dbManager.updateRoute(route.id, {
                        status: 'completed',
                        completedAt: completionTime,
                        completedBy: driverId
                    });
                }
            }
            
            console.log(`✅ Driver ${driverId} route completion processed - Status: ${updatedDriver.movementStatus}`);
            
            // Broadcast update to all WebSocket clients
            broadcastToClients({
                type: 'route_completion',
                driverId: driverId,
                driverData: updatedDriver,
                status: updatedDriver.movementStatus,
                timestamp: new Date().toISOString(),
                action: 'route_completed'
            });
            
            res.json({
                success: true,
                message: 'Route completion processed successfully',
                driver: updatedDriver
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }
    } catch (error) {
        console.error('Route completion error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process route completion'
        });
    }
});

// Update driver status and profile data
app.post('/api/driver/:driverId/update', async (req, res) => {
    try {
        const { driverId } = req.params;
        const updates = req.body;
        
        // Find and update the driver (dbManager.updateDriverData sanitizes rating/efficiency)
        const updatedDriver = await dbManager.updateDriverData(driverId, updates);
        
        if (updatedDriver) {
            console.log(`🔄 Driver ${driverId} updated:`, Object.keys(updates));
            
            res.json({
                success: true,
                message: 'Driver updated successfully',
                driver: updatedDriver
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }
        
    } catch (error) {
        console.error('Driver update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update driver'
        });
    }
});

// Update driver fuel level specifically
app.post('/api/driver/:driverId/fuel', async (req, res) => {
    try {
        const { driverId } = req.params;
        const { fuelLevel } = req.body;
        
        const updatedDriver = await dbManager.updateDriverData(driverId, {
            fuelLevel: fuelLevel,
            lastFuelUpdate: new Date().toISOString()
        });
        
        if (updatedDriver) {
            console.log(`⛽ Driver ${driverId} fuel level updated to ${fuelLevel}%`);
            
            res.json({
                success: true,
                message: 'Fuel level updated',
                fuelLevel: fuelLevel,
                timestamp: updatedDriver.lastFuelUpdate
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }
        
    } catch (error) {
        console.error('Fuel update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update fuel level'
        });
    }
});

// Update driver movement status specifically
app.post('/api/driver/:driverId/status', async (req, res) => {
    try {
        const { driverId } = req.params;
        const { movementStatus, status } = req.body;
        
        const updates = {
            lastStatusUpdate: new Date().toISOString()
        };
        
        if (movementStatus) {
            updates.movementStatus = movementStatus;
        }
        if (status) {
            updates.status = status;
        }
        
        const updatedDriver = await dbManager.updateDriverData(driverId, updates);
        
        if (updatedDriver) {
            console.log(`🚛 Driver ${driverId} status updated - Movement: ${movementStatus}, Status: ${status}`);
            
            res.json({
                success: true,
                message: 'Driver status updated',
                movementStatus: updatedDriver.movementStatus,
                status: updatedDriver.status,
                timestamp: updatedDriver.lastStatusUpdate
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }
        
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update driver status'
        });
    }
});

// Get specific driver data
app.get('/api/driver/:driverId', async (req, res) => {
    try {
        const { driverId } = req.params;
        
        const driver = await dbManager.getDriverById(driverId);
        
        if (driver) {
            res.json({
                success: true,
                driver: driver,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }
        
    } catch (error) {
        console.error('Get driver error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get driver data'
        });
    }
});

// Haversine distance in meters (for collection proximity verification)
function distanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Add collection
app.post('/api/collections', async (req, res) => {
    try {
        const collection = req.body;

        // Driver collections MUST include location so we can verify proximity (prevents out-of-range collection)
        const driverLat = collection.driverLat != null ? Number(collection.driverLat) : null;
        const driverLng = collection.driverLng != null ? Number(collection.driverLng) : null;
        const MAX_COLLECTION_DISTANCE_METERS = 150;

        if (collection.driverId) {
            if (driverLat == null || driverLng == null) {
                console.warn(`Collection rejected: driver ${collection.driverId} did not send location for bin ${collection.binId}`);
                return res.status(400).json({
                    success: false,
                    error: 'Collection requires driver location for verification. Enable GPS and try again.'
                });
            }
            const bins = await dbManager.getData('bins') || [];
            const bin = bins.find(b => b.id === collection.binId);
            if (bin && bin.lat != null && bin.lng != null) {
                const dist = distanceMeters(driverLat, driverLng, bin.lat, bin.lng);
                if (dist > MAX_COLLECTION_DISTANCE_METERS) {
                    console.warn(`Collection rejected: driver ${collection.driverId} too far from bin ${collection.binId} (${Math.round(dist)}m)`);
                    return res.status(400).json({
                        success: false,
                        error: 'Collection rejected: driver too far from bin. Move within range and try again.'
                    });
                }
            }
        }

        const savedCollection = await dbManager.addCollection(collection);

        console.log(`Collection registered: ${collection.binId} by ${collection.driverId}`);
        
        // World-class: mark route completed on server when all bins on that route are collected
        const routes = await dbManager.getData('routes') || [];
        const collectionsList = await dbManager.getData('collections') || [];
        const driverId = collection.driverId;
        const binId = collection.binId;
        const routeId = collection.routeId || null;
        
        const routesToCheck = routeId
            ? routes.filter(r => r.id === routeId && r.driverId === driverId && r.status !== 'completed')
            : routes.filter(r => r.driverId === driverId && r.status !== 'completed' &&
                (r.bins?.includes(binId) || r.binIds?.includes(binId) || (r.binDetails && r.binDetails.some(b => b.id === binId))));
        
        for (const route of routesToCheck) {
            const routeBinIds = route.binIds || route.bins || (route.binDetails ? route.binDetails.map(b => b.id) : []);
            if (routeBinIds.length === 0) continue;
            const collectedForRoute = collectionsList.filter(c =>
                c.driverId === driverId && routeBinIds.includes(c.binId)
            );
            const collectedBinIds = [...new Set(collectedForRoute.map(c => c.binId))];
            const allCollected = routeBinIds.every(id => collectedBinIds.includes(id));
            if (allCollected) {
                await dbManager.updateRoute(route.id, {
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    completedBy: driverId,
                    totalBinsCollected: routeBinIds.length,
                    completionPercentage: 100
                });
                console.log(`✅ Route ${route.id} marked completed on server (all ${routeBinIds.length} bins collected)`);
            }
        }
        
        res.json({
            success: true,
            message: 'Collection registered',
            collection: savedCollection
        });
    } catch (error) {
        console.error('Collection save error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register collection'
        });
    }
});

// ===== FINDY IoT SENSOR API ENDPOINTS =====

// Findy API - Login/Authentication
app.post('/api/findy/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await findyAPI.login(username, password);
        
        res.json({
            success: true,
            message: 'Successfully connected to Findy IoT API',
            data: result
        });
    } catch (error) {
        console.error('Findy login error:', error);
        res.status(401).json({
            success: false,
            error: 'Failed to authenticate with Findy API',
            details: error.message
        });
    }
});

// Findy API - Health Check
app.get('/api/findy/health', async (req, res) => {
    try {
        const health = await findyAPI.healthCheck();
        res.json(health);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error.message
        });
    }
});

// Findy API - Get Device Info
app.get('/api/findy/device/:imei', async (req, res) => {
    try {
        const { imei } = req.params;
        const dataTypes = req.query.dataTypes ? JSON.parse(req.query.dataTypes) : null;
        
        const result = await findyAPI.getDevice(imei, dataTypes);
        res.json(result);
    } catch (error) {
        console.error('Get device error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to get device information',
            details: error.error || error.message
        });
    }
});

// Diagnostic endpoint - Get parsed sensor data for debugging
app.get('/api/findy/device/:imei/diagnostic', async (req, res) => {
    try {
        const { imei } = req.params;
        console.log(`🔍 Diagnostic request for sensor ${imei}`);
        
        const result = await findyAPI.getDevice(imei);
        
        if (!result.success) {
            return res.json({
                success: false,
                error: result.error,
                message: 'Failed to fetch device data from Findy API'
            });
        }
        
        const deviceData = Array.isArray(result.data) ? result.data[0] : result.data;
        const parsedData = extractSensorDataFromDevice(deviceData, imei);
        
        // Log the diagnostic info
        console.log(`📊 Diagnostic for sensor ${imei}:`, {
            hasDeviceInfo: !!deviceData?.deviceInfo,
            hasReport: !!deviceData?.report,
            hasPassport: !!deviceData?.passport,
            hasIngps: !!deviceData?.ingps,
            topLevelKeys: Object.keys(deviceData || {}),
            parsedBattery: parsedData.battery,
            parsedFillLevel: parsedData.fillLevel,
            parsedTemperature: parsedData.temperature
        });
        
        res.json({
            success: true,
            imei,
            parsed: parsedData,
            rawStructure: {
                hasDeviceInfo: !!deviceData?.deviceInfo,
                hasReport: !!deviceData?.report,
                hasPassport: !!deviceData?.passport,
                hasIngps: !!deviceData?.ingps,
                topLevelKeys: Object.keys(deviceData || {}),
                reportKeys: deviceData?.report ? Object.keys(deviceData.report) : [],
                measurementKeys: deviceData?.report?.measurement ? Object.keys(deviceData.report.measurement) : []
            },
            raw: deviceData
        });
    } catch (error) {
        console.error('Diagnostic error:', error);
        res.status(500).json({
            success: false,
            error: 'Diagnostic failed',
            details: error.message
        });
    }
});

// Findy API - Get Device History
app.get('/api/findy/device/:imei/history', async (req, res) => {
    try {
        const { imei } = req.params;
        const { startDate, endDate, dataTypes } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        
        const parsedDataTypes = dataTypes ? JSON.parse(dataTypes) : null;
        const result = await findyAPI.getDeviceHistory(imei, startDate, endDate, parsedDataTypes);
        
        res.json(result);
    } catch (error) {
        console.error('Get device history error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to get device history',
            details: error.error || error.message
        });
    }
});

// Findy API - Search Devices
app.post('/api/findy/search', async (req, res) => {
    try {
        const searchCriteria = req.body;
        const result = await findyAPI.searchDevices(searchCriteria);
        
        res.json(result);
    } catch (error) {
        console.error('Search devices error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to search devices',
            details: error.error || error.message
        });
    }
});

// Findy API - Batch Get Devices (NEW - Issue #13 fix)
app.post('/api/findy/batch-devices', async (req, res) => {
    try {
        const { imeis } = req.body;
        
        if (!Array.isArray(imeis) || imeis.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: imeis array required'
            });
        }
        
        console.log(`📦 Batch fetching ${imeis.length} devices...`);
        
        const result = await findyAPI.getBatchDevices(imeis);
        
        res.json(result);
    } catch (error) {
        console.error('Batch devices error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to fetch batch devices',
            details: error.error || error.message
        });
    }
});

// Findy API - Sensor / tracking health (sensor counts and live tracking stats)
app.get('/api/findy/sensor-health', async (req, res) => {
    try {
        const allData = await dbManager.getAllData();
        const sensors = allData.sensors || [];
        
        const totalSensors = sensors.length;
        const onlineSensors = sensors.filter(s => s.status === 'online' || s.status === 'active').length;
        const offlineSensors = sensors.filter(s => s.status === 'offline' || s.status === 'inactive').length;
        const trackingStats = findyAPI.getTrackingStats();
        
        res.json({
            success: true,
            health: {
                totalSensors,
                onlineSensors,
                offlineSensors,
                activeLiveTracking: trackingStats.activeTracking,
                trackedDevices: trackingStats.devices
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get health status',
            details: (error && error.message) || String(error)
        });
    }
});

// Findy API - Send Command to Device
app.post('/api/findy/device/:imei/command', async (req, res) => {
    try {
        const { imei } = req.params;
        const commandData = req.body;
        
        const result = await findyAPI.sendCommand(imei, commandData);
        res.json(result);
    } catch (error) {
        console.error('Send command error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to send command',
            details: error.error || error.message
        });
    }
});

// Findy API - Delete Command
app.delete('/api/findy/device/:imei/command', async (req, res) => {
    try {
        const { imei } = req.params;
        const { requestID } = req.body;
        
        if (!requestID) {
            return res.status(400).json({
                success: false,
                error: 'requestID is required'
            });
        }
        
        const result = await findyAPI.deleteCommand(imei, requestID);
        res.json(result);
    } catch (error) {
        console.error('Delete command error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to delete command',
            details: error.error || error.message
        });
    }
});

// Findy API - Check Pending Commands
app.get('/api/findy/device/:imei/pending-commands', async (req, res) => {
    try {
        const { imei } = req.params;
        const result = await findyAPI.checkPendingCommands(imei);
        
        res.json(result);
    } catch (error) {
        console.error('Check pending commands error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to check pending commands',
            details: error.error || error.message
        });
    }
});

// Findy API - Start Live Tracking
app.post('/api/findy/device/:imei/livetracking', async (req, res) => {
    try {
        const { imei } = req.params;
        const result = await findyAPI.startLiveTracking(imei);
        
        // Broadcast to WebSocket clients that live tracking started
        broadcastToClients({
            type: 'findy_livetracking_started',
            imei: imei,
            timestamp: new Date().toISOString()
        });
        
        res.json(result);
    } catch (error) {
        console.error('Start live tracking error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to start live tracking',
            details: error.error || error.message
        });
    }
});

// Findy API - Get Live Tracking Data
app.get('/api/findy/device/:imei/livetracking', async (req, res) => {
    try {
        const { imei } = req.params;
        const result = await findyAPI.getLiveTracking(imei);
        
        // If GPS data is available, broadcast to WebSocket clients
        if (result.success && result.data) {
            broadcastToClients({
                type: 'findy_livetracking_update',
                imei: imei,
                data: result.data,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Get live tracking error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to get live tracking data',
            details: error.error || error.message
        });
    }
});

// Findy API - Stop Live Tracking
app.delete('/api/findy/device/:imei/livetracking', async (req, res) => {
    try {
        const { imei } = req.params;
        const result = await findyAPI.stopLiveTracking(imei);
        
        // Broadcast to WebSocket clients that live tracking stopped
        broadcastToClients({
            type: 'findy_livetracking_stopped',
            imei: imei,
            timestamp: new Date().toISOString()
        });
        
        res.json(result);
    } catch (error) {
        console.error('Stop live tracking error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to stop live tracking',
            details: error.error || error.message
        });
    }
});

// Findy API - Install Device
app.post('/api/findy/device/:imei/install', async (req, res) => {
    try {
        const { imei } = req.params;
        const vehicleInfo = req.body;
        
        const result = await findyAPI.installDevice(imei, vehicleInfo);
        res.json(result);
    } catch (error) {
        console.error('Install device error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to install device',
            details: error.error || error.message
        });
    }
});

// Findy API - Uninstall Device
app.delete('/api/findy/device/:imei/install', async (req, res) => {
    try {
        const { imei } = req.params;
        const result = await findyAPI.uninstallDevice(imei);
        
        res.json(result);
    } catch (error) {
        console.error('Uninstall device error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to uninstall device',
            details: error.error || error.message
        });
    }
});

// Findy API - Update Vehicle Info
app.put('/api/findy/device/:imei/car', async (req, res) => {
    try {
        const { imei } = req.params;
        const vehicleInfo = req.body;
        
        const result = await findyAPI.updateVehicleInfo(imei, vehicleInfo);
        res.json(result);
    } catch (error) {
        console.error('Update vehicle info error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to update vehicle information',
            details: error.error || error.message
        });
    }
});

// Findy API - Get M-Bus Data
app.post('/api/findy/mbus', async (req, res) => {
    try {
        const { fromDate, toDate, dataTypes, organization } = req.body;
        
        if (!fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                error: 'fromDate and toDate are required'
            });
        }
        
        const result = await findyAPI.getMBusData(
            fromDate,
            toDate,
            dataTypes || [],
            organization || 'ruse'
        );
        
        res.json(result);
    } catch (error) {
        console.error('Get M-Bus data error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: 'Failed to get M-Bus data',
            details: error.error || error.message
        });
    }
});

// Findy API - Get Tracked Devices
app.get('/api/findy/tracked-devices', (req, res) => {
    try {
        const trackedDevices = findyAPI.getTrackedDevices();
        res.json({
            success: true,
            devices: trackedDevices,
            count: trackedDevices.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get tracked devices',
            details: error.message
        });
    }
});

// ===== SENSOR MANAGEMENT API ENDPOINTS =====

// Store sensors in database
let sensorsData = {
    sensors: []
};

// Load sensors from database on startup; rehydrate from bins if sensors list is empty (e.g. after MongoDB migration)
(async () => {
    try {
        const data = await dbManager.getData('sensors');
        if (data && Array.isArray(data) && data.length > 0) {
            sensorsData.sensors = data;
            console.log(`📡 Loaded ${sensorsData.sensors.length} sensors from database`);
            const imeis = data.map(s => s.imei).filter(Boolean);
            console.log(`📡 Sensor IMEIs:`, imeis);
        } else if (data && Array.isArray(data)) {
            sensorsData.sensors = [];
            console.log(`📡 No sensors found in database, starting with empty array`);
        } else {
            sensorsData.sensors = [];
            console.log(`📡 No sensors data found, starting fresh`);
        }

        // Rehydrate sensors from bins: if any bin has sensorIMEI but no sensor record exists, add one (restores BIN-007 etc. after DB reset)
        if (sensorsData.sensors.length === 0) {
            try {
                const bins = await dbManager.getData('bins') || [];
                const existingImeis = new Set(sensorsData.sensors.map(s => s.imei).filter(Boolean));
                let added = 0;
                for (const bin of bins) {
                    const imei = bin.sensorIMEI || (bin.hasSensor && bin.sensorId) || null;
                    if (!imei || existingImeis.has(imei)) continue;
                    sensorsData.sensors.push({
                        imei: String(imei),
                        binId: bin.id || null,
                        status: 'active',
                        addedAt: new Date().toISOString(),
                        source: 'rehydrated-from-bin'
                    });
                    existingImeis.add(imei);
                    added++;
                }
                if (added > 0) {
                    await dbManager.updateData({ sensors: sensorsData.sensors });
                    console.log(`📡 Rehydrated ${added} sensor(s) from bins (e.g. BIN-007). Total sensors: ${sensorsData.sensors.length}`);
                }
            } catch (rehydrateErr) {
                console.warn('⚠️ Could not rehydrate sensors from bins:', rehydrateErr.message);
            }
        }
    } catch (error) {
        console.error('❌ Error loading sensors from database:', error);
        sensorsData.sensors = [];
        console.log('📡 Starting with empty sensors array');
    }
})();

// List all sensors
app.get('/api/sensors/list', async (req, res) => {
    try {
        // Ensure sensorsData.sensors is always an array
        if (!Array.isArray(sensorsData.sensors)) {
            sensorsData.sensors = [];
        }
        
        // Log for debugging
        console.log(`📡 GET /api/sensors/list: Returning ${sensorsData.sensors.length} sensors`);
        if (sensorsData.sensors.length > 0) {
            const imeis = sensorsData.sensors.map(s => s.imei).filter(Boolean);
            console.log(`📡 Sensor IMEIs in response:`, imeis);
        }
        
        res.json({
            success: true,
            sensors: sensorsData.sensors
        });
    } catch (error) {
        console.error('❌ Error listing sensors:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            sensors: [] // Return empty array on error
        });
    }
});

// Add new sensor
app.post('/api/sensors/add', async (req, res) => {
    try {
        const sensor = req.body;
        
        // Check if sensor already exists
        const exists = sensorsData.sensors.find(s => s.imei === sensor.imei);
        if (exists) {
            return res.status(400).json({
                success: false,
                error: 'Sensor already exists'
            });
        }
        
        sensorsData.sensors.push(sensor);
        
        console.log(`📡 Sensor added: ${sensor.imei}`);
        console.log(`📊 Total sensors now: ${sensorsData.sensors.length}`);
        
        // Save to database immediately
        await dbManager.updateData({ sensors: sensorsData.sensors });
        
        // Force immediate sync to file
        await dbManager.syncToExternal();
        
        res.json({
            success: true,
            sensor: sensor
        });
    } catch (error) {
        console.error('❌ Error adding sensor:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update sensor
app.post('/api/sensors/update', async (req, res) => {
    try {
        const updatedSensor = req.body;
        
        const index = sensorsData.sensors.findIndex(s => s.imei === updatedSensor.imei);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Sensor not found'
            });
        }
        
        sensorsData.sensors[index] = { ...sensorsData.sensors[index], ...updatedSensor };
        
        console.log(`📡 Sensor updated: ${updatedSensor.imei}`);
        
        // Save to database immediately
        await dbManager.updateData({ sensors: sensorsData.sensors });
        
        // Force immediate sync to file
        await dbManager.syncToExternal();
        
        res.json({
            success: true,
            sensor: sensorsData.sensors[index]
        });
    } catch (error) {
        console.error('❌ Error updating sensor:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Remove sensor
app.post('/api/sensors/remove', async (req, res) => {
    try {
        const { imei } = req.body;
        
        const before = sensorsData.sensors.length;
        sensorsData.sensors = sensorsData.sensors.filter(s => s.imei !== imei);
        const after = sensorsData.sensors.length;
        
        console.log(`🗑️ Sensor removed: ${imei} (${before} → ${after} sensors)`);
        
        // Save to database immediately
        await dbManager.updateData({ sensors: sensorsData.sensors });
        
        // Force immediate sync to file
        await dbManager.syncToExternal();
        
        res.json({
            success: true
        });
    } catch (error) {
        console.error('❌ Error removing sensor:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Static files already served from public at startup (express.static above)

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sensor Management page (standalone HTML in project root; must be before catch-all)
app.get('/sensor-management.html', (req, res) => {
    const file = path.join(__dirname, 'sensor-management.html');
    if (fs.existsSync(file)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.sendFile(file);
    } else {
        res.status(404).send('Sensor management page not found');
    }
});

// API endpoint for health check (world-class: load balancer & ops ready)
app.get('/api/health', async (req, res) => {
    let dbHealth = { initialized: false, error: null };
    try {
        dbHealth = await dbManager.healthCheck();
    } catch (e) {
        dbHealth.error = e.message;
    }
    res.json({
        status: dbHealth.initialized ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        websocketClients: clients.size,
        dataStatus: {
            users: (serverData.users || []).length,
            bins: (serverData.bins || []).length,
            routes: (serverData.routes || []).length,
            lastUpdate: serverData.lastUpdate
        },
        database: {
            initialized: dbHealth.initialized,
            dbType: dbHealth.dbType,
            lastSync: dbHealth.lastSync
        }
    });
});

// API endpoint for system info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Autonautics Waste Management System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===== WEBSOCKET FALLBACK ENDPOINTS FOR SERVERLESS =====

// Server-Sent Events endpoint
app.get('/api/sse', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connected',
        message: 'SSE connection established',
        timestamp: new Date().toISOString()
    })}\n\n`);
    
    // Keep connection alive
    const heartbeat = setInterval(() => {
        res.write(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
        })}\n\n`);
    }, 30000);
    
    // Store connection for broadcasting
    const connectionId = Date.now().toString();
    req.connection.id = connectionId;
    
    req.on('close', () => {
        clearInterval(heartbeat);
        console.log(`SSE connection ${connectionId} closed`);
    });
});

// Polling endpoint for updates
app.get('/api/polling/updates', async (req, res) => {
    try {
        // Check for pending messages and updates
        const updates = [];
        
        // Add any pending messages from the queue (if implemented)
        if (global.messageQueue && global.messageQueue.length > 0) {
            updates.push(...global.messageQueue.splice(0, 10)); // Get up to 10 messages
        }
        
        // Add any other pending updates
        // This could include driver status changes, route updates, etc.
        
        res.json({
            success: true,
            updates: updates,
            timestamp: new Date().toISOString(),
            hasMore: global.messageQueue ? global.messageQueue.length > 0 : false
        });
    } catch (error) {
        console.error('Polling updates error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get updates'
        });
    }
});

// Initialize global message queue for polling
global.messageQueue = global.messageQueue || [];

// HTTP endpoint for WebSocket-like messages
app.post('/api/websocket/message', async (req, res) => {
    try {
        const message = req.body;
        console.log('📨 HTTP WebSocket message received:', message.type);
        
        // Handle the message as if it came through WebSocket
        switch (message.type) {
            case 'client_info':
                console.log('👤 Client info via HTTP:', message.userId, 'Type:', message.userType);
                break;
                
            case 'chat_message':
                console.log('💬 Chat message via HTTP:', message.data?.message?.substring(0, 50));
                if (message.data) {
                    const msg = message.data;
                    const driverId = msg.sender === 'driver' ? (msg.targetDriverId || msg.senderId || msg.driverId) : (msg.targetDriverId || msg.driverId);
                    if (driverId) {
                        if (msg.sender === 'admin') {
                            persistChatAndAudit(driverId, { ...msg, targetDriverId: driverId, driverId }, 'admin-driver');
                        } else {
                            const source = msg.targetDriverId && msg.targetDriverId !== msg.senderId ? 'driver-driver' : 'driver-admin';
                            const persistId = msg.targetDriverId && msg.targetDriverId !== msg.senderId ? msg.targetDriverId : (msg.senderId || msg.driverId);
                            if (persistId) persistChatAndAudit(persistId, msg, source);
                        }
                    }
                    const wsPayload = { type: 'chat_message', data: message.data };
                    if (msg.sender === 'admin' && driverId) {
                        broadcastToDriver(driverId, wsPayload);
                    } else if (msg.sender === 'driver' && msg.targetDriverId) {
                        broadcastToDriver(msg.targetDriverId, wsPayload);
                    }
                    global.messageQueue.push({ type: 'chat_message', data: message.data, timestamp: new Date().toISOString(), id: message.data.id || Date.now().toString() });
                    if (global.messageQueue.length > 100) global.messageQueue = global.messageQueue.slice(-100);
                }
                break;
            case 'broadcast_to_drivers':
                if (message.data && typeof message.data === 'object') {
                    const users = serverData.users || [];
                    const drivers = users.filter(u => u.type === 'driver');
                    const baseMsg = {
                        ...message.data,
                        broadcast: true,
                        serverTimestamp: new Date().toISOString()
                    };
                    drivers.forEach(d => {
                        const msgForDriver = { ...baseMsg, targetDriverId: d.id };
                        if (dbManager && typeof dbManager.addDriverMessage === 'function') {
                            dbManager.addDriverMessage(d.id, msgForDriver).catch(err => console.error('Save broadcast message:', err.message));
                        }
                        if (dbManager && typeof dbManager.addChatAuditLog === 'function') {
                            dbManager.addChatAuditLog({
                                id: msgForDriver.id,
                                sender: 'admin',
                                senderId: 'admin',
                                senderName: msgForDriver.senderName || 'Management',
                                receiverId: String(d.id),
                                message: msgForDriver.message,
                                type: msgForDriver.type || 'text',
                                timestamp: msgForDriver.timestamp || new Date().toISOString(),
                                source: 'broadcast'
                            }).catch(err => console.error('Save broadcast audit:', err.message));
                        }
                        broadcastToDriver(d.id, { type: 'chat_message', data: msgForDriver });
                    });
                    console.log(`📢 Broadcast sent to ${drivers.length} drivers`);
                }
                break;
                
            case 'ping':
                res.json({ type: 'pong', timestamp: new Date().toISOString() });
                return;
                
            default:
                console.log('❓ Unknown HTTP message type:', message.type);
        }
        
        res.json({
            success: true,
            message: 'Message processed',
            timestamp: new Date().toISOString(),
            queueSize: global.messageQueue.length
        });
    } catch (error) {
        console.error('HTTP WebSocket message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process message'
        });
    }
});

// ===== DRIVER-SPECIFIC API ENDPOINTS =====

// Get specific driver data (world-class: use serverData for in-memory consistency)
app.get('/api/driver/:driverId', (req, res) => {
    console.log(`${new Date().toISOString()} - GET /api/driver/${req.params.driverId}`);
    
    const { driverId } = req.params;
    const users = serverData.users || [];
    const driver = users.find(user => user.id === driverId && user.type === 'driver');
    
    if (!driver) {
        return res.status(404).json({ 
            success: false, 
            message: 'Driver not found' 
        });
    }
    
    res.json({ 
        success: true, 
        data: driver,
        message: 'Driver data retrieved successfully'
    });
});

// Normalize driver rating/efficiency to one decimal (avoid display like 4.2524585626302045)
function sanitizeDriverUpdates(updates) {
    const out = { ...updates };
    if (out.rating != null && typeof out.rating === 'number' && !isNaN(out.rating)) {
        out.rating = Math.min(5, Math.max(0, Math.round(out.rating * 10) / 10));
    }
    if (out.efficiency != null && typeof out.efficiency === 'number' && !isNaN(out.efficiency)) {
        out.efficiency = Math.min(100, Math.max(0, Math.round(out.efficiency * 10) / 10));
    }
    return out;
}

// Update complete driver profile (world-class: sanitized inputs, real-time broadcast)
app.post('/api/driver/:driverId/update', (req, res) => {
    console.log(`${new Date().toISOString()} - POST /api/driver/${req.params.driverId}/update`);
    
    const { driverId } = req.params;
    const updates = sanitizeDriverUpdates(req.body);
    const users = serverData.users || [];
    const driverIndex = users.findIndex(user => user.id === driverId && user.type === 'driver');
    
    if (driverIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: 'Driver not found' 
        });
    }
    
    serverData.users[driverIndex] = { ...serverData.users[driverIndex], ...updates };
    
    console.log(`🔄 Driver ${driverId} updated: [`, Object.keys(updates).map(key => `'${key}'`).join(', '), ']');
    
    const updatedDriver = serverData.users[driverIndex];
    broadcastToClients({
        type: 'driver_update',
        driverId: driverId,
        driverData: updatedDriver,
        status: updatedDriver.movementStatus || 'stationary',
        fuelLevel: updatedDriver.fuelLevel || 75,
        timestamp: new Date().toISOString(),
        changes: Object.keys(updates)
    });
    
    res.json({ 
        success: true, 
        data: serverData.users[driverIndex],
        message: 'Driver updated successfully'
    });
});

// Update only driver fuel level
app.post('/api/driver/:driverId/fuel', (req, res) => {
    console.log(`${new Date().toISOString()} - POST /api/driver/${req.params.driverId}/fuel`);
    
    const { driverId } = req.params;
    const { fuelLevel } = req.body;
    const users = serverData.users || [];
    const driverIndex = users.findIndex(user => user.id === driverId && user.type === 'driver');
    
    if (driverIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: 'Driver not found' 
        });
    }
    
    serverData.users[driverIndex].fuelLevel = fuelLevel;
    serverData.users[driverIndex].lastUpdate = new Date().toISOString();
    serverData.users[driverIndex].lastFuelUpdate = new Date().toISOString();
    
    console.log(`⛽ Driver ${driverId} fuel level updated to ${fuelLevel}%`);
    
    const updatedDriver = serverData.users[driverIndex];
    broadcastToClients({
        type: 'driver_update',
        driverId: driverId,
        driverData: updatedDriver,
        status: updatedDriver.movementStatus || 'stationary',
        fuelLevel: fuelLevel,
        timestamp: new Date().toISOString(),
        changes: ['fuelLevel']
    });
    
    res.json({ 
        success: true, 
        data: { fuelLevel, lastUpdate: serverData.users[driverIndex].lastUpdate },
        message: 'Fuel level updated'
    });
});

// Update only driver status
app.post('/api/driver/:driverId/status', (req, res) => {
    console.log(`${new Date().toISOString()} - POST /api/driver/${req.params.driverId}/status`);
    
    const { driverId } = req.params;
    const { movementStatus, status } = req.body;
    const users = serverData.users || [];
    const driverIndex = users.findIndex(user => user.id === driverId && user.type === 'driver');
    
    if (driverIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: 'Driver not found' 
        });
    }
    
    if (movementStatus !== undefined) {
        serverData.users[driverIndex].movementStatus = movementStatus;
    }
    if (status !== undefined) {
        serverData.users[driverIndex].status = status;
    }
    serverData.users[driverIndex].lastUpdate = new Date().toISOString();
    serverData.users[driverIndex].lastStatusUpdate = new Date().toISOString();
    
    console.log(`🚛 Driver ${driverId} status updated - Movement: ${movementStatus}, Status: ${status}`);
    
    const updatedDriver = serverData.users[driverIndex];
    broadcastToClients({
        type: 'driver_update',
        driverId: driverId,
        driverData: updatedDriver,
        status: movementStatus || updatedDriver.movementStatus || 'stationary',
        fuelLevel: updatedDriver.fuelLevel || 75,
        timestamp: new Date().toISOString(),
        changes: ['movementStatus', 'status'].filter(field => 
            (field === 'movementStatus' && movementStatus !== undefined) ||
            (field === 'status' && status !== undefined)
        )
    });
    
    res.json({ 
        success: true, 
        data: { 
            movementStatus: serverData.users[driverIndex].movementStatus,
            status: serverData.users[driverIndex].status,
            lastUpdate: serverData.users[driverIndex].lastUpdate 
        },
        message: 'Driver status updated'
    });
});

// Explicitly serve /css/* and /js/* with correct MIME (fixes Render returning HTML for assets)
// Fallback: serve from project root (__dirname) when files are not in public/css or public/js
function serveAsset(req, res, subdir, mime, filename) {
    const file = path.join(pathPublic, subdir, filename);
    const fileCwd = path.join(pathPublicCwd, subdir, filename);
    let tryPath = fs.existsSync(file) ? file : (fs.existsSync(fileCwd) ? fileCwd : null);
    if (!tryPath) {
        tryPath = path.join(__dirname, filename);
        if (!fs.existsSync(tryPath)) tryPath = null;
    }
    if (!tryPath) return false;
    res.setHeader('Content-Type', mime);
    res.sendFile(tryPath, (err) => { if (err && !res.headersSent) res.status(404).send('Not found'); });
    return true;
}
app.get(/^\/css\//, (req, res, next) => {
    const filename = (req.path.replace(/^\/css\//, '') || '').replace(/\.\./g, '');
    if (!filename) return next();
    if (serveAsset(req, res, 'css', 'text/css; charset=utf-8', filename)) return;
    next();
});
app.get(/^\/js\//, (req, res, next) => {
    const filename = (req.path.replace(/^\/js\//, '') || '').replace(/\.\./g, '');
    if (!filename) return next();
    if (serveAsset(req, res, 'js', 'application/javascript; charset=utf-8', filename)) return;
    next();
});
// Favicon - avoid 404 in console (204 No Content if no file)
app.get('/favicon.ico', (req, res) => {
    const icoPath = path.join(pathPublic, 'favicon.ico');
    const icoCwd = path.join(pathPublicCwd, 'favicon.ico');
    const tryPath = fs.existsSync(icoPath) ? icoPath : (fs.existsSync(icoCwd) ? icoCwd : null);
    if (tryPath) {
        res.setHeader('Content-Type', 'image/x-icon');
        res.sendFile(tryPath);
    } else {
        res.status(204).end();
    }
});
// Root-level assets (e.g. /FINAL_ICON_CENTER_FIX.css) - serve with correct MIME; fallback to project root
app.get('/:file', (req, res, next) => {
    const name = (req.params.file || '').replace(/\.\./g, '');
    if (!/\.(css|js)$/i.test(name)) return next();
    const full = path.join(pathPublic, name);
    const fullCwd = path.join(pathPublicCwd, name);
    let tryPath = fs.existsSync(full) && fs.statSync(full).isFile() ? full : (fs.existsSync(fullCwd) && fs.statSync(fullCwd).isFile() ? fullCwd : null);
    if (!tryPath) {
        tryPath = path.join(__dirname, name);
        if (!fs.existsSync(tryPath) || !fs.statSync(tryPath).isFile()) tryPath = null;
    }
    if (!tryPath) return next();
    res.setHeader('Content-Type', name.toLowerCase().endsWith('.css') ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8');
    res.sendFile(tryPath, (err) => { if (err && !res.headersSent) res.status(404).send('Not found'); });
});
// Never serve index.html for other asset URLs (prevents MIME type errors)
const assetExtension = /\.(css|js|ico|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|map)(\?.*)?$/i;
app.get('*', (req, res, next) => {
    if (assetExtension.test(req.path)) {
        res.setHeader('Content-Type', 'text/plain');
        res.status(404).send('Not found');
        return;
    }
    next();
});
// Catch-all route for SPA (HTML only)
app.get('*', (req, res) => {
    const indexPath = fs.existsSync(path.join(pathPublic, 'index.html')) ? path.join(pathPublic, 'index.html') : path.join(pathPublicCwd, 'index.html');
    res.sendFile(indexPath);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ================== ENHANCED MESSAGING SYSTEM HANDLERS ==================

/** Persist chat to driver thread and to app-wide audit log (MongoDB/JSON) for auditing. */
async function persistChatAndAudit(driverId, messageData, source) {
    if (!driverId || !messageData) return;
    const msg = { ...messageData, serverTimestamp: new Date().toISOString() };
    if (dbManager && typeof dbManager.addDriverMessage === 'function') {
        dbManager.addDriverMessage(driverId, msg).catch(err => console.error('Save driver message:', err.message));
    }
    if (dbManager && typeof dbManager.addChatAuditLog === 'function') {
        const receiverId = messageData.sender === 'admin' ? driverId : (messageData.targetDriverId || 'admin');
        dbManager.addChatAuditLog({
            id: messageData.id,
            sender: messageData.sender,
            senderId: messageData.senderId || (messageData.sender === 'admin' ? 'admin' : ''),
            senderName: messageData.senderName || '',
            receiverId: String(receiverId),
            receiverName: messageData.receiverName || '',
            message: messageData.message,
            type: messageData.type || 'text',
            timestamp: messageData.timestamp || new Date().toISOString(),
            source
        }).catch(err => console.error('Save chat audit:', err.message));
    }
}

function handleChatMessage(senderWs, message) {
    console.log('💬 Processing chat message:', message.data);
    
    try {
        const messageData = message.data;
        const isDriverSender = messageData.sender === 'driver';
        const targetDriverId = messageData.targetDriverId || (messageData.sender === 'admin' ? (messageData.driverId || messageData.targetDriverId) : null);
        const persistDriverId = isDriverSender && targetDriverId ? targetDriverId : (messageData.sender === 'admin' ? targetDriverId : (messageData.senderId || messageData.driverId));
        
        // Driver-to-driver: persist for recipient, audit, and broadcast
        if (isDriverSender && targetDriverId) {
            if (dbManager && typeof dbManager.addDriverMessage === 'function') {
                dbManager.addDriverMessage(targetDriverId, {
                    ...messageData,
                    serverTimestamp: new Date().toISOString()
                }).then(() => {}).catch(err => console.error('Save driver message:', err.message));
            }
            if (dbManager && typeof dbManager.addChatAuditLog === 'function') {
                dbManager.addChatAuditLog({
                    id: messageData.id,
                    sender: 'driver',
                    senderId: messageData.senderId || messageData.driverId || '',
                    senderName: messageData.senderName || '',
                    receiverId: String(targetDriverId),
                    message: messageData.message,
                    type: messageData.type || 'text',
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    source: 'driver-driver'
                }).catch(err => console.error('Save chat audit:', err.message));
            }
            broadcastToDriver(targetDriverId, message);
            console.log(`📤 Driver-to-driver message relayed to ${targetDriverId}`);
            return;
        }
        
        // Persist to database and audit log (admin-driver or driver-admin)
        if (persistDriverId) {
            const source = messageData.sender === 'admin' ? 'admin-driver' : 'driver-admin';
            persistChatAndAudit(persistDriverId, messageData, source);
        }
        
        if (isDriverSender) {
            broadcastToAdminClients(message);
        } else if (messageData.sender === 'admin') {
            const toDriver = messageData.targetDriverId || messageData.driverId;
            if (toDriver) {
                broadcastToDriver(toDriver, message);
                console.log('🎯 Admin message target driver:', toDriver);
            }
        }
        
        console.log(`📤 Message relayed: ${messageData.sender} -> ${isDriverSender ? 'admin' : 'driver'}`);
        
    } catch (error) {
        console.error('❌ Error handling chat message:', error);
    }
}

function handleTypingIndicator(senderWs, message) {
    console.log('⌨️ Processing typing indicator:', message);
    
    try {
        // Relay typing indicator to relevant clients
        if (message.sender === 'driver') {
            broadcastToAdminClients(message);
        } else if (message.sender === 'admin' && message.target) {
            broadcastToDriver(message.target, message);
        }
        
    } catch (error) {
        console.error('❌ Error handling typing indicator:', error);
    }
}

function broadcastToAdminClients(message) {
    let adminCount = 0;
    let totalConnections = 0;
    let connectionsWithUserId = 0;
    
    console.log(`🔍 Broadcasting to admin clients among ${clients.size} total clients`);
    
    clients.forEach(client => {
        totalConnections++;
        if (client.readyState === 1) { // WebSocket.OPEN
            if (client.userId) {
                connectionsWithUserId++;
                console.log(`📋 Checking connection: userId=${client.userId}, userType=${client.userType}`);
            }
            
            // Check if client is admin (userType is 'admin' OR userId exists but userType is not 'driver')
            const isAdmin = client.userType === 'admin' || (client.userId && client.userType !== 'driver');
            
            if (isAdmin) {
                try {
                    client.send(JSON.stringify(message));
                    adminCount++;
                    console.log(`📡 Message sent to admin client: ${client.userId}`);
                } catch (error) {
                    console.error('Error sending message to admin client:', error);
                }
            } else {
                console.log(`📋 Skipping non-admin client: userId=${client.userId}, userType=${client.userType}`);
            }
        }
    });
    
    console.log(`📊 Admin broadcast summary: ${adminCount} admin clients reached out of ${totalConnections} total connections`);
    console.log(`📡 Message broadcast to ${adminCount} admin clients`);
}

function broadcastToDriver(driverId, message) {
    let driverFound = false;
    let totalConnections = 0;
    let connectionsWithUserId = 0;
    
    console.log(`🔍 Looking for driver ${driverId} among ${clients.size} total clients`);
    
    clients.forEach(client => {
        totalConnections++;
        if (client.readyState === 1) {
            if (client.userId) {
                connectionsWithUserId++;
                console.log(`📋 Active connection found: userId=${client.userId}, userType=${client.userType}`);
            } else {
                console.log(`📋 Active connection found: userId=undefined, userType=undefined`);
            }
            
            if (client.userId === driverId) {
                try {
                    client.send(JSON.stringify(message));
                    driverFound = true;
                    console.log(`📡 Message sent to driver ${driverId}`);
                } catch (error) {
                    console.error(`Error sending message to driver ${driverId}:`, error);
                }
            }
        }
    });
    
    console.log(`📊 Connection summary: ${totalConnections} total, ${connectionsWithUserId} with userId`);
    
    if (!driverFound) {
        console.log(`⚠️ Driver ${driverId} not connected - message queued for next connection`);
    }
}

function broadcastToClients(message) {
    let broadcastCount = 0;
    
    clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            try {
                // Safe JSON.stringify with circular reference handling
                const messageStr = JSON.stringify(message, (key, value) => {
                    // Remove circular references
                    if (value === client || value === clients) {
                        return undefined;
                    }
                    return value;
                });
                
                client.send(messageStr);
                broadcastCount++;
            } catch (error) {
                console.error('Error broadcasting message to client:', error.message);
                // Don't throw - just skip this client
            }
        }
    });
    
    return broadcastCount;
}

// Start server (skip on Vercel - serverless uses exported app only)
if (!process.env.VERCEL) {
server.listen(PORT, () => {
    console.log(`
    â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
    â•‘                                                    â•‘
    â•‘   ðŸš› Autonautics Waste Management System          â•‘
    â•‘                                                    â•‘
    â•‘   Server running at: http://localhost:${PORT}        â•‘
    â•‘   Environment: ${process.env.NODE_ENV || 'development'}                      â•‘
    â•‘                                                    â•‘
    â•‘   Press Ctrl+C to stop                            â•‘
    â•‘                                                    â•‘
    â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    `);
    
    console.log('🔌 WebSocket server ready for real-time communication');
    console.log(`👥 Active WebSocket connections: ${clients.size}`);
    
    // Start sensor polling with proper database ready check
    waitForDatabaseAndStartPolling().then(success => {
        if (success) {
            console.log('✅ Sensor polling service initialized successfully');
        }
    }).catch(error => {
        console.error('❌ Failed to initialize sensor polling:', error);
    });
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const fallback = PORT === 8080 ? 3001 : 8080;
        console.warn(`⚠️ Port ${PORT} in use, trying http://localhost:${fallback} ...`);
        server.listen(fallback, () => {
            console.log(`✅ Server running at http://localhost:${fallback}`);
            console.log('🔌 WebSocket server ready');
            waitForDatabaseAndStartPolling().then(success => {}).catch(e => console.error('❌ Sensor polling:', e));
        });
    } else {
        console.error('❌ Server error:', err);
        process.exit(1);
    }
});
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Wait for database and Findy API to be ready before starting sensor polling
async function waitForDatabaseAndStartPolling(maxWaitMs = 30000) {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second
    
    console.log('⏳ Waiting for database initialization...');
    
    while (Date.now() - startTime < maxWaitMs) {
        if (dbManager.initialized) {
            console.log('✅ Database is ready');
            
            // Try to authenticate with Findy API if not already
            if (!findyAPI.isAuthenticated()) {
                console.log('🔐 Attempting Findy API authentication...');
                try {
                    const authResult = await findyAPI.login();
                    if (authResult.success) {
                        console.log('✅ Findy API authenticated successfully');
                    } else {
                        console.warn('⚠️ Findy API authentication failed:', authResult.error);
                        console.warn('💡 Sensor polling will retry authentication on each poll cycle');
                    }
                } catch (error) {
                    console.warn('⚠️ Findy API authentication error:', error.message);
                }
            }
            
            // Start sensor polling service
            console.log('🎯 Starting sensor polling service...');
            await startSensorPollingService();
            return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.error('❌ Database initialization timeout after ' + maxWaitMs + 'ms - starting sensor polling anyway');
    await startSensorPollingService();
    return false;
}

// Graceful shutdown (world-class: close server, WebSocket, DB)
function gracefulShutdown(signal) {
    console.log(`\n\n📋 ${signal} received - shutting down gracefully...`);
    let closed = false;
    function exit(code) {
        if (closed) return;
        closed = true;
        if (typeof dbManager.stopSyncProcess === 'function') {
            dbManager.stopSyncProcess();
            console.log('✅ Database connections closed');
        }
        process.exit(code || 0);
    }
    if (typeof wssHeartbeat !== 'undefined') clearInterval(wssHeartbeat);
    wss.close(() => console.log('✅ WebSocket server closed'));
    clients.forEach(ws => { try { ws.close(); } catch (_) {} });
    clients.clear();
    server.close(() => {
        console.log('✅ HTTP server closed');
        exit(0);
    });
    setTimeout(() => exit(0), 10000);
}

module.exports = app;