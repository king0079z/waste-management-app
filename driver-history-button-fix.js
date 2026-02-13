// Driver History Button Fix - Ensures driver history functionality works properly
console.log('📜 Loading Driver History Button Fix...');

class DriverHistoryButtonFix {
    constructor() {
        this.currentDriverData = null;
        this.historyModalReady = false;
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing Driver History Button Fix...');
        
        // Enhance the showDriverHistoryModal function
        this.enhanceHistoryModalFunction();
        
        // Set up driver data tracking
        this.setupDriverDataTracking();
        
        // Fix history button clicks
        this.fixHistoryButtonClicks();
        
        // Ensure modal exists
        this.ensureHistoryModalExists();
        
        console.log('✅ Driver History Button Fix initialized');
    }
    
    enhanceHistoryModalFunction() {
        // Store original function if it exists
        const originalShowHistoryModal = window.showDriverHistoryModal;
        
        // Store reference to this instance
        const self = this;
        
        // Enhanced version with explicit this binding
        window.showDriverHistoryModal = function() {
            console.log('📜 Enhanced driver history modal triggered');
            
            // Try multiple methods to get current driver
            let currentUser = self.getCurrentDriverData();
            
            if (!currentUser) {
                console.warn('⚠️ No current driver found, showing all history');
                // Show generic history instead of failing
                self.showGenericDriverHistory();
                return;
            }
            
            console.log('📊 Opening driver history for:', currentUser.name);
            
            // Show driver history modal
            const modal = document.getElementById('driverHistoryModal');
            if (!modal) {
                console.error('❌ Driver history modal not found in DOM');
                self.createHistoryModal();
                return;
            }
            
            // Show modal
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            document.body.classList.add('driver-history-modal-open');
            
            // Populate with data - use explicit binding
            self.populateDriverHistoryModalEnhanced.call(self, currentUser);
            
            console.log('✅ Driver history modal opened successfully');
        };
        
        // Also ensure close function exists
        if (!window.closeDriverHistoryModal) {
            window.closeDriverHistoryModal = () => {
                const modal = document.getElementById('driverHistoryModal');
                if (modal) {
                    modal.style.display = 'none';
                    modal.style.visibility = 'hidden';
                    modal.style.opacity = '0';
                }
                document.body.classList.remove('driver-history-modal-open');
                console.log('📜 Driver history modal closed');
            };
        }
        
        console.log('✅ Enhanced driver history modal functions');
    }
    
    getCurrentDriverData() {
        // Try multiple sources to get current driver
        
        // 1. Check window.currentDriverData (set by driver interface)
        if (window.currentDriverData && window.currentDriverData.id) {
            console.log('👤 Found current driver in window.currentDriverData:', window.currentDriverData.name);
            return window.currentDriverData;
        }
        
        // 2. Check authManager
        if (window.authManager && typeof window.authManager.getCurrentUser === 'function') {
            const authUser = window.authManager.getCurrentUser();
            if (authUser && (authUser.type === 'driver' || authUser.id.startsWith('USR-'))) {
                console.log('👤 Found current driver in authManager:', authUser.name);
                return authUser;
            }
        }
        
        // 3. Check localStorage for driver data
        try {
            const storedDriver = localStorage.getItem('currentDriver');
            if (storedDriver) {
                const driverData = JSON.parse(storedDriver);
                if (driverData && driverData.id) {
                    console.log('👤 Found current driver in localStorage:', driverData.name);
                    return driverData;
                }
            }
        } catch (error) {
            console.warn('⚠️ Error parsing stored driver data:', error);
        }
        
        // 4. Check if we're on a driver page or have driver context
        if (window.location.pathname.includes('driver') || 
            document.title.includes('Driver') ||
            document.querySelector('.driver-interface')) {
            
            // Try to find any driver in the system as fallback
            if (window.dataManager && typeof window.dataManager.getUsers === 'function') {
                const drivers = window.dataManager.getUsers().filter(u => u.type === 'driver');
                if (drivers.length > 0) {
                    console.log('👤 Using fallback driver:', drivers[0].name);
                    return drivers[0];
                }
            }
        }
        
        console.warn('⚠️ Could not determine current driver');
        return null;
    }
    
