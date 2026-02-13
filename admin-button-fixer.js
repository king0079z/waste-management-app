// admin-button-fixer.js - Emergency Button Fixer
// This script will force-fix the admin buttons if they still don't work

console.log('🔧 Admin Button Emergency Fixer loaded');

// Wait for page to fully load
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔧 ADMIN BUTTON EMERGENCY FIXER');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Check if functions already exist
        let needsFix = false;
        
        if (typeof window.adminUnlinkSensor !== 'function') {
            console.warn('⚠️ adminUnlinkSensor not found - applying emergency fix');
            needsFix = true;
        }
        
        if (typeof window.adminOpenSensorManagement !== 'function') {
            console.warn('⚠️ adminOpenSensorManagement not found - applying emergency fix');
            needsFix = true;
        }
        
        if (needsFix) {
            console.log('🔧 Applying emergency fixes...\n');
            
            // Emergency fix: Define functions directly
            if (typeof window.adminUnlinkSensor !== 'function') {
                window.adminUnlinkSensor = async function(imei, binId) {
                    console.log(`🔓 Emergency unlink: ${imei} from ${binId}`);
                    
                    const confirmed = confirm(
                        `🔓 UNLINK SENSOR FROM BIN\n\n` +
                        `Sensor: ${imei}\n` +
                        `Bin: ${binId}\n\n` +
                        `This will stop receiving sensor data.\n\n` +
                        `Continue?`
                    );
                    
                    if (!confirmed) {
                        console.log('❌ Cancelled');
                        return;
                    }
                    
                    try {
                        console.log('🔄 Unlinking...');
                        
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
                        
                        console.log('✅ Sensor unlinked');
                        
                        // Update bin
                        if (typeof dataManager !== 'undefined' && dataManager.bins) {
                            const bin = dataManager.bins.find(b => b.id === binId);
                            if (bin) {
                                bin.sensorId = null;
                                if (typeof dataManager.saveBin === 'function') {
                                    await dataManager.saveBin(bin);
                                }
                            }
                        }
                        
                        alert(`✅ Sensor ${imei.slice(-4)} unlinked from ${binId}`);
                        
                        // Refresh
                        if (typeof window.updateAdminSensorStats === 'function') {
                            window.updateAdminSensorStats();
                        } else {
                            console.log('🔄 Please refresh page to see changes');
                        }
                        
                    } catch (error) {
                        console.error('❌ Failed:', error);
                        alert(`❌ Failed to unlink: ${error.message}`);
                    }
                };
                
                console.log('✅ Emergency adminUnlinkSensor function created');
            }
            
            if (typeof window.adminOpenSensorManagement !== 'function') {
                window.adminOpenSensorManagement = function() {
                    console.log('📂 Opening sensor management...');
                    const newWindow = window.open('/sensor-management.html', '_blank');
                    
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                        alert('⚠️ Pop-up blocked!\n\nPlease allow pop-ups for this site.');
                        console.warn('⚠️ Pop-up blocked');
                    } else {
                        console.log('✅ Opened in new tab');
                    }
                };
                
                console.log('✅ Emergency adminOpenSensorManagement function created');
            }
            
            console.log('\n✅ EMERGENCY FIXES APPLIED!');
            console.log('   You can now use the buttons.\n');
            
        } else {
            console.log('✅ All functions already available - no fixes needed\n');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 FINAL STATUS CHECK');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('adminUnlinkSensor:', typeof window.adminUnlinkSensor);
        console.log('adminOpenSensorManagement:', typeof window.adminOpenSensorManagement);
        console.log('updateAdminSensorStats:', typeof window.updateAdminSensorStats);
        
        if (typeof window.adminUnlinkSensor === 'function' && 
            typeof window.adminOpenSensorManagement === 'function') {
            console.log('\n🎉 ALL BUTTONS SHOULD NOW WORK!');
            console.log('\n📝 Test by clicking:');
            console.log('   1. Blue "Manage" button → Opens new tab');
            console.log('   2. Orange "Unlink" button → Shows confirmation\n');
        } else {
            console.error('\n❌ STILL MISSING FUNCTIONS!');
            console.error('   Something is seriously wrong.');
            console.error('   Please send screenshot of this console to developer.\n');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
    }, 3000); // Wait 3 seconds for all scripts to load
});

// Add a manual fix trigger
window.fixAdminButtons = function() {
    location.reload();
};

console.log('✅ Emergency fixer ready');
console.log('   Type: fixAdminButtons() to force reload and reapply fixes');
