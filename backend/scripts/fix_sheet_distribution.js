const db = require('../src/config/db');

async function fixSheetDistribution() {
  try {
    console.log('🔧 Fixing Sheet Distribution...\n');

    // Get all teams
    const teams = await db('teams').where('is_active', true).select('*');
    console.log(`📊 Found ${teams.length} active teams:`, teams.map(t => `${t.name} (ID: ${t.id})`));

    // Get all sheets
    const sheets = await db('sheets').select('*').orderBy('id');
    console.log(`📊 Found ${sheets.length} sheets`);

    for (const sheet of sheets) {
      console.log(`\n📋 Processing sheet: ${sheet.title} (ID: ${sheet.id})`);
      
      // Check if sheet has entries
      const entries = await db('sheet_entries')
        .where('sheet_id', sheet.id)
        .select('*');
      
      console.log(`   📊 Total entries: ${entries.length}`);
      
      if (entries.length === 0) {
        console.log(`   ⚠️ No entries found for this sheet`);
        continue;
      }

      // Check team_sheets assignments
      const teamSheets = await db('team_sheets')
        .where('sheet_id', sheet.id)
        .select('*');
      
      console.log(`   📊 Team sheet assignments: ${teamSheets.length}`);
      
      if (teamSheets.length === 0) {
        console.log(`   ⚠️ No team assignments found for this sheet`);
        continue;
      }

      // For each team assignment, create entries
      for (const teamSheet of teamSheets) {
        console.log(`   🔧 Processing team ${teamSheet.team_id}...`);
        
        // Check if entries already exist for this team
        const existingEntries = await db('sheet_entries')
          .where('sheet_id', sheet.id)
          .where('assigned_team', teamSheet.team_id)
          .select('id');
        
        if (existingEntries.length > 0) {
          console.log(`   ✅ Team ${teamSheet.team_id} already has ${existingEntries.length} entries`);
          continue;
        }

        // Get the original entries (those with null assigned_team or assigned to the first team)
        const originalEntries = await db('sheet_entries')
          .where('sheet_id', sheet.id)
          .where(function() {
            this.whereNull('assigned_team')
                .orWhere('assigned_team', teamSheets[0].team_id);
          })
          .select('*');
        
        console.log(`   📊 Found ${originalEntries.length} original entries to copy`);
        
        // Create copies for this team
        const entriesToInsert = originalEntries.map(entry => ({
          sheet_id: entry.sheet_id,
          assigned_team: teamSheet.team_id.toString(), // Convert to string
          product_name: entry.product_name,
          oem_vendor: entry.oem_vendor,
          source: entry.source,
          risk_level: entry.risk_level,
          cve: entry.cve,
          site: entry.site,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        if (entriesToInsert.length > 0) {
          await db('sheet_entries').insert(entriesToInsert);
          console.log(`   ✅ Created ${entriesToInsert.length} entries for team ${teamSheet.team_id}`);
        }
      }

      // Clean up: remove entries with null assigned_team
      const nullEntries = await db('sheet_entries')
        .where('sheet_id', sheet.id)
        .whereNull('assigned_team')
        .select('id');
      
      if (nullEntries.length > 0) {
        await db('sheet_entries')
          .where('sheet_id', sheet.id)
          .whereNull('assigned_team')
          .del();
        console.log(`   🧹 Removed ${nullEntries.length} entries with null assigned_team`);
      }
    }

    console.log('\n🎉 Sheet distribution fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    process.exit(0);
  }
}

fixSheetDistribution();
