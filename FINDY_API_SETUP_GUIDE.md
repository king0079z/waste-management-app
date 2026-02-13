# 🔧 Findy IoT API Setup Guide
## Autonautics Waste Management System

**Date:** January 26, 2026  
**Status:** Configuration Required

---

## 🎯 Current Status

✅ **Application Running:** Server started successfully on port 3000  
✅ **MongoDB Connected:** All data migrated successfully  
✅ **Sensors Loaded:** 1 sensor (IMEI: 865456059002301) loaded from database  
⚠️ **Findy API:** Not authenticated - credentials required

---

## ⚠️ Issue

The sensor polling service is currently unable to fetch live data from Findy IoT API because authentication credentials are not configured.

**Error seen in logs:**
```
❌ Error fetching live tracking for 865456059002301: 
   Error: Not authenticated. Please login first.
```

---

## 🔐 Solution: Configure Findy API Credentials

### Step 1: Get Your Findy API Credentials

You need to obtain:
- **Username** - Your Findy IoT account username
- **Password** - Your Findy IoT account password

If you don't have credentials:
1. Visit: https://higps.org
2. Contact Findy IoT support to create an account
3. Or contact your system administrator for credentials

---

### Step 2: Update .env File

Open the `.env` file in the root directory and update these lines:

**Current (default):**
```env
# Findy IoT API Configuration
FINDY_API_URL=https://higps.org/api/v2
FINDY_API_USERNAME=your-findy-username
FINDY_API_PASSWORD=your-findy-password
```

**Update to (with real credentials):**
```env
# Findy IoT API Configuration
FINDY_API_URL=https://higps.org/api/v2
FINDY_API_USERNAME=actual_username_here
FINDY_API_PASSWORD=actual_password_here
```

**Example:**
```env
# Findy IoT API Configuration
FINDY_API_URL=https://higps.org/api/v2
FINDY_API_USERNAME=admin@autonautics.com
FINDY_API_PASSWORD=SecurePassword123!
```

---

### Step 3: Restart the Server

After updating `.env`, restart the server:

**On Windows:**
```bash
# Press Ctrl+C to stop the current server
# Then restart:
npm start
```

**Or use the startup script:**
```bash
run-app.bat
```

---

### Step 4: Verify Authentication

After restart, check the server console for:

**✅ Success:**
```
🔑 Findy API credentials loaded from environment
✅ Findy IoT API connected and authenticated successfully
✅ Sensor polling service started successfully
🔄 Polling sensors...
📡 Found 1 sensors to poll
✅ Polling 1 active sensors
📡 Polling sensor 865456059002301...
✅ Received data for sensor 865456059002301: fill=75%, battery=85%
```

**❌ Still failing:**
```
⚠️ Findy IoT API not ready: Authentication failed
💡 To enable IoT sensor integration, update .env with valid Findy API credentials
```

---

## 🧪 Testing After Configuration

### 1. Check Server Logs

Monitor the console for successful polling:
```
🔄 Polling sensors... (every 60 seconds)
✅ Received data for sensor 865456059002301...
💾 Updated sensor 865456059002301 in database
💾 Updated bin BIN-003 with sensor data
📊 Poll complete: 1 successful, 0 failed
```

### 2. Check Health Endpoint

```bash
# In browser or Postman
GET http://localhost:3000/api/findy/health
```

**Expected Response (authenticated):**
```json
{
  "success": true,
  "health": {
    "totalSensors": 1,
    "onlineSensors": 1,
    "offlineSensors": 0,
    "activeLiveTracking": 0,
    "trackedDevices": []
  },
  "timestamp": "2026-01-26T..."
}
```

### 3. Check Browser Console

Open the application in browser and check DevTools console:
```
📡 Sensor update received: 865456059002301
🗑️ Bin fill update received: BIN-003, level: 75%
♻️ Updating existing marker for bin BIN-003
```

### 4. Verify Map Updates

- Login to application (admin/admin123)
- Go to Monitoring section
- Click on a bin marker with sensor
- Popup should show:
  - 📡 IoT Sensor Connected
  - Battery: XX%
  - Temperature: XX°C
  - Last Seen: timestamp

---

## 🔄 What Happens Without Credentials

Without valid Findy API credentials, the system will:

✅ **Still works:**
- Application starts normally
- MongoDB data loads
- Map displays bins
- Manual data entry works
- UI fully functional

❌ **Cannot do:**
- Fetch live sensor data from Findy IoT
- Update bin fill levels from sensors
- Get real-time GPS locations
- Monitor sensor battery/temperature
- Track sensor status

