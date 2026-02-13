// test-findy-api.js - Test Findy UAC API connection and sensor data
// Updated to match the correct API structure from Postman collection

require('dotenv').config();
const FindyAPIService = require('./findy-api-service.js');

async function testFindyAPI() {
    console.log('🧪 Testing Findy UAC API Configuration...');
    console.log('================================================================================');
    
    // Create service
    const findyAPI = new FindyAPIService();
    
    // Check configuration
    console.log('\n📋 Configuration Check:');
    console.log(`   Base URL: ${findyAPI.baseUrl}`);
    console.log(`   API Key: ${findyAPI.apiKey ? '***' + findyAPI.apiKey.slice(-4) : 'NOT SET'}`);
    console.log(`   Server: ${findyAPI.server}`);
    console.log(`   Username: ${findyAPI.username || 'NOT SET'}`);
    console.log(`   Password: ${findyAPI.password ? '***' + findyAPI.password.slice(-4) : 'NOT SET'}`);
    
    // Step 1: Test Login
    console.log('\n🔐 Step 1: Testing Login...');
    const loginResult = await findyAPI.login();
    
    if (!loginResult.success) {
        console.log('❌ Login failed!');
        console.log('   Error:', loginResult.error);
        console.log('\n💡 Fix:');
        console.log('   1. Check .env file has correct FINDY_API_USERNAME and FINDY_API_PASSWORD');
        console.log('   2. Verify credentials are valid for https://uac.higps.org');
        process.exit(1);
    }
    
    console.log('✅ Login successful!');
    console.log('   Token received:', findyAPI.token ? '***' + findyAPI.token.slice(-8) : 'none');
    
    // Step 2: Test Device Fetch
    const testImei = '865456053885594'; // The sensor IMEI from the issue
    console.log(`\n📡 Step 2: Testing Device Data Fetch for IMEI: ${testImei}...`);
    
    const deviceResult = await findyAPI.getDevice(testImei);
    
    if (deviceResult.success) {
        console.log('\n✅ Device data fetch successful!');
        console.log('   Raw data preview:', JSON.stringify(deviceResult.data, null, 2).substring(0, 500) + '...');
        
        // Extract key data points
        const data = deviceResult.data;
        if (data) {
            console.log('\n📊 Extracted Data:');
            console.log(`   IMEI: ${data.deviceInfo?.imei || data.imei || testImei}`);
            console.log(`   Name: ${data.deviceInfo?.name || data.name || 'N/A'}`);
            console.log(`   Battery: ${data.battery || 'N/A'}%`);
            console.log(`   Operator: ${data.operator || 'N/A'}`);
            console.log(`   Last Report: ${data.deviceInfo?.lastModTime || data.lastModTime || 'N/A'}`);
            
            if (data.ingps) {
                console.log(`   GPS: ${data.ingps.lat}, ${data.ingps.lon || data.ingps.lng}`);
            } else if (data.incell) {
                console.log(`   GSM Position: ${data.incell.lat}, ${data.incell.lon || data.incell.lng}`);
            }
        }
    } else {
        console.log('\n⚠️ Device data fetch failed:');
        console.log('   Error:', deviceResult.error);
        console.log('\n💡 Possible reasons:');
        console.log('   1. Device IMEI not found in Findy system');
        console.log('   2. Device not accessible with current credentials');
        console.log('   3. Network connectivity issue');
    }
    
    // Step 3: Test Live Tracking
    console.log(`\n📍 Step 3: Testing Live Tracking for IMEI: ${testImei}...`);
    
    const liveResult = await findyAPI.getLiveTracking(testImei);
    
    if (liveResult.success) {
        if (liveResult.data) {
            console.log('✅ Live tracking data available!');
            console.log('   GPS Position:', JSON.stringify(liveResult.data.gps, null, 2));
        } else {
            console.log('ℹ️ Live tracking: No GPS data available yet (device may need to send GPS report)');
        }
    } else {
        console.log('⚠️ Live tracking failed:', liveResult.error);
    }
    
    // Summary
    console.log('\n================================================================================');
    console.log('🎯 Test Summary:');
    console.log(`   Login: ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Device Fetch: ${deviceResult.success ? '✅ PASS' : '⚠️ FAIL'}`);
    console.log(`   Live Tracking: ${liveResult.success ? '✅ PASS' : '⚠️ FAIL'}`);
    console.log('================================================================================');
    
    if (loginResult.success && deviceResult.success) {
        console.log('\n🎉 API connection working! Sensor data fetching should now work correctly.');
        console.log('   Restart the server with: npm start');
    } else if (loginResult.success) {
        console.log('\n⚠️ Login works but device fetch failed.');
        console.log('   The specific IMEI may not be accessible or may not exist.');
        console.log('   Try a different IMEI or check the Findy platform.');
    } else {
        console.log('\n❌ Login failed. Fix credentials before proceeding.');
    }
    
    process.exit(deviceResult.success ? 0 : 1);
}

// Run test
testFindyAPI().catch(error => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
});
