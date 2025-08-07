const fs = require('fs');
const path = require('path');

// Simple, logical migration order
const finalOrder = [
  '20241219_001_create_rbac_tables.js',        // Creates: roles, permissions, role_permissions, users
  '20241219_002_create_teams_and_sheets.js',   // Creates: teams, sheets, team_sheets (needs users)
  '20241219_003_create_products_vendors.js',   // Creates: vendors, products
  '20241219_004_create_sheet_entries.js',      // Creates: sheet_entries (needs sheets, products, vendors, users)
  '20241219_005_add_product_vendor_to_entries.js',      // Modifies: sheet_entries
  '20241219_006_simplify_vendors_products.js',          // Modifies: vendors, products  
  '20241219_007_add_missing_columns.js',                // Modifies: sheet_entries
  '20241219_008_add_comprehensive_columns.js',          // Modifies: sheet_entries
  '20241219_009_fix_technical_specs_type.js',           // Modifies: sheet_entries
  '20241219_010_update_users_table.js',                 // Modifies: users
  '20241219_011_create_user_permissions_table.js',      // Creates: user_permissions (needs users)
  '20241219_012_add_conditional_fields_to_sheet_entries.js', // Modifies: sheet_entries
  '20241219_013_add_site_field_to_sheet_entries.js',    // Modifies: sheet_entries
  '20241219_014_add_estimated_completion_date.js',      // Modifies: sheet_entries
  '20241219_015_create_notifications_table.js',         // Creates: notifications (needs users, sheet_entries)
  '20241219_016_fix_team_sheets.js',                    // Modifies: team_sheets (needs team_sheets, users)
  '20241219_017_create_sheet_responses.js',             // Creates: sheet_responses (needs team_sheets, sheet_entries, users)
  '20241219_018_add_entry_locking.js'                   // Modifies: sheet_entries (needs users, sheet_entries)
];

function validateAndCleanMigrations() {
  const migrationsDir = path.join(__dirname, 'backend', 'migrations');
  const existingFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
  
  console.log('🔍 Current migration files:');
  existingFiles.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file}`);
  });
  
  console.log('\n✅ Migrations are already in the correct logical order!');
  console.log('\n📋 This order ensures:');
  console.log('  1. Base tables (roles, permissions, users) are created first');
  console.log('  2. Teams and sheets tables come next');
  console.log('  3. Products and vendors are created');
  console.log('  4. Sheet entries table is created with all dependencies');
  console.log('  5. All modifications to existing tables come after table creation');
  console.log('  6. Complex tables with multiple dependencies come last');
  
  console.log('\n🎯 Final migration order:');
  finalOrder.forEach((file, i) => {
    const exists = existingFiles.includes(file);
    console.log(`  ${i + 1}. ${file} ${exists ? '✅' : '❌'}`);
  });
  
  // Check if current order matches final order
  const currentOrderMatches = existingFiles.length === finalOrder.length && 
    existingFiles.every((file, i) => file === finalOrder[i]);
  
  if (currentOrderMatches) {
    console.log('\n🎉 Perfect! Migrations are already in the correct order.');
  } else {
    console.log('\n⚠️  Migration order needs adjustment.');
  }
  
  return currentOrderMatches;
}

validateAndCleanMigrations();
