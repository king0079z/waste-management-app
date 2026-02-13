# 🗑️ Bins with Findy Sensors on Map - Complete Guide

## ✅ YES! Bins with Sensors WILL Appear on the Map

The Findy IoT sensors are installed **ON the bins**, so they appear as **enhanced bin markers** with real-time sensor data.

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Map Bins to Sensors

Create `findy-bin-sensor-config.js` from the example:

```javascript
const findyBinSensorConfig = {
    binMappings: {
        'BIN-001': '868324050000000',  // Map bin ID to sensor IMEI
        'BIN-002': '868324050000001',
        'BIN-003': '868324050000002',
    }
};
```

### Step 2: Start the Server

```bash
npm start
```

### Step 3: View Bins on Map

Open your app and go to Monitoring page:
```
http://localhost:8080
```

**The bins will appear on the map with sensor data!** 🗺️

---

## 📍 How Bins Appear on the Map

### **Visual Appearance**

Bins with sensors have **enhanced markers**:

```
┌─────────────────────┐
│  🛰️ ← Sensor Badge  │
│    🗑️ ← Bin Icon    │
│      🟢 ← Battery    │
└─────────────────────┘
```

**Marker Features:**
- 🗑️ **Bin Icon**: Trash icon in center
- 🛰️ **Sensor Badge**: Blue satellite dish (top-left)
- 🟢 **Battery Indicator**: Color-coded dot (top-right)
- **Fill Level Color**: Bin color changes based on fill level

**Color Coding:**

| Fill Level | Bin Color | Meaning |
|------------|-----------|---------|
| 0-40% | 🟢 Green | Low - No collection needed |
| 40-60% | 🟡 Yellow | Medium - Monitor |
| 60-80% | 🟠 Orange | High - Collection soon |
| 80-100% | 🔴 Red | Critical - Collect now! |

**Battery Indicator:**
- 🟢 Green dot: Battery > 60%
- 🟠 Orange dot: Battery 30-60%
- 🔴 Red dot: Battery < 30%

---

## 🔍 Bin Popup Information

Click any bin marker to see detailed information:

```
┌──────────────────────────────────────┐
│ 🗑️ Bin BIN-001                       │
├──────────────────────────────────────┤
│ Fill Level: 45%                      │
│ ▓▓▓▓▓░░░░░ (Progress bar)           │
│                                      │
│ Type: Paper Waste                    │
│ 📍 Location: 123 Main Street         │
├──────────────────────────────────────┤
│ 🛰️ Sensor Data                       │
│                                      │
│ 🔋 Battery: 85%                      │
│ 📡 Operator: Vodafone                │
│ 📍 Type: GPS (12 sats)               │
│    25.285400, 51.531000              │
│ Last: 2m ago                         │
│                                      │
│ IMEI: 868324050000000                │
├──────────────────────────────────────┤
│ [Details]  [Refresh]                 │
└──────────────────────────────────────┘
```

---

## 🚀 Setup Instructions

### Option 1: Using Configuration File (Recommended)

**Step 1: Create config file**

Copy the example:
```bash
cp findy-bin-sensor-config-example.js findy-bin-sensor-config.js
```

**Step 2: Edit mappings**

```javascript
// findy-bin-sensor-config.js
const findyBinSensorConfig = {
    binMappings: {
        'BIN-001': '868324050000000',
        'BIN-002': '868324050000001',
        'BIN-003': '868324050000002',
        // Add all your bins here
    },
    autoStartTracking: true  // Auto-start on page load
};
```

**Step 3: Restart server**

```bash
npm start
```

**Done!** Bins appear on map automatically with sensor data.

### Option 2: Using API (Dynamic)

Link bins to sensors dynamically:

```javascript
// Link a single bin to sensor
findyBinSensorIntegration.linkBinToSensor('BIN-001', '868324050000000');

// Start monitoring
await findyBinSensorIntegration.startMonitoringBinSensor('BIN-001', '868324050000000');
```

