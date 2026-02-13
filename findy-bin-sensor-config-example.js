// findy-bin-sensor-config-example.js - Map Bins to Findy IoT Sensors
// Copy this file to findy-bin-sensor-config.js and configure your bin-sensor mappings

const findyBinSensorConfig = {
    // Map bin IDs to sensor IMEIs
    // Format: 'BIN_ID': 'SENSOR_IMEI'
    binMappings: {
        // Examples:
        // 'BIN-001': '868324050000000',
        // 'BIN-002': '868324050000001',
        // 'BIN-003': '868324050000002',
        
        // Add your bin-to-sensor mappings here:
        // 'YOUR_BIN_ID': 'YOUR_SENSOR_IMEI',
    },
    
    // Optional: Auto-start tracking on page load
    autoStartTracking: true,
    
    // Optional: Update interval for sensor data (milliseconds)
    updateInterval: 30000, // 30 seconds
    
    // Optional: Enable automatic location sync
    // If true, bin location will be updated from sensor GPS
    syncBinLocation: true,
    
    // Optional: Enable fill level sync from sensor
    // If your sensors report fill level, enable this
    syncFillLevel: false,
    
    // Optional: Sensor data field mapping
    // Map Findy sensor fields to your bin data structure
    sensorFieldMapping: {
        // Example:
        // 'report.measurement': 'fillLevel',
        // 'report.temperature': 'temperature',
        // 'report.humidity': 'humidity',
    }
};

// Expose configuration globally
if (typeof window !== 'undefined') {
    window.findyBinSensorConfig = findyBinSensorConfig;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = findyBinSensorConfig;
}


