// admin-buttons-worldclass.js - Enhanced Admin Panel Button Functionality

/**
 * World-Class Admin Button Manager
 * Ensures all admin panel buttons work perfectly with visual feedback
 */
class AdminButtonManager {
    constructor() {
        this.processing = false;
        console.log('🎮 Admin Button Manager initialized');
    }
    
    /**
     * Unlink sensor with world-class UX
     */
    async unlinkSensor(imei, binId) {
        if (this.processing) {
            console.warn('⚠️ Please wait for current operation to complete');
            return;
        }
        
        console.log(`🔓 Unlink requested: Sensor ${imei} from Bin ${binId}`);
        
        // Get bin details
        let binDetails = binId;
        let binAddress = '';
        
        if (typeof dataManager !== 'undefined' && dataManager.bins && Array.isArray(dataManager.bins)) {
            const bin = dataManager.bins.find(b => b.id === binId);
            if (bin) {
                if (bin.location && bin.location.address) {
                    binAddress = bin.location.address;
                    binDetails = `${binId}\n📍 ${binAddress}`;
                }
            }
        }
        
        // Confirm with detailed dialog
        const confirmed = confirm(
            `🔓 UNLINK SENSOR FROM BIN\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Sensor IMEI: ${imei}\n` +
            `Sensor ID: ...${imei.slice(-4)}\n\n` +
            `Bin: ${binDetails}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⚠️ This will stop receiving sensor data\n` +
            `⚠️ Fill level updates will cease\n\n` +
            `Do you want to continue?`
        );
        
        if (!confirmed) {
            console.log('❌ Unlink cancelled by user');
            return;
        }
        
        this.processing = true;
        
        try {
            console.log('🔄 Starting unlink process...');
            
            // Step 1: Update sensor in database
            console.log('📝 Step 1/3: Updating sensor record...');
            const sensorResponse = await fetch('/api/sensors/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imei: imei,
                    binId: null,
                    unlinkedAt: new Date().toISOString()
                })
            });
            
            if (!sensorResponse.ok) {
                throw new Error(`Database update failed: ${sensorResponse.status}`);
            }
            
            const sensorResult = await sensorResponse.json();
            console.log('✅ Step 1/3 complete - Sensor record updated');
            
            // Step 2: Update bin record
            console.log('📝 Step 2/3: Updating bin record...');
            if (typeof dataManager !== 'undefined' && dataManager.bins && Array.isArray(dataManager.bins)) {
                const bin = dataManager.bins.find(b => b.id === binId);
                if (bin) {
                    bin.sensorId = null;
                    if (typeof dataManager.saveBin === 'function') {
                        await dataManager.saveBin(bin);
                        console.log('✅ Step 2/3 complete - Bin record updated');
                    }
                } else {
                    console.warn('⚠️ Bin not found in dataManager, skipping bin update');
                }
            }
            
            // Step 3: Update integration
            console.log('📝 Step 3/3: Updating integrations...');
            if (typeof findyBinSensorIntegration !== 'undefined' && typeof findyBinSensorIntegration.unlinkBinSensor === 'function') {
                try {
                    await findyBinSensorIntegration.unlinkBinSensor(binId);
                    console.log('✅ Step 3/3 complete - Integration updated');
                } catch (error) {
                    console.warn('⚠️ Integration update failed (non-critical):', error.message);
                }
            }
            
            // Trigger event for cross-page updates
            window.dispatchEvent(new CustomEvent('admin:sensor-unlinked', {
                detail: { imei, binId, timestamp: new Date().toISOString() }
            }));
            
            // Show success notification
            this.showSuccess(`✅ Sensor ${imei.slice(-4)} successfully unlinked from ${binId}!`);
            
            // Refresh the admin table
            console.log('🔄 Refreshing admin panel...');
            if (typeof updateAdminSensorStats === 'function') {
                await updateAdminSensorStats();
            }
            
            console.log('🎉 Unlink operation completed successfully!');
            
        } catch (error) {
            console.error('❌ Unlink operation failed:', error);
            this.showError(`Failed to unlink sensor: ${error.message}`);
        } finally {
            this.processing = false;
        }
    }
    
    /**
     * Open sensor management page
     */
    openSensorManagement() {
        console.log('📂 Opening sensor management page...');
        
        try {
            const url = '/sensor-management.html';
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                // Pop-up blocked
                console.warn('⚠️ Pop-up blocked by browser');
                this.showWarning(
                    '⚠️ Pop-up blocked!\n\n' +
                    'Please allow pop-ups for this site to open the sensor management page.\n\n' +
                    'You can also manually navigate to: sensor-management.html'
                );
            } else {
                console.log('✅ Sensor management page opened successfully');
            }
        } catch (error) {
            console.error('❌ Failed to open sensor management:', error);
            this.showError('Failed to open sensor management page');
        }
    }
    
    /**
     * Show success notification
     */
    showSuccess(message) {
        if (typeof realtimeStatusNotifier !== 'undefined' && typeof realtimeStatusNotifier.showToast === 'function') {
            realtimeStatusNotifier.showToast(message, 'success');
        } else {
            alert(message);
        }
    }
    
    /**
     * Show error notification
     */
    showError(message) {
        if (typeof realtimeStatusNotifier !== 'undefined' && typeof realtimeStatusNotifier.showToast === 'function') {
            realtimeStatusNotifier.showToast(message, 'error');
        } else {
            alert(`❌ ${message}`);
        }
    }
    
    /**
     * Show warning notification
     */
    showWarning(message) {
        if (typeof realtimeStatusNotifier !== 'undefined' && typeof realtimeStatusNotifier.showToast === 'function') {
            realtimeStatusNotifier.showToast(message, 'warning');
        } else {
            alert(`⚠️ ${message}`);
        }
    }
    
    /**
     * Show info notification
     */
    showInfo(message) {
        if (typeof realtimeStatusNotifier !== 'undefined' && typeof realtimeStatusNotifier.showToast === 'function') {
            realtimeStatusNotifier.showToast(message, 'info');
        } else {
            alert(message);
        }
    }
}

// Create global instance
const adminButtonManager = new AdminButtonManager();
window.adminButtonManager = adminButtonManager;

// Export functions globally for onclick handlers
window.adminUnlinkSensor = (imei, binId) => adminButtonManager.unlinkSensor(imei, binId);
window.adminOpenSensorManagement = () => adminButtonManager.openSensorManagement();

// Admin Button Manager loaded - functions: adminUnlinkSensor(imei, binId), adminOpenSensorManagement()
