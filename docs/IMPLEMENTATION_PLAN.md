# Waste Management System Overhaul – Implementation Plan

## Goal

Transform the codebase into a **scalable, world-class Waste Management System** capable of handling **1M bins** and **10k staff**, by:

- Cleaning up structure (docs/, scripts/, legacy/)
- Enforcing MongoDB as source of truth (no full-sync of bin array)
- Optimizing the map (bbox-based loading, optional clustering)
- Hardening the backend for high concurrency

---

## 1. Codebase Cleanup

### Current state

- **docs/** – Already holds 237+ `.md` and `.txt` documentation/fix files.
- **legacy/** – Already holds old fix/utility scripts (e.g. `FIX_*.js`, `CRITICAL_*.js`).
- **scripts/** – Holds `test-mongodb-connection.js` and `seed-bins.js`.

### Recommended (user review)

- Keep all **.md / .txt** in **docs/** (no change if already there).
- Move any remaining root **.bat** files into **scripts/** (e.g. `add-sensor.bat`, `install-deps.bat`, `start-app.bat`).
- Keep **core app** in root: `server.js`, `database-manager.js`, `findy-api-service.js`, `public/`, `api/`.

---

## 2. Architecture Upgrades Implemented

### 2.1 Database (MongoDB) – `database-manager.js`

- **getBins(opts)**  
  - `opts.bbox`: `[minLng, minLat, maxLng, maxLat]` for map viewport.  
  - `opts.limit`, `opts.offset`: Pagination (default limit 5000, max 10000).  
  - Returns `{ bins, total }`.  
  - Uses compound `(lat, lng)` index for bbox range queries.  
  - Excludes `deletedBins` list.

- **updateBin(id, updates)**  
  - Updates a single bin by `id`.  
  - No full-sync; safe for high write concurrency.

- **Removed** reliance on loading the entire bin array for map/read paths when using the new API (see below).  
- **getAllData / setData** remain for legacy sync and non-bin flows (e.g. users, routes); bin-specific reads/writes should prefer **getBins** and **updateBin**.

### 2.2 Server API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/bins?bbox=minLng,minLat,maxLng,maxLat&limit=&offset=` | Bbox-based bin list (for map; scalable). |
| PATCH | `/api/bins/:id` | Single bin update (no full-sync). |
| POST | `/api/bins/bulk` | Bulk insert for seeding (body: `{ bins: [...] }`, max 15k). |
| POST | `/api/drivers/batch` | Batch driver location updates (body: `{ updates: [{ driverId, lat, lng, ... }] }`, max 500). |

- **GET /api/bins** – Uses `dbManager.getBins({ bbox, limit, offset })`.  
- **PATCH /api/bins/:id** – Uses `dbManager.updateBin(id, updates)`; broadcasts `bin_updated` on WebSocket.  
- **POST /api/drivers/batch** – Throttles per driver (1 update/sec); uses existing `updateDriverLocation`.

### 2.3 Client – `data-manager.js`

- **getBinsInView(bbox, opts)**  
  - Calls `GET /api/bins?bbox=...&limit=&offset=`.  
  - Returns `Promise<{ bins, total }>`.  
  - On failure, falls back to local `getBins()` (optionally filtered by bbox).  
  - Normalizes bins with `normalizeBin()`.

- **updateBinViaAPI(binId, updates)**  
  - Calls `PATCH /api/bins/:id`.  
  - On success, updates local cache and dispatches `bin:updated`.  
  - On failure, updates locally only.

- **getBins()** – Unchanged; still returns full local list (LocalStorage / sync). Use **getBinsInView** when targeting map scalability.

### 2.4 Map – `map-manager.js`

- **useBboxForBins**  
  - When `window.__WASTE_USE_BBOX_BINS__ === true`, the map loads bins via **getBinsInView(current bounds)** instead of **getBins()**.  
  - On **moveend**, bins are refetched (debounced 400 ms).  
  - **Enable:** In browser console before opening map:  
    `window.__WASTE_USE_BBOX_BINS__ = true`

- ** _addBinsToMap(bins, binsWithOpenPopups)**  
  - Shared helper for adding bins to the map (used for both full list and bbox result).

### 2.5 Real-time (WebSockets)

- Driver location: Already throttled (e.g. 1 update per second per driver) on the server.  
- **POST /api/drivers/batch** allows up to 500 updates per request for 10k staff scenarios.  
- Broadcasts: `bin_updated`, `driver_locations_batch` as implemented.

---

## 3. UI/UX and Verification (Planned)

- **CSS variables/tokens** – Standardize in `public/css` (to be applied incrementally).  
- **Responsive / mobile** – Ensure driver and manager UIs work on small screens.  
- **Loading states / error boundaries** – Add where new async API calls are used (e.g. bbox load, PATCH bin).

### Verification

1. **Automated**  
   - `node scripts/test-mongodb-connection.js` – API and MongoDB health.  
   - `node scripts/seed-bins.js 10000` – Seeds 10k bins; then test map and GET `/api/bins?bbox=...`.

2. **Manual**  
   - Set `window.__WASTE_USE_BBOX_BINS__ = true`, open map, pan/zoom – bins should load by viewport.  
   - Multiple clients: driver locations and bin updates should reflect without full-sync storms.  
   - Visual check: high density of markers (optional: add Leaflet.markercluster later).

---

## 4. Summary of Files Touched

| File | Changes |
|------|--------|
| `database-manager.js` | `getBins({ bbox, limit, offset })`, `updateBin(id, updates)`; bin index kept as compound (lat, lng). |
| `server.js` | GET `/api/bins`, PATCH `/api/bins/:id`, POST `/api/bins/bulk`, POST `/api/drivers/batch`. |
| `public/js/data-manager.js` | `getBinsInView(bbox, opts)`, `updateBinViaAPI(binId, updates)`. |
| `public/js/map-manager.js` | `useBboxForBins`, bbox-based load path, `_addBinsToMap`, moveend debounce. |
| `scripts/seed-bins.js` | New: seed N bins via POST `/api/bins/bulk`. |
| `docs/IMPLEMENTATION_PLAN.md` | This document. |

---

## 5. Enabling Bbox-Based Map (1M Bins)

1. Ensure backend uses MongoDB (`DATABASE_TYPE=mongodb`, `MONGODB_URI` set).  
2. In browser console (before or after load):  
   `window.__WASTE_USE_BBOX_BINS__ = true`  
3. Open the main map – it will request bins only for the current viewport via GET `/api/bins?bbox=...`.  
4. Pan/zoom – bins refetch on moveend (debounced).

For **Leaflet.markercluster**, add the plugin and cluster the bin layer when `useBboxForBins` is true (optional next step).

---

## 6. Optional: Moving Root .bat to scripts/

To keep root minimal:

- Move `add-sensor.bat`, `install-deps.bat`, `kill-port.bat`, `migrate-and-start.bat`, `restart-server.bat`, `start-app.bat`, `start-application-simple.bat`, `start-application.bat` into **scripts/**.
- Update any docs or shortcuts that reference these paths.
- This is **non-destructive** (copy or move; adjust references).

This completes the current implementation plan. Further steps (unit tests for `data-manager` and API, load tests, Leaflet.markercluster) can be added as needed.
