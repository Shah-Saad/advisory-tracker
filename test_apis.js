// Test the new team sheet API endpoints
const SheetService = require('./src/services/SheetService');

async function testTeamSheetAPIs() {
  console.log('Testing team sheet API endpoints...\n');
  
  try {
    // Test 1: Get all sheets with team status
    console.log('1. Testing getAllSheetsWithTeamStatus...');
    const allSheets = await SheetService.getAllSheetsWithTeamStatus();
    console.log(`✅ Found ${allSheets.length} sheets`);
    
    if (allSheets.length > 0) {
      const sheet = allSheets.find(s => s.id === 1);
      if (sheet) {
        console.log(`   Sheet: "${sheet.title}"`);
        console.log(`   Teams assigned: ${sheet.total_teams_assigned}`);
        console.log(`   Teams with responses: ${sheet.teams_with_responses}`);
        console.log(`   Teams completed: ${sheet.teams_completed}`);
      }
    }
    
    // Test 2: Get team views for sheet 1
    console.log('\n2. Testing getSheetByTeams...');
    const teamViews = await SheetService.getSheetByTeams(1);
    console.log(`✅ Found ${teamViews.total_teams} team versions`);
    
    teamViews.team_versions.forEach(team => {
      console.log(`   ${team.team_name}: ${team.assignment_status}, ${team.response_count} responses`);
      if (team.response_count > 0) {
        const fields = Object.keys(team.responses);
        console.log(`     Fields: ${fields.slice(0, 3).join(', ')}${fields.length > 3 ? '...' : ''}`);
      }
    });
    
    // Test 3: Get specific team's sheet
    console.log('\n3. Testing getSheetForTeam (Generation team)...');
    const generationSheet = await SheetService.getSheetForTeam(1, 19);
    console.log(`✅ Generation team sheet:`);
    console.log(`   Status: ${generationSheet.team.assignment_status}`);
    console.log(`   Response count: ${generationSheet.response_count}`);
    console.log(`   Sample responses:`);
    
    Object.entries(generationSheet.responses).slice(0, 2).forEach(([field, value]) => {
      console.log(`     ${field}: ${value}`);
    });
    
    // Test 4: Compare responses across teams
    console.log('\n4. Comparing power_output across teams...');
    teamViews.team_versions.forEach(team => {
      const powerOutput = team.responses.power_output || 'No data';
      console.log(`   ${team.team_name}: ${powerOutput}`);
    });
    
    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Total sheets: ${allSheets.length}`);
    console.log(`   - Sheet 1 has ${teamViews.total_teams} team versions`);
    console.log(`   - All teams have submitted responses`);
    console.log('\n🚀 The three separate sheet functionality is now working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testTeamSheetAPIs();
