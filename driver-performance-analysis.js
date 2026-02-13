// 📊 Driver Performance Analysis - World-Class Implementation
// Integrates with AI systems for comprehensive driver performance analytics

class DriverPerformanceAnalysis {
    constructor() {
        this.currentDriverId = null;
        this.performanceData = {};
        this.aiInsights = [];
        
        console.log('📊 Driver Performance Analysis initialized');
    }
    
    // Main function to populate driver performance analysis
    async populateDriverPerformanceAnalysis(driverId) {
        try {
            this.currentDriverId = driverId;
            console.log(`📊 Loading performance analysis for driver: ${driverId}`);
            
            // Fetch comprehensive performance data from multiple AI systems
            const performanceData = await this.fetchComprehensivePerformanceData(driverId);
            
            // Update performance metrics cards
            this.updatePerformanceMetrics(performanceData);
            
            // Update AI insights
            this.updateAIInsights(performanceData);
            
            // Update benchmarking
            this.updateBenchmarking(performanceData);
            
            // Performance Trends (Last 7 Days) chart - real data, same driver
            if (typeof window.createDriverPerformanceTrendChart === 'function') {
                try {
                    window.createDriverPerformanceTrendChart(driverId);
                } catch (e) {
                    console.warn('Performance trend chart:', e.message);
                }
            }
            
            console.log('✅ Driver performance analysis loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading driver performance analysis:', error);
            this.showFallbackData();
        }
    }
    
    // Fetch comprehensive performance data from all AI systems
    async fetchComprehensivePerformanceData(driverId) {
        const data = {
            driverId: driverId,
            timestamp: new Date().toISOString(),
            metrics: {},
            insights: [],
            benchmarks: {}
        };
        
        try {
            // Get driver data from DataManager
            const driver = window.dataManager ? window.dataManager.getUserById(driverId) : null;
            
            if (!driver) {
                return this.getFallbackPerformanceData(driverId);
            }
            
            // 1. Advanced AI Engine Analysis
            if (window.advancedAIEngine && typeof window.advancedAIEngine.analyzeDriverPerformance === 'function') {
                try {
                    const aiAnalysis = await window.advancedAIEngine.analyzeDriverPerformance(driverId, '30d');
                    if (aiAnalysis && !aiAnalysis.error) {
                        data.metrics.ai_analysis = aiAnalysis;
                        data.insights = data.insights.concat(aiAnalysis.ai_insights || []);
                    }
                } catch (e) {
                    console.warn('⚠️ AI Engine analysis unavailable:', e.message);
                }
            }
            
            // 2. Intelligent Driver Assistant Performance Data
            if (window.intelligentDriverAssistant && typeof window.intelligentDriverAssistant.getDriverPerformanceData === 'function') {
                try {
                    const assistantData = window.intelligentDriverAssistant.getDriverPerformanceData(driverId);
                    if (assistantData && assistantData.drivers && assistantData.drivers.length > 0) {
                        const driverMetrics = assistantData.drivers[0];
                        data.metrics.assistant_analysis = driverMetrics;
                        data.insights = data.insights.concat(driverMetrics.recommendations || []);
                        data.benchmarks = driverMetrics.benchmarking || {};
                    }
                } catch (e) {
                    console.warn('⚠️ Driver Assistant data unavailable:', e.message);
                }
            }
            
            // 3. Comprehensive Reporting System
            if (window.comprehensiveReportingSystem && typeof window.comprehensiveReportingSystem.calculateDriverPerformance === 'function') {
                try {
                    const reportingMetrics = window.comprehensiveReportingSystem.calculateDriverPerformance(driverId);
                    data.metrics.reporting_analysis = reportingMetrics;
                } catch (e) {
                    console.warn('⚠️ Reporting system unavailable:', e.message);
                }
            }
            
            // 4. Enhanced Analytics Manager
            if (window.enhancedAnalyticsManager && typeof window.enhancedAnalyticsManager.calculateDriverPerformanceMetrics === 'function') {
                try {
                    const analyticsMetrics = window.enhancedAnalyticsManager.calculateDriverPerformanceMetrics({
                        id: driverId,
                        fuelLevel: driver.fuelLevel,
                        movementStatus: driver.movementStatus,
                        location: driver.location
                    });
                    data.metrics.analytics_analysis = analyticsMetrics;
                } catch (e) {
                    console.warn('⚠️ Analytics metrics unavailable:', e.message);
                }
            }
            
            // 5. Check if driver has enough activity – use SAME source as chart (getCollections + driver history); world-class: show metrics when ANY activity (1+ collections OR 1+ routes)
            const dm = window.dataManager;
            const driverIdStr = String(driverId);
            const allCollections = (dm && dm.getCollections && typeof dm.getCollections === 'function') ? dm.getCollections() : [];
            const driverCollectionsFromStore = Array.isArray(allCollections) ? allCollections.filter(c => c && String(c.driverId || '') === driverIdStr) : [];
            const driverHistory = (dm && dm.getDriverHistory && typeof dm.getDriverHistory === 'function') ? dm.getDriverHistory(driverId) : [];
            const historyCollectionCount = Array.isArray(driverHistory) ? driverHistory.filter(h => h && h.action === 'collection').length : 0;
            const totalCollectionCount = driverCollectionsFromStore.length + historyCollectionCount;
            const routes = (dm && dm.getRoutes && typeof dm.getRoutes === 'function') ? dm.getRoutes() : [];
            const driverRoutes = Array.isArray(routes) ? routes.filter(r => r && String(r.driverId || '') === driverIdStr) : [];
            data.hasSufficientData = (totalCollectionCount >= 3) || (totalCollectionCount > 0) || (driverRoutes.length > 0);
            data.driverCollectionsCount = Math.max(driverCollectionsFromStore.length, historyCollectionCount, totalCollectionCount);
            if (!data.hasSufficientData) {
                data.insights = ['Complete at least 3 collections (or have route activity) to see performance metrics and benchmarks vs team average.'];
            }
            
            // 6. Real activity data for world-class metrics (collections, routes)
            data.realActivity = this.getRealDriverActivityMetrics(driverId);
            data.aggregateMetrics = this.calculateAggregateMetrics(data.metrics, driver, data.hasSufficientData, data.realActivity);
            
            return data;
            
        } catch (error) {
            console.error('❌ Error fetching performance data:', error);
            return this.getFallbackPerformanceData(driverId);
        }
    }
    
