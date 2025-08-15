# Daily Patching Reminder System

## Overview

The daily patching reminder system automatically checks for entries with implementation dates matching today's date and creates notifications for users and admins.

## How It Works

### 1. **Daily Check Trigger**
- **When**: Every time a user logs in or refreshes the page
- **Frequency**: Once per day per user (stored in localStorage)
- **Purpose**: Avoid spam notifications while ensuring timely reminders

### 2. **Automatic Detection**
- Checks `sheet_responses` table for entries with `implementation_date` = today
- Excludes entries with `current_status` = "Completed"
- Creates notifications for both team members and admins

### 3. **Notification Types**
- **Users**: `patching_reminder` notifications only
- **Admins**: `patching_reminder_admin` notifications (plus all other types)

## Implementation Details

### Frontend Components
- **UserNotificationPanel.js**: For regular users
- **AdminNotificationPanel.js**: For admin users

### Backend Components
- **API Endpoint**: `POST /api/notifications/check-patching-reminders`
- **Script**: `implementation_reminder.js` (manual execution)
- **Service**: `NotificationService.js` (filtered notifications)

### Key Features

#### Daily Limit Protection
```javascript
// Check if already run today
const today = new Date().toDateString();
const lastCheckDate = localStorage.getItem('lastPatchingReminderCheck');

if (lastCheckDate === today) {
  console.log('✅ Daily check already completed today');
  return;
}
```

#### Force Check Option
```javascript
// Bypass daily limit for testing
checkPatchingReminders(true); // Force check
```

#### User Notification Filtering
```javascript
// Only show patching_reminder notifications to users
.where('type', 'patching_reminder')
```

## Usage

### For Users
1. **Automatic**: Check runs on page load/refresh (once per day)
2. **Manual**: Click refresh button in notification panel
3. **Force**: Click warning triangle button to bypass daily limit

### For Admins
1. **Automatic**: Same as users
2. **Manual**: Same as users
3. **All Notifications**: Admins see all notification types

### Manual Script Execution
```bash
# Run the patching reminder script manually
node scripts/implementation_reminder.js
```

## Testing

### Test Daily Check
```bash
# Test the daily check functionality
node scripts/test_daily_check.js
```

### Simulate Implementation Date
1. Update an entry's `implementation_date` to today's date
2. Refresh the page or click the force check button
3. Verify notifications appear

## Configuration

### Environment Variables
- No specific environment variables required
- Uses existing database and notification infrastructure

### Database Requirements
- `sheet_responses` table with `implementation_date` column
- `notifications` table for storing reminders
- `users` table with role-based filtering

## Troubleshooting

### Common Issues
1. **No notifications appearing**: Check if implementation dates match today
2. **Daily limit reached**: Use force check button or wait until tomorrow
3. **Route not found**: Ensure backend server is running and routes are registered

### Debug Steps
1. Check browser console for daily check logs
2. Verify localStorage has correct date tracking
3. Test API endpoint directly
4. Check database for notification creation

## Future Enhancements

1. **Scheduled Cron Jobs**: Server-side daily execution
2. **Email Notifications**: SMTP integration for email reminders
3. **Customizable Timing**: Allow users to set reminder preferences
4. **Advanced Filtering**: More granular notification rules
