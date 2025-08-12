# Email Notification Setup Guide

## Overview
The Advisory Tracker system includes comprehensive email notification functionality that automatically sends emails to admins when important events occur.

## Current Email Notifications

### 1. Entry Update Notifications
- **Trigger**: When a user updates an entry
- **Recipients**: All admin users
- **Content**: Entry details, user info, risk level, update time
- **Action**: Direct link to view in Advisory Tracker

### 2. Welcome Notifications
- **Trigger**: When a new user account is created
- **Recipients**: New user
- **Content**: Account details, login information
- **Action**: Direct link to access Advisory Tracker

### 3. Sheet Submission Notifications
- **Trigger**: When a team submits a sheet
- **Recipients**: All admin users
- **Content**: Team name, sheet title, response count
- **Action**: Direct link to view submission

### 4. Sheet Unlock Notifications
- **Trigger**: When an admin unlocks a completed sheet
- **Recipients**: Team members and other admins
- **Content**: Unlock reason, admin info, team details
- **Action**: Direct link to view sheet

## Setup Instructions

### Step 1: Environment Variables
Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3001

# Alternative SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=your-email@gmail.com
```

### Step 2: Gmail App Password Setup
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use this password in `EMAIL_PASSWORD`

### Step 3: Test Email Configuration
Run the email test script:
```bash
node scripts/test_email.js
```

## Email Templates

### Entry Update Email
- Professional HTML template
- Risk level color coding
- Entry details table
- User information
- Direct action button

### Welcome Email
- Branded welcome message
- Account details
- System access link
- Professional styling

## Customization Options

### 1. Add New Email Types
To add a new email notification type:

1. Add method to `EmailService.js`:
```javascript
async sendCustomNotification(data) {
  const subject = 'Custom Notification';
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Custom Notification</h2>
      <p>${data.message}</p>
    </div>
  `;
  return await this.sendEmail(data.to, subject, html);
}
```

2. Call it from your service:
```javascript
await EmailService.sendCustomNotification({
  to: adminEmail,
  message: 'Custom message here'
});
```

### 2. Modify Email Templates
Edit the HTML templates in `EmailService.js` to match your branding.

### 3. Add Email Preferences
Create a user preferences system to allow users to opt-in/out of specific email types.

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check if 2FA is enabled
   - Verify app password is correct
   - Ensure less secure apps access is disabled

2. **Emails Not Sending**
   - Check environment variables
   - Verify SMTP settings
   - Check console logs for errors

3. **Emails Going to Spam**
   - Use a professional email address
   - Include proper headers
   - Avoid spam trigger words

### Testing
Use the test script to verify email functionality:
```bash
node scripts/test_email.js
```

## Security Considerations

1. **Environment Variables**: Never commit email credentials to version control
2. **Rate Limiting**: Implement rate limiting for email sending
3. **Validation**: Validate email addresses before sending
4. **Logging**: Log email sending for audit purposes

## Performance Optimization

1. **Async Processing**: Use background jobs for email sending
2. **Batching**: Send multiple emails in batches
3. **Caching**: Cache email templates
4. **Queue System**: Implement email queue for high volume

## Monitoring

Monitor email delivery:
- Check email service logs
- Track delivery rates
- Monitor bounce rates
- Set up alerts for failures
