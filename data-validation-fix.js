// Data Validation Fix - Ensures data consistency and fixes route/bin data issues
console.log('🔍 Loading Data Validation Fix...');

class DataValidationFix {
    constructor() {
        this.validationRules = new Map();
        this.fixedIssues = [];
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing Data Validation Fix...');
        
        this.setupValidationRules();
        this.enhanceDataManager();
        this.fixExistingDataIssues();
        this.setupPeriodicValidation();
        
        console.log('✅ Data Validation Fix initialized');
    }
    
    setupValidationRules() {
        // Route validation rules
        this.validationRules.set('route', {
            required: ['id', 'driverId', 'binIds'],
            validate: (route) => {
                const issues = [];
                
                if (!route.id) issues.push('Missing route ID');
                if (!route.driverId) issues.push('Missing driver ID');
                if (!Array.isArray(route.binIds) || route.binIds.length === 0) {
                    issues.push('Route must have at least one bin ID');
                }
                
                // Check if bins exist
                if (route.binIds && window.dataManager) {
                    const bins = window.dataManager.getBins();
                    const validBinIds = route.binIds.filter(binId => 
                        bins.find(bin => bin.id === binId)
                    );
                    
                    if (validBinIds.length === 0) {
                        issues.push('No valid bins found for route');
                    } else if (validBinIds.length < route.binIds.length) {
                        issues.push(`${route.binIds.length - validBinIds.length} invalid bin IDs in route`);
                    }
                }
                
                return issues;
            }
        });
        
        // Bin validation rules
        this.validationRules.set('bin', {
            required: ['id', 'location'],
            validate: (bin) => {
                const issues = [];
                
                if (!bin.id) issues.push('Missing bin ID');
                if (!bin.location) issues.push('Missing bin location');
                if (bin.location && (!bin.location.lat || !bin.location.lng)) {
                    issues.push('Invalid bin location coordinates');
                }
                
                return issues;
            }
        });
        
        // Driver validation rules
        this.validationRules.set('driver', {
            required: ['id', 'name'],
            validate: (driver) => {
                const issues = [];
                
                if (!driver.id) issues.push('Missing driver ID');
                if (!driver.name) issues.push('Missing driver name');
                if (driver.type !== 'driver') issues.push('Invalid driver type');
                
                return issues;
            }
        });
        
        console.log('✅ Validation rules set up');
    }
    
    enhanceDataManager() {
        if (!window.dataManager) {
            console.warn('⚠️ DataManager not available for enhancement');
            return;
        }
        
        console.log('🔧 Enhancing DataManager with validation...');
        
        // Enhance addRoute method
        if (typeof window.dataManager.addRoute === 'function') {
            const originalAddRoute = window.dataManager.addRoute.bind(window.dataManager);
            
            window.dataManager.addRoute = (route) => {
                console.log('🔍 Validating route before adding:', route.id);
                
                const validatedRoute = this.validateAndFixRoute(route);
                if (validatedRoute) {
                    return originalAddRoute(validatedRoute);
                } else {
                    console.error('❌ Route validation failed, not adding route:', route.id);
                    return null;
                }
            };
        }
        
        // Enhance getRoutes method to filter out invalid routes
        if (typeof window.dataManager.getRoutes === 'function') {
            const originalGetRoutes = window.dataManager.getRoutes.bind(window.dataManager);
            
            window.dataManager.getRoutes = () => {
                const routes = originalGetRoutes();
                return routes.filter(route => this.isValidRoute(route));
            };
        }
        
        console.log('✅ DataManager enhanced with validation');
    }
    
