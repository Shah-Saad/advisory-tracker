const knex = require('knex');
const config = require('../src/config/knexfile.js');

// Create knex instance
const db = knex(config.development);

async function fixAdminRole() {
    try {
        // Get admin role
        const adminRole = await db('roles')
            .where('name', 'admin')
            .first();
        
        console.log('Admin role found:', adminRole);
        
        if (!adminRole) {
            console.log('❌ Admin role not found');
            return;
        }
        
        // Update admin user with role
        await db('users')
            .where('username', 'admin')
            .update({ role_id: adminRole.id });
        
        console.log('✅ Admin user role fixed');
        
        // Verify the fix
        const admin = await db('users')
            .where('username', 'admin')
            .first();
        
        console.log('Updated admin user:', admin);
        
        // Close connection
        await db.destroy();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await db.destroy();
        process.exit(1);
    }
}

fixAdminRole();
