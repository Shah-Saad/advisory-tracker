const knex = require('./src/config/db');

async function checkDatabase() {
  try {
    console.log('Checking database schema for vendor fields...');
    
    // Check table schema for vendor-related columns
    const columns = await knex.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sheet_entries' 
      AND column_name LIKE '%vendor%'
      ORDER BY ordinal_position;
    `);
    
    console.log('Vendor-related columns in sheet_entries:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check current vendor data
    const vendorData = await knex('sheet_entries')
      .select('oem_vendor', 'vendor_name', 'vendor_id')
      .whereNotNull('oem_vendor')
      .orWhereNotNull('vendor_name')
      .orWhereNotNull('vendor_id')
      .limit(5);
    
    console.log('\nSample vendor data:');
    vendorData.forEach(entry => {
      console.log(`OEM/Vendor: '${entry.oem_vendor}', Vendor Name: '${entry.vendor_name}', Vendor ID: ${entry.vendor_id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
