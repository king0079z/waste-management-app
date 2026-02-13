# Findy IoT Sensor Integration Guide

## Overview

This guide explains how to integrate and use the Findy IoT sensor system with your waste management application. The integration allows you to track vehicles in real-time, monitor sensor data, and send commands to IoT devices.

## Features

✅ **Complete API Integration** - All Findy UAC API endpoints implemented  
✅ **Real-time Vehicle Tracking** - Live GPS tracking with automatic updates  
✅ **Device Management** - Install, uninstall, and configure IoT devices  
✅ **Command Control** - Send commands to devices remotely  
✅ **Driver Integration** - Automatic sensor integration for driver accounts  
✅ **History & Analytics** - Access historical sensor data and device history  
✅ **WebSocket Support** - Real-time updates pushed to all clients  

## Quick Start

### 1. Configure API Credentials

Create a `findy-config.js` file based on `findy-config-example.js`:

```javascript
module.exports = {
    findy: {
        baseURL: 'https://uac.higps.org',
        apiKey: 'BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234',
        server: 'findyIoT_serverApi',
        credentials: {
            username: 'your_username',
            password: 'your_password'
        }
    },
    vehicleMapping: {
        'USR-001': '868324050000000',  // Map driver ID to vehicle IMEI
    }
};
```

Alternatively, set environment variables:

```bash
FINDY_USERNAME=your_username
FINDY_PASSWORD=your_password
```

### 2. Authentication

The system will automatically attempt to authenticate when the server starts. You can also manually login:

**Backend (Node.js):**
```javascript
const FindyAPIService = require('./findy-api-service.js');
const findyAPI = new FindyAPIService();

await findyAPI.login('username', 'password');
```

**Frontend (Browser):**
```javascript
await findyClient.login('username', 'password');
```

### 3. Start Using the API

**Get Device Information:**
```javascript
// Frontend
const device = await findyClient.getDevice('868324050000000');
console.log(device.data);

// Backend
const device = await findyAPI.getDevice('868324050000000');
```

**Start Live Tracking:**
```javascript
// Frontend
await findyClient.startLiveTracking('868324050000000');

// Backend
await findyAPI.startLiveTracking('868324050000000');
```

## API Endpoints

All endpoints are available through the backend server at `/api/findy/*`:

### Authentication
- `POST /api/findy/login` - Login to Findy API
- `GET /api/findy/health` - Check API health and authentication status

### Device Management
- `GET /api/findy/device/:imei` - Get device information
- `GET /api/findy/device/:imei/history` - Get device history
- `POST /api/findy/search` - Search for devices
- `POST /api/findy/device/:imei/install` - Install device with vehicle info
- `DELETE /api/findy/device/:imei/install` - Uninstall device
- `PUT /api/findy/device/:imei/car` - Update vehicle information

### Commands
- `POST /api/findy/device/:imei/command` - Send command to device
- `DELETE /api/findy/device/:imei/command` - Delete pending command
- `GET /api/findy/device/:imei/pending-commands` - Check pending commands

### Live Tracking
- `POST /api/findy/device/:imei/livetracking` - Start live tracking
- `GET /api/findy/device/:imei/livetracking` - Get live tracking data
- `DELETE /api/findy/device/:imei/livetracking` - Stop live tracking
- `GET /api/findy/tracked-devices` - Get list of tracked devices

### Data
- `POST /api/findy/mbus` - Get M-Bus data

## Frontend Client Usage

### Basic Usage

```javascript
// The findyClient is automatically available globally
console.log(findyClient);

// Check authentication status
const health = await findyClient.healthCheck();
console.log('Authenticated:', health.authenticated);

// Login if needed
if (!health.authenticated) {
    await findyClient.login('username', 'password');
}
```

### Getting Device Data

```javascript
// Get full device information
const device = await findyClient.getDevice('868324050000000');

// Get specific data types only
const device = await findyClient.getDevice('868324050000000', [200, 201, 222]);

// Get cached device data (no API call)
const cachedDevice = findyClient.getCachedDevice('868324050000000');
```

### Device History

```javascript
// Get history for specific period
const history = await findyClient.getDeviceHistory(
    '868324050000000',
    '2025-02-01 00:00:00',
    '2025-02-27 23:59:59'
);

// Get history with specific data types
const history = await findyClient.getDeviceHistory(
    '868324050000000',
    '2025-02-01 00:00:00',
    '2025-02-27 23:59:59',
    [200, 201]  // Only get these data types
);
```

### Live Tracking

```javascript
// Start live tracking (updates every 5 seconds by default)
await findyClient.startLiveTracking('868324050000000');

// Start with custom update interval (10 seconds)
await findyClient.startLiveTracking('868324050000000', 10000);

// Listen for updates
window.addEventListener('livetracking:update', (event) => {
    console.log('Position update:', event.detail);
});

// Stop live tracking
await findyClient.stopLiveTracking('868324050000000');

// Check if device is being tracked
const isTracked = findyClient.isDeviceTracked('868324050000000');
```

### Sending Commands

```javascript
// Send a setting command
await findyClient.sendCommand('868324050000000', {
    body: '*SET,457,2',
    commandId: 'set',
    via: 'GPRS'
});

// Send a measurement command
await findyClient.sendCommand('868324050000000', {
    body: '*GET,462$',
    commandId: 'get',
    via: 'GPRS'
});

// Send a command with expiration time (5 minutes)
await findyClient.sendCommand('868324050000000', {
    body: '*SET,265',
    commandId: 'cmd',
    via: 'GPRS',
    expirationTime: 5
});
```

