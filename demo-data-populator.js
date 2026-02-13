// Demo Data Populator - Comprehensive Mockup Data for Smart City Dashboard
// This script populates the application with realistic demo data for presentation

console.log('🎭 Loading Demo Data Populator...');

class DemoDataPopulator {
    constructor() {
        this.initialized = false;
    }
    
    async populateAllData() {
        console.log('🎬 Starting comprehensive data population...');
        
        try {
            // Wait for data manager to be ready
            await this.waitForDataManager();
            
            // Populate various data categories
            this.populateBinsWithData();
            this.populateCollectionsData();
            this.populateDriverHistory();
            this.populateAnalytics();
            this.populateComplaints();
            this.populateRoutes();
            this.updateDashboardMetrics();
            
            this.initialized = true;
            console.log('✅ Demo data population complete!');
            
            // Refresh UI
            this.refreshAllDisplays();
            
            return true;
        } catch (error) {
            console.error('❌ Error populating demo data:', error);
            return false;
        }
    }
    
    async waitForDataManager() {
        let attempts = 0;
        while (!window.dataManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.dataManager) {
            throw new Error('DataManager not available');
        }
        
        console.log('✅ DataManager ready');
    }
    
    populateBinsWithData() {
        console.log('📦 Populating bin data...');
        
        const bins = window.dataManager.getBins();
        
        // If we already have bins, enhance them with realistic data
        if (bins && bins.length > 0) {
            bins.forEach(bin => {
                // Add realistic fill levels
                bin.fill = bin.fill || Math.floor(Math.random() * 100);
                bin.fillLevel = bin.fill;
                
                // Add temperature
                bin.temperature = bin.temperature || (20 + Math.floor(Math.random() * 15));
                
                // Add battery level
                bin.batteryLevel = bin.batteryLevel || (70 + Math.floor(Math.random() * 30));
                
                // Add signal strength
                bin.signalStrength = bin.signalStrength || (-50 - Math.floor(Math.random() * 30));
                
                // Add efficiency and utilization metrics
                bin.efficiency = bin.efficiency || (70 + Math.floor(Math.random() * 30));
                bin.utilization = bin.utilization || (60 + Math.floor(Math.random() * 40));
                
                // Add maintenance and sensor health
                bin.maintenance = bin.maintenance || { required: bin.fill > 90 || bin.batteryLevel < 30 };
                bin.sensorHealth = bin.sensorHealth || {
                    status: bin.batteryLevel > 30 ? 'online' : 'low-battery',
                    health: bin.batteryLevel,
                    lastCheck: new Date().toISOString()
                };
                
                // Update status based on fill level
                if (bin.fill >= 90) bin.status = 'critical';
                else if (bin.fill >= 70) bin.status = 'warning';
                else bin.status = 'normal';
                
                // Add last update timestamp
                bin.lastUpdate = new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString();
                
                // Update in data manager
                window.dataManager.updateBin(bin.id, bin);
            });
            
            console.log(`✅ Enhanced ${bins.length} bins with realistic data`);
        }
        
        // Add some additional bins if we have less than 10
        if (bins.length < 10) {
            const additionalBinsNeeded = 10 - bins.length;
            const locations = [
                'Souq Waqif Market Area',
                'Al Corniche Waterfront',
                'Education City Campus',
                'Aspire Zone Complex',
                'Msheireb Downtown',
                'Villaggio Mall Area',
                'City Center Doha',
                'Al Bidda Park',
                'Museum of Islamic Art',
                'Katara Village'
            ];
            
            const baseCoords = { lat: 25.2854, lng: 51.5310 };
            
            for (let i = 0; i < additionalBinsNeeded; i++) {
                const fillLevel = Math.floor(Math.random() * 100);
                const batteryLevel = 70 + Math.floor(Math.random() * 30);
                
                const newBin = {
                    id: `DF703-${String(bins.length + i + 1).padStart(3, '0')}`,
                    location: locations[i] || `Location ${bins.length + i + 1}`,
                    lat: baseCoords.lat + (Math.random() * 0.1 - 0.05),
                    lng: baseCoords.lng + (Math.random() * 0.1 - 0.05),
                    type: ['paper', 'plastic', 'metal', 'glass', 'mixed'][Math.floor(Math.random() * 5)],
                    capacity: 100 + Math.floor(Math.random() * 50),
                    fill: fillLevel,
                    fillLevel: fillLevel,
                    temperature: 20 + Math.floor(Math.random() * 15),
                    batteryLevel: batteryLevel,
                    signalStrength: -50 - Math.floor(Math.random() * 30),
                    sensorStatus: 'active',
                    efficiency: 70 + Math.floor(Math.random() * 30),
                    utilization: 60 + Math.floor(Math.random() * 40),
                    maintenance: { required: fillLevel > 90 || batteryLevel < 30 },
                    sensorHealth: {
                        status: batteryLevel > 30 ? 'online' : 'low-battery',
                        health: batteryLevel,
                        lastCheck: new Date().toISOString()
                    },
                    lastUpdate: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString()
                };
                
                // Set status
                if (newBin.fill >= 90) newBin.status = 'critical';
                else if (newBin.fill >= 70) newBin.status = 'warning';
                else newBin.status = 'normal';
                
                window.dataManager.addBin(newBin);
            }
            
            console.log(`✅ Added ${additionalBinsNeeded} new bins`);
        }
    }
    
