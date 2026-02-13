# How Auto-Collection Works in This Application

This app has **two** auto-collection mechanisms. Both run only when a **driver** is logged in.

---

## 1. Driver-at-Bin Auto-Collection (`driver-at-bin-collection-reminder.js`)

**What it does:** If the driver’s GPS shows they have been **at a bin** for several checks but they did **not** tap “Mark as collected”, the app can **automatically** record the collection for them.

**How it works:**

| Setting | Value | Meaning |
|--------|--------|--------|
| **Check interval** | 20 seconds | `checkDriverAtBin()` runs every 20 s |
| **Position history size** | 3 | Needs the **last 3** driver positions |
| **Near distance** | 0.05 km (50 m) | Driver is “at bin” if within 50 m |
| **Cooldown** | 2 hours per bin | Same bin is not auto-recorded again for 2 hours |

**Flow:**

1. Every 20 s the script reads the current driver location from `dataManager.getDriverLocation(driverId)`.
2. It appends `{ lat, lng, ts }` to a **position history** (max 3 entries).
3. When history has **3** entries, it loops over all bins:
   - Skips bins without coordinates.
   - Skips if this driver already collected this bin in the last 24 h (from `getCollections()`).
   - Skips if this bin was **auto-recorded** in the last 2 h (cooldown in `localStorage`: `driverAtBin_<binId>`).
4. For each bin it checks: are **all 3** positions within **50 m** of the bin?
5. If **yes** for one bin:
   - Calls `markBinCollected(bin.id, { isAutoCollection: true })`.
   - Clears position history.
   - Stores cooldown for that bin (2 h).
   - Shows alert: “Collection auto-recorded …”.

**Dependencies:**

- Driver must be logged in (`authManager.getCurrentUser()` type `'driver'`).
- Driver location must be updated (e.g. by map/GPS or test helper) so `getDriverLocation(driverId)` returns recent `lat`/`lng`.
- `window.markBinCollected` and `dataManager` must be available.

---

## 2. Proximity-Based Auto-Collection (`ENHANCED_DRIVER_SYSTEM_COMPLETE.js`)

**When it runs:** Only when the **Enhanced Driver System** is used and the driver has **started a route** (`autoCollectionEnabled = true`).

**What it does:** Every **3 seconds** it checks distance to all bins. If the driver is within **15 m** of a bin and the **bin’s fill goes from &gt; 0 to 0** (bin emptied while driver is nearby), it treats that as an automatic collection.

**Flow:**

1. When the driver starts a route, proximity monitoring starts (every 3 s).
2. For each bin, distance from current driver position to bin is computed.
3. If distance ≤ 15 m:
   - Bin is added to `nearbyBins` (with `previousFill`).
   - `checkAutoCollectionTrigger(bin)` runs: if `previousFill > 0` and current `bin.fill === 0`, it calls `performAutoCollection(bin)`.
4. `performAutoCollection` creates a collection, updates the bin (fill 0, etc.), and can notify other drivers if the bin was assigned to them.

So this path triggers when **fill level** is observed to drop to 0 while the driver is near the bin (e.g. sensor or manual update), not only from position.

---

## 3. Manual “Mark as collected” and Test Helper

- **Manual:** User taps “Mark as collected” (or “Collected”) on a bin → `markBinCollected(binId)` is called **without** `isAutoCollection`. Same recording path, but not tagged as auto.
- **Test helper (`auto-collection-test-helper.js`):**
  - **Open panel:** `Ctrl+Shift+A` or add `?testAutoCollection=1` to the URL and use the “Test auto-collection” button.
  - **“Simulate I’m here”** on a bin: sets driver location to that bin’s coordinates, then after **500 ms** calls `markBinCollected(bin.id)` **directly**. So it does **not** go through the “3 consecutive position checks” of the Driver-at-Bin logic; it’s a shortcut to record a collection as if the driver were at the bin.
  - **“Clear cooldown”** clears `localStorage` keys `driverAtBin_*` so you can auto-record the same bin again within 2 h in Driver-at-Bin tests.

---

## 4. What Gets Recorded When a Collection Happens

- **`dataManager.addCollection(collection)`** with:
  - `binId`, `driverId`, `driverName`, `originalFill`, `timestamp`, `routeId`/`routeName` (if on route), etc.
  - **`autoCollection: true`** only when the collection was triggered by one of the **auto** mechanisms (Driver-at-Bin passes `isAutoCollection: true`; Enhanced system creates its own collection with `collectionType: 'auto-proximity'`).
- Bin is updated (e.g. fill → 0, `lastCollection`, `collectedBy`).
- Driver history and bin history are updated; `collectionRecorded` event is fired.

So: **how auto-collection works** is “driver at bin for 3 checks (Driver-at-Bin)” or “driver within 15 m when bin fill goes to 0 (Enhanced system)”.

---

## 5. How to Test Auto-Collection

**Prerequisites:** Log in as a **driver** (e.g. driver1 / driver123). Ensure bins exist with coordinates (e.g. demo bins).

### Option A: Test panel (quick simulated collection)

1. Open the test panel: press **Ctrl+Shift+A**, or add **`?testAutoCollection=1`** to the URL and click “Test auto-collection”.
2. Click **“Simulate I’m here”** on a bin: driver location is set to that bin, then after 500 ms `markBinCollected(bin.id)` is called directly. You should see the bin’s fill go to 0% and a “Collection recorded” message.
3. To test the **real Driver-at-Bin auto path** (3 position checks):
   - Click **“Clear cooldown (re-test same bin)”** so the same bin can be auto-recorded again.
   - Click **“Test real auto (3 checks)”** on a bin. The helper sets your position at the bin and runs `driverAtBinReminder.check()` 3 times. If cooldown allows, you should see “Collection auto-recorded” and the collection will have `autoCollection: true`.

### Option B: Browser console

1. Log in as a driver.
2. Open DevTools → Console.
3. **Simulated collection (direct):**
   ```js
   var bin = dataManager.getBins()[0];
   if (bin && window.markBinCollected) window.markBinCollected(bin.id);
   ```
4. **Real Driver-at-Bin auto path (3 checks):**
   ```js
   var user = authManager.getCurrentUser();
   var bin = dataManager.getBins().find(b => b.lat != null && b.lng != null);
   if (user && user.type === 'driver' && bin && window.autoCollectionTestHelper && window.autoCollectionTestHelper.testRealAutoCollection) {
     window.autoCollectionTestHelper.testRealAutoCollection(bin.id);
   }
   ```
   (Clear cooldown first via the test panel or `localStorage` keys `driverAtBin_*` if you re-test the same bin within 2 hours.)
