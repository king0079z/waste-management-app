# Outline: What Is Still Using localStorage

Quick reference of every **localStorage** usage in the app (excluding `node_modules`).

---

## By key / feature

| Key(s) | Purpose | Files using it |
|--------|---------|----------------|
| **`waste_mgmt_*`** | Core data (users, bins, routes, collections, complaints, alerts, driverLocations, analytics, systemLogs, binHistory, driverHistory, vehicles, sensors, initialized, issues, etc.) | **data-manager.js** (getData/setData, clearAllData, exportData) |
| **`waste_mgmt_session`** | Login session | **auth.js** |
| **`currentDriver`** | Current driver context | app.js, websocket-fix.js, websocket-fallback.js, websocket-manager.js, driver-history-button-fix.js, driver-system-v3.js, enhanced-driver-interface-v2.js, enhanced-ai-route-manager.js, messaging-fix.js, messaging-system-fix.js |
| **`currentUser`** / **`loggedInUser`** | Current user context | websocket-fix.js, enhanced-ai-route-manager.js, report-ui-integration.js |
| **`driverMessages`** | Manager–driver chat (cache; server also persists) | enhanced-messaging-system.js, messaging-system.js, messaging-fix.js, driver-system-v3.js |
| **`unreadMessageCounts`** | Unread message counts | enhanced-messaging-system.js |
| **`systemMessages`** | Flat message log | messaging-system.js |
| **`lastMessageCheck`** | Last message check time | messaging-system.js |
| **`deletedBins`** | List of deleted bin IDs | sync-manager.js, realtime-update-broadcaster.js, sensor-management.html, deleted-bins-filter.js, bin-deletion-listener.js (hooks setItem) |
| **`lastBinUpdate`** | Last bin update payload | realtime-update-broadcaster.js |
| **`lastBinDeleted`** | Last deleted bin id + timestamp | realtime-update-broadcaster.js, sensor-management.html |
| **`driverRoutes_${driverId}`** | Per-driver routes cache | data-manager.js, driver-route-fix.js, direct-fix.js, inline-fix.html |
| **`driverCollections_${driverId}`** | Per-driver collections cache | data-manager.js, driver-route-fix.js |
| **`generated_bins`**, **`generated_drivers`**, **`generated_routes`**, **`generated_users`**, **`dataset_metadata`** | Generated demo dataset | data-manager.js, data-generator.js |
| **`driver_session_${driverId}`** | Driver session blob | WORLDCLASS_DRIVER_WEBSOCKET_ENHANCEMENT.js |
| **`login_attempts`** | Login attempt count | WORLDCLASS_DRIVER_WEBSOCKET_ENHANCEMENT.js |
| **`login_errors`** | Login error history (last 50) | WORLDCLASS_DRIVER_WEBSOCKET_ENHANCEMENT.js |
| **`performance_reports`** | Performance reports (last 50) | WORLDCLASS_DRIVER_WEBSOCKET_ENHANCEMENT.js |
| **`aiRouteStatus_${driverId}`** | AI route status per driver | enhanced-ai-route-manager.js, ai-route-testing.js |
| **`aiRouteHistory_${driverId}`** | AI route history per driver | enhanced-ai-route-manager.js |
| **`manualDriverId`** | Manual driver selection | enhanced-ai-route-manager.js |
| **`sensor_update`** | Ephemeral sensor update state | sensor-integration-enhanced.js |
| **Driver nav last-seen** (key from getDriverNavLastSeenKey) | Last seen per driver/page | driver-system-v3.js |
| **`${type}_partition_${index}`** | Partitioned storage (enterprise) | enterprise-scalability.js |
| **Custom message storage** (this.messageStorage) | Alternate message store | messaging-system-fix.js |
| **Arbitrary keys** (read/remove for cleanup) | Production optimizer cleanup | production-optimizer.js |
| **`waste_mgmt_*`** (read only for migration) | One-time migration from localStorage | CRITICAL_FIXES_IMPLEMENTATION.js |

---