    showGenericDriverHistory() {
        console.log('📜 Showing generic driver history (no specific driver found)');
        
        const modal = document.getElementById('driverHistoryModal');
        if (!modal) {
            this.createHistoryModal();
            return;
        }
        
        // Show modal with generic content
        modal.style.display = 'block';
        
        // Populate with available driver data
        const header = document.getElementById('driverHistoryHeader');
        if (header) {
            header.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-history" style="color: white; font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; color: #3b82f6;">Collection History</h3>
                        <p style="margin: 0; color: #64748b;">System Overview</p>
                    </div>
                </div>
            `;
        }
        
        // Show system-wide collection data
        this.populateSystemCollectionHistory();
    }
    
    populateSystemCollectionHistory() {
        const container = document.getElementById('driverHistoryContent');
        if (!container) return;
        
        let collections = [];
        if (window.dataManager && typeof window.dataManager.getCollections === 'function') {
            collections = window.dataManager.getCollections().slice(-20); // Last 20 collections
        }
        
        if (collections.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Collection History</h3>
                    <p>No collection records found in the system.</p>
                </div>
            `;
            return;
        }
        
        const historyHTML = collections.map(collection => `
            <div class="history-item" style="
                padding: 1rem;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <h4 style="margin: 0; color: #1e293b;">Bin: ${collection.binId}</h4>
                    <p style="margin: 0; color: #64748b; font-size: 0.875rem;">
                        Driver: ${collection.driverId} | ${new Date(collection.timestamp).toLocaleString()}
                        ${collection.autoCollection ? ' <span style="color: #059669; font-weight: 600;">(Auto collection)</span>' : ''}
                    </p>
                </div>
                <div style="
                    background: #10b981;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                ">
                    Collected
                </div>
            </div>
        `).join('');
        
        container.innerHTML = historyHTML;
    }
    
    populateDriverHistoryModalEnhanced(driver) {
        if (!driver) return;
        
        // Get comprehensive data for this driver
        let collections = [];
        let routes = [];
        let bins = [];
        
        if (window.dataManager) {
            collections = window.dataManager.getCollections().filter(c => c.driverId === driver.id);
            routes = window.dataManager.getRoutes().filter(r => r.driverId === driver.id);
            bins = window.dataManager.getBins();
        }
        
        const completedRoutes = routes.filter(r => r.status === 'completed');
        const todayCollections = collections.filter(c => 
            new Date(c.timestamp).toDateString() === new Date().toDateString()
        );
        
        // Calculate performance metrics
        const weekCollections = collections.filter(c => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(c.timestamp) >= weekAgo;
        });
        
