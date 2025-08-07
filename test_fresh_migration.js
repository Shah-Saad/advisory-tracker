const fs = require('fs');
const path = require('path');

// Function to check migration files for potential issues
function checkMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'backend', 'migrations');
  const files = fs.readdirSync(migrationsDir);
  
  console.log('🔍 Checking migration files...\n');
  
  const issues = [];
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const sqlFiles = files.filter(f => f.endsWith('.sql'));
  
  console.log(`Found ${jsFiles.length} JavaScript migration files:`);
  jsFiles.forEach((file, i) => {
    console.log(`  ${i+1}. ${file}`);
  });
  
  if (sqlFiles.length > 0) {
    console.log(`\n❌ Found ${sqlFiles.length} SQL files that won't be processed by Knex:`);
    sqlFiles.forEach((file, i) => {
      console.log(`  ${i+1}. ${file}`);
      issues.push(`SQL file ${file} will be ignored by Knex migrations`);
    });
  }
  
  // Check for naming conflicts
  const names = jsFiles.map(f => f.split('_').slice(1).join('_'));
  const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
  if (duplicates.length > 0) {
    issues.push(`Duplicate migration names found: ${duplicates.join(', ')}`);
  }
  
  // Check migration order
  const sortedFiles = [...jsFiles].sort();
  if (JSON.stringify(jsFiles) !== JSON.stringify(sortedFiles)) {
    issues.push('Migration files are not in chronological order');
  }
  
  return { issues, jsFiles, sqlFiles };
}

// Function to check seed files
function checkSeedFiles() {
  const seedsDir = path.join(__dirname, 'backend', 'seeds');
  const files = fs.readdirSync(seedsDir);
  
  console.log('\n🌱 Checking seed files...\n');
  
  const issues = [];
  const seedFiles = files.filter(f => f.endsWith('.js'));
  
  console.log(`Found ${seedFiles.length} seed files:`);
  seedFiles.forEach((file, i) => {
    console.log(`  ${i+1}. ${file}`);
  });
  
  // Check for multiple versions of similar seeds
  const baseNames = seedFiles.map(f => f.split('_').slice(1).join('_'));
  const duplicateSeeds = baseNames.filter((name, i) => baseNames.indexOf(name) !== i);
  if (duplicateSeeds.length > 0) {
    console.log(`\n⚠️  Multiple versions of similar seeds found:`);
    duplicateSeeds.forEach(name => {
      const matches = seedFiles.filter(f => f.includes(name));
      console.log(`  - ${name}: ${matches.join(', ')}`);
    });
    issues.push('Multiple seed versions may cause conflicts');
  }
  
  return { issues, seedFiles };
}

// Function to check migration file content for potential issues
function checkMigrationContent() {
  const migrationsDir = path.join(__dirname, 'backend', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
  
  console.log('\n📄 Checking migration content for issues...\n');
  
  const issues = [];
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Check for missing exports.down
      if (!content.includes('exports.down')) {
        issues.push(`${file}: Missing exports.down function for rollback`);
      }
      
      // Check for hardcoded values that might cause issues
      if (content.includes('IF NOT EXISTS') && content.includes('knex.schema.createTable')) {
        issues.push(`${file}: Uses both Knex createTable and IF NOT EXISTS - potential conflict`);
      }
      
      // Check for direct SQL that might not be cross-database compatible
      if (content.includes('knex.raw') && content.includes('SERIAL')) {
        console.log(`  ℹ️  ${file}: Uses PostgreSQL-specific SERIAL type`);
      }
      
    } catch (error) {
      issues.push(`${file}: Cannot read file - ${error.message}`);
    }
  });
  
  return issues;
}

// Main check function
function checkForFreshInstall() {
  console.log('🚀 Advisory Tracker - Migration Readiness Check\n');
  console.log('This checks if the migration files will work for a fresh installation.\n');
  
  const migrationCheck = checkMigrationFiles();
  const seedCheck = checkSeedFiles();
  const contentIssues = checkMigrationContent();
  
  const allIssues = [...migrationCheck.issues, ...seedCheck.issues, ...contentIssues];
  
  console.log('\n📋 Summary:\n');
  
  if (allIssues.length === 0) {
    console.log('✅ No issues found! Migrations should run cleanly on a fresh database.\n');
    console.log('📝 To set up a fresh database:');
    console.log('   1. Create a new PostgreSQL database');
    console.log('   2. Update .env with database credentials');
    console.log('   3. Run: npm run migrate');
    console.log('   4. Run: npm run seed');
  } else {
    console.log('❌ Issues found that may prevent clean migration:\n');
    allIssues.forEach((issue, i) => {
      console.log(`   ${i+1}. ${issue}`);
    });
    
    console.log('\n🔧 Recommended fixes:');
    if (migrationCheck.sqlFiles.length > 0) {
      console.log('   - Convert SQL files to JavaScript migrations or remove them');
    }
    if (seedCheck.issues.length > 0) {
      console.log('   - Remove duplicate seed files or consolidate them');
    }
  }
  
  console.log('\n📊 File counts:');
  console.log(`   - JavaScript migrations: ${migrationCheck.jsFiles.length}`);
  console.log(`   - SQL files (ignored): ${migrationCheck.sqlFiles.length}`);
  console.log(`   - Seed files: ${seedCheck.seedFiles.length}`);
}

checkForFreshInstall();
