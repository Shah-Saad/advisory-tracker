const db = require('../src/config/db');

async function testTeamData() {
  try {
    console.log('🧪 Testing Team Data...\n');

    // Step 1: Check teams table
    console.log('1️⃣ Checking teams table...');
    const teams = await db('teams').select('*');
    console.log(`✅ Found ${teams.length} teams:`);
    teams.forEach(team => {
      console.log(`   - ID: ${team.id}, Name: ${team.name}`);
    });

    // Step 2: Check team_sheets table
    console.log('\n2️⃣ Checking team_sheets table...');
    const teamSheets = await db('team_sheets').select('*');
    console.log(`✅ Found ${teamSheets.length} team sheet assignments:`);
    teamSheets.forEach(ts => {
      console.log(`   - Sheet ID: ${ts.sheet_id}, Team ID: ${ts.team_id}, Status: ${ts.status}`);
    });

    // Step 3: Check team_sheets with team names
    console.log('\n3️⃣ Checking team_sheets with team names...');
    const teamSheetsWithNames = await db('team_sheets')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .select('team_sheets.*', 'teams.name as team_name');
    
    console.log(`✅ Found ${teamSheetsWithNames.length} team sheet assignments with names:`);
    teamSheetsWithNames.forEach(ts => {
      console.log(`   - Sheet ID: ${ts.sheet_id}, Team: ${ts.team_name} (ID: ${ts.team_id}), Status: ${ts.status}`);
    });

    // Step 4: Check sheets table
    console.log('\n4️⃣ Checking sheets table...');
    const sheets = await db('sheets').select('*');
    console.log(`✅ Found ${sheets.length} sheets:`);
    sheets.forEach(sheet => {
      console.log(`   - ID: ${sheet.id}, Title: ${sheet.title}, Status: ${sheet.status}`);
    });

    // Step 5: Test the getAllSheetsWithTeamStatus query directly
    console.log('\n5️⃣ Testing getAllSheetsWithTeamStatus query...');
    const sheetsWithTeamStatus = await db('sheets')
      .select('*');
    
    for (const sheet of sheetsWithTeamStatus) {
      console.log(`\n📋 Sheet: ${sheet.title} (ID: ${sheet.id})`);
      
      const teamAssignments = await db('team_sheets')
        .join('teams', 'team_sheets.team_id', 'teams.id')
        .where('team_sheets.sheet_id', sheet.id)
        .select(
          'teams.id as team_id',
          'teams.name as team_name',
          'team_sheets.status',
          'team_sheets.assigned_at',
          'team_sheets.completed_at'
        );

      console.log(`   Teams (${teamAssignments.length}):`);
      teamAssignments.forEach(assignment => {
        console.log(`   - ${assignment.team_name} (ID: ${assignment.team_id}): ${assignment.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testTeamData();

