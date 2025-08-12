const db = require('../src/config/db');

async function checkAllSheets() {
  try {
    console.log('🔍 Checking All Sheets and Entries...\n');

    // Step 1: Check all sheets
    console.log('1️⃣ All sheets in database:');
    const sheets = await db('sheets').select('*').orderBy('created_at', 'desc');
    console.log(`✅ Found ${sheets.length} sheets:`);
    
    for (const sheet of sheets) {
      console.log(`\n📋 Sheet: ${sheet.title} (ID: ${sheet.id})`);
      console.log(`   Status: ${sheet.status}`);
      console.log(`   File: ${sheet.file_name || 'No file'}`);
      console.log(`   Created: ${sheet.created_at}`);
      
      // Check entries for this sheet
      const allEntries = await db('sheet_entries').where('sheet_id', sheet.id).select('*');
      console.log(`   Total entries: ${allEntries.length}`);
      
      if (allEntries.length > 0) {
        // Check team assignments
        const entriesWithTeams = allEntries.filter(e => e.assigned_team);
        const unassignedEntries = allEntries.filter(e => !e.assigned_team);
        
        console.log(`   Entries with team assignments: ${entriesWithTeams.length}`);
        console.log(`   Unassigned entries: ${unassignedEntries.length}`);
        
        if (entriesWithTeams.length > 0) {
          const teamCounts = {};
          entriesWithTeams.forEach(entry => {
            teamCounts[entry.assigned_team] = (teamCounts[entry.assigned_team] || 0) + 1;
          });
          
          console.log('   Team distribution:');
          for (const [teamId, count] of Object.entries(teamCounts)) {
            const team = await db('teams').where('id', teamId).first();
            console.log(`     - ${team?.name || 'Unknown'} (ID: ${teamId}): ${count} entries`);
          }
        }
        
        // Show sample entries
        console.log('   Sample entries:');
        allEntries.slice(0, 3).forEach((entry, index) => {
          console.log(`     ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Team: ${entry.assigned_team || 'None'}`);
        });
      }
    }

    // Step 2: Check team assignments
    console.log('\n2️⃣ Team sheet assignments:');
    const teamAssignments = await db('team_sheets').select('*');
    console.log(`✅ Found ${teamAssignments.length} team assignments:`);
    
    for (const assignment of teamAssignments) {
      const sheet = await db('sheets').where('id', assignment.sheet_id).first();
      const team = await db('teams').where('id', assignment.team_id).first();
      console.log(`   Sheet: ${sheet?.title} (ID: ${assignment.sheet_id}) -> Team: ${team?.name} (ID: ${assignment.team_id}), Status: ${assignment.status}`);
    }

    // Step 3: Check user's team
    console.log('\n3️⃣ Checking user team (Distribution - ID: 41):');
    const userTeamEntries = await db('sheet_entries')
      .where('assigned_team', 41)
      .select('*');
    
    console.log(`✅ Found ${userTeamEntries.length} entries for Distribution team`);
    
    if (userTeamEntries.length > 0) {
      // Group by sheet
      const sheetGroups = {};
      userTeamEntries.forEach(entry => {
        if (!sheetGroups[entry.sheet_id]) {
          sheetGroups[entry.sheet_id] = [];
        }
        sheetGroups[entry.sheet_id].push(entry);
      });
      
      console.log('📊 Entries by sheet:');
      for (const [sheetId, entries] of Object.entries(sheetGroups)) {
        const sheet = await db('sheets').where('id', sheetId).first();
        console.log(`   Sheet: ${sheet?.title} (ID: ${sheetId}): ${entries.length} entries`);
      }
    }

    // Step 4: Check what sheets the user should see
    console.log('\n4️⃣ Sheets user should see:');
    const userTeamSheets = await db('team_sheets')
      .where('team_id', 41)
      .select('*');
    
    console.log(`✅ User should see ${userTeamSheets.length} sheets:`);
    for (const teamSheet of userTeamSheets) {
      const sheet = await db('sheets').where('id', teamSheet.sheet_id).first();
      console.log(`   - ${sheet?.title} (ID: ${teamSheet.sheet_id}), Status: ${teamSheet.status}`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkAllSheets();
