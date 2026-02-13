# 🎯 Sensor Management System - Complete Guide

## ✅ NEW FEATURE: Admin Panel for Managing 3000+ Sensors

I've created a complete sensor management system that allows you to:
- ✅ Add sensors via simple web interface
- ✅ Bulk import 1000s of sensors from CSV/text
- ✅ Link sensors to bins with one click
- ✅ See real-time connection status
- ✅ Monitor battery levels
- ✅ View all sensors in one table
- ✅ Automatically appear on map when linked

---

## 🚀 Quick Start

### Step 1: Add Backend Endpoints

Add this code to your `server.js` (around line 550, before the "Routes" section):

```javascript
// ===== SENSOR MANAGEMENT API ENDPOINTS =====

// Store sensors in database
let sensorsData = {
    sensors: []
};

// Load sensors from database on startup
(async () => {
    try {
        const data = await dbManager.getData('sensors');
        if (data) {
            sensorsData.sensors = data;
        }
    } catch (error) {
        console.log('No existing sensors data');
    }
})();

// List all sensors
app.get('/api/sensors/list', async (req, res) => {
    try {
        res.json({
            success: true,
            sensors: sensorsData.sensors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
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
        
        // Save to database
        await dbManager.updateData({ sensors: sensorsData.sensors });
        
        console.log(`📡 Sensor added: ${sensor.imei}`);
        
        res.json({
            success: true,
            sensor: sensor
        });
    } catch (error) {
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
        
        // Save to database
        await dbManager.updateData({ sensors: sensorsData.sensors });
        
        res.json({
            success: true,
            sensor: sensorsData.sensors[index]
        });
    } catch (error) {
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
        
        sensorsData.sensors = sensorsData.sensors.filter(s => s.imei !== imei);
        
        // Save to database
        await dbManager.updateData({ sensors: sensorsData.sensors });
        
        console.log(`🗑️ Sensor removed: ${imei}`);
        
        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

### Step 2: Add to index.html

Add this script tag (around line 3610, with other scripts):

```html
<!-- Sensor Management Admin -->
<script src="sensor-management-admin.js"></script>
```

### Step 3: Add Admin Panel Section

Add this HTML to your `index.html` (in the main content area, around line 1500):

```html
<!-- Sensor Management Section -->
<section id="sensor-management" class="section" style="display: none;">
    <div class="section-header">
        <h2><i class="fas fa-satellite-dish"></i> Sensor Management</h2>
        <p>Manage your Findy IoT sensors and link them to bins</p>
    </div>
    
    <!-- API Status -->
    <div class="glass-card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3>Findy IoT API Status</h3>
                <p id="findyAPIStatus">Checking...</p>
            </div>
            <button class="btn btn-primary" onclick="sensorManagementAdmin.checkAllSensorStatus()">
                <i class="fas fa-sync"></i> Refresh All Status
            </button>
        </div>
    </div>
    
    <!-- Statistics -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="stat-icon"><i class="fas fa-satellite-dish"></i></div>
            <div class="stat-value" id="totalSensors">0</div>
            <div class="stat-label">Total Sensors</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
            <div class="stat-value" id="onlineSensors">0</div>
            <div class="stat-label">Online</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
            <div class="stat-value" id="offlineSensors">0</div>
            <div class="stat-label">Offline</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
            <div class="stat-icon"><i class="fas fa-link"></i></div>
            <div class="stat-value" id="linkedSensors">0</div>
            <div class="stat-label">Linked to Bins</div>
        </div>
    </div>
    
    <!-- Actions -->
    <div class="glass-card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="sensorManagementAdmin.showAddSensorDialog()">
                <i class="fas fa-plus"></i> Add Sensor
            </button>
            <button class="btn btn-success" onclick="sensorManagementAdmin.showBulkImportDialog()">
                <i class="fas fa-file-import"></i> Bulk Import
            </button>
            <button class="btn btn-info" onclick="window.open('/list-findy-devices.html', '_blank')">
                <i class="fas fa-list"></i> View Findy Devices
            </button>
        </div>
    </div>
    
    <!-- Sensors Table -->
    <div class="glass-card">
        <h3 style="margin-bottom: 1rem;">Registered Sensors</h3>
        <div style="overflow-x: auto;">
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Sensor Name / IMEI</th>
                        <th>Status</th>
                        <th>Linked Bin</th>
                        <th>Battery</th>
                        <th>Operator</th>
                        <th>Last Seen</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="sensorTableBody">
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            Loading sensors...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<!-- Add Sensor Modal -->
<div id="addSensorModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h2>Add New Sensor</h2>
            <span class="close" onclick="document.getElementById('addSensorModal').style.display='none'">&times;</span>
        </div>
        <div style="padding: 2rem;">
            <div class="form-group">
                <label>Sensor IMEI *</label>
                <input type="text" id="sensorIMEI" placeholder="Enter sensor IMEI (e.g., 868324050000000)" style="width: 100%;">
            </div>
            <div class="form-group">
                <label>Sensor Name (Optional)</label>
                <input type="text" id="sensorName" placeholder="e.g., Main Street Sensor" style="width: 100%;">
            </div>
            <div class="form-group">
                <label>Link to Bin (Optional)</label>
                <select id="sensorBinId" style="width: 100%;">
                    <option value="">-- Link Later --</option>
                </select>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('addSensorModal').style.display='none'">
                    Cancel
                </button>
                <button class="btn btn-primary" onclick="
                    sensorManagementAdmin.addSensor(
                        document.getElementById('sensorIMEI').value,
                        document.getElementById('sensorBinId').value || null,
                        document.getElementById('sensorName').value || null
                    ).then(() => document.getElementById('addSensorModal').style.display='none');
                ">
                    Add Sensor
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Bulk Import Modal -->
<div id="bulkImportModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
            <h2>Bulk Import Sensors</h2>
            <span class="close" onclick="document.getElementById('bulkImportModal').style.display='none'">&times;</span>
        </div>
        <div style="padding: 2rem;">
            <p style="margin-bottom: 1rem; color: #64748b;">
                Paste sensor data (one per line). Formats supported:
            </p>
            <ul style="margin-bottom: 1rem; color: #64748b;">
                <li><code>IMEI</code> - Just the IMEI</li>
                <li><code>IMEI,BIN-ID</code> - IMEI and bin to link</li>
                <li><code>IMEI,BIN-ID,Name</code> - IMEI, bin, and custom name</li>
            </ul>
            <div class="form-group">
                <textarea id="bulkImportData" rows="15" placeholder="868324050000000
