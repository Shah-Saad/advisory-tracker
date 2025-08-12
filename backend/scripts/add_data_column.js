const db = require('../src/config/db');

async function addDataColumn() {
  try {
    console.log('🔧 Adding data column to notifications table...');
    
    // Check if the column already exists
    const columnExists = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'data'
    `);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ Data column already exists in notifications table');
      return;
    }
    
    // Add the data column
    await db.raw('ALTER TABLE notifications ADD COLUMN data JSONB');
    console.log('✅ Successfully added data column to notifications table');
    
  } catch (error) {
    console.error('❌ Error adding data column:', error);
  } finally {
    process.exit(0);
  }
}

addDataColumn();

