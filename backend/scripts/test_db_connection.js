const db = require('../src/config/db');

async function testDatabaseConnection() {
  try {
    console.log('🧪 Testing Database Connection...\n');

    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const result = await db.raw('SELECT 1 as test');
    console.log('✅ Database connection successful:', result.rows[0]);

    // Test 2: Check teams table
    console.log('\n2️⃣ Checking teams table...');
    const teams = await db('teams').select('*');
    console.log(`✅ Found ${teams.length} teams:`);
    teams.forEach(team => {
      console.log(`   - ID: ${team.id}, Name: ${team.name}`);
    });

    // Test 3: Check sheets table
    console.log('\n3️⃣ Checking sheets table...');
    const sheets = await db('sheets').select('id', 'title', 'status').limit(5);
    console.log(`✅ Found ${sheets.length} sheets:`);
    sheets.forEach(sheet => {
      console.log(`   - ID: ${sheet.id}, Title: ${sheet.title}, Status: ${sheet.status}`);
    });

    // Test 4: Check team_sheets table
    console.log('\n4️⃣ Checking team_sheets table...');
    const teamSheets = await db('team_sheets')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .join('sheets', 'team_sheets.sheet_id', 'sheets.id')
      .select('team_sheets.*', 'teams.name as team_name', 'sheets.title as sheet_title')
      .limit(5);
    console.log(`✅ Found ${teamSheets.length} team sheet assignments:`);
    teamSheets.forEach(assignment => {
      console.log(`   - Team: ${assignment.team_name}, Sheet: ${assignment.sheet_title}, Status: ${assignment.status}`);
    });

    console.log('\n🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabaseConnection();