        const monthCollections = collections.filter(c => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(c.timestamp) >= monthAgo;
        });
        
        const avgCollectionsPerDay = collections.length > 0 
            ? (collections.length / Math.max(1, Math.ceil((Date.now() - new Date(collections[0].timestamp)) / (1000 * 60 * 60 * 24)))).toFixed(1)
            : 0;
        
        // Populate enhanced driver header with comprehensive stats (mobile-friendly structure)
        const header = document.getElementById('driverHistoryHeader');
        if (header) {
            header.innerHTML = `
                <div class="driver-history-header-inner" style="background: linear-gradient(135deg, #059669, #047857); padding: 1.5rem; border-radius: 12px; color: white; margin-bottom: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
                        <div style="background: rgba(255,255,255,0.2); width: 64px; height: 64px; min-width: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                            <i class="fas fa-user-circle" style="font-size: 2.25rem;"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.35rem; word-break: break-word;">${driver.name}</h2>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; opacity: 0.95;">
                                <span><i class="fas fa-id-card"></i> ${driver.id}</span>
                                <span><i class="fas fa-star"></i> ${(driver.rating || 5).toFixed(1)}/5</span>
                                <span><i class="fas fa-calendar-check"></i> ${driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                        <button class="driver-history-report-btn" onclick="window.generateDriverReport('${driver.id}')" style="
                            background: rgba(255,255,255,0.2);
                            border: 2px solid rgba(255,255,255,0.4);
                            color: white;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.95rem;
                            transition: all 0.2s;
                            backdrop-filter: blur(10px);
                        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fas fa-file-pdf"></i> Generate Report
                        </button>
                    </div>
                    
                    <!-- Performance Metrics Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem;">
                        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">Total Collections</div>
                            <div style="font-size: 2rem; font-weight: 700;">${collections.length}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">Completed Routes</div>
                            <div style="font-size: 2rem; font-weight: 700;">${completedRoutes.length}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">Today</div>
                            <div style="font-size: 2rem; font-weight: 700;">${todayCollections.length}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">This Week</div>
                            <div style="font-size: 2rem; font-weight: 700;">${weekCollections.length}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">This Month</div>
                            <div style="font-size: 2rem; font-weight: 700;">${monthCollections.length}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">Daily Avg</div>
                            <div style="font-size: 2rem; font-weight: 700;">${avgCollectionsPerDay}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Populate enhanced history content
        this.populateDriverHistoryContentEnhanced(driver, collections, routes, bins);
    }
    
    populateDriverHistoryContentEnhanced(driver, collections, routes, bins) {
        const container = document.getElementById('driverHistoryContent');
        if (!container) return;
        
        if (!collections || collections.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 4rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px;">
                    <i class="fas fa-clipboard-list" style="font-size: 4rem; margin-bottom: 1.5rem; color: #3b82f6; opacity: 0.5;"></i>
                    <h3 style="color: #1e293b; margin-bottom: 0.5rem;">No Collection History Yet</h3>
                    <p style="color: #64748b; margin-bottom: 1rem;">No collection records found for ${driver.name}.</p>
                    <p style="color: #3b82f6; font-weight: 600;">Start collecting waste to build your performance history!</p>
                </div>
            `;
            return;
        }
        
        // Group collections by date
        let groupedCollections;
        if (this && typeof this.groupCollectionsByDate === 'function') {
            groupedCollections = this.groupCollectionsByDate(collections);
        } else if (window.driverHistoryButtonFix && typeof window.driverHistoryButtonFix.groupCollectionsByDate === 'function') {
            groupedCollections = window.driverHistoryButtonFix.groupCollectionsByDate(collections);
        } else {
            groupedCollections = collections.reduce((groups, collection) => {
                const date = new Date(collection.timestamp).toDateString();
                if (!groups[date]) groups[date] = [];
                groups[date].push(collection);
                return groups;
            }, {});
        }
        
        // Enhanced history display with comprehensive details
        const historyHTML = Object.entries(groupedCollections)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, dayCollections]) => {
                const dayTotal = dayCollections.length;
                const dateObj = new Date(date);
                const isToday = dateObj.toDateString() === new Date().toDateString();
                
                return `
                <div class="history-day-group" style="margin-bottom: 2rem; animation: fadeIn 0.3s ease-in;">
                    <div style="
                        background: ${isToday ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #64748b, #475569)'};
                        color: white;
                        padding: 0.75rem 1.25rem;
                        border-radius: 10px;
                        margin-bottom: 1rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    ">
                        <div>
                            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600;">
                                ${isToday ? '🌟 ' : ''}${dateObj.toLocaleDateString('en', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                                ${isToday ? ' (Today)' : ''}
                            </h4>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <span style="background: rgba(255,255,255,0.2); padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                                <i class="fas fa-check-circle"></i> ${dayTotal} Collection${dayTotal !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    
                    <div style="display: grid; gap: 0.75rem;">
                        ${dayCollections.map((collection, index) => {
                            // Get bin details
                            const bin = bins.find(b => b.id === collection.binId);
                            const binLocation = bin ? bin.location : 'Unknown';
                            const binType = bin ? bin.type : 'general';
                            
                            // Get route details
                            const route = routes.find(r => r.id === collection.routeId);
                            
                            return `
                            <div class="collection-card" style="
                                background: white;
                                border: 2px solid #e2e8f0;
                                border-radius: 12px;
                                padding: 1.25rem;
                                transition: all 0.2s;
                                cursor: pointer;
                                position: relative;
                                overflow: hidden;
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'; this.style.borderColor='#3b82f6'" onmouseout="this.style.transform=''; this.style.boxShadow=''; this.style.borderColor='#e2e8f0'">
                                <!-- Collection Number Badge -->
                                <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #10b981, #059669); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">
                                    ${index + 1}
                                </div>
                                
                                <!-- Main Content -->
                                <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; margin-bottom: 1rem;">
                                    <div>
                                        <h5 style="margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1.1rem; font-weight: 600;">
                                            <i class="fas fa-trash-alt" style="color: #10b981; margin-right: 0.5rem;"></i>
                                            ${collection.binId}
                                        </h5>
                                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.875rem; color: #64748b;">
                                            <span><i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> ${binLocation}</span>
                                            <span><i class="fas fa-dumpster" style="color: #8b5cf6;"></i> ${this.getBinTypeLabel(binType)}</span>
                                            <span><i class="fas fa-clock" style="color: #3b82f6;"></i> ${new Date(collection.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="background: #10b981; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; white-space: nowrap;">
                                            ✅ Collected
                                        </div>
                                        ${collection.autoCollection ? `
                                        <div style="margin-top: 0.35rem; font-size: 0.75rem; color: #059669; font-weight: 600;">
                                            <i class="fas fa-map-marker-alt"></i> Auto collection
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <!-- Additional Details Grid -->
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; padding: 1rem; background: #f8fafc; border-radius: 8px; margin-top: 1rem;">
                                    ${route ? `
                                        <div>
                                            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Route</div>
                                            <div style="font-size: 0.875rem; color: #1e293b; font-weight: 600;">${route.id}</div>
                                        </div>
                                    ` : ''}
                                    ${collection.driverId ? `
                                        <div>
                                            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Driver</div>
                                            <div style="font-size: 0.875rem; color: #1e293b; font-weight: 600;">${driver.name}</div>
                                        </div>
                                    ` : ''}
                                    ${bin && bin.capacity ? `
                                        <div>
                                            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Capacity</div>
                                            <div style="font-size: 0.875rem; color: #1e293b; font-weight: 600;">${bin.capacity}L</div>
                                        </div>
                                    ` : ''}
                                    <div>
                                        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Timestamp</div>
                                        <div style="font-size: 0.875rem; color: #1e293b; font-weight: 600;">${new Date(collection.timestamp).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                                
                                <!-- Action Buttons -->
                                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                    <button onclick="window.mapManager?.map?.flyTo([${bin?.lat || 0}, ${bin?.lng || 0}], 16)" style="
                                        flex: 1;
                                        background: linear-gradient(135deg, #3b82f6, #2563eb);
                                        color: white;
                                        border: none;
                                        padding: 0.5rem 1rem;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 0.875rem;
                                        font-weight: 600;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                        <i class="fas fa-map-marked-alt"></i> View on Map
                                    </button>
                                    ${route ? `
                                        <button onclick="window.showRouteDetails('${route.id}')" style="
                                            flex: 1;
                                            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                                            color: white;
                                            border: none;
                                            padding: 0.5rem 1rem;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-size: 0.875rem;
                                            font-weight: 600;
                                            transition: all 0.2s;
                                        " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                            <i class="fas fa-route"></i> Route Details
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            `}).join('');
        
        container.innerHTML = historyHTML + `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `;
    }
    
    getBinTypeLabel(type) {
        const types = {
            'general': 'General Waste',
            'recycling': 'Recycling',
            'organic': 'Organic',
            'hazardous': 'Hazardous',
            'mixed': 'Mixed'
        };
        return types[type] || 'General';
    }
    
    groupCollectionsByDate(collections) {
        return collections.reduce((groups, collection) => {
            const date = new Date(collection.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(collection);
            return groups;
        }, {});
    }
    
    setupDriverDataTracking() {
        // Listen for driver authentication events
        document.addEventListener('driverAuthenticated', (event) => {
            this.currentDriverData = event.detail;
            console.log('👤 Driver authenticated for history:', this.currentDriverData.name);
        });
        
        // Check if driver data is already available
        setTimeout(() => {
            this.currentDriverData = this.getCurrentDriverData();
            if (this.currentDriverData) {
                console.log('👤 Driver data tracked for history:', this.currentDriverData.name);
            }
        }, 1000);
    }
    
    fixHistoryButtonClicks() {
        // Find and enhance history buttons
        const historyButtons = document.querySelectorAll('button[onclick*="showDriverHistoryModal"]');
        
        historyButtons.forEach(button => {
            // Remove existing onclick
            button.removeAttribute('onclick');
            
            // Add enhanced click handler
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📜 History button clicked (enhanced handler)');
                
                if (typeof window.showDriverHistoryModal === 'function') {
                    window.showDriverHistoryModal();
                } else {
                    console.error('❌ showDriverHistoryModal function not found');
                    alert('Driver history feature is not available at the moment.');
                }
            });
            
            console.log('✅ Enhanced history button click handler');
        });
    }
    
    ensureHistoryModalExists() {
        let modal = document.getElementById('driverHistoryModal');
        if (!modal) {
            console.log('🔧 Creating missing driver history modal');
            this.createHistoryModal();
        } else {
            console.log('✅ Driver history modal exists');
        }
    }
    
    createHistoryModal() {
        const modal = document.createElement('div');
        modal.id = 'driverHistoryModal';
        modal.className = 'modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                margin: 5% auto;
                padding: 0;
                border-radius: 12px;
                width: 90%;
                max-width: 800px;
                max-height: 80%;
                overflow-y: auto;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <!-- Modal Header -->
                <div class="modal-header" style="
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    border-radius: 12px 12px 0 0;
                ">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-history"></i>
                        Collection History
                    </h2>
                    <span class="close" onclick="closeDriverHistoryModal()" style="
                        font-size: 28px;
                        font-weight: bold;
                        cursor: pointer;
                        color: white;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    ">&times;</span>
                </div>
                
                <!-- Driver Header -->
                <div id="driverHistoryHeader" style="
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                ">
                    Loading driver information...
                </div>
                
                <!-- History Content -->
                <div id="driverHistoryContent" style="
                    padding: 1.5rem 2rem;
                    min-height: 300px;
                ">
                    Loading history...
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('✅ Created driver history modal');
    }
    
    // Public methods for debugging
    testHistoryModal() {
        console.log('🧪 Testing driver history modal...');
        const currentDriver = this.getCurrentDriverData();
        if (currentDriver) {
            window.showDriverHistoryModal();
        } else {
            console.warn('⚠️ No driver found for testing');
        }
    }
    
    getHistoryStatus() {
        return {
            modalExists: !!document.getElementById('driverHistoryModal'),
            currentDriver: !!this.currentDriverData,
            functionExists: typeof window.showDriverHistoryModal === 'function',
            historyButtonsCount: document.querySelectorAll('button[onclick*="showDriverHistoryModal"]').length
        };
    }
}

// Initialize the fix
window.driverHistoryButtonFix = new DriverHistoryButtonFix();

// Add global debug function
window.debugDriverHistory = function() {
    console.table(window.driverHistoryButtonFix.getHistoryStatus());
    window.driverHistoryButtonFix.testHistoryModal();
};

// Add global report generation function integrated with reporting system
window.generateDriverReport = function(driverId) {
    console.log('📊 Generating comprehensive report for driver:', driverId);
    
    try {
        // Get driver data
        const driver = window.dataManager?.getUsers()?.find(u => u.id === driverId);
        if (!driver) {
            window.app?.showAlert('Error', 'Driver not found', 'error');
            return;
        }
        
        // Get collections and routes
        const collections = window.dataManager?.getCollections()?.filter(c => c.driverId === driverId) || [];
        const routes = window.dataManager?.getRoutes()?.filter(r => r.driverId === driverId) || [];
        
        // Prepare report data
        const reportData = {
            type: 'driver',
            driverId: driverId,
            driverName: driver.name,
            dateRange: 'all',
            startDate: collections.length > 0 ? new Date(Math.min(...collections.map(c => new Date(c.timestamp)))) : new Date(),
            endDate: new Date(),
            collections: collections,
            routes: routes,
            totalCollections: collections.length,
            completedRoutes: routes.filter(r => r.status === 'completed').length,
            avgCollectionsPerDay: (collections.length / Math.max(1, Math.ceil((Date.now() - new Date(collections[0]?.timestamp || Date.now())) / (1000 * 60 * 60 * 24)))).toFixed(2),
            rating: driver.rating || 5,
            timestamp: new Date().toISOString()
        };
        
        // Check if comprehensive reporting system exists
        if (window.comprehensiveReportingSystem && typeof window.comprehensiveReportingSystem.generatePDF === 'function') {
            console.log('✅ Using comprehensive reporting system');
            window.comprehensiveReportingSystem.generatePDF(reportData, 'driver');
        } else if (window.app && typeof window.app.generateReport === 'function') {
            console.log('✅ Using app report generator');
            window.app.generateReport('driver', driverId);
        } else {
            // Fallback: Show report preview
            console.log('⚠️ Full reporting system not available, showing preview');
            showDriverReportPreview(driver, reportData);
        }
        
        // Log to analytics
        if (window.dataManager && typeof window.dataManager.addSystemLog === 'function') {
            window.dataManager.addSystemLog({
                type: 'report_generated',
                message: `Driver report generated for ${driver.name}`,
                userId: driverId,
                metadata: { reportType: 'driver', collectionsCount: collections.length }
            });
        }
        
        // Show success message
        if (window.app && typeof window.app.showAlert === 'function') {
            window.app.showAlert('Report Generated', `Comprehensive report for ${driver.name} is being prepared`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error generating driver report:', error);
        if (window.app && typeof window.app.showAlert === 'function') {
            window.app.showAlert('Error', 'Failed to generate report: ' + error.message, 'error');
        }
    }
};

// Fallback report preview function
function showDriverReportPreview(driver, reportData) {
    const previewHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 800px; margin: 2rem auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <h2 style="margin: 0 0 1rem 0; color: #1e293b;">📊 Driver Performance Report</h2>
            <h3 style="margin: 0 0 1.5rem 0; color: #64748b;">${driver.name} (${driver.id})</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Total Collections</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${reportData.totalCollections}</div>
                </div>
                <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; border-left: 4px solid #10b981;">
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Completed Routes</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${reportData.completedRoutes}</div>
                </div>
                <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Daily Average</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${reportData.avgCollectionsPerDay}</div>
                </div>
                <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Rating</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${reportData.rating.toFixed(1)}/5</div>
                </div>
            </div>
            
            <div style="text-align: center; padding: 2rem; background: #f8fafc; border-radius: 8px;">
                <p style="color: #64748b; margin-bottom: 1rem;">Full PDF reporting system will be available when comprehensive-reporting-system.js is loaded</p>
                <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
        </div>
    `;
    
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Driver Report - ${driver.name}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f1f5f9; }
                @media print { body { background: white; } }
            </style>
        </head>
        <body>${previewHTML}</body>
        </html>
    `);
    previewWindow.document.close();
}

// Add global function to show route details
window.showRouteDetails = function(routeId) {
    console.log('🗺️ Showing details for route:', routeId);
    
    const route = window.dataManager?.getRoutes()?.find(r => r.id === routeId);
    if (!route) {
        console.warn('Route not found:', routeId);
        return;
    }
    
    // If route details modal exists, use it
    if (window.app && typeof window.app.showRouteDetails === 'function') {
        window.app.showRouteDetails(routeId);
    } else {
        // Simple alert with route info
        alert(`Route: ${routeId}\nStatus: ${route.status}\nBins: ${route.bins?.length || route.binIds?.length || 0}\nCreated: ${new Date(route.createdAt).toLocaleString()}`);
    }
};

console.log('📜 Driver History Button Fix loaded and active');
console.log('🧪 Debug: Use debugDriverHistory() to test history functionality');
console.log('📊 Report: Use generateDriverReport(driverId) to generate reports');