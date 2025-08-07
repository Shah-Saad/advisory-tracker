const fs = require('fs');
const path = require('path');

// Define the correct migration order
const correctOrder = [
  // 1. Create basic RBAC tables (no dependencies)
  { 
    old: '20241219_001_create_rbac_tables.js',
    new: '20241219_001_create_rbac_tables.js',
    creates: ['roles', 'permissions', 'role_permissions', 'users']
  },
  
  // 2. Create teams (referenced by users)
  {
    old: '20241219_002_create_teams_and_sheets.js',
    new: '20241219_002_create_teams_and_sheets.js', 
    creates: ['teams', 'sheets', 'team_sheets']
  },
  
  // 3. Create vendors and products (needed by sheet_entries)
  {
    old: '20241219_003_create_products_vendors.js',
    new: '20241219_003_create_products_vendors.js',
    creates: ['vendors', 'products']
  },
  
  // 4. Create sheet_entries (depends on sheets, products, vendors, users)
  {
    old: '20241219_003_create_sheet_entries.js',
    new: '20241219_004_create_sheet_entries.js',
    creates: ['sheet_entries']
  },
  
  // 5. Modify sheet_entries - add product/vendor references
  {
    old: '20241219_004_add_product_vendor_to_entries.js',
    new: '20241219_005_add_product_vendor_to_entries.js',
    modifies: ['sheet_entries']
  },
  
  // 6. Simplify vendors/products
  {
    old: '20241219_004_simplify_vendors_products.js',
    new: '20241219_006_simplify_vendors_products.js',
    modifies: ['vendors', 'products']
  },
  
  // 7. Add missing columns to sheet_entries
  {
    old: '20241219_005_add_missing_columns.js',
    new: '20241219_007_add_missing_columns.js',
    modifies: ['sheet_entries']
  },
  
  // 8. Add comprehensive columns to sheet_entries
  {
    old: '20241219_006_add_comprehensive_columns.js',
    new: '20241219_008_add_comprehensive_columns.js',
    modifies: ['sheet_entries']
  },
  
  // 9. Fix technical specs type
  {
    old: '20241219_006_fix_technical_specs_type.js',
    new: '20241219_009_fix_technical_specs_type.js',
    modifies: ['sheet_entries']
  },
  
  // 10. Update users table
  {
    old: '20241229_008_update_users_table.js',
    new: '20241219_010_update_users_table.js',
    modifies: ['users']
  },
  
  // 11. Create user permissions table (depends on users)
  {
    old: '20250729075832_create_user_permissions_table.js',
    new: '20241219_011_create_user_permissions_table.js',
    creates: ['user_permissions']
  },
  
  // 12. Add conditional fields to sheet_entries
  {
    old: '20250729101500_add_conditional_fields_to_sheet_entries.js',
    new: '20241219_012_add_conditional_fields_to_sheet_entries.js',
    modifies: ['sheet_entries']
  },
  
  // 13. Add site field to sheet_entries
  {
    old: '20250729102000_add_site_field_to_sheet_entries.js',
    new: '20241219_013_add_site_field_to_sheet_entries.js',
    modifies: ['sheet_entries']
  },
  
  // 14. Add estimated completion date
  {
    old: '20250729120000_add_estimated_completion_date.js',
    new: '20241219_014_add_estimated_completion_date.js',
    modifies: ['sheet_entries']
  },
  
  // 15. Create notifications table (depends on users, sheet_entries)
  {
    old: '20250729130000_create_notifications_table.js',
    new: '20241219_015_create_notifications_table.js',
    creates: ['notifications']
  },
  
  // 16. Fix team_sheets (depends on team_sheets, users)
  {
    old: '20250731_fix_team_sheets.js',
    new: '20241219_016_fix_team_sheets.js',
    modifies: ['team_sheets']
  },
  
  // 17. Create sheet_responses (depends on team_sheets, sheet_entries, users)
  {
    old: '20250731_create_sheet_responses.js',
    new: '20241219_017_create_sheet_responses.js',
    creates: ['sheet_responses']
  },
  
  // 18. Add entry locking (depends on sheet_entries, users)
  {
    old: '20250807_001_add_entry_locking.js',
    new: '20241219_018_add_entry_locking.js',
    modifies: ['sheet_entries']
  }
];

function renameMigrations() {
  const migrationsDir = path.join(__dirname, 'backend', 'migrations');
  
  console.log('🔄 Renaming migration files to correct order...\n');
  
  // First pass: rename to temporary names to avoid conflicts
  console.log('Step 1: Renaming to temporary names...');
  correctOrder.forEach((item, index) => {
    const oldPath = path.join(migrationsDir, item.old);
    const tempName = `temp_${String(index + 1).padStart(3, '0')}_${item.new}`;
    const tempPath = path.join(migrationsDir, tempName);
    
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, tempPath);
      console.log(`  ✅ ${item.old} → ${tempName}`);
    } else {
      console.log(`  ⚠️  ${item.old} not found`);
    }
  });
  
  console.log('\nStep 2: Renaming to final names...');
  // Second pass: rename to final names
  correctOrder.forEach((item, index) => {
    const tempName = `temp_${String(index + 1).padStart(3, '0')}_${item.new}`;
    const tempPath = path.join(migrationsDir, tempName);
    const finalPath = path.join(migrationsDir, item.new);
    
    if (fs.existsSync(tempPath)) {
      fs.renameSync(tempPath, finalPath);
      console.log(`  ✅ ${tempName} → ${item.new}`);
    }
  });
  
  console.log('\n✅ Migration files reordered successfully!');
  console.log('\n📋 New migration order:');
  correctOrder.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.new}`);
    if (item.creates) console.log(`     Creates: ${item.creates.join(', ')}`);
    if (item.modifies) console.log(`     Modifies: ${item.modifies.join(', ')}`);
  });
}

renameMigrations();