### Option 3: Using DataManager (Database)

Add sensor IMEI to bin objects:

```javascript
const bin = {
    id: 'BIN-001',
    name: 'Main Street Bin',
    type: 'Paper',
    fillLevel: 45,
    location: { lat: 25.2854, lng: 51.5310 },
    sensorIMEI: '868324050000000',  // Add this field
    hasSensor: true                  // Add this field
};

dataManager.addBin(bin);
```

The system will auto-detect and start monitoring.

---

## 📊 Real-Time Updates

### **Automatic Updates**

Once configured, bins receive automatic updates:

- **Position Updates**: Every 30 seconds
- **Fill Level**: Real-time (if sensor supports)
- **Battery Status**: Real-time monitoring
- **GPS Location**: Synced from sensor
- **Signal Quality**: Live satellites count

### **What Updates Automatically:**

```javascript
{
    binId: 'BIN-001',
    fillLevel: 45,           // Updated from sensor
    location: {              // Updated from GPS
        lat: 25.2854,
        lng: 51.5310
    },
    sensorData: {
        battery: 85,         // Real-time
        operator: 'Vodafone',
        satellites: 12,
        lastReport: '2m ago'
    }
}
```

---

## 🎨 Visual Examples

### **Monitoring Page with Multiple Bins**

```
        Your Waste Collection Map
┌─────────────────────────────────────┐
│                                     │
│   🗑️ BIN-001 (45% - Green)         │
│   🛰️ Sensor Active                  │
│                                     │
│         🗑️ BIN-002 (75% - Orange)   │
│         🛰️ Sensor Active             │
│                                     │
│  🗑️ BIN-003 (20% - Green)           │
│  🛰️ Sensor Active                   │
│                                     │
│              🗑️ BIN-004 (90% - Red)│
│              🛰️ Sensor Active        │
│                                     │
└─────────────────────────────────────┘
```

### **Bin Without Sensor vs With Sensor**

```
Normal Bin          Sensor-Enabled Bin
┌──────────┐       ┌──────────┐
│          │       │ 🛰️        │
│   🗑️     │       │   🗑️   🟢 │
│          │       │          │
└──────────┘       └──────────┘
Simple marker      Enhanced marker
                   + Sensor badge
                   + Battery indicator
                   + Real-time data
```

---

## 💻 Usage Examples

### **Check Bin Sensor Status**

```javascript
// Check if bin has sensor
const binId = 'BIN-001';
const sensor = findyBinSensorIntegration.getSensorByBin(binId);

if (sensor) {
    console.log(`Bin ${binId} has sensor: ${sensor}`);
} else {
    console.log(`Bin ${binId} has no sensor`);
}
```

### **Refresh Specific Bin**

```javascript
// Manual refresh
await findyBinSensorIntegration.refreshBinSensor('BIN-001');
```

### **Start Monitoring All Bins**

```javascript
// Start monitoring all configured bins
await findyBinSensorIntegration.startMonitoringBinSensors();
```

### **Get Bin by Sensor**

```javascript
// Find which bin has a specific sensor
const imei = '868324050000000';
const bin = findyBinSensorIntegration.getBinBySensor(imei);
console.log('Bin:', bin);
```

---

## 🔧 Advanced Configuration

### **Custom Update Interval**

```javascript
// Update every 60 seconds instead of 30
const findyBinSensorConfig = {
    binMappings: { /* ... */ },
    updateInterval: 60000  // milliseconds
};
```

### **Sync Bin Location from GPS**

```javascript
const findyBinSensorConfig = {
    binMappings: { /* ... */ },
    syncBinLocation: true  // Update bin location from sensor GPS
};
```

### **Custom Sensor Field Mapping**

```javascript
// Map sensor data to bin properties
const findyBinSensorConfig = {
    binMappings: { /* ... */ },
    sensorFieldMapping: {
        'report.measurement': 'fillLevel',  // Sensor measurement → fill level
        'report.temperature': 'temperature',
        'report.humidity': 'humidity'
    }
};
```

