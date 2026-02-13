// CRITICAL_FIXES_IMPLEMENTATION.js
// Priority fixes to implement immediately for world-class functionality

// ==============================================================================
// 1. PASSWORD HASHING (HIGH PRIORITY - SECURITY)
// ==============================================================================

// Step 1: Install bcrypt
// Run: npm install bcrypt

// Step 2: Update auth.js - Add at the top
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// Step 3: Update registration function in auth.js
// FIND: (around line 175)
/*
const registration = dataManager.addPendingRegistration({
    userType: userData.userType || 'driver',
    name: userData.name,
    username: userData.username,
    email: userData.email,
    phone: userData.phone || '',
    password: userData.password,  // <-- INSECURE
*/

// REPLACE WITH:
const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
const registration = dataManager.addPendingRegistration({
    userType: userData.userType || 'driver',
    name: userData.name,
    username: userData.username,
    email: userData.email,
    phone: userData.phone || '',
    password: hashedPassword,  // <-- SECURE
    vehicleId: userData.vehicleId || '',
    license: userData.license || '',
    submittedAt: new Date().toISOString(),
    status: 'pending'
});

// Step 4: Update login function in auth.js
// FIND: (around line 62)
/*
// Check password
if (user.password !== password) {
    console.log('Invalid password for user:', username);
    throw new Error('Invalid password. Please try again.');
}
*/

// REPLACE WITH:
// Check password (secure comparison)
const isPasswordValid = await bcrypt.compare(password, user.password);
if (!isPasswordValid) {
    console.log('Invalid password for user:', username);
    throw new Error('Invalid password. Please try again.');
}

// Step 5: Update approveRegistration in auth.js
// FIND: (around line 389)
/*
const newUser = {
    id: dataManager.generateId('USR'),
    username: registration.username,
    password: registration.password,  // <-- Already hashed from registration
*/
// No change needed here - password is already hashed during registration

// Step 6: Hash existing passwords in data-manager.js
// Add this initialization function
async hashExistingPasswords() {
    const users = this.getUsers();
    let updated = false;
    
    for (const user of users) {
        // Check if password is already hashed (bcrypt hashes start with $2b$)
        if (!user.password.startsWith('$2b$')) {
            console.log(`🔒 Hashing password for user: ${user.username}`);
            user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
            updated = true;
        }
    }
    
    if (updated) {
        this.setData('users', users);
        console.log('✅ All passwords hashed successfully');
    }
}

// ==============================================================================
// 2. RATE LIMITING (HIGH PRIORITY - SECURITY)
// ==============================================================================

// Step 1: Install express-rate-limit
// Run: npm install express-rate-limit

// Step 2: Add to server.js (after line 11)
const rateLimit = require('express-rate-limit');

// Step 3: Add rate limiting middleware (before routes, around line 163)
// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter); // If you create auth routes

// ==============================================================================
// 3. ENABLE HELMET.JS IN PRODUCTION (HIGH PRIORITY - SECURITY)
// ==============================================================================

// Update server.js around line 102
// FIND:
/*
// Security middleware - COMPLETELY DISABLED for development
// Helmet CSP is causing issues with inline event handlers
// app.use(helmet());
*/

// REPLACE WITH:
// Security middleware - Enabled in production with proper CSP
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'", "https://api.openstreetmap.org"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
    console.log('🔒 Helmet.js security headers enabled');
} else {
    console.log('⚠️ Security headers disabled in development mode');
}

// ==============================================================================
// 4. XSS PROTECTION (MEDIUM PRIORITY - SECURITY)
// ==============================================================================

// Step 1: Install DOMPurify
// Run: npm install dompurify

// Step 2: Create sanitization utility file
// File: security-utils.js
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = DOMPurify(window);

class SecurityUtils {
    // Sanitize HTML to prevent XSS
    static sanitizeHTML(html) {
        return purify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href']
        });
    }
    
    // Sanitize for attribute values
    static sanitizeAttribute(value) {
        return purify.sanitize(value, { ALLOWED_TAGS: [] });
    }
    
    // Escape for SQL (if using SQL in future)
    static escapeSql(value) {
        return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
            switch (char) {
                case "\0": return "\\0";
                case "\x08": return "\\b";
                case "\x09": return "\\t";
                case "\x1a": return "\\z";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%": return "\\" + char;
            }
        });
    }
    
    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Validate phone
    static isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
}

module.exports = SecurityUtils;

// Step 3: Use in data-manager.js and auth.js
// Update addComplaint function (data-manager.js line 659)
const SecurityUtils = require('./security-utils');

