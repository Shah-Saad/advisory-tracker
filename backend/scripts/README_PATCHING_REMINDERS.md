# Patching Reminder System

## Overview
The patching reminder system automatically sends notifications to both admin users and team members when entries have a `patching_est_release_date` that matches the current date.

## How It Works

### 1. Daily Check
The system checks for entries where:
- `patching_est_release_date` = today's date
- `current_status` ≠ "Completed" (excludes already patched entries)

### 2. Notification Recipients
- **Admin Users**: All users with admin role receive notifications for all due entries
- **Team Members**: Users from the team responsible for each entry receive notifications

### 3. Notification Content
Each notification includes:
- Product name and vendor
- Patching due date
- Current status
- Team name (for admin notifications)
- Action required message

## Files

### `scheduled_patching_reminder.js`
- Main script for sending patching reminders
- Can be run manually or scheduled as a cron job
- Exports `sendScheduledPatchingReminders()` function

## Usage

### Manual Execution
```bash
node scripts/scheduled_patching_reminder.js
```

### Cron Job Setup (Recommended)
Add to your crontab to run daily at 9:00 AM:
```bash
0 9 * * * cd /path/to/backend && node scripts/scheduled_patching_reminder.js
```

### Programmatic Usage
```javascript
const { sendScheduledPatchingReminders } = require('./scripts/scheduled_patching_reminder');

// Send reminders
await sendScheduledPatchingReminders();
```

## Frontend Integration

### Notification Display
- Patching reminders are displayed with special styling (warning colors)
- Include product name, vendor, due date, and current status
- Show warning icon to distinguish from regular notifications

### User Actions
Users can:
1. View the entry details in the notification
2. Navigate to the sheet to update status or patching date
3. Mark notifications as read

## Database Schema

### Relevant Tables
- `sheet_responses`: Contains `patching_est_release_date` and `current_status`
- `sheet_entries`: Contains product and vendor information
- `team_sheets`: Links responses to teams
- `teams`: Team information
- `users`: User information and roles
- `notifications`: Stores the reminder notifications

### Key Fields
- `patching_est_release_date`: Date when patching is expected
- `current_status`: Current status of the entry
- `assigned_team`: Team responsible for the entry

## Configuration

### Notification Types
- Type: `patching_reminder`
- Title: "Patching Reminder - Action Required"
- Message: Customized based on recipient (admin vs team member)

### Exclusions
- Entries with `current_status = "Completed"` are excluded
- Only active team assignments are considered

## Troubleshooting

### Common Issues
1. **No notifications sent**: Check if there are entries with today's patching date
2. **Missing admin notifications**: Verify admin users exist and have correct role
3. **Missing team notifications**: Check team assignments and user team relationships

### Debug Commands
```bash
# Check for entries due today
node -e "
const db = require('./src/config/db');
db('sheet_responses as sr')
  .join('sheet_entries as se', 'sr.original_entry_id', 'se.id')
  .where('sr.patching_est_release_date', new Date().toISOString().split('T')[0])
  .whereNot('sr.current_status', 'Completed')
  .select('se.product_name', 'sr.patching_est_release_date', 'sr.current_status')
  .then(entries => {
    console.log('Entries due today:', entries);
    process.exit(0);
  });
"
```

## Future Enhancements
- Email notifications in addition to in-app notifications
- Escalation reminders for overdue entries
- Customizable reminder schedules
- Integration with external ticketing systems
