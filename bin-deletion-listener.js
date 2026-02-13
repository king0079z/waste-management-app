/**
 * Bin Deletion Listener
 * Listens for bin deletion events and updates the map accordingly
 */

console.log('🗑️ Bin Deletion Listener Loading...');

// Listen for bin deletion events
window.addEventListener('binDeleted', function(event) {
    const { binId } = event.detail;
    console.log(`🗑️ Bin ${binId} was deleted - removing from map...`);
    
    // Option 1: Reload the page to refresh everything
    setTimeout(() => {
        console.log('🔄 Reloading page to update map...');
        location.reload();
    }, 1000);
});

// Listen for localStorage changes (cross-tab communication)
window.addEventListener('storage', function(event) {
    if (event.key === 'lastBinDeleted') {
        const data = JSON.parse(event.newValue);
        console.log(`🗑️ Bin ${data.binId} was deleted in another tab - reloading...`);
        setTimeout(() => {
            location.reload();
        }, 500);
    }
});

// Also listen for localStorage changes within the same tab
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    const event = new Event('localStorageChanged');
    event.key = key;
    event.newValue = value;
    window.dispatchEvent(event);
    originalSetItem.apply(this, arguments);
};

window.addEventListener('localStorageChanged', function(event) {
    if (event.key === 'bins') {
        console.log('🔄 Bins data changed in localStorage - refreshing map in 2 seconds...');
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
});

console.log('✅ Bin Deletion Listener Active');
