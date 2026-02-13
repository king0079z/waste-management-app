/**
 * Deleted Bins Filter
 * Prevents deleted bins from coming back after server sync
 */

console.log('🛡️ Deleted Bins Filter Loading...');

// Filter function to remove deleted bins
function filterDeletedBins() {
    try {
        // Get list of deleted bins
        const deletedBins = JSON.parse(localStorage.getItem('deletedBins') || '[]');
        
        if (deletedBins.length === 0) {
            return; // Nothing to filter
        }
        
        console.log(`🛡️ Filtering ${deletedBins.length} deleted bins:`, deletedBins);
        
        // Get current bins
        if (typeof dataManager === 'undefined') {
            console.warn('  ⚠️ dataManager not available yet');
            return;
        }
        
        let bins = dataManager.getBins();
        const beforeCount = bins.length;
        
        // Filter out deleted bins
        bins = bins.filter(bin => !deletedBins.includes(bin.id));
        
        const afterCount = bins.length;
        const filtered = beforeCount - afterCount;
        
        if (filtered > 0) {
            console.log(`  🗑️ Filtered out ${filtered} deleted bin(s)`);
            console.log(`  📊 Before: ${beforeCount} bins → After: ${afterCount} bins`);
            
            // Save back to dataManager
            dataManager.setData('bins', bins);
            
            // Trigger UI update event
            window.dispatchEvent(new CustomEvent('binsFiltered', { 
                detail: { 
                    filteredCount: filtered,
                    remainingCount: afterCount,
                    deletedBins: deletedBins 
                } 
            }));
        }
        
    } catch (error) {
        console.error('❌ Error filtering deleted bins:', error);
    }
}

// Run filter immediately on load
setTimeout(() => {
    console.log('🛡️ Running initial deleted bins filter...');
    filterDeletedBins();
}, 500);

// Run filter after every sync from server
if (typeof window !== 'undefined') {
    // Listen for data changes
    window.addEventListener('dataLoaded', function() {
        console.log('🛡️ Data loaded - filtering deleted bins...');
        filterDeletedBins();
    });
    
    // Listen for sync completion
    window.addEventListener('syncCompleted', function() {
        console.log('🛡️ Sync completed - filtering deleted bins...');
        setTimeout(filterDeletedBins, 100);
    });
    
    // Intercept localStorage changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        const result = originalSetItem.apply(this, arguments);
        
        // If bins data changed, filter it
        if (key === 'bins') {
            console.log('🛡️ Bins data changed - filtering deleted bins...');
            setTimeout(filterDeletedBins, 100);
        }
        
        return result;
    };
}

// Expose filter function globally
window.filterDeletedBins = filterDeletedBins;

// Run filter periodically (every 5 seconds) as a safety net
setInterval(() => {
    filterDeletedBins();
}, 5000);

console.log('✅ Deleted Bins Filter Active');
console.log('💡 Deleted bins will be automatically filtered every 5 seconds');
console.log('💡 Run manually: filterDeletedBins()');
