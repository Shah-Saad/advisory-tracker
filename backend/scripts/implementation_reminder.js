const axios = require('axios');
const db = require('../src/config/db');
const NotificationService = require('../src/services/NotificationService');
const EmailService = require('../src/services/EmailService');

async function checkImplementationDates() {
  try {
    console.log('🔍 Checking implementation dates for patching reminders...\n');

    // Get current date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`📅 Today's date: ${todayString}`);

    // Query for responses with implementation_date matching today
    const responses = await db('sheet_responses as sr')
      .join('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
      .join('teams as t', 'ts.team_id', 't.id')
      .join('sheets as s', 'ts.sheet_id', 's.id')
      .join('users as u', 'sr.updated_by', 'u.id')
      .where('sr.implementation_date', todayString)
      .whereNotNull('sr.implementation_date')
      .select(
        'sr.id as response_id',
        'sr.implementation_date',
        'sr.current_status',
        'sr.comments',
        'sr.updated_by',
        't.id as team_id',
        't.name as team_name',
        's.title as sheet_title',
        'u.username as user_name',
        'u.email as user_email'
      );

    console.log(`📊 Found ${responses.length} responses with implementation date today`);

    if (responses.length === 0) {
      console.log('✅ No reminders needed today');
      return;
    }

    // Group responses by team for better organization
    const teamResponses = {};
    responses.forEach(response => {
      if (!teamResponses[response.team_id]) {
        teamResponses[response.team_id] = {
          team_name: response.team_name,
          responses: []
        };
      }
      teamResponses[response.team_id].responses.push(response);
    });

    // Send notifications and emails for each team
    for (const [teamId, teamData] of Object.entries(teamResponses)) {
      console.log(`\n📧 Processing team: ${teamData.team_name} (${teamData.responses.length} responses)`);

      // Get all users in this team
      const teamUsers = await db('users')
        .where('team_id', teamId)
        .select('id', 'username', 'email');

      // Send notifications to team members
      for (const user of teamUsers) {
        try {
          // Create notification for team member
          await NotificationService.createNotification({
            user_id: user.id,
            type: 'patching_reminder',
            title: 'Patching Reminder',
            message: `Today is the implementation date for ${teamData.responses.length} patching task(s) in sheet "${teamData.responses[0].sheet_title}". Please review and update the status.`,
            data: {
              team_id: teamId,
              team_name: teamData.team_name,
              response_count: teamData.responses.length,
              sheet_title: teamData.responses[0].sheet_title,
              implementation_date: todayString,
              action: 'patching_reminder'
            }
          });

          console.log(`✅ Notification sent to team member: ${user.username}`);

          // Send email to team member
          try {
            await EmailService.sendEmail({
              to: user.email,
              subject: 'Patching Reminder - Implementation Date Today',
              html: `
                <h2>Patching Reminder</h2>
                <p>Hello ${user.username},</p>
                <p>Today (${todayString}) is the implementation date for <strong>${teamData.responses.length} patching task(s)</strong> in sheet "${teamData.responses[0].sheet_title}".</p>
                <p>Please review and update the status of these tasks in the Advisory Tracker system.</p>
                <p><strong>Team:</strong> ${teamData.team_name}</p>
                <p><strong>Sheet:</strong> ${teamData.responses[0].sheet_title}</p>
                <p>Thank you for your attention to this matter.</p>
              `
            });
            console.log(`📧 Email sent to team member: ${user.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${user.email}:`, emailError.message);
          }

        } catch (notificationError) {
          console.error(`❌ Failed to send notification to ${user.username}:`, notificationError.message);
        }
      }

      // Send notifications to admins
      try {
        const admins = await db('users as u')
          .join('roles as r', 'u.role_id', 'r.id')
          .where('r.name', 'admin')
          .select('u.id', 'u.username', 'u.email');

        for (const admin of admins) {
          try {
            // Create notification for admin
            await NotificationService.createNotification({
              user_id: admin.id,
              type: 'patching_reminder_admin',
              title: 'Patching Reminder - Admin Alert',
              message: `Team ${teamData.team_name} has ${teamData.responses.length} patching task(s) with implementation date today in sheet "${teamData.responses[0].sheet_title}".`,
              data: {
                team_id: teamId,
                team_name: teamData.team_name,
                response_count: teamData.responses.length,
                sheet_title: teamData.responses[0].sheet_title,
                implementation_date: todayString,
                action: 'patching_reminder_admin'
              }
            });

            console.log(`✅ Admin notification sent to: ${admin.username}`);

            // Send email to admin
            try {
              await EmailService.sendEmail({
                to: admin.email,
                subject: 'Patching Reminder - Admin Alert',
                html: `
                  <h2>Patching Reminder - Admin Alert</h2>
                  <p>Hello ${admin.username},</p>
                  <p>Team <strong>${teamData.team_name}</strong> has <strong>${teamData.responses.length} patching task(s)</strong> with implementation date today (${todayString}) in sheet "${teamData.responses[0].sheet_title}".</p>
                  <p>Please monitor the progress and ensure timely completion.</p>
                  <p><strong>Team:</strong> ${teamData.team_name}</p>
                  <p><strong>Sheet:</strong> ${teamData.responses[0].sheet_title}</p>
                  <p><strong>Implementation Date:</strong> ${todayString}</p>
                  <p>You can review the details in the Advisory Tracker admin dashboard.</p>
                `
              });
              console.log(`📧 Admin email sent to: ${admin.email}`);
            } catch (emailError) {
              console.error(`❌ Failed to send admin email to ${admin.email}:`, emailError.message);
            }

          } catch (adminNotificationError) {
            console.error(`❌ Failed to send admin notification to ${admin.username}:`, adminNotificationError.message);
          }
        }
      } catch (adminError) {
        console.error('❌ Failed to get admin users:', adminError.message);
      }
    }

    console.log('\n🎉 Implementation date reminder process completed!');
    console.log(`📊 Summary: ${responses.length} responses processed, notifications sent to team members and admins`);

  } catch (error) {
    console.error('❌ Error checking implementation dates:', error);
    throw error;
  }
}

// Function to check for upcoming implementation dates (within next 7 days)
async function checkUpcomingImplementationDates() {
  try {
    console.log('🔍 Checking upcoming implementation dates (next 7 days)...\n');

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const todayString = today.toISOString().split('T')[0];
    const nextWeekString = nextWeek.toISOString().split('T')[0];
    
    console.log(`📅 Date range: ${todayString} to ${nextWeekString}`);

    // Query for responses with implementation_date in the next 7 days
    const responses = await db('sheet_responses as sr')
      .join('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
      .join('teams as t', 'ts.team_id', 't.id')
      .join('sheets as s', 'ts.sheet_id', 's.id')
      .join('users as u', 'sr.updated_by', 'u.id')
      .whereBetween('sr.implementation_date', [todayString, nextWeekString])
      .whereNotNull('sr.implementation_date')
      .select(
        'sr.id as response_id',
        'sr.implementation_date',
        'sr.current_status',
        'sr.comments',
        'sr.updated_by',
        't.id as team_id',
        't.name as team_name',
        's.title as sheet_title',
        'u.username as user_name',
        'u.email as user_email'
      );

    console.log(`📊 Found ${responses.length} responses with implementation date in next 7 days`);

    if (responses.length === 0) {
      console.log('✅ No upcoming reminders needed');
      return;
    }

    // Group by implementation date
    const dateGroups = {};
    responses.forEach(response => {
      if (!dateGroups[response.implementation_date]) {
        dateGroups[response.implementation_date] = [];
      }
      dateGroups[response.implementation_date].push(response);
    });

    // Send weekly summary to admins
    const admins = await db('users as u')
      .join('roles as r', 'u.role_id', 'r.id')
      .where('r.name', 'admin')
      .select('u.id', 'u.username', 'u.email');

    for (const admin of admins) {
      try {
        let summaryHtml = `
          <h2>Weekly Patching Implementation Summary</h2>
          <p>Hello ${admin.username},</p>
          <p>Here's a summary of upcoming patching implementations for the next 7 days:</p>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 8px;">Date</th>
              <th style="padding: 8px;">Team</th>
              <th style="padding: 8px;">Sheet</th>
              <th style="padding: 8px;">Tasks</th>
            </tr>
        `;

        for (const [date, dateResponses] of Object.entries(dateGroups)) {
          const teamGroups = {};
          dateResponses.forEach(response => {
            if (!teamGroups[response.team_name]) {
              teamGroups[response.team_name] = [];
            }
            teamGroups[response.team_name].push(response);
          });

          for (const [teamName, teamResponses] of Object.entries(teamGroups)) {
            const sheetGroups = {};
            teamResponses.forEach(response => {
              if (!sheetGroups[response.sheet_title]) {
                sheetGroups[response.sheet_title] = [];
              }
              sheetGroups[response.sheet_title].push(response);
            });

            for (const [sheetTitle, sheetResponses] of Object.entries(sheetGroups)) {
              summaryHtml += `
                <tr>
                  <td style="padding: 8px;">${date}</td>
                  <td style="padding: 8px;">${teamName}</td>
                  <td style="padding: 8px;">${sheetTitle}</td>
                  <td style="padding: 8px;">${sheetResponses.length}</td>
                </tr>
              `;
            }
          }
        }

        summaryHtml += `
          </table>
          <p>Please ensure teams are prepared for these implementations.</p>
        `;

        await EmailService.sendEmail({
          to: admin.email,
          subject: 'Weekly Patching Implementation Summary',
          html: summaryHtml
        });

        console.log(`📧 Weekly summary sent to admin: ${admin.email}`);

      } catch (emailError) {
        console.error(`❌ Failed to send weekly summary to ${admin.email}:`, emailError.message);
      }
    }

    console.log('\n🎉 Weekly implementation date check completed!');

  } catch (error) {
    console.error('❌ Error checking upcoming implementation dates:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Implementation Date Reminder System...\n');

    // Check today's implementation dates
    await checkImplementationDates();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Check upcoming implementation dates (weekly summary)
    await checkUpcomingImplementationDates();

    console.log('\n✅ All reminder checks completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reminder system failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkImplementationDates,
  checkUpcomingImplementationDates
};
