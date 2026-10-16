/**
 * Salon Perimeter Shimoga — Input Validation & Sanitization Middleware
 * Validates appointment enquiries and sanitizes input to prevent XSS and SQL injection.
 */

// Basic HTML sanitization: escape HTML characters
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Strip < and > to prevent tag injection
    .slice(0, 1000);
}

// Sensible Indian Mobile Phone number validation
function isValidIndianPhone(phone) {
  if (typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  // Matches: 10 digits starting with 6-9, or prefixed with 91, or prefixed with 0
  return /^(?:91|0)?[6-9]\d{9}$/.test(clean);
}

// Normalizes phone string to standard format: +91 XXXXX XXXXX or 10 digits
function normalizePhone(phone) {
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (clean.length === 10) return clean;
  if (clean.length === 12 && clean.startsWith('91')) return clean.slice(2);
  if (clean.length === 11 && clean.startsWith('0')) return clean.slice(1);
  return clean;
}

/**
 * Validates appointment enquiry requests
 */
function validateAppointment(req, res, next) {
  const body = req.body || {};

  // Support both canonical names and frontend form field names
  const customer_name = sanitizeString(body.customer_name || body.clientName || body.name || '');
  const rawPhone = String(body.phone || body.clientPhone || '').trim();
  const service = sanitizeString(body.service || body.serviceSelect || '');
  const preferred_date = String(body.preferred_date || body.prefDate || '').trim();
  const preferred_time = sanitizeString(body.preferred_time || body.prefTime || '');
  const message = sanitizeString(body.message || body.clientMessage || '');

  const errors = {};

  // 1. Validate Customer Name
  if (!customer_name) {
    errors.customer_name = 'Full name is required.';
  } else if (customer_name.length < 2) {
    errors.customer_name = 'Name must be at least 2 characters long.';
  } else if (customer_name.length > 100) {
    errors.customer_name = 'Name cannot exceed 100 characters.';
  }

  // 2. Validate Phone
  if (!rawPhone) {
    errors.phone = 'Phone number is required.';
  } else if (!isValidIndianPhone(rawPhone)) {
    errors.phone = 'Please provide a valid Indian phone number (10 digits starting with 6, 7, 8, or 9).';
  }

  // 3. Validate Service
  if (!service) {
    errors.service = 'Please select a service category.';
  } else if (service.length > 100) {
    errors.service = 'Service name exceeds maximum permitted length.';
  }

  // 4. Validate Preferred Date
  if (!preferred_date) {
    errors.preferred_date = 'Preferred appointment date is required.';
  } else {
    // Check ISO format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(preferred_date)) {
      errors.preferred_date = 'Invalid date format. Expected YYYY-MM-DD.';
    } else {
      const parsedDate = new Date(preferred_date + 'T00:00:00Z');
      if (isNaN(parsedDate.getTime())) {
        errors.preferred_date = 'Invalid date.';
      } else {
        // Prevent past dates (compare in IST / UTC)
        const now = new Date();
        const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        if (parsedDate < todayUtc) {
          errors.preferred_date = 'Appointments cannot be scheduled on past dates.';
        }

        // Check if Tuesday (day index 2: 0=Sun, 1=Mon, 2=Tue, 3=Wed, etc.)
        const dayOfWeek = parsedDate.getUTCDay();
        if (dayOfWeek === 2) {
          errors.preferred_date = 'Salon Perimeter is closed on Tuesdays. Please pick a date between Wednesday and Monday.';
        }
      }
    }
  }

  // 5. Validate Preferred Time
  if (!preferred_time) {
    errors.preferred_time = 'Preferred time slot is required.';
  } else if (preferred_time.length > 50) {
    errors.preferred_time = 'Preferred time format is invalid.';
  }

  // 6. Validate Message
  if (message.length > 1000) {
    errors.message = 'Message notes cannot exceed 1000 characters.';
  }

  // If validation errors exist, return 400 Bad Request
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_FAILED',
      message: 'Please review and correct the marked fields.',
      errors
    });
  }

  // Store normalized data on request object
  req.validatedData = {
    customer_name,
    phone: normalizePhone(rawPhone),
    formatted_phone: rawPhone,
    service,
    preferred_date,
    preferred_time,
    message
  };

  next();
}

/**
 * Validates status update requests from admin
 */
function validateStatusUpdate(req, res, next) {
  const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  const rawStatus = req.body && req.body.status;
  const statusStr = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : '';

  if (!statusStr || !allowedStatuses.includes(statusStr)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_STATUS',
      message: `Status must be one of: pending, confirmed, completed, cancelled (received: "${rawStatus || ''}")`
    });
  }

  req.validatedStatus = statusStr;
  next();
}

module.exports = {
  validateAppointment,
  validateStatusUpdate,
  isValidIndianPhone,
  sanitizeString
};