addComplaint(complaint) {
    const complaints = this.getComplaints();
    
    // Sanitize user input
    complaint.description = SecurityUtils.sanitizeHTML(complaint.description);
    complaint.location = SecurityUtils.sanitizeAttribute(complaint.location);
    
    complaint.id = this.generateId('CMP');
    complaint.createdAt = new Date().toISOString();
    complaint.status = 'open';
    complaints.push(complaint);
    this.setData('complaints', complaints);
    this.addSystemLog(`New complaint: ${complaint.type} at ${complaint.location}`, 'warning');
    console.log('Complaint added:', complaint);
    return complaint;
}

// ==============================================================================
// 5. INDEXEDDB MIGRATION (MEDIUM PRIORITY - PERFORMANCE)
// ==============================================================================

// File: indexeddb-manager.js
class IndexedDBManager {
    constructor() {
        this.db = null;
        this.dbName = 'WasteManagementDB';
        this.version = 1;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ IndexedDB initialization failed');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('username', 'username', { unique: true });
                    userStore.createIndex('type', 'type', { unique: false });
                }

                if (!db.objectStoreNames.contains('bins')) {
                    const binStore = db.createObjectStore('bins', { keyPath: 'id' });
                    binStore.createIndex('status', 'status', { unique: false });
                    binStore.createIndex('fill', 'fill', { unique: false });
                }

