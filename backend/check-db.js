const { Client } = require('pg');

async function checkDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'advisory_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
  });

  try {
    await client.connect();
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    // Check migration status
    try {
      const migrationsResult = await client.query(`
        SELECT name, batch, migration_time
        FROM knex_migrations
        ORDER BY migration_time;
      `);
      
      console.log('\nCompleted migrations:');
      migrationsResult.rows.forEach(row => {
        console.log('  -', row.name, `(batch: ${row.batch})`);
      });
    } catch (error) {
      console.log('\nNo knex_migrations table found (first run)');
    }
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
