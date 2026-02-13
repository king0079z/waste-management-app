// data-integrity-manager.js - World-Class Data Integrity Across Entire Application
// Ensures all sensor-bin links are synchronized everywhere

console.log('🛡️ Data Integrity Manager Loading...');

class DataIntegrityManager {
    constructor() {
        this.syncInProgress = false;
        this.syncQueue = [];
        this.verificationInterval = null;
        this.lastVerification = null;
        
        console.log('🔧 Data Integrity Manager initialized');
    }
    
    /**
     * Initialize the integrity manager
     */
    async initialize() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🛡️ INITIALIZING DATA INTEGRITY MANAGER');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Run initial verification
        await this.verifyAllData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start periodic verification (every 5 minutes)
        this.startPeriodicVerification();
        
        console.log('✅ Data Integrity Manager Ready');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    /**
     * Verify all data integrity across the application
     */
    async verifyAllData() {
        console.log('🔍 VERIFYING DATA INTEGRITY...\n');
        
        const issues = {
            missingBinSensorId: [],
            missingSensorBinId: [],
            mismatchedLinks: [],
            orphanedSensors: [],
            orphanedBins: [],
            fixed: []
        };
        
        try {
            // Get all data sources
            const bins = this.getBins();
            const sensors = this.getSensors();
            
            console.log(`📊 Checking ${bins.length} bins and ${sensors.length} sensors...`);
            
            // Check each bin
            for (const bin of bins) {
                // Find sensor linked to this bin (from sensor side)
                const linkedSensor = sensors.find(s => s.binId === bin.id);
                
                if (linkedSensor) {
                    // Sensor says it's linked to this bin
                    // Check if bin knows about the sensor
                    if (!bin.sensorId || bin.sensorId !== linkedSensor.imei) {
                        console.warn(`⚠️ Bin ${bin.id} missing sensorId (should be ${linkedSensor.imei})`);
                        issues.missingBinSensorId.push({
                            binId: bin.id,
                            expectedSensorId: linkedSensor.imei,
                            currentSensorId: bin.sensorId || 'none'
                        });
                        
                        // FIX IT
                        await this.fixBinSensorLink(bin, linkedSensor.imei);
                        issues.fixed.push(`Bin ${bin.id} → Sensor ${linkedSensor.imei}`);
                    }
                } else if (bin.sensorId) {
                    // Bin says it has a sensor, but sensor doesn't know about bin
                    const sensor = sensors.find(s => s.imei === bin.sensorId);
                    if (sensor && (!sensor.binId || sensor.binId !== bin.id)) {
                        console.warn(`⚠️ Sensor ${bin.sensorId} not linked back to bin ${bin.id}`);
                        issues.missingSensorBinId.push({
                            sensorId: bin.sensorId,
                            expectedBinId: bin.id,
                            currentBinId: sensor?.binId || 'none'
                        });
                        
                        // FIX IT
                        await this.fixSensorBinLink(sensor, bin.id);
                        issues.fixed.push(`Sensor ${bin.sensorId} → Bin ${bin.id}`);
                    } else if (!sensor) {
                        // Bin has sensorId/sensorIMEI but not in app sensor list – may be Findy/external API sensor
                        const hasExternalSensor = !!(bin.sensorData || bin.lastSensorUpdate || (bin.sensorIMEI && typeof findyBinSensorIntegration !== 'undefined'));
                        if (hasExternalSensor) {
                            // Skip: bin is linked to external (e.g. Findy) sensor, not in getSensors()
                        } else {
                            console.warn(`⚠️ Bin ${bin.id} references non-existent sensor ${bin.sensorId}`);
                            issues.orphanedBins.push(bin.id);
                            await this.cleanBinSensorLink(bin);
                            issues.fixed.push(`Cleaned bin ${bin.id} (sensor not found)`);
                        }
                    }
                }
            }
            
            // Check each sensor
            for (const sensor of sensors) {
                if (sensor.binId) {
                    const bin = bins.find(b => b.id === sensor.binId);
                    if (!bin) {
                        console.warn(`⚠️ Sensor ${sensor.imei} linked to non-existent bin ${sensor.binId}`);
                        issues.orphanedSensors.push(sensor.imei);
                        
                        // CLEAN IT
                        await this.cleanSensorBinLink(sensor);
                        issues.fixed.push(`Cleaned sensor ${sensor.imei} (bin not found)`);
                    }
                }
            }
            
            // Check findyBinSensorIntegration mappings
            if (typeof findyBinSensorIntegration !== 'undefined') {
                console.log('🔗 Verifying integration mappings...');
                await this.verifyIntegrationMappings(bins, sensors);
            }
            
            // Report results
            this.reportVerificationResults(issues);
            
            // Refresh all UIs
            await this.refreshAllUIs();
            
            this.lastVerification = Date.now();
            
        } catch (error) {
            console.error('❌ Data verification failed:', error);
        }
    }
    
