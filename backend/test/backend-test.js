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

// Helper to make HTTP requests
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Accept': 'application/json',
        ...headers
      }
    };

    let bodyStr = '';
    if (data) {
      bodyStr = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.setEncoding('utf8');
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(responseBody);
        } catch {
          parsed = responseBody;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
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

  // Setup Server
  await db.initDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
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

    // 5. Public Appointments: Valid Submission
    await test('POST /api/appointments saves valid submission and returns HTTP 201 with exact required notice', async () => {
      const validDate = getFutureNonTuesdayDate(5);
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Kavitha Shetty',
        phone: '+91 95913 24243',
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
      assert.strictEqual(res.body.data.status, 'pending');

      testAppointmentId = res.body.data.id;
    });

    // 6. Duplicate Submission Protection
    await test('POST /api/appointments prevents duplicate submission with HTTP 409', async () => {
      const validDate = getFutureNonTuesdayDate(5);
      const res = await request('POST', '/api/appointments', {
        customer_name: 'Kavitha Shetty',
        phone: '+91 95913 24243',
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
        password: process.env.ADMIN_PASSWORD || 'Perimeter@Shimoga2026'
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'owner');

      authToken = res.body.token;
    });

    // 9. Admin: Unauthenticated request rejected
    await test('GET /api/admin/appointments rejects unauthenticated requests with HTTP 401', async () => {
      const res = await request('GET', '/api/admin/appointments');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'UNAUTHORIZED');
    });

    // 10. Admin: Fetch appointments with valid JWT
    await test('GET /api/admin/appointments lists enquiries for authenticated owner', async () => {
      const res = await request('GET', '/api/admin/appointments', null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.appointments));
      assert.ok(res.body.appointments.length >= 1);
    });

    // 11. Admin: Fetch stats
    await test('GET /api/admin/stats returns count overview for owner dashboard', async () => {
      const res = await request('GET', '/api/admin/stats', null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.stats.total >= 1);
      assert.ok(res.body.stats.pending >= 1);
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

    // 13. Admin: Delete enquiry
    await test('DELETE /api/admin/appointments/:id deletes enquiry record', async () => {
      assert.ok(testAppointmentId);
      const res = await request('DELETE', `/api/admin/appointments/${testAppointmentId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

  } finally {
    if (server) {
      server.close();
    }
  }

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
