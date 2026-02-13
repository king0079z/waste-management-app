// findy-config.js - Findy IoT API Configuration
// Uses env-loader for safe handling of passwords with special characters (#, !, etc.)

const env = require('./env-loader.js');

module.exports = {
    findy: {
        // Base URL for UAC API (correct URL from Postman collection)
        baseURL: env.FINDY_API_URL || 'https://uac.higps.org',
        apiKey: env.FINDY_API_KEY || 'BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234',
        server: env.FINDY_SERVER || 'findyIoT_serverApi',
        
        // Credentials from env-loader (strips quotes so FINDY_API_PASSWORD='pass#!' works)
        credentials: {
            username: env.FINDY_API_USERNAME || '',
            password: env.FINDY_API_PASSWORD || ''
        },
        
        // Optional: Default organization for M-Bus data
        defaultOrganization: 'ruse',
        
        // Optional: Live tracking update interval (milliseconds)
        liveTrackingInterval: 5000,
        
        // Optional: Auto-authentication on startup
        autoAuthenticate: true
    },
    
    // Vehicle to Driver IMEI mapping
    // Map driver IDs to their vehicle IMEI numbers
    vehicleMapping: {
        // Example:
        // 'USR-001': '868324050000000',
        // 'USR-002': '868324050000001',
        // Add your driver-vehicle mappings here
    },
    
    // Sensor data types to track (optional)
    // Leave empty to track all data types
    trackedDataTypes: []
};