                if (!db.objectStoreNames.contains('routes')) {
                    const routeStore = db.createObjectStore('routes', { keyPath: 'id' });
                    routeStore.createIndex('driverId', 'driverId', { unique: false });
                    routeStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains('collections')) {
                    const collectionStore = db.createObjectStore('collections', { keyPath: 'id' });
                    collectionStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('✅ IndexedDB object stores created');
            };
        });
    }

    async set(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Migration from LocalStorage
    async migrateFromLocalStorage() {
        console.log('🔄 Migrating data from LocalStorage to IndexedDB...');
        
        const prefix = 'waste_mgmt_';
        const keys = ['users', 'bins', 'routes', 'collections', 'complaints', 'alerts'];

        for (const key of keys) {
            const localData = localStorage.getItem(prefix + key);
            if (localData) {
                try {
                    const data = JSON.parse(localData);
                    if (Array.isArray(data)) {
                        for (const item of data) {
                            await this.set(key, item);
                        }
                        console.log(`✅ Migrated ${data.length} items from ${key}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to migrate ${key}:`, error);
                }
            }
        }

        console.log('✅ Migration complete');
    }
}

// Usage in data-manager.js
// Add to constructor:
/*
this.indexedDB = new IndexedDBManager();
this.indexedDB.init().then(() => {
    this.indexedDB.migrateFromLocalStorage();
});
*/

// ==============================================================================
// 6. VIEWPORT-BASED BIN LOADING (MEDIUM PRIORITY - PERFORMANCE)
// ==============================================================================

// Add to map-manager.js
class ViewportOptimizer {
    constructor(map) {
        this.map = map;
        this.visibleMarkers = new Map();
        this.allBins = [];
        this.updateDebounce = null;
    }

    setBins(bins) {
        this.allBins = bins;
    }

    getVisibleBins() {
        if (!this.map) return [];

        const bounds = this.map.getBounds();
        const northeast = bounds.getNorthEast();
        const southwest = bounds.getSouthWest();

        return this.allBins.filter(bin => {
            return bin.lat >= southwest.lat &&
                   bin.lat <= northeast.lat &&
                   bin.lng >= southwest.lng &&
                   bin.lng <= northeast.lng;
        });
    }

    updateVisibleMarkers(addMarkerCallback) {
        // Debounce to prevent excessive updates during panning
        if (this.updateDebounce) {
            clearTimeout(this.updateDebounce);
        }

        this.updateDebounce = setTimeout(() => {
            const visibleBins = this.getVisibleBins();
            
            // Remove markers that are no longer visible
            this.visibleMarkers.forEach((marker, binId) => {
                const isVisible = visibleBins.some(bin => bin.id === binId);
                if (!isVisible) {
                    marker.remove();
                    this.visibleMarkers.delete(binId);
                }
            });

            // Add markers for newly visible bins
            visibleBins.forEach(bin => {
                if (!this.visibleMarkers.has(bin.id)) {
                    const marker = addMarkerCallback(bin);
                    this.visibleMarkers.set(bin.id, marker);
                }
            });

            console.log(`📍 Displaying ${this.visibleMarkers.size} of ${this.allBins.length} bins`);
        }, 200);
    }

    init() {
        this.map.on('moveend', () => {
            this.updateVisibleMarkers();
        });

        this.map.on('zoomend', () => {
            this.updateVisibleMarkers();
        });
    }
}

// Usage in map-manager.js:
/*
this.viewportOptimizer = new ViewportOptimizer(this.map);
this.viewportOptimizer.setBins(bins);
this.viewportOptimizer.init();
*/

// ==============================================================================
// 7. MEMORY CLEANUP (MEDIUM PRIORITY - PERFORMANCE)
// ==============================================================================

// File: memory-manager.js
class MemoryManager {
    constructor() {
        this.cleanupInterval = null;
        this.cleanupFrequency = 5 * 60 * 1000; // 5 minutes
    }

    start() {
        console.log('🧹 Starting memory cleanup service...');
        
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.cleanupFrequency);
    }

    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    performCleanup() {
        console.log('🧹 Performing memory cleanup...');
        
        // Clean error logs
        this.cleanErrorLogs();
        
        // Clean system logs
        this.cleanSystemLogs();
        
        // Clean old location history
        this.cleanLocationHistory();
        
        // Clean old completed routes
        this.cleanOldRoutes();
        
        // Log memory usage
        if (performance.memory) {
            const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
            console.log(`💾 Memory usage: ${memoryMB} MB`);
        }
    }

    cleanErrorLogs() {
        const errorLogs = dataManager.getErrorLogs();
        if (errorLogs.length > 500) {
            const cleaned = errorLogs.slice(-500);
            dataManager.setData('errorLogs', cleaned);
            console.log(`🧹 Cleaned ${errorLogs.length - 500} old error logs`);
        }
    }

    cleanSystemLogs() {
        const systemLogs = dataManager.getSystemLogs();
        if (systemLogs.length > 1000) {
            const cleaned = systemLogs.slice(-1000);
            dataManager.setData('systemLogs', cleaned);
            console.log(`🧹 Cleaned ${systemLogs.length - 1000} old system logs`);
        }
    }

    cleanLocationHistory() {
        const driverLocations = dataManager.getAllDriverLocations();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        Object.keys(driverLocations).forEach(driverId => {
            const location = driverLocations[driverId];
            if (new Date(location.timestamp) < oneDayAgo) {
                // Keep the location but clear old data
                driverLocations[driverId] = {
                    lat: location.lat,
                    lng: location.lng,
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        dataManager.setData('driverLocations', driverLocations);
    }

    cleanOldRoutes() {
        const routes = dataManager.getRoutes();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const cleaned = routes.filter(route => {
            if (route.status === 'completed' && new Date(route.completedAt) < thirtyDaysAgo) {
                return false;
            }
            return true;
        });
        
        if (cleaned.length < routes.length) {
            dataManager.setData('routes', cleaned);
            console.log(`🧹 Cleaned ${routes.length - cleaned.length} old routes`);
        }
    }
}

// Global instance
window.memoryManager = new MemoryManager();
window.memoryManager.start();

// ==============================================================================
// 8. CHART PERFORMANCE OPTIMIZATION (LOW PRIORITY - PERFORMANCE)
// ==============================================================================

// Update analytics.js - Add to chart options
const optimizedChartOptions = {
    // Existing options...
    
    // Add performance optimizations
    animation: {
        duration: 500 // Reduce from default 1000ms
    },
    
    elements: {
        point: {
            radius: 0, // Don't render points on lines (faster)
            hitRadius: 10, // But still allow clicking near lines
            hoverRadius: 4
        },
        line: {
            borderWidth: 2,
            tension: 0.4
        }
    },
    
    plugins: {
        decimation: {
            enabled: true,
            algorithm: 'lttb', // Largest-Triangle-Three-Buckets
            samples: 100, // Reduce data points for better performance
            threshold: 150
        }
    },
    
    // Disable expensive features for large datasets
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    },
    
    // Responsive optimization
    responsive: true,
    maintainAspectRatio: false,
    
    // Disable animations on large datasets
    ...(dataPointsCount > 1000 ? { animation: false } : {})
};

// ==============================================================================
// IMPLEMENTATION PRIORITY CHECKLIST
// ==============================================================================

/*
✅ HIGH PRIORITY (Implement within 1 week):
1. [ ] Password hashing (bcrypt)
2. [ ] Rate limiting
3. [ ] Enable Helmet.js in production
4. [ ] XSS protection (DOMPurify)

✅ MEDIUM PRIORITY (Implement within 1 month):
5. [ ] IndexedDB migration
6. [ ] Viewport-based bin loading
7. [ ] Memory cleanup service
8. [ ] Error monitoring (Sentry)

✅ LOW PRIORITY (Implement within 3 months):
9. [ ] Chart performance optimization
10. [ ] Service Worker (PWA)
11. [ ] Advanced caching strategies
12. [ ] Code splitting
*/

// ==============================================================================
// END OF CRITICAL FIXES IMPLEMENTATION
// ==============================================================================



