const db = require('../src/config/db');

async function testTeamAssignment() {
  try {
    console.log('🧪 Testing Team Assignment...\n');

    // Step 1: Check all sheets
    console.log('1️⃣ Checking all sheets...');
    const sheets = await db('sheets').select('*').orderBy('created_at', 'desc');
    console.log(`✅ Found ${sheets.length} sheets:`);
    
    for (const sheet of sheets) {
      console.log(`\n📋 Sheet: ${sheet.title} (ID: ${sheet.id})`);
      console.log(`   Status: ${sheet.status}`);
      console.log(`   File: ${sheet.file_name || 'No file'}`);
      console.log(`   Created: ${sheet.created_at}`);
      
      // Check entries for this sheet
      const entries = await db('sheet_entries').where('sheet_id', sheet.id).select('*');
      console.log(`   Total entries: ${entries.length}`);
      
      // Check team assignments
      const teamAssignments = await db('team_sheets').where('sheet_id', sheet.id).select('*');
      console.log(`   Team assignments: ${teamAssignments.length}`);
      
      if (teamAssignments.length > 0) {
        for (const assignment of teamAssignments) {
          const team = await db('teams').where('id', assignment.team_id).first();
          console.log(`     - Team: ${team?.name || 'Unknown'} (ID: ${assignment.team_id}), Status: ${assignment.status}`);
        }
      }
      
      // Check entry team assignments
      const entriesWithTeams = entries.filter(entry => entry.assigned_team || entry.team);
      console.log(`   Entries with team assignment: ${entriesWithTeams.length}`);
      
      if (entriesWithTeams.length > 0) {
        const uniqueTeams = [...new Set(entriesWithTeams.map(e => e.assigned_team || e.team))];
        console.log(`   Unique team assignments: ${uniqueTeams.join(', ')}`);
      }
    }

    // Step 2: Check specific sheet that should have entries
    console.log('\n2️⃣ Checking specific sheet with entries...');
    const sheetWithEntries = await db('sheets').where('id', 81).first();
    if (sheetWithEntries) {
      console.log(`📋 Sheet: ${sheetWithEntries.title} (ID: ${sheetWithEntries.id})`);
      
      const entries = await db('sheet_entries').where('sheet_id', 81).select('*');
      console.log(`📊 Total entries: ${entries.length}`);
      
      // Check if entries have team assignments
      const entriesWithTeamAssignments = entries.filter(entry => entry.assigned_team || entry.team);
      console.log(`📊 Entries with team assignments: ${entriesWithTeamAssignments.length}`);
      
      if (entriesWithTeamAssignments.length === 0) {
        console.log('❌ No entries have team assignments!');
        console.log('📊 Sample entries:');
        entries.slice(0, 3).forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Assigned Team: ${entry.assigned_team || entry.team || 'None'}`);
        });
      } else {
        console.log('✅ Entries have team assignments');
        const uniqueTeams = [...new Set(entriesWithTeamAssignments.map(e => e.assigned_team || e.team))];
        console.log(`📊 Teams assigned: ${uniqueTeams.join(', ')}`);
      }
    }

    // Step 3: Check team distribution process
    console.log('\n3️⃣ Checking team distribution...');
    try {
      const SheetEntryService = require('../src/services/SheetEntryService');
      
      // Try to distribute entries for sheet 81
      console.log('🔄 Attempting to distribute entries for sheet 81...');
      const distributionResult = await SheetEntryService.distributeSheetToTeams(81, 1);
      console.log('✅ Distribution result:', distributionResult);
    } catch (distributionError) {
      console.log('❌ Distribution failed:', distributionError.message);
    }

    // Step 4: Check if entries need to be manually assigned to teams
    console.log('\n4️⃣ Checking if manual team assignment is needed...');
    const unassignedEntries = await db('sheet_entries')
      .where('sheet_id', 81)
      .whereNull('assigned_team')
      .whereNull('team')
      .select('*');
    
    console.log(`📊 Unassigned entries: ${unassignedEntries.length}`);
    
    if (unassignedEntries.length > 0) {
      console.log('📊 Sample unassigned entries:');
      unassignedEntries.slice(0, 3).forEach((entry, index) => {
        console.log(`   ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Vendor: ${entry.oem_vendor}`);
      });
      
      // Get teams
      const teams = await db('teams').select('*');
      console.log(`📊 Available teams: ${teams.map(t => `${t.name} (ID: ${t.id})`).join(', ')}`);
      
      // Suggest manual assignment
      console.log('\n💡 Suggestion: Entries need to be manually assigned to teams');
      console.log('   You can either:');
      console.log('   1. Update the sheet upload process to assign teams automatically');
      console.log('   2. Manually assign entries to teams in the database');
      console.log('   3. Use the distribution API to assign entries to teams');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testTeamAssignment();
