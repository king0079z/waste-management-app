// findy-config-example.js - Example Configuration for Findy IoT API
// Copy this file to findy-config.js and update with your credentials

module.exports = {
    // Findy API Configuration
    findy: {
        baseURL: 'https://uac.higps.org',
        apiKey: 'BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234',
        server: 'findyIoT_serverApi',
        
        // Your Findy API Credentials (REQUIRED)
        // Get these from your Findy IoT account
        credentials: {
            username: process.env.FINDY_USERNAME || 'YOUR_USERNAME_HERE',
            password: process.env.FINDY_PASSWORD || 'YOUR_PASSWORD_HERE'
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
        // 'USR-001': '868324050000000',  // John's vehicle
        // 'USR-002': '868324050000001',  // Jane's vehicle
        // Add your mappings here
    },
    
    // Sensor data types to track (optional)
    // Leave empty to track all data types
    trackedDataTypes: [
        // Example data type IDs:
        // 200, 201, 222, 265, 457, 462
    ]
};


