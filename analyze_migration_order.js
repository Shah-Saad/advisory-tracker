const fs = require('fs');
const path = require('path');

// Analyze migration dependencies
function analyzeMigrations() {
  const migrationsDir = path.join(__dirname, 'backend', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
  
  console.log('🔍 Analyzing Migration Dependencies...\n');
  
  const migrations = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const migration = {
      file,
      creates: [],
      references: [],
      alters: [],
      dependencies: []
    };
    
    // Find created tables
    const createMatches = content.match(/createTable\s*\(\s*['`"]([^'`"]+)['`"]/g) || [];
    createMatches.forEach(match => {
      const tableName = match.match(/['`"]([^'`"]+)['`"]/)[1];
      migration.creates.push(tableName);
    });
    
    // Find table references (foreign keys)
    const refMatches = content.match(/\.references\s*\(\s*['`"]([^'`"]+)['`"]\s*\)\s*\.inTable\s*\(\s*['`"]([^'`"]+)['`"]/g) || [];
    refMatches.forEach(match => {
      const parts = match.match(/\.references\s*\(\s*['`"]([^'`"]+)['`"]\s*\)\s*\.inTable\s*\(\s*['`"]([^'`"]+)['`"]/);
      if (parts) {
        const referencedTable = parts[2];
        migration.references.push(referencedTable);
        migration.dependencies.push(referencedTable);
      }
    });
    
    // Find altered tables
    const alterMatches = content.match(/alterTable\s*\(\s*['`"]([^'`"]+)['`"]/g) || [];
    alterMatches.forEach(match => {
      const tableName = match.match(/['`"]([^'`"]+)['`"]/)[1];
      migration.alters.push(tableName);
      migration.dependencies.push(tableName);
    });
    
    migrations.push(migration);
  });
  
  return migrations;
}

// Sort migrations by dependencies
function sortMigrations(migrations) {
  const sorted = [];
  const remaining = [...migrations];
  const createdTables = new Set();
  
  while (remaining.length > 0) {
    let added = false;
    
    for (let i = remaining.length - 1; i >= 0; i--) {
      const migration = remaining[i];
      
      // Check if all dependencies are satisfied
      const dependenciesSatisfied = migration.dependencies.every(dep => 
        createdTables.has(dep) || migration.creates.includes(dep)
      );
      
      if (dependenciesSatisfied) {
        sorted.push(migration);
        migration.creates.forEach(table => createdTables.add(table));
        remaining.splice(i, 1);
        added = true;
      }
    }
    
    if (!added && remaining.length > 0) {
      console.log('❌ Circular dependency detected or missing table:');
      remaining.forEach(m => {
        console.log(`  ${m.file}:`);
        console.log(`    Creates: ${m.creates.join(', ')}`);
        console.log(`    Needs: ${m.dependencies.join(', ')}`);
        console.log(`    Available: ${Array.from(createdTables).join(', ')}`);
      });
      break;
    }
  }
  
  return sorted;
}

// Generate proper migration names
function generateNewMigrationOrder(sortedMigrations) {
  const baseDate = '20241219';
  const newMigrations = [];
  
  sortedMigrations.forEach((migration, index) => {
    const paddedIndex = String(index + 1).padStart(3, '0');
    const oldName = migration.file;
    const namePart = oldName.split('_').slice(1).join('_').replace('.js', '');
    const newName = `${baseDate}_${paddedIndex}_${namePart}.js`;
    
    newMigrations.push({
      oldName,
      newName,
      creates: migration.creates,
      dependencies: migration.dependencies
    });
  });
  
  return newMigrations;
}

// Main analysis
function main() {
  console.log('🚀 Migration Dependency Analysis and Reordering\n');
  
  const migrations = analyzeMigrations();
  
  console.log('📋 Current Migration Analysis:\n');
  migrations.forEach(m => {
    console.log(`📄 ${m.file}`);
    if (m.creates.length > 0) console.log(`  ✅ Creates: ${m.creates.join(', ')}`);
    if (m.references.length > 0) console.log(`  🔗 References: ${m.references.join(', ')}`);
    if (m.alters.length > 0) console.log(`  ➕ Alters: ${m.alters.join(', ')}`);
    if (m.dependencies.length > 0) console.log(`  🔄 Depends on: ${m.dependencies.join(', ')}`);
    console.log();
  });
  
  const sorted = sortMigrations(migrations);
  
  if (sorted.length === migrations.length) {
    console.log('✅ Successfully sorted migrations!\n');
    
    const newOrder = generateNewMigrationOrder(sorted);
    
    console.log('📝 Recommended Migration Order:\n');
    newOrder.forEach((m, i) => {
      console.log(`${i + 1}. ${m.newName}`);
      console.log(`   (from: ${m.oldName})`);
      if (m.creates.length > 0) console.log(`   Creates: ${m.creates.join(', ')}`);
      console.log();
    });
    
    console.log('\n🔧 Commands to rename files:');
    console.log('# Run these commands in the backend/migrations directory:\n');
    
    // Create temporary names first to avoid conflicts
    newOrder.forEach((m, i) => {
      if (m.oldName !== m.newName) {
        console.log(`mv "${m.oldName}" "temp_${i}_${m.newName}"`);
      }
    });
    
    console.log('\n# Then rename to final names:');
    newOrder.forEach((m, i) => {
      if (m.oldName !== m.newName) {
        console.log(`mv "temp_${i}_${m.newName}" "${m.newName}"`);
      }
    });
    
  } else {
    console.log('❌ Could not resolve all dependencies');
  }
}

main();
