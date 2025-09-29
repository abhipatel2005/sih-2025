const nodemailer = require('nodemailer');
const { google } = require('googleapis');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.adminEmails = [];
    this.oauth2Client = null;
    this.setupTransporter();
  }

  async setupTransporter() {
    try {
      // Admin emails for notifications
      this.adminEmails = process.env.ADMIN_EMAILS ? 
        process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : 
        [];

      // Check if OAuth2 credentials are available
      if (process.env.GOOGLE_CLIENT_ID && 
          process.env.GOOGLE_CLIENT_SECRET && 
          process.env.GOOGLE_REFRESH_TOKEN && 
          process.env.EMAIL_USER) {
        
        await this.setupGoogleOAuth2();
        
      } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Fallback to traditional authentication
        console.log('⚠️ Using traditional email authentication (consider switching to OAuth2)');
        const emailConfig = {
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
        
        this.transporter = nodemailer.createTransport(emailConfig);
        this.isConfigured = true;
        console.log('✅ Email service configured with traditional auth');
        
      } else {
        console.log('⚠️ Email service not configured - missing OAuth2 or traditional auth credentials');
        console.log('📝 For OAuth2, provide: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, EMAIL_USER');
        console.log('📝 For traditional auth, provide: EMAIL_USER, EMAIL_PASS');
      }
    } catch (error) {
      console.error('❌ Email service setup failed:', error.message);
    }
  }

  async setupGoogleOAuth2() {
    try {
      // Create OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground' // Redirect URI
      );

      // Set refresh token
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      // Get access token
      const accessToken = await this.oauth2Client.getAccessToken();

      // Create nodemailer transporter with OAuth2
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken.token,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully with Google OAuth2');
      
      // Verify the configuration
      await this.transporter.verify();
      console.log('✅ Email service verified successfully');
      
    } catch (error) {
      console.error('❌ Google OAuth2 setup failed:', error.message);
      throw error;
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.isConfigured) {
      console.log('📧 Email not sent - service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"Attendee System" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendLowAttendanceNotification(user, hoursWorked, date) {
    const subject = `Low Attendance Alert - ${date.toDateString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d73027;">⚠️ Low Attendance Alert</h2>
        <p>Dear ${user.name},</p>
        <p>We noticed that your attendance for <strong>${date.toDateString()}</strong> was below the required 2 hours.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0; color: #6c757d;">Attendance Summary</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date.toDateString()}</p>
          <p style="margin: 5px 0;"><strong>Hours Worked:</strong> ${hoursWorked.toFixed(2)} hours</p>
          <p style="margin: 5px 0;"><strong>Required:</strong> 2.00 hours</p>
          <p style="margin: 5px 0;"><strong>Deficit:</strong> ${(2 - hoursWorked).toFixed(2)} hours</p>
        </div>
        
        <p>Please ensure you meet the minimum attendance requirements. If you have any questions or concerns, please contact your supervisor.</p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="font-size: 12px; color: #6c757d;">
          This is an automated message from the Attendee System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendAdminLowAttendanceReport(lowAttendanceUsers, date) {
    if (this.adminEmails.length === 0) {
      console.log('⚠️ No admin emails configured for notifications');
      return { success: false, error: 'No admin emails configured' };
    }

    const subject = `Daily Low Attendance Report - ${date.toDateString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #d73027;">📊 Daily Low Attendance Report</h2>
        <p><strong>Date:</strong> ${date.toDateString()}</p>
        <p><strong>Users with Low Attendance:</strong> ${lowAttendanceUsers.length}</p>
        
        ${lowAttendanceUsers.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Name</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Email</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Hours Worked</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Deficit</th>
              </tr>
            </thead>
            <tbody>
              ${lowAttendanceUsers.map(user => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${user.name}</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${user.email}</td>
                  <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">${user.hoursWorked.toFixed(2)}</td>
                  <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6; color: #d73027;">${(2 - user.hoursWorked).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ✅ Great! All users met the minimum 2-hour attendance requirement.
          </div>
        `}
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="font-size: 12px; color: #6c757d;">
          This is an automated report from the Attendee System.<br>
          Generated at ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    return await this.sendEmail(this.adminEmails, subject, html);
  }

  async sendIncompleteSessionNotification(user, incompleteSessions, date) {
    const subject = `Incomplete Session Alert - ${date.toDateString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #fd7e14;">⏰ Incomplete Session Alert</h2>
        <p>Dear ${user.name},</p>
        <p>You have incomplete sessions that were automatically cleaned up at 10 PM.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0; color: #856404;">Removed Sessions</h3>
          ${incompleteSessions.map(session => `
            <p style="margin: 5px 0;">
              <strong>Entry Time:</strong> ${new Date(session.entryTime).toLocaleTimeString()}
              <span style="color: #dc3545;">(No exit time recorded)</span>
            </p>
          `).join('')}
        </div>
        
        <p>Please remember to check out when leaving to ensure accurate attendance tracking.</p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="font-size: 12px; color: #6c757d;">
          This is an automated message from the Attendee System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendPasswordEmail(userEmail, userName, newPassword) {
    const subject = `Your Login Password - Attendee System`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🔐 Your Login Password</h2>
        <p>Hello ${userName},</p>
        <p>As requested, here is your login password for the Attendee System.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your Password</h3>
          <p style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; letter-spacing: 2px;">
            ${newPassword}
          </p>
        </div>
        
        <p><strong>Important Notes:</strong></p>
        <ul style="color: #6b7280;">
          <li>Use this password to log into your account</li>
          <li>For security, consider changing this password after logging in</li>
          <li>Keep this password secure and don't share it with anyone</li>
        </ul>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Security Reminder:</strong> If you did not request this password, 
            please contact your system administrator immediately.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af;">
          This is an automated message from the Attendee System.<br>
          Please do not reply to this email. For support, contact your system administrator.
        </p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
  }
}

module.exports = new EmailService();