### Searching Devices

```javascript
// Search by IMEI
const results = await findyClient.searchDevices({
    imei: '868324050'
});

// Search by vehicle plate
const results = await findyClient.searchDevices({
    car: {
        plate: 'ABC123'
    }
});

// Search by battery level
const results = await findyClient.searchDevices({
    batteryLevel: {
        value: 50,
        operator: '<'
    }
});

// Complex search
const results = await findyClient.searchDevices({
    deviceVersionID: 1,
    lastReport: {
        date: '2025-02-01 00:00:00',
        operator: '>'
    },
    car: {
        brand: 'Mercedes'
    }
});
```

## Driver Integration

For driver accounts, the system automatically integrates with their assigned vehicle's sensors.

### Automatic Initialization

When a driver logs in, the system:
1. Checks for vehicle IMEI in driver profile
2. Loads vehicle sensor data
3. Displays sensor status panel
4. Enables live tracking controls

### Driver Features

- **Real-time Vehicle Status** - Battery, signal strength, operator
- **Live Tracking** - Automatic GPS tracking during routes
- **Sensor History** - Access historical sensor data
- **Vehicle Commands** - Send commands to vehicle

### Manual Initialization

```javascript
// Initialize for specific driver with IMEI
await findyDriverIntegration.initialize('USR-001', '868324050000000');

// Get vehicle sensor data
await findyDriverIntegration.loadVehicleSensorData();

// Start live tracking
await findyDriverIntegration.startLiveTracking();

// Get vehicle history
const history = await findyDriverIntegration.getVehicleHistory(
    '2025-02-01 00:00:00',
    '2025-02-27 23:59:59'
);
```

### Custom Events

Listen for driver integration events:

```javascript
// Vehicle data updated
window.addEventListener('findy:vehicle-data-updated', (event) => {
    const vehicleInfo = event.detail;
    console.log('Vehicle battery:', vehicleInfo.battery);
});

// Location updated
window.addEventListener('findy:location-updated', (event) => {
    const location = event.detail;
    console.log('New location:', location.lat, location.lng);
});
```

## WebSocket Integration

Real-time updates are automatically broadcast to all connected clients:

```javascript
// Listen for WebSocket messages
websocketManager.ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'findy_livetracking_started':
            console.log('Tracking started for:', data.imei);
            break;
            
        case 'findy_livetracking_update':
            console.log('Position update:', data.data);
            break;
            
        case 'findy_livetracking_stopped':
            console.log('Tracking stopped for:', data.imei);
            break;
    }
});
```

## Command Types

### Setting Commands
Change device settings:
```javascript
{
    body: '*SET,457,2',  // *SET,<command_number>,<value>
    commandId: 'set',
    via: 'GPRS'  // or 'SMS'
}
```

### Measurement Commands
Request sensor readings:
```javascript
{
    body: '*GET,462$',  // *GET,<command_number>$
    commandId: 'get',
    via: 'GPRS'
}
```

### Action Commands
Execute device actions:
```javascript
{
    body: '*SET,222',  // *SET,<command_number>
    commandId: 'cmd',
    via: 'GPRS'
}
```

## Data Types

Common Findy data type IDs:
- `200` - GPS Position
- `201` - GSM Position
- `222` - Device Reset
- `265` - Sleep Mode
- `457` - Report Interval
- `462` - Battery Status

## Error Handling

```javascript
try {
    const device = await findyClient.getDevice('868324050000000');
    console.log(device);
} catch (error) {
    console.error('Failed to get device:', error.message);
    
    // Check error details
    if (error.status === 401) {
        // Re-authenticate
        await findyClient.login(username, password);
    } else if (error.status === 404) {
        // Device not found
        console.log('Device does not exist');
    }
}
```

## Best Practices

1. **Authentication** - Always check authentication status before making API calls
2. **Error Handling** - Wrap API calls in try-catch blocks
3. **Rate Limiting** - Avoid excessive API calls, use caching when possible
4. **Live Tracking** - Stop live tracking when not needed to save resources
5. **Command Expiration** - Use expirationTime for commands to avoid stale commands
6. **Data Types** - Specify data types when possible to reduce payload size
7. **Vehicle Mapping** - Maintain accurate IMEI to driver mappings

## Troubleshooting

### Authentication Issues
- Verify credentials in `findy-config.js` or environment variables
- Check API key is correct: `BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234`
- Ensure network connectivity to `https://uac.higps.org`

### Device Not Found
- Verify IMEI number is correct
- Ensure device is registered in Findy system
- Check device ownership and permissions

### Live Tracking Not Working
- Ensure device supports GPS
- Check device has cellular connectivity
- Verify live tracking was started successfully
- Check for pending commands that might block GPS

### No Sensor Data
- Ensure device has reported recently
- Check device battery level
- Verify cellular signal strength
- Review device status in Findy portal

## Support

For Findy IoT platform support:
- Website: https://uac.higps.org
- API Documentation: Contact Findy support team

For integration support:
- Review this documentation
- Check browser console for errors
- Review server logs for API errors

## API Reference

Complete Postman collection is available in: `UAC API.postman_collection_2025-08-13-2.json`

Import this collection into Postman for interactive API testing.


