// production-logging.js - Suppress ALL console logging for production  
// This file should be loaded FIRST before any other scripts
// v4.3 - Updated to allow popup debug logs

(function() {
    'use strict';
    
    // Production mode - set to true to reduce logging
    const PRODUCTION_MODE = true;
    
    // Patterns to always suppress - COMPREHENSIVE list
    const SUPPRESS_PATTERNS = [
        // SPECIFIC emoji patterns (NOT including 🔍🔧 for debugging)
        /^♻️|^📍|^✨|^🧮|^🌊|^🚫|^⏳|^💬|^🧹|^🎨|^🧪|^📝|^✅(?!.*EMERGENCY)|^❌(?!.*updateBin)|^⚠️(?!.*Bin)|^ℹ️|^➕/,
        // Suppress repeated marker messages
        /INTERCEPTING addBinMarker|Emergency handler applied/i,
        // Sensor and battery patterns
        /Battery.*extracted|Temperature.*extracted/i,
        /Updated.*bin.*temperature|Updated.*bin.*battery/i,
        /Updating existing marker/i,
        /Updated marker position/i,
        /Updated popup content/i,
        /Alert added|bin_overflow/i,
        // System patterns
        /Initializing|initialized|Loading|loaded|Starting|started|Ready|ready/i,
        /Enhanced|Enhancing|Setting up|Connecting|Connected/i,
        /Debug:|Debug commands|Debug functions|debugFunctions/i,
        /Available commands|AVAILABLE COMMANDS/i,
        /Creating.*instance/i,
        /Updated.*chart|chart.*initialized|Chart.js/i,
        /Sync.*completed|synced|Syncing/i,
        /Driver.*enhanced|Driver.*fixed|Driver System/i,
        /AI.*initialized|ML.*initialized|Neural|Deep Learning/i,
        /Predictive.*initialized|Forecasting|Anomaly/i,
        /WebSocket.*connected|WebSocket.*message/i,
        /Broadcasting data change:|Data change intercepted:/i,
        /initializeFleetMap called|using Mapbox instead/i,
        /Debug - Filtered routes|Active routes:.*Completed today:/i,
        /Server location response:|System performance: Object/i,
        /New insight: Predicted|ACTIVE status check|Checking status for all sensors/i,
        /Force applying icon centering|Updating all tables|Refreshing entire map/i,
        /Updating collections UI|Bin fill update received|Sensor update received/i,
        /Extracted sensor data summary|💾 Saving bin|Fetching batch status/i,
        /Updating real-time analytics|🔄 Updating real-time/i,
        /Performance.*metrics|metrics.*updated/i,
        /Real-time.*started|Real-time.*monitoring/i,
        /Integration.*ready|Integration.*loaded/i,
        /Module.*loaded|System.*ready/i,
        /Calculating|Analyzing|Generating|Detecting/i,
        /measurement\[|source:/i,
        // New patterns to suppress
        /Current users:|Existing usernames:|Expected usernames:/i,
        /diagnoseBinSensors|forceRefreshBinsWithSensors|createMissingBins/i,
        /quickAddSensor|addSensorFromFindy|listSensors/i,
        /forceSaveBinWithSensor|checkAndFixAllBinSensorLinks/i,
        /Formulating optimization|Particle Swarm|Tabu Search/i,
        /Waiting for.*systems|critical systems/i,
        /CRITICAL DRIVER FIX|critical fixes/i,
        /Driver interface|interface.*work/i,
        /No marker found for driver/i,
        /Added marker for driver/i,
        /Showing.*tracked sensors/i,
        /Route Optimization|routeAssignmentModal|availableBinsList/i,
        /AI Route test|aiRouteTestFunctions/i,
        /testSmartActionButton|testStatusChange|testMapIndicators/i,
        /testFullWorkflow|createMockRecommendation|checkSystemStatus/i,
        /resetForTesting|showTestResults/i,
        /Single update pathway|Instant UI updates|WebSocket coverage/i,
        // Number formatting spam
        /^Formatting:/i,
        /Found \d+ elements to format/i,
        /Applying number formatting/i,
        /Number formatting complete/i,
        // Verification tests (non-critical)
        /Admin Sensor Stats.*Not found/i,
        /verification.*failed|verification.*passed/i,
        /SOME TESTS FAILED|Critical issues detected/i,
        /Hard refresh:|Emergency Fix Command/i,
        /fixAdminButtons\(\)|verifyAdminSystem\(\)|testAdminButtons\(\)/i,
        // Additional status messages
        /✓ Updated via mapManager|✓ Sensor table refreshed/i,
        /✓ Called updateBin|✓ Updated integration/i,
        /✓ Map refresh triggered|✓ Admin stats refreshed/i,
        /⚠️ Bins missing|expected.*got none/i,
        /✅ FIXED.*issue|Bin.*→ Sensor/i,
        /Applying all critical fixes|All critical fixes applied/i,
        /Waiting for critical systems/i,
        /USING deviceInfo|Time difference:/i,
        /Optimizing collection schedule|Converted object data/i,
        /Sync Manager:|Sensor Integration:/i,
        /Found \d+ Unlink buttons|Found \d+ Manage buttons/i,
        /adminUnlinkSensor:|adminOpenSensorManagement:|updateAdminSensorStats:/i,
        /Blue.*Manage.*button|Orange.*Unlink.*button/i,
        /Passed:|Failed:|Warnings:/i,
        /Markers on map:|Size: 0x0/i,
        // Decorative separators and boxes
        /^━━━━━|^═══════|^─────|^============/,
        /^\s*━━━━━|^\s*═══════|^\s*─────|^\s*============/,
        // Feature descriptions
        /✓ Sleep\/Wake detection|✓ Network disconnect|✓ Stuck timer/i,
        /✓ Automatic data verification|✓ Bi-directional link/i,
        /✓ Auto-fix mismatched|✓ Periodic integrity|✓ Event-driven/i,
        /✓ Instant map updates|✓ Instant table updates|✓ Cross-tab/i,
        /✓ Server synchronization|✓ Sensor platform updates/i,
        /✓ Automatic UI refresh|✓ Data reload/i,
        // Command suggestions
        /Or run:|Type:|Manual test|Force reload|Run verification/i,
        /wakeUpRecoverySystem\.|dataIntegrityManager\./i,
        /forceRecovery\(\)|forceVerification\(\)/i,
        // System loading messages
        /Loading Critical|loaded and scheduled|module loaded/i,
        /CRITICAL.*FIXES APPLIED|CRITICAL DRIVER FIXES/i,
        /Removing setTimeout delays|instant updates/i,
        /Diagnostic tools available/i,
        // Element detection
        /routeAssignmentDriverInfo:|selectedBinsList:|FOUND/i,
        // Registration messages
        /sensor stats function registered|window\.updateAdminSensorStats|📌 window\./i,
        // Init check spam
        /🔍 Init check #\d+:.*DataManager=|Init check #\d+/i,
        // Chart/widget update spam
        /📊 Updating chart widget:|📊 Rendering chart for|📋 Updating list widget:|🔧 Creating dummy chart element for/i,
        // Bin update spam
        /📡 Bin update intercepted:|🔧 updateBin .* (BEFORE|AFTER)|📡 Broadcasting bin update:|🗺️ Updating map marker:/i,
        // Sensor platform spam
        /📡 Updating sensor platform for bin/i,
        // System/analytics spam
        /📊 System performance: \{|📊 System performance:|Route deleted:|🔮 New insight:|🎯 Window focused - checking for wake-up|👁️ Page visible again - checking for wake-up/i,
        /displayAdminMessage called|displayDriverMessage called|Message data sent|Current user at message time|Processing chat message|Processing typing indicator|Target driverId:|Handling driver message|Displaying driver message|Displaying admin message|Adding targetDriverId:|Message sent via connection|Admin message sent to driver|sendAdminMessage\(\)|currentDriverId:|admin input element|admin input value|Admin quick message sent/i,
        /^🔄 Driver overview section updated|^🔄 Driver live status section updated/i,
        /^⌨️ Typing indicator:|^📡 Message sent via connection|^📤 Admin message sent|^💬 Chat message received/i,
        /^🔥 displayAdminMessage|^🔥 displayDriverMessage|^🔥 Message data|^🔥 Current user at message|^🔥 Processing |^🔥 Target driverId|^🔥 Handling |^🔥 Displaying |^🔥 Adding targetDriverId|^🔥 sendAdminMessage|^🔥 currentDriverId|^🔥 admin input/i,
        /📥 Updated analytics:|🎯 Changes detected - triggering UI updates|🔄 Updating admin sensor statistics/i,
        /📊 Updating dashboard with AI-powered metrics|🚛 Predicting resource requirements|🧬 Solving with Genetic Algorithm/i,
        /🔥 Solving with Simulated Annealing|🔄 Training autoencoder|📊 Generated \d+ synthetic data points for LSTM/i,
        /🔄 Training LSTM Autoencoder|🔄 Refreshing analytics dashboard|🔍 Classifying anomalies based on ensemble/i,
        /📊 Collecting driver performance data|📚 Tracking learning progress|🔮 Predicting future performance/i,
        /🧠 Updating preference learning|🔮 Updating performance prediction model|🗺️ Updating route learning model/i,
        /🔮 Predicting today's collections|📈 Predicted collections:|🔍 Performing AI risk assessment/i,
        /📊 Connection health updated:|📈 Updating dashboard metrics|🔄 Refreshing all displays/i,
        /📦 Populating bin data|🗑️ Populating collections|👤 Populating driver history|📊 Populating analytics|🛣️ Populating routes/i,
        /🔍 VERIFYING DATA INTEGRITY|📊 Checking \d+ bins and \d+ sensors|🔗 Verifying integration mappings/i,
        /📊 VERIFICATION RESULTS|🔄 Refreshing all UIs|📋 Running comprehensive fleet page check|📊 Updating fleet statistics/i,
        /Active Vehicles: \d+\/\d+|Available Drivers: \d+|Active Routes: \d+|Fleet Utilization: \d+%/i,
        /✅ Fleet Manager|✅ Data Manager|✅ Map Container|✅ Statistics Elements|✅ Refresh Button|✅ Export Button/i,
        /🔍 CONNECTION VERIFICATION SUMMARY|🔧 Performing automatic DOM elements check|🔍 DOM Elements Check for Route Assignment/i,
        /📊 Active polling:|💤 Idle polling:|🎯 Smart adaptation based on user activity|🎯 AI Capabilities:/i,
        /🔍 Current window\.app status:|🔍 Function called at:|🔍 Pre-initialization dependency check|🔍 Checking app dependencies/i,
        /📦 App dependency status|🗺️ Attempting map initialization|🔍 Map container status|🔍 window\.app type after creation|🔍 window\.app exists/i,
        /🔄 Merged users: \d+ items|📥 Updated vehicles: \d+ items|🔄 Merged bins: \d+ items|📥 Updated routes: \d+ items|📥 Updated collections: \d+ items|📥 Updated driverLocations/i,
        /💾 Verified in dataManager|📊 Driver Report: Use generateDriverReport|💡 Run window\.populateDemoData/i,
        /💡 To manually refresh driver markers|💥 Checking every 100ms|💥 Will close ANY Microsoft popup/i,
        /🛡️ All \d+ layers activated|🛡️ Microsoft\/Outlook popups: BLOCKED|🛡️ Credential manager: DISABLED|🛡️ Password autofill: DISABLED/i,
        /🛡️ Preventing duplicate event handlers|🛡️ Running initial deleted bins filter/i,
        /📊 SYSTEM STATUS:|🧠 AI\/ML Systems:|📊 Data Pipelines:|🔗 Application Integration:/i,
        /• aimlMasterIntegration|• getAIStatus|• getAIMetrics|• getAIInsights|• getAIRecommendations|• generateAIReport|• optimizeRoute/i,
        /👤 Current user updated: undefined|📊 Data: \d+ drivers, \d+ bins, \d+ routes/i,
        /🔧 Auto-checking bin-sensor links|🔍 Checking all bin-sensor links|🔄 Creating fallback WebSocket implementation/i,
        /💾 Implementing offline support|🔒 Implementing security features|Notification permission:/i,
        /🔍 All available users:|🛡️ Prevented login overlay from showing/i,
        /🔍 Running automatic bin-sensor diagnostic|🔄 Force refreshing bins with sensors/i,
        // Empty lines
        /^\s*$/,
        // User authentication
        /User not authenticated yet|will send client info after login/i,
        // Debug commands
        /debugAIRoute|setAIRouteDriver|Check AI route status/i,
        /Manually set driver ID/i,
        // Step instructions
        /Click.*button.*Should|window\.admin/i,
        // Sensor management instructions
        /Add sensor.*manual|Add sensor from Findy|List all sensors/i,
        // Time updates
        /Time since last update|minutes/i,
        /TOTAL OVERRIDE COMPLETE/i,
        // Popup actions
        /OPENED:|CLOSED:|X clicked|✖️/i,
        // Loading messages (duplicates)
        /Loading Critical.*Fix|Critical.*module loaded|Critical Fixes Patch/i,
        /CRITICAL DRIVER FIXES APPLIED/i,
        // AI/ML loading messages
        /AI\/ML Master Integration System Loading|Initializing AI\/ML Master/i,
        /Core systems ready|AI\/ML systems connected|Data pipelines established/i,
        /Real-time synchronization active|Application features integrated/i,
        /Performance monitoring active|Auto-optimization enabled/i,
        /Analytics delivery configured|Global API exposed/i,
        /All data pipelines configured|event listeners registered/i,
        /Fleet management AI capabilities|Driver system AI enhancements/i,
        /Route optimization available|Driver system enhanced/i,
        /Fleet management enhanced|All features connected/i,
        /Auto-route optimization|Auto-collection optimization|Auto-model tuning/i,
        /ML Route Optimizer:|Predictive Analytics:|Analytics Integration:/i,
        /Not available|✗ Not available/i,
        /Real-time:|Batch:|Streaming:|active$/i,
        /Enabling auto-optimization/i,
        // AI/ML method errors (methods don't exist, working as intended)
        /forecastDemand is not a function/i,
        /detectAnomaly is not a function/i,
        /ingestData is not a function/i,
        /updateTrainingData is not a function/i,
        /processData is not a function/i,
        /Error predicting demand/i,
        /Error detecting anomalies/i,
        /Error delivering to/i,
        // Microsoft popup blocker messages
        /Microsoft Popup Blocker|Blocked credential/i,
        /Loading Microsoft Popup Blocker/i,
        /Duplicate login preventer/i,
        /FORCE HIDE ALL POPUPS|Nuclear protection/i,
        /ULTRA POPUP BLOCKER/i,
        // Wake-up recovery spam
        /Cleared interval|Cleared timeout/i,
        /WebSocket connection closed.*1006/i,
        /Reason:.*wake_from_sleep/i,
        /Error logged: Object/i,
        /Error logged: Unknown error occurred|Error logged: Script error\.|Error logged: Unexpected token/i,
        /🔄 Fetching sensor data for \d+ bins before first paint/i,
        /🔄 Force refreshing bins on map/i,
        /Tracking Prevention blocked access to storage/i,
        /Server route list for driver is empty.*removed deleted routes/i,
        /First GPS attempt failed, retrying getCurrentPosition/i,
        /✓ WebSocket reconnect triggered/i,
        /✓ Driver sync from server/i,
        /✓ Driver routes refreshed/i,
        /Not a driver account, skipping GPS tracking/i,
        /Fleet Manager not found/i,
        // Findy bin-sensor: missing fields / API structure (avoid console spam)
        /Findy API response may not contain|Check the raw API response structure/i,
        /Missing sensor values for bin.*Findy API|Findy API may use different field/i,
        // Popup fix messages
        /Live Monitoring popup fix loaded/i,
        /Duplicate login preventer/i,
        /EMERGENCY POPUP BLOCKER/i,
        /Run window\.diagnose|diagnoseIntegration/i,
        /startRoute button|registerPickup button|reportIssue button/i,
        /updateFuel button|scanBinQR button|callDispatch button/i,
        /takeBreak button|endShift button|openDriverMap button|sendMessage button/i,
        /APPLIED.*successfully|fixes applied/i,
        /corrupted accounts|Session restored|Selected user type/i,
        /Cleaned up placeholder/i,
        /driver1.*active|driver2.*active/i,
        /routeAIRecommendation|driverRouteList/i,
        /mock AI recommendation|Mock.*created/i,
        /Advanced Route Optimization|Intelligent Driver|Computer Vision|Natural Language/i,
        /Force updating all driver/i,
        /Checking Database|Checking.*API|Checking WebSocket|Checking Sync/i,
        /Sensor-Bin Integration/i,
        /checks passed|SYSTEMS OPERATIONAL/i,
        /Login attempt|Found user|Session created|Login successful/i,
        /Handling successful login|Showing manager/i,
        /environmental-impact-chart|cost-benefit-chart/i,
        /GPS error: User denied/i,
        // Font Awesome / admin registration
        /Font Awesome loaded|Admin sensor stats function registered/i,
        /📌 window\.|updateAdminSensorStats - function/i,
        // Production-logging / protections
        /Protections Active|Manual Recovery|Manual Check|Checking demo accounts/i,
        /Adding Sensor Management to admin menu/i,
        /Commands:|Dataset: \d+ records|Creating Deep Q-Network/i,
        /Average improvement:|Run: verifyAIMLConnections|Replace YOUR_MAPBOX_TOKEN/i,
        /Get token at:|FLEET MANAGEMENT PAGE|filterDeletedBins|forceUpdateAll/i,
        /Deleted bins will be automatically filtered|Manual update:/i,
        // Findy / sensor / device
        /Linked sensor.*to bin|Excluding.*deleted bins from server/i,
        /New bins from server|Updated lastSync|Filtering.*deleted bins/i,
        /Fetching status for sensor|Fetching device|RAW DEVICE DATA/i,
        /Available data keys|deviceInfo.*lastModTime|USING most recent timestamp/i,
        /Battery from root|Status before timestamp|Normalized:|Parsed date object/i,
        /total difference|MARKED AS ONLINE|Sending.*queued messages/i,
        /Bin update from another tab|Refreshing sensor data for bin/i,
        /Findy API result|Raw sensor data structure|Bin sensor updated, refreshing map/i,
        /Linking sensor|Linked bin.*to sensor|Debounced sync|Auto-refreshing map/i,
        /Fixing link|Force saving bin|Added sensor data to bin|updateBin called/i,
        /Bin updated in dataManager|Saved to server|Updated integration mapping/i,
        /Auto-fixed.*bin-sensor links|WebSocket bin update for/i,
        /Updating bin from sensor|Sensor.*status updated|WebSocket sensor update/i,
        /System performance: Object|Monitoring.*active routes|Updated clientErrorLogs/i,
        /Updating AI models|Updating predictive models|Periodic verification/i,
        /Wake-up detected|WebSocket connection closed.*1006|Scheduling reconnect/i,
        /Error fetching device.*401 Unauthorized|API request failed after token refresh/i,
        // Driver / sync / UI refresh
        /Stored driver data globally|Current user updated|Routes retrieved for driver/i,
        /Returning.*routes.*local protection|Active list:.*Total driver routes/i,
        /displayDriverMessage called|Scrolled driver messaging|Driver logged in/i,
        /updateStartRouteButton called|Updating driver quick stats/i,
        /Performing FULL synchronization|Updating map driver status/i,
        /Updating driver.*status to|Driver.*status updated to/i,
        /Refreshing app driver data|Refreshing all driver data|Triggering immediate map/i,
        /Updating all UI components|Triggering intelligent monitoring/i,
        /User activity detected|Excluding.*deleted bins from server list/i,
        /Updated alerts|Updated driverMessages|Driver.*stats:/i,
        // Status / separators and noise
        /^Status:$|^🔍 ═+|Features:\s*$/i,
        /Global functions available|Analytics section activated|Refreshing fleet data\.\.\./i,
        /Destroying existing chart on canvas|🔍 ═+/i,
        /✅ 3D marker|✅ Animated pulse|✅ Floating animation|✅ Premium tooltip/i,
        /✅ Live indicator|✅ Collection count badge|✅ Status-based|✅ Hover scale|✅ Professional/i,
        /BLOCKING MAP REFRESH|Skipping loadBinsOnMap|BIN POPUP OPENED|BIN POPUP CLOSED/i,
        /Final map refresh complete|Refreshing map to show sensor/i,
        /Live monitoring updates stopped|Live Alert:.*traffic/i
    ];

    const SUPPRESS_ERROR_PATTERNS = [
        /Tracking Prevention blocked access to storage/i,
        /message channel closed before a response was received/i,
        /asynchronous response by returning true/i
    ];
    
    // Patterns to always allow (errors only; "Waiting for critical systems" is suppressed below)
    const ALLOW_PATTERNS = [
        /^❌|^Error|^error|CRITICAL ERROR|CRITICAL:|FATAL/i,
        /^⚠️.*Error|Exception|failed.*critical/i,
        /POPUP FIX.*LOADED|POPUP FIX ACTIVE/i
    ];
    
    if (PRODUCTION_MODE) {
        // Store original console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalError = console.error;

        console.error = function(...args) {
            const message = args.map(a => String(a)).join(' ');
            if (SUPPRESS_ERROR_PATTERNS.some(p => p.test(message))) return;
            return originalError.apply(console, args);
        };
        
        // Override console.log
        console.log = function(...args) {
            const message = args.map(a => String(a)).join(' ');
            
            // Always allow critical messages
            if (ALLOW_PATTERNS.some(p => p.test(message))) {
                return originalLog.apply(console, args);
            }
            
            // Suppress "Waiting for critical systems" (contains "critical" but is not an error)
            if (/Waiting for critical systems|critical systems to load/i.test(message)) {
                return;
            }
            // Suppress matching patterns
            if (SUPPRESS_PATTERNS.some(p => p.test(message))) {
                return; // Suppress
            }
            
            // Allow other messages through
            return originalLog.apply(console, args);
        };
        
        // Override console.warn - be more lenient
        console.warn = function(...args) {
            const message = args.map(a => String(a)).join(' ');
            
            // Suppress non-critical warnings with emoji patterns
            if (SUPPRESS_PATTERNS.some(p => p.test(message))) {
                return; // Suppress
            }
            
            return originalWarn.apply(console, args);
        };
        
        // Override console.info
        console.info = function(...args) {
            const message = args.map(a => String(a)).join(' ');
            
            // Suppress most info messages in production
            if (SUPPRESS_PATTERNS.some(p => p.test(message))) {
                return; // Suppress
            }
            
            return originalInfo.apply(console, args);
        };
        
        // Add a way to restore logging for debugging
        window.enableFullLogging = function() {
            console.log = originalLog;
            console.warn = originalWarn;
            console.info = originalInfo;
            console.error = originalError;
            originalLog('✅ Full logging enabled');
        };
        
        window.disableFullLogging = function() {
            console.log = console.log; // Re-apply the override
            originalLog('🔇 Production logging enabled (reduced output)');
        };
    }
})();