    /**
     * Fix bin's sensor link
     */
    async fixBinSensorLink(bin, sensorId) {
        console.log(`🔧 Fixing bin ${bin.id} → sensor ${sensorId}`);
        
        try {
            // Update bin object
            bin.sensorId = sensorId;
            bin.sensorIMEI = sensorId; // Also set legacy property
            
            // ⭐ CRITICAL: Save to dataManager with PERSISTENCE (only sensor link fields - preserves calibration & all other bin data)
            if (typeof dataManager !== 'undefined') {
                if (typeof dataManager.updateBin === 'function') {
                    dataManager.updateBin(bin.id, { 
                        sensorId: sensorId, 
                        sensorIMEI: sensorId 
                    });
                    console.log(`  ✓ Called updateBin with correct signature`);
                }
                
                // Verify the save
                const verifyBins = dataManager.getBins();
                const verifyBin = verifyBins.find(b => b.id === bin.id);
                console.log(`  🔍 Verification: bin.sensorId = ${verifyBin?.sensorId || 'NOT SET'}`);
            }
            
            // Update integration mapping
            if (typeof findyBinSensorIntegration !== 'undefined') {
                findyBinSensorIntegration.linkBinToSensor(bin.id, sensorId);
                console.log(`  ✓ Updated integration mapping`);
            }
            
            // Broadcast event
            window.dispatchEvent(new CustomEvent('binSensorLinked', {
                detail: { binId: bin.id, sensorId }
            }));
            
            console.log(`✅ Fixed bin ${bin.id} (sensorId=${sensorId})`);
            
        } catch (error) {
            console.error(`❌ Failed to fix bin ${bin.id}:`, error);
        }
    }
    