868324050000001,BIN-001
868324050000002,BIN-002,Sensor A" style="width: 100%; font-family: monospace;"></textarea>
            </div>
            <div id="bulkImportProgress" style="margin-bottom: 1rem; color: #64748b;"></div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="document.getElementById('bulkImportModal').style.display='none'">
                    Cancel
                </button>
                <button class="btn btn-success" onclick="
                    sensorManagementAdmin.bulkImportSensors(
                        document.getElementById('bulkImportData').value
                    ).then(() => {
                        setTimeout(() => document.getElementById('bulkImportModal').style.display='none', 2000);
                    });
                ">
                    <i class="fas fa-file-import"></i> Import
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Link Sensor Modal -->
<div id="linkSensorModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
            <h2>Link Sensor to Bin</h2>
            <span class="close" onclick="document.getElementById('linkSensorModal').style.display='none'">&times;</span>
        </div>
        <div style="padding: 2rem;">
            <input type="hidden" id="linkSensorIMEI">
            <div class="form-group">
                <label>Select Bin</label>
                <select id="linkBinId" style="width: 100%;"></select>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('linkSensorModal').style.display='none'">
                    Cancel
                </button>
                <button class="btn btn-primary" onclick="
                    sensorManagementAdmin.linkSensorToBin(
                        document.getElementById('linkSensorIMEI').value,
                        document.getElementById('linkBinId').value
                    ).then(() => document.getElementById('linkSensorModal').style.display='none');
                ">
                    Link
                </button>
            </div>
        </div>
    </div>
</div>

