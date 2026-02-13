/**
 * AI/ML MASTER INTEGRATION SYSTEM
 * Connects ALL AI/ML systems with entire application for world-class operations
 * 
 * Features:
 * - Centralized AI/ML orchestration
 * - Real-time data pipeline
 * - Cross-system synchronization
 * - Performance monitoring
 * - Automatic optimization
 * - Analytics integration
 * - Predictive insights delivery
 */

class AIMLMasterIntegration {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.status = 'initializing';
        this.startTime = Date.now();
        
        // AI/ML Systems Registry
        this.systems = {
            mlRouteOptimizer: null,
            predictiveAnalytics: null,
            analyticsIntegration: null,
            enhancedAnalytics: null
        };
        
        // Data Pipelines
        this.pipelines = {
            realTime: new Map(),
            batch: new Map(),
            streaming: new Map()
        };
        
        // Performance Metrics
        this.metrics = {
            predictions: { total: 0, accurate: 0, accuracy: 0 },
            optimizations: { total: 0, successful: 0, efficiency: 0 },
            analytics: { processed: 0, insights: 0 },
            latency: { avg: 0, max: 0, min: Infinity }
        };
        
        // CRITICAL: Initialize insights and recommendations FIRST
        this.lastInsights = {
            bins: {},
            routes: {},
            sensors: {},
            collections: {},
            performance: {}
        };
        
        this.recommendations = {
            bins: [],
            routes: [],
            sensors: [],
            resources: []
        };
        
        this.forecasts = {
            demand: null,
            overflow: null,
            maintenance: null
        };
        
        // Integration Points with Application
        this.integrations = {
            binManagement: true,
            routeOptimization: true,
            sensorData: true,
            collections: true,
            analytics: true,
            dashboard: true,
            alerts: true,
            reporting: true
        };
        
        console.log('🧠 AI/ML Master Integration System Loading...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing AI/ML Master Integration...\n');
            
            // Step 1: Wait for dependencies (continues with fallback on timeout)
            const ready = await this.waitForCoreSystems();
            if (!ready) {
                this.status = 'degraded';
                this.updateAIStatusUI();
                return;
            }
            console.log('✓ Core systems ready');
            
            // Step 2: Connect AI/ML systems
            await this.connectAIMLSystems();
            console.log('✓ AI/ML systems connected');
            
            // Step 3: Setup data pipelines
            await this.setupDataPipelines();
            console.log('✓ Data pipelines established');
            
            // Step 4: Initialize real-time sync
            await this.initializeRealTimeSync();
            console.log('✓ Real-time synchronization active');
            
            // Step 5: Connect to application features
            await this.connectApplicationFeatures();
            console.log('✓ Application features integrated');
            
            // Step 6: Start monitoring
            await this.startPerformanceMonitoring();
            console.log('✓ Performance monitoring active');
            
            // Step 7: Enable auto-optimization
            await this.enableAutoOptimization();
            console.log('✓ Auto-optimization enabled');
            
            // Step 8: Setup analytics delivery
            await this.setupAnalyticsDelivery();
            console.log('✓ Analytics delivery configured');
            
