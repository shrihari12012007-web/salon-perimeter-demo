/**
 * Salon Perimeter Shimoga — Public Appointment Enquiry API
 * Endpoint: POST /api/appointments
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { appointmentLimiter } = require('../middleware/rateLimiter');
const { validateAppointment } = require('../middleware/validation');
const { sendNewEnquiryNotification } = require('../services/email');

/**
 * POST /api/appointments
 * Submits a new appointment enquiry from the website form.
 */
router.post('/', appointmentLimiter, validateAppointment, async (req, res) => {
  try {
    const { customer_name, phone, email, service, preferred_date, preferred_time, message } = req.validatedData;
    const ipHash = req.clientIpHash || null;

    // Check for accidental duplicate submission within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const duplicateCheck = await db.query(
      `SELECT id, created_at FROM appointments 
       WHERE phone = $1 AND preferred_date = $2 AND created_at > $3 
       ORDER BY created_at DESC LIMIT 1`,
      [phone, preferred_date, fiveMinutesAgo]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ENQUIRY',
        message: 'An enquiry for this phone number and date was already received in the last few minutes. Salon Perimeter will call you shortly to confirm your booking.'
      });
    }

    // Preserve optional email in message notes so it is saved within existing database schema
    const combinedMessage = email 
      ? `Email: ${email}${message ? `\n${message}` : ''}`
      : (message || '');

    // Insert new appointment enquiry with parameterized query
    const insertQuery = `
      INSERT INTO appointments (
        customer_name,
        phone,
        service,
        preferred_date,
        preferred_time,
        message,
        status,
        ip_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, customer_name, phone, service, preferred_date, preferred_time, message, status, created_at
    `;

    const result = await db.query(insertQuery, [
      customer_name,
      phone,
      service,
      preferred_date,
      preferred_time,
      combinedMessage,
      'pending',
      ipHash
    ]);

    const createdAppointment = result.rows[0];

    // Asynchronously dispatch notification email without blocking client response
    sendNewEnquiryNotification(createdAppointment).catch(err => {
      console.error('[APPOINTMENTS] Background email error:', err.message);
    });

    // Return HTTP 201 Created with exact required confirmation phrasing
    return res.status(201).json({
      success: true,
      message: 'Your appointment request has been received. The salon must confirm availability before your appointment is confirmed.',
      data: {
        id: createdAppointment.id,
        customer_name: createdAppointment.customer_name,
        phone: createdAppointment.phone,
        email: email || undefined,
        service: createdAppointment.service,
        preferred_date: createdAppointment.preferred_date,
        preferred_time: createdAppointment.preferred_time,
        message: createdAppointment.message,
        status: createdAppointment.status,
        created_at: createdAppointment.created_at
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error processing enquiry:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'We were unable to process your appointment enquiry due to an internal error. Please try again or call us directly at +91 95913 24243.'
    });
  }
});

module.exports = router;