## By file

| File | Keys / usage |
|------|----------------|
| **data-manager.js** | `generated_bins`, `generated_drivers`; `waste_mgmt_*` (getData/setData); `driverRoutes_${driverId}`; `driverCollections_${driverId}`; clearAllData (removeItem waste_mgmt_*) |
| **auth.js** | `waste_mgmt_session` (setItem, getItem, removeItem) |
| **app.js** | `currentDriver` (setItem) |
| **sync-manager.js** | `deletedBins` (getItem) |
| **enhanced-messaging-system.js** | `driverMessages`, `unreadMessageCounts` (getItem, setItem) |
| **messaging-system.js** | `driverMessages`, `systemMessages`, `lastMessageCheck` (getItem, setItem) |
| **messaging-fix.js** | `currentDriver`, `driverMessages` (getItem, setItem) |
| **messaging-system-fix.js** | Custom messageStorage key, `currentDriver` (getItem, setItem) |
| **websocket-fix.js** | Generic getItem(key); `currentUser`, `currentDriver`, `loggedInUser` (getItem) |
| **websocket-manager.js** | `currentDriver` (getItem) |
| **websocket-fallback.js** | `currentDriver` (setItem, getItem) |
| **driver-history-button-fix.js** | `currentDriver` (getItem) |
| **driver-system-v3.js** | Last-seen key (setItem, getItem); `driverMessages` (getItem) |
| **realtime-update-broadcaster.js** | `lastBinUpdate`, `deletedBins`, `lastBinDeleted` (getItem, setItem) |
| **sensor-management.html** | `deletedBins`, `lastBinDeleted` (getItem, setItem) |
| **deleted-bins-filter.js** | `deletedBins` (getItem); hooks localStorage.setItem |
| **bin-deletion-listener.js** | Hooks localStorage.setItem (no direct key) |
| **sensor-integration-enhanced.js** | `sensor_update` (setItem, removeItem) |
| **WORLDCLASS_DRIVER_WEBSOCKET_ENHANCEMENT.js** | `driver_session_*`, `login_attempts`, `login_errors`, `performance_reports` (getItem, setItem, removeItem) |
| **enhanced-ai-route-manager.js** | `currentDriver`, `currentUser`, `aiRouteStatus_*`, `aiRouteHistory_*`, `manualDriverId` (getItem, setItem) |
| **ai-route-testing.js** | `aiRouteStatus_*` (removeItem) |
| **enhanced-driver-interface-v2.js** | `currentDriver` (getItem, setItem) |
| **report-ui-integration.js** | `currentUser` (getItem) |
| **data-generator.js** | `generated_bins`, `generated_drivers`, `generated_routes`, `generated_users`, `dataset_metadata` (setItem, getItem) |
| **enterprise-scalability.js** | `${type}_partition_${index}` (getItem, setItem) |
| **CRITICAL_FIXES_IMPLEMENTATION.js** | `waste_mgmt_*` (getItem, migration only) |
| **production-optimizer.js** | Arbitrary keys (getItem, removeItem) |
| **driver-route-fix.js** | `driverRoutes_*`, `driverCollections_*` (getItem, setItem) |
| **direct-fix.js** | `driverRoutes_*` (getItem, setItem) |
| **inline-fix.html** | `driverRoutes_*` (getItem, setItem) |

---

## One-line summary

- **Core app data:** `data-manager.js` → **localStorage** (`waste_mgmt_*`), synced to server when online.
- **Session:** **localStorage** only (`auth.js`, driver session in WORLDCLASS_DRIVER_WEBSOCKET_ENHANCEMENT.js).
- **Messages:** **localStorage** cache + **server/MongoDB** (driverMessages).
- **Deleted bins, driver routes/collections cache, generated data, driver/AI state, login/performance:** **localStorage** only.
- **Current user/driver, unread counts, sensor_update, last-seen, partitions, optimizer:** **localStorage** only (various files).

All of the above are still using localStorage in the places listed; only driver message *content* is also stored in MongoDB.
