// admin-functions-test.js - Verify admin functions are working

console.log('🧪 Testing admin functions availability...');

// Wait for DOM and all scripts to load
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 ADMIN FUNCTIONS TEST REPORT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Test 1: Check if adminUnlinkSensor exists
        if (typeof window.adminUnlinkSensor === 'function') {
            console.log('✅ window.adminUnlinkSensor - AVAILABLE');
        } else {
            console.error('❌ window.adminUnlinkSensor - MISSING');
            console.error('   This function should be loaded from admin-buttons-worldclass.js');
        }
        
        // Test 2: Check if adminOpenSensorManagement exists
        if (typeof window.adminOpenSensorManagement === 'function') {
            console.log('✅ window.adminOpenSensorManagement - AVAILABLE');
        } else {
            console.error('❌ window.adminOpenSensorManagement - MISSING');
            console.error('   This function should be loaded from admin-buttons-worldclass.js');
        }
        
        // Test 3: Check if updateAdminSensorStats exists
        if (typeof window.updateAdminSensorStats === 'function') {
            console.log('✅ window.updateAdminSensorStats - AVAILABLE');
        } else {
            console.error('❌ window.updateAdminSensorStats - MISSING');
            console.error('   This function should be defined in index.html');
        }
        
        // Test 4: Check if AdminButtonManager exists
        if (typeof window.adminButtonManager !== 'undefined') {
            console.log('✅ window.adminButtonManager - AVAILABLE');
        } else {
            console.warn('⚠️ window.adminButtonManager - MISSING');
        }
        
        // Test 5: Check if dataManager exists
        if (typeof window.dataManager !== 'undefined') {
            console.log('✅ window.dataManager - AVAILABLE');
        } else {
            console.warn('⚠️ window.dataManager - MISSING');
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 TEST COMPLETE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // If all critical functions are available, enable test mode
        if (typeof window.adminUnlinkSensor === 'function' && 
            typeof window.adminOpenSensorManagement === 'function' &&
            typeof window.updateAdminSensorStats === 'function') {
            console.log('🎉 ALL ADMIN FUNCTIONS ARE READY!');
            console.log('\n📝 You can now test manually:');
            console.log('   1. Click "Manage" button - Should open sensor-management.html');
            console.log('   2. Click "Unlink" button - Should show confirmation dialog');
            console.log('\n🔧 Or test in console:');
            console.log('   window.adminOpenSensorManagement()');
            console.log('   window.adminUnlinkSensor("865456059002301", "BIN-003")');
        } else {
            console.error('❌ SOME FUNCTIONS ARE MISSING - BUTTONS WILL NOT WORK');
            console.error('   Please refresh the page (Ctrl+F5) and check for script loading errors');
        }
    }, 2000);
});

// Also add a global test function
window.testAdminButtons = function() {
    console.log('\n🧪 MANUAL TEST MODE\n');
    console.log('Testing adminOpenSensorManagement...');
    if (typeof window.adminOpenSensorManagement === 'function') {
        window.adminOpenSensorManagement();
    } else {
        console.error('❌ Function not available');
    }
};

console.log('✅ Admin functions test loaded');
console.log('   Type: testAdminButtons() to run manual test');
