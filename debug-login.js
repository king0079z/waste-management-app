// debug-login.js - Debug Findy API login issue
// Tests the exact login request to understand the 401 error

require('dotenv').config();

async function debugLogin() {
    console.log('🔍 Debugging Findy API Login...\n');
    
    const baseUrl = process.env.FINDY_API_URL || 'https://uac.higps.org';
    const apiKey = process.env.FINDY_API_KEY || 'BEdRCeAZ8Wog47s5YpBhu0ZZV4hLrsV1234';
    const username = process.env.FINDY_API_USERNAME || 'datavoizme';
    const password = process.env.FINDY_API_PASSWORD || 'datavoizme543#!';
    
    console.log('Configuration from .env:');
    console.log('  URL:', baseUrl);
    console.log('  API Key:', apiKey);
    console.log('  Username:', username);
    console.log('  Password:', password);
    console.log('  Password length:', password.length);
    console.log('  Password chars:', [...password].map(c => c.charCodeAt(0)).join(','));
    console.log();
    
    // Test 1: Standard login as per Postman
    console.log('================================================================================');
    console.log('TEST 1: Standard POST /login (from Postman collection)');
    console.log('================================================================================');
    
    try {
        const loginUrl = `${baseUrl}/login`;
        console.log(`\nRequest: POST ${loginUrl}`);
        console.log('Headers:', {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey
        });
        console.log('Body:', JSON.stringify({ username, password }));
        
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-KEY': apiKey
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response Body:', responseText);
        
        if (response.ok) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            try {
                const data = JSON.parse(responseText);
                console.log('Token/Hash:', data.hash || data.token || data.key || data);
            } catch (e) {
                console.log('Token (raw):', responseText);
            }
        } else {
            console.log('\n❌ LOGIN FAILED');
        }
    } catch (error) {
        console.log('\n❌ Request Error:', error.message);
    }
    
    // Test 2: Try with Server header
    console.log('\n================================================================================');
    console.log('TEST 2: POST /login with Server header');
    console.log('================================================================================');
    
    try {
        const loginUrl = `${baseUrl}/login`;
        
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-KEY': apiKey,
                'Server': 'findyIoT_serverApi'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.log('Response Body:', responseText);
        
        if (response.ok) {
            console.log('\n✅ LOGIN SUCCESSFUL with Server header!');
        }
    } catch (error) {
        console.log('❌ Request Error:', error.message);
    }
    
    // Test 3: Try alternate URL (higps.org/new_test)
    console.log('\n================================================================================');
    console.log('TEST 3: POST /login on alternate URL (higps.org/new_test)');
    console.log('================================================================================');
    
    try {
        const altUrl = 'https://higps.org/new_test/login';
        console.log(`Request: POST ${altUrl}`);
        
        const response = await fetch(altUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-KEY': apiKey
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.log('Response Body:', responseText.substring(0, 500));
        
        if (response.ok) {
            console.log('\n✅ LOGIN SUCCESSFUL on alternate URL!');
        }
    } catch (error) {
        console.log('❌ Request Error:', error.message);
    }
    
    // Test 4: Try GET device without login (to see if auth is actually required)
    console.log('\n================================================================================');
    console.log('TEST 4: GET /device/{imei} without login (check if auth required)');
    console.log('================================================================================');
    
    try {
        const deviceUrl = `${baseUrl}/device/865456053885594`;
        console.log(`Request: GET ${deviceUrl}`);
        
        const response = await fetch(deviceUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-KEY': apiKey,
                'Server': 'findyIoT_serverApi'
            }
        });
        
        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.log('Response Body:', responseText.substring(0, 500));
    } catch (error) {
        console.log('❌ Request Error:', error.message);
    }
    
    console.log('\n================================================================================');
    console.log('DEBUG COMPLETE');
    console.log('================================================================================');
    console.log('\nNext steps:');
    console.log('1. If all tests failed with 401 - verify credentials with Findy platform');
    console.log('2. If alternate URL worked - update FINDY_API_URL in .env');
    console.log('3. If GET device worked without login - API may not require auth');
}

debugLogin().catch(console.error);
