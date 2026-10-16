/**
 * Salon Perimeter Shimoga — Notification Service
 * Sends new appointment enquiry alerts to the salon owner if SMTP is configured.
 * Does not block or fail customer enquiries if email delivery is disabled or fails.
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const isEnabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (isEnabled && smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  return transporter;
}

/**
 * Sends notification email about a new appointment enquiry
 * @param {object} appointment
 */
async function sendNewEnquiryNotification(appointment) {
  try {
    const isEnabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';
    if (!isEnabled) {
      return { sent: false, reason: 'Email notifications disabled via EMAIL_NOTIFICATIONS_ENABLED' };
    }

    const mailer = getTransporter();
    if (!mailer) {
      console.log('[NOTIFICATIONS] SMTP not configured. Skipping email dispatch.');
      return { sent: false, reason: 'SMTP not configured' };
    }

    const recipient = process.env.NOTIFICATION_RECIPIENT || process.env.SMTP_USER;
    const { customer_name, phone, service, preferred_date, preferred_time, message, id } = appointment;

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E1D9; border-radius: 8px; background-color: #FAF7F2;">
        <h2 style="color: #A85A65; margin-top: 0;">✨ New Appointment Enquiry — Salon Perimeter Shimoga</h2>
        <p style="color: #4E4540; font-size: 15px;">A new customer appointment enquiry has been submitted through the website:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #FFFFFF; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <tr style="border-bottom: 1px solid #F0ECE6;">
            <td style="padding: 12px 16px; font-weight: bold; color: #736962; width: 35%;">Customer Name:</td>
            <td style="padding: 12px 16px; color: #1F1B18; font-weight: 600;">${customer_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F0ECE6;">
            <td style="padding: 12px 16px; font-weight: bold; color: #736962;">Phone Number:</td>
            <td style="padding: 12px 16px;"><a href="tel:${phone}" style="color: #A85A65; text-decoration: none; font-weight: bold;">${phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #F0ECE6;">
            <td style="padding: 12px 16px; font-weight: bold; color: #736962;">Requested Service:</td>
            <td style="padding: 12px 16px; color: #1F1B18;">${service}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F0ECE6;">
            <td style="padding: 12px 16px; font-weight: bold; color: #736962;">Preferred Date:</td>
            <td style="padding: 12px 16px; color: #1F1B18;">${preferred_date}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F0ECE6;">
            <td style="padding: 12px 16px; font-weight: bold; color: #736962;">Preferred Time:</td>
            <td style="padding: 12px 16px; color: #1F1B18;">${preferred_time}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #736962;">Client Notes:</td>
            <td style="padding: 12px 16px; color: #1F1B18;">${message ? message : '<em>None</em>'}</td>
          </tr>
        </table>

        <p style="color: #736962; font-size: 13px; line-height: 1.5;">
          <strong>Next Action:</strong> Call the client directly at <a href="tel:${phone}" style="color: #A85A65;">${phone}</a> to confirm staff schedule and booking availability.
        </p>
        <p style="color: #9C938C; font-size: 11px; margin-top: 24px; border-top: 1px solid #E8E1D9; padding-top: 12px;">
          Enquiry ID: ${id} &bull; Salon Perimeter Shimoga &bull; Sharavathi Nagar Main Road
        </p>
      </div>
    `;

    const info = await mailer.sendMail({
      from: `"Salon Perimeter" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: `New Enquiry: ${customer_name} - ${service} (${preferred_date})`,
      html: htmlContent
    });

    console.log(`[NOTIFICATIONS] Email alert dispatched for enquiry ${id}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to send email alert:', error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendNewEnquiryNotification
};
