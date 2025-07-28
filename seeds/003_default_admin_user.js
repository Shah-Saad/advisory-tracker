/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  const bcrypt = require('bcrypt');
  
  // Check if admin user already exists
  const existingAdmin = await knex('users').where('username', 'admin').first();
  
  if (!existingAdmin) {
    console.log('Creating default admin user...');
    
    // Get admin role ID
    const adminRole = await knex('roles').where('name', 'admin').first();
    
    if (!adminRole) {
      throw new Error('Admin role not found. Make sure roles are seeded first.');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    await knex('users').insert({
      username: 'admin',
      email: 'admin@advisorytracker.com',
      password_hash: hashedPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role_id: adminRole.id,
      is_active: true
    });
    
    console.log('✅ Default admin user created');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@advisorytracker.com');
  } else {
    console.log('ℹ️ Admin user already exists');
  }
};
