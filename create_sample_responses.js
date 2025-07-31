// Create sample team responses with the correct JSONB structure
const SheetResponse = require('./src/models/SheetResponse');
const db = require('./src/config/db');

async function createSampleResponses() {
  console.log('Creating sample team responses...');
  
  try {
    const sheetId = 1;
    
    // Verify team assignments exist
    const teamSheets = await db('team_sheets').where({ sheet_id: sheetId });
    console.log(`Found ${teamSheets.length} team assignments for sheet ${sheetId}`);
    
    if (teamSheets.length === 0) {
      console.log('No team assignments found. Creating them...');
      
      const assignments = [
        { sheet_id: sheetId, team_id: 19, status: 'assigned', assigned_by: 1, assigned_at: new Date() },
        { sheet_id: sheetId, team_id: 20, status: 'assigned', assigned_by: 1, assigned_at: new Date() },
        { sheet_id: sheetId, team_id: 21, status: 'assigned', assigned_by: 1, assigned_at: new Date() }
      ];
      
      await db('team_sheets').insert(assignments);
      console.log('✅ Created team assignments');
    }
    
    // Create sample responses using the corrected method
    console.log('Creating sample responses...');
    
    // Generation team responses
    const generationResponses = [
      { field_name: 'power_output', field_value: '850 MW' },
      { field_name: 'maintenance_status', field_value: 'Scheduled maintenance completed' },
      { field_name: 'fuel_consumption', field_value: '120 tons coal' },
      { field_name: 'efficiency_rate', field_value: '92%' }
    ];
    
    await SheetResponse.saveTeamResponse(sheetId, 19, generationResponses, 5); // saad
    console.log('✅ Created Generation team responses');
    
    // Distribution team responses  
    const distributionResponses = [
      { field_name: 'power_output', field_value: '820 MW' },
      { field_name: 'maintenance_status', field_value: 'Routine inspection ongoing' },
      { field_name: 'network_load', field_value: '75% capacity' },
      { field_name: 'outage_reports', field_value: '2 minor outages resolved' }
    ];
    
    await SheetResponse.saveTeamResponse(sheetId, 20, distributionResponses, 6); // sarfaraz
    console.log('✅ Created Distribution team responses');
    
    // Transmission team responses
    const transmissionResponses = [
      { field_name: 'power_output', field_value: '800 MW' },
      { field_name: 'maintenance_status', field_value: 'All systems operational' },
      { field_name: 'line_voltage', field_value: '400 kV nominal' },
      { field_name: 'grid_stability', field_value: 'Stable - no issues' }
    ];
    
    await SheetResponse.saveTeamResponse(sheetId, 21, transmissionResponses, 7); // mansoor
    console.log('✅ Created Transmission team responses');
    
    // Update team sheet statuses
    console.log('Updating team assignment statuses...');
    
    await db('team_sheets').where({ sheet_id: sheetId, team_id: 19 }).update({ 
      status: 'completed',
      completed_at: new Date(),
      completed_by: 5
    });
    
    await db('team_sheets').where({ sheet_id: sheetId, team_id: 20 }).update({ 
      status: 'in_progress',
      started_at: new Date(),
      started_by: 6
    });
    
    console.log('✅ Updated team assignment statuses');
    
    // Update sheet status
    await db('sheets').where({ id: sheetId }).update({ 
      status: 'distributed',
      distributed_at: new Date()
    });
    console.log('✅ Updated sheet status to distributed');
    
    // Verify the setup
    console.log('\nVerifying setup...');
    const responses = await db('sheet_responses')
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .where('team_sheets.sheet_id', sheetId)
      .select('teams.name as team_name', 'sheet_responses.response_data');
    
    console.log('\n📊 Created responses:');
    responses.forEach(response => {
      const fieldCount = Object.keys(response.response_data || {}).length;
      console.log(`- ${response.team_name}: ${fieldCount} fields`);
    });
    
    console.log('\n🎉 Sample data created successfully!');
    console.log('\nTest the API endpoints:');
    console.log('- GET /api/sheets/team-status-summary');
    console.log('- GET /api/sheets/1/team-views');
    console.log('- GET /api/sheets/1/team/19 (Generation)');
    console.log('- GET /api/sheets/1/team/20 (Distribution)');
    console.log('- GET /api/sheets/1/team/21 (Transmission)');
    
  } catch (error) {
    console.error('❌ Error creating sample responses:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

createSampleResponses();
