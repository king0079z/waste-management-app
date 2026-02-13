/**
 * DISABLE MICROSOFT/OUTLOOK SIGN-IN POPUP
 * Aggressively prevents Microsoft credential manager and Outlook popups
 */

(function() {
    'use strict';
    
    console.log('🔒 Loading Microsoft Popup Blocker...');
    
    // Block Windows Credential Manager
    function blockCredentialManager() {
        // Override credential manager API if it exists
        if (window.navigator && window.navigator.credentials) {
            const originalGet = window.navigator.credentials.get;
            window.navigator.credentials.get = function() {
                console.log('🚫 Blocked credential manager request');
                return Promise.resolve(null);
            };
            
            const originalStore = window.navigator.credentials.store;
            window.navigator.credentials.store = function() {
                console.log('🚫 Blocked credential store request');
                return Promise.resolve();
            };
            
            const originalCreate = window.navigator.credentials.create;
            window.navigator.credentials.create = function() {
                console.log('🚫 Blocked credential create request');
                return Promise.resolve(null);
            };
        }
    }
    
    // Disable autofill on all password fields
    function disablePasswordAutofill() {
        const enforceAttributes = () => {
            // Find all password inputs
            const passwordInputs = document.querySelectorAll('input[type="password"]');
            passwordInputs.forEach(input => {
                input.setAttribute('autocomplete', 'new-password');
                input.setAttribute('data-lpignore', 'true');
                input.setAttribute('data-form-type', 'other');
                input.setAttribute('data-1p-ignore', 'true');  // 1Password
                input.setAttribute('data-bwignore', 'true');   // Bitwarden
            });
            
            // Find all text inputs in login forms
            const textInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
            textInputs.forEach(input => {
                if (input.id === 'username' || input.id.includes('user') || input.id.includes('login')) {
                    input.setAttribute('autocomplete', 'off');
                    input.setAttribute('data-lpignore', 'true');
                    input.setAttribute('data-form-type', 'other');
                    input.setAttribute('data-1p-ignore', 'true');
                    input.setAttribute('data-bwignore', 'true');
                }
            });
            
            // Disable autocomplete on all forms
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                if (form.id.includes('login') || form.id.includes('registration')) {
                    form.setAttribute('autocomplete', 'off');
                }
            });
        };
        
        // Apply immediately
        enforceAttributes();
        
        // Re-apply on DOM changes
        const observer = new MutationObserver(() => {
            enforceAttributes();
        });
        
        // Start observing after page load
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    // Intercept form submissions to prevent credential manager
    function interceptFormSubmissions() {
        document.addEventListener('submit', function(event) {
            const form = event.target;
            
            // Check if it's a login form
            if (form.id === 'loginForm' || form.id === 'registrationForm') {
                // Ensure autocomplete is disabled
                form.setAttribute('autocomplete', 'off');
                
                // Mark that we handled this form (prevent credential manager)
                form.setAttribute('data-credential-handled', 'true');
            }
        }, true);
    }
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            blockCredentialManager();
            disablePasswordAutofill();
            interceptFormSubmissions();
            console.log('✅ Microsoft popup blocker active');
        });
    } else {
        blockCredentialManager();
        disablePasswordAutofill();
        interceptFormSubmissions();
        console.log('✅ Microsoft popup blocker active');
    }
    
    // Re-apply after logout
    window.addEventListener('logout', function() {
        setTimeout(() => {
            disablePasswordAutofill();
        }, 100);
    });
    
})();

console.log('✅ Microsoft Popup Blocker loaded');
