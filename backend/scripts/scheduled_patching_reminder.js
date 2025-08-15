const db = require('../src/config/db');
const NotificationService = require('../src/services/NotificationService');

async function sendScheduledPatchingReminders() {
  try {
    console.log('🔔 Running Scheduled Patching Reminders...\n');

    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`📅 Date: ${todayString}`);

    // Find entries with patching_est_release_date matching today
    const entriesDueToday = await db('sheet_responses as sr')
      .join('sheet_entries as se', 'sr.original_entry_id', 'se.id')
      .join('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
      .join('teams as t', 'ts.team_id', 't.id')
      .where('sr.patching_est_release_date', todayString)
      .whereNot('sr.current_status', 'Completed') // Exclude already completed entries
      .select(
        'sr.id as response_id',
        'sr.original_entry_id',
        'sr.patching_est_release_date',
        'sr.current_status',
        'se.product_name',
        'se.oem_vendor',
        'ts.sheet_id',
        'ts.team_id',
        't.name as team_name'
      );

    if (entriesDueToday.length === 0) {
      console.log('ℹ️ No entries due for patching today');
      return;
    }

    console.log(`Found ${entriesDueToday.length} entries due for patching today`);

    // Get admin users
    const adminUsers = await db('users as u')
      .join('roles as r', 'u.role_id', 'r.id')
      .where('r.name', 'admin')
      .select('u.id', 'u.email');

    // Get team users for affected teams
    const affectedTeams = [...new Set(entriesDueToday.map(entry => entry.team_id))];
    const teamUsers = await db('users')
      .whereIn('team_id', affectedTeams)
      .select('id', 'email', 'team_id');

    // Send notifications to admins
    for (const admin of adminUsers) {
      for (const entry of entriesDueToday) {
        const notificationData = {
          entry_id: entry.original_entry_id,
          response_id: entry.response_id,
          sheet_id: entry.sheet_id,
          team_id: entry.team_id,
          team_name: entry.team_name,
          product_name: entry.product_name,
          vendor: entry.oem_vendor,
          patching_date: entry.patching_est_release_date,
          current_status: entry.current_status,
          type: 'patching_reminder'
        };

        await NotificationService.createNotification({
          admin_id: admin.id,
          type: 'patching_reminder',
          title: 'Patching Reminder - Action Required',
          message: `Entry "${entry.product_name}" (${entry.oem_vendor}) from ${entry.team_name} is due for patching today. Please check if the status should be updated to "Completed" or if a new patching date is needed.`,
          data: JSON.stringify(notificationData)
        });
      }
    }

    // Send notifications to team users
    for (const entry of entriesDueToday) {
      const teamMembers = teamUsers.filter(user => user.team_id === entry.team_id);
      
      for (const member of teamMembers) {
        const notificationData = {
          entry_id: entry.original_entry_id,
          response_id: entry.response_id,
          sheet_id: entry.sheet_id,
          team_id: entry.team_id,
          team_name: entry.team_name,
          product_name: entry.product_name,
          vendor: entry.oem_vendor,
          patching_date: entry.patching_est_release_date,
          current_status: entry.current_status,
          type: 'patching_reminder'
        };

        await NotificationService.createNotification({
          user_id: member.id,
          type: 'patching_reminder',
          title: 'Patching Reminder - Action Required',
          message: `Entry "${entry.product_name}" (${entry.oem_vendor}) is due for patching today. Please update the status to "Completed" if patched, or provide a new patching date if delayed.`,
          data: JSON.stringify(notificationData)
        });
      }
    }

    console.log(`✅ Sent ${adminUsers.length * entriesDueToday.length} admin notifications`);
    console.log(`✅ Sent ${teamUsers.length * entriesDueToday.length} team notifications`);
    console.log(`✅ Total notifications sent: ${(adminUsers.length + teamUsers.length) * entriesDueToday.length}`);

  } catch (error) {
    console.error('❌ Scheduled patching reminders failed:', error);
    throw error;
  }
}

// Export for use as a module
module.exports = { sendScheduledPatchingReminders };

// Run if called directly
if (require.main === module) {
  sendScheduledPatchingReminders()
    .then(() => {
      console.log('🎉 Scheduled patching reminders completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Scheduled patching reminders failed:', error);
      process.exit(1);
    });
}
