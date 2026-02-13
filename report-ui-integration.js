// report-ui-integration.js - UI Integration for Comprehensive Reporting

class ReportUIIntegration {
    constructor() {
        this.reportButton = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('🎨 Initializing Report UI Integration...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupReportUI();
            });
        } else {
            this.setupReportUI();
        }
    }

    setupReportUI() {
        // Add report generation button to the main UI
        this.addReportButton();
        
        // Add report menu to admin panel
        this.addReportMenu();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        this.isInitialized = true;
        console.log('✅ Report UI Integration initialized');
    }

    addReportButton() {
        // Only add report button if user is admin or manager
        setTimeout(() => {
            const currentUser = this.getCurrentUser();
            if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'manager')) {
                return; // Don't add report button for drivers
            }

            // Check if button already exists
            if (document.getElementById('comprehensiveReportButton')) {
                return; // Already exists, don't duplicate
            }

            const reportButton = document.createElement('button');
            reportButton.id = 'comprehensiveReportButton';
            reportButton.style.cssText = `
                position: fixed;
                top: 80px;
                left: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 9998;
                transition: all 0.3s ease;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            
            reportButton.innerHTML = '📊 Reports';
            
            reportButton.onmouseover = function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            };
            
            reportButton.onmouseout = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            };
            
            reportButton.onclick = () => {
                this.showReportMenu();
            };
            
            document.body.appendChild(reportButton);
            this.reportButton = reportButton;
            
            console.log('✅ Report button added for admin/manager user');
        }, 2000); // Wait for user to be identified
    }

    getCurrentUser() {
        // Try multiple sources for current user
        if (window.authManager && window.authManager.getCurrentUser) {
            return window.authManager.getCurrentUser();
        }
        
        if (window.currentUser) {
            return window.currentUser;
        }
        
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('⚠️ Error loading current user:', error);
        }
        
        return null;
    }

    addReportMenu() {
        // Create report menu for admin panel
        const adminPanel = document.getElementById('adminSection') || 
                          document.querySelector('.admin-panel') ||
                          document.querySelector('.dashboard');

        if (adminPanel) {
            const reportSection = document.createElement('div');
            reportSection.style.cssText = `
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border-left: 4px solid #667eea;
            `;
            
            reportSection.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center; gap: 10px;">
                    📊 Advanced Reporting
                </h3>
                <p style="margin: 0 0 15px 0; color: #666;">
                    Generate comprehensive reports with detailed analytics, AI insights, and performance metrics.
                </p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="window.generateComprehensiveReport()" style="background: #667eea; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                        📊 Full Report
                    </button>
                    <button onclick="window.generateDriverReport()" style="background: #28a745; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                        🚛 Driver Report
                    </button>
                    <button onclick="window.generateBinReport()" style="background: #ffc107; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                        📦 Bin Report
                    </button>
                    <button onclick="window.generateSensorReport()" style="background: #17a2b8; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                        📡 Sensor Report
                    </button>
                </div>
            `;
            
            // Insert at the beginning of admin panel
            adminPanel.insertBefore(reportSection, adminPanel.firstChild);
            
            console.log('✅ Report menu added to admin panel');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+R for comprehensive report
            if (event.ctrlKey && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                this.generateQuickReport();
            }
            
            // Ctrl+Alt+R for report menu
            if (event.ctrlKey && event.altKey && event.key === 'R') {
                event.preventDefault();
                this.showReportMenu();
            }
        });
        
        console.log('✅ Keyboard shortcuts setup (Ctrl+Shift+R for report, Ctrl+Alt+R for menu)');
    }

    showReportMenu() {
        // Create modal menu for report selection
        const modal = document.createElement('div');
        modal.id = 'reportMenuModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 style="margin: 0; color: #333;">📊 Generate Report</h2>
                    <button onclick="document.body.removeChild(document.getElementById('reportMenuModal'))" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div onclick="window.generateComprehensiveReport(); document.body.removeChild(document.getElementById('reportMenuModal'))" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 2em; margin-bottom: 10px;">📊</div>
                        <h3 style="margin: 0 0 10px 0;">Comprehensive Report</h3>
                        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Complete system analysis with all metrics, AI insights, and recommendations</p>
                    </div>
                    
                    <div onclick="window.generateDriverPerformanceReport(); document.body.removeChild(document.getElementById('reportMenuModal'))" style="background: linear-gradient(135deg, #28a745, #1e7e34); color: white; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 2em; margin-bottom: 10px;">🚛</div>
                        <h3 style="margin: 0 0 10px 0;">Driver Performance</h3>
                        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Detailed driver analytics, histories, and performance metrics</p>
                    </div>
                    
                    <div onclick="window.generateBinAnalyticsReport(); document.body.removeChild(document.getElementById('reportMenuModal'))" style="background: linear-gradient(135deg, #ffc107, #e0a800); color: white; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 2em; margin-bottom: 10px;">📦</div>
                        <h3 style="margin: 0 0 10px 0;">Bin Analytics</h3>
                        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Bin operations, histories, utilization, and optimization insights</p>
                    </div>
                    
                    <div onclick="window.generateSensorHealthReport(); document.body.removeChild(document.getElementById('reportMenuModal'))" style="background: linear-gradient(135deg, #17a2b8, #138496); color: white; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 2em; margin-bottom: 10px;">📡</div>
                        <h3 style="margin: 0 0 10px 0;">Sensor Health</h3>
                        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Complete sensor diagnostics, health status, and maintenance schedules</p>
                    </div>
                    
                    <div onclick="window.generateAIInsightsReport(); document.body.removeChild(document.getElementById('reportMenuModal'))" style="background: linear-gradient(135deg, #6f42c1, #5a32a3); color: white; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 2em; margin-bottom: 10px;">🤖</div>
                        <h3 style="margin: 0 0 10px 0;">AI Insights</h3>
                        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Machine learning analytics, predictions, and optimization recommendations</p>
                    </div>
                    
                    <div onclick="window.generateCustomReport(); document.body.removeChild(document.getElementById('reportMenuModal'))" style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 2em; margin-bottom: 10px;">⚙️</div>
                        <h3 style="margin: 0 0 10px 0;">Custom Report</h3>
                        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Build a custom report with specific metrics and date ranges</p>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #666;">Quick Actions:</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="window.exportLastReport()" style="background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">📄 Export Last Report</button>
                        <button onclick="window.scheduleReport()" style="background: #fd7e14; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">⏰ Schedule Report</button>
                        <button onclick="window.viewReportHistory()" style="background: #20c997; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">📚 Report History</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async generateQuickReport() {
        console.log('⚡ Generating quick report...');
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        try {
            // Generate comprehensive report
            const report = await window.generateComprehensiveReport();
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            // Show success notification
            this.showNotification('✅ Report generated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Quick report generation failed:', error);
            this.hideLoadingIndicator();
            this.showNotification('❌ Report generation failed. Please try again.', 'error');
        }
    }

    showLoadingIndicator() {
        const loading = document.createElement('div');
        loading.id = 'reportLoadingIndicator';
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 30px 40px;
            border-radius: 15px;
            z-index: 10001;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        
        loading.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 15px;">📊</div>
            <h3 style="margin: 0 0 10px 0;">Generating Report...</h3>
            <p style="margin: 0; opacity: 0.8;">Analyzing data and creating comprehensive insights</p>
            <div style="margin-top: 20px;">
                <div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
        `;
        
        // Add spin animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(loading);
    }

    hideLoadingIndicator() {
        const loading = document.getElementById('reportLoadingIndicator');
        if (loading) {
            document.body.removeChild(loading);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10002;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = message;
        
        // Add slide animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Initialize report UI integration
const reportUI = new ReportUIIntegration();

// Global report generation functions
window.generateDriverPerformanceReport = async function() {
    console.log('🚛 Generating driver performance report...');
    reportUI.showLoadingIndicator();
    
    try {
        const report = await window.comprehensiveReporting.generateReport('driverPerformance');
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('✅ Driver performance report generated!', 'success');
        return report;
    } catch (error) {
        console.error('❌ Driver report generation failed:', error);
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('❌ Failed to generate driver report', 'error');
    }
};

window.generateBinAnalyticsReport = async function() {
    console.log('📦 Generating bin analytics report...');
    reportUI.showLoadingIndicator();
    
    try {
        const report = await window.comprehensiveReporting.generateReport('binAnalytics');
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('✅ Bin analytics report generated!', 'success');
        return report;
    } catch (error) {
        console.error('❌ Bin report generation failed:', error);
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('❌ Failed to generate bin report', 'error');
    }
};

window.generateSensorHealthReport = async function() {
    console.log('📡 Generating sensor health report...');
    reportUI.showLoadingIndicator();
    
    try {
        const report = await window.comprehensiveReporting.generateReport('sensorHealth');
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('✅ Sensor health report generated!', 'success');
        return report;
    } catch (error) {
        console.error('❌ Sensor report generation failed:', error);
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('❌ Failed to generate sensor report', 'error');
    }
};

window.generateAIInsightsReport = async function() {
    console.log('🤖 Generating AI insights report...');
    reportUI.showLoadingIndicator();
    
    try {
        const report = await window.comprehensiveReporting.generateReport('aiInsights');
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('✅ AI insights report generated!', 'success');
        return report;
    } catch (error) {
        console.error('❌ AI insights report generation failed:', error);
        reportUI.hideLoadingIndicator();
        reportUI.showNotification('❌ Failed to generate AI insights report', 'error');
    }
};

window.generateCustomReport = function() {
    alert('Custom report builder will be implemented based on your specific requirements.');
};

window.exportLastReport = function() {
    console.log('📄 Exporting last report to PDF...');
    
    try {
        // Get the report container
        const reportContainer = document.getElementById('comprehensiveReportContainer');
        if (!reportContainer) {
            alert('No report is currently displayed. Please generate a report first.');
            return;
        }

        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        
        // Copy the report content with enhanced styling for PDF
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Waste Management System Report - ${new Date().toLocaleDateString()}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        background: white;
                        color: #333;
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        border-bottom: 3px solid #667eea;
                        padding-bottom: 20px;
                    }
                    .header h1 { 
                        color: #667eea; 
                        margin: 0;
                        font-size: 24px;
                    }
                    .header p { 
                        margin: 5px 0; 
                        color: #666;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                        page-break-inside: avoid;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left;
                        font-size: 12px;
                    }
                    th { 
                        background-color: #f8f9fa; 
                        font-weight: bold;
                    }
                    .section { 
                        margin: 30px 0; 
                        page-break-inside: avoid;
                    }
                    .section h2 { 
                        color: #333; 
                        border-bottom: 2px solid #667eea; 
                        padding-bottom: 5px;
                        font-size: 18px;
                    }
                    .section h3 { 
                        color: #667eea; 
                        font-size: 14px;
                        margin: 15px 0 10px 0;
                    }
                    .kpi-grid { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 15px; 
                        margin: 20px 0;
                    }
                    .kpi-card { 
                        border: 2px solid #667eea; 
                        padding: 15px; 
                        border-radius: 8px;
                        text-align: center;
                    }
                    .kpi-value { 
                        font-size: 24px; 
                        font-weight: bold; 
                        color: #667eea;
                    }
                    .kpi-label { 
                        font-size: 12px; 
                        color: #666;
                        margin-top: 5px;
                    }
                    .chart-placeholder {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        border: 1px dashed #ccc;
                        margin: 10px 0;
                        color: #666;
                    }
                    .footer {
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body { margin: 0; }
                        .section { page-break-inside: avoid; }
                        table { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏢 Comprehensive Analytics Report</h1>
                    <p>Autonautics Waste Management System</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                </div>
                ${reportContainer.innerHTML.replace(/style="[^"]*"/g, '').replace(/<canvas[^>]*>.*?<\/canvas>/g, '<div class="chart-placeholder">📊 Chart data available in interactive version</div>')}
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Autonautics Waste Management System - All Rights Reserved</p>
                    <p>Report generated automatically from live system data</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 1000);
        
        console.log('✅ PDF export window opened');
        
    } catch (error) {
        console.error('❌ PDF export failed:', error);
        alert('PDF export failed. Please try again or use the print option.');
    }
};

window.scheduleReport = function() {
    alert('Scheduled reporting functionality will be implemented for automated report generation.');
};

window.viewReportHistory = function() {
    alert('Report history viewer will be implemented to access previously generated reports.');
};

// Export for global access
window.ReportUIIntegration = ReportUIIntegration;
window.reportUI = reportUI;

console.log('🎨 Report UI Integration loaded and active');
