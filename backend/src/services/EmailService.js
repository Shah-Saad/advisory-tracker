const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create reusable transporter object using SMTP transport
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to other services like Outlook, Yahoo, etc.
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD  // Your email password or app-specific password
      }
    });
  }

  /**
   * Send email notification
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - HTML content of the email
   * @param {string} text - Plain text content (optional)
   */
  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"Advisory Tracker" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send entry update notification to admin
   * @param {Object} entry - The updated entry object
   * @param {Object} user - The user who made the update
   * @param {string} adminEmail - Admin email address
   */
  async sendEntryUpdateNotification(entry, user, adminEmail) {
    const subject = `Entry Updated - ${entry.product_name || 'Advisory Entry'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          📝 Entry Update Notification
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Entry Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Product Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.product_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">OEM/Vendor:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.oem_vendor || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Risk Level:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                <span style="background-color: ${this.getRiskLevelColor(entry.risk_level)}; color: white; padding: 2px 8px; border-radius: 3px;">
                  ${entry.risk_level || 'Unknown'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Deployed in KE:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.deployed_in_ke || 'Unknown'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">CVE:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entry.cve || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Update Information:</h3>
          <p><strong>Updated by:</strong> ${user.username || user.email}</p>
          <p><strong>User Role:</strong> ${user.role}</p>
          <p><strong>Update Time:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Action Required:</strong> Please review this entry update in the Advisory Tracker system.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View in Advisory Tracker
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
          <p>This is an automated notification from the Advisory Tracker System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const text = `
Entry Update Notification

Entry Details:
- Product Name: ${entry.product_name || 'N/A'}
- OEM/Vendor: ${entry.oem_vendor || 'N/A'}
- Risk Level: ${entry.risk_level || 'Unknown'}
- Deployed in KE: ${entry.deployed_in_ke || 'Unknown'}
- CVE: ${entry.cve || 'N/A'}

Updated by: ${user.username || user.email} (${user.role})
Update Time: ${new Date().toLocaleString()}

Please review this entry update in the Advisory Tracker system.
    `;

    return await this.sendEmail(adminEmail, subject, html, text);
  }

  /**
   * Send welcome notification to user
   * @param {Object} user - User object
   */
  async sendWelcomeNotification(user) {
    const subject = 'Welcome to Advisory Tracker';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
          🎉 Welcome to Advisory Tracker!
        </h2>
        
        <p>Hello ${user.username || user.email},</p>
        
        <p>Your account has been successfully created in the Advisory Tracker system.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">Account Details:</h3>
          <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Advisory Tracker
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
          <p>This is an automated notification from the Advisory Tracker System.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send sheet submission notification to admins
   * @param {Object} sheet - The submitted sheet
   * @param {Object} team - The team that submitted
   * @param {Object} user - The user who submitted
   * @param {string} adminEmail - Admin email address
   */
  async sendSheetSubmissionNotification(sheet, team, user, adminEmail) {
    const subject = `Sheet Submitted - ${sheet.title} by ${team.name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
          📋 Sheet Submission Notification
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">Sheet Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Sheet Title:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sheet.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Team:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${team.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Submitted By:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${user.username || user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Submission Time:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>✅ Sheet Successfully Submitted:</strong> The team has completed their assessment and submitted the sheet for review.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin/team-sheets/${sheet.id}/${team.name.toLowerCase()}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Submission
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
          <p>This is an automated notification from the Advisory Tracker System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const text = `
Sheet Submission Notification

Sheet Details:
- Sheet Title: ${sheet.title}
- Team: ${team.name}
- Submitted By: ${user.username || user.email}
- Submission Time: ${new Date().toLocaleString()}

The team has successfully submitted their sheet for review.

Please review the submission in the Advisory Tracker system.
    `;

    return await this.sendEmail(adminEmail, subject, html, text);
  }

  /**
   * Send sheet unlock notification to team members
   * @param {Object} sheet - The unlocked sheet
   * @param {Object} team - The team
   * @param {Object} admin - The admin who unlocked
   * @param {string} reason - Unlock reason
   * @param {string} teamMemberEmail - Team member email
   */
  async sendSheetUnlockNotification(sheet, team, admin, reason, teamMemberEmail) {
    const subject = `Sheet Unlocked - ${sheet.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
          🔓 Sheet Unlocked Notification
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #ffc107; margin-top: 0;">Sheet Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Sheet Title:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sheet.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Team:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${team.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Unlocked By:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${admin.username || admin.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Unlock Time:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Reason:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reason}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>🔓 Sheet Unlocked:</strong> Your team can now continue working on this sheet. Please review and update your responses as needed.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/team-sheets/${sheet.id}" 
             style="background-color: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Continue Working
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
          <p>This is an automated notification from the Advisory Tracker System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const text = `
Sheet Unlocked Notification

Sheet Details:
- Sheet Title: ${sheet.title}
- Team: ${team.name}
- Unlocked By: ${admin.username || admin.email}
- Unlock Time: ${new Date().toLocaleString()}
- Reason: ${reason}

Your team can now continue working on this sheet. Please review and update your responses as needed.

Access the sheet in the Advisory Tracker system.
    `;

    return await this.sendEmail(teamMemberEmail, subject, html, text);
  }

  /**
   * Send team assignment notification
   * @param {Object} sheet - The assigned sheet
   * @param {Object} team - The team
   * @param {string} teamMemberEmail - Team member email
   */
  async sendTeamAssignmentNotification(sheet, team, teamMemberEmail) {
    const subject = `New Sheet Assignment - ${sheet.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          📋 New Sheet Assignment
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Assignment Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Sheet Title:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sheet.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Team:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${team.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Assigned At:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Status:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                <span style="background-color: #007bff; color: white; padding: 2px 8px; border-radius: 3px;">
                  Assigned
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #0c5460;">
            <strong>📋 New Assignment:</strong> Your team has been assigned a new sheet to work on. Please review the requirements and begin your assessment.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/team-sheets/${sheet.id}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Working
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
          <p>This is an automated notification from the Advisory Tracker System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const text = `
New Sheet Assignment

Assignment Details:
- Sheet Title: ${sheet.title}
- Team: ${team.name}
- Assigned At: ${new Date().toLocaleString()}
- Status: Assigned

Your team has been assigned a new sheet to work on. Please review the requirements and begin your assessment.

Access the sheet in the Advisory Tracker system.
    `;

    return await this.sendEmail(teamMemberEmail, subject, html, text);
  }

  /**
   * Get risk level color for styling
   * @param {string} riskLevel - Risk level
   */
  getRiskLevelColor(riskLevel) {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }
}

module.exports = new EmailService();
