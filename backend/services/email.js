/**
 * Srinidhi Eye Care Hospital — Notification Service
 * Sends new patient OPD appointment alerts to the hospital reception / administration.
 * Gangavathi, Koppal District, Karnataka
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
 * Sends notification email about a new OPD appointment enquiry
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
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #C7D2FE; border-radius: 8px; background-color: #F8FAFC;">
        <h2 style="color: #0369A1; margin-top: 0;">🏥 New Patient OPD Appointment — Srinidhi Eye Care</h2>
        <p style="color: #334155; font-size: 15px;">A new patient consultation enquiry has been submitted through the hospital website:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #FFFFFF; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #64748B; width: 35%;">Patient Name:</td>
            <td style="padding: 12px 16px; color: #0F172A; font-weight: 600;">${customer_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #64748B;">Contact Number:</td>
            <td style="padding: 12px 16px;"><a href="tel:${phone}" style="color: #0284C7; text-decoration: none; font-weight: bold;">${phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #64748B;">Speciality / Dept:</td>
            <td style="padding: 12px 16px; color: #0F172A; font-weight: 600;">${service}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #64748B;">Preferred Date:</td>
            <td style="padding: 12px 16px; color: #0F172A;">${preferred_date}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #64748B;">Preferred Time:</td>
            <td style="padding: 12px 16px; color: #0F172A;">${preferred_time}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #64748B;">Symptoms / Notes:</td>
            <td style="padding: 12px 16px; color: #0F172A;">${message ? message : '<em>No additional notes</em>'}</td>
          </tr>
        </table>

        <p style="color: #475569; font-size: 13px; line-height: 1.5;">
          <strong>Action Required:</strong> Call the patient directly at <a href="tel:${phone}" style="color: #0284C7; font-weight: bold;">${phone}</a> to assign Doctor &amp; Token Number.
        </p>
        <p style="color: #94A3B8; font-size: 11px; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 12px;">
          Enquiry ID: ${id} &bull; Srinidhi Eye Care Hospital &bull; Hospital Road, Gangavathi, Karnataka - 583227
        </p>
      </div>
    `;

    const info = await mailer.sendMail({
      from: `"Srinidhi Eye Care" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: `New Patient OPD: ${customer_name} - ${service} (${preferred_date})`,
      html: htmlContent
    });

    console.log(`[NOTIFICATIONS] Email alert dispatched for patient enquiry ${id}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to send email alert:', error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendNewEnquiryNotification
};
