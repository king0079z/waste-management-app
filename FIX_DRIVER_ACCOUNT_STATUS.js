// 🔧 Fix Driver Account Status - Make All Drivers Active

(function() {
    console.log('🔧 Fixing driver account statuses...');
    
    // Wait for dataManager to be ready
    function waitAndFix() {
        if (!window.dataManager) {
            setTimeout(waitAndFix, 100);
            return;
        }
        
        fixDriverStatuses();
    }
    
    function fixDriverStatuses() {
        console.log('🔧 Setting all driver accounts to active...');
        
        // Get all users
        const users = window.dataManager.getUsers();
        
        // Fix all drivers to be active
        let fixedCount = 0;
        
        users.forEach(user => {
            if (user.type === 'driver' && user.status !== 'active') {
                console.log(`🔧 Activating driver account: ${user.username} (${user.name})`);
                
                user.status = 'active';
                window.dataManager.updateUser(user.id, { status: 'active' });
                
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            console.log(`✅ Fixed ${fixedCount} driver account(s) - all drivers now active`);
        } else {
            console.log('✅ All driver accounts already active');
        }
        
        // Verify the fix
        const drivers = users.filter(u => u.type === 'driver');
        console.log('📊 Driver account statuses:');
        drivers.forEach(d => {
            const status = window.dataManager.getUserById(d.id)?.status || 'unknown';
            console.log(`  - ${d.username} (${d.name}): ${status}`);
        });
    }
    
    // Start the fix
    waitAndFix();
    
})();

console.log('✅ Driver Account Status Fix module loaded');