**System Mode:** Manual operation (no live IoT integration)

---

## 🔍 Troubleshooting

### Issue: "Not authenticated" error persists

**Check:**
1. Credentials are correct (no typos)
2. .env file saved properly
3. Server restarted after changes
4. Environment variables loaded: Check logs for "🔑 Findy API credentials loaded"

**Test credentials manually:**
```bash
# In server console or Node.js REPL
node
> const FindyAPIService = require('./findy-api-service.js');
> const api = new FindyAPIService();
> api.login('your-username', 'your-password').then(console.log);
```

---

### Issue: "Connection failed" error

**Check:**
1. Internet connectivity
2. Findy API URL correct: `https://higps.org/api/v2`
3. Firewall not blocking outbound HTTPS
4. Findy IoT service is online

**Test API accessibility:**
```bash
curl https://higps.org/api/v2/login
# Should return JSON response (may be error, but confirms connectivity)
```

---

### Issue: Server not picking up .env changes

**Solutions:**
1. **Restart required:** Changes to .env only apply on server restart
2. **File location:** Ensure .env is in root directory (same as server.js)
3. **File encoding:** Save as UTF-8, no BOM
4. **No quotes needed:** 
   ```env
   # WRONG
   FINDY_API_USERNAME="username"
   
   # CORRECT
   FINDY_API_USERNAME=username
   ```

---

## 📊 Monitoring Sensor Activity

### Check Sensor Polling Status

**Server Console:**
- Look for "🔄 Polling sensors..." every 60 seconds
- Count successful polls: "📊 Poll complete: X successful, Y failed"

**MongoDB:**
```javascript
// In MongoDB Compass or shell
use waste_management
db.sensors.find().pretty()
// Check 'lastUpdate' timestamp - should be recent
```

**Application:**
- Monitoring dashboard shows "Active Sensors Count"
- Should reflect actual online sensors

---

## 🎯 Next Steps After Configuration

Once Findy API is configured:

1. **Monitor Initial Poll:** Wait 60 seconds for first automatic poll
2. **Verify Data Flow:** Check bin markers update with sensor data
3. **Link More Sensors:** Use Sensor Management to link sensors to bins
4. **Configure Alerts:** Set thresholds for critical fill levels
5. **Review Logs:** Monitor sensor health in server console

---

## 💡 Optional: Manual Sensor Tracking

Even without automatic polling, you can manually trigger tracking:

**Browser Console:**
```javascript
// Start live tracking for specific sensor
findyClient.startLiveTracking('865456059002301');

// Stop tracking
findyClient.stopLiveTracking('865456059002301');

// Check status
findyClient.getStats();
```

---

## 📞 Getting Help

### Findy IoT Support
- Website: https://higps.org
- Contact: support@findyiot.com (example)
- Documentation: Check Findy IoT developer portal

### Application Support
- Check: `SENSOR_FIXES_IMPLEMENTATION_SUMMARY.md`
- Check: `SENSOR_QUICK_START_GUIDE.md`
- Server logs location: Console output

---

## ✅ Verification Checklist

After configuration, verify:

- [ ] .env file updated with real credentials
- [ ] Server restarted
- [ ] Console shows "🔑 Findy API credentials loaded from environment"
- [ ] Console shows "✅ Findy IoT API connected and authenticated successfully"
- [ ] Sensor polling starts: "✅ Sensor polling service started successfully"
- [ ] First poll within 60 seconds shows success
- [ ] Bin markers update with sensor data
- [ ] Health endpoint returns success
- [ ] No authentication errors in logs

---

## 📄 Configuration Template

Copy this to your `.env` file:

```env
# ============================================================
# Findy IoT API Configuration
# ============================================================
# Get credentials from: https://higps.org
# Contact: Findy IoT support team
# Documentation: https://higps.org/docs/api
# ============================================================

FINDY_API_URL=https://higps.org/api/v2
FINDY_API_USERNAME=your_actual_username_here
FINDY_API_PASSWORD=your_actual_password_here

# Sensor Polling Configuration (optional)
# SENSOR_POLL_INTERVAL=60000  # Poll every 60 seconds (default)
```

---

**Status:** ⚠️ **Awaiting Credentials**  
**Action Required:** Update .env with valid Findy IoT API credentials  
**Impact:** IoT sensor integration disabled until configured  
**System Mode:** Manual operation (full functionality except live sensor data)

---

**Last Updated:** January 26, 2026  
**Applies To:** Autonautics Waste Management System v1.0
