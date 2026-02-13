/**
 * SIMPLE FIX: Prevent Duplicate Login Overlay Shows
 * Ensures login overlay can only be shown ONCE at a time
 */

(function() {
    'use strict';
    
    console.log('🔒 Loading duplicate login preventer...');
    
    let isLoginOverlayCurrentlyShowing = false;
    let loginOverlayShowAttempts = 0;
    
    // Wait for DOM
    function init() {
        const loginOverlay = document.getElementById('loginOverlay');
        if (!loginOverlay) {
            setTimeout(init, 100);
            return;
        }
        
        // Create a getter/setter proxy for the style property
        const originalStyleDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
        
        Object.defineProperty(loginOverlay, 'style', {
            get: function() {
                const style = originalStyleDescriptor.get.call(this);
                
                // Wrap the display property setter
                const originalDisplayDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'display');
                
                if (originalDisplayDescriptor && originalDisplayDescriptor.set) {
                    const originalSet = originalDisplayDescriptor.set;
                    
                    Object.defineProperty(style, 'display', {
                        set: function(value) {
                            // If trying to show (flex or block)
                            if (value === 'flex' || value === 'block') {
                                loginOverlayShowAttempts++;
                                
                                // If already showing, block duplicate
                                if (isLoginOverlayCurrentlyShowing) {
                                    console.log('🚫 BLOCKED duplicate login overlay show (attempt #' + loginOverlayShowAttempts + ')');
                                    console.trace('Blocked call from:');
                                    return; // Don't allow
                                }
                                
                                // First time showing is OK
                                console.log('✅ Login overlay showing (attempt #' + loginOverlayShowAttempts + ')');
                                isLoginOverlayCurrentlyShowing = true;
                                
                                // Reset counter after 3 seconds
                                setTimeout(() => {
                                    loginOverlayShowAttempts = 0;
                                }, 3000);
                            } else if (value === 'none') {
                                // Hiding is always OK
                                isLoginOverlayCurrentlyShowing = false;
                                loginOverlayShowAttempts = 0;
                            }
                            
                            // Call original setter
                            return originalSet.call(this, value);
                        },
                        get: originalDisplayDescriptor.get
                    });
                }
                
                return style;
            },
            set: originalStyleDescriptor.set
        });
        
        console.log('✅ Duplicate login preventer active');
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

console.log('✅ Duplicate login preventer loaded');