---

## 🎯 Complete Example

### **Full Setup**

**1. Configure credentials** (`findy-config.js`):
```javascript
module.exports = {
    findy: {
        credentials: {
            username: 'your_username',
            password: 'your_password'
        }
    }
};
```

**2. Map bins to sensors** (`findy-bin-sensor-config.js`):
```javascript
const findyBinSensorConfig = {
    binMappings: {
        'BIN-001': '868324050000000',
        'BIN-002': '868324050000001',
        'BIN-003': '868324050000002'
    },
    autoStartTracking: true,
    syncBinLocation: true
};
```

**3. Start server:**
```bash
npm start
```

**4. Open app:**
```
http://localhost:8080
```

**5. Go to Monitoring page**

**Result:** All bins appear on map with:
- Real-time sensor data
- Battery indicators
- GPS locations
- Fill levels
- Auto-updates every 30 seconds

---

## 🐛 Troubleshooting

### **Bins Not Showing on Map?**

**Check:**
```javascript
// 1. Are bins configured?
console.log('Mappings:', findyBinSensorIntegration.binSensorMapping);

// 2. Is Findy authenticated?
const health = await findyClient.healthCheck();
console.log('Authenticated:', health.authenticated);

// 3. Are bins in database?
const bins = dataManager.getBins();
console.log('Bins:', bins);

// 4. Is map initialized?
console.log('Map:', mapManager?.map);
```

**Solutions:**
1. Verify bin-sensor mappings in config
2. Ensure Findy credentials are correct
3. Add bins to your database/dataManager
4. Ensure you're on Monitoring page (map loads there)

### **Sensor Data Not Updating?**

```javascript
// Check if monitoring is active
console.log('Update intervals:', findyBinSensorIntegration.updateIntervals);

// Manually refresh
await findyBinSensorIntegration.refreshBinSensor('BIN-001');

// Check sensor data
console.log('Sensor data:', findyBinSensorIntegration.sensorData);
```

### **Wrong Location Shown?**

- Ensure sensor has GPS fix (4+ satellites)
- Check `syncBinLocation` is enabled
- Verify sensor is reporting correct coordinates
- Try manual refresh

---

## 📋 Quick Reference

### **Key Files**

| File | Purpose |
|------|---------|
| `findy-bin-sensor-integration.js` | Core integration logic |
| `findy-bin-sensor-config.js` | Your bin-sensor mappings |
| `findy-bin-sensor-config-example.js` | Configuration template |

### **Key Functions**

```javascript
// Link bin to sensor
findyBinSensorIntegration.linkBinToSensor(binId, imei);

// Start monitoring
await findyBinSensorIntegration.startMonitoringBinSensor(binId, imei);

// Refresh bin data
await findyBinSensorIntegration.refreshBinSensor(binId);

// Get sensor by bin
const imei = findyBinSensorIntegration.getSensorByBin(binId);

// Get bin by sensor
const bin = findyBinSensorIntegration.getBinBySensor(imei);
```

### **Events**

```javascript
// Listen for bin sensor updates
window.addEventListener('bin:sensor-updated', (event) => {
    const { binId, sensorInfo } = event.detail;
    console.log(`Bin ${binId} updated:`, sensorInfo);
});
```

---

## 🎉 Summary

### ✅ What You Get

- **Bins appear as enhanced markers** on the map
- **Real-time sensor data** displayed in popups
- **Color-coded by fill level** (green/yellow/orange/red)
- **Battery indicators** for sensor health
- **GPS location sync** from sensors
- **Automatic updates** every 30 seconds
- **Sensor badges** showing which bins have IoT sensors

### 🚀 Ready to Use

1. Create `findy-bin-sensor-config.js` with your mappings
2. Configure Findy credentials
3. Start server
4. Open Monitoring page
5. **See all bins with sensors on the map!** 🗑️🗺️✅

---

**The bins with sensors WILL appear on the map - fully integrated and ready!**



