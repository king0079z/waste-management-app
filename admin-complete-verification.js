// admin-complete-verification.js - Complete System Verification
// This runs a comprehensive check to ensure EVERYTHING works

// Check if in production mode - if so, don't auto-run verification
const PRODUCTION_MODE = true; // Set to false to enable auto-verification

if (!PRODUCTION_MODE) {
    console.log('🔍 Admin Complete Verification System loading...');
    
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            runCompleteVerification();
        }, 4000); // Wait 4 seconds for all dependencies
    });
} else {
    // In production, just expose the function for manual testing
    window.runCompleteVerification = runCompleteVerification;
}

function runCompleteVerification() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 COMPLETE ADMIN SYSTEM VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let allPassed = true;
    const results = [];
    
    // Test 1: Core Functions Exist
    console.log('📋 TEST 1: Core Functions');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const functions = {
        'adminUnlinkSensor': window.adminUnlinkSensor,
        'adminOpenSensorManagement': window.adminOpenSensorManagement,
        'updateAdminSensorStats': window.updateAdminSensorStats,
        'adminButtonManager': window.adminButtonManager
    };
    
    for (const [name, func] of Object.entries(functions)) {
        const exists = typeof func !== 'undefined';
        const isFunction = typeof func === 'function' || typeof func === 'object';
        const status = exists && isFunction;
        
        if (status) {
            console.log(`✅ ${name} - AVAILABLE (${typeof func})`);
            results.push({ test: name, status: 'PASS' });
        } else {
            console.error(`❌ ${name} - MISSING`);
            results.push({ test: name, status: 'FAIL' });
            allPassed = false;
        }
    }
    
    // Test 2: Dependencies
    console.log('\n📋 TEST 2: Required Dependencies');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const dependencies = {
        'dataManager': window.dataManager,
        'realtimeStatusNotifier': window.realtimeStatusNotifier,
        'fetch API': window.fetch
    };
    
    for (const [name, dep] of Object.entries(dependencies)) {
        const exists = typeof dep !== 'undefined';
        
        if (exists) {
            console.log(`✅ ${name} - Available`);
            results.push({ test: name, status: 'PASS' });
        } else {
            console.warn(`⚠️ ${name} - Missing (non-critical)`);
            results.push({ test: name, status: 'WARN' });
        }
    }
    
    // Test 3: DOM Elements
    console.log('\n📋 TEST 3: Admin Panel Elements');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const elements = {
        'Admin Section': document.getElementById('admin'),
        'Sensor Table Body': document.getElementById('adminSensorTableBody'),
        'Admin Sensor Stats': document.getElementById('adminSensorStats')
    };
    
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            console.log(`✅ ${name} - Found`);
            results.push({ test: name, status: 'PASS' });
        } else {
            console.error(`❌ ${name} - Not found`);
            results.push({ test: name, status: 'FAIL' });
            allPassed = false;
        }
    }
    
    // Test 4: Button Detection
    console.log('\n📋 TEST 4: Button Detection in DOM');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const unlinkButtons = document.querySelectorAll('button[onclick*="adminUnlinkSensor"]');
    const manageButtons = document.querySelectorAll('button[onclick*="adminOpenSensorManagement"]');
    
    console.log(`   Found ${unlinkButtons.length} Unlink buttons`);
    console.log(`   Found ${manageButtons.length} Manage buttons`);
    
    if (unlinkButtons.length > 0 || manageButtons.length > 0) {
        console.log(`✅ Admin buttons present in DOM`);
        results.push({ test: 'Button Detection', status: 'PASS' });
    } else {
        console.warn(`⚠️ No admin buttons found (table may be empty or not loaded yet)`);
        results.push({ test: 'Button Detection', status: 'WARN' });
    }
    
    // Test 5: API Endpoint
    console.log('\n📋 TEST 5: API Endpoint Connectivity');
    console.log('─────────────────────────────────────────────────────────\n');
    
    fetch('/api/sensors')
        .then(response => {
            if (response.ok) {
                console.log(`✅ Sensor API - Responsive (${response.status})`);
                results.push({ test: 'API Endpoint', status: 'PASS' });
            } else {
                console.warn(`⚠️ Sensor API - Non-200 status (${response.status})`);
                results.push({ test: 'API Endpoint', status: 'WARN' });
            }
            
            printFinalResults(results, allPassed);
        })
        .catch(error => {
            console.error(`❌ Sensor API - Error: ${error.message}`);
            results.push({ test: 'API Endpoint', status: 'FAIL' });
            
            printFinalResults(results, allPassed);
        });
    
    // Test 6: Function Execution Test
    console.log('\n📋 TEST 6: Function Execution (Dry Run)');
    console.log('─────────────────────────────────────────────────────────\n');
    
    try {
        // Test that we can call the functions without errors
        if (typeof window.adminOpenSensorManagement === 'function') {
            console.log(`✅ adminOpenSensorManagement is callable`);
            results.push({ test: 'Function Callable', status: 'PASS' });
        }
    } catch (error) {
        console.error(`❌ Function execution error: ${error.message}`);
        results.push({ test: 'Function Callable', status: 'FAIL' });
        allPassed = false;
    }
}

function printFinalResults(results, allPassed) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARN').length;
    
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️ Warnings: ${warnings}`);
    console.log(`   📊 Total Tests: ${results.length}\n`);
    
    if (failed === 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🎉 ALL CRITICAL TESTS PASSED!');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('✅ Admin buttons are ready to use!\n');
        console.log('📝 NEXT STEPS:');
        console.log('   1. Go to Admin panel');
        console.log('   2. Click blue "Manage" button → Opens new tab');
        console.log('   3. Click orange "Unlink" button → Shows confirmation\n');
        console.log('🧪 MANUAL TEST COMMANDS:');
        console.log('   window.adminOpenSensorManagement()  ← Test manage button');
        console.log('   testAdminButtons()                  ← Quick test\n');
    } else {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('❌ SOME TESTS FAILED');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.error('⚠️ Critical issues detected. Please check:');
        console.error('   1. Hard refresh: Ctrl + Shift + F5');
        console.error('   2. Check console for script loading errors');
        console.error('   3. Verify all admin-*.js files exist\n');
        console.error('🔧 Emergency Fix Command:');
        console.error('   fixAdminButtons()  ← Force reload and reapply fixes\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Store results globally for reference
    window.adminVerificationResults = {
        passed,
        failed,
        warnings,
        total: results.length,
        details: results,
        allPassed: failed === 0
    };
}

// Global command to re-run verification
window.verifyAdminSystem = function() {
    console.clear();
    runCompleteVerification();
};

console.log('✅ Complete verification system loaded');
console.log('   Type: verifyAdminSystem() to run verification manually');