    populateCollectionsData() {
        console.log('🗑️ Populating collections data...');
        
        const collections = window.dataManager.getCollections();
        const drivers = window.dataManager.getDrivers();
        const bins = window.dataManager.getBins();
        
        if (drivers.length === 0 || bins.length === 0) {
            console.warn('⚠️ No drivers or bins available for collection data');
            return;
        }
        
        // Add collections for the past 7 days if we have less than 50
        const targetCollections = 50;
        const existingCollections = collections.length;
        
        if (existingCollections < targetCollections) {
            const collectionsToAdd = targetCollections - existingCollections;
            
            for (let i = 0; i < collectionsToAdd; i++) {
                const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
                const randomBin = bins[Math.floor(Math.random() * bins.length)];
                
                // Random date in the past 7 days
                const daysAgo = Math.floor(Math.random() * 7);
                const collectionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                
                const collection = {
                    binId: randomBin.id,
                    driverId: randomDriver.id,
                    driverName: randomDriver.name,
                    vehicleId: randomDriver.vehicleId || 'DA130-01',
                    binLocation: randomBin.location,
                    originalFill: 70 + Math.floor(Math.random() * 30),
                    weight: 40 + Math.floor(Math.random() * 60),
                    temperature: 20 + Math.floor(Math.random() * 10),
                    timestamp: collectionDate.toISOString(),
                    duration: 10 + Math.floor(Math.random() * 20), // minutes
                    routeId: `RTE-${Date.now()}-${i}`
                };
                
                window.dataManager.addCollection(collection);
            }
            
            console.log(`✅ Added ${collectionsToAdd} collection records`);
        }
    }
    
    populateDriverHistory() {
        console.log('👤 Populating driver history...');
        
        const drivers = window.dataManager.getDrivers();
        const collections = window.dataManager.getCollections();
        
        drivers.forEach(driver => {
            const driverCollections = collections.filter(c => c.driverId === driver.id);
            
            // Update driver statistics
            const updates = {
                totalCollections: driverCollections.length,
                rating: 4.2 + Math.random() * 0.8,
                efficiency: 75 + Math.floor(Math.random() * 25),
                onTimeDelivery: 85 + Math.floor(Math.random() * 15),
                fuelEfficiency: 80 + Math.floor(Math.random() * 20),
                lastActive: new Date().toISOString()
            };
            
            window.dataManager.updateUser(driver.id, updates);
        });
        
        console.log(`✅ Updated history for ${drivers.length} drivers`);
    }
    