<style>
.btn-mini {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white;
}
.btn-mini.btn-primary { background: #3b82f6; }
.btn-mini.btn-warning { background: #f59e0b; }
.btn-mini.btn-info { background: #0ea5e9; }
.btn-mini.btn-danger { background: #ef4444; }
.btn-mini:hover { opacity: 0.9; }

.data-table {
    border-collapse: collapse;
}
.data-table th,
.data-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}
.data-table th {
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
}
.data-table tbody tr:hover {
    background: #f8fafc;
}
</style>
```

### Step 4: Add Navigation Menu Item

In your navigation menu (sidebar), add:

```html
<div class="nav-item" data-section="sensor-management">
    <i class="fas fa-satellite-dish"></i>
    <span>Sensor Management</span>
</div>
```

---

## 📱 How to Use

### Add Single Sensor

1. Go to **Sensor Management** section
2. Click **"Add Sensor"**
3. Enter the sensor IMEI
4. (Optional) Enter a name
5. (Optional) Select a bin to link
6. Click **"Add Sensor"**

The sensor will:
- ✅ Be verified in Findy IoT
- ✅ Be saved to database
- ✅ Start monitoring
- ✅ Appear on map (if linked to bin)

### Bulk Import 1000+ Sensors

1. Click **"Bulk Import"**
2. Paste your sensor list:
   ```
   868324050000000
   868324050000001,BIN-001
   868324050000002,BIN-002,Sensor A
   ```
3. Click **"Import"**
4. Wait for progress to complete

Format options:
- `IMEI` - Just add sensor
- `IMEI,BIN-ID` - Add and link to bin
- `IMEI,BIN-ID,Name` - Add, link, and name

### Link Sensor to Bin

1. Find sensor in table
2. Click the **link icon** 🔗
3. Select bin from dropdown
4. Sensor immediately appears on map!

### Monitor Status

The table shows:
- 🟢 **Online** - Sensor connected and reporting
- 🔴 **Offline** - No recent reports
- 🔵 **Active** - Tracking enabled
- **Battery %** - Color-coded (green/orange/red)
- **Last Seen** - Time since last report

Auto-refreshes every 30 seconds!

---

## 🎯 Features

### Real-Time Monitoring
- Connection status
- Battery levels
- Last seen times
- GPS locations
- Cellular operator

### Easy Management
- One-click add
- Bulk import for 1000s
- Quick link/unlink
- Remove sensors
- Status refresh

### Map Integration
- Linked sensors appear on map automatically
- Show as enhanced bin markers
- Real-time position updates
- Click for sensor details

### Scalability
- Designed for 3000+ sensors
- Efficient status checking
- Batch operations
- Database storage

---

## 💾 Data Storage

Sensors are stored in your database:

```javascript
{
    imei: '868324050000000',
    binId: 'BIN-001',
    name: 'Main Street Sensor',
    dateAdded: '2025-12-14T...',
    status: 'online',
    lastSeen: '2025-12-14T...',
    battery: 85,
    operator: 'Vodafone'
}
```

---

## 🔧 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sensors/list` | GET | Get all sensors |
| `/api/sensors/add` | POST | Add new sensor |
| `/api/sensors/update` | POST | Update sensor |
| `/api/sensors/remove` | POST | Remove sensor |

---

## ✅ Complete Setup Checklist

- [ ] Add backend API endpoints to `server.js`
- [ ] Add script tag to `index.html`
- [ ] Add HTML section to `index.html`
- [ ] Add navigation menu item
- [ ] Restart server
- [ ] Test adding a sensor
- [ ] Test bulk import
- [ ] Verify sensors appear on map

---

## 🎉 Result

You now have a professional sensor management system that can:
- ✅ Handle 3000+ sensors easily
- ✅ Add sensors in seconds via UI
- ✅ Bulk import from CSV/text
- ✅ Monitor all sensor status in real-time
- ✅ See battery levels and connectivity
- ✅ Link sensors to bins with one click
- ✅ Automatically show on map
- ✅ No manual config file editing needed!

---

**Everything is ready! Just follow the setup steps above and you'll have a complete sensor management admin panel!** 🚀



