// Simplified setup script for team sheets
const db = require('./src/config/db');

async function simpleSetup() {
  console.log('Starting simple team sheet setup...');
  
  try {
    const sheetId = 1;
    const distributedBy = 1;
    
    // Step 1: Create team assignments directly
    console.log('1. Creating team assignments...');
    
    const assignments = [
      { sheet_id: sheetId, team_id: 19, status: 'assigned', assigned_by: distributedBy, assigned_at: new Date() },
      { sheet_id: sheetId, team_id: 20, status: 'assigned', assigned_by: distributedBy, assigned_at: new Date() },
      { sheet_id: sheetId, team_id: 21, status: 'assigned', assigned_by: distributedBy, assigned_at: new Date() }
    ];
    
    // Check if assignments already exist
    for (const assignment of assignments) {
      const existing = await db('team_sheets')
        .where({ sheet_id: assignment.sheet_id, team_id: assignment.team_id })
        .first();
      
      if (!existing) {
        await db('team_sheets').insert(assignment);
        console.log(`✅ Assigned sheet to team ${assignment.team_id}`);
      } else {
        console.log(`⚠️  Sheet already assigned to team ${assignment.team_id}`);
      }
    }
    
    // Step 2: Create sample responses
    console.log('2. Creating sample responses...');
    
    const responses = [
      // Generation team (19)
      { sheet_id: sheetId, team_id: 19, field_name: 'power_output', field_value: '850 MW', field_type: 'number', submitted_by: 2, submitted_at: new Date() },
      { sheet_id: sheetId, team_id: 19, field_name: 'maintenance_status', field_value: 'Scheduled maintenance completed', field_type: 'text', submitted_by: 2, submitted_at: new Date() },
      
      // Distribution team (20)
      { sheet_id: sheetId, team_id: 20, field_name: 'power_output', field_value: '820 MW', field_type: 'number', submitted_by: 3, submitted_at: new Date() },
      { sheet_id: sheetId, team_id: 20, field_name: 'maintenance_status', field_value: 'Routine inspection ongoing', field_type: 'text', submitted_by: 3, submitted_at: new Date() },
      
      // Transmission team (21)
      { sheet_id: sheetId, team_id: 21, field_name: 'power_output', field_value: '800 MW', field_type: 'number', submitted_by: 4, submitted_at: new Date() },
      { sheet_id: sheetId, team_id: 21, field_name: 'maintenance_status', field_value: 'All systems operational', field_type: 'text', submitted_by: 4, submitted_at: new Date() }
    ];
    
    // Delete existing responses first
    await db('sheet_responses').where({ sheet_id: sheetId }).del();
    
    // Insert new responses
    await db('sheet_responses').insert(responses);
    console.log(`✅ Created ${responses.length} sample responses`);
    
    // Step 3: Update sheet status
    console.log('3. Updating sheet status...');
    await db('sheets').where({ id: sheetId }).update({ 
      status: 'distributed',
      distributed_at: new Date()
    });
    console.log('✅ Updated sheet status to distributed');
    
    // Step 4: Verify setup
    console.log('4. Verifying setup...');
    
    const teamSheets = await db('team_sheets').where({ sheet_id: sheetId }).count('* as count').first();
    const sheetResponses = await db('sheet_responses').where({ sheet_id: sheetId }).count('* as count').first();
    
    console.log(`✅ Team assignments: ${teamSheets.count}`);
    console.log(`✅ Sheet responses: ${sheetResponses.count}`);
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nYou can now test the endpoints:');
    console.log('- GET /api/sheets/team-status-summary');
    console.log('- GET /api/sheets/1/team-views');
    console.log('- GET /api/sheets/1/team/19');
    console.log('- GET /api/sheets/1/team/20');
    console.log('- GET /api/sheets/1/team/21');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

simpleSetup();