    populateAnalytics() {
        console.log('📊 Populating analytics data...');
        
        const collections = window.dataManager.getCollections();
        const bins = window.dataManager.getBins();
        const drivers = window.dataManager.getDrivers();
        const complaints = window.dataManager.getComplaints();
        
        // Calculate realistic analytics
        const analytics = {
            // City Cleanliness
            cleanlinessIndex: 87,
            cleanlinessScore: 87,
            
            // Collections
            totalCollections: collections.length,
            todayCollections: collections.filter(c => {
                const today = new Date().toDateString();
                return new Date(c.timestamp).toDateString() === today;
            }).length,
            weeklyCollections: collections.filter(c => {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return new Date(c.timestamp) > weekAgo;
            }).length,
            monthlyCollections: collections.length,
            
            // Waste
            totalPaperCollected: collections.reduce((sum, c) => sum + (c.weight || 50), 0),
            totalWasteProcessed: collections.reduce((sum, c) => sum + (c.weight || 50), 0),
            
            // Response
            avgResponseTime: 18 + Math.floor(Math.random() * 10),
            responseTime: 22,
            
            // Satisfaction
            citizenSatisfaction: 92,
            satisfactionRate: 92,
            
            // Efficiency
            costReduction: 28,
            efficiencyImprovement: 35,
            carbonReduction: 22,
            
            // Fleet
            activeDrivers: drivers.filter(d => d.status === 'active').length,
            fleetUtilization: 78,
            vehicleUptime: 94,
            
            // Bins
            totalBins: bins.length,
            activeBins: bins.filter(b => b.status !== 'offline').length,
            fullBins: bins.filter(b => b.fill >= 90).length,
            warningBins: bins.filter(b => b.fill >= 70 && b.fill < 90).length,
            normalBins: bins.filter(b => b.fill < 70).length,
            
            // Alerts
            totalAlerts: window.dataManager.getActiveAlerts().length,
            criticalAlerts: window.dataManager.getActiveAlerts().filter(a => a.priority === 'high').length,
            
            // Complaints
            totalComplaints: complaints.length,
            activeComplaints: complaints.filter(c => c.status !== 'resolved').length,
            resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
            complaintResolutionRate: complaints.length > 0 ? 
                Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100) : 95,
            
            // Performance
            systemUptime: 99.7,
            dataAccuracy: 98.5,
            predictionAccuracy: 94.2,
            
            // Environmental
            co2Saved: 1250 + Math.floor(Math.random() * 500),
            recyclingRate: 68,
            wasteRecoveryRate: 72,
            
            // Financial
            costSavings: 145000 + Math.floor(Math.random() * 50000),
            operationalCostReduction: 28,
            
            // Updated timestamps
            lastUpdated: new Date().toISOString(),
            reportingPeriod: 'Last 30 Days'
        };
        
