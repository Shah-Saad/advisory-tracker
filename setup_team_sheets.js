// Script to set up team sheet functionality with sample data
const SheetService = require('./src/services/SheetService');
const SheetResponse = require('./src/models/SheetResponse');
const db = require('./src/config/db');

async function setupTeamSheets() {
  console.log('Setting up team sheet functionality...');
  
  try {
    // Step 1: Distribute sheet ID 1 to teams
    console.log('\n1. Distributing sheet to teams...');
    const sheetId = 1;
    const distributedBy = 1; // Admin user ID
    const teamIds = [19, 20, 21]; // generation, distribution, transmission
    
    const assignments = await SheetService.distributeSheetToTeams(sheetId, teamIds, distributedBy);
    console.log(`✅ Sheet distributed to ${assignments.length} teams`);
    
    // Step 2: Create sample responses for each team
    console.log('\n2. Creating sample responses...');
    
    // Generation team responses
    const generationResponses = [
      { field_name: 'power_output', field_value: '850 MW', field_type: 'number' },
      { field_name: 'maintenance_status', field_value: 'Scheduled maintenance completed', field_type: 'text' },
      { field_name: 'fuel_consumption', field_value: '120 tons coal', field_type: 'text' },
      { field_name: 'efficiency_rate', field_value: '92%', field_type: 'percentage' }
    ];
    
    await SheetResponse.saveTeamResponse(sheetId, 19, generationResponses, 2); // User ID 2
    console.log('✅ Generated sample responses for Generation team');
    
    // Distribution team responses  
    const distributionResponses = [
      { field_name: 'power_output', field_value: '820 MW', field_type: 'number' },
      { field_name: 'maintenance_status', field_value: 'Routine inspection ongoing', field_type: 'text' },
      { field_name: 'network_load', field_value: '75% capacity', field_type: 'percentage' },
      { field_name: 'outage_reports', field_value: '2 minor outages resolved', field_type: 'text' }
    ];
    
    await SheetResponse.saveTeamResponse(sheetId, 20, distributionResponses, 3); // User ID 3
    console.log('✅ Generated sample responses for Distribution team');
    
    // Transmission team responses
    const transmissionResponses = [
      { field_name: 'power_output', field_value: '800 MW', field_type: 'number' },
      { field_name: 'maintenance_status', field_value: 'All systems operational', field_type: 'text' },
      { field_name: 'line_voltage', field_value: '400 kV nominal', field_type: 'text' },
      { field_name: 'grid_stability', field_value: 'Stable - no issues', field_type: 'text' }
    ];
    
    await SheetResponse.saveTeamResponse(sheetId, 21, transmissionResponses, 4); // User ID 4
    console.log('✅ Generated sample responses for Transmission team');
    
    // Step 3: Update team sheet statuses
    console.log('\n3. Updating team sheet statuses...');
    
    // Mark generation as completed
    await db('team_sheets').where({ sheet_id: sheetId, team_id: 19 }).update({ 
      status: 'completed',
      completed_at: new Date()
    });
    
    // Mark distribution as in_progress
    await db('team_sheets').where({ sheet_id: sheetId, team_id: 20 }).update({ 
      status: 'in_progress'
    });
    
    // Keep transmission as assigned (default)
    console.log('✅ Updated team sheet statuses');
    
    // Step 4: Test the new endpoints
    console.log('\n4. Testing new endpoints...');
    
    // Test team views
    const teamViews = await SheetService.getSheetByTeams(sheetId);
    console.log(`✅ getSheetByTeams: Found ${teamViews.total_teams} team versions`);
    
    // Test specific team view
    const generationSheet = await SheetService.getSheetForTeam(sheetId, 19);
    console.log(`✅ getSheetForTeam: Generation team has ${generationSheet.response_count} responses`);
    
    // Test all sheets with team status
    const allSheets = await SheetService.getAllSheetsWithTeamStatus();
    console.log(`✅ getAllSheetsWithTeamStatus: Found ${allSheets.length} sheets`);
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNow you can test the team sheet endpoints:');
    console.log('- GET /api/sheets/team-status-summary');
    console.log('- GET /api/sheets/1/team-views');
    console.log('- GET /api/sheets/1/team/19 (Generation)');
    console.log('- GET /api/sheets/1/team/20 (Distribution)');
    console.log('- GET /api/sheets/1/team/21 (Transmission)');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

// Run the setup
setupTeamSheets();
