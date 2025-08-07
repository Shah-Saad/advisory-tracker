const db = require('./src/config/db');

async function checkSchema() {
  try {
    // Check constraints
    const constraints = await db.raw(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%compensatory%' OR constraint_name LIKE '%vendor_contacted%'
    `);
    
    console.log('Relevant constraints:');
    constraints.rows.forEach(row => {
      console.log(`- ${row.constraint_name}: ${row.check_clause}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
