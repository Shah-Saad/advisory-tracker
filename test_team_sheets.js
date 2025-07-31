// Test script for the new team-specific sheet endpoints
const SheetService = require('./src/services/SheetService');

async function testTeamSheetFeatures() {
  console.log('Testing team-specific sheet features...');
  
  try {
    // Test 1: Get all sheets with team status
    console.log('\n1. Testing getAllSheetsWithTeamStatus...');
    const sheetsWithTeamStatus = await SheetService.getAllSheetsWithTeamStatus();
    console.log(`Found ${sheetsWithTeamStatus.length} sheets`);
    
    if (sheetsWithTeamStatus.length > 0) {
      const firstSheet = sheetsWithTeamStatus[0];
      console.log(`First sheet: ${firstSheet.title}`);
      console.log(`Teams assigned: ${firstSheet.total_teams_assigned}`);
      console.log(`Teams with responses: ${firstSheet.teams_with_responses}`);
      console.log(`Teams completed: ${firstSheet.teams_completed}`);
      
      // Test 2: Get team views for the first sheet
      if (firstSheet.id) {
        console.log('\n2. Testing getSheetByTeams...');
        const teamViews = await SheetService.getSheetByTeams(firstSheet.id);
        console.log(`Sheet: ${teamViews.sheet.title}`);
        console.log(`Total team versions: ${teamViews.total_teams}`);
        
        teamViews.team_versions.forEach(teamView => {
          console.log(`- Team: ${teamView.team_name}, Status: ${teamView.assignment_status}, Responses: ${teamView.response_count}`);
        });
        
        // Test 3: Get specific team's sheet if any teams exist
        if (teamViews.team_versions.length > 0) {
          const firstTeam = teamViews.team_versions[0];
          console.log('\n3. Testing getSheetForTeam...');
          const teamSheet = await SheetService.getSheetForTeam(firstSheet.id, firstTeam.team_id);
          console.log(`Team sheet for: ${teamSheet.team.team_name}`);
          console.log(`Assignment status: ${teamSheet.team.assignment_status}`);
          console.log(`Response count: ${teamSheet.response_count}`);
        }
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testTeamSheetFeatures().then(() => {
  console.log('\nTest script finished.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
