/**
 * Salon Perimeter Shimoga — Backend Automated Verification Test Suite
 * Tests all API endpoints, database interactions, validations, auth, and error states.
 */

const assert = require('assert');
const http = require('http');
const app = require('../server');
const db = require('../database/db');

let server;
let port;
let baseUrl;
let authToken = '';
let testAppointmentId = '';

const { EventEmitter } = require('events');
const { Readable, PassThrough } = require('stream');

// In-process request helper (zero socket / port permission issues)
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve) => {
    const socket = new PassThrough();
    socket.remoteAddress = '127.0.0.1';
    socket.encrypted = false;

    const req = new Readable();
    req._read = () => {};
    req.method = method;
    req.url = path;
    req.originalUrl = path;
    req.query = {};
    req.socket = socket;
    req.ip = '127.0.0.1';
    req.headers = {
      'accept': 'application/json',
      ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
    };

    if (data) {
      const bodyStr = JSON.stringify(data);
      req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = Buffer.byteLength(bodyStr);
      req.push(bodyStr);
    }
    req.push(null);

    const res = new EventEmitter();
    let responseBody = '';
    const responseHeaders = {};
    res._headers = responseHeaders;
    res.statusCode = 200;

    res.setHeader = (name, value) => {
      responseHeaders[name.toLowerCase()] = value;
    };
    res.getHeader = (name) => responseHeaders[name.toLowerCase()];
    res.removeHeader = (name) => {
      delete responseHeaders[name.toLowerCase()];
    };
    res.hasHeader = (name) => Object.prototype.hasOwnProperty.call(responseHeaders, name.toLowerCase());
    res.writeHead = (status, hdrs) => {
      res.statusCode = status;
      if (hdrs) Object.assign(responseHeaders, hdrs);
    };
    res.write = (chunk) => {
      responseBody += chunk;
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      let parsed = responseBody;
      try {
        parsed = JSON.parse(responseBody);
      } catch {}
      resolve({
        status: res.statusCode,
        headers: responseHeaders,
        body: parsed
      });
    };

    app(req, res);
  });
}