    // World-class: real activity metrics from collections, routes, complaints – use SAME collection source as chart (getCollections filtered by driverId) so metrics match Performance Trends
    getRealDriverActivityMetrics(driverId) {
        const dm = window.dataManager;
        if (!dm) return { efficiency: 0, routeCompletionRate: 0, collectionsCount: 0, completedRoutes: 0, totalRoutes: 0, collectionsLast7d: 0, collectionsPrev7d: 0, complaintsCount30d: 0 };
        const routes = (dm.getRoutes && dm.getRoutes()) || [];
        const driverIdStr = String(driverId);
        const driverRoutes = routes.filter(r => r && String(r.driverId || '') === driverIdStr);
        const completedRoutes = driverRoutes.filter(r => r.status === 'completed');
        const allCollections = (dm.getCollections && typeof dm.getCollections === 'function') ? dm.getCollections() : [];
        const collections = Array.isArray(allCollections) ? allCollections.filter(c => c && String(c.driverId || '') === driverIdStr) : (dm.getDriverCollections ? dm.getDriverCollections(driverId) : []);
        const totalBinsInRoutes = driverRoutes.reduce((s, r) => s + (r.binIds?.length || r.bins?.length || r.binDetails?.length || r.totalBinsCollected || 0), 0);
        const routeCompletionRate = driverRoutes.length > 0 ? (completedRoutes.length / driverRoutes.length) : 0;
        const collectionsCount = collections.length;
        const efficiency = totalBinsInRoutes > 0 ? Math.min(1, collectionsCount / totalBinsInRoutes) : (completedRoutes.length > 0 ? routeCompletionRate : 0);
        const now = Date.now();
        const last7dStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const prev7dStart = new Date(now - 14 * 24 * 60 * 60 * 1000);
        const collectionsLast7d = collections.filter(c => new Date(c.timestamp) >= last7dStart).length;
        const collectionsPrev7d = collections.filter(c => { const t = new Date(c.timestamp); return t >= prev7dStart && t < last7dStart; }).length;
        const complaintsCount30d = dm.getDriverComplaintsCount ? (dm.getDriverComplaintsCount(driverId, 30) || 0) : 0;
        return {
            efficiency,
            routeCompletionRate,
            collectionsCount,
            completedRoutes: completedRoutes.length,
            totalRoutes: driverRoutes.length,
            collectionsLast7d,
            collectionsPrev7d,
            complaintsCount30d
        };
    }

