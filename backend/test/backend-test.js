/**
 * Srinidhi Eye Care Hospital — Backend Automated Verification Test Suite
 * Tests all API endpoints, database interactions, validations, auth, and error states.
 * Gangavathi, Koppal District, Karnataka
 */

const assert = require('assert');
const app = require('../server');
const db = require('../database/db');

let authToken = '';
let testAppointmentId = '';
let preConfirmed = 0;

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

// Helper: Future date (YYYY-MM-DD)
function getFutureDate(daysAhead = 3) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper: Past date (YYYY-MM-DD)
function getPastDate(daysBehind = 2) {
  const d = new Date();
  d.setDate(d.getDate() - daysBehind);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runTests() {
  console.log('🧪 Starting Srinidhi Eye Care Hospital Backend Verification Tests...\n');
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
    assert.ok(res.body.status === 'healthy' || res.body.status === 'ok');
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
      customer_name: 'Mallikarjun Patil',
      phone: '12345',
      service: 'Micro-Incision Cataract Surgery (MICS / Phaco)',
      preferred_date: getFutureDate(3),
      preferred_time: 'Morning OPD (09:30 AM - 11:30 AM)'
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.phone);
  });

  // 4. Public Appointments Validation: Rejects Past Date
  await test('POST /api/appointments rejects past dates with HTTP 400', async () => {
    const pastDate = getPastDate(2);
    const res = await request('POST', '/api/appointments', {
      customer_name: 'Mallikarjun Patil',
      phone: '+91 94481 23456',
      service: 'Micro-Incision Cataract Surgery (MICS / Phaco)',
      preferred_date: pastDate,
      preferred_time: 'Morning OPD (09:30 AM - 11:30 AM)'
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.preferred_date.includes('past'));
  });

  // 4b. Public Appointments Validation: Invalid Email
  await test('POST /api/appointments rejects invalid email format with HTTP 400', async () => {
    const validDate = getFutureDate(4);
    const res = await request('POST', '/api/appointments', {
      customer_name: 'Mallikarjun Patil',
      phone: '+91 94481 23456',
      email: 'invalid-email-format',
      service: 'Contoura Vision & Blade-Free LASIK',
      preferred_date: validDate,
      preferred_time: 'Morning OPD (09:30 AM - 11:30 AM)'
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.email);
  });

  // 5. Public Appointments: Valid Submission
  await test('POST /api/appointments saves valid submission and returns HTTP 201 with hospital notice', async () => {
    const validDate = getFutureDate(5);
    const res = await request('POST', '/api/appointments', {
      customer_name: 'Ramesh Kulkarni',
      phone: '+91 94481 23456',
      email: 'ramesh.k@example.com',
      service: 'Micro-Incision Cataract Surgery (MICS / Phaco)',
      preferred_date: validDate,
      preferred_time: 'Morning OPD (09:30 AM - 11:30 AM)',
      message: 'Experiencing blurry vision in right eye and glare while driving.'
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes('Srinidhi Eye Care Hospital'));
    assert.strictEqual(res.body.data.customer_name, 'Ramesh Kulkarni');
    assert.strictEqual(res.body.data.phone, '9448123456');
    assert.strictEqual(res.body.data.email, 'ramesh.k@example.com');
    assert.strictEqual(res.body.data.notes, 'Experiencing blurry vision in right eye and glare while driving.');

    testAppointmentId = res.body.data.id;
    assert.ok(testAppointmentId);
  });

  // 5b. Email formatting: Notes kept separate
  await test('POST /api/appointments saves submission with email and blank notes', async () => {
    const validDate = getFutureDate(6);
    const res = await request('POST', '/api/appointments', {
      customer_name: 'Dr. Meera Rao',
      phone: '+91 98800 12345',
      email: 'meera.rao@example.com',
      service: 'Glaucoma Early Detection & Treatment',
      preferred_date: validDate,
      preferred_time: 'Evening OPD (04:30 PM - 06:30 PM)',
      message: ''
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.email, 'meera.rao@example.com');
    assert.strictEqual(res.body.data.notes, '');
  });

  // 6. Duplicate Submission Protection
  await test('POST /api/appointments prevents duplicate submission with HTTP 409', async () => {
    const validDate = getFutureDate(5);
    const res = await request('POST', '/api/appointments', {
      customer_name: 'Ramesh Kulkarni',
      phone: '+91 94481 23456',
      service: 'Micro-Incision Cataract Surgery (MICS / Phaco)',
      preferred_date: validDate,
      preferred_time: 'Morning OPD (09:30 AM - 11:30 AM)'
    });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error, 'DUPLICATE_ENQUIRY');
  });

  // 7. Auth: Login with wrong password
  await test('POST /api/auth/login rejects invalid credentials with HTTP 401', async () => {
    const res = await request('POST', '/api/auth/login', {
      username: 'srinidhi_admin',
      password: 'wrong_password_xyz'
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // 8. Auth: Login with valid credentials
  await test('POST /api/auth/login succeeds with valid credentials and issues JWT token', async () => {
    const adminUser = process.env.ADMIN_USERNAME || 'srinidhi_admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'SrinidhiEye#2026';

    const res = await request('POST', '/api/auth/login', {
      username: adminUser,
      password: adminPass
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);

    authToken = res.body.token;
  });

  // 9. Admin: Rejects unauthenticated request
  await test('GET /api/admin/appointments rejects unauthenticated requests with HTTP 401', async () => {
    const res = await request('GET', '/api/admin/appointments');
    assert.strictEqual(res.status, 401);
  });

  // 10. Admin: Lists appointments
  await test('GET /api/admin/appointments lists consultations for authenticated admin', async () => {
    const res = await request('GET', '/api/admin/appointments', null, {
      'Authorization': `Bearer ${authToken}`
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data || res.body.appointments));

    const list = res.body.data || res.body.appointments;
    const ramesh = list.find(a => a.customer_name === 'Ramesh Kulkarni');
    assert.ok(ramesh);
    assert.strictEqual(ramesh.email, 'ramesh.k@example.com');
  });

  // 11. Admin: Stats count overview
  await test('GET /api/admin/stats returns count overview for hospital dashboard', async () => {
    const res = await request('GET', '/api/admin/stats', null, {
      'Authorization': `Bearer ${authToken}`
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.stats);
    preConfirmed = res.body.stats.confirmed || 0;
  });

  // 12. Admin: Update status
  await test('PATCH /api/admin/appointments/:id/status updates consultation status to confirmed', async () => {
    assert.ok(testAppointmentId);
    const res = await request('PATCH', `/api/admin/appointments/${testAppointmentId}/status`, {
      status: 'confirmed'
    }, {
      'Authorization': `Bearer ${authToken}`
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'confirmed');
  });

  // 13. Admin: Allow transitions between all statuses
  await test('PATCH /api/admin/appointments/:id/status allows transitions between any statuses', async () => {
    assert.ok(testAppointmentId);
    const transitions = [
      { to: 'completed' },
      { to: 'pending' },
      { to: 'cancelled' },
      { to: 'confirmed' }
    ];

    for (const t of transitions) {
      const res = await request('PATCH', `/api/admin/appointments/${testAppointmentId}/status`, {
        status: t.to
      }, {
        'Authorization': `Bearer ${authToken}`
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, t.to);
    }
  });

  // 14. Admin: Delete enquiry
  await test('DELETE /api/admin/appointments/:id deletes consultation record', async () => {
    assert.ok(testAppointmentId);
    const res = await request('DELETE', `/api/admin/appointments/${testAppointmentId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  // 15. Database Failure Handling
  await test('POST /api/appointments handles unexpected database failure with safe HTTP 500', async () => {
    const originalQuery = db.query;
    try {
      db.query = async () => {
        throw new Error('Simulated PostgreSQL connection failure');
      };

      const validDate = getFutureDate(8);
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Simulated Fail User',
        phone: '+91 94481 23456',
        service: 'Micro-Incision Cataract Surgery (MICS / Phaco)',
        preferred_date: validDate,
        preferred_time: 'Morning OPD (09:30 AM - 11:30 AM)'
      });

      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'SERVER_ERROR');
      assert.ok(res.body.message.includes('unable to process your consultation'));
      assert.strictEqual(res.body.stack, undefined);
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
