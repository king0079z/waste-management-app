// data-generator.js - Generate large datasets for testing scalability

class DataGenerator {
    constructor() {
        this.qatarLocations = [
            { name: "Doha City Center", lat: 25.2854, lng: 51.5310, radius: 0.05 },
            { name: "Al Rayyan", lat: 25.2919, lng: 51.4240, radius: 0.04 },
            { name: "Al Wakrah", lat: 25.1654, lng: 51.6042, radius: 0.03 },
            { name: "Lusail", lat: 25.4326, lng: 51.4907, radius: 0.04 },
            { name: "Al Khor", lat: 25.6811, lng: 51.4969, radius: 0.03 },
            { name: "Dukhan", lat: 25.4254, lng: 50.7833, radius: 0.03 },
            { name: "Mesaieed", lat: 24.9884, lng: 51.5514, radius: 0.02 },
            { name: "Al Shahaniya", lat: 25.3889, lng: 51.2017, radius: 0.03 },
            { name: "Umm Salal", lat: 25.4061, lng: 51.4042, radius: 0.03 },
            { name: "Al Thakhira", lat: 25.6367, lng: 51.5517, radius: 0.02 }
        ];
        
        this.streetNames = [
            "Al Corniche", "Salwa Road", "Al Waab Street", "Grand Hamad Street",
            "C Ring Road", "Al Rayyan Road", "Diplomatic Area", "West Bay",
            "Al Sadd Street", "Najma Street", "Al Markhiya Street", "Al Muntazah",
            "Al Hilal", "Al Dafna", "Katara", "The Pearl", "Lusail Boulevard",
            "Al Khor Coastal Road", "Industrial Area", "Al Wakrah Corniche"
        ];
        
        this.driverNames = [
            "John Kirt", "Mathew Williams", "Hassan Al-Kuwari", "Omar Al-Ansari",
            "Khalid Al-Mohannadi", "Yousef Al-Marri", "Abdullah Al-Naimi", "Ali Al-Sulaiti",
            "Hamad Al-Attiyah", "Rashid Al-Dosari", "Saeed Al-Misnad", "Faisal Al-Obaidli",
            "Nasser Al-Mannai", "Salem Al-Khulaifi", "Tariq Al-Malki", "Jassim Al-Baker",
            "Fahad Al-Emadi", "Badr Al-Hajri", "Majid Al-Sabah", "Waleed Al-Ghanim"
        ];
        
        this.binTypes = ["paper", "general", "recycling", "organic", "electronic"];
        this.vehicleModels = ["Mercedes Actros", "Volvo FH", "MAN TGX", "Scania R-Series", "DAF XF"];
    }

    generateBins(count = 5000) {
        console.log(`🏭 Generating ${count} bins across Qatar...`);
        const bins = [];
        
        for (let i = 0; i < count; i++) {
            const location = this.getRandomLocation();
            const streetName = this.getRandomArrayItem(this.streetNames);
            const buildingNumber = Math.floor(Math.random() * 999) + 1;
            
            const bin = {
                id: `BIN-${String(i + 1).padStart(4, '0')}`,
                location: `${buildingNumber} ${streetName}, ${location.name}`,
                lat: location.lat,
                lng: location.lng,
                fill: Math.floor(Math.random() * 100),
                type: this.getRandomArrayItem(this.binTypes),
                status: this.getRandomBinStatus(),
                capacity: Math.floor(Math.random() * 100) + 50, // 50-150L capacity
                batteryLevel: Math.floor(Math.random() * 100),
                temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
                lastCollection: this.getRandomRecentDate(),
                lastUpdate: new Date().toISOString(),
                sensorId: `SENSOR-${String(i + 1).padStart(6, '0')}`,
                installDate: this.getRandomPastDate(),
                maintenanceDate: this.getRandomFutureDate(),
                zone: this.getZoneFromCoordinates(location.lat, location.lng),
                collectionFrequency: this.getRandomCollectionFrequency(),
                priority: this.calculatePriority()
            };
            
            bins.push(bin);
            
            // Progress indicator
            if (i % 1000 === 0 && i > 0) {
                console.log(`✅ Generated ${i} bins...`);
            }
        }
        
        console.log(`✅ Successfully generated ${count} bins`);
        return bins;
    }

