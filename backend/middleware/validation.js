/**
 * Srinidhi Eye Care & Opticals — Input Validation & Sanitization Middleware
 * Gangavathi, Koppal District, Karnataka
 */

// Basic HTML sanitization: escape HTML characters
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Strip < and >
    .slice(0, 1000);
}

// Sensible Indian Mobile Phone number validation
function isValidIndianPhone(phone) {
  if (typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^(?:91|0)?[6-9]\d{9}$/.test(clean);
}

// Normalizes phone string to standard format: 10 digits
function normalizePhone(phone) {
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (clean.length === 10) return clean;
  if (clean.length === 12 && clean.startsWith('91')) return clean.slice(2);
  if (clean.length === 11 && clean.startsWith('0')) return clean.slice(1);
  return clean;
}

/**
 * Validates appointment enquiry requests for Srinidhi Eye Care Clinic
 */
function validateAppointment(req, res, next) {
  const body = req.body || {};

  const customer_name = sanitizeString(body.customer_name || body.clientName || body.patientName || body.name || '');
  const rawPhone = String(body.phone || body.clientPhone || body.patientPhone || '').trim();
  const rawEmail = String(body.email || body.clientEmail || body.patientEmail || '').trim();
  const service = sanitizeString(body.service || body.serviceSelect || body.department || '');
  const preferred_date = String(body.preferred_date || body.prefDate || '').trim();
  const preferred_time = sanitizeString(body.preferred_time || body.prefTime || '');
  const message = sanitizeString(body.message || body.clientMessage || body.symptoms || '');

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
    errors.phone = 'Mobile number is required.';
  } else if (!isValidIndianPhone(rawPhone)) {
    errors.phone = 'Please provide a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9).';
  }

  // 2b. Validate Optional Email
  let email = '';
  if (rawEmail) {
    if (rawEmail.length > 100) {
      errors.email = 'Email address cannot exceed 100 characters.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        errors.email = 'Please provide a valid email address.';
      } else {
        email = sanitizeString(rawEmail).toLowerCase();
      }
    }
  }

  // 3. Validate Service / Optical Requirement
  if (!service) {
    errors.service = 'Please select an eye checkup or eyewear service.';
  } else if (service.length > 150) {
    errors.service = 'Service name exceeds maximum permitted length.';
  }

  // 4. Validate Preferred Date
  if (!preferred_date) {
    errors.preferred_date = 'Preferred consultation date is required.';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(preferred_date)) {
      errors.preferred_date = 'Invalid date format. Expected YYYY-MM-DD.';
    } else {
      const parsedDate = new Date(preferred_date + 'T00:00:00Z');
      if (isNaN(parsedDate.getTime())) {
        errors.preferred_date = 'Invalid date.';
      } else {
        const now = new Date();
        const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        if (parsedDate < todayUtc) {
          errors.preferred_date = 'Appointments cannot be scheduled on past dates.';
        }
      }
    }
  }

  // 5. Validate Preferred Time Slot
  if (!preferred_time) {
    errors.preferred_time = 'Preferred time slot is required.';
  } else if (preferred_time.length > 80) {
    errors.preferred_time = 'Preferred time format is invalid.';
  }

  // 6. Validate Message
  if (message.length > 2000) {
    errors.message = 'Notes cannot exceed 2000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_FAILED',
      message: 'Please review and correct the marked consultation fields.',
      errors
    });
  }

  req.validatedData = {
    customer_name,
    phone: normalizePhone(rawPhone),
    formatted_phone: rawPhone,
    email,
    service,
    preferred_date,
    preferred_time,
    message
  };

  next();
}

/**
 * Validates status update requests from clinic admin
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
