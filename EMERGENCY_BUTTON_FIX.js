/**
 * EMERGENCY BUTTON VISUAL FIX
 * =================================================
 * This script completely overrides the button update mechanism
 * and forces visual changes with !important styles
 * 
 * INSTRUCTIONS:
 * 1. Open browser console (F12)
 * 2. Copy this entire file
 * 3. Paste into console
 * 4. Press Enter
 * 5. Button should now update visually
 */

console.log('🚨 EMERGENCY BUTTON FIX - Initializing...');

// Override the updateStartRouteButton function completely
if (window.driverSystemV3Instance) {
    window.driverSystemV3Instance.updateStartRouteButton = function() {
        console.log('🔧 EMERGENCY: updateStartRouteButton override called');
        
        // Get fresh button element
        const button = document.getElementById('startRouteBtn');
        if (!button) {
            console.error('❌ EMERGENCY: Button not found!');
            return;
        }

        // Get fresh user data
        const user = window.dataManager.getUserById(this.currentUser.id);
        if (!user) {
            console.error('❌ EMERGENCY: User not found!');
            return;
        }

        // Update current user reference
        this.currentUser = user;

        // Determine state
        const status = user.movementStatus || 'stationary';
        const isOnRoute = status === 'on-route';

        console.log(`🔧 EMERGENCY: Updating button - Status: ${status}, OnRoute: ${isOnRoute}`);

        if (isOnRoute) {
            // END ROUTE STATE (RED)
            console.log('🔴 EMERGENCY: Setting to END ROUTE');
            
            // Remove all existing styles and classes
            button.removeAttribute('style');
            button.removeAttribute('class');
            
            // Apply new classes
            button.className = 'driver-action-card';
            
            // Force inline styles with !important via cssText
            button.style.cssText = `
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
                border: 2px solid #ef4444 !important;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5) !important;
                padding: 1.5rem !important;
                border-radius: 15px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                display: flex !important;
                align-items: center !important;
                gap: 1rem !important;
            `;
            
            // Rebuild innerHTML
            button.innerHTML = `
                <div class="action-icon-container">
                    <i class="fas fa-stop-circle" style="color: #fff !important; font-size: 1.5rem !important;"></i>
                    <div class="action-status-dot" style="background: #ef4444 !important; width: 12px !important; height: 12px !important; border-radius: 50% !important; box-shadow: 0 0 10px rgba(239, 68, 68, 0.7) !important; animation: pulse 2s infinite !important;"></div>
                </div>
                <div class="action-content" style="flex: 1 !important;">
                    <h4 class="action-title" style="color: #fff !important; font-weight: 600 !important; font-size: 1.1rem !important; margin: 0 !important;">End Route</h4>
                    <p class="action-subtitle" style="color: rgba(255,255,255,0.9) !important; font-size: 0.9rem !important; margin: 0.25rem 0 0 0 !important;">Currently on route - Click to finish</p>
                </div>
                <div class="action-arrow">
                    <i class="fas fa-chevron-right" style="color: #fff !important;"></i>
                </div>
            `;
            
            button.setAttribute('data-state', 'on-route');
            
            console.log('✅ EMERGENCY: Button set to END ROUTE (Red)');
            
        } else {
            // START ROUTE STATE (GREEN)
            console.log('🟢 EMERGENCY: Setting to START ROUTE');
            
            // Remove all existing styles and classes
            button.removeAttribute('style');
            button.removeAttribute('class');
            
            // Apply new classes
            button.className = 'driver-action-card';
            
            // Force inline styles with !important via cssText
            button.style.cssText = `
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                border: 2px solid #10b981 !important;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5) !important;
                padding: 1.5rem !important;
                border-radius: 15px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                display: flex !important;
                align-items: center !important;
                gap: 1rem !important;
            `;
            
            // Rebuild innerHTML
            button.innerHTML = `
                <div class="action-icon-container">
                    <i class="fas fa-play-circle" style="color: #fff !important; font-size: 1.5rem !important;"></i>
                    <div class="action-status-dot" style="background: #10b981 !important; width: 12px !important; height: 12px !important; border-radius: 50% !important; box-shadow: 0 0 10px rgba(16, 185, 129, 0.7) !important; animation: pulse 2s infinite !important;"></div>
                </div>
                <div class="action-content" style="flex: 1 !important;">
                    <h4 class="action-title" style="color: #fff !important; font-weight: 600 !important; font-size: 1.1rem !important; margin: 0 !important;">Start Route</h4>
                    <p class="action-subtitle" style="color: rgba(255,255,255,0.9) !important; font-size: 0.9rem !important; margin: 0.25rem 0 0 0 !important;">Ready to begin collection</p>
                </div>
                <div class="action-arrow">
                    <i class="fas fa-chevron-right" style="color: #fff !important;"></i>
                </div>
            `;
            
            button.setAttribute('data-state', 'stationary');
            
            console.log('✅ EMERGENCY: Button set to START ROUTE (Green)');
        }

        // Force DOM reflow
        button.offsetHeight;
        button.offsetWidth;
        
        // Force repaint
        button.style.display = 'none';
        button.offsetHeight;
        button.style.display = 'flex';

        console.log(`✅ EMERGENCY: Button visual update COMPLETE - State: ${button.getAttribute('data-state')}`);
    };

    console.log('✅ EMERGENCY: Button update function overridden successfully');
    
    // Force immediate update
    setTimeout(() => {
        console.log('🔄 EMERGENCY: Forcing immediate button update...');
        window.driverSystemV3Instance.updateStartRouteButton();
    }, 100);

} else {
    console.error('❌ EMERGENCY: Driver System V3 not found!');
}

// Add pulse animation if not exists
if (!document.getElementById('emergency-button-pulse')) {
    const style = document.createElement('style');
    style.id = 'emergency-button-pulse';
    style.innerHTML = `
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.7;
                transform: scale(1.2);
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ EMERGENCY: Pulse animation added');
}

console.log('🎉 EMERGENCY BUTTON FIX - Complete!');
console.log('📝 The button should now update visually when you click it');
console.log('🔄 Try clicking the Start/End Route button now');

