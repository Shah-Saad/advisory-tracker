const db = require('../src/config/db');

async function fixSheet83() {
  try {
    console.log('🔧 Fixing Sheet 83...\n');

    // Step 1: Check Sheet 83
    console.log('1️⃣ Checking Sheet 83...');
    const sheet83 = await db('sheets').where('id', 83).first();
    if (!sheet83) {
      console.log('❌ Sheet 83 not found');
      return;
    }
    
    console.log(`📋 Sheet: ${sheet83.title} (ID: ${sheet83.id})`);
    console.log(`   Status: ${sheet83.status}`);
    console.log(`   File: ${sheet83.file_name || 'No file'}`);
    console.log(`   Created: ${sheet83.created_at}`);

    // Step 2: Check if there are any entries for Sheet 83
    const sheet83Entries = await db('sheet_entries').where('sheet_id', 83).select('*');
    console.log(`📊 Sheet 83 entries: ${sheet83Entries.length}`);

    if (sheet83Entries.length === 0) {
      console.log('❌ Sheet 83 has no entries');
      
      // Step 3: Check if we can copy entries from Sheet 81
      console.log('\n2️⃣ Checking if we can copy entries from Sheet 81...');
      const sheet81Entries = await db('sheet_entries')
        .where('sheet_id', 81)
        .whereNull('assigned_team')
        .select('*');
      
      console.log(`📊 Unassigned entries from Sheet 81: ${sheet81Entries.length}`);
      
      if (sheet81Entries.length > 0) {
        console.log('✅ Found unassigned entries to copy');
        
        // Step 4: Copy entries to Sheet 83
        console.log('\n3️⃣ Copying entries to Sheet 83...');
        const entriesToCopy = sheet81Entries.map(entry => {
          const { id, created_at, updated_at, ...entryData } = entry;
          return {
            ...entryData,
            sheet_id: 83,
            created_at: new Date(),
            updated_at: new Date()
          };
        });
        
        const insertedEntries = await db('sheet_entries')
          .insert(entriesToCopy)
          .returning('*');
        
        console.log(`✅ Copied ${insertedEntries.length} entries to Sheet 83`);
        
        // Step 5: Distribute entries to teams
        console.log('\n4️⃣ Distributing entries to teams...');
        try {
          const SheetEntryService = require('../src/services/SheetEntryService');
          const distributionResult = await SheetEntryService.distributeSheetToTeams(83, 1);
          console.log('✅ Distribution result:', distributionResult);
        } catch (distributionError) {
          console.log('❌ Distribution failed:', distributionError.message);
        }
      } else {
        console.log('❌ No unassigned entries found in Sheet 81');
        
        // Step 6: Try to create sample entries for Sheet 83
        console.log('\n3️⃣ Creating sample entries for Sheet 83...');
        const sampleEntries = [
          {
            sheet_id: 83,
            product_name: 'Sample Product 1',
            oem_vendor: 'Sample Vendor 1',
            source: 'CISA',
            risk_level: 'High',
            cve: 'CVE-2024-0001',
            current_status: 'In Progress',
            comments: 'Sample entry for testing',
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            sheet_id: 83,
            product_name: 'Sample Product 2',
            oem_vendor: 'Sample Vendor 2',
            source: 'CISA',
            risk_level: 'Medium',
            cve: 'CVE-2024-0002',
            current_status: 'Not Started',
            comments: 'Another sample entry',
            created_at: new Date(),
            updated_at: new Date()
          }
        ];
        
        const insertedEntries = await db('sheet_entries')
          .insert(sampleEntries)
          .returning('*');
        
        console.log(`✅ Created ${insertedEntries.length} sample entries for Sheet 83`);
        
        // Step 7: Distribute sample entries to teams
        console.log('\n4️⃣ Distributing sample entries to teams...');
        try {
          const SheetEntryService = require('../src/services/SheetEntryService');
          const distributionResult = await SheetEntryService.distributeSheetToTeams(83, 1);
          console.log('✅ Distribution result:', distributionResult);
        } catch (distributionError) {
          console.log('❌ Distribution failed:', distributionError.message);
        }
      }
    } else {
      console.log('✅ Sheet 83 already has entries');
      
      // Check if entries have team assignments
      const entriesWithTeams = sheet83Entries.filter(e => e.assigned_team);
      console.log(`📊 Entries with team assignments: ${entriesWithTeams.length}`);
      
      if (entriesWithTeams.length === 0) {
        console.log('❌ Entries don\'t have team assignments');
        
        // Distribute existing entries
        console.log('\n2️⃣ Distributing existing entries to teams...');
        try {
          const SheetEntryService = require('../src/services/SheetEntryService');
          const distributionResult = await SheetEntryService.distributeSheetToTeams(83, 1);
          console.log('✅ Distribution result:', distributionResult);
        } catch (distributionError) {
          console.log('❌ Distribution failed:', distributionError.message);
        }
      }
    }

    // Step 8: Verify the fix
    console.log('\n5️⃣ Verifying the fix...');
    const finalEntries = await db('sheet_entries')
      .where('sheet_id', 83)
      .whereNotNull('assigned_team')
      .select('*');
    
    console.log(`📊 Final entries with team assignments: ${finalEntries.length}`);
    
    if (finalEntries.length > 0) {
      const teamCounts = {};
      finalEntries.forEach(entry => {
        teamCounts[entry.assigned_team] = (teamCounts[entry.assigned_team] || 0) + 1;
      });
      
      console.log('📊 Team distribution:');
      for (const [teamId, count] of Object.entries(teamCounts)) {
        const team = await db('teams').where('id', teamId).first();
        console.log(`   - ${team?.name || 'Unknown'} (ID: ${teamId}): ${count} entries`);
      }
    }

    console.log('\n🎉 Sheet 83 fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    process.exit(0);
  }
}

fixSheet83();
