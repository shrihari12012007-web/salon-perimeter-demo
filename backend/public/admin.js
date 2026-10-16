/**
 * Salon Perimeter Shimoga — Owner Admin Portal Logic
 * Manages JWT session, fetching enquiries, status updates, and deletion.
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'salon_perimeter_admin_token';
  const USER_KEY = 'salon_perimeter_admin_user';

  // State
  let currentToken = localStorage.getItem(TOKEN_KEY) || '';
  let currentFilter = 'all';
  let currentPage = 1;
  let totalPages = 1;

  // DOM Elements
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const adminUserPill = document.getElementById('adminUserPill');
  const logoutBtn = document.getElementById('logoutBtn');

  // Stats Elements
  const statPending = document.getElementById('statPending');
  const statConfirmed = document.getElementById('statConfirmed');
  const statCompleted = document.getElementById('statCompleted');
  const statTotal = document.getElementById('statTotal');

  // Enquiries Table Elements
  const filterBtns = document.querySelectorAll('.filter-btn');
  const refreshBtn = document.getElementById('refreshBtn');
  const enquiriesBody = document.getElementById('enquiriesBody');
  const tableLoader = document.getElementById('tableLoader');
  const tableEmpty = document.getElementById('tableEmpty');
  const tableWrap = document.getElementById('tableWrap');
  const pageInfo = document.getElementById('pageInfo');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const toastPopup = document.getElementById('toastPopup');

  // Helper: Toast Message
  let toastTimer = null;
  function showToast(message) {
    if (!toastPopup) return;
    toastPopup.textContent = message;
    toastPopup.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastPopup.classList.remove('show');
    }, 3500);
  }

  // Helper: Format Date
  function formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Check auth session
  async function checkSession() {
    if (!currentToken) {
      showLoginScreen();
      return;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.user || JSON.parse(localStorage.getItem(USER_KEY) || '{}');
        showDashboard(user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session verification check failed:', err);
      // Still show login screen if server not reachable or token rejected
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
  }

  function showDashboard(user) {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    if (adminUserPill && user?.username) {
      adminUserPill.innerHTML = `Logged in as <strong>${escapeHtml(user.username)}</strong>`;
    }
    loadDashboardData();
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginAlert.style.display = 'none';

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username || !password) return;

      loginBtn.disabled = true;
      loginBtn.classList.add('loading');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          currentToken = data.token;
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          passwordInput.value = '';
          showDashboard(data.user);
          showToast(`Welcome back, ${data.user.username}!`);
        } else {
          loginAlert.textContent = data.message || 'Invalid username or password.';
          loginAlert.style.display = 'block';
        }
      } catch (err) {
        loginAlert.textContent = 'Unable to connect to server. Please try again.';
        loginAlert.style.display = 'block';
      } finally {
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
      }
    });
  }

  // Logout
  function logout() {
    currentToken = '';
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    showLoginScreen();
    showToast('Logged out successfully.');
  }

  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Load Dashboard Data (Stats + Enquiries)
  async function loadDashboardData() {
    await Promise.all([loadStats(), loadAppointments()]);
  }

  // Fetch Stats
  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.status === 401) return logout();
      if (!res.ok) return;

      const data = await res.json();
      if (data.stats) {
        if (statPending) statPending.textContent = data.stats.pending || 0;
        if (statConfirmed) statConfirmed.textContent = data.stats.confirmed || 0;
        if (statCompleted) statCompleted.textContent = data.stats.completed || 0;
        if (statTotal) statTotal.textContent = data.stats.total || 0;
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  // Fetch Appointments
  async function loadAppointments() {
    if (!enquiriesBody) return;

    tableLoader.style.display = 'block';
    tableEmpty.style.display = 'none';
    tableWrap.style.display = 'none';

    try {
      const url = `/api/admin/appointments?status=${currentFilter}&page=${currentPage}&limit=20`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (res.status === 401) return logout();

      const data = await res.json();

      if (res.ok && data.appointments) {
        totalPages = data.totalPages || 1;
        renderAppointments(data.appointments, data.total, data.page);
      } else {
        showToast(data.message || 'Failed to fetch enquiries.');
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      showToast('Error connecting to backend API.');
    } finally {
      tableLoader.style.display = 'none';
    }
  }

  // Render Appointments Table
  function renderAppointments(appointments, total, page) {
    if (!appointments || appointments.length === 0) {
      tableEmpty.style.display = 'block';
      tableWrap.style.display = 'none';
      pageInfo.textContent = 'Showing 0 of 0';
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = true;
      return;
    }

    tableEmpty.style.display = 'none';
    tableWrap.style.display = 'block';

    const start = (page - 1) * 20 + 1;
    const end = Math.min(page * 20, total);
    pageInfo.textContent = `Showing ${start}–${end} of ${total} enquiries`;

    prevPageBtn.disabled = page <= 1;
    nextPageBtn.disabled = page >= totalPages;

    enquiriesBody.innerHTML = appointments.map((item) => {
      const createdStr = formatDateTime(item.created_at);
      const prefDateStr = formatDate(item.preferred_date);
      const notes = item.message ? escapeHtml(item.message) : '<em style="color:#A09890">None</em>';

      return `
        <tr data-id="${item.id}">
          <td class="cell-time">${createdStr}</td>
          <td class="cell-name">${escapeHtml(item.customer_name)}</td>
          <td class="cell-phone">
            <a href="tel:${escapeHtml(item.phone)}" title="Call client at ${escapeHtml(item.phone)}">
              📞 ${escapeHtml(item.phone)}
            </a>
          </td>
          <td class="cell-service">${escapeHtml(item.service)}</td>
          <td class="cell-date-time">
            <strong>${prefDateStr}</strong><br>
            <small style="color:var(--text-secondary)">${escapeHtml(item.preferred_time)}</small>
          </td>
          <td class="cell-notes" title="${notes}">${notes}</td>
          <td>
            <select class="status-select ${item.status}" data-id="${item.id}">
              <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
              <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
              <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>🌸 Completed</option>
              <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </td>
          <td>
            <button class="btn-delete" data-id="${item.id}" title="Remove enquiry record" aria-label="Delete enquiry">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach status update event listeners
    document.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = select.value;
        await updateStatus(id, newStatus, select);
      });
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this appointment enquiry record?')) {
          await deleteEnquiry(id);
        }
      });
    });
  }

  // Update Status API call
  async function updateStatus(id, newStatus, selectElement) {
    try {
      const res = await fetch(`/api/admin/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 401) return logout();

      const data = await res.json();
      if (res.ok) {
        selectElement.className = `status-select ${newStatus}`;
        showToast(`Status updated to "${newStatus}".`);
        loadStats(); // Refresh count metrics
      } else {
        showToast(data.message || 'Failed to update status.');
        loadAppointments();
      }
    } catch (err) {
      showToast('Error updating status.');
      loadAppointments();
    }
  }

  // Delete Enquiry API call
  async function deleteEnquiry(id) {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (res.status === 401) return logout();

      const data = await res.json();
      if (res.ok) {
        showToast('Enquiry record deleted.');
        loadDashboardData();
      } else {
        showToast(data.message || 'Failed to delete record.');
      }
    } catch (err) {
      showToast('Error communicating with server.');
    }
  }

  // Filter Buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-status');
      currentPage = 1;
      loadAppointments();
    });
  });

  // Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Refreshing enquiries...');
      loadDashboardData();
    });
  }

  // Pagination Handlers
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadAppointments();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadAppointments();
      }
    });
  }

  // Utility: HTML Escaping
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Change Password Modal Handlers
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const passwordModal = document.getElementById('passwordModal');
  const passwordModalBackdrop = document.getElementById('passwordModalBackdrop');
  const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
  const cancelPasswordModalBtn = document.getElementById('cancelPasswordModalBtn');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordModalAlert = document.getElementById('passwordModalAlert');
  const currentPasswordInput = document.getElementById('currentPasswordInput');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const savePasswordBtn = document.getElementById('savePasswordBtn');

  function openPasswordModal() {
    if (!passwordModal) return;
    if (passwordModalAlert) passwordModalAlert.style.display = 'none';
    if (changePasswordForm) changePasswordForm.reset();
    passwordModal.style.display = 'flex';
    if (currentPasswordInput) currentPasswordInput.focus();
  }

  function closePasswordModal() {
    if (!passwordModal) return;
    passwordModal.style.display = 'none';
  }

  if (changePasswordBtn) changePasswordBtn.addEventListener('click', openPasswordModal);
  if (closePasswordModalBtn) closePasswordModalBtn.addEventListener('click', closePasswordModal);
  if (cancelPasswordModalBtn) cancelPasswordModalBtn.addEventListener('click', closePasswordModal);
  if (passwordModalBackdrop) passwordModalBackdrop.addEventListener('click', closePasswordModal);

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (passwordModalAlert) passwordModalAlert.style.display = 'none';

      const currentPassword = currentPasswordInput?.value || '';
      const newPassword = newPasswordInput?.value || '';

      if (!currentPassword || !newPassword) return;

      if (savePasswordBtn) {
        savePasswordBtn.disabled = true;
        const sp = savePasswordBtn.querySelector('.spinner');
        if (sp) sp.style.display = 'inline-block';
      }

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });

        if (res.status === 401) {
          const errData = await res.json();
          if (errData.error === 'INCORRECT_PASSWORD') {
            passwordModalAlert.textContent = 'Current password is incorrect.';
            passwordModalAlert.style.display = 'block';
            return;
          }
          return logout();
        }

        const data = await res.json();

        if (res.ok && data.success) {
          closePasswordModal();
          showToast('Admin password updated successfully!');
        } else {
          passwordModalAlert.textContent = data.message || 'Failed to update password.';
          passwordModalAlert.style.display = 'block';
        }
      } catch (err) {
        passwordModalAlert.textContent = 'Network error. Please try again.';
        passwordModalAlert.style.display = 'block';
      } finally {
        if (savePasswordBtn) {
          savePasswordBtn.disabled = false;
          const sp = savePasswordBtn.querySelector('.spinner');
          if (sp) sp.style.display = 'none';
        }
      }
    });
  }

  // Startup: verify session
  checkSession();
})();
