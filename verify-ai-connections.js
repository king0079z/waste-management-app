/**
 * AI/ML CONNECTION VERIFICATION SCRIPT
 * Run this in browser console to verify ALL AI/ML connections
 */

async function verifyAIMLConnections() {
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧠 AI/ML CONNECTION VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const results = {
        systems: {},
        pages: {},
        features: {},
        pipelines: {},
        functions: {},
        overall: true
    };
    
    // ═══════════════════════════════════════════════════════════
    // TEST 1: AI/ML SYSTEMS
    // ═══════════════════════════════════════════════════════════
    
    console.log('📊 TEST 1: AI/ML SYSTEMS\n');
    
    const systems = {
        'Master Integration': 'aimlMasterIntegration',
        'ML Route Optimizer': 'mlRouteOptimizer',
        'Predictive Analytics': 'predictiveAnalytics',
        'AI Analytics Integration': 'aiAnalyticsIntegration',
        'Enhanced Analytics': 'enhancedAnalyticsManager'
    };
    
    for (const [name, varName] of Object.entries(systems)) {
        const exists = window[varName] !== undefined;
        results.systems[name] = exists;
        console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'Connected' : 'Not Found'}`);
        if (!exists) results.overall = false;
    }
    
    // ═══════════════════════════════════════════════════════════
    // TEST 2: PAGE CONNECTIONS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n📄 TEST 2: PAGE CONNECTIONS\n');
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log(`  Current page: ${currentPage}\n`);
    
    // Check if AI is loaded on current page
    const aiLoaded = window.aimlMasterIntegration !== undefined;
    results.pages[currentPage] = aiLoaded;
    console.log(`  ${aiLoaded ? '✅' : '❌'} AI/ML loaded: ${aiLoaded ? 'Yes' : 'No'}`);
    
    // Check if real-time broadcaster is loaded
    const broadcasterLoaded = window.realtimeUpdateBroadcaster !== undefined;
    results.pages['Real-time Broadcaster'] = broadcasterLoaded;
    console.log(`  ${broadcasterLoaded ? '✅' : '❌'} Real-time Broadcaster: ${broadcasterLoaded ? 'Loaded' : 'Not Found'}`);
    
    // ═══════════════════════════════════════════════════════════
    // TEST 3: FEATURE INTEGRATIONS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🔗 TEST 3: FEATURE INTEGRATIONS\n');
    
    const features = {
        'Bin Management': () => window.dataManager?.getBins,
        'Sensor System': () => window.dataManager?.getData,
        'Driver System': () => window.driverSystemV3Instance || window.enhancedDriverSystemComplete,
        'Map System': () => window.mapManager,
        'Sync Manager': () => window.syncManager,
        'Analytics': () => window.enhancedAnalyticsManager
    };
    
    for (const [name, checkFn] of Object.entries(features)) {
        const exists = checkFn() !== undefined;
        results.features[name] = exists;
        console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'Available' : 'Not Found'}`);
        if (!exists) results.overall = false;
    }
    
    // ═══════════════════════════════════════════════════════════
    // TEST 4: DATA PIPELINES
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n⚡ TEST 4: DATA PIPELINES\n');
    
    if (window.aimlMasterIntegration) {
        const integration = window.aimlMasterIntegration;
        const pipelines = integration.pipelines;
        
        console.log(`  Real-time pipelines: ${pipelines.realTime.size}`);
        console.log(`  Batch pipelines: ${pipelines.batch.size}`);
        console.log(`  Streaming pipelines: ${pipelines.streaming.size}\n`);
        
        const pipelineNames = [
            'bins', 'routes', 'sensors', 'collections', 'performance'
        ];
        
        pipelineNames.forEach(name => {
            const exists = pipelines.realTime.has(name) || pipelines.batch.has(name);
            results.pipelines[name] = exists;
            console.log(`  ${exists ? '✅' : '❌'} ${name} pipeline: ${exists ? 'Active' : 'Not Found'}`);
        });
    } else {
        console.log('  ❌ Master Integration not loaded - cannot check pipelines');
        results.overall = false;
    }
    
    // ═══════════════════════════════════════════════════════════
    // TEST 5: GLOBAL AI FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🌐 TEST 5: GLOBAL AI FUNCTIONS\n');
    
    const functions = {
        'getAIStatus': window.getAIStatus,
        'getAIMetrics': window.getAIMetrics,
        'getAIInsights': window.getAIInsights,
        'getAIRecommendations': window.getAIRecommendations,
        'optimizeRoute': window.optimizeRoute,
        'generateAIReport': window.generateAIReport,
        'getFleetAIInsights': window.getFleetAIInsights,
        'monitorFleetPerformance': window.monitorFleetPerformance
    };
    
    for (const [name, fn] of Object.entries(functions)) {
        const exists = typeof fn === 'function';
        results.functions[name] = exists;
        console.log(`  ${exists ? '✅' : '❌'} ${name}(): ${exists ? 'Available' : 'Not Found'}`);
        if (!exists && !name.includes('Fleet')) results.overall = false;
    }
    
    // ═══════════════════════════════════════════════════════════
    // TEST 6: SENSOR-TO-AI PIPELINE
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n📡 TEST 6: SENSOR-TO-AI PIPELINE\n');
    
    // Check if sensors have AI data
    const bins = window.dataManager?.getBins() || [];
    const binsWithAI = bins.filter(b => b.ai !== undefined);
    
    console.log(`  Total bins: ${bins.length}`);
    console.log(`  Bins with AI data: ${binsWithAI.length}`);
    
    if (binsWithAI.length > 0) {
        console.log(`  ✅ Sensor-to-AI pipeline: Working`);
        console.log(`\n  Example AI data for ${binsWithAI[0].id}:`);
        console.log(`    Fill rate: ${binsWithAI[0].ai.fillRate || 'N/A'}`);
        console.log(`    Time to full: ${binsWithAI[0].ai.timeToFull || 'N/A'} hours`);
        console.log(`    Overflow risk: ${binsWithAI[0].ai.overflowRisk || 'N/A'}`);
        console.log(`    Priority: ${binsWithAI[0].ai.priority || 'N/A'}`);
        results.pipelines['sensor-to-ai'] = true;
    } else {
        console.log(`  ⚠️ Sensor-to-AI pipeline: No AI data yet (will populate within 5 seconds)`);
        results.pipelines['sensor-to-ai'] = 'pending';
    }
    
    // ═══════════════════════════════════════════════════════════
    // TEST 7: DRIVER AI INTEGRATION
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🚗 TEST 7: DRIVER AI INTEGRATION\n');
    
    const driverSystem = window.driverSystemV3Instance || window.enhancedDriverSystemComplete;
    if (driverSystem) {
        console.log(`  ✅ Driver system found`);
        
        const hasAIInsights = typeof driverSystem.getAIInsights === 'function';
        console.log(`  ${hasAIInsights ? '✅' : '❌'} AI insights available: ${hasAIInsights ? 'Yes' : 'No'}`);
        
        if (hasAIInsights) {
            try {
                const insights = driverSystem.getAIInsights();
                console.log(`  ✅ Driver AI working - insights received`);
                results.features['Driver AI'] = true;
            } catch (err) {
                console.log(`  ⚠️ Driver AI function exists but returned error`);
                results.features['Driver AI'] = 'partial';
            }
        } else {
            results.features['Driver AI'] = false;
        }
    } else {
        console.log(`  ⚠️ Driver system not loaded on this page`);
        results.features['Driver AI'] = 'n/a';
    }
    
    // ═══════════════════════════════════════════════════════════
    // TEST 8: FLEET AI INTEGRATION
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n🚛 TEST 8: FLEET AI INTEGRATION\n');
    
    if (typeof window.getFleetAIInsights === 'function') {
        try {
            const fleetInsights = window.getFleetAIInsights();
            console.log(`  ✅ Fleet AI insights available`);
            console.log(`     Total drivers: ${fleetInsights.totalDrivers || 0}`);
            console.log(`     Active routes: ${fleetInsights.activeRoutes || 0}`);
            console.log(`     Avg efficiency: ${(fleetInsights.averageEfficiency || 0).toFixed(1)}%`);
            console.log(`     Potential savings: ${(fleetInsights.potentialSavings || 0).toFixed(1)}%`);
            results.features['Fleet AI'] = true;
        } catch (err) {
            console.log(`  ⚠️ Fleet AI exists but returned error:`, err.message);
            results.features['Fleet AI'] = 'partial';
        }
    } else {
        console.log(`  ❌ Fleet AI not available`);
        results.features['Fleet AI'] = false;
        results.overall = false;
    }
    
    // ═══════════════════════════════════════════════════════════
    // TEST 9: REAL-TIME UPDATES
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n⚡ TEST 9: REAL-TIME UPDATES\n');
    
    // Test if updates trigger AI processing
    let updateReceived = false;
    const testListener = () => { updateReceived = true; };
    
    window.addEventListener('ai-insights', testListener, { once: true });
    
    console.log('  Testing: Triggering bin update to test AI processing...');
    
    if (bins.length > 0) {
        // Trigger an update
        const testBin = bins[0];
        window.dataManager?.updateBin(testBin.id, { fillLevel: testBin.fillLevel });
        
        // Wait for AI to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (updateReceived) {
            console.log('  ✅ Real-time AI processing: Working');
            results.features['Real-time AI'] = true;
        } else {
            console.log('  ⚠️ Real-time AI processing: No event received (may take longer)');
            results.features['Real-time AI'] = 'pending';
        }
    } else {
        console.log('  ⚠️ No bins available to test');
        results.features['Real-time AI'] = 'n/a';
    }
    
    window.removeEventListener('ai-insights', testListener);
    
    // ═══════════════════════════════════════════════════════════
    // FINAL RESULTS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VERIFICATION RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Count results
    const systemsConnected = Object.values(results.systems).filter(v => v === true).length;
    const systemsTotal = Object.keys(results.systems).length;
    
    const featuresConnected = Object.values(results.features).filter(v => v === true).length;
    const featuresTotal = Object.keys(results.features).length;
    
    const pipelinesActive = Object.values(results.pipelines).filter(v => v === true).length;
    const pipelinesTotal = Object.keys(results.pipelines).length;
    
    const functionsAvailable = Object.values(results.functions).filter(v => v === true).length;
    const functionsTotal = Object.keys(results.functions).length;
    
    console.log(`🧠 AI/ML Systems: ${systemsConnected}/${systemsTotal} connected`);
    console.log(`🔗 Features: ${featuresConnected}/${featuresTotal} integrated`);
    console.log(`⚡ Pipelines: ${pipelinesActive}/${pipelinesTotal} active`);
    console.log(`🌐 Global Functions: ${functionsAvailable}/${functionsTotal} available\n`);
    
    // Calculate overall score
    const totalTests = systemsTotal + featuresTotal + pipelinesTotal + functionsTotal;
    const totalPassed = systemsConnected + featuresConnected + pipelinesActive + functionsAvailable;
    const score = (totalPassed / totalTests) * 100;
    
    console.log(`📊 Overall Score: ${score.toFixed(1)}%\n`);
    
    if (score >= 90) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ EXCELLENT - AI/ML FULLY INTEGRATED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🌟 Your application has WORLD-CLASS AI/ML integration!\n');
    } else if (score >= 70) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ GOOD - AI/ML MOSTLY INTEGRATED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('⚠️ Some components may need attention.\n');
    } else {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️ NEEDS ATTENTION - SOME AI/ML SYSTEMS NOT CONNECTED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🔧 Please hard refresh: Ctrl + Shift + F5\n');
    }
    
    // ═══════════════════════════════════════════════════════════
    // DETAILED STATUS
    // ═══════════════════════════════════════════════════════════
    
    if (window.aimlMasterIntegration) {
        console.log('📊 DETAILED STATUS:\n');
        
        try {
            const status = getAIStatus();
            console.log(`  Version: ${status.version}`);
            console.log(`  Status: ${status.status}`);
            console.log(`  Initialized: ${status.initialized}`);
            console.log(`  Connected Systems: ${status.systems.length}`);
            console.log(`    ${status.systems.join(', ')}`);
            console.log(`  Active Pipelines: ${status.pipelines.realTime + status.pipelines.batch}`);
            
            console.log('\n  Metrics:');
            console.log(`    Predictions: ${status.metrics.predictions.total} (${(status.metrics.predictions.accuracy || 0).toFixed(1)}% accurate)`);
            console.log(`    Optimizations: ${status.metrics.optimizations.total} (${(status.metrics.optimizations.efficiency || 0).toFixed(1)}% successful)`);
            console.log(`    Avg Latency: ${(status.metrics.latency.avg || 0).toFixed(0)}ms`);
        } catch (err) {
            console.log('  ⚠️ Error getting detailed status:', err.message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // QUICK TESTS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 QUICK FUNCTIONALITY TESTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test 1: Get insights
    if (typeof getAIInsights === 'function') {
        try {
            const insights = getAIInsights();
            console.log('✅ Test 1: Get AI Insights - PASSED');
            console.log(`   Bins: ${insights.bins?.total || 0} total, ${insights.bins?.critical || 0} critical`);
        } catch (err) {
            console.log('❌ Test 1: Get AI Insights - FAILED:', err.message);
        }
    } else {
        console.log('❌ Test 1: Get AI Insights - NOT AVAILABLE');
    }
    
    // Test 2: Get recommendations
    if (typeof getAIRecommendations === 'function') {
        try {
            const recommendations = getAIRecommendations();
            const totalRecs = (recommendations.bins?.length || 0) + 
                            (recommendations.routes?.length || 0) + 
                            (recommendations.sensors?.length || 0);
            console.log('✅ Test 2: Get Recommendations - PASSED');
            console.log(`   Total recommendations: ${totalRecs}`);
        } catch (err) {
            console.log('❌ Test 2: Get Recommendations - FAILED:', err.message);
        }
    } else {
        console.log('❌ Test 2: Get Recommendations - NOT AVAILABLE');
    }
    
    // Test 3: Get metrics
    if (typeof getAIMetrics === 'function') {
        try {
            const metrics = getAIMetrics();
            console.log('✅ Test 3: Get AI Metrics - PASSED');
            console.log(`   Predictions: ${metrics.predictions?.total || 0}`);
            console.log(`   Optimizations: ${metrics.optimizations?.total || 0}`);
        } catch (err) {
            console.log('❌ Test 3: Get AI Metrics - FAILED:', err.message);
        }
    } else {
        console.log('❌ Test 3: Get AI Metrics - NOT AVAILABLE');
    }
    
    // Test 4: Fleet AI
    if (typeof getFleetAIInsights === 'function') {
        try {
            const fleetInsights = getFleetAIInsights();
            console.log('✅ Test 4: Fleet AI Insights - PASSED');
            console.log(`   Drivers: ${fleetInsights.totalDrivers || 0}`);
            console.log(`   Active routes: ${fleetInsights.activeRoutes || 0}`);
        } catch (err) {
            console.log('❌ Test 4: Fleet AI Insights - FAILED:', err.message);
        }
    } else {
        console.log('⚠️ Test 4: Fleet AI Insights - NOT AVAILABLE (may need page refresh)');
    }
    
    // ═══════════════════════════════════════════════════════════
    // RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (score >= 90) {
        console.log('✅ All systems connected! Try these commands:\n');
        console.log('   1. getAIInsights() - View current AI predictions');
        console.log('   2. getAIRecommendations() - Get actionable recommendations');
        console.log('   3. getFleetAIInsights() - View fleet performance');
        console.log('   4. generateAIReport("performance") - Generate detailed report\n');
    } else {
        if (Object.values(results.systems).some(v => v === false)) {
            console.log('⚠️ Some AI/ML systems not loaded:');
            console.log('   Action: Hard refresh (Ctrl + Shift + F5)\n');
        }
        
        if (Object.values(results.functions).some(v => v === false)) {
            console.log('⚠️ Some global functions not available:');
            console.log('   This may be normal if integration is still initializing');
            console.log('   Wait 5 seconds and run: verifyAIMLConnections()\n');
        }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
        score,
        passed: results.overall,
        results: results
    };
}

// Make available globally
window.verifyAIMLConnections = verifyAIMLConnections;

console.log('✅ AI/ML Connection Verification Script loaded');
console.log('💡 Run: verifyAIMLConnections()');
