/**
 * Salon Perimeter Shimoga — Database Adapter
 * Supports PostgreSQL (Render / Production) via pg.Pool
 * Includes a seamless in-memory fallback adapter for local dev & automated testing
 * when DATABASE_URL is not set.
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

let pool = null;
let isInMemory = false;

// In-Memory store tables for dev/testing when DATABASE_URL is absent
const inMemoryDb = {
  appointments: [],
  admin_users: []
};

// Check if PostgreSQL DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.DATABASE_URL.includes('render.com');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: (isProduction || isRender) ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.error('[DATABASE] Unexpected PostgreSQL client error:', err.message);
  });
} else {
  isInMemory = true;
  console.log('[DATABASE] Notice: No DATABASE_URL set. Running with built-in memory adapter for local dev & testing.');
}

/**
 * Executes a SQL query with parameterized values
 * @param {string} text - SQL Query text
 * @param {Array} params - Array of parameter values ($1, $2, ...)
 * @returns {Promise<{ rows: Array, rowCount: number }>}
 */
async function query(text, params = []) {
  if (!isInMemory && pool) {
    return pool.query(text, params);
  }

  // In-Memory Query Router for local dev & testing
  return executeInMemoryQuery(text, params);
}

/**
 * In-Memory Query Engine executing app-specific SQL queries
 */
