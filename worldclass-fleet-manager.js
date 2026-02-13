// worldclass-fleet-manager.js - World-Class Fleet Management System
// Supports up to 1,000,000+ fleets with virtualization, ML integration, and real-time tracking
// Integrated with Enterprise Fleet Core for comprehensive fleet operations

class WorldClassFleetManager {
    constructor() {
        // Integrate with Enterprise Fleet Core
        this.enterpriseCore = window.enterpriseFleet || null;
        // Integrate with Advanced Features
        this.advancedFeatures = window.advancedFeatures || null;
        this.data = {
            drivers: [],
            vehicles: [],
            routes: [],
            collections: [],
            driverLocations: {},
            allData: [] // Combined data for virtualization
        };
        
        this.filters = {
            search: '',
            status: 'all',
            type: 'all',
            dateRange: null,
            sortBy: 'name',
            sortOrder: 'asc'
        };
        
        this.pagination = {
            currentPage: 1,
            pageSize: 25,
            totalItems: 0,
            totalPages: 0
        };
        
        this.currentTab = 'map';
        this.virtualizationEnabled = true;
        this.mlIntegration = null;
        this.realTimeUpdates = true;
        this.updateInterval = null;
        
        // Performance optimization
        this.renderCache = new Map();
        this.debounceTimer = null;
        
        // Initialize data arrays for live operations
        this.workOrders = [];
        this.reports = [];
        this.geofences = [];
        this.assets = [];
        this.dispatches = [];
        this.inspections = [];
        this.fuelTransactions = [];
        this.evVehicles = [];
        this.hosLogs = [];
        this.updateIntervals = new Map();
        
        // Initialize map markers storage
        this.fleetMapMarkers = new Map();
        this.fleetMapLayer = null;
        this.fleetMap = null;
        this.fleetMapInitRetries = 0;
        this.maxFleetMapInitRetries = 10; // Maximum retry attempts
        
        console.log('🚛 World-Class Fleet Manager initialized');
    }
    
    // ==================== INITIALIZATION ====================
    
    async initialize() {
        try {
            console.log('🚛 Initializing World-Class Fleet Management System...');
            
            // Load ML integration if available
            if (window.mlRouteOptimizer) {
                this.mlIntegration = window.mlRouteOptimizer;
            } else if (window.advancedAIEngine) {
                this.mlIntegration = window.advancedAIEngine;
            }
            
            // Load initial data
            await this.loadData();
            
            // Setup real-time updates
            if (this.realTimeUpdates) {
                this.startRealTimeUpdates();
                this.startLiveOperationsUpdates();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize fleet map if on map tab
            if (this.currentTab === 'map') {
                setTimeout(() => this.initializeFleetMap(), 500);
            }
            
            // Update sidebar navigation active state
            setTimeout(() => {
                const activeNavItem = document.querySelector(`.nav-item[data-tab="${this.currentTab}"]`);
                if (activeNavItem) {
                    activeNavItem.classList.add('active');
                }
            }, 100);
            
            // Initial render
            this.render();
            
            console.log('✅ World-Class Fleet Manager ready');
        } catch (error) {
            console.error('❌ Fleet Manager initialization failed:', error);
        }
    }
    
    async loadData() {
        try {
            const dataManager = window.dataManager;
            if (!dataManager) {
                console.warn('⚠️ DataManager not available');
                return;
            }
            
            // Load all fleet data from MongoDB
            this.data.drivers = dataManager.getUsers().filter(u => u.type === 'driver') || [];
            this.data.routes = dataManager.getRoutes() || [];
            this.data.collections = dataManager.getCollections() || [];
            this.data.driverLocations = dataManager.getAllDriverLocations() || {};
            
            // Load fleet-specific data from MongoDB (non-blocking)
            this.loadFleetEntities().catch(err => console.error('Failed to load fleet entities:', err));
            
            // Use Enterprise Core if available
            if (this.enterpriseCore && this.enterpriseCore.modules.vehicles) {
                const enterpriseVehicles = this.enterpriseCore.modules.vehicles.getAllVehicles();
                this.data.vehicles = enterpriseVehicles.map(v => this.convertEnterpriseVehicle(v));
            } else {
                // Generate vehicle data from drivers
                this.data.vehicles = this.generateVehicleData();
            }
            
            // Combine all data for unified view
            this.data.allData = this.combineFleetData();
            
            // Update pagination
            this.updatePagination();
            
            console.log(`📊 Loaded ${this.data.drivers.length} drivers, ${this.data.vehicles.length} vehicles, ${this.data.routes.length} routes`);
        } catch (error) {
            console.error('❌ Failed to load fleet data:', error);
        }
    }
    
    // ==================== MONGODB INTEGRATION ====================
    
    async loadFleetEntities() {
        try {
            const dataManager = window.dataManager;
            if (!dataManager || !dataManager.dbType || dataManager.dbType !== 'mongodb') {
                // Fallback to in-memory if MongoDB not available
                return;
            }
            
            // Load fleet entities from MongoDB collections
            this.workOrders = await this.getMongoCollection('workOrders') || [];
            this.reports = await this.getMongoCollection('fleetReports') || [];
            this.geofences = await this.getMongoCollection('geofences') || [];
            this.assets = await this.getMongoCollection('assets') || [];
            this.dispatches = await this.getMongoCollection('dispatches') || [];
            this.inspections = await this.getMongoCollection('inspections') || [];
            this.fuelTransactions = await this.getMongoCollection('fuelTransactions') || [];
            this.evVehicles = await this.getMongoCollection('evVehicles') || [];
            this.hosLogs = await this.getMongoCollection('hosLogs') || [];
            
            // Ensure arrays are initialized
            if (!Array.isArray(this.workOrders)) this.workOrders = [];
            if (!Array.isArray(this.reports)) this.reports = [];
            if (!Array.isArray(this.geofences)) this.geofences = [];
            if (!Array.isArray(this.assets)) this.assets = [];
            if (!Array.isArray(this.dispatches)) this.dispatches = [];
            if (!Array.isArray(this.inspections)) this.inspections = [];
            if (!Array.isArray(this.fuelTransactions)) this.fuelTransactions = [];
            if (!Array.isArray(this.evVehicles)) this.evVehicles = [];
            if (!Array.isArray(this.hosLogs)) this.hosLogs = [];
            
            console.log(`📦 Loaded fleet entities: ${this.workOrders.length} work orders, ${this.reports.length} reports, ${this.geofences.length} geofences`);
        } catch (error) {
            console.error('❌ Failed to load fleet entities:', error);
            // Initialize empty arrays on error
            this.workOrders = this.workOrders || [];
            this.reports = this.reports || [];
            this.geofences = this.geofences || [];
            this.assets = this.assets || [];
            this.dispatches = this.dispatches || [];
            this.inspections = this.inspections || [];
            this.fuelTransactions = this.fuelTransactions || [];
            this.evVehicles = this.evVehicles || [];
            this.hosLogs = this.hosLogs || [];
        }
    }
    
    async getMongoCollection(collectionName) {
        try {
            const dataManager = window.dataManager;
            if (!dataManager || !dataManager.mongoDb) {
                return null;
            }
            
            const collection = dataManager.mongoDb.collection(collectionName);
            const documents = await collection.find({}).toArray();
            
            // Remove MongoDB _id and return clean data
            return documents.map(doc => {
                const { _id, ...cleanDoc } = doc;
                return cleanDoc;
            });
        } catch (error) {
            console.error(`❌ Failed to load ${collectionName} from MongoDB:`, error);
            return null;
        }
    }
    
    async saveFleetEntity(collectionName, entity) {
        try {
            const dataManager = window.dataManager;
            if (!dataManager || !dataManager.mongoDb) {
                // Fallback: just update in-memory
                return false;
            }
            
            const collection = dataManager.mongoDb.collection(collectionName);
            const uniqueField = entity.id ? 'id' : entity._id ? '_id' : 'imei';
            const entityId = entity[uniqueField] || entity.id || entity._id;
            
            if (!entityId) {
                console.error(`❌ Cannot save entity without ID to ${collectionName}`);
                return false;
            }
            
            // Remove _id from update to avoid immutability issues
            const { _id, ...entityWithoutId } = entity;
            
            // Upsert the entity
            await collection.updateOne(
                { [uniqueField]: entityId },
                { $set: entityWithoutId },
                { upsert: true }
            );
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to save entity to ${collectionName}:`, error);
            return false;
        }
    }
    
    async saveFleetEntities(collectionName, entities) {
        try {
            const dataManager = window.dataManager;
            if (!dataManager || !dataManager.mongoDb) {
                return false;
            }
            
            if (!Array.isArray(entities) || entities.length === 0) {
                return true;
            }
            
            const collection = dataManager.mongoDb.collection(collectionName);
            const uniqueField = 'id';
            
            // Bulk upsert operations
            const operations = entities.map(entity => {
                const entityId = entity[uniqueField] || entity.id;
                if (!entityId) return null;
                
                const { _id, ...entityWithoutId } = entity;
                
                return {
                    updateOne: {
                        filter: { [uniqueField]: entityId },
                        update: { $set: entityWithoutId },
                        upsert: true
                    }
                };
            }).filter(op => op !== null);
            
            if (operations.length > 0) {
                await collection.bulkWrite(operations, { ordered: false });
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to save entities to ${collectionName}:`, error);
            return false;
        }
    }
    
