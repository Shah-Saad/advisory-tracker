const db = require('../src/config/db');

async function addSiteColumn() {
  try {
    console.log('🔄 Adding site column to sheet_responses table...');
    
    // Check if the column already exists
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sheet_responses' 
      AND column_name = 'site'
    `);
    
    if (columns.rows.length > 0) {
      console.log('✅ Site column already exists');
      return;
    }
    
    // Add the site column
    await db.raw('ALTER TABLE sheet_responses ADD COLUMN site VARCHAR(255)');
    
    console.log('✅ Site column added successfully');
  } catch (error) {
    console.error('❌ Error adding site column:', error);
  } finally {
    process.exit(0);
  }
}

addSiteColumn();