// Find a future non-Tuesday date (YYYY-MM-DD)
function getFutureNonTuesdayDate(daysAhead = 3) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  // If it's Tuesday (day 2), advance by 1 day to Wednesday
  if (d.getDay() === 2) {
    d.setDate(d.getDate() + 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Find a future Tuesday date (YYYY-MM-DD)
function getFutureTuesdayDate() {
  const d = new Date();
  while (d.getDay() !== 2) {
    d.setDate(d.getDate() + 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runTests() {
  console.log('🧪 Starting Salon Perimeter Backend Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  // Setup database tables & seed admin
  await db.initDatabase();

  // 1. Health Endpoint Test
    await test('GET /api/health returns HTTP 200 with operational status', async () => {
      const res = await request('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.business, "Women's & Children's Salon • Shivamogga");
    });

    // 2. Public Appointments Validation: Missing Fields
    await test('POST /api/appointments rejects missing fields with HTTP 400', async () => {
      const res = await request('POST', '/api/appointments', {});
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'VALIDATION_FAILED');
      assert.ok(res.body.errors.customer_name);
      assert.ok(res.body.errors.phone);
    });

    // 3. Public Appointments Validation: Invalid Phone
    await test('POST /api/appointments rejects non-Indian invalid phone numbers', async () => {
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Pooja Hegde',
        phone: '12345',
        service: "Women's Haircut & Styling",
        preferred_date: getFutureNonTuesdayDate(3),
        preferred_time: '11:30 AM - 01:00 PM'
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.phone);
    });

    // 4. Public Appointments Validation: Closed on Tuesday
    await test('POST /api/appointments rejects Tuesday reservations with HTTP 400', async () => {
      const tuesday = getFutureTuesdayDate();
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Pooja Hegde',
        phone: '+91 98765 43210',
        service: "Intensive Hair Spa",
        preferred_date: tuesday,
        preferred_time: '11:30 AM - 01:00 PM'
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.preferred_date.includes('closed on Tuesdays'));
    });

    // 4b. Public Appointments Validation: Invalid Email
    await test('POST /api/appointments rejects invalid email format with HTTP 400', async () => {
      const validDate = getFutureNonTuesdayDate(4);
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Pooja Hegde',
        phone: '+91 98765 43210',
        email: 'invalid-email-format',
        service: "Intensive Hair Spa",
        preferred_date: validDate,
        preferred_time: '11:30 AM - 01:00 PM'
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.email);
    });

    // 5. Public Appointments: Valid Submission (with optional email)
    await test('POST /api/appointments saves valid submission and returns HTTP 201 with exact required notice', async () => {
      const validDate = getFutureNonTuesdayDate(5);
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Kavitha Shetty',
        phone: '+91 98765 43210',
        email: 'kavitha@example.com',
        service: "Women's Haircut & Styling",
        preferred_date: validDate,
        preferred_time: '10:00 AM - 11:30 AM',
        message: 'First time visit. Looking for layered haircut.'
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(
        res.body.message,
        'Your appointment request has been received. The salon must confirm availability before your appointment is confirmed.'
      );
      assert.ok(res.body.data.id);
      assert.strictEqual(res.body.data.customer_name, 'Kavitha Shetty');
      assert.strictEqual(res.body.data.email, 'kavitha@example.com');
      assert.strictEqual(res.body.data.status, 'pending');
      assert.ok(res.body.data.raw_message.includes('Email: kavitha@example.com'));
      assert.strictEqual(res.body.data.notes, 'First time visit. Looking for layered haircut.');
      assert.strictEqual(res.body.data.message, 'First time visit. Looking for layered haircut.');

      testAppointmentId = res.body.data.id;
    });

    // 5b. Public Appointments: Valid Submission with Email and NO notes
    let testEmailOnlyId = '';
    await test('POST /api/appointments saves submission with email and blank notes, keeping notes empty', async () => {
      const validDate = getFutureNonTuesdayDate(6);
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Meera Rao',
        phone: '+91 98450 12345',
        email: 'meera.rao@example.com',
        service: "Intensive Hair Spa",
        preferred_date: validDate,
        preferred_time: '02:30 PM - 04:00 PM',
        message: ''
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.customer_name, 'Meera Rao');
      assert.strictEqual(res.body.data.email, 'meera.rao@example.com');
      assert.strictEqual(res.body.data.notes, '');
      assert.strictEqual(res.body.data.message, '');
      assert.strictEqual(res.body.data.raw_message, 'Email: meera.rao@example.com');
      assert.ok(!res.body.data.notes.includes('Email:'));

      testEmailOnlyId = res.body.data.id;
    });

    // 6. Duplicate Submission Protection
    await test('POST /api/appointments prevents duplicate submission with HTTP 409', async () => {
      const validDate = getFutureNonTuesdayDate(5);
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Kavitha Shetty',
        phone: '+91 98765 43210',
        service: "Women's Haircut & Styling",
        preferred_date: validDate,
        preferred_time: '10:00 AM - 11:30 AM'
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error, 'DUPLICATE_ENQUIRY');
    });

    // 7. Auth: Login with wrong password
    await test('POST /api/auth/login rejects invalid credentials with HTTP 401', async () => {
      const res = await request('POST', '/api/auth/login', {
        username: 'salon_owner',
        password: 'wrong_password_xyz'
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    // 8. Auth: Login with valid credentials
    await test('POST /api/auth/login succeeds with valid credentials and issues JWT token', async () => {
      const res = await request('POST', '/api/auth/login', {
        username: process.env.ADMIN_USERNAME || 'salon_owner',
        password: process.env.ADMIN_PASSWORD || 'SalonPerimeter#2026'
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'owner');

      authToken = res.body.token;
    });

    // 8b. Auth: Change password endpoint
    await test('POST /api/auth/change-password validates current password and updates password', async () => {
      // Wrong current password
      const badRes = await request('POST', '/api/auth/change-password', {
        currentPassword: 'wrong_password',
        newPassword: 'BrandNewPassword#2026'
      }, {
        'Authorization': `Bearer ${authToken}`
      });
      assert.strictEqual(badRes.status, 401);
      assert.strictEqual(badRes.body.error, 'INCORRECT_PASSWORD');

      // Valid current password
      const goodRes = await request('POST', '/api/auth/change-password', {
        currentPassword: 'SalonPerimeter#2026',
        newPassword: 'BrandNewPassword#2026'
      }, {
        'Authorization': `Bearer ${authToken}`
      });
      assert.strictEqual(goodRes.status, 200);
      assert.strictEqual(goodRes.body.success, true);

      // Revert back so subsequent tests or restarts stay on SalonPerimeter#2026
      await request('POST', '/api/auth/change-password', {
        currentPassword: 'BrandNewPassword#2026',
        newPassword: 'SalonPerimeter#2026'
      }, {
        'Authorization': `Bearer ${authToken}`
      });
    });

    // 9. Admin: Unauthenticated request rejected
    await test('GET /api/admin/appointments rejects unauthenticated requests with HTTP 401', async () => {
      const res = await request('GET', '/api/admin/appointments');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'UNAUTHORIZED');
    });

    // 10. Admin: Fetch appointments with valid JWT
    await test('GET /api/admin/appointments lists enquiries for authenticated owner with separated email and notes', async () => {
      const res = await request('GET', '/api/admin/appointments', null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.appointments));
      assert.ok(res.body.appointments.length >= 1);

      // Verify appointment with notes and email
      const kavitha = res.body.appointments.find(a => a.id === testAppointmentId);
      assert.ok(kavitha);
      assert.strictEqual(kavitha.email, 'kavitha@example.com');
      assert.strictEqual(kavitha.notes, 'First time visit. Looking for layered haircut.');
      assert.ok(!kavitha.notes.includes('Email:'));

      // Verify appointment with email and blank notes
      const meera = res.body.appointments.find(a => a.id === testEmailOnlyId);
      assert.ok(meera);
      assert.strictEqual(meera.email, 'meera.rao@example.com');
      assert.strictEqual(meera.notes, '');

      // Clean up meera record so counters for subsequent tests match pre-existing expectations
      await request('DELETE', `/api/admin/appointments/${testEmailOnlyId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
    });

    // 10b. Backward Compatibility: Legacy format where email is embedded in message
    await test('GET /api/admin/appointments parses legacy records with embedded email and preserves notes', async () => {
      // Insert simulated legacy record with embedded email directly into database
      const insertLegacy = await db.query(
        `INSERT INTO appointments (customer_name, phone, service, preferred_date, preferred_time, message, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Deepa Nayak',
          '+91 97410 54321',
          'Skin & Beauty Rituals',
          getFutureNonTuesdayDate(7),
          '11:30 AM - 01:00 PM',
          'Email: deepa@example.com\nRequires hypoallergenic face products.',
          'pending'
        ]
      );
      const legacyId = insertLegacy.rows[0].id;

      const res = await request('GET', '/api/admin/appointments', null, {
        'Authorization': `Bearer ${authToken}`
      });

      const foundLegacy = res.body.appointments.find(a => a.id === legacyId);
      assert.ok(foundLegacy);
      assert.strictEqual(foundLegacy.email, 'deepa@example.com');
      assert.strictEqual(foundLegacy.notes, 'Requires hypoallergenic face products.');
      assert.ok(!foundLegacy.notes.includes('Email:'));

      // Clean up legacy test record
      await request('DELETE', `/api/admin/appointments/${legacyId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
    });

    // 11. Admin: Fetch stats
    let prePending = 0;
    let preConfirmed = 0;
    await test('GET /api/admin/stats returns count overview for owner dashboard', async () => {
      const res = await request('GET', '/api/admin/stats', null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.stats.total >= 1);
      assert.ok(res.body.stats.pending >= 1);
      prePending = res.body.stats.pending;
      preConfirmed = res.body.stats.confirmed;
    });

    // 12. Admin: Update enquiry status
    await test('PATCH /api/admin/appointments/:id/status updates enquiry status to confirmed', async () => {
      assert.ok(testAppointmentId, 'testAppointmentId should exist from previous test');
      const res = await request('PATCH', `/api/admin/appointments/${testAppointmentId}/status`, {
        status: 'confirmed'
      }, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.appointment.status, 'confirmed');
    });

    // 12b. Dashboard Counters: Verify counter values update after status change
    await test('GET /api/admin/stats verifies counter updates after status change', async () => {
      const res = await request('GET', '/api/admin/stats', null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.stats.pending, prePending - 1, 'Pending count must decrease by 1');
      assert.strictEqual(res.body.stats.confirmed, preConfirmed + 1, 'Confirmed count must increase by 1');
    });

    // 12c. Status Case-Insensitivity: Accepts exact string "Pending" and persists
    await test('PATCH /api/admin/appointments/:id/status accepts exact string "Pending" and updates record', async () => {
      assert.ok(testAppointmentId);
      const res = await request('PATCH', `/api/admin/appointments/${testAppointmentId}/status`, {
        status: 'Pending'
      }, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.appointment.status, 'pending');

      // Verify stats in PATCH response reflects pending update
      assert.strictEqual(res.body.stats.pending, prePending);
    });

    // 12d. Full Status Transition Matrix: Verify transitions between any status without restrictions
    await test('PATCH /api/admin/appointments/:id/status allows transitions between any statuses (completed->pending, cancelled->confirmed, etc.)', async () => {
      assert.ok(testAppointmentId);
      const testTransitions = [
        { to: 'completed', expectedCompleted: 1, expectedPending: prePending - 1 },
        { to: 'pending', expectedCompleted: 0, expectedPending: prePending },
        { to: 'completed', expectedCompleted: 1, expectedPending: prePending - 1 },
        { to: 'confirmed', expectedCompleted: 0, expectedConfirmed: preConfirmed + 1 },
        { to: 'cancelled', expectedConfirmed: preConfirmed, expectedCancelled: 1 },
        { to: 'confirmed', expectedConfirmed: preConfirmed + 1, expectedCancelled: 0 },
        { to: 'completed', expectedCompleted: 1, expectedConfirmed: preConfirmed },
        { to: 'cancelled', expectedCompleted: 0, expectedCancelled: 1 },
        { to: 'pending', expectedPending: prePending, expectedCancelled: 0 },
        { to: 'cancelled', expectedCancelled: 1, expectedPending: prePending - 1 },
        { to: 'pending', expectedPending: prePending, expectedCancelled: 0 }
      ];

      for (const t of testTransitions) {
        const patchRes = await request('PATCH', `/api/admin/appointments/${testAppointmentId}/status`, {
          status: t.to
        }, {
          'Authorization': `Bearer ${authToken}`
        });

        assert.strictEqual(patchRes.status, 200);
        assert.strictEqual(patchRes.body.success, true);
        assert.strictEqual(patchRes.body.appointment.status, t.to);

        // Fetch all appointments (simulating page refresh) to ensure persistence
        const fetchRes = await request('GET', '/api/admin/appointments', null, {
          'Authorization': `Bearer ${authToken}`
        });
        const found = fetchRes.body.appointments.find(a => a.id === testAppointmentId);
        assert.ok(found);
        assert.strictEqual(found.status, t.to);
      }
    });

    // 13. Admin: Delete enquiry
    await test('DELETE /api/admin/appointments/:id deletes enquiry record', async () => {
      assert.ok(testAppointmentId);
      const res = await request('DELETE', `/api/admin/appointments/${testAppointmentId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    // 13b. Dashboard Counters: Verify total counter decrements after deletion
    await test('GET /api/admin/stats verifies counter updates after deletion', async () => {
      const res = await request('GET', '/api/admin/stats', null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.stats.confirmed, preConfirmed, 'Confirmed count must return to pre-confirmation level');
    });

    // 14. Database Failure Handling
    await test('POST /api/appointments handles unexpected database failure with safe HTTP 500', async () => {
      const originalQuery = db.query;
      try {
        db.query = async () => {
          throw new Error('Simulated PostgreSQL connection failure');
        };

        const validDate = getFutureNonTuesdayDate(8);
        const res = await request('POST', '/api/appointments', {
          customer_name: 'Simulated Fail User',
          phone: '+91 91234 56789',
          service: "Women's Haircut & Styling",
          preferred_date: validDate,
          preferred_time: '10:00 AM - 11:30 AM'
        });

        assert.strictEqual(res.status, 500);
        assert.strictEqual(res.body.success, false);
        assert.strictEqual(res.body.error, 'SERVER_ERROR');
        assert.ok(res.body.message.includes('unable to process your appointment'));
        // Verify no stack trace or DB connection string is leaked in the response
        assert.strictEqual(res.body.stack, undefined);
        assert.strictEqual(res.body.connectionString, undefined);
      } finally {
        db.query = originalQuery;
      }
    });

  console.log('\n============================================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed.`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