    // Calculate aggregate metrics: prefer AI/reporting, then real activity data; no fake defaults.
    calculateAggregateMetrics(metrics, driver, hasSufficientData = true, realActivity = null) {
        const aggregate = {
            efficiency: 0,
            safety: 0,
            punctuality: 0,
            fuelEfficiency: 0,
            overallScore: 0
        };
        
        try {
            const usePlaceholders = hasSufficientData && !realActivity;
            
            // Efficiency: AI/reporting first, then real completion rate from data
            if (metrics.ai_analysis && metrics.ai_analysis.performance_breakdown) {
                aggregate.efficiency = metrics.ai_analysis.performance_breakdown.efficiency?.score || 0;
            } else if (metrics.reporting_analysis && metrics.reporting_analysis.efficiency != null) {
                aggregate.efficiency = metrics.reporting_analysis.efficiency;
            } else if (realActivity && hasSufficientData) {
                aggregate.efficiency = typeof realActivity.efficiency === 'number' ? realActivity.efficiency : realActivity.routeCompletionRate;
            } else {
                aggregate.efficiency = usePlaceholders ? 0.85 : 0;
            }
            
            // Safety: from AI/reporting, or from real data (100% minus penalty for driver-linked complaints)
            if (metrics.ai_analysis && metrics.ai_analysis.performance_breakdown) {
                aggregate.safety = metrics.ai_analysis.performance_breakdown.safety?.score || 0;
            } else if (metrics.reporting_analysis && metrics.reporting_analysis.safety != null) {
                aggregate.safety = metrics.reporting_analysis.safety;
            } else if (realActivity && realActivity.complaintsCount30d != null) {
                const incidents = realActivity.complaintsCount30d;
                aggregate.safety = incidents === 0 ? 1 : Math.max(0, 1 - (incidents * 0.1));
            } else {
                aggregate.safety = usePlaceholders ? 0.92 : 0;
            }
            
            // Punctuality: AI first, then real route completion rate as proxy
            if (metrics.ai_analysis && metrics.ai_analysis.performance_breakdown) {
                aggregate.punctuality = metrics.ai_analysis.performance_breakdown.punctuality?.score || 0;
            } else if (realActivity && hasSufficientData && realActivity.routeCompletionRate != null) {
                aggregate.punctuality = realActivity.routeCompletionRate;
            } else {
                aggregate.punctuality = usePlaceholders ? 0.88 : 0;
            }
            
            // Fuel: real consumption would go here; otherwise show level only (no fake L/100km)
            if (driver && driver.fuelLevel != null) {
                aggregate.fuelLevel = parseFloat(driver.fuelLevel) || 0;
                aggregate.fuelEfficiency = 0;
                aggregate.fuelIsLevelOnly = true;
            } else {
                aggregate.fuelLevel = 0;
                aggregate.fuelEfficiency = usePlaceholders ? 7.2 : 0;
                aggregate.fuelIsLevelOnly = false;
            }
            
            if (metrics.ai_analysis && metrics.ai_analysis.overall_score != null) {
                aggregate.overallScore = metrics.ai_analysis.overall_score;
            } else {
                aggregate.overallScore = (aggregate.efficiency + aggregate.safety + aggregate.punctuality) / 3;
            }
            
        } catch (error) {
            console.warn('⚠️ Error calculating aggregate metrics:', error);
        }
        
        return aggregate;
    }
    
