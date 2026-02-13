# MongoDB Implementation and Connection Test

## Summary of changes (application using MongoDB)

1. **database-manager.js**
   - **getConnectionStatus()** – Returns `{ ok, dbType, database, error? }`; pings MongoDB when `dbType === 'mongodb'`.
   - **getDeletedBins()** – Returns list of deleted bin IDs (from MongoDB collection `deletedBins` when using MongoDB).
   - **setDeletedBins(ids)** – Replaces the deleted bin list and persists to MongoDB.
   - **addDeletedBins(toAdd)** – Appends one or more IDs to the deleted list.
   - **deletedBins** – Loaded in `loadMongoData()` and included in `getAllMongoData()` so sync responses include it.
   - **defaultData** – Includes `deletedBins: []` for JSON mode.
   - **createMongoIndexes()** – Adds index on `driverMessages.driverId`.

2. **server.js**
   - **GET /api/health/mongodb** – Calls `dbManager.getConnectionStatus()` for health checks.
   - **GET /api/bins/deleted** – Returns `{ success, ids, timestamp }` from MongoDB (or JSON store).
   - **POST /api/bins/deleted** – Body `{ ids: [] }` replaces list; body `{ add: 'BIN-x' }` or `{ add: ['BIN-x'] }` appends. Persists to MongoDB when configured.
   - **GET /api/data/sync** – Response now includes `deletedBins` when returned by `getAllData()`.

3. **sync-manager.js (client)**
   - When applying server `bins`, uses **server’s `deletedBins`** when present (`result.data.deletedBins`) and writes it to `localStorage` so the client stays in sync with MongoDB.

4. **realtime-update-broadcaster.js (client)**
   - On bin deletion, still updates `localStorage` and also **POSTs to `/api/bins/deleted`** with `{ add: binId }` so the server (MongoDB) stores the deleted bin ID.

5. **Test script**
   - **scripts/test-mongodb-connection.js** – Calls health, data sync, deleted bins GET/POST, driver routes, driver messages.

---

## How to run the connection test

1. **Start the server** (so API endpoints are up):
   ```bash
   node server.js
   ```
   Use the same port as in step 2 (default 3000).

2. **Run the test script**:
   ```bash
   node scripts/test-mongodb-connection.js
   ```
   Optional: set base URL if the server is not on localhost:3000:
   ```bash
   BASE_URL=http://localhost:4000 node scripts/test-mongodb-connection.js
   ```

3. **Expected output (all OK)**:
   - `OK  GET /api/health/mongodb -> mongodb <databaseName>`
   - `OK  GET /api/data/sync -> keys: users, bins, ... deletedBins ...`
   - `OK  GET /api/bins/deleted -> ids: n`
   - `OK  POST /api/bins/deleted (add) -> 200`
   - `OK  GET /api/driver/:id/routes -> routes: n`
   - `OK  GET /api/driver/:id/messages -> messages: n`
   - `Result: 6 checks passed, 0 issues`

4. **If the server is not running**, the script will report connection errors; start the server and run again.

5. **Using MongoDB**: Set `DATABASE_TYPE=mongodb` and `MONGODB_URI` (or `DATABASE_URL`) so the server uses MongoDB. Then:
   - `GET /api/health/mongodb` returns `dbType: 'mongodb'` and `ok: true` when the DB is reachable.
   - `deletedBins` and all other data are read/written from MongoDB.

---

## Collections used when `DATABASE_TYPE=mongodb`

| Collection        | Purpose                                      |
|-------------------|----------------------------------------------|
| users             | Users (admin, manager, driver)               |
| bins              | Bins                                         |
| routes            | Routes                                       |
| collections       | Collection records                           |
| complaints        | Complaints                                   |
| alerts            | Alerts                                       |
| sensors           | Sensors                                      |
| systemLogs        | System logs                                  |
| pendingRegistrations | Pending registrations                     |
| driverLocations   | Key-value: driverId -> location              |
| analytics         | Key-value: analytics data                    |
| driverMessages    | One doc per driverId with `messages` array   |
| deletedBins       | Single doc `{ id: 'list', ids: [] }`        |

All of these are used by the server; the test script verifies the main API routes that read/write them.
