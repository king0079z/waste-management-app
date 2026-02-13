# 🔍 POPUP DEBUG GUIDE

## 🎯 LET'S IDENTIFY THE EXACT ISSUE

I've added monitoring to detect **duplicate login overlay shows**. Now let's debug together!

---

## 🔥 **STEP 1: Hard Refresh and Check Console**

```
Ctrl + Shift + F5
```

**Look for this in console:**
```
✅ Login overlay monitor active (prevents duplicate shows)
✅ FORCE HIDE ALL POPUPS: Active
   💥 Checking every 100ms
   💥 Will close ANY Microsoft popup immediately
```

---

## 🔍 **STEP 2: Logout and Watch Console**

```
1. Click Logout
2. Watch console carefully

Expected messages:
✅ Login overlay shown (legitimate)
```

**If you see:**
```
🚫 BLOCKED duplicate login overlay show (attempt #2)
```

**This means something is trying to show it TWICE!**

---

## 🔍 **STEP 3: Login and Watch Console**

```
1. Enter credentials
2. Click Login
3. Watch console

Expected:
✅ Login successful
✅ Login overlay hidden
```

**If overlay shows again, console will say:**
```
🚫 BLOCKED duplicate login overlay show (attempt #2)
```

---

## 🧪 **DEBUGGING COMMANDS:**

### **Check popup blocker status:**
```javascript
getPopupBlockerStatus();

// Shows:
{
    active: true,
    blockedCount: X,  // How many popups were blocked
    monitoring: true
}
```

### **Watch for login overlay changes:**
```javascript
// In console, run this BEFORE logging out:
const loginOverlay = document.getElementById('loginOverlay');
const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
        console.log('👀 Login overlay changed:', m.target.style.display);
        console.trace('Called from:');  // Shows who called it
    });
});
observer.observe(loginOverlay, { attributes: true, attributeFilter: ['style'] });

// Then logout and login
// Console will show WHO is changing the display!
```

---

## 📊 **POSSIBLE CAUSES:**

### **1. Form Submission Handler**
```
User submits form
    ↓
Handler validates
    ↓
If error: Shows login overlay again ❌
```

### **2. Authentication Check**
```
User logs out
    ↓
Some script checks auth
    ↓
Sees no user
    ↓
Shows login overlay again ❌
```

### **3. Event Listener Duplicate**
```
Login form has 2 event listeners
    ↓
User submits
    ↓
Both fire
    ↓
First: Login succeeds, hides overlay
Second: Checks auth, shows overlay again ❌
```

### **4. CSS Default State**
```
Login overlay has: display: flex (in CSS)
    ↓
After logout, set to: display: flex (explicit)
    ↓
Some script resets inline styles
    ↓
Falls back to CSS default: display: flex ❌
```

---

## 🎯 **IMMEDIATE FIX TO TRY:**

Run this in console AFTER hard refresh:
```javascript
// Force disable ANY attempts to show login overlay multiple times
let loginShowCount = 0;
const originalGetElementById = document.getElementById;

document.getElementById = function(id) {
    const element = originalGetElementById.call(document, id);
    
    if (id === 'loginOverlay' && element) {
        const originalStyleSetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style').get.call(element);
        
        Object.defineProperty(element, 'style', {
            get: function() {
                return new Proxy(originalStyleSetter, {
                    set: function(target, property, value) {
                        if (property === 'display' && (value === 'flex' || value === 'block')) {
                            loginShowCount++;
                            if (loginShowCount > 1) {
                                console.log('🚫 PREVENTED duplicate login overlay show');
                                return true;
                            }
                        }
                        return Reflect.set(target, property, value);
                    }
                });
            }
        });
    }
    
    return element;
};

console.log('✅ Login overlay protection active');
```

---

## 📸 **I NEED FROM YOU:**

### **When popup appears:**

1. **Take screenshot** of the popup
2. **Copy console output** (all messages)
3. **Tell me:**
   - What exact step causes it? (opening app, logout, login?)
   - Does it say "Sign in" or "Microsoft account"?
   - Is it a white dialog or branded Microsoft blue?
   - Can you see the browser address bar behind it?

---

## 🔥 **TEMPORARY WORKAROUND:**

While we debug, you can use this:

```javascript
// Run this in console after page loads:
setInterval(() => {
    const overlay = document.getElementById('loginOverlay');
    const display = overlay ? window.getComputedStyle(overlay).display : 'none';
    
    // If it's showing but you're logged in, hide it
    if (display === 'flex' && authManager && authManager.getCurrentUser()) {
        overlay.style.display = 'none';
        console.log('🔧 Force-hid login overlay (you are logged in)');
    }
}, 100);
```

This will **forcefully hide** the login overlay every 100ms if you're logged in!

---

*Popup Debug Guide*
*Created: January 31, 2026*

**🔥 Run the debugging commands and let me know what you find!**
