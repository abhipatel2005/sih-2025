const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.adminEmails = [];
    this.setupTransporter();
  }

  setupTransporter() {
    try {
      // Check for email configuration in environment variables
      const emailConfig = {
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      // Admin emails for notifications
      this.adminEmails = process.env.ADMIN_EMAILS ? 
        process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : 
        [];

      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransporter(emailConfig);
        this.isConfigured = true;
        console.log('✅ Email service configured successfully');
      } else {
        console.log('⚠️ Email service not configured - missing EMAIL_USER or EMAIL_PASS');
      }
    } catch (error) {
      console.error('❌ Email service setup failed:', error.message);
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