    /**
     * Fix sensor's bin link
     */
    async fixSensorBinLink(sensor, binId) {
        console.log(`🔧 Fixing sensor ${sensor.imei} → bin ${binId}`);
        
        try {
            // Update sensor object
            sensor.binId = binId;
            
            // Save to database
            const response = await fetch('/api/sensors/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imei: sensor.imei,
                    binId: binId
                })
            });
            
            if (response.ok) {
                console.log(`  ✓ Saved to database`);
            }
            
            // Update in sensorManagementAdmin
            if (typeof sensorManagementAdmin !== 'undefined' && sensorManagementAdmin.sensors) {
                sensorManagementAdmin.sensors.set(sensor.imei, sensor);
                console.log(`  ✓ Updated sensor manager`);
            }
            
            // Update integration mapping
            if (typeof findyBinSensorIntegration !== 'undefined') {
                findyBinSensorIntegration.linkBinToSensor(binId, sensor.imei);
                console.log(`  ✓ Updated integration mapping`);
            }
            
            // Broadcast event
            window.dispatchEvent(new CustomEvent('sensorBinLinked', {
                detail: { sensorId: sensor.imei, binId }
            }));
            
            console.log(`✅ Fixed sensor ${sensor.imei}`);
            
        } catch (error) {
            console.error(`❌ Failed to fix sensor ${sensor.imei}:`, error);
        }
    }
    
    /**
     * Clean bin's invalid sensor link
     */
    async cleanBinSensorLink(bin) {
        console.log(`🧹 Cleaning bin ${bin.id} (removing invalid sensor link)`);
        
        try {
            delete bin.sensorId;
            delete bin.sensorIMEI;
            
            if (typeof dataManager !== 'undefined' && typeof dataManager.saveBin === 'function') {
                await dataManager.saveBin(bin);
                console.log(`  ✓ Cleaned bin ${bin.id}`);
            }
        } catch (error) {
            console.error(`❌ Failed to clean bin ${bin.id}:`, error);
        }
    }
    
    /**
     * Clean sensor's invalid bin link
     */
    async cleanSensorBinLink(sensor) {
        console.log(`🧹 Cleaning sensor ${sensor.imei} (removing invalid bin link)`);
        
        try {
            sensor.binId = null;
            
            const response = await fetch('/api/sensors/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imei: sensor.imei,
                    binId: null
                })
            });
            
            if (response.ok) {
                console.log(`  ✓ Cleaned sensor ${sensor.imei}`);
            }
        } catch (error) {
            console.error(`❌ Failed to clean sensor ${sensor.imei}:`, error);
        }
    }
    
    /**
     * Verify integration mappings
     */
    async verifyIntegrationMappings(bins, sensors) {
        // Check binSensorMapping
        const mapping = findyBinSensorIntegration.binSensorMapping || {};
        
        for (const [binId, sensorId] of Object.entries(mapping)) {
            const bin = bins.find(b => b.id === binId);
            const sensor = sensors.find(s => s.imei === sensorId);
            
            if (!bin) {
                console.warn(`⚠️ Integration mapping has non-existent bin: ${binId}`);
                delete findyBinSensorIntegration.binSensorMapping[binId];
                delete findyBinSensorIntegration.sensorToBinMapping[sensorId];
            } else if (!sensor) {
                console.warn(`⚠️ Integration mapping has non-existent sensor: ${sensorId}`);
                delete findyBinSensorIntegration.binSensorMapping[binId];
                delete findyBinSensorIntegration.sensorToBinMapping[sensorId];
            } else {
                // Verify bi-directional consistency
                if (bin.sensorId !== sensorId) {
                    await this.fixBinSensorLink(bin, sensorId);
                }
                if (sensor.binId !== binId) {
                    await this.fixSensorBinLink(sensor, binId);
                }
            }
        }
    }
    
    /**
     * Report verification results
     */
    reportVerificationResults(issues) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 VERIFICATION RESULTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        const totalIssues = 
            issues.missingBinSensorId.length +
            issues.missingSensorBinId.length +
            issues.mismatchedLinks.length +
            issues.orphanedSensors.length +
            issues.orphanedBins.length;
        
        if (totalIssues === 0) {
            console.log('✅ NO ISSUES FOUND - Data integrity perfect!');
        } else {
            console.log(`⚠️ Found ${totalIssues} issue(s):`);
            
            if (issues.missingBinSensorId.length > 0) {
                console.log(`\n  ⚠️ Bins missing sensorId: ${issues.missingBinSensorId.length}`);
                issues.missingBinSensorId.forEach(issue => {
                    console.log(`     - ${issue.binId}: expected ${issue.expectedSensorId}, got ${issue.currentSensorId}`);
                });
            }
            
            if (issues.missingSensorBinId.length > 0) {
                console.log(`\n  ⚠️ Sensors missing binId: ${issues.missingSensorBinId.length}`);
                issues.missingSensorBinId.forEach(issue => {
                    console.log(`     - ${issue.sensorId}: expected ${issue.expectedBinId}, got ${issue.currentBinId}`);
                });
            }
            
            if (issues.orphanedBins.length > 0) {
                console.log(`\n  ⚠️ Orphaned bins: ${issues.orphanedBins.length}`);
                console.log(`     ${issues.orphanedBins.join(', ')}`);
            }
            
            if (issues.orphanedSensors.length > 0) {
                console.log(`\n  ⚠️ Orphaned sensors: ${issues.orphanedSensors.length}`);
                console.log(`     ${issues.orphanedSensors.join(', ')}`);
            }
            
            if (issues.fixed.length > 0) {
                console.log(`\n✅ FIXED ${issues.fixed.length} issue(s):`);
                issues.fixed.forEach(fix => {
                    console.log(`     ✓ ${fix}`);
                });
            }
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    /**
     * Get bins from dataManager
     */
    getBins() {
        if (typeof dataManager !== 'undefined' && typeof dataManager.getBins === 'function') {
            return dataManager.getBins();
        }
        console.warn('⚠️ dataManager not available');
        return [];
    }
    
    /**
     * Get sensors from sensorManagementAdmin
     */
    getSensors() {
        if (typeof sensorManagementAdmin !== 'undefined' && sensorManagementAdmin.sensors) {
            return Array.from(sensorManagementAdmin.sensors.values());
        }
        console.warn('⚠️ sensorManagementAdmin not available');
        return [];
    }
    
    /**
     * Refresh all UI components
     */
    async refreshAllUIs() {
        console.log('🔄 Refreshing all UIs...');
        
        // Refresh map
        if (typeof refreshMap === 'function') {
            try {
                await refreshMap();
                console.log('  ✓ Map refreshed');
            } catch (e) {
                console.warn('  ⚠️ Map refresh failed:', e.message);
            }
        } else if (typeof map !== 'undefined' && map && typeof map.invalidateSize === 'function') {
            try {
                map.invalidateSize();
                console.log('  ✓ Map invalidated');
            } catch (e) {}
        }
        
        // Refresh dashboard stats
        if (typeof updateDashboardStats === 'function') {
            try {
                await updateDashboardStats();
                console.log('  ✓ Dashboard stats refreshed');
            } catch (e) {
                console.warn('  ⚠️ Dashboard stats refresh failed:', e.message);
            }
        }
        
        // Refresh admin stats
        if (typeof updateAdminSensorStats === 'function') {
            try {
                await updateAdminSensorStats();
                console.log('  ✓ Admin stats refreshed');
            } catch (e) {
                console.warn('  ⚠️ Admin stats refresh failed:', e.message);
            }
        }
        
        // Refresh sensor table
        if (typeof sensorManagementAdmin !== 'undefined' && 
            typeof sensorManagementAdmin.refreshSensorTable === 'function') {
            try {
                sensorManagementAdmin.refreshSensorTable();
                console.log('  ✓ Sensor table refreshed');
            } catch (e) {
                console.warn('  ⚠️ Sensor table refresh failed:', e.message);
            }
        }
        
        // Refresh bins list
        if (typeof refreshBinsList === 'function') {
            try {
                await refreshBinsList();
                console.log('  ✓ Bins list refreshed');
            } catch (e) {
                console.warn('  ⚠️ Bins list refresh failed:', e.message);
            }
        }
        
        console.log('✅ UI refresh complete');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for sensor-bin link events
        window.addEventListener('sensorLinkedToBin', async (e) => {
            console.log('🔗 Event: Sensor linked to bin', e.detail);
            await this.verifyAllData();
        });
        
        window.addEventListener('sensorUnlinkedFromBin', async (e) => {
            console.log('🔓 Event: Sensor unlinked from bin', e.detail);
            await this.verifyAllData();
        });
        
        // Listen for data changes
        window.addEventListener('binsUpdated', async () => {
            console.log('📊 Event: Bins updated');
            await this.verifyAllData();
        });
        
        window.addEventListener('sensorsUpdated', async () => {
            console.log('📡 Event: Sensors updated');
            await this.verifyAllData();
        });
    }
    
    /**
     * Start periodic verification
     */
    startPeriodicVerification() {
        // Verify every 5 minutes
        this.verificationInterval = setInterval(async () => {
            console.log('🕐 Periodic verification triggered...');
            await this.verifyAllData();
        }, 5 * 60 * 1000);
        
        console.log('✅ Periodic verification started (every 5 minutes)');
    }
    
    /**
     * Stop periodic verification
     */
    stopPeriodicVerification() {
        if (this.verificationInterval) {
            clearInterval(this.verificationInterval);
            this.verificationInterval = null;
            console.log('⏹️ Periodic verification stopped');
        }
    }
    
    /**
     * Manual verification trigger (for user/developer)
     */
    async forceVerification() {
        console.log('🔧 Manual verification triggered by user');
        await this.verifyAllData();
    }
}

// Initialize the system
const dataIntegrityManager = new DataIntegrityManager();

// Make it globally accessible
window.dataIntegrityManager = dataIntegrityManager;

// Initialize after a short delay to ensure all systems are loaded
setTimeout(async () => {
    await dataIntegrityManager.initialize();
}, 3000);

// Add manual verification command (Ctrl+Shift+I for Integrity)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.log('🔧 Manual integrity check triggered (Ctrl+Shift+I)');
        dataIntegrityManager.forceVerification();
    }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ DATA INTEGRITY MANAGER LOADED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('🛡️ Features:');
console.log('  ✓ Automatic data verification');
console.log('  ✓ Bi-directional link validation');
console.log('  ✓ Auto-fix mismatched data');
console.log('  ✓ Periodic integrity checks (5 min)');
console.log('  ✓ Event-driven synchronization');
console.log('');
console.log('🔧 Manual Check: Press Ctrl+Shift+I');
console.log('   Or run: dataIntegrityManager.forceVerification()');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