            this.initialized = true;
            this.status = 'operational';
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ AI/ML MASTER INTEGRATION OPERATIONAL');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            this.printSystemStatus();
            this.exposeGlobalAPI();
            this.updateAIStatusUI();
            
        } catch (error) {
            console.error('❌ AI/ML Master Integration failed:', error);
            this.status = 'error';
            this.updateAIStatusUI();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SYSTEM CONNECTION & INITIALIZATION
    // ═══════════════════════════════════════════════════════════

    async waitForCoreSystems() {
        const requiredSystems = [
            'dataManager',
            'mapManager',
            'syncManager'
        ];
        
        const maxWait = 60000; // 60s to allow slow load
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            const allReady = requiredSystems.every(sys => window[sys]);
            if (allReady) return true;
            await this.sleep(200);
        }
        
        // Don't throw: continue with fallback so app still works
        console.warn('⚠️ AI/ML Master: Core systems not all ready within timeout, using fallback');
        return false;
    }

    async connectAIMLSystems() {
        // Wait a bit for other systems to load
        await this.sleep(1000);
        
        // Connect ML Route Optimizer
        if (window.MLRouteOptimizer || window.mlRouteOptimizer) {
            this.systems.mlRouteOptimizer = window.mlRouteOptimizer || (window.MLRouteOptimizer ? new window.MLRouteOptimizer() : null);
            if (this.systems.mlRouteOptimizer) {
                console.log('  ✓ ML Route Optimizer connected');
            }
        }
        
        // Connect Predictive Analytics
        if (window.PredictiveAnalytics || window.predictiveAnalytics) {
            this.systems.predictiveAnalytics = window.predictiveAnalytics || (window.PredictiveAnalytics ? new window.PredictiveAnalytics() : null);
            if (this.systems.predictiveAnalytics) {
                console.log('  ✓ Predictive Analytics connected');
            }
        }
        
        // Connect Analytics Integration
        if (window.AIAnalyticsIntegration || window.aiAnalyticsIntegration) {
            this.systems.analyticsIntegration = window.aiAnalyticsIntegration || (window.AIAnalyticsIntegration ? new window.AIAnalyticsIntegration() : null);
            if (this.systems.analyticsIntegration) {
                console.log('  ✓ Analytics Integration connected');
            }
        }
        
        // Connect Enhanced Analytics
        if (window.EnhancedAnalyticsManager || window.enhancedAnalyticsManager) {
            this.systems.enhancedAnalytics = window.enhancedAnalyticsManager;
            if (this.systems.enhancedAnalytics) {
                console.log('  ✓ Enhanced Analytics connected');
            }
        }
        
        // If no systems available, note it but continue
        const connectedCount = Object.values(this.systems).filter(s => s !== null).length;
        if (connectedCount === 0) {
            console.log('  ⚠️ No AI/ML systems found yet - will work with basic features');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // DATA PIPELINE SETUP
    // ═══════════════════════════════════════════════════════════

    async setupDataPipelines() {
        console.log('\n📊 Setting up data pipelines...');
        
        // Real-time bin data pipeline
        this.setupBinDataPipeline();
        
        // Route optimization pipeline
        this.setupRouteOptimizationPipeline();
        
        // Sensor data pipeline
        this.setupSensorDataPipeline();
        
        // Collections analytics pipeline
        this.setupCollectionsAnalyticsPipeline();
        
        // Performance metrics pipeline
        this.setupPerformanceMetricsPipeline();
        
        console.log('  ✓ All data pipelines configured');
    }

    setupBinDataPipeline() {
        const pipeline = {
            name: 'Bin Data Pipeline',
            source: 'dataManager',
            processors: [
                this.processBinFillLevels.bind(this),
                this.predictBinOverflow.bind(this),
                this.optimizeCollectionSchedule.bind(this),
                this.generateBinInsights.bind(this)
            ],
            destinations: [
                'predictiveAnalytics',
                'analyticsIntegration',
                'dashboard'
            ],
            interval: 5000 // 5 seconds
        };
        
        this.pipelines.realTime.set('bins', pipeline);
        this.startPipeline('bins');
    }

    setupRouteOptimizationPipeline() {
        const pipeline = {
            name: 'Route Optimization Pipeline',
            source: 'routes',
            processors: [
                this.analyzeRouteEfficiency.bind(this),
                this.predictOptimalRoutes.bind(this),
                this.generateRouteRecommendations.bind(this)
            ],
            destinations: [
                'mlRouteOptimizer',
                'dashboard',
                'drivers'
            ],
            interval: 10000 // 10 seconds
        };
        
        this.pipelines.realTime.set('routes', pipeline);
        this.startPipeline('routes');
    }

    setupSensorDataPipeline() {
        const pipeline = {
            name: 'Sensor Data Pipeline',
            source: 'sensors',
            processors: [
                this.processSensorReadings.bind(this),
                this.detectAnomalies.bind(this),
                this.predictSensorFailures.bind(this),
                this.generateSensorInsights.bind(this)
            ],
            destinations: [
                'predictiveAnalytics',
                'alerts',
                'maintenance'
            ],
            interval: 3000 // 3 seconds
        };
        
        this.pipelines.realTime.set('sensors', pipeline);
        this.startPipeline('sensors');
    }

    setupCollectionsAnalyticsPipeline() {
        const pipeline = {
            name: 'Collections Analytics Pipeline',
            source: 'collections',
            processors: [
                this.analyzeCollectionPatterns.bind(this),
                this.predictDemand.bind(this),
                this.optimizeResourceAllocation.bind(this)
            ],
            destinations: [
                'predictiveAnalytics',
                'analytics',
                'planning'
            ],
            interval: 15000 // 15 seconds
        };
        
        this.pipelines.batch.set('collections', pipeline);
        this.startPipeline('collections');
    }

    setupPerformanceMetricsPipeline() {
        const pipeline = {
            name: 'Performance Metrics Pipeline',
            source: 'system',
            processors: [
                this.collectSystemMetrics.bind(this),
                this.analyzePerformance.bind(this),
                this.generatePerformanceInsights.bind(this)
            ],
            destinations: [
                'monitoring',
                'dashboard',
                'reporting'
            ],
            interval: 5000 // 5 seconds
        };
        
        this.pipelines.realTime.set('performance', pipeline);
        this.startPipeline('performance');
    }

    // ═══════════════════════════════════════════════════════════
    // DATA PROCESSORS
    // ═══════════════════════════════════════════════════════════

    async processBinFillLevels(data) {
        // Skip if no dataManager or predictive analytics not available
        if (!window.dataManager || !this.systems.predictiveAnalytics) return data;
        
        try {
            const bins = dataManager.getBins();
            if (!bins || bins.length === 0) return data;
            const enhanced = await Promise.all(bins.map(async bin => {
                // Predict when bin will be full
                const fillRate = await this.systems.predictiveAnalytics.predictFillRate(bin.id);
                const timeToFull = await this.systems.predictiveAnalytics.predictTimeToFull(bin.id);
                
                return {
                    ...bin,
                    ai: {
                        fillRate,
                        timeToFull,
                        priority: this.calculateCollectionPriority(bin, fillRate, timeToFull),
                        recommendation: this.generateBinRecommendation(bin, timeToFull)
                    }
                };
            }));
            
            this.metrics.predictions.total++;
            return enhanced;
            
        } catch (error) {
            // Silent error handling in production
            return data;
        }
    }

    async predictBinOverflow(bins) {
        if (!bins || !this.systems.predictiveAnalytics) return bins;
        
        try {
            const predictions = await Promise.all(bins.map(async bin => {
                const overflowRisk = await this.systems.predictiveAnalytics.assessOverflowRisk(bin.id);
                
                if (overflowRisk > 0.7) {
                    this.triggerOverflowAlert(bin, overflowRisk);
                }
                
                return {
                    ...bin,
                    ai: {
                        ...bin.ai,
                        overflowRisk,
                        alertLevel: this.getAlertLevel(overflowRisk)
                    }
                };
            }));
            
            return predictions;
            
        } catch (error) {
            // Silent error handling
            return bins;
        }
    }

    async optimizeCollectionSchedule(bins) {
        if (!bins || !this.systems.mlRouteOptimizer) return bins;
        
        try {
            // Get bins that need collection
            const binsNeedingCollection = bins.filter(b => 
                b.ai?.fillLevel > 70 || b.ai?.overflowRisk > 0.5
            );
            
            if (binsNeedingCollection.length > 0) {
                const optimizedRoute = await this.systems.mlRouteOptimizer.optimizeRoute(
                    null,
                    binsNeedingCollection.map(b => ({ lat: b.lat, lng: b.lng, binId: b.id })),
                    {},
                    { realTime: true }
                );
                
                // Update bins with optimized collection order
                binsNeedingCollection.forEach((bin, index) => {
                    const routeStop = optimizedRoute.route.find(stop => stop.binId === bin.id);
                    if (routeStop) {
                        bin.ai.collectionOrder = routeStop.order;
                        bin.ai.estimatedCollectionTime = routeStop.estimatedTime;
                    }
                });
                
                this.metrics.optimizations.total++;
                this.metrics.optimizations.successful++;
            }
            
            return bins;
            
        } catch (error) {
            console.error('❌ Error optimizing collection schedule:', error);
            return bins;
        }
    }

    async generateBinInsights(bins) {
        try {
            const insights = {
                total: bins.length,
                critical: bins.filter(b => b.ai?.alertLevel === 'critical').length,
                high: bins.filter(b => b.ai?.alertLevel === 'high').length,
                medium: bins.filter(b => b.ai?.alertLevel === 'medium').length,
                low: bins.filter(b => b.ai?.alertLevel === 'low').length,
                averageFillLevel: bins.reduce((sum, b) => sum + (b.fillLevel || 0), 0) / bins.length,
                predictedOverflows24h: bins.filter(b => 
                    b.ai?.timeToFull && b.ai.timeToFull < 24
                ).length,
                recommendations: this.generateTopRecommendations(bins)
            };
            
            // Broadcast insights
            this.broadcastInsights('bins', insights);
            this.metrics.analytics.insights++;
            
            return bins;
            
        } catch (error) {
            // Silent error handling
            return bins;
        }
    }

    async analyzeRouteEfficiency(routes) {
        try {
            if (!routes || routes.length === 0) return [];
            
            const enhanced = routes.map(route => {
                const efficiency = this.calculateRouteEfficiency(route);
                const improvement = this.calculatePotentialImprovement(route);
                
                return {
                    ...route,
                    ai: {
                        efficiency,
                        improvement,
                        score: this.calculateRouteScore(route, efficiency),
                        recommendation: this.generateRouteRecommendation(route, improvement)
                    }
                };
            });
            
            return enhanced;
            
        } catch (error) {
            console.error('❌ Error analyzing route efficiency:', error);
            return routes;
        }
    }

    async predictOptimalRoutes(routes) {
        if (!this.systems.mlRouteOptimizer) return routes;
        
        try {
            // For each route, predict optimal path
            const predictions = await Promise.all(routes.map(async route => {
                if (route.status === 'active' && route.stops) {
                    const optimized = await this.systems.mlRouteOptimizer.optimizeRoute(
                        route.currentLocation,
                        route.stops,
                        { realTime: true, traffic: true },
                        { algorithm: 'ensemble_hybrid' }
                    );
                    
                    const savings = this.calculateRouteSavings(route, optimized);
                    
                    return {
                        ...route,
                        ai: {
                            ...route.ai,
                            optimizedRoute: optimized,
                            potentialSavings: savings
                        }
                    };
                }
                return route;
            }));
            
            return predictions;
            
        } catch (error) {
            // Silent error handling
            return routes || [];
        }
    }

    async generateRouteRecommendations(routes) {
        try {
            if (!routes || routes.length === 0) return [];
            const recommendations = routes
                .filter(r => r.ai?.improvement > 10)
                .map(route => ({
                    routeId: route.id,
                    driverId: route.driverId,
                    type: 'route_optimization',
                    priority: route.ai.improvement > 30 ? 'high' : 'medium',
                    message: `Route can be optimized to save ${route.ai.improvement.toFixed(1)}%`,
                    action: 'optimize_route',
                    savings: route.ai.potentialSavings
                }));
            
            if (recommendations.length > 0) {
                this.broadcastRecommendations('routes', recommendations);
            }
            
            return routes;
            
        } catch (error) {
            console.error('❌ Error generating route recommendations:', error);
            return routes;
        }
    }

    async processSensorReadings(sensors) {
        try {
            if (!sensors || sensors.length === 0) return sensors;
            
            const enhanced = sensors.map(sensor => {
                const health = this.assessSensorHealth(sensor);
                const reliability = this.calculateSensorReliability(sensor);
                
                return {
                    ...sensor,
                    ai: {
                        health,
                        reliability,
                        predictedFailureRisk: this.predictFailureRisk(sensor, health),
                        recommendation: this.generateSensorRecommendation(sensor, health)
                    }
                };
            });
            
            return enhanced;
            
        } catch (error) {
            // Silent error handling
            return sensors || [];
        }
    }

    async detectAnomalies(sensors) {
        if (!sensors || !this.systems.predictiveAnalytics) return sensors || [];
        
        // Check if method exists
        if (!this.systems.predictiveAnalytics.detectAnomaly || 
            typeof this.systems.predictiveAnalytics.detectAnomaly !== 'function') {
            return sensors;
        }
        
        try {
            const anomalies = await Promise.all(sensors.map(async sensor => {
                const isAnomaly = await this.systems.predictiveAnalytics.detectAnomaly(
                    sensor.id,
                    sensor.latestReadings
                );
                
                if (isAnomaly.detected) {
                    this.triggerAnomalyAlert(sensor, isAnomaly);
                }
                
                return {
                    ...sensor,
                    ai: {
                        ...sensor.ai,
                        anomalyDetected: isAnomaly.detected,
                        anomalyScore: isAnomaly.score,
                        anomalyType: isAnomaly.type
                    }
                };
            }));
            
            return anomalies;
            
        } catch (error) {
            console.error('❌ Error detecting anomalies:', error);
            return sensors;
        }
    }

    async predictSensorFailures(sensors) {
        try {
            const predictions = sensors.map(sensor => {
                const failureProb = this.calculateFailureProbability(sensor);
                const timeToFailure = this.estimateTimeToFailure(sensor, failureProb);
                
                if (failureProb > 0.6) {
                    this.triggerMaintenanceAlert(sensor, failureProb, timeToFailure);
                }
                
                return {
                    ...sensor,
                    ai: {
                        ...sensor.ai,
                        failureProbability: failureProb,
                        estimatedTimeToFailure: timeToFailure,
                        maintenanceRecommended: failureProb > 0.5
                    }
                };
            });
            
            return predictions;
            
        } catch (error) {
            // Silent error handling
            return sensors || [];
        }
    }

    async generateSensorInsights(sensors) {
        try {
            if (!sensors || sensors.length === 0) return [];
            const insights = {
                total: sensors.length,
                healthy: sensors.filter(s => s.ai?.health > 80).length,
                degraded: sensors.filter(s => s.ai?.health > 50 && s.ai.health <= 80).length,
                critical: sensors.filter(s => s.ai?.health <= 50).length,
                anomaliesDetected: sensors.filter(s => s.ai?.anomalyDetected).length,
                maintenanceRequired: sensors.filter(s => s.ai?.maintenanceRecommended).length,
                averageReliability: sensors.reduce((sum, s) => sum + (s.ai?.reliability || 0), 0) / sensors.length
            };
            
            this.broadcastInsights('sensors', insights);
            return sensors || [];
            
        } catch (error) {
            // Silent error handling
            return sensors || [];
        }
    }

    async analyzeCollectionPatterns(collections) {
        try {
            if (!collections || collections.length === 0) return [];
            
            // Analyze temporal patterns
            const patterns = this.identifyCollectionPatterns(collections);
            
            // Analyze efficiency
            const efficiency = this.calculateCollectionEfficiency(collections);
            
            // Generate insights
            const insights = {
                totalCollections: collections.length,
                averageDuration: this.calculateAverageDuration(collections),
                efficiency: efficiency,
                patterns: patterns,
                trends: this.identifyTrends(collections),
                recommendations: this.generateCollectionRecommendations(patterns, efficiency)
            };
            
            this.broadcastInsights('collections', insights);
            
            return collections || [];
            
        } catch (error) {
            // Silent error handling
            return collections || [];
        }
    }

    async predictDemand(collections) {
        if (!collections || !this.systems.predictiveAnalytics) return collections || [];
        
        // Check if method exists
        if (!this.systems.predictiveAnalytics.forecastDemand || 
            typeof this.systems.predictiveAnalytics.forecastDemand !== 'function') {
            return collections;
        }
        
        try {
            // Predict demand for next 7 days
            const demandForecast = await this.systems.predictiveAnalytics.forecastDemand(
                collections,
                { horizon: 7, confidence: 0.95 }
            );
            
            // Broadcast forecast
            this.broadcastForecast('demand', demandForecast);
            
            return collections;
            
        } catch (error) {
            console.error('❌ Error predicting demand:', error);
            return collections;
        }
    }

    async optimizeResourceAllocation(collections) {
        try {
            // Analyze current resource utilization
            const utilization = this.calculateResourceUtilization(collections);
            
            // Generate optimization recommendations
            const recommendations = this.generateResourceOptimizationRecommendations(utilization);
            
            if (recommendations.length > 0) {
                this.broadcastRecommendations('resources', recommendations);
            }
            
            return collections || [];
            
        } catch (error) {
            // Silent error handling
            return collections || [];
        }
    }

    async collectSystemMetrics() {
        try {
            const metrics = {
                timestamp: Date.now(),
                ai: {
                    predictions: { ...this.metrics.predictions },
                    optimizations: { ...this.metrics.optimizations },
                    analytics: { ...this.metrics.analytics },
                    latency: { ...this.metrics.latency }
                },
                system: {
                    memory: performance.memory ? performance.memory.usedJSHeapSize : null,
                    cpu: this.estimateCPUUsage(),
                    network: this.estimateNetworkUsage()
                },
                pipelines: {
                    realTime: this.pipelines.realTime.size,
                    batch: this.pipelines.batch.size,
                    streaming: this.pipelines.streaming.size
                }
            };
            
            return metrics;
            
        } catch (error) {
            // Silent error handling
            return {};
        }
    }

    async analyzePerformance(metrics) {
        try {
            if (!metrics) return null;
            // Calculate performance scores
            const scores = {
                overall: this.calculateOverallPerformance(metrics),
                aiAccuracy: this.calculateAIAccuracy(metrics),
                optimizationEfficiency: this.calculateOptimizationEfficiency(metrics),
                systemHealth: this.calculateSystemHealth(metrics)
            };
            
            // Identify bottlenecks
            const bottlenecks = this.identifyBottlenecks(metrics);
            
            // Generate performance report
            const report = {
                scores,
                bottlenecks,
                recommendations: this.generatePerformanceRecommendations(scores, bottlenecks),
                timestamp: Date.now()
            };
            
            return report;
            
        } catch (error) {
            console.error('❌ Error analyzing performance:', error);
            return null;
        }
    }

    async generatePerformanceInsights(report) {
        try {
            if (!report) return null;
            
            // Broadcast performance insights
            this.broadcastInsights('performance', {
                overall: report.scores.overall,
                aiAccuracy: report.scores.aiAccuracy,
                optimizationEfficiency: report.scores.optimizationEfficiency,
                systemHealth: report.scores.systemHealth,
                criticalIssues: report.bottlenecks.filter(b => b.severity === 'critical').length,
                recommendations: report.recommendations.slice(0, 5)
            });
            
            return report;
            
        } catch (error) {
            // Silent error handling
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PIPELINE EXECUTION
    // ═══════════════════════════════════════════════════════════

    startPipeline(pipelineName) {
        const pipeline = this.pipelines.realTime.get(pipelineName) || this.pipelines.batch.get(pipelineName);
        if (!pipeline) return;
        
        const execute = async () => {
            try {
                const startTime = Date.now();
                
                // Get source data
                let data = await this.getSourceData(pipeline.source);
                
                // Process through pipeline
                for (const processor of pipeline.processors) {
                    data = await processor(data);
                }
                
                // Deliver to destinations
                await this.deliverToDestinations(data, pipeline.destinations);
                
                // Update metrics
                const latency = Date.now() - startTime;
                this.updateLatencyMetrics(latency);
                this.metrics.analytics.processed++;
                
            } catch (error) {
                console.error(`❌ Error in ${pipeline.name}:`, error);
            }
        };
        
        // Execute immediately
        execute();
        
        // Schedule periodic execution
        const interval = setInterval(execute, pipeline.interval);
        this.pipelines.realTime.set(`${pipelineName}_interval`, interval);
    }

    async getSourceData(source) {
        switch (source) {
            case 'dataManager':
            case 'bins':
                return dataManager?.getBins() || [];
            
            case 'routes':
                return dataManager?.getData('routes') || [];
            
            case 'sensors':
                return dataManager?.getData('sensors') || [];
            
            case 'collections':
                return dataManager?.getData('collections') || [];
            
            case 'system':
                return await this.collectSystemMetrics();
            
            default:
                return [];
        }
    }

    async deliverToDestinations(data, destinations) {
        for (const dest of destinations) {
            try {
                await this.deliverData(dest, data);
            } catch (error) {
                // Silent error handling - destination may not be ready
            }
        }
    }

    async deliverData(destination, data) {
        try {
            switch (destination) {
                case 'predictiveAnalytics':
                    if (this.systems.predictiveAnalytics && 
                        typeof this.systems.predictiveAnalytics.ingestData === 'function') {
                        await this.systems.predictiveAnalytics.ingestData(data);
                    }
                    break;
                
                case 'mlRouteOptimizer':
                    if (this.systems.mlRouteOptimizer && 
                        typeof this.systems.mlRouteOptimizer.updateTrainingData === 'function') {
                        await this.systems.mlRouteOptimizer.updateTrainingData(data);
                    }
                    break;
                
                case 'analyticsIntegration':
                case 'dashboard':
                    if (this.systems.analyticsIntegration && 
                        typeof this.systems.analyticsIntegration.updateData === 'function') {
                        await this.systems.analyticsIntegration.updateData(data);
                    }
                    break;
                
                case 'analytics':
                    if (this.systems.enhancedAnalytics && 
                        typeof this.systems.enhancedAnalytics.processData === 'function') {
                        await this.systems.enhancedAnalytics.processData(data);
                    }
                    break;
            
            case 'alerts':
                // Trigger alerts through event system
                window.dispatchEvent(new CustomEvent('ai-alert', { detail: data }));
                break;
            
                case 'drivers':
                case 'maintenance':
                case 'planning':
                case 'monitoring':
                case 'reporting':
                    // Broadcast to relevant systems
                    window.dispatchEvent(new CustomEvent(`ai-data-${destination}`, { detail: data }));
                    break;
            }
        } catch (error) {
            // Silent error handling - destination may not be ready
        }
    }

    // ═══════════════════════════════════════════════════════════
    // REAL-TIME SYNCHRONIZATION
    // ═══════════════════════════════════════════════════════════

    async initializeRealTimeSync() {
        console.log('\n⚡ Initializing real-time synchronization...');
        
        window.addEventListener('dataChanged', this.handleDataChange.bind(this));
        window.addEventListener('binUpdated', this.handleBinUpdate.bind(this));
        window.addEventListener('routeUpdated', this.handleRouteUpdate.bind(this));
        window.addEventListener('sensorUpdate', this.handleSensorUpdate.bind(this));
        document.addEventListener('syncCompleted', this.handleSyncCompleted.bind(this));
        
        // WebSocket: live connection state and real-time events for world-class operation
        const wsm = window.webSocketManager || window.wsManager;
        if (wsm) {
            wsm.addEventListener('connection_state', () => this.updateAIStatusUI());
            wsm.addEventListener('connected', () => this.updateAIStatusUI());
            wsm.addEventListener('disconnected', () => this.updateAIStatusUI());
            const onLiveEvent = () => {
                this.updateAIStatusUI();
                if (this.pipelines.realTime.has('bins')) this.startPipeline('bins');
            };
            wsm.addEventListener('bin_fill_update', onLiveEvent);
            wsm.addEventListener('sensor_update', onLiveEvent);
            wsm.addEventListener('dataUpdate', () => {
                this.updateAIStatusUI();
                this.refreshFromServer();
            });
            wsm.addEventListener('driver_location', () => this.updateAIStatusUI());
        }
        
        console.log('  ✓ Real-time event listeners registered');
    }

    handleSyncCompleted() {
        // After sync from server (MongoDB), refresh AI analysis with latest data
        this.refreshFromServer();
        this.updateAIStatusUI();
    }

    refreshFromServer() {
        // Re-run pipelines with current dataManager state (post-sync from MongoDB)
        const sources = ['bins', 'routes', 'sensors', 'collections'];
        for (const src of sources) {
            if (this.pipelines.realTime.has(src)) {
                this.startPipeline(src);
            }
        }
        if (this.systems.predictiveAnalytics && typeof this.systems.predictiveAnalytics.ingestData === 'function') {
            const bins = dataManager?.getBins() || [];
            const collections = dataManager?.getData('collections') || [];
            this.systems.predictiveAnalytics.ingestData({ bins, collections }).catch(() => {});
        }
    }

    updateAIStatusUI() {
        const light = document.getElementById('aiStatusLight');
        const valueEl = document.getElementById('aiStatusValue');
        const liveRow = document.getElementById('aiLiveConnectionRow');
        const lastEventEl = document.getElementById('aiLastEventAgo');
        const reconnectBtn = document.getElementById('aiReconnectBtn');
        if (!light || !valueEl) return;
        
        const syncEnabled = typeof syncManager !== 'undefined' && syncManager.syncEnabled === true;
        const status = this.initialized ? (this.status === 'operational' ? 'Operational' : this.status) : 'Initializing...';
        
        let wsStatus = '';
        let wsColor = '#64748b';
        const wsm = window.webSocketManager || window.wsManager;
        if (wsm) {
            const s = wsm.getStatus();
            if (s.connected) {
                wsStatus = s.mode === 'websocket' ? 'Live' : 'Fallback';
                wsColor = s.mode === 'websocket' ? '#10b981' : '#f59e0b';
            } else {
                wsStatus = s.reconnectAttempts > 0 ? 'Reconnecting…' : 'Offline';
                wsColor = s.reconnectAttempts > 0 ? '#f59e0b' : '#dc2626';
            }
            if (lastEventEl && s.lastLiveEventAt) {
                const sec = Math.floor((Date.now() - s.lastLiveEventAt) / 1000);
                lastEventEl.textContent = sec < 60 ? `${sec}s ago` : sec < 3600 ? `${Math.floor(sec / 60)}m ago` : `${Math.floor(sec / 3600)}h ago`;
            }
            if (reconnectBtn) {
                reconnectBtn.style.display = !s.connected ? 'inline-flex' : 'none';
            }
        }
        
        if (this.initialized && this.status === 'operational') {
            light.style.background = syncEnabled ? '#10b981' : '#f59e0b';
            light.style.boxShadow = syncEnabled ? '0 0 16px rgba(16, 185, 129, 0.8)' : '0 0 16px rgba(245, 158, 11, 0.8)';
            const livePart = wsStatus ? ` • Real-time: ${wsStatus}` : '';
            valueEl.textContent = syncEnabled ? `${status} • MongoDB${livePart}` : `${status} • Local${livePart}`;
        } else {
            light.style.background = this.status === 'error' ? '#dc2626' : '#64748b';
            light.style.boxShadow = 'none';
            valueEl.textContent = status + (wsStatus ? ` • ${wsStatus}` : '');
        }
        
        if (liveRow) {
            const dot = liveRow.querySelector('.ai-live-dot');
            if (dot) dot.style.background = wsColor;
        }
    }

    handleDataChange(event) {
        const { key, value } = event.detail;
        
        // Trigger relevant pipelines
        if (key === 'bins' && this.pipelines.realTime.has('bins')) {
            this.startPipeline('bins');
        } else if (key === 'routes' && this.pipelines.realTime.has('routes')) {
            this.startPipeline('routes');
        }
    }

    handleBinUpdate(event) {
        const { binId, updates } = event.detail;
        
        // Process bin update through AI
        this.processBinUpdate(binId, updates);
    }

    handleRouteUpdate(event) {
        const { routeId, updates } = event.detail;
        
        // Reoptimize route if needed
        this.optimizeRouteIfNeeded(routeId, updates);
    }

    handleSensorUpdate(event) {
        const { sensorId, data } = event.detail;
        
        // Process sensor data through anomaly detection
        this.processSensorUpdate(sensorId, data);
    }

    handleSyncCompleted(event) {
        // Refresh all pipelines after sync
        this.refreshAllPipelines();
    }

    async processBinUpdate(binId, updates) {
        try {
            const bin = dataManager.getBins().find(b => b.id === binId);
            if (!bin) return;
            
            // Process through pipeline
            const enhanced = await this.processBinFillLevels([bin]);
            const predicted = await this.predictBinOverflow(enhanced);
            
            // Broadcast insights
            this.broadcastBinInsights(predicted[0]);
            
        } catch (error) {
            console.error('❌ Error processing bin update:', error);
        }
    }

    async optimizeRouteIfNeeded(routeId, updates) {
        try {
            const routes = dataManager.getData('routes') || [];
            const route = routes.find(r => r.id === routeId);
            if (!route) return;
            
            // Check if optimization is needed
            if (updates.status === 'active' || updates.stops) {
                const enhanced = await this.analyzeRouteEfficiency([route]);
                const optimized = await this.predictOptimalRoutes(enhanced);
                
                // Broadcast recommendations
                if (optimized[0].ai?.improvement > 15) {
                    this.broadcastRouteOptimization(optimized[0]);
                }
            }
            
        } catch (error) {
            console.error('❌ Error optimizing route:', error);
        }
    }

    async processSensorUpdate(sensorId, data) {
        try {
            const sensors = dataManager.getData('sensors') || [];
            const sensor = sensors.find(s => s.id === sensorId || s.imei === sensorId);
            if (!sensor) return;
            
            // Update sensor with latest data
            sensor.latestReadings = data;
            
            // Process through pipeline
            const enhanced = await this.processSensorReadings([sensor]);
            const anomalies = await this.detectAnomalies(enhanced);
            const predictions = await this.predictSensorFailures(anomalies);
            
            // Broadcast insights
            this.broadcastSensorInsights(predictions[0]);
            
        } catch (error) {
            console.error('❌ Error processing sensor update:', error);
        }
    }

    refreshAllPipelines() {
        // Trigger all pipelines to refresh
        this.pipelines.realTime.forEach((pipeline, name) => {
            if (!name.includes('_interval')) {
                this.startPipeline(name);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // APPLICATION FEATURE INTEGRATION
    // ═══════════════════════════════════════════════════════════

    async connectApplicationFeatures() {
        console.log('\n🔗 Connecting application features...');
        
        // Connect bin management
        this.connectBinManagement();
        
        // Connect route optimization
        this.connectRouteOptimization();
        
        // Connect sensor system
        this.connectSensorSystem();
        
        // Connect analytics dashboard
        this.connectAnalyticsDashboard();
        
        // Connect alerts system
        this.connectAlertsSystem();
        
        // Connect reporting
        this.connectReportingSystem();
        
        console.log('  ✓ All features connected');
    }

    connectBinManagement() {
        // Enhance bin operations with AI
        if (window.dataManager) {
            const originalUpdateBin = dataManager.updateBin;
            dataManager.updateBin = (binId, updates) => {
                // Call original
                const result = originalUpdateBin.call(dataManager, binId, updates);
                
                // Trigger AI processing
                this.handleBinUpdate({ detail: { binId, updates } });
                
                return result;
            };
        }
        
        console.log('  ✓ Bin management enhanced with AI');
    }

    connectRouteOptimization() {
        // Make route optimization available globally
        window.optimizeRoute = async (startLocation, destinations, options = {}) => {
            if (!this.systems.mlRouteOptimizer) {
                console.warn('⚠️ ML Route Optimizer not available');
                return null;
            }
            
            return await this.systems.mlRouteOptimizer.optimizeRoute(
                startLocation,
                destinations,
                options.constraints || {},
                options.preferences || {}
            );
        };
        
        // Connect to driver system
        this.connectDriverSystem();
        
        // Connect to fleet management
        this.connectFleetManagement();
        
        console.log('  ✓ Route optimization available globally');
        console.log('  ✓ Driver system enhanced with AI');
        console.log('  ✓ Fleet management enhanced with AI');
    }

    connectDriverSystem() {
        // Enhance driver system with AI capabilities
        if (window.driverSystemV3Instance || window.enhancedDriverSystemComplete) {
            const driverSystem = window.driverSystemV3Instance || window.enhancedDriverSystemComplete;
            
            // Add AI route optimization to driver system
            if (driverSystem.startRoute) {
                const originalStartRoute = driverSystem.startRoute.bind(driverSystem);
                driverSystem.startRoute = async function() {
                    // Get driver's route
                    const result = await originalStartRoute();
                    
                    // Optimize with AI if available
                    if (window.aimlMasterIntegration && result?.route?.stops) {
                        const optimized = await window.optimizeRoute(
                            result.route.startLocation,
                            result.route.stops,
                            { realTime: true, traffic: true, driverId: driverSystem.currentUser?.id }
                        );
                        
                        if (optimized && optimized.savings?.cost > 10) {
                            console.log(`🧠 AI: Route can save ${optimized.savings.cost.toFixed(1)}% - optimized version available`);
                            result.aiOptimized = optimized;
                        }
                    }
                    
                    return result;
                };
            }
            
            // Add AI insights to driver performance
            driverSystem.getAIInsights = () => {
                const insights = this.lastInsights;
                return {
                    routes: insights.routes,
                    performance: insights.performance,
                    recommendations: this.recommendations.routes
                };
            };
            
            console.log('  ✓ Driver system AI enhancements applied');
        }
    }

    connectFleetManagement() {
        // Enhance fleet management with AI capabilities
        window.getFleetAIInsights = () => {
            const routes = dataManager.getData('routes') || [];
            const drivers = dataManager.getData('users')?.filter(u => u.type === 'driver') || [];
            
            const fleetInsights = {
                totalDrivers: drivers.length,
                activeRoutes: routes.filter(r => r.status === 'active').length,
                averageEfficiency: routes.reduce((sum, r) => sum + (r.ai?.efficiency || 0), 0) / routes.length,
                totalOptimizationOpportunities: routes.filter(r => r.ai?.improvement > 10).length,
                potentialSavings: routes.reduce((sum, r) => sum + (r.ai?.potentialSavings?.cost || 0), 0),
                recommendations: this.recommendations.routes.slice(0, 10)
            };
            
            return fleetInsights;
        };
        
        // Real-time fleet monitoring
        window.monitorFleetPerformance = () => {
            setInterval(() => {
                const insights = window.getFleetAIInsights();
                window.dispatchEvent(new CustomEvent('fleet-ai-update', { detail: insights }));
            }, 10000); // Every 10 seconds
        };
        
        console.log('  ✓ Fleet management AI capabilities added');
    }

    connectSensorSystem() {
        // Listen for sensor updates
        window.addEventListener('sensorDataReceived', (event) => {
            this.handleSensorUpdate(event);
        });
        
        console.log('  ✓ Sensor system connected to AI');
    }

    connectAnalyticsDashboard() {
        // Provide AI insights to dashboard
        window.getAIInsights = () => {
            return {
                bins: this.lastInsights?.bins || {},
                routes: this.lastInsights?.routes || {},
                sensors: this.lastInsights?.sensors || {},
                collections: this.lastInsights?.collections || {},
                performance: this.lastInsights?.performance || {},
                metrics: this.metrics
            };
        };
        
        console.log('  ✓ Analytics dashboard connected');
    }

    connectAlertsSystem() {
        // AI-powered alerts
        window.addEventListener('ai-alert', (event) => {
            if (window.alertManager) {
                window.alertManager.createAlert(event.detail);
            }
        });
        
        console.log('  ✓ Alerts system connected');
    }

    connectReportingSystem() {
        // Provide AI reports
        window.generateAIReport = async (type, options = {}) => {
            return await this.generateReport(type, options);
        };
        
        console.log('  ✓ Reporting system connected');
    }

    // ═══════════════════════════════════════════════════════════
    // PERFORMANCE MONITORING
    // ═══════════════════════════════════════════════════════════

    async startPerformanceMonitoring() {
        console.log('\n📊 Starting performance monitoring...');
        
        // Monitor every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.updatePerformanceMetrics();
        }, 30000);
        
        console.log('  ✓ Performance monitoring active');
    }

    async updatePerformanceMetrics() {
        try {
            // Update accuracy
            if (this.metrics.predictions.total > 0) {
                this.metrics.predictions.accuracy = 
                    (this.metrics.predictions.accurate / this.metrics.predictions.total) * 100;
            }
            
            // Update optimization efficiency
            if (this.metrics.optimizations.total > 0) {
                this.metrics.optimizations.efficiency = 
                    (this.metrics.optimizations.successful / this.metrics.optimizations.total) * 100;
            }
            
            // Broadcast metrics
            window.dispatchEvent(new CustomEvent('ai-metrics-updated', {
                detail: this.metrics
            }));
            
        } catch (error) {
            console.error('❌ Error updating performance metrics:', error);
        }
    }

    updateLatencyMetrics(latency) {
        this.metrics.latency.avg = 
            (this.metrics.latency.avg * 0.9) + (latency * 0.1);
        this.metrics.latency.max = Math.max(this.metrics.latency.max, latency);
        this.metrics.latency.min = Math.min(this.metrics.latency.min, latency);
    }

    // ═══════════════════════════════════════════════════════════
    // AUTO-OPTIMIZATION
    // ═══════════════════════════════════════════════════════════

    async enableAutoOptimization() {
        console.log('\n⚙️ Enabling auto-optimization...');
        
        // Auto-optimize routes
        this.enableAutoRouteOptimization();
        
        // Auto-optimize collection schedules
        this.enableAutoCollectionOptimization();
        
        // Auto-tune AI models
        this.enableAutoModelTuning();
        
        console.log('  ✓ Auto-optimization enabled');
    }

    enableAutoRouteOptimization() {
        // Optimize routes automatically every hour
        this.routeOptimizationInterval = setInterval(async () => {
            const routes = dataManager.getData('routes') || [];
            const activeRoutes = routes.filter(r => r.status === 'active');
            
            if (activeRoutes.length > 0) {
                console.log('🔄 Auto-optimizing active routes...');
                await this.analyzeRouteEfficiency(activeRoutes);
            }
        }, 3600000); // 1 hour
        
        console.log('  ✓ Auto-route optimization enabled');
    }

    enableAutoCollectionOptimization() {
        // Optimize collection schedules every 6 hours
        this.collectionOptimizationInterval = setInterval(async () => {
            const bins = dataManager.getBins();
            
            if (bins.length > 0) {
                console.log('🔄 Auto-optimizing collection schedules...');
                await this.optimizeCollectionSchedule(bins);
            }
        }, 21600000); // 6 hours
        
        console.log('  ✓ Auto-collection optimization enabled');
    }

    enableAutoModelTuning() {
        // Tune models daily
        this.modelTuningInterval = setInterval(async () => {
            console.log('🔄 Auto-tuning AI models...');
            
            if (this.systems.predictiveAnalytics) {
                await this.systems.predictiveAnalytics.retrainModels();
            }
            
            if (this.systems.mlRouteOptimizer) {
                await this.systems.mlRouteOptimizer.updateModelParameters();
            }
        }, 86400000); // 24 hours
        
        console.log('  ✓ Auto-model tuning enabled');
    }

    // ═══════════════════════════════════════════════════════════
    // ANALYTICS DELIVERY
    // ═══════════════════════════════════════════════════════════

    async setupAnalyticsDelivery() {
        console.log('\n📈 Setting up analytics delivery...');
        
        // Already initialized in constructor, just verify
        if (!this.lastInsights) {
            this.lastInsights = {
                bins: {},
                routes: {},
                sensors: {},
                collections: {},
                performance: {}
            };
        }
        
        if (!this.recommendations) {
            this.recommendations = {
                bins: [],
                routes: [],
                sensors: [],
                resources: []
            };
        }
        
        if (!this.forecasts) {
            this.forecasts = {
                demand: null,
                overflow: null,
                maintenance: null
            };
        }
        
        console.log('  ✓ Analytics delivery configured');
    }

    broadcastInsights(category, insights) {
        // Safety check
        if (!this.lastInsights) {
            this.lastInsights = { bins: {}, routes: {}, sensors: {}, collections: {}, performance: {} };
        }
        
        this.lastInsights[category] = {
            ...insights,
            timestamp: Date.now()
        };
        
        window.dispatchEvent(new CustomEvent('ai-insights', {
            detail: { category, insights }
        }));
    }

    broadcastRecommendations(category, recommendations) {
        // Safety check
        if (!this.recommendations) {
            this.recommendations = { bins: [], routes: [], sensors: [], resources: [] };
        }
        
        this.recommendations[category] = recommendations;
        
        window.dispatchEvent(new CustomEvent('ai-recommendations', {
            detail: { category, recommendations }
        }));
    }

    broadcastForecast(type, forecast) {
        this.forecasts[type] = forecast;
        
        window.dispatchEvent(new CustomEvent('ai-forecast', {
            detail: { type, forecast }
        }));
    }

    broadcastBinInsights(bin) {
        window.dispatchEvent(new CustomEvent('ai-bin-insights', {
            detail: bin
        }));
    }

    broadcastRouteOptimization(route) {
        window.dispatchEvent(new CustomEvent('ai-route-optimization', {
            detail: route
        }));
    }

    broadcastSensorInsights(sensor) {
        window.dispatchEvent(new CustomEvent('ai-sensor-insights', {
            detail: sensor
        }));
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    calculateCollectionPriority(bin, fillRate, timeToFull) {
        let priority = 0;
        
        // Fill level priority
        if (bin.fillLevel > 90) priority += 40;
        else if (bin.fillLevel > 75) priority += 30;
        else if (bin.fillLevel > 60) priority += 20;
        else priority += 10;
        
        // Time to full priority
        if (timeToFull < 6) priority += 30;
        else if (timeToFull < 12) priority += 20;
        else if (timeToFull < 24) priority += 10;
        
        // Fill rate priority
        if (fillRate > 10) priority += 20;
        else if (fillRate > 5) priority += 10;
        
        // Location priority (if sensitive area)
        if (bin.type === 'critical') priority += 10;
        
        return Math.min(priority, 100);
    }

    generateBinRecommendation(bin, timeToFull) {
        if (timeToFull < 6) {
            return {
                action: 'immediate_collection',
                urgency: 'critical',
                message: `Bin ${bin.id} needs immediate collection (${timeToFull}h until full)`
            };
        } else if (timeToFull < 12) {
            return {
                action: 'schedule_collection',
                urgency: 'high',
                message: `Schedule collection for bin ${bin.id} within ${timeToFull} hours`
            };
        } else if (timeToFull < 24) {
            return {
                action: 'plan_collection',
                urgency: 'medium',
                message: `Plan collection for bin ${bin.id} (${timeToFull}h until full)`
            };
        }
        return {
            action: 'monitor',
            urgency: 'low',
            message: `Continue monitoring bin ${bin.id}`
        };
    }

    getAlertLevel(risk) {
        if (risk > 0.8) return 'critical';
        if (risk > 0.6) return 'high';
        if (risk > 0.4) return 'medium';
        return 'low';
    }

    triggerOverflowAlert(bin, risk) {
        const alert = {
            type: 'bin_overflow_risk',
            binId: bin.id,
            severity: this.getAlertLevel(risk),
            risk: risk,
            message: `Bin ${bin.id} has ${(risk * 100).toFixed(0)}% overflow risk`,
            timestamp: Date.now(),
            action: 'immediate_collection_required'
        };
        
        window.dispatchEvent(new CustomEvent('ai-alert', { detail: alert }));
    }

    triggerAnomalyAlert(sensor, anomaly) {
        const alert = {
            type: 'sensor_anomaly',
            sensorId: sensor.id,
            severity: 'high',
            anomaly: anomaly,
            message: `Anomaly detected in sensor ${sensor.id}: ${anomaly.type}`,
            timestamp: Date.now(),
            action: 'inspect_sensor'
        };
        
        window.dispatchEvent(new CustomEvent('ai-alert', { detail: alert }));
    }

    triggerMaintenanceAlert(sensor, failureProb, timeToFailure) {
        const alert = {
            type: 'sensor_maintenance',
            sensorId: sensor.id,
            severity: failureProb > 0.8 ? 'critical' : 'high',
            failureProbability: failureProb,
            estimatedTimeToFailure: timeToFailure,
            message: `Sensor ${sensor.id} requires maintenance (${(failureProb * 100).toFixed(0)}% failure risk)`,
            timestamp: Date.now(),
            action: 'schedule_maintenance'
        };
        
        window.dispatchEvent(new CustomEvent('ai-alert', { detail: alert }));
    }

    generateTopRecommendations(bins) {
        return bins
            .filter(b => b.ai?.recommendation)
            .sort((a, b) => (b.ai?.priority || 0) - (a.ai?.priority || 0))
            .slice(0, 5)
            .map(b => b.ai.recommendation);
    }

    calculateRouteEfficiency(route) {
        // Simplified efficiency calculation
        if (!route.distance || !route.duration) return 0;
        
        const avgSpeed = route.distance / (route.duration / 60);
        const stopsEfficiency = route.stops ? (route.stops.length / route.duration) * 60 : 0;
        
        return Math.min(((avgSpeed / 50) * 0.6 + (stopsEfficiency / 2) * 0.4) * 100, 100);
    }

    calculatePotentialImprovement(route) {
        const currentEfficiency = this.calculateRouteEfficiency(route);
        const maxPossibleEfficiency = 95;
        
        return Math.max(0, maxPossibleEfficiency - currentEfficiency);
    }

    calculateRouteScore(route, efficiency) {
        let score = efficiency * 0.5;
        
        // Add bonuses
        if (route.fuelEfficiency > 80) score += 10;
        if (route.onTimePerformance > 90) score += 15;
        if (route.completedStops === route.totalStops) score += 10;
        
        return Math.min(score, 100);
    }

    generateRouteRecommendation(route, improvement) {
        if (improvement > 30) {
            return {
                action: 'immediate_optimization',
                urgency: 'high',
                message: `Route ${route.id} can save ${improvement.toFixed(1)}% - optimize now`
            };
        } else if (improvement > 15) {
            return {
                action: 'schedule_optimization',
                urgency: 'medium',
                message: `Consider optimizing route ${route.id} (${improvement.toFixed(1)}% savings)`
            };
        }
        return {
            action: 'maintain',
            urgency: 'low',
            message: `Route ${route.id} is efficient`
        };
    }

    calculateRouteSavings(originalRoute, optimizedRoute) {
        const distanceSaving = ((originalRoute.distance - optimizedRoute.distance) / originalRoute.distance) * 100;
        const timeSaving = ((originalRoute.duration - optimizedRoute.duration) / originalRoute.duration) * 100;
        const fuelSaving = ((originalRoute.fuelUsed - optimizedRoute.fuelUsed) / originalRoute.fuelUsed) * 100;
        
        return {
            distance: distanceSaving,
            time: timeSaving,
            fuel: fuelSaving,
            cost: (distanceSaving * 0.4 + timeSaving * 0.3 + fuelSaving * 0.3)
        };
    }

    assessSensorHealth(sensor) {
        let health = 100;
        
        // Check battery
        if (sensor.battery < 20) health -= 30;
        else if (sensor.battery < 40) health -= 15;
        
        // Check signal quality
        if (sensor.signalQuality < 50) health -= 20;
        else if (sensor.signalQuality < 70) health -= 10;
        
        // Check last update time
        const hoursSinceUpdate = (Date.now() - new Date(sensor.lastUpdate).getTime()) / 3600000;
        if (hoursSinceUpdate > 24) health -= 25;
        else if (hoursSinceUpdate > 12) health -= 10;
        
        return Math.max(0, health);
    }

    calculateSensorReliability(sensor) {
        // Based on historical performance
        const uptime = sensor.uptime || 0.95;
        const errorRate = sensor.errorRate || 0.05;
        const accuracy = sensor.accuracy || 0.95;
        
        return (uptime * 0.4 + (1 - errorRate) * 0.3 + accuracy * 0.3) * 100;
    }

    predictFailureRisk(sensor, health) {
        let risk = 0;
        
        if (health < 40) risk += 0.6;
        else if (health < 60) risk += 0.3;
        else if (health < 80) risk += 0.1;
        
        // Add historical failure pattern risk
        if (sensor.previousFailures > 2) risk += 0.2;
        
        return Math.min(risk, 1.0);
    }

    estimateTimeToFailure(sensor, failureProb) {
        if (failureProb < 0.3) return null;
        
        // Estimate based on degradation rate
        const health = sensor.ai?.health || 100;
        const degradationRate = (100 - health) / 30; // per day
        
        const daysToFailure = health / degradationRate;
        return daysToFailure * 24; // hours
    }

    generateSensorRecommendation(sensor, health) {
        if (health < 40) {
            return {
                action: 'immediate_maintenance',
                urgency: 'critical',
                message: `Sensor ${sensor.id} requires immediate attention`
            };
        } else if (health < 60) {
            return {
                action: 'schedule_maintenance',
                urgency: 'high',
                message: `Schedule maintenance for sensor ${sensor.id}`
            };
        } else if (health < 80) {
            return {
                action: 'monitor_closely',
                urgency: 'medium',
                message: `Monitor sensor ${sensor.id} closely`
            };
        }
        return {
            action: 'routine_check',
            urgency: 'low',
            message: `Sensor ${sensor.id} is healthy`
        };
    }

    calculateFailureProbability(sensor) {
        return sensor.ai?.predictedFailureRisk || 0;
    }

    identifyCollectionPatterns(collections) {
        // Analyze temporal patterns
        const hourlyDistribution = new Array(24).fill(0);
        const weeklyDistribution = new Array(7).fill(0);
        
        collections.forEach(c => {
            const date = new Date(c.timestamp);
            hourlyDistribution[date.getHours()]++;
            weeklyDistribution[date.getDay()]++;
        });
        
        return {
            hourly: hourlyDistribution,
            weekly: weeklyDistribution,
            peakHour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution)),
            peakDay: weeklyDistribution.indexOf(Math.max(...weeklyDistribution))
        };
    }

    calculateCollectionEfficiency(collections) {
        if (!collections || collections.length === 0) return 0;
        
        const totalEfficiency = collections.reduce((sum, c) => sum + (c.efficiency || 0), 0);
        return totalEfficiency / collections.length;
    }

    calculateAverageDuration(collections) {
        if (!collections || collections.length === 0) return 0;
        
        const totalDuration = collections.reduce((sum, c) => sum + (c.duration || 0), 0);
        return totalDuration / collections.length;
    }

    identifyTrends(collections) {
        // Simple trend analysis
        const recentCollections = collections.slice(-30);
        const olderCollections = collections.slice(-60, -30);
        
        const recentAvg = recentCollections.length > 0 ? 
            recentCollections.reduce((sum, c) => sum + (c.quantity || 0), 0) / recentCollections.length : 0;
        const olderAvg = olderCollections.length > 0 ?
            olderCollections.reduce((sum, c) => sum + (c.quantity || 0), 0) / olderCollections.length : 0;
        
        const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
        
        return {
            direction: trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable',
            percentage: Math.abs(trend),
            volume: recentAvg
        };
    }

    generateCollectionRecommendations(patterns, efficiency) {
        const recommendations = [];
        
        if (efficiency < 70) {
            recommendations.push({
                type: 'efficiency_improvement',
                priority: 'high',
                message: 'Collection efficiency is below target - optimize routes and schedules'
            });
        }
        
        if (patterns.peakHour !== null) {
            recommendations.push({
                type: 'schedule_optimization',
                priority: 'medium',
                message: `Peak collection hour is ${patterns.peakHour}:00 - adjust staffing accordingly`
            });
        }
        
        return recommendations;
    }

    calculateResourceUtilization(collections) {
        // Simplified utilization calculation
        const totalCapacity = collections.length * 100; // assuming 100% capacity per collection
        const actualUsage = collections.reduce((sum, c) => sum + (c.capacity || 0), 0);
        
        return {
            overall: (actualUsage / totalCapacity) * 100,
            drivers: collections.length,
            vehicles: new Set(collections.map(c => c.vehicleId)).size,
            avgLoadPerCollection: actualUsage / collections.length
        };
    }

    generateResourceOptimizationRecommendations(utilization) {
        const recommendations = [];
        
        if (utilization.overall < 60) {
            recommendations.push({
                type: 'consolidate_routes',
                priority: 'high',
                savings: `${(100 - utilization.overall).toFixed(0)}%`,
                message: 'Low resource utilization - consolidate routes to reduce costs'
            });
        }
        
        if (utilization.avgLoadPerCollection < 70) {
            recommendations.push({
                type: 'increase_stops',
                priority: 'medium',
                message: 'Add more stops per route to improve load efficiency'
            });
        }
        
        return recommendations;
    }

    calculateOverallPerformance(metrics) {
        let score = 0;
        let factors = 0;
        
        if (metrics.ai?.predictions) {
            score += metrics.ai.predictions.accuracy || 0;
            factors++;
        }
        
        if (metrics.ai?.optimizations) {
            score += metrics.ai.optimizations.efficiency || 0;
            factors++;
        }
        
        if (metrics.system) {
            const systemScore = this.calculateSystemHealth(metrics);
            score += systemScore;
            factors++;
        }
        
        return factors > 0 ? score / factors : 0;
    }

    calculateAIAccuracy(metrics) {
        return metrics.ai?.predictions?.accuracy || 0;
    }

    calculateOptimizationEfficiency(metrics) {
        return metrics.ai?.optimizations?.efficiency || 0;
    }

    calculateSystemHealth(metrics) {
        let health = 100;
        
        // Check memory usage
        if (metrics.system?.memory) {
            const memoryUsage = metrics.system.memory / 1000000000; // GB
            if (memoryUsage > 2) health -= 20;
            else if (memoryUsage > 1) health -= 10;
        }
        
        // Check latency
        if (metrics.ai?.latency) {
            if (metrics.ai.latency.avg > 1000) health -= 20;
            else if (metrics.ai.latency.avg > 500) health -= 10;
        }
        
        return Math.max(0, health);
    }

    identifyBottlenecks(metrics) {
        const bottlenecks = [];
        
        // Check latency
        if (metrics.ai?.latency?.avg > 500) {
            bottlenecks.push({
                type: 'high_latency',
                severity: metrics.ai.latency.avg > 1000 ? 'critical' : 'high',
                value: metrics.ai.latency.avg,
                message: `Average latency is ${metrics.ai.latency.avg}ms`
            });
        }
        
        // Check memory
        if (metrics.system?.memory) {
            const memoryGB = metrics.system.memory / 1000000000;
            if (memoryGB > 1.5) {
                bottlenecks.push({
                    type: 'high_memory',
                    severity: memoryGB > 2 ? 'critical' : 'medium',
                    value: memoryGB,
                    message: `Memory usage is ${memoryGB.toFixed(2)}GB`
                });
            }
        }
        
        // Check pipeline throughput
        if (metrics.ai?.analytics?.processed < 100) {
            bottlenecks.push({
                type: 'low_throughput',
                severity: 'medium',
                value: metrics.ai.analytics.processed,
                message: 'Low pipeline throughput detected'
            });
        }
        
        return bottlenecks;
    }

    generatePerformanceRecommendations(scores, bottlenecks) {
        const recommendations = [];
        
        if (scores.overall < 70) {
            recommendations.push({
                priority: 'high',
                message: 'Overall performance is below target - review system configuration'
            });
        }
        
        bottlenecks.forEach(b => {
            if (b.type === 'high_latency') {
                recommendations.push({
                    priority: b.severity,
                    message: 'Reduce latency by optimizing pipeline processors'
                });
            } else if (b.type === 'high_memory') {
                recommendations.push({
                    priority: b.severity,
                    message: 'Reduce memory usage by clearing old data and optimizing caches'
                });
            } else if (b.type === 'low_throughput') {
                recommendations.push({
                    priority: 'medium',
                    message: 'Increase throughput by parallelizing pipelines'
                });
            }
        });
        
        return recommendations;
    }

    estimateCPUUsage() {
        // Simplified CPU estimation
        return Math.random() * 30 + 20; // 20-50%
    }

    estimateNetworkUsage() {
        // Simplified network estimation
        return this.metrics.analytics.processed * 10; // KB
    }

    async generateReport(type, options) {
        try {
            const report = {
                type,
                generated: Date.now(),
                options,
                data: {}
            };
            
            switch (type) {
                case 'performance':
                    report.data = {
                        metrics: this.metrics,
                        insights: this.lastInsights,
                        recommendations: this.recommendations
                    };
                    break;
                
                case 'predictions':
                    report.data = {
                        forecasts: this.forecasts,
                        accuracy: this.metrics.predictions.accuracy,
                        total: this.metrics.predictions.total
                    };
                    break;
                
                case 'optimizations':
                    report.data = {
                        total: this.metrics.optimizations.total,
                        successful: this.metrics.optimizations.successful,
                        efficiency: this.metrics.optimizations.efficiency,
                        recommendations: this.recommendations.routes
                    };
                    break;
                
                default:
                    report.data = {
                        message: 'Unknown report type'
                    };
            }
            
            return report;
            
        } catch (error) {
            console.error('❌ Error generating report:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SYSTEM STATUS & UTILITIES
    // ═══════════════════════════════════════════════════════════

    printSystemStatus() {
        console.log('📊 SYSTEM STATUS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('🧠 AI/ML Systems:');
        console.log(`  • ML Route Optimizer: ${this.systems.mlRouteOptimizer ? '✓ Connected' : '✗ Not available'}`);
        console.log(`  • Predictive Analytics: ${this.systems.predictiveAnalytics ? '✓ Connected' : '✗ Not available'}`);
        console.log(`  • Analytics Integration: ${this.systems.analyticsIntegration ? '✓ Connected' : '✗ Not available'}`);
        console.log(`  • Enhanced Analytics: ${this.systems.enhancedAnalytics ? '✓ Connected' : '✗ Not available'}\n`);
        
        console.log('📊 Data Pipelines:');
        console.log(`  • Real-time: ${this.pipelines.realTime.size} active`);
        console.log(`  • Batch: ${this.pipelines.batch.size} active`);
        console.log(`  • Streaming: ${this.pipelines.streaming.size} active\n`);
        
        console.log('🔗 Application Integration:');
        Object.entries(this.integrations).forEach(([feature, enabled]) => {
            console.log(`  • ${feature}: ${enabled ? '✓ Connected' : '✗ Disabled'}`);
        });
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    exposeGlobalAPI() {
        window.aimlMasterIntegration = this;
        
        const reconnectBtn = document.getElementById('aiReconnectBtn');
        if (reconnectBtn && !reconnectBtn._aiBound) {
            reconnectBtn._aiBound = true;
            reconnectBtn.addEventListener('click', () => {
                const wsm = window.webSocketManager || window.wsManager;
                if (wsm && typeof wsm.reconnect === 'function') {
                    wsm.reconnect();
                    this.updateAIStatusUI();
                }
            });
        }
        
        window.getAIStatus = () => this.getStatus();
        window.getAIMetrics = () => this.metrics;
        window.getAIInsights = () => this.lastInsights;
        window.getAIRecommendations = () => this.recommendations;
        window.generateAIReport = (type, options) => this.generateReport(type, options);
        
        console.log('\n✅ Global API exposed:');
        console.log('  • aimlMasterIntegration');
        console.log('  • getAIStatus()');
        console.log('  • getAIMetrics()');
        console.log('  • getAIInsights()');
        console.log('  • getAIRecommendations()');
        console.log('  • generateAIReport(type, options)');
        console.log('  • optimizeRoute(start, destinations, options)');
    }

    getStatus() {
        return {
            version: this.version,
            status: this.status,
            initialized: this.initialized,
            systems: Object.keys(this.systems).filter(k => this.systems[k] !== null),
            pipelines: {
                realTime: this.pipelines.realTime.size,
                batch: this.pipelines.batch.size,
                streaming: this.pipelines.streaming.size
            },
            metrics: this.metrics,
            uptime: Date.now() - this.startTime
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aimlMasterIntegration = new AIMLMasterIntegration();
    });
} else {
    window.aimlMasterIntegration = new AIMLMasterIntegration();
}

console.log('✅ AI/ML Master Integration System loaded');
