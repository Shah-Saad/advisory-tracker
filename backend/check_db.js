const knex = require('./src/config/db');

async function checkDatabase() {
  try {
    console.log('Checking sheet_entries table structure...');
    
    // Check if table exists
    const tableExists = await knex.schema.hasTable('sheet_entries');
    console.log('sheet_entries table exists:', tableExists);
    
    if (tableExists) {
      // Get columns
      const columns = await knex.raw(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'sheet_entries' 
        ORDER BY ordinal_position;
      `);
      
      console.log('Columns in sheet_entries:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