    generateDrivers(count = 3000) {
        console.log(`👥 Generating ${count} drivers...`);
        const drivers = [];
        
        for (let i = 0; i < count; i++) {
            const location = this.getRandomLocation();
            const name = this.generateDriverName(i);
            const vehicleId = `VEH-${String(i + 1).padStart(4, '0')}`;
            
            const driver = {
                id: `USR-${String(i + 3).padStart(3, '0')}`, // Start from USR-003
                username: `driver${i + 1}`,
                password: 'driver123',
                name: name,
                email: `${name.toLowerCase().replace(/\s+/g, '.')}@autonautics.com`,
                phone: `+974-${this.generatePhoneNumber()}`,
                type: 'driver',
                vehicleId: vehicleId,
                vehicleModel: this.getRandomArrayItem(this.vehicleModels),
                license: `QAT-${this.generateLicenseNumber()}`,
                status: this.getRandomDriverStatus(),
                movementStatus: this.getRandomMovementStatus(),
                fuelLevel: Math.floor(Math.random() * 100),
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 rating
                totalRoutes: Math.floor(Math.random() * 500),
                completedRoutes: Math.floor(Math.random() * 450),
                createdAt: this.getRandomPastDate(),
                lastLogin: this.getRandomRecentDate(),
                lastUpdate: new Date().toISOString(),
                currentLocation: {
                    lat: location.lat,
                    lng: location.lng
                },
                homeBase: location.name,
                workingHours: this.generateWorkingHours(),
                emergencyContact: `+974-${this.generatePhoneNumber()}`,
                licenseExpiry: this.getRandomFutureDate(),
                medicalCheckup: this.getRandomRecentDate(),
                performanceScore: Math.floor(Math.random() * 40) + 60, // 60-100
                specializations: this.getRandomSpecializations(),
                languages: ['Arabic', 'English']
            };
            
            drivers.push(driver);
            
            // Progress indicator
            if (i % 500 === 0 && i > 0) {
                console.log(`✅ Generated ${i} drivers...`);
            }
        }
        
        console.log(`✅ Successfully generated ${count} drivers`);
        return drivers;
    }

    generateRoutes(driverCount = 3000, binCount = 5000) {
        console.log(`🗺️ Generating routes for ${driverCount} drivers...`);
        const routes = [];
        const routesPerDriver = Math.floor(Math.random() * 3) + 1; // 1-3 routes per driver
        
        for (let driverId = 3; driverId < driverCount + 3; driverId++) {
            for (let r = 0; r < routesPerDriver; r++) {
                const routeId = `RTE-${Date.now()}-${driverId}-${r}`;
                const binCount = Math.floor(Math.random() * 8) + 3; // 3-10 bins per route
                const assignedBins = this.selectRandomBins(binCount, binCount);
                
                const route = {
                    id: routeId,
                    driverId: `USR-${String(driverId).padStart(3, '0')}`,
                    driverName: this.generateDriverName(driverId - 3),
                    binIds: assignedBins.map(bin => bin.id),
                    binDetails: assignedBins,
                    priority: this.getRandomPriority(),
                    status: this.getRandomRouteStatus(),
                    assignedBy: 'USR-001',
                    assignedByName: 'System Administrator',
                    assignedAt: this.getRandomRecentDate(),
                    estimatedDuration: binCount * 15, // 15 minutes per bin
                    actualDuration: null,
                    startedAt: null,
                    completedAt: null,
                    createdAt: new Date().toISOString(),
                    optimizedRoute: true,
                    totalDistance: Math.floor(Math.random() * 50) + 10, // 10-60 km
                    fuelEstimate: Math.floor(Math.random() * 20) + 5, // 5-25 liters
                    notes: `Auto-generated route for testing - ${binCount} bins`
                };
                
                routes.push(route);
            }
        }
        
        console.log(`✅ Successfully generated ${routes.length} routes`);
        return routes;
    }

    // ==================== HELPER METHODS ====================

    getRandomLocation() {
        const baseLocation = this.getRandomArrayItem(this.qatarLocations);
        
        // Add random offset within the radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * baseLocation.radius;
        
        return {
            name: baseLocation.name,
            lat: baseLocation.lat + (distance * Math.cos(angle)),
            lng: baseLocation.lng + (distance * Math.sin(angle))
        };
    }

    getRandomArrayItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    generateDriverName(index) {
        const names = this.driverNames;
        if (index < names.length) {
            return names[index];
        } else {
            const baseName = names[index % names.length];
            const suffix = Math.floor(index / names.length) + 1;
            return `${baseName} ${suffix}`;
        }
    }