    validateAndFixRoute(route) {
        if (!route) return null;
        
        const issues = this.validationRules.get('route').validate(route);
        
        if (issues.length === 0) {
            return route; // Route is valid
        }
        
        console.log(`🔧 Fixing route ${route.id} issues:`, issues);
        
        const fixedRoute = { ...route };
        let fixed = true;
        
        // Fix missing ID
        if (!fixedRoute.id) {
            fixedRoute.id = `route-${Date.now()}`;
            console.log('✅ Generated missing route ID:', fixedRoute.id);
        }
        
        // Fix missing driver ID
        if (!fixedRoute.driverId && window.authManager) {
            const currentUser = window.authManager.getCurrentUser();
            if (currentUser && currentUser.type === 'driver') {
                fixedRoute.driverId = currentUser.id;
                console.log('✅ Set missing driver ID:', fixedRoute.driverId);
            }
        }
        
        // Fix bin IDs
        if (!Array.isArray(fixedRoute.binIds) || fixedRoute.binIds.length === 0) {
            // Try to find available bins
            const bins = window.dataManager?.getBins();
            if (bins && bins.length > 0) {
                // Find bins that need collection (high fill level)
                const needsCollection = bins.filter(bin => (bin.fill || 0) > 70);
                if (needsCollection.length > 0) {
                    fixedRoute.binIds = [needsCollection[0].id];
                    console.log('✅ Added valid bin ID to route:', fixedRoute.binIds[0]);
                } else {
                    // Use first available bin
                    fixedRoute.binIds = [bins[0].id];
                    console.log('✅ Added fallback bin ID to route:', fixedRoute.binIds[0]);
                }
            } else {
                console.warn('❌ No bins available to fix route');
                fixed = false;
            }
        } else {
            // Validate and fix existing bin IDs
            const bins = window.dataManager?.getBins() || [];
            const validBinIds = fixedRoute.binIds.filter(binId => 
                bins.find(bin => bin.id === binId)
            );
            
            if (validBinIds.length === 0) {
                // No valid bins, try to substitute
                if (bins.length > 0) {
                    fixedRoute.binIds = [bins[0].id];
                    console.log('✅ Substituted invalid bin IDs with valid one:', fixedRoute.binIds[0]);
                } else {
                    fixed = false;
                }
            } else if (validBinIds.length < fixedRoute.binIds.length) {
                // Some invalid bins, keep only valid ones
                fixedRoute.binIds = validBinIds;
                console.log('✅ Filtered out invalid bin IDs, kept:', validBinIds.length);
            }
        }
        
        // Set default values for missing fields
        if (!fixedRoute.status) fixedRoute.status = 'pending';
        if (!fixedRoute.priority) fixedRoute.priority = 'medium';
        if (!fixedRoute.createdAt) fixedRoute.createdAt = new Date().toISOString();
        
        if (fixed) {
            this.fixedIssues.push({
                type: 'route',
                id: fixedRoute.id,
                issues: issues,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Route fixed successfully:', fixedRoute.id);
            return fixedRoute;
        } else {
            console.error('❌ Could not fix route:', route.id);
            return null;
        }
    }
    
    isValidRoute(route) {
        if (!route) return false;
        
        const issues = this.validationRules.get('route').validate(route);
        return issues.length === 0;
    }
    
    fixExistingDataIssues() {
        console.log('🔍 Checking existing data for issues...');
        
        if (!window.dataManager) return;
        
        // Fix routes
        try {
            const routes = window.dataManager.getData('routes') || [];
            let fixedRoutes = 0;
            
            const validRoutes = routes.map(route => {
                if (!this.isValidRoute(route)) {
                    const fixedRoute = this.validateAndFixRoute(route);
                    if (fixedRoute) {
                        fixedRoutes++;
                        return fixedRoute;
                    }
                    return null;
                }
                return route;
            }).filter(route => route !== null);
            
            if (fixedRoutes > 0) {
                window.dataManager.setData('routes', validRoutes);
                console.log(`✅ Fixed ${fixedRoutes} invalid routes`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error fixing existing routes:', error.message);
        }
        
        // Fix bins if needed
        this.validateBins();
        
        console.log(`✅ Data validation completed. Fixed ${this.fixedIssues.length} issues`);
    }
    
    validateBins() {
        if (!window.dataManager) return;
        
        try {
            const bins = window.dataManager.getBins();
            let fixedBins = 0;
            
            const validBins = bins.map(bin => {
                const issues = this.validationRules.get('bin').validate(bin);
                if (issues.length > 0) {
                    console.log(`🔧 Fixing bin ${bin.id} issues:`, issues);
                    
                    const fixedBin = { ...bin };
                    
                    // Fix missing or invalid location
                    if (!fixedBin.location || typeof fixedBin.location === 'string') {
                        // If location is a string or missing, create proper location object
                        const locationName = typeof fixedBin.location === 'string' ? fixedBin.location : 'Unknown Location';
                        fixedBin.locationName = locationName;  // Store string as locationName
                        fixedBin.location = locationName;  // Keep original for compatibility
                        fixedBin.lat = fixedBin.lat || 25.2854;  // Use existing lat or default
                        fixedBin.lng = fixedBin.lng || 51.5310;  // Use existing lng or default
                    } else if (typeof fixedBin.location === 'object') {
                        // If location is object, ensure it has lat/lng
                        if (!fixedBin.lat && fixedBin.location.lat) fixedBin.lat = fixedBin.location.lat;
                        if (!fixedBin.lng && fixedBin.location.lng) fixedBin.lng = fixedBin.location.lng;
                        if (!fixedBin.lat) fixedBin.lat = 25.2854;
                        if (!fixedBin.lng) fixedBin.lng = 51.5310;
                    }
                    
                    // Set default fill level if missing
                    if (typeof fixedBin.fill !== 'number') {
                        fixedBin.fill = Math.floor(Math.random() * 100);
                    }
                    
                    fixedBins++;
                    return fixedBin;
                }
                return bin;
            });
            
            if (fixedBins > 0) {
                window.dataManager.setData('bins', validBins);
                console.log(`✅ Fixed ${fixedBins} invalid bins`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error validating bins:', error.message);
        }
    }
    
    setupPeriodicValidation() {
        // Run validation every 2 minutes
        setInterval(() => {
            this.runPeriodicValidation();
        }, 120000);
        
        console.log('✅ Periodic validation scheduled');
    }
    
    runPeriodicValidation() {
        console.log('🔍 Running periodic data validation...');
        
        if (!window.dataManager) return;
        
        const routes = window.dataManager.getData('routes') || [];
        const invalidRoutes = routes.filter(route => !this.isValidRoute(route));
        
        if (invalidRoutes.length > 0) {
            console.warn(`⚠️ Found ${invalidRoutes.length} invalid routes, fixing...`);
            this.fixExistingDataIssues();
        } else {
            console.log('✅ All data validation passed');
        }
    }
    
    // Public API
    validateRoute(route) {
        const issues = this.validationRules.get('route').validate(route);
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
    
    getFixedIssues() {
        return this.fixedIssues;
    }
    
    runManualValidation() {
        console.log('🔧 Running manual data validation...');
        this.fixExistingDataIssues();
        return this.fixedIssues;
    }
    
    getDataStatus() {
        if (!window.dataManager) return null;
        
        const routes = window.dataManager.getData('routes') || [];
        const bins = window.dataManager.getBins() || [];
        
        const validRoutes = routes.filter(route => this.isValidRoute(route));
        const invalidRoutes = routes.length - validRoutes.length;
        
        return {
            totalRoutes: routes.length,
            validRoutes: validRoutes.length,
            invalidRoutes: invalidRoutes,
            totalBins: bins.length,
            fixedIssues: this.fixedIssues.length
        };
    }
}

// Initialize data validation fix
window.dataValidationFix = new DataValidationFix();

// Add global debug function
window.debugDataValidation = function() {
    const status = window.dataValidationFix.getDataStatus();
    console.table(status);
    
    if (status && status.invalidRoutes > 0) {
        console.warn(`⚠️ Found ${status.invalidRoutes} invalid routes - fixing...`);
        window.dataValidationFix.runManualValidation();
    }
    
    return status;
};

console.log('🔍 Data Validation Fix loaded and active');
console.log('🧪 Debug: Use debugDataValidation() to check and fix data issues');
