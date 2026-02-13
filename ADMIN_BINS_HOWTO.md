# Add and delete bins (admin portal)

## Add a new bin

1. Open the **main app** (map view) and log in as **admin** or **manager**.
2. Click the **+** floating action button (FAB) in the bottom-right.
3. Choose **“Add New Bin”**.
4. Fill in the form:
   - **Bin ID** (required, unique)
   - **Location** (required)
   - **Latitude** and **Longitude**
   - **Initial fill level (%)**, **Status** (active / maintenance / offline)
5. Click **Add Bin**.
6. The bin is saved locally and synced to the server (if sync is enabled). The map refreshes and shows the new bin.

## Delete a bin (admin only)

1. Open the **main app** (map view) as **admin** (the Delete bin button is only shown for admin accounts).
2. On the map, click a **bin marker** to open its popup.
3. In the popup, click **“Delete bin”** (gray button at the bottom).
4. Confirm in the dialog. The bin is removed from the map and marked as deleted on the server (via `deletedBins` and sync). The action is **recorded in the system log** (e.g. “Bin BIN-001 removed by admin: John”).

**Alternative:** You can also delete bins from **Sensor Management** (`sensor-management.html`): open it from Admin → Manage, then use the Delete action for the bin there.

## Notes

- **Add** is synced to the server when `syncManager.syncEnabled` is true (e.g. when connected to your backend).
- **Delete** is shown only for **admin** accounts; managers and drivers do not see the Delete bin button. Deletions are recorded in the **system log** with the admin’s name. The realtime broadcaster adds the bin ID to `deletedBins` and POSTs to `/api/bins/deleted` so the server and other clients stay in sync.