        window.dataManager.setData('analytics', analytics);
        console.log('✅ Analytics populated with comprehensive metrics');
    }
    
    populateComplaints() {
        console.log('📝 Populating complaints data...');
        
        const complaints = window.dataManager.getComplaints();
        
        if (complaints.length < 10) {
            const complaintTypes = ['overflow', 'missed_collection', 'damaged_bin', 'odor', 'placement'];
            const priorities = ['high', 'medium', 'low'];
            const statuses = ['open', 'in_progress', 'resolved'];
            const locations = [
                'Pearl Qatar Tower B',
                'Al Sadd District',
                'West Bay Area',
                'Lusail City',
                'Education City',
                'Aspire Zone',
                'Al Wakra',
                'The Gate Mall',
                'Ezdan Mall',
                'Villagio Mall'
            ];
            
            const complaintsToAdd = 10 - complaints.length;
            
            for (let i = 0; i < complaintsToAdd; i++) {
                const daysAgo = Math.floor(Math.random() * 14);
                const complaint = {
                    type: complaintTypes[Math.floor(Math.random() * complaintTypes.length)],
                    location: locations[Math.floor(Math.random() * locations.length)],
                    description: 'Demo complaint for presentation purposes',
                    priority: priorities[Math.floor(Math.random() * priorities.length)],
                    email: `resident${i}@demo.qa`,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
                };
                
                window.dataManager.addComplaint(complaint);
            }
            
            console.log(`✅ Added ${complaintsToAdd} complaints`);
        }
    }
    
    populateRoutes() {
        console.log('🛣️ Populating routes data...');
        
        const routes = window.dataManager.getRoutes();
        const drivers = window.dataManager.getDrivers();
        const bins = window.dataManager.getBins();
        
        if (routes.length < 5 && drivers.length > 0 && bins.length > 0) {
            const routesToAdd = Math.min(5 - routes.length, drivers.length);
            
            for (let i = 0; i < routesToAdd; i++) {
                const driver = drivers[i % drivers.length];
                const numBins = 3 + Math.floor(Math.random() * 5);
                const routeBins = [];
                
                for (let j = 0; j < numBins; j++) {
                    const randomBin = bins[Math.floor(Math.random() * bins.length)];
                    if (!routeBins.includes(randomBin.id)) {
                        routeBins.push(randomBin.id);
                    }
                }
                
                const route = {
                    driverId: driver.id,
                    binIds: routeBins,
                    bins: routeBins,
                    status: ['pending', 'active', 'completed'][Math.floor(Math.random() * 3)],
                    assignedBy: 'USR-002',
                    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
                    estimatedDuration: 45 + Math.floor(Math.random() * 60),
                    distance: 10 + Math.floor(Math.random() * 20)
                };
                
                window.dataManager.addRoute(route);
            }
            
            console.log(`✅ Added ${routesToAdd} routes`);
        }
    }
    
    updateDashboardMetrics() {
        console.log('📈 Updating dashboard metrics...');
        
        const analytics = window.dataManager.getAnalytics();
        
        // Update City Cleanliness Index
        const cleanlinessElement = document.getElementById('cleanlinessIndex');
        const cleanlinessProgress = document.getElementById('cleanlinessProgress');
        if (cleanlinessElement) {
            cleanlinessElement.textContent = `${analytics.cleanlinessIndex || 87}%`;
            cleanlinessElement.style.color = '#10b981';
        }
        if (cleanlinessProgress) {
            cleanlinessProgress.style.width = `${analytics.cleanlinessIndex || 87}%`;
        }
        
        // Update Today's Collections
        const collectionsElement = document.getElementById('todayCollections');
        const collectionsProgress = document.getElementById('collectionsProgress');
        if (collectionsElement) {
            collectionsElement.textContent = analytics.todayCollections || 12;
            collectionsElement.style.color = '#10b981';
        }
        if (collectionsProgress) {
            const progressPercent = Math.min(100, ((analytics.todayCollections || 12) / 20) * 100);
            collectionsProgress.style.width = `${progressPercent}%`;
        }
        
        // Update Response Time
        const responseElement = document.getElementById('responseTime');
        const responseProgress = document.getElementById('responseProgress');
        if (responseElement) {
            responseElement.textContent = `${analytics.avgResponseTime || 22} min`;
            responseElement.style.color = '#10b981';
        }
        if (responseProgress) {
            const progressPercent = Math.max(0, 100 - analytics.avgResponseTime || 78);
            responseProgress.style.width = `${progressPercent}%`;
        }
        
        // Update Satisfaction Rate
        const satisfactionElement = document.getElementById('satisfactionRate');
        const satisfactionProgress = document.getElementById('satisfactionProgress');
        if (satisfactionElement) {
            satisfactionElement.textContent = `${analytics.citizenSatisfaction || 92}%`;
            satisfactionElement.style.color = '#10b981';
        }
        if (satisfactionProgress) {
            satisfactionProgress.style.width = `${analytics.citizenSatisfaction || 92}%`;
        }
        
        console.log('✅ Dashboard metrics updated');
    }
    
    refreshAllDisplays() {
        console.log('🔄 Refreshing all displays...');
        
        // Trigger app refresh if available
        if (window.app && typeof window.app.loadDashboardData === 'function') {
            setTimeout(() => {
                window.app.loadDashboardData();
            }, 500);
        }
        
        // Refresh analytics if available
        if (window.app && typeof window.app.updateAnalytics === 'function') {
            setTimeout(() => {
                window.app.updateAnalytics();
            }, 1000);
        }
        
        // Update dashboard metrics again to ensure visibility
        setTimeout(() => {
            this.updateDashboardMetrics();
        }, 1500);
        
        console.log('✅ All displays refreshed');
    }
    
    // Public method to trigger data population manually
    async populateNow() {
        console.log('🎬 Manual data population triggered...');
        return await this.populateAllData();
    }
}

// Create global instance
window.demoDataPopulator = new DemoDataPopulator();

// Auto-populate on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.demoDataPopulator.populateAllData();
        }, 2000); // Wait 2 seconds for all systems to load
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        window.demoDataPopulator.populateAllData();
    }, 2000);
}

// Add manual trigger command
window.populateDemoData = function() {
    console.log('🎭 Populating demo data manually...');
    return window.demoDataPopulator.populateNow();
};

console.log('✅ Demo Data Populator loaded');
console.log('💡 Run window.populateDemoData() to manually populate demo data');

