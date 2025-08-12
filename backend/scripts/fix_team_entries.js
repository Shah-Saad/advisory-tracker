const db = require('../src/config/db');

async function fixTeamEntries() {
  try {
    console.log('🔧 Fixing Team Entries...\n');

    // Step 1: Check current state
    console.log('1️⃣ Checking current state...');
    const sheets = await db('sheets').select('*');
    console.log(`✅ Found ${sheets.length} sheets`);
    
    for (const sheet of sheets) {
      console.log(`\n📋 Sheet: ${sheet.title} (ID: ${sheet.id})`);
      
      // Get all entries for this sheet
      const allEntries = await db('sheet_entries').where('sheet_id', sheet.id).select('*');
      console.log(`   Total entries: ${allEntries.length}`);
      
      // Check team assignments
      const entriesWithTeamNames = allEntries.filter(e => e.assigned_team && typeof e.assigned_team === 'string');
      const entriesWithTeamIds = allEntries.filter(e => e.assigned_team && typeof e.assigned_team === 'number');
      const unassignedEntries = allEntries.filter(e => !e.assigned_team && !e.team);
      
      console.log(`   Entries with team names: ${entriesWithTeamNames.length}`);
      console.log(`   Entries with team IDs: ${entriesWithTeamIds.length}`);
      console.log(`   Unassigned entries: ${unassignedEntries.length}`);
      
      if (entriesWithTeamNames.length > 0) {
        const uniqueTeamNames = [...new Set(entriesWithTeamNames.map(e => e.assigned_team))];
        console.log(`   Team names found: ${uniqueTeamNames.join(', ')}`);
      }
    }

    // Step 2: Get team mappings
    console.log('\n2️⃣ Getting team mappings...');
    const teams = await db('teams').select('*');
    const teamNameToId = {};
    teams.forEach(team => {
      teamNameToId[team.name.toLowerCase()] = team.id;
      teamNameToId[team.name] = team.id;
    });
    console.log('✅ Team mappings:', teamNameToId);

    // Step 3: Fix team assignments for sheet 81
    console.log('\n3️⃣ Fixing team assignments for sheet 81...');
    const sheet81Entries = await db('sheet_entries')
      .where('sheet_id', 81)
      .whereNotNull('assigned_team')
      .select('*');
    
    console.log(`📊 Found ${sheet81Entries.length} entries with team assignments for sheet 81`);
    
    let updatedCount = 0;
    for (const entry of sheet81Entries) {
      const teamName = entry.assigned_team;
      const teamId = teamNameToId[teamName] || teamNameToId[teamName.toLowerCase()];
      
      if (teamId && typeof entry.assigned_team === 'string') {
        // Update to use team ID instead of team name
        await db('sheet_entries')
          .where('id', entry.id)
          .update({ 
            assigned_team: teamId,
            updated_at: new Date()
          });
        updatedCount++;
        console.log(`   ✅ Updated entry ${entry.id}: "${teamName}" -> ${teamId}`);
      } else {
        console.log(`   ⚠️ Could not map team name "${teamName}" for entry ${entry.id}`);
      }
    }
    
    console.log(`✅ Updated ${updatedCount} entries`);

    // Step 4: Verify the fix
    console.log('\n4️⃣ Verifying the fix...');
    const fixedEntries = await db('sheet_entries')
      .where('sheet_id', 81)
      .whereNotNull('assigned_team')
      .select('*');
    
    console.log(`📊 Fixed entries: ${fixedEntries.length}`);
    
    const teamCounts = {};
    for (const entry of fixedEntries) {
      const teamId = entry.assigned_team;
      teamCounts[teamId] = (teamCounts[teamId] || 0) + 1;
    }
    
    console.log('📊 Entries per team:');
    for (const [teamId, count] of Object.entries(teamCounts)) {
      const team = teams.find(t => t.id == teamId);
      console.log(`   ${team?.name || 'Unknown'} (ID: ${teamId}): ${count} entries`);
    }

    // Step 5: Test user access
    console.log('\n5️⃣ Testing user access...');
    const userTeamEntries = await db('sheet_entries')
      .where('sheet_id', 81)
      .where('assigned_team', 41) // Distribution team
      .select('*');
    
    console.log(`📊 Entries for Distribution team (ID: 41): ${userTeamEntries.length}`);
    if (userTeamEntries.length > 0) {
      console.log('📊 Sample entries:');
      userTeamEntries.slice(0, 3).forEach((entry, index) => {
        console.log(`   ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Team: ${entry.assigned_team}`);
      });
    }

    console.log('\n🎉 Team entries fix completed!');
    console.log('💡 Users should now be able to see their team entries.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    process.exit(0);
  }
}

fixTeamEntries();