    generatePhoneNumber() {
        return `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
    }

    generateLicenseNumber() {
        return Math.floor(Math.random() * 90000) + 10000;
    }

    getRandomBinStatus() {
        const statuses = ['normal', 'needs_attention', 'maintenance_required', 'full'];
        const weights = [70, 15, 10, 5]; // Percentage weights
        return this.weightedRandom(statuses, weights);
    }

    getRandomDriverStatus() {
        const statuses = ['active', 'inactive', 'on_break', 'off_duty'];
        const weights = [60, 10, 20, 10];
        return this.weightedRandom(statuses, weights);
    }

    getRandomMovementStatus() {
        const statuses = ['stationary', 'moving', 'loading', 'returning'];
        const weights = [40, 30, 20, 10];
        return this.weightedRandom(statuses, weights);
    }

    getRandomRouteStatus() {
        const statuses = ['pending', 'active', 'completed', 'cancelled'];
        const weights = [30, 25, 40, 5];
        return this.weightedRandom(statuses, weights);
    }

    getRandomPriority() {
        const priorities = ['low', 'medium', 'high', 'urgent'];
        const weights = [30, 40, 25, 5];
        return this.weightedRandom(priorities, weights);
    }

    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }

    getRandomRecentDate() {
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 30); // Within last 30 days
        const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
        return date.toISOString();
    }

    getRandomPastDate() {
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 365) + 30; // 30-395 days ago
        const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
        return date.toISOString();
    }

    getRandomFutureDate() {
        const now = new Date();
        const daysAhead = Math.floor(Math.random() * 365) + 30; // 30-395 days ahead
        const date = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        return date.toISOString();
    }

    getZoneFromCoordinates(lat, lng) {
        if (lat > 25.3 && lng > 51.4) return 'North';
        if (lat > 25.2 && lng > 51.3) return 'Central';
        if (lat < 25.2) return 'South';
        return 'West';
    }

    getRandomCollectionFrequency() {
        const frequencies = ['daily', 'every-2-days', 'weekly', 'bi-weekly'];
        const weights = [20, 40, 30, 10];
        return this.weightedRandom(frequencies, weights);
    }

    calculatePriority() {
        const priorities = ['low', 'medium', 'high'];
        const weights = [50, 35, 15];
        return this.weightedRandom(priorities, weights);
    }

    generateWorkingHours() {
        const shifts = [
            { start: '06:00', end: '14:00', name: 'Morning Shift' },
            { start: '14:00', end: '22:00', name: 'Afternoon Shift' },
            { start: '22:00', end: '06:00', name: 'Night Shift' }
        ];
        return this.getRandomArrayItem(shifts);
    }

    getRandomSpecializations() {
        const specs = ['hazardous-waste', 'electronic-waste', 'organic-waste', 'recyclables', 'general-waste'];
        const count = Math.floor(Math.random() * 3) + 1;
        const selected = [];
        
        for (let i = 0; i < count; i++) {
            const spec = this.getRandomArrayItem(specs);
            if (!selected.includes(spec)) {
                selected.push(spec);
            }
        }
        
        return selected;
    }

    selectRandomBins(count, totalBins) {
        const bins = [];
        const usedIds = new Set();
        
        for (let i = 0; i < count; i++) {
            let binId;
            do {
                binId = `BIN-${String(Math.floor(Math.random() * totalBins) + 1).padStart(4, '0')}`;
            } while (usedIds.has(binId));
            
            usedIds.add(binId);
            
            const location = this.getRandomLocation();
            bins.push({
                id: binId,
                location: `${Math.floor(Math.random() * 999) + 1} ${this.getRandomArrayItem(this.streetNames)}, ${location.name}`,
                fill: Math.floor(Math.random() * 100),
                status: this.getRandomBinStatus(),
                lat: location.lat,
                lng: location.lng
            });
        }
        
        return bins;
    }

    // ==================== BULK GENERATION ====================

    async generateFullDataset(options = {}) {
        const config = {
            binCount: options.binCount || 5000,
            driverCount: options.driverCount || 3000,
            generateRoutes: options.generateRoutes !== false,
            saveToStorage: options.saveToStorage !== false,
            ...options
        };

        console.log('🏭 Starting full dataset generation...');
        console.log(`📊 Configuration:`, config);

        const startTime = Date.now();
        const dataset = {};

        // Generate bins
        performance.mark('bins-start');
        dataset.bins = this.generateBins(config.binCount);
        performance.mark('bins-end');
        performance.measure('bins-generation', 'bins-start', 'bins-end');

        // Generate drivers
        performance.mark('drivers-start');
        dataset.drivers = this.generateDrivers(config.driverCount);
        performance.mark('drivers-end');
        performance.measure('drivers-generation', 'drivers-start', 'drivers-end');

        // Generate routes
        if (config.generateRoutes) {
            performance.mark('routes-start');
            dataset.routes = this.generateRoutes(config.driverCount, config.binCount);
            performance.mark('routes-end');
            performance.measure('routes-generation', 'routes-start', 'routes-end');
        }

        // Add default management users
        dataset.users = [
            ...dataset.drivers,
            {
                id: 'USR-001',
                username: 'admin',
                password: 'admin123',
                name: 'System Administrator',
                email: 'admin@autonautics.com',
                phone: '+974-1234-5678',
                type: 'admin',
                status: 'active',
                createdAt: new Date().toISOString(),
                permissions: ['all']
            },
            {
                id: 'USR-002',
                username: 'manager',
                password: 'manager123',
                name: 'Operations Manager',
                email: 'manager@autonautics.com',
                phone: '+974-2345-6789',
                type: 'manager',
                status: 'active',
                createdAt: new Date().toISOString(),
                permissions: ['manage_routes', 'view_analytics', 'manage_drivers']
            }
        ];

        // Add metadata
        dataset.metadata = {
            generated: new Date().toISOString(),
            counts: {
                bins: dataset.bins.length,
                drivers: dataset.drivers.length,
                routes: dataset.routes ? dataset.routes.length : 0,
                totalUsers: dataset.users.length
            },
            performance: {
                totalTime: Date.now() - startTime,
                binsPerSecond: Math.floor(dataset.bins.length / ((Date.now() - startTime) / 1000)),
                driversPerSecond: Math.floor(dataset.drivers.length / ((Date.now() - startTime) / 1000))
            },
            configuration: config
        };

        // Save to storage if requested
        if (config.saveToStorage) {
            await this.saveDatasetToStorage(dataset);
        }

        const totalTime = Date.now() - startTime;
        console.log(`✅ Dataset generation complete in ${totalTime}ms`);
        console.log(`📊 Generated: ${dataset.bins.length} bins, ${dataset.drivers.length} drivers, ${dataset.routes?.length || 0} routes`);

        return dataset;
    }

    async saveDatasetToStorage(dataset) {
        console.log('💾 Saving dataset to storage...');
        
        try {
            // Save to enterprise scalability system if available
            if (window.enterpriseScalability) {
                await window.enterpriseScalability.bulkUpdateBins(dataset.bins);
                await window.enterpriseScalability.bulkUpdateDrivers(dataset.drivers);
                console.log('✅ Dataset saved to enterprise system');
            }
            
            // Also save to localStorage for immediate access
            localStorage.setItem('generated_bins', JSON.stringify(dataset.bins));
            localStorage.setItem('generated_drivers', JSON.stringify(dataset.drivers));
            localStorage.setItem('generated_routes', JSON.stringify(dataset.routes || []));
            localStorage.setItem('generated_users', JSON.stringify(dataset.users));
            localStorage.setItem('dataset_metadata', JSON.stringify(dataset.metadata));
            
            console.log('✅ Dataset saved to localStorage');
            
        } catch (error) {
            console.error('❌ Error saving dataset:', error);
        }
    }
}

// Create global instance
window.dataGenerator = new DataGenerator();
window.DataGenerator = DataGenerator;

// Global functions for easy access
window.generateLargeDataset = async function(binCount = 5000, driverCount = 3000) {
    return await window.dataGenerator.generateFullDataset({
        binCount,
        driverCount,
        generateRoutes: true,
        saveToStorage: true
    });
};

window.loadGeneratedDataset = function() {
    const bins = JSON.parse(localStorage.getItem('generated_bins') || '[]');
    const drivers = JSON.parse(localStorage.getItem('generated_drivers') || '[]');
    const routes = JSON.parse(localStorage.getItem('generated_routes') || '[]');
    const users = JSON.parse(localStorage.getItem('generated_users') || '[]');
    const metadata = JSON.parse(localStorage.getItem('dataset_metadata') || '{}');
    
    console.log(`📊 Loaded dataset: ${bins.length} bins, ${drivers.length} drivers, ${routes.length} routes`);
    
    return { bins, drivers, routes, users, metadata };
};

console.log('🏭 Data Generator loaded - Ready to create 5000+ bins and 3000+ drivers');
