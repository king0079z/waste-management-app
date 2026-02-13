# 🚀 Sensor System - Quick Start Guide
## Autonautics Waste Management System

**Updated:** January 26, 2026  
**All Fixes Applied:** ✅

---

## 🎯 What Was Fixed

✅ **All 17 critical sensor connectivity issues resolved**
- Real Findy IoT API integration
- Automatic sensor polling
- Real-time WebSocket updates
- Sensor-to-bin-to-map data flow
- Accurate monitoring stats
- No duplicate markers
- Sensor persistence

---

## 🚦 Quick Verification Steps

### 1. Start the Server
```bash
cd "c:\Users\abouelfetouhm\Desktop\New folder (65)"
node server.js
```

**Look for these startup messages:**
```
✅ Findy IoT API connected successfully
📡 Loaded X sensors from database
✅ X active sensors ready
🎯 Initializing sensor polling service...
✅ Sensor polling service started successfully
```

### 2. Open the Application
Navigate to: `http://localhost:8080`

### 3. Check Browser Console
Press `F12` to open DevTools, then check for:
```
🔧 FindyClient initialized
🌉 SensorBinMapBridge initialized
🔧 mapManager detected, applying bin popup enhancement...
✅ Loaded X sensors
✅ Loaded X bin-sensor links
```

### 4. Verify Monitoring Dashboard
1. Login (admin/admin123)
2. Click "Monitoring" section
3. Check **Active Sensors Count** - should show real count, not "15" or "18"

### 5. Test Real-time Updates
- Watch server console for: `🔄 Polling sensors...` (every 60 seconds)
- Watch browser console for: `📡 Sensor update received: ...`
- Bin markers should update automatically

### 6. Test Bin Popups
- Click any bin marker on the map
- Popup should appear with detailed info
- If it has a sensor, should show: 📡 IoT Sensor Connected

---

## 🔍 Health Check

### Check Sensor Health Endpoint
```bash
# In browser or Postman
GET http://localhost:8080/api/findy/health
```

**Expected Response:**
```json
{
  "success": true,
  "health": {
    "totalSensors": 10,
    "onlineSensors": 8,
    "offlineSensors": 2,
    "activeLiveTracking": 0,
    "trackedDevices": []
  },
  "timestamp": "2026-01-26T..."
}
```

---

## 📡 Manual Sensor Tracking

### Start Live Tracking
```javascript
// In browser console
findyClient.startLiveTracking('865456059002301');
```

### Stop Live Tracking
```javascript
findyClient.stopLiveTracking('865456059002301');
```

### Check Tracked Devices
```javascript
findyClient.getStats();
// Returns: { cachedDevices: 5, trackedDevices: 1, authenticated: true }
```

---

## 🗺️ Map Marker Tests

### Test 1: Marker Appears
- Login and go to Monitoring
- Map should show bin markers
- Bins with sensors should have 📡 badge

### Test 2: Popup Works
- Click any bin marker
- Popup should appear (not blank)
- Should show fill level, location, status

### Test 3: Sensor Data Shows
- Click a bin with a sensor
- Popup should show:
  - 📡 IoT Sensor Connected
  - Battery %
  - Temperature
  - Signal strength
  - Last seen

### Test 4: No Duplicates
- Refresh page multiple times
- Each bin should have only ONE marker
- Console should show: "🔄 Removing existing marker for bin X to prevent duplicate"

---

## 📊 Monitoring Dashboard Tests

### Check Live Stats
**Active Sensors Count** - Real number from database, not mock  
**Online Vehicles Count** - Number of active drivers  
**Active Drivers Status** - Number of online drivers  

### WebSocket Status
- Should show "🔌 WebSocket Connected" in console
- If disconnected, should auto-reconnect
- Sensor updates should still work

---

## 🐛 Troubleshooting

### Problem: No sensors showing
**Check:**
1. Server console: Are sensors loaded? `📡 Loaded X sensors from database`
2. MongoDB: Do sensors exist in database?
3. Browser console: Is bridge initialized? `🌉 SensorBinMapBridge initialized`

**Fix:**
- Ensure MongoDB is running
- Check sensor data was imported
- Verify API credentials

---

### Problem: Popups not showing
**Check:**
1. Console errors when clicking marker
2. Map container CSS overflow
3. Leaflet popup z-index

**Fix:**
- Check: `map-fix.css` has `overflow: visible !important`
- Verify: `map-bin-sensor-enhancement.js` is loaded AFTER `map-manager.js`
- See: Previous popup fix documentation

---

### Problem: Duplicate markers
**Check:**
1. Browser console for: "🔄 Removing existing marker..."
2. Multiple script loads of map-manager.js

**Fix:**
- Should be fixed with TODO #2
- Verify only one instance of map-manager.js loaded
- Check sensor-bin-map-bridge doesn't recreate unnecessarily

