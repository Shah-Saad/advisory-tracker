const knex = require('knex');
const config = require('../src/config/knexfile.js');

// Create knex instance
const db = knex(config.development);

async function checkAndFixAdmin() {
    try {
        // Check admin user
        const admin = await db('users')
            .where('username', 'admin')
            .first();
        
        console.log('Admin user found:', admin);
        
        if (admin && !admin.is_active) {
            console.log('Admin user is not active. Activating...');
            
            await db('users')
                .where('username', 'admin')
                .update({ is_active: true });
            
            console.log('✅ Admin user activated');
        } else if (admin && admin.is_active) {
            console.log('✅ Admin user is already active');
        } else {
            console.log('❌ Admin user not found');
        }
        
        // Close connection
        await db.destroy();
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndFixAdmin();
