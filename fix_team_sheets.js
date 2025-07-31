// Direct migration script to fix team_sheets table
const db = require('./src/config/db');

async function fixTeamSheetsTable() {
  console.log('Fixing team_sheets table...');
  
  try {
    // Add missing columns
    await db.raw(`
      ALTER TABLE team_sheets 
      ADD COLUMN IF NOT EXISTS assigned_by INTEGER,
      ADD COLUMN IF NOT EXISTS started_by INTEGER,
      ADD COLUMN IF NOT EXISTS completed_by INTEGER,
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE
    `);
    
    console.log('✅ Added missing columns to team_sheets table');
    
    // Add foreign key constraints (if they don't exist)
    try {
      await db.raw(`
        ALTER TABLE team_sheets
        ADD CONSTRAINT IF NOT EXISTS fk_team_sheets_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      
      await db.raw(`
        ALTER TABLE team_sheets
        ADD CONSTRAINT IF NOT EXISTS fk_team_sheets_started_by 
        FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      
      await db.raw(`
        ALTER TABLE team_sheets
        ADD CONSTRAINT IF NOT EXISTS fk_team_sheets_completed_by 
        FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      
      console.log('✅ Added foreign key constraints');
    } catch (fkError) {
      console.log('⚠️  Foreign key constraints may already exist:', fkError.message);
    }
    
    // Verify the changes
    const columns = await db.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'team_sheets'
      ORDER BY column_name
    `);
    
    console.log('\nUpdated team_sheets columns:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n🎉 team_sheets table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing team_sheets table:', error.message);
    throw error;
  }
  
  process.exit(0);
}

// Run the fix
fixTeamSheetsTable();