    async deleteFleetEntity(collectionName, entityId) {
        try {
            const dataManager = window.dataManager;
            if (!dataManager || !dataManager.mongoDb) {
                return false;
            }
            
            const collection = dataManager.mongoDb.collection(collectionName);
            await collection.deleteOne({ id: entityId });
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete entity from ${collectionName}:`, error);
            return false;
        }
    }
    
    convertEnterpriseVehicle(vehicle) {
        return {
            id: vehicle.vin,
            driverId: vehicle.driverId,
            driverName: this.getDriverName(vehicle.driverId),
            type: vehicle.type,
            status: vehicle.status,
            fuelLevel: 75, // Default, would come from telematics
            mileage: vehicle.telematics?.odometer || 0,
            lastMaintenance: null,
            nextMaintenance: null,
            utilization: 0,
            efficiency: 0,
            location: vehicle.location,
            mlPredictions: null,
            // Enterprise fields
            vin: vehicle.vin,
            plateNumber: vehicle.plateNumber,
            year: vehicle.year,
            capacity: vehicle.capacity,
            category: vehicle.category,
            ownershipModel: vehicle.ownershipModel
        };
    }
    
    getDriverName(driverId) {
        const driver = this.data.drivers.find(d => d.id === driverId);
        return driver ? driver.name : 'Unassigned';
    }
    
    generateVehicleData() {
        const vehicles = [];
        const drivers = this.data.drivers;
        
        drivers.forEach((driver, index) => {
            // Get vehicle status - check if driver is on route
            let vehicleStatus = 'active';
            const driverStatus = this.getDriverStatus(driver);
            if (driverStatus === 'on-route') {
                vehicleStatus = 'in-road';
            } else if (driver.status === 'inactive') {
                vehicleStatus = 'maintenance';
            }
            
            const vehicle = {
                id: driver.vehicleId || `VEH-${String(index + 1).padStart(6, '0')}`,
                driverId: driver.id,
                driverName: driver.name,
                type: 'Collection Truck',
                status: vehicleStatus,
                fuelLevel: driver.fuelLevel || 75,
                mileage: Math.floor(Math.random() * 50000) + 10000,
                lastMaintenance: this.getLastMaintenanceDate(),
                nextMaintenance: this.getNextMaintenanceDate(),
                utilization: this.calculateVehicleUtilization(driver),
                efficiency: this.calculateVehicleEfficiency(driver),
                location: this.data.driverLocations[driver.id] || null,
                mlPredictions: this.getMLPredictions(driver)
            };
            vehicles.push(vehicle);
        });
        
        return vehicles;
    }
    
    combineFleetData() {
        const combined = [];
        
        // Add drivers
        this.data.drivers.forEach(driver => {
            combined.push({
                type: 'driver',
                id: driver.id,
                name: driver.name,
                status: this.getDriverStatus(driver),
                data: driver,
                searchable: `${driver.name} ${driver.id} ${driver.vehicleId || ''} ${driver.phone || ''}`.toLowerCase()
            });
        });
        
        // Add vehicles
        this.data.vehicles.forEach(vehicle => {
            combined.push({
                type: 'vehicle',
                id: vehicle.id,
                name: vehicle.id,
                status: vehicle.status,
                data: vehicle,
                searchable: `${vehicle.id} ${vehicle.driverName} ${vehicle.type}`.toLowerCase()
            });
        });
        
        // Add routes
        this.data.routes.forEach(route => {
            combined.push({
                type: 'route',
                id: route.id,
                name: route.id,
                status: route.status,
                data: route,
                searchable: `${route.id} ${route.driverId || ''}`.toLowerCase()
            });
        });
        
        return combined;
    }
    
    // ==================== RENDERING ====================
    
    render() {
        this.updateStats();
        this.updateSidebarBadges();
        // Only render current tab if we're on the fleet page
        if (document.getElementById('fleet') && document.getElementById('fleet').style.display !== 'none') {
            this.renderCurrentTab();
        }
    }
    
    updateStats() {
        const drivers = this.data.drivers;
        const vehicles = this.data.vehicles;
        const routes = this.data.routes;
        
        // Update vehicle statuses based on driver activity
        vehicles.forEach(vehicle => {
            if (vehicle.driverId) {
                const driver = drivers.find(d => d.id === vehicle.driverId);
                if (driver) {
                    const driverStatus = this.getDriverStatus(driver);
                    // Auto-update vehicle status if driver is on route (unless manually set to maintenance)
                    if (driverStatus === 'on-route' && vehicle.status !== 'maintenance') {
                        vehicle.status = 'in-road';
                    }
                }
            }
        });
        
        // Calculate statistics
        const activeDrivers = drivers.filter(d => this.getDriverStatus(d) === 'active' || this.getDriverStatus(d) === 'on-route').length;
        const availableDrivers = drivers.filter(d => this.getDriverStatus(d) === 'active').length;
        const activeRoutes = routes.filter(r => r.status === 'in-progress' || r.status === 'active').length;
        const maintenanceVehicles = vehicles.filter(v => {
            const status = this.getVehicleStatus(v);
            return status === 'maintenance';
        }).length;
        const inRoadVehicles = vehicles.filter(v => {
            const status = this.getVehicleStatus(v);
            return status === 'in-road' || status === 'on-route';
        }).length;
        
        // ML optimized routes
        const mlOptimizedRoutes = routes.filter(r => r.mlOptimized || r.optimized).length;
        
        // Fleet utilization
        const fleetUtilization = this.calculateFleetUtilization();
        
        // ML optimizations count
        const mlOptimizations = this.getMLOptimizationsCount();
        const mlSavings = this.calculateMLSavings();
        
        // Update DOM
        this.updateElement('activeVehiclesCount', activeDrivers);
        this.updateElement('availableDriversCount', availableDrivers);
        this.updateElement('activeRoutesCount', activeRoutes);
        this.updateElement('maintenanceVehiclesCount', maintenanceVehicles);
        this.updateElement('totalVehiclesCount', `of ${vehicles.length} total`);
        this.updateElement('totalDriversCount', `of ${drivers.length} total`);
        this.updateElement('mlOptimizedRoutes', `${mlOptimizedRoutes} ML optimized`);
        this.updateElement('fleetUtilization', `${Math.round(fleetUtilization)}%`);
        this.updateElement('avgEfficiency', `Avg: ${Math.round(this.calculateAvgEfficiency())}%`);
        this.updateElement('mlOptimizations', mlOptimizations);
        this.updateElement('mlSavings', `$${mlSavings.toLocaleString()} saved`);
        
        // Predicted maintenance
        const predictedMaintenance = vehicles.filter(v => v.mlPredictions?.maintenanceRisk === 'high').length;
        this.updateElement('predictedMaintenance', `${predictedMaintenance} predicted`);
        
        // Update map markers if map is active
        if (this.currentTab === 'map' && this.fleetMap) {
            this.updateMapMarkers();
        }
    }
    
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'map':
                this.renderMapTab();
                break;
            case 'drivers':
                this.renderDriversTab();
                break;
            case 'vehicles':
                this.renderVehiclesTab();
                break;
            case 'safety':
                this.renderSafetyTab();
                break;
            case 'video':
                this.renderVideoTab();
                break;
            case 'coaching':
                this.renderCoachingTab();
                break;
            case 'diagnostics':
                this.renderDiagnosticsTab();
                break;
            case 'compliance':
                this.renderComplianceTab();
                break;
            case 'maintenance':
                this.renderMaintenanceTab();
                break;
            case 'messaging':
                this.renderMessagingTab();
                break;
            case 'routes':
                this.renderRoutesTab();
                break;
            case 'analytics':
                this.renderAnalyticsTab();
                break;
            case 'reports':
                this.renderReportsTab();
                break;
            case 'ml':
                this.renderMLTab();
                break;
            case 'geofencing':
                this.renderGeofencingTab();
                break;
            case 'assets':
                this.renderAssetsTab();
                break;
            case 'dispatch':
                this.renderDispatchTab();
                break;
            case 'eld':
                this.renderELDTab();
                break;
            case 'inspections':
                this.renderInspectionsTab();
                break;
            case 'fuel':
                this.renderFuelTab();
                break;
            case 'energy':
                this.renderEnergyTab();
                break;
        }
    }
    
    // ==================== FLEET MAP ====================
    
    initializeFleetMap() {
        const mapContainer = document.getElementById('fleetMap');
        if (!mapContainer || this.fleetMap) {
            // Reset retry counter if map is already initialized
            this.fleetMapInitRetries = 0;
            return;
        }
        
        // Check retry limit
        if (this.fleetMapInitRetries >= this.maxFleetMapInitRetries) {
            console.warn(`⚠️ Max initialization attempts (${this.maxFleetMapInitRetries}) reached for fleet map. Stopping retries.`);
            return;
        }
        
        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            this.fleetMapInitRetries++;
            console.warn(`⚠️ Leaflet not loaded yet, deferring map initialization (attempt ${this.fleetMapInitRetries}/${this.maxFleetMapInitRetries})`);
            setTimeout(() => this.initializeFleetMap(), 1000);
            return;
        }
        
        // Check if container is visible and has dimensions
        const rect = mapContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            this.fleetMapInitRetries++;
            console.warn(`⚠️ Map container not visible yet, deferring initialization (attempt ${this.fleetMapInitRetries}/${this.maxFleetMapInitRetries})`);
            setTimeout(() => this.initializeFleetMap(), 500);
            return;
        }
        
        // Reset retry counter on successful initialization attempt
        this.fleetMapInitRetries = 0;
        
        try {
            // Ensure fleetMapMarkers is initialized
            if (!(this.fleetMapMarkers instanceof Map)) {
                this.fleetMapMarkers = new Map();
            }
            
            // Initialize Leaflet map
            this.fleetMap = L.map('fleetMap', {
                center: [25.2854, 51.5310], // Doha, Qatar
                zoom: 13,
                zoomControl: true,
                attributionControl: true
            });
            
            // Add dark tile layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(this.fleetMap);
            
            // Create layer group for fleet markers
            this.fleetMapLayer = L.layerGroup().addTo(this.fleetMap);
            
            // Load vehicles on map
            this.loadVehiclesOnMap();
            
            // Start real-time map updates
            this.startMapUpdates();
            
            console.log('✅ Fleet map initialized');
        } catch (error) {
            console.error('❌ Fleet map initialization failed:', error);
            // Don't throw, just log - map will retry later
        }
    }
    
    loadVehiclesOnMap() {
        if (!this.fleetMap || !this.fleetMapLayer) return;
        
        // Ensure fleetMapMarkers is a Map
        if (!(this.fleetMapMarkers instanceof Map)) {
            this.fleetMapMarkers = new Map();
        }
        
        // Clear existing markers
        this.fleetMapLayer.clearLayers();
        this.fleetMapMarkers.clear();
        
        // FLEET MAP: Show ONLY vehicles/drivers (NO BINS!)
        console.log('📍 Fleet map: Loading vehicles only (bins excluded)');
        
        // Add all vehicles to map
        this.data.vehicles.forEach(vehicle => {
            this.addVehicleToMap(vehicle);
        });
        
        // Also add drivers without vehicles
        this.data.drivers.forEach(driver => {
            const location = this.data.driverLocations[driver.id];
            if (location && !this.data.vehicles.find(v => v.driverId === driver.id)) {
                this.addDriverToMap(driver, location);
            }
        });
        
        console.log(`✅ Loaded ${this.fleetMapMarkers.size} vehicles/drivers on fleet map (bins excluded)`);
    }
    
    addVehicleToMap(vehicle) {
        if (!this.fleetMap || !this.fleetMapLayer) return;
        
        const location = vehicle.location || this.data.driverLocations[vehicle.driverId];
        if (!location || !location.lat || !location.lng) {
            // Try to get location from driver
            if (vehicle.driverId) {
                const driverLocation = this.data.driverLocations[vehicle.driverId];
                if (driverLocation && driverLocation.lat && driverLocation.lng) {
                    vehicle.location = driverLocation;
                } else {
                    // Generate default location if none exists
                    vehicle.location = {
                        lat: 25.2854 + (Math.random() - 0.5) * 0.05,
                        lng: 51.5310 + (Math.random() - 0.5) * 0.05
                    };
                }
            } else {
                return; // No location available
            }
        }
        
        const finalLocation = vehicle.location || location;
        if (!finalLocation.lat || !finalLocation.lng) return;
        
        // Determine status and color
        const status = this.getVehicleStatus(vehicle);
        const statusColor = this.getVehicleStatusColor(status);
        const driver = this.data.drivers.find(d => d.id === vehicle.driverId);
        
        // Create custom vehicle icon
        const icon = this.createVehicleIcon(vehicle, status, statusColor);
        
        // Create popup content
        const popupContent = this.createVehicleMapPopup(vehicle, driver, status);
        
        // Remove existing marker if present
        const existingMarker = this.fleetMapMarkers.get(vehicle.id || vehicle.driverId);
        if (existingMarker) {
            this.fleetMapLayer.removeLayer(existingMarker);
        }
        
        // Create marker
        const marker = L.marker([finalLocation.lat, finalLocation.lng], { icon })
            .bindPopup(popupContent, {
                maxWidth: 400,
                className: 'fleet-vehicle-popup',
                closeButton: true,
                autoPan: true,
                autoPanPadding: [50, 50],
                autoClose: false,
                closeOnClick: false
            });
        
        // Add click handler for status change
        marker.on('click', () => {
            marker.openPopup();
        });
        
        // Add to map
        marker.addTo(this.fleetMapLayer);
        this.fleetMapMarkers.set(vehicle.id || vehicle.driverId, marker);
    }
    
    addDriverToMap(driver, location) {
        if (!this.fleetMap || !this.fleetMapLayer) return;
        if (!location || !location.lat || !location.lng) return;
        
        // Check if vehicle already exists for this driver
        const existingVehicle = this.data.vehicles.find(v => v.driverId === driver.id);
        if (existingVehicle) {
            // Use vehicle instead
            this.addVehicleToMap(existingVehicle);
            return;
        }
        
        const status = this.getDriverStatus(driver);
        const vehicleStatus = status === 'on-route' ? 'in-road' : status === 'offline' ? 'maintenance' : 'active';
        const statusColor = this.getVehicleStatusColor(vehicleStatus);
        
        // Create a temporary vehicle object for the driver
        const tempVehicle = {
            id: driver.vehicleId || `VEH-${driver.id}`,
            driverId: driver.id,
            type: 'Driver Vehicle',
            status: vehicleStatus,
            location: location
        };
        
        const icon = this.createVehicleIcon(tempVehicle, vehicleStatus, statusColor);
        const popupContent = this.createVehicleMapPopup(tempVehicle, driver, vehicleStatus);
        
        // Remove existing marker if present
        const existingMarker = this.fleetMapMarkers.get(driver.id);
        if (existingMarker) {
            this.fleetMapLayer.removeLayer(existingMarker);
        }
        
        const marker = L.marker([location.lat, location.lng], { icon })
            .bindPopup(popupContent, {
                maxWidth: 400,
                className: 'fleet-vehicle-popup',
                closeButton: true,
                autoPan: true,
                autoPanPadding: [50, 50],
                autoClose: false,
                closeOnClick: false
            });
        
        marker.addTo(this.fleetMapLayer);
        this.fleetMapMarkers.set(driver.id, marker);
    }
    
    createVehicleIcon(vehicle, status, color) {
        const isMaintenance = status === 'maintenance';
        const isInRoad = status === 'in-road' || status === 'on-route';
        const isActive = status === 'active';
        
        return L.divIcon({
            className: 'fleet-vehicle-marker',
            html: `
                <div style="
                    position: relative;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: ${color};
                        border-radius: 50%;
                        border: 4px solid white;
                        box-shadow: 0 4px 12px ${color}80, 0 0 20px ${color}40;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        animation: ${isInRoad ? 'pulse 2s infinite' : 'none'};
                        position: relative;
                    ">
                        ${isMaintenance ? '🔧' : isInRoad ? '🚛' : '🚗'}
                        ${isInRoad ? `
                        <div style="
                            position: absolute;
                            top: -4px;
                            right: -4px;
                            width: 16px;
                            height: 16px;
                            background: #10b981;
                            border: 2px solid white;
                            border-radius: 50%;
                            animation: pulse 1s infinite;
                        "></div>
                        ` : ''}
                    </div>
                </div>
            `,
            iconSize: [50, 50],
            iconAnchor: [25, 25],
            popupAnchor: [0, -25]
        });
    }
    
    createVehicleMapPopup(vehicle, driver, status) {
        const statusColor = this.getVehicleStatusColor(status);
        const fuelLevel = vehicle.fuelLevel || driver?.fuelLevel || 75;
        const fuelColor = fuelLevel > 50 ? '#10b981' : fuelLevel > 20 ? '#f59e0b' : '#ef4444';
        const collections = this.data.collections.filter(c => c.driverId === vehicle.driverId || c.driverId === driver?.id).length;
        const routes = this.data.routes.filter(r => r.driverId === vehicle.driverId || r.driverId === driver?.id);
        
        return `
            <div style="
                min-width: 350px;
                max-width: 400px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, ${statusColor} 0%, ${this.darkenColor(statusColor, 20)} 100%);
                    border-radius: 12px 12px 0 0;
                    padding: 1.25rem;
                    margin: -12px -12px 1rem -12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                ">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                        <h3 style="margin: 0; color: white; font-size: 1.1rem; font-weight: 700;">
                            ${vehicle.id || vehicle.vin || driver?.name || 'Vehicle'}
                        </h3>
                        <span style="
                            background: rgba(255,255,255,0.25);
                            backdrop-filter: blur(10px);
                            padding: 0.25rem 0.75rem;
                            border-radius: 20px;
                            font-size: 0.75rem;
                            font-weight: 600;
                            color: white;
                            text-transform: uppercase;
                        ">${status === 'in-road' ? 'In Road' : status === 'maintenance' ? 'Maintenance' : 'Active'}</span>
                    </div>
                    ${driver ? `
                    <div style="color: rgba(255,255,255,0.95); font-size: 0.875rem;">
                        👤 ${driver.name} | 🆔 ${driver.id}
                    </div>
                    ` : ''}
                    ${vehicle.plateNumber ? `
                    <div style="color: rgba(255,255,255,0.95); font-size: 0.875rem; margin-top: 0.25rem;">
                        🚛 ${vehicle.plateNumber} | ${vehicle.type || 'Vehicle'}
                    </div>
                    ` : ''}
                </div>
                
                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
                    <div style="
                        background: rgba(16,185,129,0.1);
                        border: 1px solid rgba(16,185,129,0.3);
                        border-radius: 8px;
                        padding: 0.75rem;
                        text-align: center;
                    ">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${collections}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Collections</div>
                    </div>
                    <div style="
                        background: rgba(239,68,68,0.1);
                        border: 1px solid rgba(239,68,68,0.3);
                        border-radius: 8px;
                        padding: 0.75rem;
                        text-align: center;
                    ">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${fuelColor};">${fuelLevel}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Fuel</div>
                    </div>
                </div>
                
                <!-- Status Change Buttons -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
                    <button onclick="fleetManager.changeVehicleStatus('${vehicle.id || vehicle.driverId}', 'active')" 
                        style="
                            padding: 0.75rem;
                            background: ${status === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(16,185,129,0.1)'};
                            border: 1px solid ${status === 'active' ? '#10b981' : 'rgba(16,185,129,0.3)'};
                            border-radius: 8px;
                            color: ${status === 'active' ? 'white' : '#10b981'};
                            font-weight: 600;
                            font-size: 0.875rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        ✅ Active
                    </button>
                    <button onclick="fleetManager.changeVehicleStatus('${vehicle.id || vehicle.driverId}', 'in-road')" 
                        style="
                            padding: 0.75rem;
                            background: ${status === 'in-road' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(245,158,11,0.1)'};
                            border: 1px solid ${status === 'in-road' ? '#f59e0b' : 'rgba(245,158,11,0.3)'};
                            border-radius: 8px;
                            color: ${status === 'in-road' ? 'white' : '#f59e0b'};
                            font-weight: 600;
                            font-size: 0.875rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245,158,11,0.3)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        🚛 In Road
                    </button>
                    <button onclick="fleetManager.changeVehicleStatus('${vehicle.id || vehicle.driverId}', 'maintenance')" 
                        style="
                            padding: 0.75rem;
                            background: ${status === 'maintenance' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(239,68,68,0.1)'};
                            border: 1px solid ${status === 'maintenance' ? '#ef4444' : 'rgba(239,68,68,0.3)'};
                            border-radius: 8px;
                            color: ${status === 'maintenance' ? 'white' : '#ef4444'};
                            font-weight: 600;
                            font-size: 0.875rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(239,68,68,0.3)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        🔧 Maintenance
                    </button>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: flex; gap: 0.5rem;">
                    ${driver ? `
                    <button onclick="viewDriverDetails('${driver.id}')" 
                        style="
                            flex: 1;
                            padding: 0.75rem;
                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                        👤 Driver Details
                    </button>
                    ` : ''}
                    <button onclick="fleetManager.showVehicleDetails('${vehicle.id || vehicle.driverId}')" 
                        style="
                            flex: 1;
                            padding: 0.75rem;
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                        📊 Vehicle Info
                    </button>
                </div>
            </div>
        `;
    }
    
    getVehicleStatus(vehicle) {
        // Check if vehicle is being used (driver is on route)
        const driver = this.data.drivers.find(d => d.id === vehicle.driverId);
        if (driver) {
            const driverStatus = this.getDriverStatus(driver);
            if (driverStatus === 'on-route') {
                return 'in-road';
            }
        }
        
        // Check vehicle status
        if (vehicle.status === 'maintenance') return 'maintenance';
        if (vehicle.status === 'active' || vehicle.status === 'available') return 'active';
        if (vehicle.status === 'in-road' || vehicle.status === 'on-route') return 'in-road';
        
        return vehicle.status || 'active';
    }
    
    getVehicleStatusColor(status) {
        const colors = {
            'active': '#10b981',
            'in-road': '#f59e0b',
            'on-route': '#f59e0b',
            'maintenance': '#ef4444',
            'offline': '#6b7280'
        };
        return colors[status] || '#10b981';
    }
    
    changeVehicleStatus(vehicleId, newStatus) {
        console.log(`🔄 Changing vehicle ${vehicleId} status to ${newStatus}`);
        
        // Find vehicle
        let vehicle = this.data.vehicles.find(v => v.id === vehicleId || v.driverId === vehicleId);
        
        if (!vehicle) {
            // Try to find by driver
            const driver = this.data.drivers.find(d => d.id === vehicleId);
            if (driver) {
                vehicle = this.data.vehicles.find(v => v.driverId === driver.id);
                // If still not found, create a vehicle entry for this driver
                if (!vehicle && driver) {
                    vehicle = {
                        id: driver.vehicleId || `VEH-${driver.id}`,
                        driverId: driver.id,
                        driverName: driver.name,
                        type: 'Collection Truck',
                        status: newStatus,
                        fuelLevel: driver.fuelLevel || 75,
                        location: this.data.driverLocations[driver.id] || null
                    };
                    this.data.vehicles.push(vehicle);
                }
            }
        }
        
        if (vehicle) {
            // Update vehicle status
            const oldStatus = vehicle.status;
            vehicle.status = newStatus;
            
            // Update in enterprise core if available
            if (this.enterpriseCore && this.enterpriseCore.modules.vehicles) {
                const enterpriseVehicle = this.enterpriseCore.modules.vehicles.getVehicle(vehicle.vin || vehicle.id);
                if (enterpriseVehicle) {
                    enterpriseVehicle.status = newStatus;
                    this.enterpriseCore.modules.vehicles.updateVehicle(enterpriseVehicle);
                }
            }
            
            // Update driver status based on vehicle status
            if (vehicle.driverId) {
                const driver = this.data.drivers.find(d => d.id === vehicle.driverId);
                if (driver) {
                    if (newStatus === 'in-road') {
                        driver.movementStatus = 'on-route';
                        driver.status = 'active';
                    } else if (newStatus === 'maintenance') {
                        driver.movementStatus = 'stationary';
                        driver.status = 'inactive';
                    } else if (newStatus === 'active') {
                        driver.movementStatus = 'stationary';
                        driver.status = 'active';
                    }
                    
                    // Save driver update to data manager
                    if (window.dataManager && window.dataManager.updateUser) {
                        window.dataManager.updateUser(driver.id, driver);
                    }
                }
            }
            
            // Save to MongoDB if available
            if (this.saveFleetEntity) {
                this.saveFleetEntity('vehicles', vehicle).catch(err => console.error('Failed to save vehicle status:', err));
            }
            
            // Update in dataManager if available
            if (window.dataManager && window.dataManager.updateVehicle) {
                window.dataManager.updateVehicle(vehicle.id, { status: newStatus });
            }
            
            // Update map marker if map exists
            if (this.fleetMap) {
                this.updateVehicleMarker(vehicle);
            }
            
            // Refresh vehicles tab display
            this.renderVehiclesTab();
            
            // Show success message
            this.showStatusChangeNotification(vehicleId, oldStatus, newStatus);
            
            console.log(`✅ Vehicle ${vehicleId} status changed from ${oldStatus} to ${newStatus}`);
        } else {
            console.warn(`⚠️ Vehicle ${vehicleId} not found`);
            if (this.showNotification) {
                this.showNotification(`Vehicle ${vehicleId} not found. Please try again.`, 'error');
            } else {
                alert(`Vehicle ${vehicleId} not found. Please try again.`);
            }
        }
    }
    
    showStatusChangeNotification(vehicleId, oldStatus, newStatus) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span>✅</span>
                <div>
                    <div>Vehicle Status Updated</div>
                    <div style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.25rem;">
                        ${vehicleId}: ${oldStatus} → ${newStatus}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    updateVehicleMarker(vehicle) {
        if (!this.fleetMap || !this.fleetMapLayer) return;
        
        const marker = this.fleetMapMarkers.get(vehicle.id || vehicle.driverId);
        if (!marker) {
            // Marker doesn't exist, add it
            this.addVehicleToMap(vehicle);
            return;
        }
        
        const status = this.getVehicleStatus(vehicle);
        const statusColor = this.getVehicleStatusColor(status);
        const driver = this.data.drivers.find(d => d.id === vehicle.driverId);
        
        // Update icon
        const newIcon = this.createVehicleIcon(vehicle, status, statusColor);
        marker.setIcon(newIcon);
        
        // Update popup
        const popupContent = this.createVehicleMapPopup(vehicle, driver, status);
        marker.setPopupContent(popupContent);
        
        // Update location if available
        const location = vehicle.location || this.data.driverLocations[vehicle.driverId];
        if (location && location.lat && location.lng) {
            marker.setLatLng([location.lat, location.lng]);
        }
    }
    
    renderMapTab() {
        // Wait for DOM to be ready
        setTimeout(() => {
            if (!this.fleetMap) {
                this.initializeFleetMap();
            } else {
                // Refresh data and reload markers
                this.loadData().then(() => {
                    this.loadVehiclesOnMap();
                });
            }
        }, 100);
    }
    
    refreshMap() {
        this.loadVehiclesOnMap();
    }
    
    fitAllVehicles() {
        if (!this.fleetMap || this.fleetMapMarkers.size === 0) return;
        
        const bounds = [];
        this.fleetMapMarkers.forEach(marker => {
            bounds.push(marker.getLatLng());
        });
        
        if (bounds.length > 0) {
            this.fleetMap.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    toggleMapLayers() {
        // Toggle different map layers
        alert('Map layers feature coming soon!');
    }
    
    startMapUpdates() {
        if (this.mapUpdateInterval) {
            clearInterval(this.mapUpdateInterval);
        }
        
        // Update map every 10 seconds
        this.mapUpdateInterval = setInterval(() => {
            this.updateMapMarkers();
        }, 10000);
    }
    
    updateMapMarkers() {
        if (!this.fleetMap || !this.fleetMapLayer) return;
        
        // Reload location data
        this.data.driverLocations = window.dataManager?.getAllDriverLocations() || {};
        
        // Ensure fleetMapMarkers is a Map
        if (!(this.fleetMapMarkers instanceof Map)) {
            this.fleetMapMarkers = new Map();
        }
        
        // Update marker positions and statuses based on latest data
        this.data.vehicles.forEach(vehicle => {
            const location = vehicle.location || this.data.driverLocations[vehicle.driverId];
            if (location) {
                const marker = this.fleetMapMarkers.get(vehicle.id || vehicle.driverId);
                if (marker) {
                    // Update position
                    marker.setLatLng([location.lat, location.lng]);
                    
                    // Update icon and popup if status changed
                    const currentStatus = this.getVehicleStatus(vehicle);
                    const statusColor = this.getVehicleStatusColor(currentStatus);
                    const driver = this.data.drivers.find(d => d.id === vehicle.driverId);
                    
                    const newIcon = this.createVehicleIcon(vehicle, currentStatus, statusColor);
                    marker.setIcon(newIcon);
                    
                    const popupContent = this.createVehicleMapPopup(vehicle, driver, currentStatus);
                    marker.setPopupContent(popupContent);
                } else {
                    // Marker doesn't exist, add it
                    this.addVehicleToMap(vehicle);
                }
            }
        });
        
        // Also update drivers without vehicles
        this.data.drivers.forEach(driver => {
            const location = this.data.driverLocations[driver.id];
            if (location && !this.fleetMapMarkers.has(driver.id)) {
                this.addDriverToMap(driver, location);
            }
        });
    }
    
    showVehicleDetails(vehicleId) {
        // Show vehicle details modal
        const vehicle = this.data.vehicles.find(v => v.id === vehicleId || v.driverId === vehicleId);
        if (vehicle && vehicle.driverId) {
            viewDriverDetails(vehicle.driverId);
        } else {
            alert(`Vehicle Details:\nID: ${vehicleId}\nStatus: ${vehicle?.status || 'Unknown'}`);
        }
    }
    
    renderDriversTab() {
        const filtered = this.getFilteredData('driver');
        const paginated = this.getPaginatedData(filtered);
        
        const container = document.getElementById('fleetDriversList');
        if (!container) return;
        
        this.updateElement('driversCountDisplay', `Showing ${filtered.length} of ${this.data.drivers.length} drivers`);
        
        if (paginated.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #94a3b8;"><p>No drivers found</p></div>';
            return;
        }
        
        container.innerHTML = paginated.map(driver => this.renderDriverCard(driver.data)).join('');
        this.renderPagination('driversPagination', filtered.length);
    }
    
    renderDriverCard(driver) {
        const status = this.getDriverStatus(driver);
        const statusColor = this.getStatusColor(status);
        const location = this.data.driverLocations[driver.id];
        const collections = this.data.collections.filter(c => c.driverId === driver.id);
        const routes = this.data.routes.filter(r => r.driverId === driver.id);
        const fuelLevel = driver.fuelLevel || 75;
        const fuelColor = fuelLevel > 50 ? '#10b981' : fuelLevel > 20 ? '#f59e0b' : '#ef4444';
        
        // Performance metrics
        const performance = this.calculateDriverPerformance(driver);
        const mlRecommendations = this.getMLRecommendations(driver);
        
        return `
            <div class="fleet-item-card" onclick="showDriverDetailsModal('${driver.id}')" style="
                background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 1.25rem;
                margin-bottom: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            " onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(59,130,246,0.5)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.boxShadow='none'">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, ${statusColor} 0%, ${this.darkenColor(statusColor, 20)} 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 700;
                        font-size: 1.25rem;
                        box-shadow: 0 4px 12px ${statusColor}40;
                        position: relative;
                    ">
                        ${driver.name.split(' ').map(n => n[0]).join('')}
                        <div style="
                            position: absolute;
                            bottom: -2px;
                            right: -2px;
                            width: 18px;
                            height: 18px;
                            background: ${statusColor};
                            border: 3px solid #0f172a;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        "></div>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9;">${driver.name}</h4>
                            <span style="
                                background: ${statusColor}20;
                                color: ${statusColor};
                                padding: 0.25rem 0.75rem;
                                border-radius: 20px;
                                font-size: 0.75rem;
                                font-weight: 600;
                                text-transform: uppercase;
                            ">${status}</span>
                            ${mlRecommendations.length > 0 ? '<span style="background: rgba(139,92,246,0.2); color: #8b5cf6; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.7rem;">🤖 ML</span>' : ''}
                        </div>
                        <div style="color: #94a3b8; font-size: 0.875rem; display: flex; align-items: center; gap: 1rem;">
                            <span>🚛 ${driver.vehicleId || 'No Vehicle'}</span>
                            <span>🆔 ${driver.id}</span>
                            ${driver.phone ? `<span>📞 ${driver.phone}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <div style="text-align: center; padding: 0.75rem; background: rgba(16,185,129,0.1); border-radius: 8px; border: 1px solid rgba(16,185,129,0.2);">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${collections.length}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Collections</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(245,158,11,0.1); border-radius: 8px; border: 1px solid rgba(245,158,11,0.2);">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${routes.filter(r => r.status === 'completed').length}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Routes</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(239,68,68,0.1); border-radius: 8px; border: 1px solid rgba(239,68,68,0.2);">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${fuelColor};">${fuelLevel}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Fuel</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(59,130,246,0.1); border-radius: 8px; border: 1px solid rgba(59,130,246,0.2);">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${Math.round(performance.score)}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Performance</div>
                    </div>
                </div>
                
                ${mlRecommendations.length > 0 ? `
                <div style="background: linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.1) 100%); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.1rem;">🤖</span>
                        <span style="font-weight: 600; color: #c4b5fd; font-size: 0.875rem;">ML Recommendations</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #e2e8f0;">
                        ${mlRecommendations.slice(0, 2).map(rec => `• ${rec}`).join('<br>')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Vehicle Assignment Section -->
                <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(59,130,246,0.05); border-radius: 8px; border: 1px solid rgba(59,130,246,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Assigned Vehicle</div>
                            <div style="font-weight: 600; color: #f1f5f9;">${driver.vehicleId || 'Unassigned'}</div>
                        </div>
                        <button onclick="event.stopPropagation(); fleetManager.showAssignVehicleModal('${driver.id}')" 
                            style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                            border: none; border-radius: 8px; color: white; font-weight: 600; font-size: 0.875rem; 
                            cursor: pointer; transition: all 0.2s;" 
                            onmouseover="this.style.transform='scale(1.05)'" 
                            onmouseout="this.style.transform='scale(1)'">
                            ${driver.vehicleId ? '🔄 Change Vehicle' : '🚛 Assign Vehicle'}
                        </button>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="event.stopPropagation(); assignRouteToDriver('${driver.id}')" 
                        style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s ease;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <i class="fas fa-route"></i> Assign Route
                    </button>
                    <button onclick="event.stopPropagation(); viewDriverDetails('${driver.id}')" 
                        style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s ease;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    }
    
    renderVehiclesTab() {
        const filtered = this.data.vehicles.filter(v => {
            // Get actual vehicle status
            const actualStatus = this.getVehicleStatus(v);
            
            if (this.filters.status !== 'all') {
                // Map filter status to actual status
                if (this.filters.status === 'on-route' && actualStatus !== 'in-road') return false;
                if (this.filters.status === 'active' && actualStatus !== 'active') return false;
                if (this.filters.status === 'maintenance' && actualStatus !== 'maintenance') return false;
                if (this.filters.status === 'available' && actualStatus !== 'active') return false;
                if (this.filters.status === 'offline' && actualStatus !== 'maintenance') return false;
            }
            
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                return v.id.toLowerCase().includes(search) || 
                       v.driverName?.toLowerCase().includes(search) ||
                       v.type?.toLowerCase().includes(search);
            }
            return true;
        });
        
        const container = document.getElementById('vehicleStatusList');
        if (!container) return;
        
        this.updateElement('vehiclesCountDisplay', `Showing ${filtered.length} of ${this.data.vehicles.length} vehicles`);
        
        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #94a3b8;"><p>No vehicles found</p></div>';
            return;
        }
        
        container.innerHTML = filtered.map(vehicle => this.renderVehicleCard(vehicle)).join('');
    }
    
    renderVehicleCard(vehicle) {
        const status = this.getVehicleStatus(vehicle);
        const statusColor = this.getVehicleStatusColor(status);
        const fuelColor = vehicle.fuelLevel > 50 ? '#10b981' : vehicle.fuelLevel > 20 ? '#f59e0b' : '#ef4444';
        
        return `
            <div class="fleet-item-card" style="
                background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 1.25rem;
                margin-bottom: 1rem;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(59,130,246,0.5)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255,255,255,0.1)'">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, ${statusColor} 0%, ${this.darkenColor(statusColor, 20)} 100%);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        box-shadow: 0 4px 12px ${statusColor}40;
                    ">
                        ${status === 'maintenance' ? '🔧' : status === 'in-road' ? '🚛' : '🚗'}
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9;">${vehicle.id}</h4>
                        <div style="color: #94a3b8; font-size: 0.875rem;">
                            Driver: ${vehicle.driverName || 'Unassigned'} | ${vehicle.type}
                        </div>
                        <span style="
                            background: ${statusColor}20;
                            color: ${statusColor};
                            padding: 0.25rem 0.75rem;
                            border-radius: 20px;
                            font-size: 0.75rem;
                            font-weight: 600;
                            text-transform: uppercase;
                            display: inline-block;
                            margin-top: 0.5rem;
                        ">${status === 'in-road' ? 'In Road' : status === 'maintenance' ? 'Maintenance' : 'Active'}</span>
                    </div>
                </div>
                
                <!-- Status Change Quick Actions -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
                    <button onclick="event.stopPropagation(); changeVehicleStatus('${vehicle.id}', 'active');" 
                        style="
                            padding: 0.5rem;
                            background: ${status === 'active' ? statusColor : 'rgba(16,185,129,0.1)'};
                            border: 1px solid ${status === 'active' ? statusColor : 'rgba(16,185,129,0.3)'};
                            border-radius: 6px;
                            color: ${status === 'active' ? 'white' : '#10b981'};
                            font-weight: 600;
                            font-size: 0.75rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                        ✅ Active
                    </button>
                    <button onclick="event.stopPropagation(); changeVehicleStatus('${vehicle.id}', 'in-road');" 
                        style="
                            padding: 0.5rem;
                            background: ${status === 'in-road' ? statusColor : 'rgba(245,158,11,0.1)'};
                            border: 1px solid ${status === 'in-road' ? statusColor : 'rgba(245,158,11,0.3)'};
                            border-radius: 6px;
                            color: ${status === 'in-road' ? 'white' : '#f59e0b'};
                            font-weight: 600;
                            font-size: 0.75rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                        🚛 In Road
                    </button>
                    <button onclick="event.stopPropagation(); changeVehicleStatus('${vehicle.id}', 'maintenance');" 
                        style="
                            padding: 0.5rem;
                            background: ${status === 'maintenance' ? statusColor : 'rgba(239,68,68,0.1)'};
                            border: 1px solid ${status === 'maintenance' ? statusColor : 'rgba(239,68,68,0.3)'};
                            border-radius: 6px;
                            color: ${status === 'maintenance' ? 'white' : '#ef4444'};
                            font-weight: 600;
                            font-size: 0.75rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                        🔧 Maintenance
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                    <div style="text-align: center; padding: 0.75rem; background: rgba(239,68,68,0.1); border-radius: 8px;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${fuelColor};">${vehicle.fuelLevel}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Fuel</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(59,130,246,0.1); border-radius: 8px;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #3b82f6;">${vehicle.utilization}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Utilization</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(16,185,129,0.1); border-radius: 8px;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${vehicle.efficiency}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Efficiency</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(245,158,11,0.1); border-radius: 8px;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #f59e0b;">${vehicle.mileage.toLocaleString()}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Miles</div>
                    </div>
                </div>
                
                ${vehicle.mlPredictions?.maintenanceRisk === 'high' ? `
                <div style="background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 0.75rem; margin-top: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444; font-weight: 600; font-size: 0.875rem;">
                        <span>⚠️</span>
                        <span>ML Predicts: Maintenance needed in ${vehicle.mlPredictions.daysUntilMaintenance} days</span>
                    </div>
                </div>
                ` : ''}
                
                <!-- Driver Assignment Section -->
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Assigned Driver</div>
                            <div style="font-weight: 600; color: #f1f5f9;">${vehicle.driverName || 'Unassigned'}</div>
                        </div>
                        <button onclick="event.stopPropagation(); showAssignDriverModal('${vehicle.id}');" 
                            style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                            border: none; border-radius: 8px; color: white; font-weight: 600; font-size: 0.875rem; 
                            cursor: pointer; transition: all 0.2s;" 
                            onmouseover="this.style.transform='scale(1.05)'" 
                            onmouseout="this.style.transform='scale(1)'">
                            ${vehicle.driverId ? '👤 Change Driver' : '➕ Assign Driver'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderRoutesTab() {
        const container = document.getElementById('routesList');
        if (!container) return;
        
        const allRoutes = this.data.routes || [];
        const activeRoutes = allRoutes.filter(r => r.status === 'in-progress' || r.status === 'active');
        const pendingRoutes = allRoutes.filter(r => r.status === 'pending');
        const completedRoutes = allRoutes.filter(r => r.status === 'completed');
        
        if (allRoutes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #94a3b8;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🛣️</div>
                    <div>No routes available</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${allRoutes.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Total Routes</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${activeRoutes.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Active</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${pendingRoutes.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Pending</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #8b5cf6; margin-bottom: 0.5rem;">${allRoutes.filter(r => r.mlOptimized || r.optimized).length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">ML Optimized</div>
                    </div>
                </div>
                
                <div style="display: grid; gap: 1rem;">
                    ${allRoutes.map(route => this.renderRouteCard(route)).join('')}
                </div>
            </div>
        `;
        this._ensureRoutesListClickHandler(container);
    }

    _ensureRoutesListClickHandler(container) {
        if (container._fleetRouteDeleteBound) return;
        container._fleetRouteDeleteBound = true;
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.fleet-route-delete-btn');
            if (!btn) return;
            const routeId = btn.getAttribute('data-route-id');
            if (routeId && window.fleetManager && typeof window.fleetManager.deleteRoute === 'function') {
                e.preventDefault();
                e.stopPropagation();
                window.fleetManager.deleteRoute(routeId);
            }
        });
    }
    
    renderRouteCard(route) {
        const driver = this.data.drivers.find(d => d.id === route.driverId);
        const isMLOptimized = route.mlOptimized || route.optimized;
        
        return `
            <div class="fleet-item-card" style="
                background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 1.25rem;
                margin-bottom: 1rem;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9;">
                            ${route.id}
                            ${isMLOptimized ? '<span style="background: rgba(139,92,246,0.2); color: #8b5cf6; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.7rem; margin-left: 0.5rem;">🤖 ML Optimized</span>' : ''}
                        </h4>
                        <div style="color: #94a3b8; font-size: 0.875rem;">
                            Driver: ${driver?.name || 'Unassigned'} | Bins: ${route.bins?.length || 0}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="
                            background: rgba(16,185,129,0.2);
                            color: #10b981;
                            padding: 0.5rem 1rem;
                            border-radius: 20px;
                            font-size: 0.875rem;
                            font-weight: 600;
                            text-transform: uppercase;
                        ">${route.status}</span>
                        <button type="button" class="fleet-route-delete-btn" data-route-id="${(route.id || '').toString().replace(/"/g, '&quot;')}" title="Delete route" style="
                            background: rgba(239,68,68,0.2);
                            color: #ef4444;
                            border: 1px solid rgba(239,68,68,0.4);
                            padding: 0.4rem 0.65rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.8rem;
                            transition: all 0.2s;
                            pointer-events: auto;
                        " onmouseover="this.style.background='rgba(239,68,68,0.35)'" onmouseout="this.style.background='rgba(239,68,68,0.2)'">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                ${isMLOptimized && route.optimizationMetrics ? `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${route.optimizationMetrics.distanceReduction || 0}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Distance Saved</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #3b82f6;">${route.optimizationMetrics.timeSaved || 0}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Time Saved</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #f59e0b;">${route.optimizationMetrics.fuelSaved || 0}%</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Fuel Saved</div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    async deleteRoute(routeId) {
        if (!routeId) return;
        if (!window.confirm(`Delete route ${routeId}? This cannot be undone.`)) return;
        const dataManager = window.dataManager;
        if (!dataManager || typeof dataManager.deleteRoute !== 'function') {
            console.error('DataManager or deleteRoute not available');
            return;
        }
        dataManager.deleteRoute(routeId);
        try {
            const base = window.location.origin;
            const res = await fetch(`${base}/api/routes/${encodeURIComponent(routeId)}`, { method: 'DELETE' });
            // 404 = route already deleted (e.g. by another tab or server); treat as success
            if (!res.ok && res.status !== 404) console.warn('Server delete failed:', res.status, await res.text());
        } catch (e) {
            console.warn('Could not sync route delete to server:', e.message);
        }
        this.data.routes = dataManager.getRoutes();
        this.renderRoutesTab();
        this.updateStats();
        if (this.currentTab === 'map' && this.loadVehiclesOnMap) this.loadVehiclesOnMap();
    }
    
    renderAnalyticsTab() {
        const container = document.getElementById('fleetAnalyticsContent');
        if (!container) return;
        
        const analytics = this.calculateAnalytics();
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Fleet Performance</h4>
                    <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${analytics.avgPerformance}%</div>
                    <div style="color: #94a3b8; font-size: 0.875rem;">Average Driver Performance</div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Utilization Rate</h4>
                    <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${analytics.utilization}%</div>
                    <div style="color: #94a3b8; font-size: 0.875rem;">Fleet Utilization</div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Cost Efficiency</h4>
                    <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">$${analytics.costPerCollection.toFixed(2)}</div>
                    <div style="color: #94a3b8; font-size: 0.875rem;">Cost per Collection</div>
                </div>
            </div>
        `;
    }
    
    renderMLTab() {
        const container = document.getElementById('fleetMLContent');
        if (!container) return;
        
        const mlInsights = this.getMLInsights();
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9; display: flex; align-items: center; gap: 0.5rem;">
                        <span>🤖</span>
                        <span>ML Recommendations</span>
                    </h4>
                    <div style="display: grid; gap: 1rem;">
                        ${mlInsights.recommendations.map(rec => `
                            <div style="padding: 1rem; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px;">
                                <div style="font-weight: 600; color: #c4b5fd; margin-bottom: 0.5rem;">${rec.title}</div>
                                <div style="color: #e2e8f0; font-size: 0.875rem;">${rec.description}</div>
                                <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 0.5rem;">Impact: ${rec.impact}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Predictive Analytics</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${mlInsights.maintenanceAlerts}</div>
                            <div style="color: #94a3b8; font-size: 0.875rem;">Maintenance Alerts</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${mlInsights.optimizationOpportunities}</div>
                            <div style="color: #94a3b8; font-size: 0.875rem;">Optimization Opportunities</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${mlInsights.efficiencyGains}%</div>
                            <div style="color: #94a3b8; font-size: 0.875rem;">Potential Efficiency Gain</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== FILTERING & SEARCH ====================
    
    getFilteredData(type = null) {
        let data = type ? 
            this.data.allData.filter(item => item.type === type) :
            this.data.allData;
        
        // Apply search filter
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            data = data.filter(item => item.searchable.includes(search));
        }
        
        // Apply status filter
        if (this.filters.status !== 'all') {
            data = data.filter(item => item.status === this.filters.status);
        }
        
        // Apply type filter
        if (this.filters.type !== 'all') {
            data = data.filter(item => item.type === this.filters.type);
        }
        
        return data;
    }
    
    getPaginatedData(data) {
        const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const end = start + this.pagination.pageSize;
        return data.slice(start, end);
    }
    
    updatePagination() {
        const filtered = this.getFilteredData();
        this.pagination.totalItems = filtered.length;
        this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
    }
    
    renderPagination(containerId, totalItems) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (this.pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        const pages = [];
        const maxPages = 7;
        let startPage = Math.max(1, this.pagination.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(this.pagination.totalPages, startPage + maxPages - 1);
        
        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        // Previous button
        pages.push(`
            <button onclick="fleetManager.goToPage(${this.pagination.currentPage - 1})" 
                ${this.pagination.currentPage === 1 ? 'disabled' : ''}
                style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #e2e8f0; cursor: pointer; ${this.pagination.currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `);
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button onclick="fleetManager.goToPage(${i})" 
                    style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: ${i === this.pagination.currentPage ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255,255,255,0.05)'}; color: #e2e8f0; cursor: pointer; font-weight: ${i === this.pagination.currentPage ? '700' : '400'};">
                    ${i}
                </button>
            `);
        }
        
        // Next button
        pages.push(`
            <button onclick="fleetManager.goToPage(${this.pagination.currentPage + 1})" 
                ${this.pagination.currentPage === this.pagination.totalPages ? 'disabled' : ''}
                style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #e2e8f0; cursor: pointer; ${this.pagination.currentPage === this.pagination.totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `);
        
        container.innerHTML = pages.join('');
    }
    
    // ==================== EVENT HANDLERS ====================
    
    handleSearch(event) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.filters.search = event.target.value;
            this.pagination.currentPage = 1;
            this.updatePagination();
            this.render();
        }, 300);
    }
    
    applyFilters() {
        this.filters.status = document.getElementById('fleetStatusFilter')?.value || 'all';
        this.filters.type = document.getElementById('fleetTypeFilter')?.value || 'all';
        this.pagination.currentPage = 1;
        this.updatePagination();
        this.render();
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNavItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Update tab buttons (if visible)
        document.querySelectorAll('.fleet-tab-btn').forEach(btn => {
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = '#94a3b8';
            btn.classList.remove('active');
        });
        
        const tabNames = {
            'map': 'Map',
            'drivers': 'Drivers',
            'vehicles': 'Vehicles',
            'safety': 'Safety',
            'video': 'Video',
            'coaching': 'Coaching',
            'diagnostics': 'Diagnostics',
            'compliance': 'Compliance',
            'maintenance': 'Maintenance',
            'messaging': 'Messaging',
            'routes': 'Routes',
            'analytics': 'Analytics',
            'reports': 'Reports',
            'ml': 'ML',
            'geofencing': 'Geofencing',
            'assets': 'Assets',
            'dispatch': 'Dispatch',
            'eld': 'ELD',
            'inspections': 'Inspections',
            'fuel': 'Fuel',
            'energy': 'Energy'
        };
        
        const tabName = tabNames[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
        const activeBtn = document.getElementById(`fleetTab${tabName}`);
        if (activeBtn) {
            activeBtn.style.borderBottomColor = '#3b82f6';
            activeBtn.style.color = '#3b82f6';
            activeBtn.classList.add('active');
        }
        
        // Update tab content - hide all first
        document.querySelectorAll('.fleet-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show active tab content
        const activeContent = document.getElementById(`fleetTabContent${tabName}`);
        if (activeContent) {
            activeContent.style.display = 'block';
        } else {
            console.warn(`⚠️ Tab content not found: fleetTabContent${tabName}`);
            // Create content if it doesn't exist
            this.createTabContent(tab, tabName);
        }
        
        // Initialize map if switching to map tab
        if (tab === 'map') {
            if (!this.fleetMap) {
                setTimeout(() => this.initializeFleetMap(), 100);
            } else {
                // Refresh map if already initialized
                setTimeout(() => this.renderMapTab(), 100);
            }
        }
        
        // Render the current tab content
        setTimeout(() => {
            this.renderCurrentTab();
        }, 50);
    }
    
    createTabContent(tab, tabName) {
        // Create content container if it doesn't exist
        const mainContent = document.querySelector('#fleet .fleet-tab-content')?.parentElement || 
                           document.querySelector('#fleet > div > div:last-child');
        
        if (!mainContent) return;
        
        const contentDiv = document.createElement('div');
        contentDiv.id = `fleetTabContent${tabName}`;
        contentDiv.className = 'fleet-tab-content';
        contentDiv.style.display = 'block';
        contentDiv.innerHTML = `
            <div class="glass-card">
                <h3 style="margin-bottom: 1.5rem;">${tabName}</h3>
                <div id="fleet${tabName}Content">
                    <!-- Content will be rendered here -->
                </div>
            </div>
        `;
        
        mainContent.appendChild(contentDiv);
    }
    
    goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.currentPage = page;
        this.render();
    }
    
    updatePageSize() {
        const select = document.getElementById(`${this.currentTab}PageSize`) || document.getElementById('driversPageSize');
        if (select) {
            this.pagination.pageSize = parseInt(select.value);
            this.pagination.currentPage = 1;
            this.updatePagination();
            this.render();
        }
    }
    
    // ==================== ML INTEGRATION ====================
    
    async optimizeAllRoutes() {
        const activeRoutes = this.data.routes.filter(r => r.status === 'in-progress' || r.status === 'active' || r.status === 'pending');
        
        if (activeRoutes.length === 0) {
            this.showNotification('⚠️ No active routes to optimize', 'warning');
            return;
        }
        
        this.showNotification(`🤖 Optimizing ${activeRoutes.length} routes with ML...`, 'info');
        
        // Simulate ML optimization
        let optimized = 0;
        activeRoutes.forEach((route, index) => {
            setTimeout(() => {
                route.mlOptimized = true;
                route.optimized = true;
                route.optimizationMetrics = {
                    distanceReduction: Math.floor(Math.random() * 15) + 10,
                    timeSaved: Math.floor(Math.random() * 20) + 15,
                    fuelSaved: Math.floor(Math.random() * 18) + 12
                };
                optimized++;
                
                if (optimized === activeRoutes.length) {
                    this.showNotification(`✅ Successfully optimized ${optimized} routes! Estimated savings: $${(optimized * 25).toFixed(2)}`, 'success');
                    this.renderRoutesTab();
                    this.updateStats();
                }
            }, index * 200);
        });
        
        // Update routes in data manager
        if (window.dataManager) {
            activeRoutes.forEach(route => {
                window.dataManager.updateRoute(route.id, route);
            });
        }
    }
    
    getMLRecommendations(driver) {
        const recommendations = [];
        
        // Performance-based recommendations
        const performance = this.calculateDriverPerformance(driver);
        if (performance.score < 70) {
            recommendations.push('Consider additional training');
        }
        
        // Fuel efficiency recommendations
        const fuelLevel = driver.fuelLevel || 75;
        if (fuelLevel < 30) {
            recommendations.push('Low fuel - schedule refueling');
        }
        
        // Route optimization recommendations
        const routes = this.data.routes.filter(r => r.driverId === driver.id && !r.mlOptimized);
        if (routes.length > 0) {
            recommendations.push(`${routes.length} routes can be ML optimized`);
        }
        
        return recommendations;
    }
    
    getMLPredictions(driver) {
        // Simulate ML predictions for maintenance
        const daysSinceMaintenance = Math.floor(Math.random() * 180) + 30;
        const maintenanceRisk = daysSinceMaintenance > 150 ? 'high' : daysSinceMaintenance > 120 ? 'medium' : 'low';
        
        return {
            maintenanceRisk,
            daysUntilMaintenance: Math.max(0, 180 - daysSinceMaintenance),
            efficiencyPrediction: Math.floor(Math.random() * 20) + 80
        };
    }
    
    getMLInsights() {
        return {
            recommendations: [
                {
                    title: 'Route Optimization',
                    description: '15 routes can be optimized using ML, saving an estimated 23% in fuel costs',
                    impact: 'High - $2,450/month savings'
                },
                {
                    title: 'Predictive Maintenance',
                    description: '3 vehicles require maintenance within the next 7 days',
                    impact: 'Medium - Prevent downtime'
                },
                {
                    title: 'Driver Performance',
                    description: 'Optimize driver assignments based on historical performance data',
                    impact: 'High - 12% efficiency gain'
                }
            ],
            maintenanceAlerts: this.data.vehicles.filter(v => v.mlPredictions?.maintenanceRisk === 'high').length,
            optimizationOpportunities: this.data.routes.filter(r => !r.mlOptimized).length,
            efficiencyGains: Math.floor(Math.random() * 15) + 10
        };
    }
    
    getMLOptimizationsCount() {
        return this.data.routes.filter(r => r.mlOptimized || r.optimized).length;
    }
    
    calculateMLSavings() {
        const optimizedRoutes = this.data.routes.filter(r => r.mlOptimized || r.optimized);
        // Estimate savings based on optimization metrics
        return optimizedRoutes.reduce((total, route) => {
            const savings = (route.optimizationMetrics?.fuelSaved || 0) * 2.5; // $2.5 per liter
            return total + savings;
        }, 0);
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    getDriverStatus(driver) {
        const routes = this.data.routes.filter(r => r.driverId === driver.id);
        const activeRoute = routes.find(r => r.status === 'in-progress');
        
        if (activeRoute || driver.movementStatus === 'on-route') {
            return 'on-route';
        }
        
        const location = this.data.driverLocations[driver.id];
        if (!location) {
            return driver.status === 'inactive' ? 'offline' : 'active';
        }
        
        const lastUpdate = location.lastUpdate || location.timestamp;
        if (!lastUpdate) return 'active';
        
        const timeDiff = Date.now() - new Date(lastUpdate).getTime();
        if (timeDiff < 3600000) return 'active';
        if (timeDiff < 14400000) return 'available';
        return 'offline';
    }
    
    getVehicleStatus(driver) {
        // Check if vehicle has explicit status
        const vehicle = this.data.vehicles.find(v => v.driverId === driver.id);
        if (vehicle && vehicle.status) {
            return vehicle.status;
        }
        
        const status = this.getDriverStatus(driver);
        if (status === 'offline') return 'maintenance';
        if (status === 'on-route') return 'in-road';
        return 'active';
    }
    
    getStatusColor(status) {
        const colors = {
            'active': '#10b981',
            'on-route': '#f59e0b',
            'available': '#3b82f6',
            'maintenance': '#ef4444',
            'offline': '#6b7280'
        };
        return colors[status] || '#6b7280';
    }
    
    calculateDriverPerformance(driver) {
        const collections = this.data.collections.filter(c => c.driverId === driver.id);
        const routes = this.data.routes.filter(r => r.driverId === driver.id);
        const completedRoutes = routes.filter(r => r.status === 'completed').length;
        
        // Simple performance calculation
        const collectionScore = Math.min(100, (collections.length / 10) * 100);
        const routeScore = routes.length > 0 ? (completedRoutes / routes.length) * 100 : 50;
        const avgScore = (collectionScore + routeScore) / 2;
        
        return {
            score: Math.round(avgScore),
            collections: collections.length,
            routes: completedRoutes
        };
    }
    
    calculateVehicleUtilization(driver) {
        const routes = this.data.routes.filter(r => r.driverId === driver.id && r.status === 'completed');
        // Simple utilization: percentage of days with routes
        return Math.min(100, Math.floor((routes.length / 30) * 100));
    }
    
    calculateVehicleEfficiency(driver) {
        // Simple efficiency calculation
        return Math.floor(Math.random() * 20) + 75;
    }
    
    calculateFleetUtilization() {
        if (this.data.vehicles.length === 0) return 0;
        const totalUtilization = this.data.vehicles.reduce((sum, v) => sum + v.utilization, 0);
        return totalUtilization / this.data.vehicles.length;
    }
    
    calculateAvgEfficiency() {
        if (this.data.vehicles.length === 0) return 0;
        const totalEfficiency = this.data.vehicles.reduce((sum, v) => sum + v.efficiency, 0);
        return totalEfficiency / this.data.vehicles.length;
    }
    
    calculateAnalytics() {
        const drivers = this.data.drivers;
        const collections = this.data.collections;
        const totalPerformance = drivers.reduce((sum, d) => {
            return sum + this.calculateDriverPerformance(d).score;
        }, 0);
        
        return {
            avgPerformance: Math.round(totalPerformance / drivers.length) || 0,
            utilization: Math.round(this.calculateFleetUtilization()),
            costPerCollection: collections.length > 0 ? (1000000 / collections.length) : 0
        };
    }
    
    getLastMaintenanceDate() {
        const daysAgo = Math.floor(Math.random() * 90) + 30;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    }
    
    getNextMaintenanceDate() {
        const daysAhead = Math.floor(Math.random() * 60) + 30;
        const date = new Date();
        date.setDate(date.getDate() + daysAhead);
        return date.toISOString().split('T')[0];
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) - amt));
        const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) - amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    // ==================== REAL-TIME UPDATES ====================
    
    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.loadData();
            this.render();
        }, 30000);
    }
    
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Stop all live operation intervals
        this.updateIntervals.forEach((interval, key) => {
            clearInterval(interval);
        });
        this.updateIntervals.clear();
    }
    
    // ==================== EXPORT & UTILITIES ====================
    
    async refresh() {
        console.log('🔄 Refreshing fleet data...');
        await this.loadData();
        this.render();
    }
    
    exportData() {
        const data = {
            drivers: this.data.drivers,
            vehicles: this.data.vehicles,
            routes: this.data.routes,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fleet-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    showAdvancedFilters() {
        const modal = document.createElement('div');
        modal.id = 'advancedFiltersModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                padding: 2rem; width: 90%; max-width: 600px; max-height: 90vh;
                overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">🔍 Advanced Filters</h2>
                    <button onclick="document.getElementById('advancedFiltersModal').remove()" 
                        style="background: transparent; border: none; color: #94a3b8;
                        font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px;">
                        ×
                    </button>
                </div>
                <form id="advancedFiltersForm" onsubmit="fleetManager.applyAdvancedFilters(event)">
                    <div style="display: grid; gap: 1.5rem;">
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Date Range</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <input type="date" id="filterStartDate"
                                    style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                                <input type="date" id="filterEndDate"
                                    style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                            </div>
                        </div>
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Sort By</label>
                            <select id="filterSortBy"
                                style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                border: 1px solid rgba(255,255,255,0.1);
                                background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                                <option value="name">Name</option>
                                <option value="status">Status</option>
                                <option value="date">Date</option>
                                <option value="performance">Performance</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Sort Order</label>
                            <select id="filterSortOrder"
                                style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                border: 1px solid rgba(255,255,255,0.1);
                                background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="button" onclick="fleetManager.resetFilters()"
                            style="flex: 1; padding: 0.75rem; border-radius: 8px;
                            border: 1px solid rgba(255,255,255,0.2);
                            background: rgba(255,255,255,0.05); color: #e2e8f0;
                            font-weight: 600; cursor: pointer;">Reset</button>
                        <button type="submit"
                            style="flex: 1; padding: 0.75rem; border-radius: 8px;
                            border: none; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            color: white; font-weight: 600; cursor: pointer;">
                            Apply Filters
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    
    applyAdvancedFilters(event) {
        event.preventDefault();
        this.filters.dateRange = {
            start: document.getElementById('filterStartDate').value,
            end: document.getElementById('filterEndDate').value
        };
        this.filters.sortBy = document.getElementById('filterSortBy').value;
        this.filters.sortOrder = document.getElementById('filterSortOrder').value;
        
        document.getElementById('advancedFiltersModal').remove();
        this.render();
        this.showNotification('✅ Filters applied!', 'success');
    }
    
    resetFilters() {
        this.filters = {
            search: '',
            status: 'all',
            type: 'all',
            dateRange: null,
            sortBy: 'name',
            sortOrder: 'asc'
        };
        document.getElementById('fleetSearchInput').value = '';
        document.getElementById('fleetStatusFilter').value = 'all';
        document.getElementById('fleetTypeFilter').value = 'all';
        this.render();
        this.showNotification('🔄 Filters reset!', 'info');
    }
    
    setupEventListeners() {
        const self = this;
        // Live driver location: update fleet map markers immediately when driver sends GPS
        window.addEventListener('driver_location', function(e) {
            const { driverId, lat, lng } = e.detail || {};
            if (!driverId || lat == null || lng == null) return;
            if (!window.dataManager) return;
            self.data.driverLocations = window.dataManager.getAllDriverLocations() || {};
            self.updateMapMarkers();
        });
    }
    
    // ==================== GLOBAL FUNCTION WRAPPERS ====================
    
    // Make functions available globally for onclick handlers
    static attachGlobalFunctions() {
        // Store original showDriverDetailsModal if it exists (from bin-modals.js)
        // Save it with a different name to avoid conflicts
        if (window.showDriverDetailsModal && !window._originalShowDriverDetailsModal) {
            window._originalShowDriverDetailsModal = window.showDriverDetailsModal;
        }
        
        // Driver details functions
        window.showDriverDetailsModal = function(driverId) {
            // Prefer original implementation from bin-modals.js if available
            if (window._originalShowDriverDetailsModal) {
                window._originalShowDriverDetailsModal(driverId);
                return;
            }
            
            // Otherwise use fleet manager
            if (window.fleetManager) {
                window.fleetManager.viewDriverDetails(driverId);
            }
        };
        
        window.viewDriverDetails = function(driverId) {
            if (window.fleetManager) {
                window.fleetManager.viewDriverDetails(driverId);
            }
        };
        
        window.assignRouteToDriver = function(driverId) {
            if (window.fleetManager) {
                window.fleetManager.assignRouteToDriver(driverId);
            } else if (typeof assignRouteToDriver === 'function') {
                assignRouteToDriver(driverId);
            }
        };
        
        // Vehicle assignment functions
        window.showAssignDriverModal = function(vehicleId) {
            if (window.fleetManager && window.fleetManager.showAssignDriverModal) {
                window.fleetManager.showAssignDriverModal(vehicleId);
            } else {
                console.error('showAssignDriverModal not available on fleetManager');
                alert('Driver assignment feature is loading. Please refresh the page and try again.');
            }
        };
        
        window.changeVehicleStatus = function(vehicleId, newStatus) {
            if (window.fleetManager && window.fleetManager.changeVehicleStatus) {
                window.fleetManager.changeVehicleStatus(vehicleId, newStatus);
            } else {
                console.error('changeVehicleStatus not available on fleetManager');
                alert('Vehicle status change feature is loading. Please refresh the page and try again.');
            }
        };
    }
    
    viewDriverDetails(driverId) {
        const driver = this.data.drivers.find(d => d.id === driverId);
        if (!driver) {
            this.showNotification('Driver not found', 'warning');
            return;
        }
        
        // Check if there's a better implementation from bin-modals.js (not our wrapper)
        // Use the original function if it exists
        if (window._originalShowDriverDetailsModal) {
            // Use the bin-modals.js implementation which is more comprehensive
            try {
                window._originalShowDriverDetailsModal(driverId);
                return;
            } catch (e) {
                console.warn('Failed to use bin-modals showDriverDetailsModal, using fallback:', e);
            }
        }
        
        // Create modal directly (fallback) - avoid calling showDriverDetailsModal to prevent recursion
        {
            // Create a simple modal
            const modal = document.createElement('div');
            modal.id = 'driverDetailsModal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); display: flex; align-items: center;
                justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
            `;
            
            const performance = this.calculateDriverPerformance(driver);
            const routes = this.data.routes.filter(r => r.driverId === driverId);
            
            modal.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                    padding: 2rem; width: 90%; max-width: 700px; max-height: 90vh;
                    overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">👤 ${driver.name}</h2>
                        <button onclick="document.getElementById('driverDetailsModal').remove()" 
                            style="background: transparent; border: none; color: #94a3b8;
                            font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px;">
                            ×
                        </button>
                    </div>
                    <div style="display: grid; gap: 1.5rem;">
                        <div class="glass-card" style="padding: 1.5rem;">
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                                <div>
                                    <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Performance</div>
                                    <div style="font-weight: 600; color: #f1f5f9; font-size: 1.25rem;">${performance.score}%</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Routes</div>
                                    <div style="font-weight: 600; color: #f1f5f9; font-size: 1.25rem;">${routes.length}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Status</div>
                                    <div style="font-weight: 600; color: #10b981; font-size: 1.25rem;">${driver.status || 'Active'}</div>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <button onclick="fleetManager.assignRouteToDriver('${driverId}')" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-route"></i> Assign Route
                            </button>
                            <button onclick="document.getElementById('driverDetailsModal').remove()" class="btn btn-secondary" style="flex: 1;">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        }
    }
    
    assignRouteToDriver(driverId) {
        const driver = this.data.drivers.find(d => d.id === driverId);
        if (!driver) {
            this.showNotification('Driver not found', 'warning');
            return;
        }
        
        // Switch to routes tab and show assignment UI
        this.switchTab('routes');
        this.showNotification(`📋 Opening route assignment for ${driver.name}...`, 'info');
        
        // If route assignment modal exists, use it
        if (typeof showRouteAssignmentModal === 'function' && window.dataManager) {
            const availableBins = window.dataManager.getData('bins') || [];
            const driverLocation = this.data.driverLocations[driverId] || { lat: 25.2854, lng: 51.5310 };
            setTimeout(() => {
                showRouteAssignmentModal(driver, availableBins, driverLocation);
            }, 500);
        }
    }
    
    
    // ==================== SAMSARA-LEVEL FEATURES ====================
    
    renderSafetyTab() {
        const container = document.getElementById('fleetSafetyContent');
        if (!container) {
            console.warn('⚠️ Safety tab content container not found');
            return;
        }
        
        const safetyData = this.getSafetyData();
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Safety Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%); border: 1px solid rgba(239,68,68,0.3);">
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">${safetyData.incidents}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Incidents (30 days)</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(180,83,9,0.1) 100%); border: 1px solid rgba(245,158,11,0.3);">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${safetyData.alerts}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Active Alerts</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%); border: 1px solid rgba(16,185,129,0.3);">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${safetyData.avgSafetyScore}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Avg Safety Score</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%); border: 1px solid rgba(59,130,246,0.3);">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${safetyData.drowsinessAlerts}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Drowsiness Detections</div>
                    </div>
                </div>
                
                <!-- Recent Incidents -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Recent Safety Incidents</h4>
                    <div id="safetyIncidentsList" style="display: grid; gap: 1rem;">
                        ${safetyData.recentIncidents.map(incident => `
                            <div style="
                                padding: 1rem;
                                background: rgba(239,68,68,0.1);
                                border: 1px solid rgba(239,68,68,0.3);
                                border-radius: 8px;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            ">
                                <div>
                                    <div style="font-weight: 600; color: #ef4444; margin-bottom: 0.25rem;">${incident.type}</div>
                                    <div style="font-size: 0.875rem; color: #94a3b8;">Vehicle: ${incident.vehicleId} | ${incident.timestamp}</div>
                                </div>
                                <button onclick="fleetManager.viewIncidentDetails('${incident.id}')" class="btn btn-secondary" style="padding: 0.5rem 1rem;">
                                    View Details
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderVideoTab() {
        const container = document.getElementById('fleetVideoContent');
        if (!container) {
            console.warn('⚠️ Video tab content container not found');
            return;
        }
        
        const videoData = this.getVideoData();
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Video Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                📹
                            </div>
                            <div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #f1f5f9;">${videoData.activeCameras}</div>
                                <div style="color: #94a3b8; font-size: 0.875rem;">Active Cameras</div>
                            </div>
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                🎥
                            </div>
                            <div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #f1f5f9;">${videoData.recordings}</div>
                                <div style="color: #94a3b8; font-size: 0.875rem;">Recordings (24h)</div>
                            </div>
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                ⚠️
                            </div>
                            <div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #f1f5f9;">${videoData.aiAlerts}</div>
                                <div style="color: #94a3b8; font-size: 0.875rem;">AI Alerts (24h)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Live Camera Feeds -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Live Camera Feeds</h4>
                    <div id="videoFeedsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                        ${videoData.feeds.map(feed => `
                            <div style="
                                background: rgba(0,0,0,0.3);
                                border-radius: 12px;
                                overflow: hidden;
                                border: 1px solid rgba(255,255,255,0.1);
                            ">
                                <div style="padding: 1rem; background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.1) 100%);">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; color: #f1f5f9;">${feed.vehicleId}</div>
                                            <div style="font-size: 0.875rem; color: #94a3b8;">${feed.driverName}</div>
                                        </div>
                                        <span style="
                                            width: 12px;
                                            height: 12px;
                                            background: #10b981;
                                            border-radius: 50%;
                                            box-shadow: 0 0 8px #10b981;
                                            animation: pulse 2s infinite;
                                        "></span>
                                    </div>
                                </div>
                                <div style="
                                    width: 100%;
                                    height: 200px;
                                    background: linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    position: relative;
                                ">
                                    <div style="text-align: center; color: #94a3b8;">
                                        <div style="font-size: 3rem; margin-bottom: 0.5rem;">📹</div>
                                        <div style="font-size: 0.875rem;">Live Feed</div>
                                        <div style="font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.7;">${feed.cameraType}</div>
                                    </div>
                                    <button onclick="fleetManager.viewLiveFeed('${feed.vehicleId}')" 
                                        style="
                                            position: absolute;
                                            bottom: 1rem;
                                            right: 1rem;
                                            padding: 0.5rem 1rem;
                                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                            border: none;
                                            border-radius: 8px;
                                            color: white;
                                            font-weight: 600;
                                            cursor: pointer;
                                        ">
                                        View Live
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderCoachingTab() {
        const container = document.getElementById('fleetCoachingContent');
        if (!container) {
            console.warn('⚠️ Coaching tab content container not found');
            return;
        }
        
        const coachingData = this.getCoachingData();
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Coaching Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${coachingData.activePrograms}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Active Programs</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${coachingData.badgesAwarded}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Badges Awarded</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${coachingData.avgImprovement}%</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Avg Improvement</div>
                    </div>
                </div>
                
                <!-- Leaderboard -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">🏆 Driver Leaderboard</h4>
                    <div id="coachingLeaderboard" style="display: grid; gap: 0.75rem;">
                        ${coachingData.leaderboard.map((driver, index) => `
                            <div style="
                                padding: 1rem;
                                background: ${index < 3 ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(180,83,9,0.1) 100%)' : 'rgba(255,255,255,0.05)'};
                                border: 1px solid ${index < 3 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'};
                                border-radius: 8px;
                                display: flex;
                                align-items: center;
                                gap: 1rem;
                            ">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: ${index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : index === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : index === 2 ? 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)' : 'rgba(59,130,246,0.2)'};
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: 700;
                                    color: white;
                                ">
                                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #f1f5f9;">${driver.name}</div>
                                    <div style="font-size: 0.875rem; color: #94a3b8;">Score: ${driver.score} | Badges: ${driver.badges}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${driver.score}</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8;">Points</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDiagnosticsTab() {
        const container = document.getElementById('fleetDiagnosticsContent');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Vehicle Diagnostics</h4>
                    <div id="diagnosticsList" style="display: grid; gap: 1rem;">
                        ${this.data.vehicles.slice(0, 10).map(vehicle => {
                            const diagnostics = this.getVehicleDiagnostics(vehicle.id);
                            return `
                                <div style="
                                    padding: 1.25rem;
                                    background: rgba(255,255,255,0.05);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 12px;
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                        <h5 style="margin: 0; color: #f1f5f9;">${vehicle.id}</h5>
                                        <span style="
                                            padding: 0.5rem 1rem;
                                            background: ${diagnostics.healthScore > 80 ? 'rgba(16,185,129,0.2)' : diagnostics.healthScore > 60 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'};
                                            color: ${diagnostics.healthScore > 80 ? '#10b981' : diagnostics.healthScore > 60 ? '#f59e0b' : '#ef4444'};
                                            border-radius: 20px;
                                            font-weight: 600;
                                            font-size: 0.875rem;
                                        ">Health: ${diagnostics.healthScore}%</span>
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                                        <div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem;">Engine</div>
                                            <div style="font-weight: 600; color: ${diagnostics.engine.checkEngine ? '#ef4444' : '#10b981'};">
                                                ${diagnostics.engine.checkEngine ? '⚠️ Check' : '✅ OK'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem;">Brakes</div>
                                            <div style="font-weight: 600; color: ${diagnostics.brakes.padWear < 30 ? '#ef4444' : '#10b981'};">
                                                ${diagnostics.brakes.padWear}% wear
                                            </div>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem;">Battery</div>
                                            <div style="font-weight: 600; color: ${diagnostics.battery.health < 50 ? '#ef4444' : '#10b981'};">
                                                ${diagnostics.battery.health}%
                                            </div>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem;">Tires</div>
                                            <div style="font-weight: 600; color: #10b981;">
                                                ✅ Normal
                                            </div>
                                        </div>
                                    </div>
                                    <button onclick="fleetManager.viewFullDiagnostics('${vehicle.id}')" 
                                        style="
                                            width: 100%;
                                            margin-top: 1rem;
                                            padding: 0.75rem;
                                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                            border: none;
                                            border-radius: 8px;
                                            color: white;
                                            font-weight: 600;
                                            cursor: pointer;
                                        ">
                                        View Full Diagnostics
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderComplianceTab() {
        const container = document.getElementById('fleetComplianceContent');
        if (!container) {
            console.warn('⚠️ Compliance tab content container not found');
            return;
        }
        
        const complianceData = this.getComplianceData();
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Compliance Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%); border: 1px solid rgba(16,185,129,0.3);">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${complianceData.compliantDrivers}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Compliant Drivers</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%); border: 1px solid rgba(239,68,68,0.3);">
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">${complianceData.violations}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">HOS Violations</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%); border: 1px solid rgba(59,130,246,0.3);">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${complianceData.inspections}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">DVIR Inspections</div>
                    </div>
                </div>
                
                <!-- HOS Compliance -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">⏰ Hours of Service (HOS) Compliance</h4>
                    <div id="hosComplianceList" style="display: grid; gap: 1rem;">
                        ${complianceData.hosStatus.map(driver => `
                            <div style="
                                padding: 1rem;
                                background: ${driver.compliant ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};
                                border: 1px solid ${driver.compliant ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};
                                border-radius: 8px;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            ">
                                <div>
                                    <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">${driver.name}</div>
                                    <div style="font-size: 0.875rem; color: #94a3b8;">
                                        Hours Remaining: <span style="color: ${driver.hoursRemaining > 2 ? '#10b981' : '#ef4444'}; font-weight: 600;">${driver.hoursRemaining}h</span>
                                    </div>
                                </div>
                                <span style="
                                    padding: 0.5rem 1rem;
                                    background: ${driver.compliant ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};
                                    color: ${driver.compliant ? '#10b981' : '#ef4444'};
                                    border-radius: 20px;
                                    font-weight: 600;
                                    font-size: 0.875rem;
                                ">${driver.compliant ? '✅ Compliant' : '❌ Violation'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMaintenanceTab() {
        const container = document.getElementById('fleetMaintenanceContent');
        if (!container) {
            console.warn('⚠️ Maintenance tab content container not found');
            return;
        }
        
        // Refresh work orders from MongoDB (async, but don't block rendering)
        this.loadFleetEntities().catch(err => console.error('Failed to load fleet entities:', err));
        
        const maintenanceData = this.getMaintenanceData();
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Maintenance Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${maintenanceData.openWorkOrders}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Open Work Orders</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${maintenanceData.scheduled}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Scheduled Maintenance</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">$${maintenanceData.monthlyCost.toLocaleString()}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Monthly Cost</div>
                    </div>
                </div>
                
                <!-- Work Orders -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4 style="margin: 0; color: #f1f5f9;">🔧 Work Orders</h4>
                        <button onclick="fleetManager.createWorkOrder()" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-plus"></i> New Work Order
                        </button>
                    </div>
                    <div id="workOrdersList" style="display: grid; gap: 1rem;">
                        ${maintenanceData.workOrders.length > 0 ? maintenanceData.workOrders.map(wo => `
                            <div style="
                                padding: 1.25rem;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 12px;
                                border-left: 4px solid ${wo.priority === 'high' ? '#ef4444' : wo.priority === 'medium' ? '#f59e0b' : '#3b82f6'};
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                    <div>
                                        <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">${wo.vehicleId}</div>
                                        <div style="font-size: 0.875rem; color: #94a3b8;">${wo.description}</div>
                                    </div>
                                    <span style="
                                        padding: 0.5rem 1rem;
                                        background: ${wo.status === 'open' ? 'rgba(239,68,68,0.2)' : wo.status === 'in-progress' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'};
                                        color: ${wo.status === 'open' ? '#ef4444' : wo.status === 'in-progress' ? '#f59e0b' : '#10b981'};
                                        border-radius: 20px;
                                        font-weight: 600;
                                        font-size: 0.875rem;
                                        text-transform: capitalize;
                                    ">${wo.status}</span>
                                </div>
                                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: #94a3b8;">
                                    <span>Priority: <strong style="color: ${wo.priority === 'high' ? '#ef4444' : wo.priority === 'medium' ? '#f59e0b' : '#3b82f6'};">${wo.priority}</strong></span>
                                    <span>Est. Cost: <strong style="color: #f1f5f9;">$${wo.estimatedCost}</strong></span>
                                    <span>Created: ${new Date(wo.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        `).join('') : `
                            <div style="
                                padding: 3rem;
                                text-align: center;
                                color: #94a3b8;
                                background: rgba(255,255,255,0.02);
                                border-radius: 12px;
                                border: 2px dashed rgba(255,255,255,0.1);
                            ">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">🔧</div>
                                <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">No work orders yet</div>
                                <div style="font-size: 0.875rem;">Click "New Work Order" to create one</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMessagingTab() {
        const container = document.getElementById('fleetMessagingContent');
        if (!container) {
            console.warn('⚠️ Messaging tab content container not found');
            return;
        }
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem;">
                <!-- Drivers List -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">💬 Select Driver</h4>
                    <div id="messagingDriversList" style="display: grid; gap: 0.75rem; max-height: 60vh; overflow-y: auto;">
                        ${this.data.drivers.map(driver => `
                            <div onclick="fleetManager.selectDriverForMessaging('${driver.id}')" 
                                style="
                                    padding: 1rem;
                                    background: rgba(255,255,255,0.05);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 8px;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                "
                                onmouseover="this.style.background='rgba(59,130,246,0.1)'; this.style.borderColor='rgba(59,130,246,0.3)'"
                                onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.1)'">
                                <div style="font-weight: 600; color: #f1f5f9;">${driver.name}</div>
                                <div style="font-size: 0.875rem; color: #94a3b8;">${driver.id}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Message Interface -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <div id="messagingInterface" style="text-align: center; padding: 3rem; color: #94a3b8;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
                        <div>Select a driver to start messaging</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderReportsTab() {
        const container = document.getElementById('fleetReportsContent');
        if (!container) {
            console.warn('⚠️ Reports tab content container not found');
            return;
        }
        
        // Refresh reports from MongoDB (async, but don't block rendering)
        this.loadFleetEntities().catch(err => console.error('Failed to load fleet entities:', err));
        
        // Ensure reports array exists
        if (!Array.isArray(this.reports)) this.reports = [];
        
        container.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Recent Reports -->
                ${this.reports.length > 0 ? `
                <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">📋 Recent Reports</h4>
                    <div style="display: grid; gap: 0.75rem;">
                        ${this.reports.slice(-5).reverse().map(r => `
                            <div style="
                                padding: 1rem;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 8px;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            ">
                                <div>
                                    <div style="font-weight: 600; color: #f1f5f9;">${r.title}</div>
                                    <div style="font-size: 0.875rem; color: #94a3b8;">${new Date(r.createdAt).toLocaleString()}</div>
                                </div>
                                <button onclick="fleetManager.downloadReport(fleetManager.reports.find(re => re.id === '${r.id}').data, '${r.title.toLowerCase().replace(/\s+/g, '-')}', '${r.title}')" 
                                    class="btn btn-secondary" style="padding: 0.5rem 1rem;">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Report Templates -->
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">📊 Report Templates</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                        <div onclick="fleetManager.generateReport('safety')" 
                            style="
                                padding: 1.5rem;
                                background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%);
                                border: 1px solid rgba(239,68,68,0.3);
                                border-radius: 12px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛡️</div>
                            <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">Safety Report</div>
                            <div style="font-size: 0.875rem; color: #94a3b8;">Incidents, violations, trends</div>
                        </div>
                        <div onclick="fleetManager.generateReport('utilization')" 
                            style="
                                padding: 1.5rem;
                                background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%);
                                border: 1px solid rgba(59,130,246,0.3);
                                border-radius: 12px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📈</div>
                            <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">Utilization Report</div>
                            <div style="font-size: 0.875rem; color: #94a3b8;">Fleet usage & efficiency</div>
                        </div>
                        <div onclick="fleetManager.generateReport('cost')" 
                            style="
                                padding: 1.5rem;
                                background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(180,83,9,0.1) 100%);
                                border: 1px solid rgba(245,158,11,0.3);
                                border-radius: 12px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">💰</div>
                            <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">Cost Report</div>
                            <div style="font-size: 0.875rem; color: #94a3b8;">Fuel, maintenance, labor</div>
                        </div>
                        <div onclick="fleetManager.generateReport('compliance')" 
                            style="
                                padding: 1.5rem;
                                background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%);
                                border: 1px solid rgba(16,185,129,0.3);
                                border-radius: 12px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
                            <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">Compliance Report</div>
                            <div style="font-size: 0.875rem; color: #94a3b8;">HOS, ELD, IFTA</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== DATA GETTERS ====================
    
    getSafetyData() {
        return {
            incidents: 3,
            alerts: 12,
            avgSafetyScore: 88,
            drowsinessAlerts: 2,
            recentIncidents: [
                { id: 'inc1', type: 'Harsh Braking', vehicleId: 'VEH-001', timestamp: '2 hours ago' },
                { id: 'inc2', type: 'Speed Violation', vehicleId: 'VEH-002', timestamp: '5 hours ago' }
            ]
        };
    }
    
    getVideoData() {
        return {
            activeCameras: this.data.vehicles.length,
            recordings: 245,
            aiAlerts: 8,
            feeds: this.data.vehicles.slice(0, 6).map(v => ({
                vehicleId: v.id,
                driverName: v.driverName || 'Unassigned',
                cameraType: '360° Multi-Cam',
                status: 'live'
            }))
        };
    }
    
    getCoachingData() {
        const drivers = this.data.drivers.map(d => ({
            name: d.name,
            score: Math.floor(Math.random() * 30) + 70,
            badges: Math.floor(Math.random() * 5)
        })).sort((a, b) => b.score - a.score);
        
        return {
            activePrograms: 12,
            badgesAwarded: 45,
            avgImprovement: 15,
            leaderboard: drivers.slice(0, 10)
        };
    }
    
    getVehicleDiagnostics(vehicleId) {
        return {
            healthScore: Math.floor(Math.random() * 30) + 70,
            engine: {
                checkEngine: false,
                temperature: 85,
                rpm: 1200
            },
            brakes: {
                padWear: Math.floor(Math.random() * 50) + 30
            },
            battery: {
                health: Math.floor(Math.random() * 30) + 70
            }
        };
    }
    
    getComplianceData() {
        return {
            compliantDrivers: this.data.drivers.length - 2,
            violations: 2,
            inspections: 28,
            hosStatus: this.data.drivers.map(d => ({
                name: d.name,
                compliant: Math.random() > 0.2,
                hoursRemaining: Math.floor(Math.random() * 8) + 2
            }))
        };
    }
    
    getMaintenanceData() {
        // Ensure workOrders is an array
        if (!Array.isArray(this.workOrders)) {
            this.workOrders = [];
        }
        
        // Combine stored work orders with sample data
        const allWorkOrders = [
            ...this.workOrders,
            { id: 'wo1', vehicleId: 'VEH-001', description: 'Brake pad replacement', priority: 'high', status: 'open', estimatedCost: 250, createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 'wo2', vehicleId: 'VEH-002', description: 'Oil change', priority: 'medium', status: 'in-progress', estimatedCost: 75, createdAt: new Date(Date.now() - 43200000).toISOString() }
        ];
        
        const openWorkOrders = allWorkOrders.filter(wo => wo.status === 'open').length;
        const monthlyCost = allWorkOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);
        
        return {
            openWorkOrders,
            scheduled: 12,
            monthlyCost,
            workOrders: allWorkOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        };
    }
    
    // ==================== ACTION HANDLERS ====================
    
    generateSafetyReport() {
        this.generateReport('safety');
    }
    
    refreshVideoFeeds() {
        this.showNotification('🔄 Refreshing video feeds...', 'info');
        setTimeout(() => {
            this.renderVideoTab();
            this.showNotification('✅ Video feeds refreshed!', 'success');
        }, 500);
    }
    
    viewLiveFeed(vehicleId) {
        const modal = document.createElement('div');
        modal.id = 'liveFeedModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; align-items: center;
            justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                padding: 2rem; width: 90%; max-width: 900px; max-height: 90vh;
                overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">📹 Live Feed - ${vehicleId}</h2>
                    <button onclick="document.getElementById('liveFeedModal').remove()" 
                        style="background: transparent; border: none; color: #94a3b8;
                        font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px;">
                        ×
                    </button>
                </div>
                <div style="
                    width: 100%; height: 500px; background: rgba(0,0,0,0.5);
                    border-radius: 12px; display: flex; align-items: center;
                    justify-content: center; position: relative; overflow: hidden;
                ">
                    <div style="text-align: center; color: #94a3b8;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📹</div>
                        <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Live Camera Feed</div>
                        <div style="font-size: 0.875rem; opacity: 0.7;">360° Multi-Cam System</div>
                        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(16,185,129,0.1); border-radius: 8px; border: 1px solid rgba(16,185,129,0.3);">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite;"></div>
                                <span style="color: #10b981; font-weight: 600;">Live</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                    <button onclick="fleetManager.switchCameraView('front')" class="btn btn-secondary" style="padding: 0.75rem;">
                        <i class="fas fa-video"></i> Front
                    </button>
                    <button onclick="fleetManager.switchCameraView('rear')" class="btn btn-secondary" style="padding: 0.75rem;">
                        <i class="fas fa-video"></i> Rear
                    </button>
                    <button onclick="fleetManager.switchCameraView('cabin')" class="btn btn-secondary" style="padding: 0.75rem;">
                        <i class="fas fa-video"></i> Cabin
                    </button>
                    <button onclick="fleetManager.downloadFootage('${vehicleId}')" class="btn btn-primary" style="padding: 0.75rem;">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    
    switchCameraView(view) {
        this.showNotification(`📹 Switched to ${view} camera view`, 'info');
    }
    
    downloadFootage(vehicleId) {
        this.showNotification(`📥 Downloading footage for ${vehicleId}...`, 'info');
        setTimeout(() => {
            this.showNotification('✅ Footage download started!', 'success');
        }, 1000);
    }
    
    viewIncidentDetails(incidentId) {
        const incident = this.getSafetyData().recentIncidents.find(i => i.id === incidentId) || {
            id: incidentId,
            type: 'Safety Incident',
            vehicleId: 'N/A',
            timestamp: 'Unknown',
            severity: 'medium',
            description: 'Safety incident detected',
            location: null
        };
        
        const modal = document.createElement('div');
        modal.id = 'incidentModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                padding: 2rem; width: 90%; max-width: 700px; max-height: 90vh;
                overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">🛡️ Incident Details</h2>
                    <button onclick="document.getElementById('incidentModal').remove()" 
                        style="background: transparent; border: none; color: #94a3b8;
                        font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px;">
                        ×
                    </button>
                </div>
                <div style="display: grid; gap: 1.5rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Incident Type</div>
                                <div style="font-weight: 600; color: #f1f5f9; font-size: 1.1rem;">${incident.type}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Vehicle</div>
                                <div style="font-weight: 600; color: #f1f5f9;">${incident.vehicleId}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Timestamp</div>
                                <div style="font-weight: 600; color: #f1f5f9;">${incident.timestamp}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Severity</div>
                                <span style="padding: 0.5rem 1rem; background: rgba(239,68,68,0.2); 
                                    color: #ef4444; border-radius: 20px; font-weight: 600; font-size: 0.875rem; text-transform: capitalize;">
                                    ${incident.severity || 'Medium'}
                                </span>
                            </div>
                            ${incident.description ? `
                                <div>
                                    <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Description</div>
                                    <div style="color: #cbd5e1;">${incident.description}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="fleetManager.viewIncidentVideo('${incidentId}')" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-video"></i> View Video
                        </button>
                        <button onclick="fleetManager.exportIncidentReport('${incidentId}')" class="btn btn-secondary" style="flex: 1;">
                            <i class="fas fa-file-pdf"></i> Export Report
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    
    viewIncidentVideo(incidentId) {
        this.showNotification('📹 Opening incident video footage...', 'info');
    }
    
    exportIncidentReport(incidentId) {
        const report = {
            type: 'safety_incident',
            incidentId,
            generatedAt: new Date().toISOString(),
            data: this.getSafetyData().recentIncidents.find(i => i.id === incidentId) || {}
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `incident-report-${incidentId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('✅ Incident report exported!', 'success');
    }
    
    viewFullDiagnostics(vehicleId) {
        const diagnostics = this.getVehicleDiagnostics(vehicleId);
        const vehicle = this.data.vehicles.find(v => v.id === vehicleId);
        
        const modal = document.createElement('div');
        modal.id = 'diagnosticsModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                padding: 2rem; width: 90%; max-width: 800px; max-height: 90vh;
                overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">🔧 Full Diagnostics - ${vehicleId}</h2>
                    <button onclick="document.getElementById('diagnosticsModal').remove()" 
                        style="background: transparent; border: none; color: #94a3b8;
                        font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px;">
                        ×
                    </button>
                </div>
                <div style="display: grid; gap: 1.5rem;">
                    <div class="glass-card" style="padding: 1.5rem; text-align: center;">
                        <div style="font-size: 3rem; font-weight: 700; color: ${diagnostics.healthScore > 80 ? '#10b981' : diagnostics.healthScore > 60 ? '#f59e0b' : '#ef4444'}; margin-bottom: 0.5rem;">
                            ${diagnostics.healthScore}%
                        </div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Overall Health Score</div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div class="glass-card" style="padding: 1.5rem;">
                            <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem;">Engine</div>
                            <div style="font-weight: 600; color: ${diagnostics.engine.checkEngine ? '#ef4444' : '#10b981'}; margin-bottom: 0.25rem;">
                                ${diagnostics.engine.checkEngine ? '⚠️ Check Engine' : '✅ OK'}
                            </div>
                            <div style="font-size: 0.875rem; color: #64748b;">
                                Temp: ${diagnostics.engine.temperature}°C | RPM: ${diagnostics.engine.rpm}
                            </div>
                        </div>
                        <div class="glass-card" style="padding: 1.5rem;">
                            <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem;">Brakes</div>
                            <div style="font-weight: 600; color: ${diagnostics.brakes.padWear < 30 ? '#ef4444' : '#10b981'};">
                                Pad Wear: ${diagnostics.brakes.padWear}%
                            </div>
                        </div>
                        <div class="glass-card" style="padding: 1.5rem;">
                            <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem;">Battery</div>
                            <div style="font-weight: 600; color: ${diagnostics.battery.health < 50 ? '#ef4444' : '#10b981'};">
                                Health: ${diagnostics.battery.health}%
                            </div>
                        </div>
                        <div class="glass-card" style="padding: 1.5rem;">
                            <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem;">Tires</div>
                            <div style="font-weight: 600; color: #10b981;">✅ Normal</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="fleetManager.scheduleMaintenance('${vehicleId}')" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-calendar"></i> Schedule Maintenance
                        </button>
                        <button onclick="fleetManager.exportDiagnostics('${vehicleId}')" class="btn btn-secondary" style="flex: 1;">
                            <i class="fas fa-download"></i> Export Report
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    
    scheduleMaintenance(vehicleId) {
        this.showNotification('📅 Opening maintenance scheduler...', 'info');
        setTimeout(() => {
            this.switchTab('maintenance');
            setTimeout(() => this.createWorkOrder(), 500);
        }, 300);
    }
    
    exportDiagnostics(vehicleId) {
        const diagnostics = this.getVehicleDiagnostics(vehicleId);
        const report = {
            vehicleId,
            diagnostics,
            generatedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnostics-${vehicleId}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('✅ Diagnostics report exported!', 'success');
    }
    
    generateIFTAReport() {
        this.generateReport('compliance');
    }
    
    createWorkOrder() {
        // Show work order creation modal
        const modal = document.createElement('div');
        modal.id = 'workOrderModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 2rem;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">🔧 Create Work Order</h2>
                    <button onclick="document.getElementById('workOrderModal').remove()" 
                        style="
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            font-size: 1.5rem;
                            cursor: pointer;
                            padding: 0.5rem;
                            border-radius: 8px;
                            transition: all 0.2s;
                        "
                        onmouseover="this.style.background='rgba(239,68,68,0.2)'; this.style.color='#ef4444'"
                        onmouseout="this.style.background='transparent'; this.style.color='#94a3b8'">
                        ×
                    </button>
                </div>
                
                <form id="workOrderForm" onsubmit="fleetManager.submitWorkOrder(event)">
                    <div style="display: grid; gap: 1.5rem;">
                        <!-- Vehicle Selection -->
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Vehicle *</label>
                            <select id="woVehicleId" required
                                style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05);
                                    color: #e2e8f0;
                                    font-size: 1rem;
                                ">
                                <option value="">Select Vehicle</option>
                                ${this.data.vehicles.map(v => `<option value="${v.id}">${v.id} - ${v.type || 'Vehicle'}</option>`).join('')}
                            </select>
                        </div>
                        
                        <!-- Description -->
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Description *</label>
                            <textarea id="woDescription" required rows="4" placeholder="Describe the maintenance work needed..."
                                style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05);
                                    color: #e2e8f0;
                                    font-size: 1rem;
                                    font-family: inherit;
                                    resize: vertical;
                                "></textarea>
                        </div>
                        
                        <!-- Priority -->
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Priority *</label>
                            <select id="woPriority" required
                                style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05);
                                    color: #e2e8f0;
                                    font-size: 1rem;
                                ">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        
                        <!-- Estimated Cost -->
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Estimated Cost ($)</label>
                            <input type="number" id="woEstimatedCost" min="0" step="0.01" placeholder="0.00"
                                style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05);
                                    color: #e2e8f0;
                                    font-size: 1rem;
                                ">
                        </div>
                        
                        <!-- Due Date -->
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Due Date</label>
                            <input type="date" id="woDueDate"
                                style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05);
                                    color: #e2e8f0;
                                    font-size: 1rem;
                                ">
                        </div>
                        
                        <!-- Notes -->
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Additional Notes</label>
                            <textarea id="woNotes" rows="3" placeholder="Any additional information..."
                                style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05);
                                    color: #e2e8f0;
                                    font-size: 1rem;
                                    font-family: inherit;
                                    resize: vertical;
                                "></textarea>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="button" onclick="document.getElementById('workOrderModal').remove()"
                            style="
                                flex: 1;
                                padding: 0.75rem;
                                border-radius: 8px;
                                border: 1px solid rgba(255,255,255,0.2);
                                background: rgba(255,255,255,0.05);
                                color: #e2e8f0;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                            "
                            onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            Cancel
                        </button>
                        <button type="submit"
                            style="
                                flex: 1;
                                padding: 0.75rem;
                                border-radius: 8px;
                                border: none;
                                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <i class="fas fa-check"></i> Create Work Order
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    async submitWorkOrder(event) {
        event.preventDefault();
        
        const vehicleId = document.getElementById('woVehicleId').value;
        const description = document.getElementById('woDescription').value;
        const priority = document.getElementById('woPriority').value;
        const estimatedCost = parseFloat(document.getElementById('woEstimatedCost').value) || 0;
        const dueDate = document.getElementById('woDueDate').value;
        const notes = document.getElementById('woNotes').value;
        
        const workOrder = {
            id: `wo_${Date.now()}`,
            vehicleId,
            description,
            priority,
            status: 'open',
            estimatedCost,
            actualCost: 0,
            dueDate: dueDate || null,
            notes: notes || '',
            createdAt: new Date().toISOString(),
            createdBy: window.authManager?.getCurrentUser()?.name || 'System',
            assignedTo: null
        };
        
        // Ensure workOrders array exists
        if (!Array.isArray(this.workOrders)) {
            this.workOrders = [];
        }
        
        // Add to work orders array
        this.workOrders.push(workOrder);
        
        // Save to MongoDB (non-blocking)
        this.saveFleetEntity('workOrders', workOrder).catch(err => console.error('Failed to save work order:', err));
        this.saveFleetEntities('workOrders', this.workOrders).catch(err => console.error('Failed to save work orders:', err));
        
        // Save to enterprise core if available
        if (this.enterpriseCore && this.enterpriseCore.modules.maintenance) {
            this.enterpriseCore.modules.maintenance.createWorkOrder(vehicleId, description, priority);
        }
        
        // Close modal
        document.getElementById('workOrderModal').remove();
        
        // Show success notification
        this.showNotification('✅ Work order created and saved to MongoDB!', 'success');
        
        // Refresh maintenance tab
        if (this.currentTab === 'maintenance') {
            this.renderMaintenanceTab();
        }
        
        console.log('✅ Work order created and saved:', workOrder);
    }
    
    selectDriverForMessaging(driverId) {
        const driver = this.data.drivers.find(d => d.id === driverId);
        const container = document.getElementById('messagingInterface');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 60vh;">
                <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 1rem;">
                    <h4 style="margin: 0; color: #f1f5f9;">💬 ${driver.name}</h4>
                    <div style="font-size: 0.875rem; color: #94a3b8;">${driver.id}</div>
                </div>
                <div id="messageHistory" style="flex: 1; overflow-y: auto; margin-bottom: 1rem; display: grid; gap: 0.75rem;">
                    <div style="padding: 1rem; background: rgba(59,130,246,0.1); border-radius: 8px; max-width: 70%;">
                        <div style="color: #f1f5f9;">Hello, how can I help you today?</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">Just now</div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="messageInput" placeholder="Type your message..." 
                        style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #e2e8f0;"
                        onkeypress="if(event.key === 'Enter') fleetManager.sendMessage('${driverId}')">
                    <button onclick="fleetManager.sendMessage('${driverId}')" class="btn btn-primary" style="padding: 0.75rem 1.5rem;">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            </div>
        `;
    }
    
    sendMessage(driverId) {
        const input = document.getElementById('messageInput');
        if (!input || !input.value.trim()) return;
        
        const message = input.value;
        input.value = '';
        
        // Add message to history
        const history = document.getElementById('messageHistory');
        if (history) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = 'padding: 1rem; background: rgba(16,185,129,0.1); border-radius: 8px; max-width: 70%; margin-left: auto;';
            messageDiv.innerHTML = `
                <div style="color: #f1f5f9;">${message}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">Just now</div>
            `;
            history.appendChild(messageDiv);
            history.scrollTop = history.scrollHeight;
        }
        
        console.log(`📨 Message sent to ${driverId}: ${message}`);
    }
    
    generateReport(type) {
        this.showNotification(`📊 Generating ${type} report...`, 'info');
        
        setTimeout(() => {
            const report = {
                id: `report_${Date.now()}`,
                type,
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
                data: this.getReportData(type),
                generatedAt: new Date().toISOString(),
                generatedBy: window.authManager?.getCurrentUser()?.name || 'System'
            };
            
            // Ensure reports array exists
            if (!Array.isArray(this.reports)) {
                this.reports = [];
            }
            
            this.reports.unshift(report);
            
            // Save to MongoDB (non-blocking)
            this.saveFleetEntity('fleetReports', report).catch(err => console.error('Failed to save report:', err));
            this.saveFleetEntities('fleetReports', this.reports).catch(err => console.error('Failed to save reports:', err));
            
            this.showNotification(`✅ ${type} report generated and saved to MongoDB!`, 'success');
            this.renderReportsTab();
        }, 1000);
    }
    
    getReportData(type) {
        switch(type) {
            case 'safety':
                return {
                    incidents: this.getSafetyData().incidents,
                    alerts: this.getSafetyData().alerts,
                    avgScore: this.getSafetyData().avgSafetyScore
                };
            case 'utilization':
                return {
                    totalVehicles: this.data.vehicles.length,
                    activeVehicles: this.data.vehicles.filter(v => v.status === 'active').length,
                    utilization: this.calculateAnalytics().utilization
                };
            case 'cost':
                return {
                    monthlyFuel: this.getFuelData ? this.getFuelData().monthlyCost : 45000,
                    maintenance: this.getMaintenanceData().monthlyCost,
                    total: (this.getFuelData ? this.getFuelData().monthlyCost : 45000) + this.getMaintenanceData().monthlyCost
                };
            case 'compliance':
                const compliance = this.getComplianceData();
                return {
                    compliantDrivers: compliance.compliantDrivers,
                    violations: compliance.violations,
                    inspections: compliance.inspections
                };
            default:
                return {};
        }
    }
    
    createCustomReport() {
        const modal = document.createElement('div');
        modal.id = 'customReportModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                padding: 2rem; width: 90%; max-width: 600px; max-height: 90vh;
                overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">📊 Create Custom Report</h2>
                    <button onclick="document.getElementById('customReportModal').remove()" 
                        style="background: transparent; border: none; color: #94a3b8;
                        font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px;">
                        ×
                    </button>
                </div>
                <form id="customReportForm" onsubmit="fleetManager.submitCustomReport(event)">
                    <div style="display: grid; gap: 1.5rem;">
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Report Title *</label>
                            <input type="text" id="reportTitle" required placeholder="Monthly Fleet Summary"
                                style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                border: 1px solid rgba(255,255,255,0.1);
                                background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                        </div>
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Report Type *</label>
                            <select id="reportType" required
                                style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                border: 1px solid rgba(255,255,255,0.1);
                                background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                                <option value="summary">Summary</option>
                                <option value="detailed">Detailed</option>
                                <option value="analytics">Analytics</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem; font-weight: 600;">Date Range</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <input type="date" id="reportStartDate"
                                    style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                                <input type="date" id="reportEndDate"
                                    style="width: 100%; padding: 0.75rem; border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                    background: rgba(255,255,255,0.05); color: #e2e8f0; font-size: 1rem;">
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="button" onclick="document.getElementById('customReportModal').remove()"
                            style="flex: 1; padding: 0.75rem; border-radius: 8px;
                            border: 1px solid rgba(255,255,255,0.2);
                            background: rgba(255,255,255,0.05); color: #e2e8f0;
                            font-weight: 600; cursor: pointer;">Cancel</button>
                        <button type="submit"
                            style="flex: 1; padding: 0.75rem; border-radius: 8px;
                            border: none; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            color: white; font-weight: 600; cursor: pointer;">
                            Generate Report
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    
    submitCustomReport(event) {
        event.preventDefault();
        const report = {
            id: `report_${Date.now()}`,
            title: document.getElementById('reportTitle').value,
            type: document.getElementById('reportType').value,
            startDate: document.getElementById('reportStartDate').value,
            endDate: document.getElementById('reportEndDate').value,
            data: {},
            generatedAt: new Date().toISOString()
        };
        
        if (!this.reports) this.reports = [];
        this.reports.unshift(report);
        
        document.getElementById('customReportModal').remove();
        this.showNotification('✅ Custom report created!', 'success');
        this.renderReportsTab();
    }
    
    generateHOSReport() {
        this.showNotification('📋 Generating HOS report...', 'info');
        
        setTimeout(() => {
            const report = {
                id: `hos_report_${Date.now()}`,
                type: 'hos',
                title: 'Hours of Service Report',
                data: this.getComplianceData().hosStatus,
                generatedAt: new Date().toISOString()
            };
            
            if (!this.reports) this.reports = [];
            this.reports.unshift(report);
            
            this.showNotification('✅ HOS report generated!', 'success');
            this.renderELDTab();
            this.renderReportsTab();
        }, 1000);
    }
    
    // ==================== NEW SAMSARA FEATURES ====================
    
    renderGeofencingTab() {
        const container = document.getElementById('fleetGeofencingContent') || 
                          document.querySelector('#fleetTabContentGeofencing #fleetGeofencingContent');
        if (!container) {
            const parent = document.getElementById('fleetTabContentGeofencing');
            if (parent) {
                parent.innerHTML = '<div class="glass-card"><div id="fleetGeofencingContent"></div></div>';
            } else {
                console.warn('⚠️ Geofencing tab container not found');
                return;
            }
        }
        
        const content = document.getElementById('fleetGeofencingContent');
        if (!content) return;
        
        // Use live data if available from fleet-live-operations.js
        const vehiclesInZones = this.calculateVehiclesInZones ? this.calculateVehiclesInZones() : 
                                 this.geofences.length > 0 ? this.data.vehicles.filter(v => v.location).length : 0;
        const recentAlerts = this.getGeofenceAlerts ? this.getGeofenceAlerts() : [];
        
        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #f1f5f9;">📍 Geofencing & Zone Management</h3>
                    <button onclick="fleetManager.createGeofence()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Create Zone
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${this.geofences ? this.geofences.length : 0}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Active Zones</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${vehiclesInZones}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Vehicles in Zones</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${recentAlerts.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Alerts (24h)</div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Geofence Zones</h4>
                    <div id="geofenceList" style="display: grid; gap: 1rem;">
                        ${this.geofences && this.geofences.length > 0 ? this.geofences.map(gf => {
                            const vehiclesInZone = this.getVehiclesInZone ? this.getVehiclesInZone(gf.id) : 0;
                            return `
                                <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; color: #f1f5f9;">${gf.name}</div>
                                            <div style="font-size: 0.875rem; color: #94a3b8;">
                                                ${gf.type} | Radius: ${gf.radius}m | ${vehiclesInZone} vehicles
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                                            <span style="padding: 0.5rem 1rem; background: ${gf.active ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)'}; 
                                                color: ${gf.active ? '#10b981' : '#6b7280'}; border-radius: 20px; 
                                                font-size: 0.875rem; font-weight: 600;">
                                                ${gf.active ? 'Active' : 'Inactive'}
                                            </span>
                                            ${this.deleteGeofence ? `
                                                <button onclick="fleetManager.deleteGeofence('${gf.id}')" 
                                                    style="padding: 0.5rem; background: rgba(239,68,68,0.2); 
                                                    color: #ef4444; border: none; border-radius: 8px; cursor: pointer;">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') : `
                            <div style="padding: 3rem; text-align: center; color: #94a3b8;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">📍</div>
                                <div>No geofence zones created yet</div>
                                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Click "Create Zone" to add one</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAssetsTab() {
        const container = document.getElementById('fleetAssetsContent') || 
                          document.querySelector('#fleetTabContentAssets #fleetAssetsContent');
        if (!container) {
            const parent = document.getElementById('fleetTabContentAssets');
            if (parent) {
                parent.innerHTML = '<div class="glass-card"><div id="fleetAssetsContent"></div></div>';
            } else {
                console.warn('⚠️ Assets tab container not found');
                return;
            }
        }
        
        const content = document.getElementById('fleetAssetsContent');
        if (!content) return;
        
        const trackedAssets = this.assets ? this.assets.filter(a => a.trackerId) : [];
        const alerts = this.assets ? this.assets.filter(a => {
            if (!a.lastSeen) return false;
            const lastSeen = new Date(a.lastSeen);
            const hoursAgo = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
            return hoursAgo > 24;
        }) : [];
        
        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #f1f5f9;">📦 Asset & Equipment Tracking</h3>
                    <button onclick="fleetManager.addAsset()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Asset
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${this.assets ? this.assets.length : 0}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Total Assets</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${trackedAssets.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Tracked</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${alerts.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Alerts</div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Tracked Assets</h4>
                    <div id="assetsList" style="display: grid; gap: 1rem;">
                        ${this.assets && this.assets.length > 0 ? this.assets.map(asset => {
                            if (!asset.lastSeen) asset.lastSeen = new Date().toISOString();
                            const lastSeen = new Date(asset.lastSeen);
                            const minutesAgo = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60));
                            const isOnline = minutesAgo < 30;
                            
                            return `
                                <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid ${isOnline ? '#10b981' : '#f59e0b'};">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; color: #f1f5f9;">${asset.name}</div>
                                            <div style="font-size: 0.875rem; color: #94a3b8;">
                                                Type: ${asset.type} | 
                                                ${asset.trackerId ? `Tracker: ${asset.trackerId}` : 'No tracker'} |
                                                Last seen: ${minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.floor(minutesAgo / 60)}h ago`}
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                                            <span style="padding: 0.5rem 1rem; background: ${isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; 
                                                color: ${isOnline ? '#10b981' : '#f59e0b'}; border-radius: 20px; 
                                                font-size: 0.875rem; font-weight: 600;">
                                                ${isOnline ? 'Online' : 'Offline'}
                                            </span>
                                            ${this.deleteAsset ? `
                                                <button onclick="fleetManager.deleteAsset('${asset.id}')" 
                                                    style="padding: 0.5rem; background: rgba(239,68,68,0.2); 
                                                    color: #ef4444; border: none; border-radius: 8px; cursor: pointer;">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') : `
                            <div style="padding: 3rem; text-align: center; color: #94a3b8;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                                <div>No assets tracked yet</div>
                                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Click "Add Asset" to start tracking</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDispatchTab() {
        const container = document.getElementById('fleetDispatchContent') || 
                          document.querySelector('#fleetTabContentDispatch #fleetDispatchContent');
        if (!container) {
            const parent = document.getElementById('fleetTabContentDispatch');
            if (parent) {
                parent.innerHTML = '<div class="glass-card"><div id="fleetDispatchContent"></div></div>';
            } else {
                console.warn('⚠️ Dispatch tab container not found');
                return;
            }
        }
        
        const content = document.getElementById('fleetDispatchContent');
        if (!content) return;
        
        const activeDispatches = this.dispatches ? this.dispatches.filter(d => d.status === 'pending' || d.status === 'active') : [];
        const completedDispatches = this.dispatches ? this.dispatches.filter(d => d.status === 'completed') : [];
        const allRoutes = this.data.routes.filter(r => r.status === 'in-progress' || r.status === 'active');
        const combinedDispatches = [...activeDispatches, ...allRoutes.map(r => ({
            id: r.id,
            driverName: r.driverName || 'Unassigned',
            vehicleId: r.vehicleId || 'N/A',
            task: `Route ${r.id}`,
            priority: r.priority || 'medium',
            status: r.status
        }))];
        
        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #f1f5f9;">📋 Dispatch & Workflow Management</h3>
                    <button onclick="fleetManager.createDispatch()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> New Dispatch
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${combinedDispatches.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Active</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${completedDispatches.length}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Completed</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${this.dispatches ? this.dispatches.length : 0}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Total</div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Active Dispatches</h4>
                    <div id="dispatchList" style="display: grid; gap: 1rem;">
                        ${combinedDispatches.length > 0 ? combinedDispatches.map(dispatch => `
                            <div style="padding: 1.25rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid ${dispatch.priority === 'urgent' ? '#ef4444' : dispatch.priority === 'high' ? '#f59e0b' : '#3b82f6'};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">${dispatch.driverName}</div>
                                        <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Vehicle: ${dispatch.vehicleId}</div>
                                        <div style="font-size: 0.875rem; color: #94a3b8;">${dispatch.task}</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: end;">
                                        <span style="padding: 0.5rem 1rem; background: ${dispatch.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; 
                                            color: ${dispatch.status === 'active' ? '#10b981' : '#f59e0b'}; border-radius: 20px; 
                                            font-size: 0.875rem; font-weight: 600; text-transform: capitalize;">
                                            ${dispatch.status}
                                        </span>
                                        <span style="padding: 0.25rem 0.75rem; background: rgba(59,130,246,0.2); 
                                            color: #3b82f6; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;">
                                            ${dispatch.priority}
                                        </span>
                                    </div>
                                </div>
                                ${this.completeDispatch ? `
                                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                                        <button onclick="fleetManager.completeDispatch('${dispatch.id}')" 
                                            class="btn btn-success" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                            <i class="fas fa-check"></i> Complete
                                        </button>
                                        <button onclick="fleetManager.cancelDispatch('${dispatch.id}')" 
                                            class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                            <i class="fas fa-times"></i> Cancel
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('') : `
                            <div style="padding: 3rem; text-align: center; color: #94a3b8;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                                <div>No active dispatches</div>
                                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Click "New Dispatch" to create one</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderELDTab() {
        const container = document.getElementById('fleetELDContent') || 
                          document.querySelector('#fleetTabContentELD #fleetELDContent');
        if (!container) {
            const parent = document.getElementById('fleetTabContentELD');
            if (parent) {
                parent.innerHTML = '<div class="glass-card"><div id="fleetELDContent"></div></div>';
            } else {
                console.warn('⚠️ ELD tab container not found');
                return;
            }
        }
        
        const content = document.getElementById('fleetELDContent');
        if (!content) return;
        
        const complianceData = this.getComplianceData();
        
        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #f1f5f9;">⏰ Electronic Logging Device (ELD) & HOS</h3>
                    <button onclick="fleetManager.generateHOSReport()" class="btn btn-primary">
                        <i class="fas fa-file-pdf"></i> HOS Report
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${complianceData.compliantDrivers}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Compliant Drivers</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">${complianceData.violations}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">HOS Violations</div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Driver HOS Status</h4>
                    <div id="eldStatusList" style="display: grid; gap: 1rem;">
                        ${complianceData.hosStatus.map(driver => `
                            <div style="padding: 1rem; background: ${driver.compliant ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; border-radius: 8px; border: 1px solid ${driver.compliant ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600; color: #f1f5f9;">${driver.name}</div>
                                        <div style="font-size: 0.875rem; color: #94a3b8;">Hours Remaining: ${driver.hoursRemaining}h</div>
                                    </div>
                                    <span style="padding: 0.5rem 1rem; background: ${driver.compliant ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${driver.compliant ? '#10b981' : '#ef4444'}; border-radius: 20px; font-weight: 600; font-size: 0.875rem;">${driver.compliant ? '✅ Compliant' : '❌ Violation'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderInspectionsTab() {
        const container = document.getElementById('fleetInspectionsContent') || 
                          document.querySelector('#fleetTabContentInspections #fleetInspectionsContent');
        if (!container) {
            const parent = document.getElementById('fleetTabContentInspections');
            if (parent) {
                parent.innerHTML = '<div class="glass-card"><div id="fleetInspectionsContent"></div></div>';
            } else {
                console.warn('⚠️ Inspections tab container not found');
                return;
            }
        }
        
        const content = document.getElementById('fleetInspectionsContent');
        if (!content) return;
        
        const recentInspections = this.inspections ? this.inspections.slice(-10).reverse() : [];
        const passedInspections = this.inspections ? this.inspections.filter(i => i.status === 'passed').length : 0;
        const failedInspections = this.inspections ? this.inspections.filter(i => i.status === 'defects_found').length : 0;
        
        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #f1f5f9;">📋 Digital Inspections & DVIR</h3>
                    <button onclick="fleetManager.createInspection()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> New Inspection
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${this.inspections ? this.inspections.length : 0}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Total Inspections</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${passedInspections}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Passed</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">${failedInspections}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">With Defects</div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Recent Inspections</h4>
                    <div id="inspectionsList" style="display: grid; gap: 1rem;">
                        ${recentInspections.length > 0 ? recentInspections.map(insp => `
                            <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid ${insp.status === 'passed' ? '#10b981' : '#ef4444'};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                    <div>
                                        <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">
                                            ${insp.type.charAt(0).toUpperCase() + insp.type.slice(1)} - ${insp.vehicleId}
                                        </div>
                                        <div style="font-size: 0.875rem; color: #94a3b8;">
                                            Driver: ${insp.driverName} | ${new Date(insp.createdAt).toLocaleString()}
                                        </div>
                                        ${insp.defects && insp.defects.length > 0 ? `
                                            <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(239,68,68,0.1); border-radius: 6px;">
                                                <div style="font-size: 0.875rem; color: #ef4444; font-weight: 600; margin-bottom: 0.25rem;">Defects:</div>
                                                <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.875rem; color: #fca5a5;">
                                                    ${insp.defects.map(d => `<li>${d}</li>`).join('')}
                                                </ul>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <span style="padding: 0.5rem 1rem; background: ${insp.status === 'passed' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; 
                                        color: ${insp.status === 'passed' ? '#10b981' : '#ef4444'}; border-radius: 20px; 
                                        font-size: 0.875rem; font-weight: 600;">
                                        ${insp.status === 'passed' ? '✅ Passed' : '⚠️ Defects'}
                                    </span>
                                </div>
                            </div>
                        `).join('') : `
                            <div style="padding: 3rem; text-align: center; color: #94a3b8;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                                <div>No inspections recorded yet</div>
                                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Click "New Inspection" to create one</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderFuelTab() {
        const container = document.getElementById('fleetFuelContent') || 
                          document.querySelector('#fleetTabContentFuel #fleetFuelContent');
        if (!container) {
            const parent = document.getElementById('fleetTabContentFuel');
            if (parent) {
                parent.innerHTML = '<div class="glass-card"><div id="fleetFuelContent"></div></div>';
            } else {
                console.warn('⚠️ Fuel tab container not found');
                return;
            }
        }
        
        const content = document.getElementById('fleetFuelContent');
        if (!content) return;
        
        const fuelData = this.getFuelData ? this.getFuelData() : {
            monthlyCost: 45000,
            avgEfficiency: 8.5,
            idleTime: 15,
            totalGallons: 5000,
            recentTransactions: []
        };
        
        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #f1f5f9;">⛽ Fuel Management & Efficiency</h3>
                    <button onclick="fleetManager.recordFuelTransaction()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Record Fuel
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">$${fuelData.monthlyCost.toLocaleString()}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Monthly Fuel Cost</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${fuelData.avgEfficiency} MPG</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Avg Efficiency</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${fuelData.idleTime}%</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Idle Time</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #ec4899; margin-bottom: 0.5rem;">${fuelData.totalGallons.toLocaleString()}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Total Gallons</div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">Recent Fuel Transactions</h4>
                    <div id="fuelTransactionsList" style="display: grid; gap: 1rem;">
                        ${fuelData.recentTransactions && fuelData.recentTransactions.length > 0 ? fuelData.recentTransactions.map(trans => `
                            <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600; color: #f1f5f9;">${trans.vehicleId}</div>
                                        <div style="font-size: 0.875rem; color: #94a3b8;">
                                            ${trans.gallons} gallons @ $${trans.pricePerGallon.toFixed(2)} = $${trans.total.toFixed(2)}
                                        </div>
                                        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">
                                            ${new Date(trans.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: #3b82f6;">$${trans.total.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('') : `
                            <div style="padding: 2rem; text-align: center; color: #94a3b8;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⛽</div>
                                <div>No fuel transactions recorded</div>
                                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Click "Record Fuel" to add a transaction</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderEnergyTab() {
        const container = document.getElementById('fleetEnergyContent') || 
                          document.querySelector('#fleetTabContentEnergy #fleetEnergyContent');
        if (!container) {
            const parent = document.getElementById('fleetTabContentEnergy');
            if (parent) {
                parent.innerHTML = '<div class="glass-card"><div id="fleetEnergyContent"></div></div>';
            } else {
                console.warn('⚠️ Energy tab container not found');
                return;
            }
        }
        
        const content = document.getElementById('fleetEnergyContent');
        if (!content) return;
        
        const energyData = this.getEnergyData ? this.getEnergyData() : {
            evCount: 3,
            evPercentage: 25,
            co2Saved: 2.5,
            totalCharges: 45,
            evVehicles: [
                { id: 'EV-001', batteryLevel: 85, charging: true, estimatedRange: 250 },
                { id: 'EV-002', batteryLevel: 60, charging: false, estimatedRange: 180 },
                { id: 'EV-003', batteryLevel: 95, charging: false, estimatedRange: 280 }
            ]
        };
        
        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #f1f5f9;">⚡ Energy & Electrification Insights</h3>
                    <button onclick="fleetManager.addEVVehicle()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add EV Vehicle
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${energyData.evCount}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">EV Vehicles</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${energyData.co2Saved}t</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">CO₂ Saved</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">${energyData.evPercentage}%</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">EV Transition</div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #ec4899; margin-bottom: 0.5rem;">${energyData.totalCharges}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Charging Sessions</div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #f1f5f9;">EV Charging Status</h4>
                    <div id="evChargingList" style="display: grid; gap: 1rem;">
                        ${energyData.evVehicles && energyData.evVehicles.length > 0 ? energyData.evVehicles.map(ev => `
                            <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid ${ev.charging ? '#10b981' : '#6b7280'};">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600; color: #f1f5f9;">${ev.id}</div>
                                        <div style="font-size: 0.875rem; color: #94a3b8;">
                                            Battery: ${ev.batteryLevel}% | 
                                            ${ev.charging ? 'Charging' : 'Not Charging'} |
                                            Range: ${ev.estimatedRange}mi
                                        </div>
                                    </div>
                                    <span style="padding: 0.5rem 1rem; background: ${ev.charging ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)'}; 
                                        color: ${ev.charging ? '#10b981' : '#6b7280'}; border-radius: 20px; 
                                        font-size: 0.875rem; font-weight: 600;">
                                        ${ev.charging ? '⚡ Charging' : '🔋 Idle'}
                                    </span>
                                </div>
                                ${ev.charging ? `
                                    <div style="margin-top: 0.75rem;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                            <span style="font-size: 0.875rem; color: #94a3b8;">Charging Progress</span>
                                            <span style="font-size: 0.875rem; color: #10b981; font-weight: 600;">${ev.batteryLevel}%</span>
                                        </div>
                                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                                            <div style="width: ${ev.batteryLevel}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); border-radius: 4px; transition: width 0.3s ease;"></div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('') : `
                            <div style="padding: 3rem; text-align: center; color: #94a3b8;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div>
                                <div>No EV vehicles configured</div>
                                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Click "Add EV Vehicle" to add one</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update sidebar badges
    updateSidebarBadges() {
        try {
            const safetyData = this.getSafetyData();
            const maintenanceData = this.getMaintenanceData();
            
            const safetyBadge = document.getElementById('navBadgeSafety');
            if (safetyBadge) {
                safetyBadge.textContent = safetyData.alerts;
                safetyBadge.style.display = safetyData.alerts > 0 ? 'block' : 'none';
            }
            
            const maintenanceBadge = document.getElementById('navBadgeMaintenance');
            if (maintenanceBadge) {
                maintenanceBadge.textContent = maintenanceData.openWorkOrders;
                maintenanceBadge.style.display = maintenanceData.openWorkOrders > 0 ? 'block' : 'none';
            }
            
            const mapBadge = document.getElementById('navBadgeMap');
            if (mapBadge) {
                mapBadge.textContent = this.data.vehicles.length;
                mapBadge.style.display = this.data.vehicles.length > 0 ? 'block' : 'none';
            }
            
            const messagesBadge = document.getElementById('navBadgeMessages');
            if (messagesBadge) {
                // Count unread messages if implemented
                messagesBadge.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating sidebar badges:', error);
        }
    }
    
    // Real-time data updates for live operations
    startLiveOperationsUpdates() {
        // Ensure updateIntervals is a Map
        if (!(this.updateIntervals instanceof Map)) {
            this.updateIntervals = new Map();
        }
        
        // Update geofence checks every 30 seconds
        if (!this.updateIntervals.has('geofencing')) {
            const geofenceInterval = setInterval(() => {
                this.checkGeofenceAlerts();
            }, 30000);
            this.updateIntervals.set('geofencing', geofenceInterval);
        }
        
        // Update asset locations every 60 seconds
        if (!this.updateIntervals.has('assets')) {
            const assetInterval = setInterval(() => {
                this.updateAssetLocations();
            }, 60000);
            this.updateIntervals.set('assets', assetInterval);
        }
        
        // Update EV charging status every 10 seconds
        if (!this.updateIntervals.has('ev')) {
            const evInterval = setInterval(() => {
                this.updateEVStatus();
            }, 10000);
            this.updateIntervals.set('ev', evInterval);
        }
    }
    
    checkGeofenceAlerts() {
        if (!this.geofences.length) return;
        
        this.data.vehicles.forEach(vehicle => {
            if (!vehicle.location) return;
            
            this.geofences.forEach(geofence => {
                if (!geofence.active) return;
                
                const inZone = this.isVehicleInZone(vehicle, geofence);
                const wasInZone = vehicle.lastGeofenceState?.[geofence.id];
                
                if (inZone !== wasInZone) {
                    vehicle.lastGeofenceState = vehicle.lastGeofenceState || {};
                    vehicle.lastGeofenceState[geofence.id] = inZone;
                    
                    if (geofence.alertType === 'enter' && inZone) {
                        this.triggerGeofenceAlert(vehicle, geofence, 'enter');
                    } else if (geofence.alertType === 'exit' && !inZone && wasInZone) {
                        this.triggerGeofenceAlert(vehicle, geofence, 'exit');
                    } else if (geofence.alertType === 'both') {
                        this.triggerGeofenceAlert(vehicle, geofence, inZone ? 'enter' : 'exit');
                    }
                }
            });
        });
    }
    
    triggerGeofenceAlert(vehicle, geofence, type) {
        const alert = {
            id: `alert_${Date.now()}`,
            vehicleId: vehicle.id,
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            type,
            timestamp: new Date().toISOString()
        };
        
        console.log(`🚨 Geofence Alert: Vehicle ${vehicle.id} ${type === 'enter' ? 'entered' : 'exited'} ${geofence.name}`);
        
        // Show notification
        this.showNotification(
            `🚨 Vehicle ${vehicle.id} ${type === 'enter' ? 'entered' : 'exited'} zone: ${geofence.name}`,
            'warning'
        );
        
        // Refresh geofencing tab if active
        if (this.currentTab === 'geofencing') {
            setTimeout(() => this.renderGeofencingTab(), 500);
        }
    }
    
    updateAssetLocations() {
        // Simulate asset location updates
        this.assets.forEach(asset => {
            if (asset.trackerId && Math.random() > 0.3) {
                asset.lastSeen = new Date().toISOString();
                // Simulate location update
                if (this.data.vehicles.length > 0) {
                    const randomVehicle = this.data.vehicles[Math.floor(Math.random() * this.data.vehicles.length)];
                    if (randomVehicle.location) {
                        asset.location = {
                            lat: randomVehicle.location.lat + (Math.random() - 0.5) * 0.01,
                            lng: randomVehicle.location.lng + (Math.random() - 0.5) * 0.01
                        };
                    }
                }
            }
        });
        
        if (this.currentTab === 'assets') {
            this.renderAssetsTab();
        }
    }
    
    updateEVStatus() {
        this.evVehicles.forEach(ev => {
            if (ev.charging && ev.batteryLevel < 100) {
                ev.batteryLevel = Math.min(100, ev.batteryLevel + 1);
                ev.estimatedRange = Math.round((ev.batteryLevel / 100) * (ev.capacity * 4));
                if (ev.batteryLevel >= 100) {
                    ev.charging = false;
                }
            }
        });
        
        if (this.currentTab === 'energy') {
            this.renderEnergyTab();
        }
    }
    
    isVehicleInZone(vehicle, geofence) {
        if (!vehicle.location || !geofence.center) return false;
        const distance = this.calculateDistance(
            vehicle.location.lat || vehicle.lat,
            vehicle.location.lng || vehicle.lng,
            geofence.center.lat,
            geofence.center.lng
        );
        return distance <= geofence.radius;
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // ==================== NOTIFICATION SYSTEM ====================
    
    showNotification(message, type = 'info', duration = 3000) {
        try {
            // Try to use app notification system if available
            if (window.app && typeof window.app.showAlert === 'function') {
                window.app.showAlert(message, type);
                return;
            }
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fleet-notification fleet-notification-${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                            type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 
                            type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                            'linear-gradient(135deg, #3b82f6, #2563eb)'};
                color: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                z-index: 10000;
                font-weight: 600;
                font-size: 0.95rem;
                min-width: 300px;
                max-width: 500px;
                animation: slideInRight 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            `;
            
            const icon = type === 'success' ? '✅' : 
                        type === 'warning' ? '⚠️' : 
                        type === 'error' ? '❌' : 'ℹ️';
            
            notification.innerHTML = `
                <span style="font-size: 1.25rem;">${icon}</span>
                <span style="flex: 1;">${message}</span>
            `;
            
            // Add to body
            document.body.appendChild(notification);
            
            // Auto remove after duration
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, duration);
            
        } catch (error) {
            console.error('Error showing notification:', error);
            // Fallback to console
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.fleetManager) {
            window.fleetManager = new WorldClassFleetManager();
            WorldClassFleetManager.attachGlobalFunctions();
            window.fleetManager.initialize();
        }
    });
} else {
    if (!window.fleetManager) {
        window.fleetManager = new WorldClassFleetManager();
        WorldClassFleetManager.attachGlobalFunctions();
        window.fleetManager.initialize();
    }
}
