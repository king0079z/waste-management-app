// admin-button-click-handler.js - Direct Click Event Handler
// This ensures buttons work by adding event listeners directly

console.log('🎯 Admin Button Click Handler loading...');

// Define functions IMMEDIATELY in global scope
window.ADMIN_FUNCTIONS_READY = false;

// Function 1: Unlink Sensor
window.adminUnlinkSensor = async function(imei, binId) {
    console.log(`🔓 CLICKED UNLINK: ${imei} from ${binId}`);
    
    // Get bin details
    let binDetails = binId;
    if (typeof dataManager !== 'undefined' && dataManager.bins) {
        const bin = dataManager.bins.find(b => b.id === binId);
        if (bin && bin.location && bin.location.address) {
            binDetails = `${binId}\n📍 ${bin.location.address}`;
        }
    }
    
    // Confirm
    const confirmed = confirm(
        `🔓 UNLINK SENSOR FROM BIN\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Sensor: ${imei}\n` +
        `Bin: ${binDetails}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ This will stop receiving sensor data\n\n` +
        `Continue?`
    );
    
    if (!confirmed) {
        console.log('❌ User cancelled unlink');
        return;
    }
    
    try {
        console.log('🔄 Unlinking sensor...');
        
        // Update sensor
        const response = await fetch('/api/sensors/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imei: imei,
                binId: null,
                unlinkedAt: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        console.log('✅ Sensor unlinked from database');
        
        // Update bin
        if (typeof dataManager !== 'undefined' && dataManager.bins) {
            const bin = dataManager.bins.find(b => b.id === binId);
            if (bin) {
                bin.sensorId = null;
                if (typeof dataManager.saveBin === 'function') {
                    await dataManager.saveBin(bin);
                    console.log('✅ Bin updated');
                }
            }
        }
        
        // Show success
        if (typeof realtimeStatusNotifier !== 'undefined' && realtimeStatusNotifier.showToast) {
            realtimeStatusNotifier.showToast(`✅ Sensor ${imei.slice(-4)} unlinked from ${binId}`, 'success');
        } else {
            alert(`✅ Sensor ${imei.slice(-4)} unlinked successfully!`);
        }
        
        // Refresh table
        console.log('🔄 Refreshing table...');
        if (typeof window.updateAdminSensorStats === 'function') {
            setTimeout(() => window.updateAdminSensorStats(), 500);
        }
        
    } catch (error) {
        console.error('❌ Unlink failed:', error);
        alert(`❌ Failed to unlink sensor:\n${error.message}`);
    }
};

// Function 2: Open Sensor Management
window.adminOpenSensorManagement = function() {
    console.log('📂 CLICKED MANAGE - Opening sensor management...');
    
    try {
        const newWindow = window.open('/sensor-management.html', '_blank', 'noopener,noreferrer');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            alert('⚠️ Pop-up blocked!\n\nPlease allow pop-ups for this site.');
            console.warn('⚠️ Pop-up blocked');
        } else {
            console.log('✅ Sensor management opened in new tab');
        }
    } catch (error) {
        console.error('❌ Failed to open:', error);
        alert('❌ Failed to open sensor management');
    }
};

window.ADMIN_FUNCTIONS_READY = true;

console.log('✅ Admin functions defined globally');
console.log('   📌 window.adminUnlinkSensor:', typeof window.adminUnlinkSensor);
console.log('   📌 window.adminOpenSensorManagement:', typeof window.adminOpenSensorManagement);

// Add event delegation for dynamically created buttons
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Setting up event delegation for admin buttons...');
    
    // Delegate clicks on the entire document
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Check if clicked element is a button or inside a button
        const button = target.closest('button');
        if (!button) return;
        
        const onclick = button.getAttribute('onclick');
        if (!onclick) return;
        
        // Check if it's an admin button
        if (onclick.includes('adminUnlinkSensor')) {
            console.log('🎯 Intercepted unlink button click!');
            e.preventDefault();
            e.stopPropagation();
            
            // Extract parameters from onclick
            const match = onclick.match(/adminUnlinkSensor\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                const imei = match[1];
                const binId = match[2];
                console.log(`   Extracted: imei=${imei}, binId=${binId}`);
                window.adminUnlinkSensor(imei, binId);
            } else {
                console.error('❌ Failed to extract parameters from:', onclick);
            }
        } else if (onclick.includes('adminOpenSensorManagement')) {
            console.log('🎯 Intercepted manage button click!');
            e.preventDefault();
            e.stopPropagation();
            window.adminOpenSensorManagement();
        }
    }, true); // Use capture phase to intercept before other handlers
    
    console.log('✅ Event delegation active');
});

// Also watch for table updates and re-attach listeners
const observeTableChanges = () => {
    const tableBody = document.getElementById('adminSensorTableBody');
    if (!tableBody) {
        setTimeout(observeTableChanges, 1000);
        return;
    }
    
    console.log('👀 Watching admin table for changes...');
    
    const observer = new MutationObserver((mutations) => {
        console.log('🔄 Admin table updated, checking buttons...');
        
        // Find all admin buttons
        const unlinkButtons = tableBody.querySelectorAll('button[onclick*="adminUnlinkSensor"]');
        const manageButtons = tableBody.querySelectorAll('button[onclick*="adminOpenSensorManagement"]');
        
        console.log(`   Found ${unlinkButtons.length} unlink buttons, ${manageButtons.length} manage buttons`);
        
        // Add direct click listeners as backup
        unlinkButtons.forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                console.log(`🎯 Direct listener: Unlink button ${idx} clicked`);
                // onclick handler will still fire due to event delegation
            });
        });
        
        manageButtons.forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                console.log(`🎯 Direct listener: Manage button ${idx} clicked`);
                // onclick handler will still fire due to event delegation
            });
        });
    });
    
    observer.observe(tableBody, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Table observer active');
};

// Start observing when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeTableChanges);
} else {
    observeTableChanges();
}

console.log('🎯 Admin Button Click Handler ready!');