---

### Problem: Sensor data not updating
**Check:**
1. Server console: `🔄 Polling sensors...` every 60 seconds
2. Findy API authentication successful
3. WebSocket connected

**Fix:**
- Verify Findy API credentials valid
- Check internet connectivity
- Restart sensor polling: Server restart

---

### Problem: Monitoring stats show wrong numbers
**Check:**
1. Console: "✅ Using real sensor count from..."
2. sensorManagementAdmin available

**Fix:**
- Verify `sensor-management-admin.js` loaded
- Check method exists: `getSensorStatistics()`
- Fallback will use bins with sensors

---

## 📞 Quick Reference Commands

### Server Console Commands
```javascript
// Check Findy API status
findyAPI.getTrackingStats()

// Manually trigger sensor poll
pollAllSensors()

// Check sensor count
(await dbManager.getAllData()).sensors.length
```

### Browser Console Commands
```javascript
// Check bridge stats
sensorBinMapBridge.getStatistics()

// Refresh all bins from sensors
sensorBinMapBridge.refreshAllBins()

// Check Findy client
findyClient.getStats()

// Force sensor data update for a bin
sensorBinMapBridge.updateBinFromSensor('865456059002301', {
  fillLevel: 75,
  battery: 85,
  temperature: 28,
  gps: { lat: 25.2854, lng: 51.5310 }
})
```

---

## 🔧 Configuration Options

### Adjust Sensor Polling Interval
**File:** `server.js` (line ~182)
```javascript
const SENSOR_POLL_INTERVAL = 60000; // Change to desired ms
// 30000 = 30 seconds
// 120000 = 2 minutes
```

### Disable Sensor Polling
**File:** `server.js` (line ~1923)
```javascript
// Comment out this section:
/*
setTimeout(() => {
    console.log('🎯 Initializing sensor polling service...');
    startSensorPollingService()...
}, 5000);
*/
```

---

## ✅ Success Indicators

### Server Logs (Every 60 seconds)
```
🔄 Polling sensors...
📡 Found X sensors to poll
✅ Polling X active sensors
📡 Polling sensor 865456059002301...
✅ Received data for sensor 865456059002301: fill=75%, battery=85%
💾 Updated sensor 865456059002301 in database
💾 Updated bin BIN-003 with sensor data
📊 Poll complete: X successful, Y failed
```

### Browser Console
```
📡 Sensor update received: 865456059002301
🗑️ Bin fill update received: BIN-003, level: 75%
♻️ Updating existing marker for bin BIN-003
📝 Updated popup content for bin BIN-003
```

### Visual Indicators
- ✅ Bin markers appear on map
- ✅ Bins with sensors have 📡 badge
- ✅ Popups show when clicking markers
- ✅ Sensor data appears in popups
- ✅ Monitoring dashboard shows real sensor count
- ✅ No duplicate markers
- ✅ Markers update color based on fill level

---

## 🎓 Understanding the System

### Data Flow
```
Findy IoT → FindyAPIService → Server Polling → MongoDB
                                      ↓
                              WebSocket Broadcast
                                      ↓
                    WebSocket Manager → Sensor-Bin-Map Bridge
                                      ↓
                          DataManager + MapManager + UI
```

### Key Components

1. **findy-api-service.js** - Talks to Findy IoT API
2. **sensor-bin-map-bridge.js** - Connects sensors ↔ bins ↔ map
3. **findy-client.js** - Frontend API proxy
4. **websocket-manager.js** - Real-time updates
5. **Sensor Polling** - Auto-refresh every 60s

---

## 🆘 Getting Help

### Debug Mode
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for emoji-prefixed logs:
   - 📡 = Sensor operations
   - 🌉 = Bridge operations
   - ✅ = Success
   - ❌ = Errors
   - ⚠️ = Warnings

### Log Files
- **Server:** Check terminal/console output
- **Client:** Check browser DevTools console
- **Database:** Use MongoDB Compass to inspect data

### Support Checklist
When reporting issues, provide:
1. Server startup logs (first 50 lines)
2. Browser console logs (errors only)
3. Health check response: `GET /api/findy/health`
4. MongoDB sensor count query result
5. Steps to reproduce

---

## 🎉 You're All Set!

The sensor system is now fully operational with:
- ✅ Real-time sensor data
- ✅ Automatic polling
- ✅ WebSocket updates
- ✅ Map integration
- ✅ Accurate stats
- ✅ Error recovery
- ✅ Data persistence

For detailed implementation info, see:
- `SENSOR_FIXES_IMPLEMENTATION_SUMMARY.md`

For original issues list, see:
- Diagnostic report (provided by user)

---

**Happy Monitoring! 🚛📡🗑️**
