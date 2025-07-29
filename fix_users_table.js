const knex = require('knex')(require('./src/config/knexfile.js').development);

async function checkUsersTable() {
  try {
    const result = await knex.raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log('Users table columns:');
    result.rows.forEach(row => console.log('- ' + row.column_name));
    
    // Check if role column exists, if not add it
    const hasRole = result.rows.some(row => row.column_name === 'role');
    if (!hasRole) {
      console.log('Adding role column...');
      await knex.schema.alterTable('users', function(table) {
        table.string('role', 255).defaultTo('user');
      });
    }
    
    // Check if department column exists, if not add it
    const hasDepartment = result.rows.some(row => row.column_name === 'department');
    if (!hasDepartment) {
      console.log('Adding department column...');
      await knex.schema.alterTable('users', function(table) {
        table.string('department', 255);
      });
    }
    
    // Check if created_by column exists, if not add it
    const hasCreatedBy = result.rows.some(row => row.column_name === 'created_by');
    if (!hasCreatedBy) {
      console.log('Adding created_by column...');
      await knex.schema.alterTable('users', function(table) {
        table.integer('created_by');
      });
    }
    
    // Check if last_login column exists, if not add it
    const hasLastLogin = result.rows.some(row => row.column_name === 'last_login');
    if (!hasLastLogin) {
      console.log('Adding last_login column...');
      await knex.schema.alterTable('users', function(table) {
        table.timestamp('last_login').defaultTo(null);
      });
    }
    
    console.log('Users table setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsersTable();
