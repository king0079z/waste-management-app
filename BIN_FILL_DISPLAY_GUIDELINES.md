# Bin Fill % Display – Guidelines for Future Code

To prevent the "wrong fill % then correct %" glitch for **any existing bin, new bin, or new sensor**, follow these rules.

## Single source of truth

- **Map marker and popup:** Use `mapManager.getBinFillForDisplay(bin)` or `mapManager.createBinMarkerIcon(bin)` (which uses the same logic). Do not read `bin.fill` or `bin.fillLevel` directly for display when the bin may have sensor data.
- **Other UI (lists, reports):** Prefer `mapManager.getBinFillForDisplay(bin)` if the map manager is available; otherwise use the same logic: if `bin.sensorData.distanceCm` exists, compute fill from distance and calibration; else use `bin.fillLevel ?? bin.fill ?? 0`.

## When bin data changes

- **Always update via `dataManager.updateBin(binId, updates)`.** The data manager dispatches a `bin:updated` event so the map marker icon (fill % circle) stays in sync. No need to call `mapManager.updateBinMarkerIcon(binId)` yourself when you use `updateBin`.
- **Adding a new bin:** Use `dataManager.addBin(bin)`. The existing logic triggers a map refresh; sensor bins get their fill from the sensor before first paint.
- **Linking a new sensor to a bin:** Use Findy’s `linkBinToSensor(binId, imei)`. The existing logic refreshes the map and fetches sensor data before drawing the marker.

## Summary

| Action | Use | Map stays correct? |
|--------|-----|--------------------|
| Show fill % on map/popup | `getBinFillForDisplay(bin)` / `createBinMarkerIcon(bin)` | Yes |
| Update bin (sync, admin, sensor) | `dataManager.updateBin(binId, updates)` | Yes (event → icon update) |
| Add new bin | `dataManager.addBin(bin)` | Yes (refresh → sensor bins refreshed before add) |
| Link sensor to bin | Findy `linkBinToSensor(binId, imei)` | Yes (refresh → sensor data before add) |
| Add single bin to map | `mapManager.addBinMarker(bin)` | Yes (sensor bins get refresh + icon update) |

These patterns ensure correct fill % for all existing bins, new bins, and new sensors.
