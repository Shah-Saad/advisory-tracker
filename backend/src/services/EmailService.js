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
