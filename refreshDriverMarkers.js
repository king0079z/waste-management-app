// Manual driver marker refresh function
// Run this in console if markers don't update automatically

window.forceRefreshDriverMarkersNow = function() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 MANUAL DRIVER MARKER REFRESH');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    if (!window.mapManager) {
        console.error('❌ MapManager not found');
        return;
    }
    
    if (!window.mapManager.map) {
        console.error('❌ Map not initialized');
        return;
    }
    
    console.log('🧹 Clearing all existing driver markers...');
    
    // Clear all driver markers
    if (window.mapManager.markers && window.mapManager.markers.drivers) {
        Object.keys(window.mapManager.markers.drivers).forEach(driverId => {
            const marker = window.mapManager.markers.drivers[driverId];
            if (marker && window.mapManager.layers && window.mapManager.layers.drivers) {
                window.mapManager.layers.drivers.removeLayer(marker);
            }
        });
        window.mapManager.markers.drivers = {};
        console.log('✅ All old markers cleared');
    }
    
    console.log('🎨 Re-creating markers with world-class UI...');
    
    // Re-initialize with new design
    window.mapManager.initializeAllDrivers();
    
    console.log('✅ Driver markers refreshed with world-class UI!');
    console.log('');
    console.log('You should now see:');
    console.log('  ✅ 3D glossy markers');
    console.log('  ✅ Premium dark tooltips');
    console.log('  ✅ Exact GPS coordinates');
    console.log('  ✅ NO "Checking..." text');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
};

console.log('🔧 Manual refresh function loaded');
console.log('💡 To manually refresh driver markers, run: forceRefreshDriverMarkersNow()');