async function executeInMemoryQuery(text, params) {
  const cleanSql = text.trim();
  const normalizedSql = cleanSql.replace(/\s+/g, ' ');

  // 1. Table schema initialization
  if (normalizedSql.toUpperCase().startsWith('CREATE TABLE') || 
      normalizedSql.toUpperCase().startsWith('CREATE EXTENSION') || 
      normalizedSql.toUpperCase().startsWith('CREATE INDEX')) {
    return { rows: [], rowCount: 0 };
  }

  // 2. Count admin users
  if (normalizedSql.includes('SELECT COUNT(*) AS count FROM admin_users')) {
    return {
      rows: [{ count: inMemoryDb.admin_users.length.toString() }],
      rowCount: 1
    };
  }

  // 3. Count appointments with filter
  if (normalizedSql.includes('SELECT COUNT(*) AS total FROM appointments')) {
    let count = inMemoryDb.appointments.length;
    if (params.length > 0 && params[0] !== 'all') {
      const filter = String(params[0]).toLowerCase();
      count = inMemoryDb.appointments.filter(a => String(a.status).toLowerCase() === filter).length;
    }
    return {
      rows: [{ total: count.toString() }],
      rowCount: 1
    };
  }

  // 4. Check duplicate appointment (phone + date + recent timestamp)
  if (normalizedSql.includes('FROM appointments WHERE phone = $1 AND preferred_date = $2 AND created_at > $3')) {
    const [phone, prefDate, cutoffTime] = params;
    const match = inMemoryDb.appointments
      .filter(a => a.phone === phone && a.preferred_date === prefDate && new Date(a.created_at) > new Date(cutoffTime))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    return {
      rows: match ? [match] : [],
      rowCount: match ? 1 : 0
    };
  }

  // 5. Insert new appointment
  if (normalizedSql.startsWith('INSERT INTO appointments')) {
    const [customer_name, phone, service, preferred_date, preferred_time, message, status, ip_hash] = params;
    const now = new Date().toISOString();
    const newRecord = {
      id: crypto.randomUUID(),
      customer_name,
      phone,
      service,
      preferred_date,
      preferred_time,
      message: message || '',
      status: status || 'pending',
      ip_hash: ip_hash || null,
      created_at: now,
      updated_at: now
    };

    inMemoryDb.appointments.unshift(newRecord);
    return {
      rows: [newRecord],
      rowCount: 1
    };
  }

  // 6. Find admin user by username or ID
  if (normalizedSql.includes('FROM admin_users WHERE username = $1')) {
    const username = params[0];
    const user = inMemoryDb.admin_users.find(u => u.username.toLowerCase() === username.toLowerCase());
    return {
      rows: user ? [user] : [],
      rowCount: user ? 1 : 0
    };
  }

  if (normalizedSql.includes('FROM admin_users WHERE id = $1')) {
    const id = params[0];
    const user = inMemoryDb.admin_users.find(u => u.id === Number(id));
    return {
      rows: user ? [user] : [],
      rowCount: user ? 1 : 0
    };
  }

  // 7. Insert admin user
  if (normalizedSql.startsWith('INSERT INTO admin_users')) {
    const [username, password_hash, email, role] = params;
    const now = new Date().toISOString();
    const newUser = {
      id: inMemoryDb.admin_users.length + 1,
      username,
      password_hash,
      email: email || null,
      role: role || 'owner',
      created_at: now,
      last_login: null
    };
    inMemoryDb.admin_users.push(newUser);
    return {
      rows: [newUser],
      rowCount: 1
    };
  }

  // 8. Update admin last login or password
  if (normalizedSql.includes('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1')) {
    const id = params[0];
    const user = inMemoryDb.admin_users.find(u => u.id === Number(id));
    if (user) {
      user.last_login = new Date().toISOString();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (normalizedSql.includes('UPDATE admin_users SET password_hash = $1 WHERE username = $2')) {
    const [password_hash, username] = params;
    const user = inMemoryDb.admin_users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      user.password_hash = password_hash;
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (normalizedSql.includes('UPDATE admin_users SET password_hash = $1 WHERE id = $2')) {
    const [password_hash, id] = params;
    const user = inMemoryDb.admin_users.find(u => u.id === Number(id));
    if (user) {
      user.password_hash = password_hash;
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 9. Query appointments list (admin dashboard)
  if (normalizedSql.includes('FROM appointments') && normalizedSql.includes('ORDER BY created_at DESC')) {
    let list = [...inMemoryDb.appointments];
    let limit = 50;
    let offset = 0;

    // Check if status filter is applied
    if (normalizedSql.includes('WHERE status = $1') || normalizedSql.includes('WHERE LOWER(status) = $1')) {
      const statusFilter = String(params[0] || '').toLowerCase();
      limit = Number(params[1]) || 50;
      offset = Number(params[2]) || 0;
      list = list.filter(a => String(a.status).toLowerCase() === statusFilter);
    } else {
      limit = Number(params[0]) || 50;
      offset = Number(params[1]) || 0;
    }

    const paged = list.slice(offset, offset + limit);
    return {
      rows: paged,
      rowCount: paged.length
    };
  }

  // 10. Update appointment status
  if (normalizedSql.startsWith('UPDATE appointments SET status = $1')) {
    const [newStatus, id] = params;
    const item = inMemoryDb.appointments.find(a => a.id === id);
    if (item) {
      item.status = newStatus;
      item.updated_at = new Date().toISOString();
      return { rows: [item], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 11. Delete appointment
  if (normalizedSql.startsWith('DELETE FROM appointments WHERE id = $1')) {
    const id = params[0];
    const index = inMemoryDb.appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      const removed = inMemoryDb.appointments.splice(index, 1);
      return { rows: removed, rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 12. Fallback empty result
  return { rows: [], rowCount: 0 };
}

/**
 * Initializes database tables and default admin account
 */
async function initDatabase() {
  try {
    if (!isInMemory && pool) {
      // Test real PostgreSQL connection
      const client = await pool.connect();
      try {
        // Create tables if they do not exist
        await client.query(`
          CREATE TABLE IF NOT EXISTS appointments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            service VARCHAR(100) NOT NULL,
            preferred_date DATE NOT NULL,
            preferred_time VARCHAR(50) NOT NULL,
            message TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            ip_hash VARCHAR(64),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
          CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(preferred_date);
          CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
          CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments(created_at DESC);

          CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(100),
            role VARCHAR(20) NOT NULL DEFAULT 'owner',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMPTZ
          );
        `);
        console.log('[DATABASE] PostgreSQL tables verified and ready.');
      } finally {
        client.release();
      }
    }

    // Seed or synchronize admin user credentials
    const adminUser = process.env.ADMIN_USERNAME || 'srinidhi_admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'SrinidhiEye#2026';

    const existingAdmin = await query('SELECT id, username FROM admin_users WHERE username = $1 LIMIT 1', [adminUser]);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPass, salt);

    if (existingAdmin.rows.length === 0) {
      await query(
        'INSERT INTO admin_users (username, password_hash, email, role) VALUES ($1, $2, $3, $4)',
        [adminUser, hashedPassword, 'care@srinidhieye.com', 'owner']
      );
      console.log(`[DATABASE] Default hospital admin account seeded: username="${adminUser}"`);
    } else {
      await query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [hashedPassword, adminUser]
      );
      console.log(`[DATABASE] Admin account password synchronized for: username="${adminUser}"`);
    }

    // Also support legacy username salon_owner if present or requested
    const legacyUser = 'salon_owner';
    const existingLegacy = await query('SELECT id FROM admin_users WHERE username = $1 LIMIT 1', [legacyUser]);
    if (existingLegacy.rows.length === 0) {
      const legacyHash = await bcrypt.hash('SalonPerimeter#2026', salt);
      await query(
        'INSERT INTO admin_users (username, password_hash, email, role) VALUES ($1, $2, $3, $4)',
        [legacyUser, legacyHash, 'admin@srinidhieye.com', 'owner']
      );
    }
  } catch (error) {
    console.error('[DATABASE] Initialization error:', error.message);
  }
}

module.exports = {
  query,
  initDatabase,
  isInMemory: () => isInMemory
};