    // Update performance metrics cards (show "—" / N/A for new drivers with no activity)
    updatePerformanceMetrics(performanceData) {
        const metrics = performanceData.aggregateMetrics || {};
        const hasSufficientData = performanceData.hasSufficientData !== false;
        
        const el = (id) => document.getElementById(id);
        const grid = document.getElementById('performanceMetricsGrid');
        const emptyHint = document.getElementById('performanceMetricsEmptyHint');
        if (!hasSufficientData) {
            grid && grid.classList.add('metrics-empty-state');
            if (emptyHint) {
                emptyHint.classList.add('is-visible');
                emptyHint.setAttribute('aria-hidden', 'false');
            }
            const naText = 'N/A';
            const naTrend = 'Requires 3+ collections';
            const naClass = 'metric-trend metric-trend-empty';
            const effS = el('driverEfficiencyScore'); if (effS) effS.textContent = naText;
            const effT = el('driverEfficiencyTrend'); if (effT) { effT.textContent = naTrend; effT.className = naClass; }
            const safS = el('driverSafetyScore'); if (safS) safS.textContent = naText;
            const safT = el('driverSafetyTrend'); if (safT) { safT.textContent = naTrend; safT.className = naClass; }
            const punS = el('driverPunctualityScore'); if (punS) punS.textContent = naText;
            const punT = el('driverPunctualityTrend'); if (punT) { punT.textContent = naTrend; punT.className = naClass; }
            const fuelS = el('driverFuelEfficiency'); if (fuelS) fuelS.textContent = naText;
            const fuelT = el('driverFuelTrend'); if (fuelT) { fuelT.textContent = naTrend; fuelT.className = naClass; }
            const avgAccEl = document.getElementById('driverAvgAccuracySummary');
            if (avgAccEl) avgAccEl.textContent = 'N/A';
            return;
        }
        grid && grid.classList.remove('metrics-empty-state');
        if (emptyHint) {
            emptyHint.classList.remove('is-visible');
            emptyHint.setAttribute('aria-hidden', 'true');
        }
        
        const realActivity = performanceData.realActivity || {};
        const collectionsLast7d = realActivity.collectionsLast7d ?? 0;
        const collectionsPrev7d = realActivity.collectionsPrev7d ?? 0;
        const complaintsCount30d = realActivity.complaintsCount30d ?? 0;

        // Efficiency Score (from actual data)
        const efficiencyScore = Math.round((Number(metrics.efficiency) || 0) * 100);
        const effEl = el('driverEfficiencyScore');
        if (effEl) effEl.textContent = `${efficiencyScore}%`;
        const efficiencyTrend = el('driverEfficiencyTrend');
        if (efficiencyTrend) {
            if (collectionsPrev7d > 0) {
                const pctChange = Math.round(((collectionsLast7d - collectionsPrev7d) / collectionsPrev7d) * 100);
                efficiencyTrend.innerHTML = pctChange >= 0 ? `<i class="fas fa-arrow-up"></i> ${pctChange}% vs last week` : `<i class="fas fa-arrow-down"></i> ${pctChange}% vs last week`;
                efficiencyTrend.className = pctChange >= 0 ? 'metric-trend positive' : 'metric-trend negative';
            } else {
                efficiencyTrend.innerHTML = collectionsLast7d > 0 ? '<i class="fas fa-check-circle"></i> From actual activity' : '';
                efficiencyTrend.className = 'metric-trend positive';
            }
        }

        // Safety Score (from incidents/complaints; 100% when none)
        const safetyScore = Math.round((Number(metrics.safety) || 0) * 100);
        const safetyEl = el('driverSafetyScore');
        if (safetyEl) safetyEl.textContent = `${safetyScore}%`;
        const safetyTrend = el('driverSafetyTrend');
        if (safetyTrend) {
            if (complaintsCount30d === 0) {
                safetyTrend.innerHTML = '<i class="fas fa-check-circle"></i> No incidents (30d)';
                safetyTrend.className = 'metric-trend positive';
            } else {
                safetyTrend.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${complaintsCount30d} incident(s) in 30d`;
                safetyTrend.className = 'metric-trend warning';
            }
        }

        // Punctuality (route completion as proxy)
        const punctualityScore = Math.round((Number(metrics.punctuality) || 0) * 100);
        const punEl = el('driverPunctualityScore');
        if (punEl) punEl.textContent = `${punctualityScore}%`;
        const punctualityTrend = el('driverPunctualityTrend');
        if (punctualityTrend) {
            punctualityTrend.innerHTML = punctualityScore >= 80 ? '<i class="fas fa-route"></i> Route completion' : '<i class="fas fa-route"></i> Route completion';
            punctualityTrend.className = punctualityScore >= 80 ? 'metric-trend positive' : 'metric-trend warning';
        }

        // Fuel: show real level when no consumption data (world-class: no fake L/100km)
        const fuelTrend = el('driverFuelTrend');
        const fuelEl = el('driverFuelEfficiency');
        if (metrics.fuelIsLevelOnly && metrics.fuelLevel != null) {
            if (fuelEl) fuelEl.textContent = `${Math.round(metrics.fuelLevel)}%`;
            if (fuelTrend) {
                fuelTrend.innerHTML = '<i class="fas fa-tachometer-alt"></i> Vehicle level';
                fuelTrend.className = 'metric-trend positive';
            }
        } else if (metrics.fuelEfficiency > 0) {
            if (fuelEl) fuelEl.textContent = `${metrics.fuelEfficiency} L/100km`;
            if (fuelTrend) {
                fuelTrend.innerHTML = metrics.fuelEfficiency < 8 ? '<i class="fas fa-leaf"></i> From data' : '<i class="fas fa-gas-pump"></i> From data';
                fuelTrend.className = metrics.fuelEfficiency < 8 ? 'metric-trend positive' : 'metric-trend warning';
            }
        } else {
            if (fuelEl) fuelEl.textContent = 'N/A';
            if (fuelTrend) {
                fuelTrend.innerHTML = '';
                fuelTrend.className = 'metric-trend metric-trend-empty';
            }
        }
        // Avg Accuracy summary (above chart, no overlap/truncation): average of efficiency, safety, punctuality
        const avgAccuracyEl = document.getElementById('driverAvgAccuracySummary');
        if (avgAccuracyEl) {
            const eff = Number(metrics.efficiency);
            const saf = Number(metrics.safety);
            const pun = Number(metrics.punctuality);
            const avgPct = (!isNaN(eff) && !isNaN(saf) && !isNaN(pun))
                ? Math.round(((eff + saf + pun) / 3) * 100)
                : null;
            avgAccuracyEl.textContent = avgPct != null && !isNaN(avgPct) ? `${avgPct}% Avg Accuracy` : '—';
            avgAccuracyEl.setAttribute('aria-label', avgPct != null ? `Average accuracy for the period: ${avgPct}%` : 'Average accuracy not yet available');
        }
    }
    
    // Update AI insights section (world-class: from actual data only)
    updateAIInsights(performanceData) {
        const insightsContainer = document.getElementById('driverPerformanceInsights');
        if (!insightsContainer) return;
        insightsContainer.innerHTML = '';

        let insights = performanceData.insights || [];
        if (insights.length === 0 || (insights.length === 1 && typeof insights[0] === 'string' && insights[0].indexOf('Complete at least 3') !== -1)) {
            insights = this.generateDataDrivenInsights(performanceData);
        }

        insights.slice(0, 6).forEach(insight => {
            insightsContainer.innerHTML += this.createInsightHTML(insight);
        });
    }

    // Generate insights from real activity data (no generic placeholders)
    generateDataDrivenInsights(performanceData) {
        const insights = [];
        const real = performanceData.realActivity || {};
        const metrics = performanceData.aggregateMetrics || {};
        const collectionsLast7d = real.collectionsLast7d ?? 0;
        const collectionsPrev7d = real.collectionsPrev7d ?? 0;
        const completedRoutes = real.completedRoutes ?? 0;
        const totalRoutes = real.totalRoutes ?? 0;
        const complaintsCount30d = real.complaintsCount30d ?? 0;
        const efficiencyPct = Math.round((metrics.efficiency || 0) * 100);
        const completionPct = totalRoutes > 0 ? Math.round((completedRoutes / totalRoutes) * 100) : 0;

        if (collectionsLast7d > 0) {
            const perDay = (collectionsLast7d / 7).toFixed(1);
            insights.push({
                type: 'positive',
                message: `Last 7 days: ${collectionsLast7d} collections (${perDay}/day average). All from your actual activity.`
            });
        }
        if (collectionsPrev7d > 0 && collectionsLast7d !== collectionsPrev7d) {
            const change = collectionsLast7d - collectionsPrev7d;
            const pct = Math.round((change / collectionsPrev7d) * 100);
            insights.push({
                type: change > 0 ? 'positive' : 'info',
                message: `Week-over-week: ${change >= 0 ? '+' : ''}${change} collections (${pct >= 0 ? '+' : ''}${pct}% vs previous 7 days).`
            });
        }
        if (totalRoutes > 0) {
            insights.push({
                type: completionPct >= 80 ? 'positive' : 'info',
                message: `Route completion: ${completedRoutes} of ${totalRoutes} routes completed (${completionPct}%). Based on assigned routes.`
            });
        }
        if (complaintsCount30d === 0 && (real.collectionsCount >= 3 || collectionsLast7d >= 3)) {
            insights.push({
                type: 'positive',
                message: 'No incidents or complaints linked to you in the last 30 days.'
            });
        } else if (complaintsCount30d > 0) {
            insights.push({
                type: 'warning',
                message: `${complaintsCount30d} incident(s) in the last 30 days. Safety score reflects actual data.`
            });
        }
        if (metrics.fuelIsLevelOnly && metrics.fuelLevel != null) {
            insights.push({
                type: 'info',
                message: `Current fuel level: ${Math.round(metrics.fuelLevel)}%. Consumption (L/100km) will show when reported.`
            });
        }
        insights.push({
            type: 'info',
            message: 'All metrics and benchmarks are calculated from your collections, routes, and team data—no simulated values.'
        });
        return insights;
    }
    
    // Create insight HTML
    createInsightHTML(insight) {
        const type = typeof insight === 'string' ? 'info' : (insight && insight.type) || 'info';
        const message = typeof insight === 'string' ? insight : (insight && insight.message);
        const safeMessage = (message != null && String(message).trim() !== '') ? String(message) : '—';
        const iconType = type in { positive: 1, warning: 1, info: 1 } ? type : 'info';
        const icons = {
            positive: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        return `
            <div class="insight-item ${iconType}">
                <i class="fas ${icons[iconType]}"></i>
                <span>${safeMessage}</span>
            </div>
        `;
    }
    
    // Update benchmarking section (real team averages from dataManager)
    updateBenchmarking(performanceData) {
        const metrics = performanceData.aggregateMetrics || {};
        const hasSufficientData = performanceData.hasSufficientData !== false;
        const realActivity = performanceData.realActivity || {};
        const dm = window.dataManager;
        const team = (dm && dm.getTeamDriverMetrics) ? dm.getTeamDriverMetrics(this.currentDriverId) : null;
        const avgCollections = team && team.avgCollectionsPerDay7d != null ? Math.round(team.avgCollectionsPerDay7d * 100) : 0;
        const avgCompletion = team && team.avgRouteCompletionRate != null ? Math.round(team.avgRouteCompletionRate * 100) : 0;
        const avgEfficiency = team && team.avgEfficiency != null ? Math.round(team.avgEfficiency * 100) : 0;

        const el = (id) => document.getElementById(id);
        const insufficientText = 'Insufficient data — complete 3+ collections';

        if (!hasSufficientData) {
            const bc = el('benchmarkCollections');
            const bcv = el('benchmarkCollectionsValue');
            const bco = el('benchmarkCompletion');
            const bcov = el('benchmarkCompletionValue');
            const bs = el('benchmarkSatisfaction');
            const bsv = el('benchmarkSatisfactionValue');
            if (bc) bc.style.width = '0%';
            if (bcv) bcv.textContent = insufficientText;
            if (bco) bco.style.width = '0%';
            if (bcov) bcov.textContent = insufficientText;
            if (bs) bs.style.width = '0%';
            if (bsv) bsv.textContent = insufficientText;
            return;
        }

        const collectionsLast7d = realActivity.collectionsLast7d ?? 0;
        const collectionsPerDay = (collectionsLast7d / 7) || 0;
        const driverCollectionsPct = Math.min(100, Math.round(collectionsPerDay * 10));
        const collectionsDiff = team && team.driverCount > 0 ? Math.round(collectionsPerDay * 10) - avgCollections : 0;
        const bc = el('benchmarkCollections');
        const bcv = el('benchmarkCollectionsValue');
        if (bc) bc.style.width = `${Math.min(100, driverCollectionsPct)}%`;
        if (bcv) bcv.textContent = team && team.driverCount > 0
            ? `${collectionsPerDay.toFixed(1)}/day (${collectionsDiff >= 0 ? '+' : ''}${collectionsDiff} vs team)`
            : `${collectionsPerDay.toFixed(1)} collections/day (actual)`;

        const punctuality = Number(metrics.punctuality);
        const completionRate = !isNaN(punctuality) ? Math.round(punctuality * 100) : 0;
        const completionDiff = team && team.driverCount > 0 ? completionRate - avgCompletion : 0;
        const bco = el('benchmarkCompletion');
        const bcov = el('benchmarkCompletionValue');
        if (bco) bco.style.width = `${Math.min(100, completionRate)}%`;
        if (bcov) bcov.textContent = team && team.driverCount > 0
            ? `${completionRate}% (${completionDiff >= 0 ? '+' : ''}${completionDiff}% vs team)`
            : `${completionRate}% route completion (actual)`;

        const safety = Number(metrics.safety);
        const efficiency = Number(metrics.efficiency);
        const satisfaction = (!isNaN(safety) && !isNaN(efficiency))
            ? Math.round(((safety + efficiency) / 2) * 100)
            : 0;
        const avgSatisfaction = team && !isNaN(safety) ? Math.round(((avgEfficiency / 100) + safety) / 2 * 100) : 0;
        const satisfactionDiff = team && team.driverCount > 0 ? satisfaction - avgSatisfaction : 0;
        const bs = el('benchmarkSatisfaction');
        const bsv = el('benchmarkSatisfactionValue');
        if (bs) bs.style.width = `${Math.min(100, satisfaction)}%`;
        if (bsv) bsv.textContent = team && team.driverCount > 0
            ? `${satisfaction}% (${satisfactionDiff >= 0 ? '+' : ''}${satisfactionDiff}% vs team)`
            : `${satisfaction}% (safety + efficiency)`;
    }
    
    // Fallback performance data when AI systems are unavailable or driver not found
    getFallbackPerformanceData(driverId) {
        console.warn('⚠️ Using fallback performance data');
        
        const driverCollections = window.dataManager && typeof window.dataManager.getDriverCollections === 'function'
            ? window.dataManager.getDriverCollections(driverId) : [];
        const driverHistory = window.dataManager && typeof window.dataManager.getDriverHistory === 'function'
            ? window.dataManager.getDriverHistory(driverId) : [];
        const historyCollectionCount = (driverHistory || []).filter(h => h.action === 'collection').length;
        const hasSufficientData = (driverCollections.length >= 3) || (historyCollectionCount >= 3);
        const realActivity = this.getRealDriverActivityMetrics(driverId);
        const driver = window.dataManager ? window.dataManager.getUserById(driverId) : null;
        const aggregateMetrics = this.calculateAggregateMetrics({}, driver, hasSufficientData, realActivity);
        
        return {
            driverId: driverId,
            timestamp: new Date().toISOString(),
            metrics: {},
            hasSufficientData,
            realActivity,
            insights: hasSufficientData
                ? [
                    'Metrics derived from your collections and route completion data.',
                    'AI analysis can provide additional insights when available.'
                ]
                : [
                    'This driver has limited activity so far.',
                    'Complete at least 3 collections to see performance metrics and benchmarks vs team average.'
                ],
            aggregateMetrics,
            benchmarks: {}
        };
    }
    
    // Show fallback data when errors occur
    showFallbackData() {
        const fallbackData = this.getFallbackPerformanceData(this.currentDriverId || 'unknown');
        this.updatePerformanceMetrics(fallbackData);
        this.updateAIInsights(fallbackData);
        this.updateBenchmarking(fallbackData);
    }
}

// Initialize globally
window.driverPerformanceAnalysis = new DriverPerformanceAnalysis();

console.log('✅ Driver Performance Analysis system ready');

