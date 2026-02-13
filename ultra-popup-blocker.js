/**
 * ULTRA POPUP BLOCKER
 * Aggressively blocks ALL popup windows including Microsoft/Outlook sign-in
 */

(function() {
    'use strict';
    
    console.log('🛡️ ULTRA POPUP BLOCKER: Activating maximum protection...');
    
    // =================================================================
    // LAYER 1: Block window.open() completely
    // =================================================================
    
    const originalWindowOpen = window.open;
    const allowedUrls = [
        '/sensor-management.html',
        'localhost:3000',
        'maps.google.com',
        'tel:'
    ];
    
    window.open = function(url, target, features) {
        // Allow specific internal URLs
        if (url && allowedUrls.some(allowed => url.includes(allowed))) {
            console.log('✅ Allowing internal URL:', url);
            return originalWindowOpen.call(window, url, target, features);
        }
        
        // Block everything else (including Microsoft popups)
        console.log('🚫 BLOCKED popup attempt:', url);
        return null;
    };
    
    // =================================================================
    // LAYER 2: Disable Windows Credential Manager API
    // =================================================================
    
    if (window.PasswordCredential) {
        window.PasswordCredential = undefined;
    }
    
    if (window.FederatedCredential) {
        window.FederatedCredential = undefined;
    }
    
    if (navigator.credentials) {
        Object.defineProperty(navigator, 'credentials', {
            get: function() {
                return {
                    get: () => Promise.resolve(null),
                    store: () => Promise.resolve(),
                    create: () => Promise.resolve(null),
                    preventSilentAccess: () => Promise.resolve()
                };
            },
            configurable: false
        });
    }
    
    // =================================================================
    // LAYER 3: Block Microsoft Authentication Library
    // =================================================================
    
    // Block MSAL (Microsoft Authentication Library)
    if (window.Msal) {
        window.Msal = undefined;
    }
    
    // Block Microsoft Graph
    if (window.MicrosoftGraph) {
        window.MicrosoftGraph = undefined;
    }
    
    // =================================================================
    // LAYER 4: Intercept ALL popup-related events
    // =================================================================
    
    // Block beforeunload prompts that might trigger popups
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        delete e['returnValue'];
    }, true);
    
    // Block all external window.open calls
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target && target.target === '_blank') {
            const href = target.href || '';
            
            // Block Microsoft/OAuth URLs
            if (href.includes('microsoft') || 
                href.includes('outlook') || 
                href.includes('login.live') ||
                href.includes('oauth') ||
                href.includes('authorize')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚫 BLOCKED Microsoft link:', href);
                return false;
            }
        }
    }, true);
    
    // =================================================================
    // LAYER 5: Aggressive form protection
    // =================================================================
    
    function aggressiveFormProtection() {
        // Find all forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Disable autocomplete AGGRESSIVELY
            form.setAttribute('autocomplete', 'off');
            form.setAttribute('autoComplete', 'off');
            form.autocomplete = 'off';
            
            // Add multiple blocking attributes
            form.setAttribute('data-credential-type', 'none');
            form.setAttribute('data-lpignore', 'true');
            form.setAttribute('data-1p-ignore', 'true');
            form.setAttribute('data-bwignore', 'true');
            form.setAttribute('data-form-type', 'other');
            
            // Block form data API
            if (form.requestAutocomplete) {
                form.requestAutocomplete = undefined;
            }
        });
        
        // Find all password inputs
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.setAttribute('autocomplete', 'new-password');
            input.setAttribute('autoComplete', 'new-password');
            input.autocomplete = 'new-password';
            input.setAttribute('data-lpignore', 'true');
            input.setAttribute('data-1p-ignore', 'true');
            input.setAttribute('data-bwignore', 'true');
            input.setAttribute('data-form-type', 'other');
            input.setAttribute('data-credential-type', 'none');
        });
        
        // Find all text/username inputs
        const usernameInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
        usernameInputs.forEach(input => {
            if (input.id && (input.id.includes('user') || input.id.includes('login') || input.id.includes('email'))) {
                input.setAttribute('autocomplete', 'off');
                input.setAttribute('autoComplete', 'off');
                input.autocomplete = 'off';
                input.setAttribute('data-lpignore', 'true');
                input.setAttribute('data-1p-ignore', 'true');
                input.setAttribute('data-bwignore', 'true');
                input.setAttribute('data-form-type', 'other');
                input.setAttribute('data-credential-type', 'none');
            }
        });
    }
    
    // =================================================================
    // LAYER 6: Block popup windows at browser level
    // =================================================================
    
    // Override alert/confirm/prompt to prevent popup triggers
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;
    
    // Keep functionality but prevent Microsoft hijacking
    window.alert = function(message) {
        if (message && (message.includes('Microsoft') || message.includes('Outlook') || message.includes('Sign in'))) {
            console.log('🚫 BLOCKED Microsoft alert popup');
            return;
        }
        return originalAlert.call(window, message);
    };
    
    // =================================================================
    // LAYER 7: Monitor and block Microsoft authentication iframes
    // =================================================================
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.tagName === 'IFRAME') {
                    const src = node.src || '';
                    if (src.includes('microsoft') || 
                        src.includes('outlook') || 
                        src.includes('login.live') ||
                        src.includes('oauth') ||
                        src.includes('authorize')) {
                        console.log('🚫 BLOCKED Microsoft iframe:', src);
                        node.remove();
                    }
                }
            });
        });
    });
    
    // Start observing when body is available
    const startObserver = () => {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log('✅ Microsoft iframe blocker active');
        } else {
            setTimeout(startObserver, 50);
        }
    };
    
    // =================================================================
    // INITIALIZE EVERYTHING
    // =================================================================
    
    const initialize = () => {
        aggressiveFormProtection();
        startObserver();
        
        // Re-apply form protection every 500ms for first 5 seconds
        let count = 0;
        const interval = setInterval(() => {
            aggressiveFormProtection();
            count++;
            if (count >= 10) {
                clearInterval(interval);
            }
        }, 500);
        
        console.log('✅ ULTRA POPUP BLOCKER: Maximum protection active');
        console.log('   🛡️ All 7 layers activated');
        console.log('   🛡️ Microsoft/Outlook popups: BLOCKED');
        console.log('   🛡️ Credential manager: DISABLED');
        console.log('   🛡️ Password autofill: DISABLED');
    };
    
    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Re-apply after logout
    window.addEventListener('logout', function() {
        console.log('🔄 Re-applying popup protection after logout...');
        setTimeout(aggressiveFormProtection, 100);
    });
    
    // Re-apply on visibility change
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            aggressiveFormProtection();
        }
    });
    
})();

console.log('✅ Ultra Popup Blocker loaded - Microsoft popups will be BLOCKED');
