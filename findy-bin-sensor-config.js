// findy-bin-sensor-config.js - Map Bins to Findy IoT Sensors
// Configure your bin-sensor mappings here

const findyBinSensorConfig = {
    // Map bin IDs to sensor IMEIs
    // Format: 'BIN_ID': 'SENSOR_IMEI'
    binMappings: {
        // Add your bin-to-sensor mappings here:
        // 'BIN-001': '868324050000000',
        // 'BIN-002': '868324050000001',
        // 'BIN-003': '868324050000002',
        
        // Once you add mappings here, bins will automatically appear on the map
        // with real-time sensor data from Findy IoT
    },
    
    // Auto-start tracking on page load
    autoStartTracking: true,
    
    // Update interval for sensor data (milliseconds)
    updateInterval: 30000, // 30 seconds
    
    // Enable automatic location sync from sensor GPS
    syncBinLocation: true,
    
    // Enable fill level sync from sensor (if your sensors report this)
    syncFillLevel: false,
    
    // Sensor data field mapping (customize based on your sensor data structure)
    sensorFieldMapping: {
        // Map Findy sensor fields to your bin properties
        // Example:
        // 'report.measurement': 'fillLevel',
        // 'report.temperature': 'temperature',
    }
};

// Expose configuration globally (for browser)
if (typeof window !== 'undefined') {
    window.findyBinSensorConfig = findyBinSensorConfig;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = findyBinSensorConfig;
}


