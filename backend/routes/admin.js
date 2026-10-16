/**
 * Salon Perimeter Shimoga — Admin Management API
 * Protected by requireAuth middleware
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { validateStatusUpdate } = require('../middleware/validation');

// Apply auth to all admin routes
router.use(requireAuth);

// Prevent browser and proxy caching on administrative data endpoints
router.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

/**
 * Calculates current appointment counts by status directly from the live database
 */
async function getAppointmentStats() {
  const counts = {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  };

  if (db.isInMemory()) {
    const allResult = await db.query('SELECT COUNT(*) AS total FROM appointments');
    const pendingResult = await db.query('SELECT COUNT(*) AS total FROM appointments WHERE LOWER(status) = $1', ['pending']);
    const confirmedResult = await db.query('SELECT COUNT(*) AS total FROM appointments WHERE LOWER(status) = $1', ['confirmed']);
    const completedResult = await db.query('SELECT COUNT(*) AS total FROM appointments WHERE LOWER(status) = $1', ['completed']);
    const cancelledResult = await db.query('SELECT COUNT(*) AS total FROM appointments WHERE LOWER(status) = $1', ['cancelled']);

    counts.total = parseInt(allResult.rows[0]?.total || '0', 10);
    counts.pending = parseInt(pendingResult.rows[0]?.total || '0', 10);
    counts.confirmed = parseInt(confirmedResult.rows[0]?.total || '0', 10);
    counts.completed = parseInt(completedResult.rows[0]?.total || '0', 10);
    counts.cancelled = parseInt(cancelledResult.rows[0]?.total || '0', 10);
  } else {
    const result = await db.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending') AS pending,
        COUNT(*) FILTER (WHERE LOWER(status) = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE LOWER(status) = 'completed') AS completed,
        COUNT(*) FILTER (WHERE LOWER(status) = 'cancelled') AS cancelled
      FROM appointments
    `);
    if (result.rows.length > 0) {
      counts.total = parseInt(result.rows[0].total || '0', 10);
      counts.pending = parseInt(result.rows[0].pending || '0', 10);
      counts.confirmed = parseInt(result.rows[0].confirmed || '0', 10);
      counts.completed = parseInt(result.rows[0].completed || '0', 10);
      counts.cancelled = parseInt(result.rows[0].cancelled || '0', 10);
    }
  }

  return counts;
}

/**
 * GET /api/admin/stats
 * Overview counts of enquiries by status
 */
router.get('/stats', async (req, res) => {
  try {
    const counts = await getAppointmentStats();
    return res.json({
      success: true,
      stats: counts
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
});

/**
 * GET /api/admin/appointments
 * Retrieves enquiries with status filter and pagination
 */
router.get('/appointments', async (req, res) => {
  try {
    const status = (req.query.status || 'all').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    let total = 0;
    let appointments = [];

    if (status !== 'all' && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      const countRes = await db.query('SELECT COUNT(*) AS total FROM appointments WHERE LOWER(status) = $1', [status]);
      total = parseInt(countRes.rows[0]?.total || '0', 10);

      const rowsRes = await db.query(
        `SELECT id, customer_name, phone, service, preferred_date, preferred_time, message, status, created_at, updated_at
         FROM appointments 
         WHERE LOWER(status) = $1
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );
      appointments = rowsRes.rows;
    } else {
      const countRes = await db.query('SELECT COUNT(*) AS total FROM appointments');
      total = parseInt(countRes.rows[0]?.total || '0', 10);

      const rowsRes = await db.query(
        `SELECT id, customer_name, phone, service, preferred_date, preferred_time, message, status, created_at, updated_at
         FROM appointments 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      appointments = rowsRes.rows;
    }

    const stats = await getAppointmentStats();

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      appointments,
      stats
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching appointments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch appointment enquiries.' });
  }
});

/**
 * PATCH /api/admin/appointments/:id/status
 * Updates appointment enquiry status (e.g., pending -> confirmed)
 */
router.patch('/appointments/:id/status', validateStatusUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const newStatus = req.validatedStatus;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Invalid appointment enquiry ID format.'
      });
    }

    const result = await db.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Appointment enquiry not found in database.'
      });
    }

    const stats = await getAppointmentStats();

    return res.json({
      success: true,
      message: `Enquiry status updated to "${newStatus}".`,
      appointment: result.rows[0],
      stats
    });
  } catch (error) {
    console.error('[ADMIN] Error updating status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update enquiry status.' });
  }
});

/**
 * DELETE /api/admin/appointments/:id
 * Removes an appointment enquiry
 */
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Invalid appointment enquiry ID format.'
      });
    }

    const result = await db.query('DELETE FROM appointments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Appointment enquiry not found in database.'
      });
    }

    const stats = await getAppointmentStats();

    return res.json({
      success: true,
      message: 'Appointment enquiry removed successfully.',
      stats
    });
  } catch (error) {
    console.error('[ADMIN] Error deleting appointment:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete appointment enquiry.' });
  }
});

module.exports = router;
