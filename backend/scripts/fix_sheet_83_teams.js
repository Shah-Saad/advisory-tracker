const db = require('../src/config/db');

async function fixSheet83Teams() {
  try {
    console.log('🔧 Fixing Sheet 83 Team Assignments...\n');

    // Step 1: Get team mappings
    console.log('1️⃣ Getting team mappings...');
    const teams = await db('teams').select('*');
    const teamNameToId = {};
    teams.forEach(team => {
      teamNameToId[team.name.toLowerCase()] = team.id;
      teamNameToId[team.name] = team.id;
    });
    console.log('✅ Team mappings:', teamNameToId);

    // Step 2: Fix team assignments for sheet 83
    console.log('\n2️⃣ Fixing team assignments for sheet 83...');
    const sheet83Entries = await db('sheet_entries')
      .where('sheet_id', 83)
      .whereNotNull('assigned_team')
      .select('*');
    
    console.log(`📊 Found ${sheet83Entries.length} entries with team assignments for sheet 83`);
    
    let updatedCount = 0;
    for (const entry of sheet83Entries) {
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

    // Step 3: Verify the fix
    console.log('\n3️⃣ Verifying the fix...');
    const fixedEntries = await db('sheet_entries')
      .where('sheet_id', 83)
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

    // Step 4: Test user access for Distribution team
    console.log('\n4️⃣ Testing user access for Distribution team...');
    const userTeamEntries = await db('sheet_entries')
      .where('sheet_id', 83)
      .where('assigned_team', 41) // Distribution team
      .select('*');
    
    console.log(`📊 Entries for Distribution team (ID: 41): ${userTeamEntries.length}`);
    if (userTeamEntries.length > 0) {
      console.log('📊 Sample entries:');
      userTeamEntries.slice(0, 3).forEach((entry, index) => {
        console.log(`   ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Team: ${entry.assigned_team}`);
      });
    }

    console.log('\n🎉 Sheet 83 team assignments fix completed!');
    console.log('💡 Users should now be able to see their team entries for both sheets.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    process.exit(0);
  }
}

fixSheet83Teams();
