// add-sensor-menu-item.js - Automatically adds Sensor Management to admin menu
// Just include this script and it will find and add the menu item

(function() {
    console.log('🔧 Adding Sensor Management to admin menu...');
    
    // Wait for page to load
    function addSensorMenuItem() {
        // Try to find the navigation menu (multiple possible selectors)
        const possibleMenus = [
            document.getElementById('navMenu'),
            document.querySelector('.nav-menu'),
            document.querySelector('.admin-menu'),
            document.querySelector('.sidebar-menu'),
            document.querySelector('nav ul'),
            document.querySelector('.navigation ul')
        ];
        
        let menu = null;
        for (const m of possibleMenus) {
            if (m) {
                menu = m;
                break;
            }
        }
        
        if (menu) {
            // Create menu item
            const menuItem = document.createElement('li');
            menuItem.className = 'menu-item nav-item';
            menuItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.3s;
            `;
            
            menuItem.innerHTML = `
                <i class="fas fa-satellite-dish" style="font-size: 1.25rem; width: 24px;">📡</i>
                <span>Sensor Management</span>
            `;
            
            menuItem.onclick = function() {
                window.open('/sensor-management.html', '_blank');
            };
            
            menuItem.onmouseenter = function() {
                this.style.background = 'rgba(102, 126, 234, 0.1)';
            };
            
            menuItem.onmouseleave = function() {
                this.style.background = 'transparent';
            };
            
            // Add to menu
            menu.appendChild(menuItem);
            console.log('✅ Sensor Management menu item added successfully!');
            
        } else {
            console.log('⚠️ Menu not found, adding floating button instead...');
            addFloatingButton();
        }
    }
    
    // Fallback: Add floating button
    function addFloatingButton() {
        const button = document.createElement('div');
        button.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 10000;
        `;
        
        button.innerHTML = `
            <button onclick="window.open('/sensor-management.html', '_blank')" style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s;
            " title="Sensor Management" onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform='scale(1)'">
                📡
            </button>
        `;
        
        document.body.appendChild(button);
        console.log('✅ Floating sensor management button added!');
    }
    
    // Try to add menu item after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addSensorMenuItem, 1000); // Wait for app to initialize
        });
    } else {
        setTimeout(addSensorMenuItem, 1000);
    }
})();

console.log('✅ Sensor Management menu integration loaded');


