const db = require('../src/config/db');

async function checkTrackingRecords() {
  try {
    console.log('🔍 Checking tracking records...\n');

    // Check tracking records for team 41
    const tracking = await db('edited_entries_tracking as eet')
      .join('users as u', 'eet.user_id', 'u.id')
      .where('u.team_id', 41)
      .where('eet.sheet_id', 85)
      .select('eet.entry_id', 'eet.user_id', 'u.team_id', 'u.username')
      .limit(10);

    console.log('📊 Tracking records for team 41:');
    tracking.forEach(t => {
      console.log(`   Entry: ${t.entry_id}, User: ${t.user_id} (${t.username}), Team: ${t.team_id}`);
    });

    // Check what team each entry is actually assigned to
    if (tracking.length > 0) {
      console.log('\n📊 Checking team assignments for tracked entries:');
      for (const record of tracking.slice(0, 5)) {
        const entry = await db('sheet_entries')
          .where('id', record.entry_id)
          .select('id', 'assigned_team', 'product_name')
          .first();
        
        if (entry) {
          console.log(`   Entry ${entry.id}: Assigned to Team ${entry.assigned_team}, Product: ${entry.product_name}`);
        }
      }
    }

    console.log('\n🎉 Tracking records check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkTrackingRecords();
