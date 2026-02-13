# How We Ensure the Driver Has Collected the Bins

The app verifies that a driver was physically near a bin before allowing a collection to be registered.

---

## 1. Manual "Register collection" (driver taps a bin)

| Check | What happens |
|-------|----------------|
| **GPS required** | The driver must have location enabled. If GPS is off, we show: *"Enable GPS so we can verify you are at the bin before registering collection"* and do **not** record the collection. |
| **Proximity** | We compute distance from the driver’s current position to the bin. If the driver is **more than 100 m** away, we reject with: *"You must be within 100 m of the bin… You are X m away."* |
| **Bin list** | When GPS is available, the "Register collection" modal shows **only bins within 100 m**. Bins farther away are not listed, so the driver can only choose bins we can verify. |

**Config:** In `ENHANCED_DRIVER_SYSTEM_COMPLETE.js`, `maxDistanceForManualCollectionMeters = 100`. Change this to allow a larger or smaller radius.

**Stored with each collection:** When verification passes, we save `verifiedByProximity: true`, `driverLat`, `driverLng`, and `distanceMeters` with the collection record.

---

## 2. Auto-collection (no tap required)

When the driver has **started a route** and **proximity monitoring** is on:

- We check every **3 seconds** if the driver is within **15 m** of any bin.
- If the driver is that close **and** the bin’s fill level goes from **> 0 to 0** (e.g. from a sensor), we automatically register the collection.
- So auto-collection is only allowed when the driver is very close and the bin is observed as emptied.

---

## 3. Server-side check (optional double-check)

When the client sends a collection to `POST /api/collections` **with** `driverLat` and `driverLng`:

- The server loads the bin by `binId` and computes distance (Haversine) from `(driverLat, driverLng)` to the bin.
- If the distance is **> 150 m**, the server responds **400** and does **not** save the collection: *"Collection rejected: driver too far from bin."*
- So even if a client were modified, the server can reject collections that are too far (150 m limit).

---

## Summary

| Method | How we ensure the driver collected |
|--------|------------------------------------|
| **Manual** | GPS required; only bins within 100 m are selectable; on submit we check distance again and reject if > 100 m; server can reject if > 150 m when location is sent. |
| **Auto** | Driver must be within 15 m and bin fill must drop to 0 (e.g. sensor). |

Together, this ensures collections are only registered when the driver was at or very near the bin (and, for auto, when the bin is actually emptied).

---

## 4. Automatic % collected (how much the driver actually emptied)

We record **how much** of the bin the driver collected (full empty vs partial) using sensor fill before and after.

| Field | Meaning |
|-------|--------|
| **fillBefore** | Bin fill % at the moment of collection (from sensor or stored value). |
| **fillAfter** | Bin fill % after the collection, when the sensor next reports (e.g. 0 = fully emptied, 20 = 20% left). |
| **collectedPercent** | **fillBefore − fillAfter** = percentage of the bin content that was collected. |

**Flow:**

1. When a collection is registered, we store **fillBefore** = current bin fill (e.g. 80%).
2. We set the bin’s fill to 0 locally (or the sensor will update it later).
3. Whenever the bin’s fill is updated (e.g. by the sensor), we find the **most recent collection** for that bin in the last **2 hours** and set:
   - **fillAfter** = new fill from the sensor (e.g. 0 or 20),
   - **collectedPercent** = fillBefore − fillAfter (e.g. 80 − 20 = **60%** collected).
4. So:
   - **Full empty:** fillBefore 80%, fillAfter 0% → collectedPercent **80%** (driver took everything that was there).
   - **Partial:** fillBefore 80%, fillAfter 20% → collectedPercent **60%** (driver took 60% of the content).

**Where it runs:** In `data-manager.js`, `updateBin()` calls `updateCollectionWithSensorFill(binId, newFill)` whenever the bin’s fill (or fillLevel) changes. So any source that updates the bin (Findy sensor, manual edit, sync) will update the latest collection’s **fillAfter** and **collectedPercent**.

**If there is no sensor:** Right after the collection we set the bin to 0, so the first “update” is fill 0. That sets fillAfter = 0 and collectedPercent = fillBefore (100% of what was in the bin). If the sensor never sends a new value, that remains. If the sensor later sends e.g. 20%, we update to fillAfter = 20 and collectedPercent = fillBefore − 20.

---

## 5. Sensor verification (no fake "31% → 0%" when driver didn’t empty)

For bins **with a sensor** (sensorIMEI, hasSensor, or linked sensor):

- When a driver clicks **"Mark as collected"**, we **do not** set the bin fill to 0%.
- We record the collection with **fillBefore** = current fill (e.g. 31%), **fillAfter** = null, **collectionVerification** = `pending_sensor`.
- The bin **stays at 31%** until the sensor reports a new value.
- When the sensor updates:
  - If the sensor reports **≤ 15%** (e.g. 0%): **verifiedBySensor** = true, **collectionVerification** = `sensor_verified`. Bin fill is updated from the sensor.
  - If the sensor still reports **> 15%** (e.g. 31%): **sensorRejectedClaim** = true, **collectionVerification** = `sensor_rejected`. History shows **"Sensor did not confirm"**.

So we never show "31% → 0%" for a sensor bin until the sensor confirms. If the driver only clicked and didn’t empty the bin, the history shows **"31% → Pending sensor"** then **"Sensor did not confirm"**.

**Bins without a sensor:** We set the bin to 0% when the driver marks collection; history shows "No sensor" (driver-reported only).
