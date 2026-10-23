/**
 * Srinidhi Eye Care Hospital — OPD Administration Portal Logic
 * Gangavathi, Koppal District, Karnataka
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'srinidhi_eye_admin_token';
  const LEGACY_TOKEN_KEY = 'salon_perimeter_admin_token';

  // State
  let currentToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || '';
  let currentFilter = 'all';
  let searchTerm = '';
  let appointments = [];
  let stats = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  // DOM Elements
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const userGreeting = document.getElementById('userGreeting');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  // Stats
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statConfirmed = document.getElementById('statConfirmed');
  const statCompleted = document.getElementById('statCompleted');
  const statCancelled = document.getElementById('statCancelled');
  const statCards = document.querySelectorAll('.stat-card');

  // Controls
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const showingCount = document.getElementById('showingCount');
  const appointmentsBody = document.getElementById('appointmentsBody');
  const emptyState = document.getElementById('emptyState');
  const emptyMessage = document.getElementById('emptyMessage');
  const toastContainer = document.getElementById('toastContainer');

  // Detail Modal
  const detailModal = document.getElementById('detailModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalDismissBtn = document.getElementById('modalDismissBtn');
  const modalRefId = document.getElementById('modalRefId');
  const modalCustomerName = document.getElementById('modalCustomerName');
  const modalPhone = document.getElementById('modalPhone');
  const modalEmail = document.getElementById('modalEmail');
  const modalService = document.getElementById('modalService');
  const modalSchedule = document.getElementById('modalSchedule');
  const modalStatusBadge = document.getElementById('modalStatusBadge');
  const modalSubmitted = document.getElementById('modalSubmitted');
  const modalNotes = document.getElementById('modalNotes');
  const modalCallBtn = document.getElementById('modalCallBtn');

  // Helpers
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function parseNotesAndEmail(rawMessage) {
    if (!rawMessage || !rawMessage.trim()) {
      return { email: '', notes: 'No additional notes provided.' };
    }
    const lines = rawMessage.split('\n');
    let email = '';
    const noteLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('email:')) {
        email = trimmed.substring(6).trim();
      } else {
        noteLines.push(line);
      }
    }

    const cleanNotes = noteLines.join('\n').trim();
    return {
      email,
      notes: cleanNotes || 'No additional notes provided.'
    };
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  // Session Check
  function checkSession() {
    if (currentToken) {
      loginScreen.style.display = 'none';
      dashboardScreen.style.display = 'flex';
      loadDashboard();
    } else {
      loginScreen.style.display = 'flex';
      dashboardScreen.style.display = 'none';
    }
  }

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.querySelector('span:first-child').textContent = 'Authenticating...';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        currentToken = data.token;
        localStorage.setItem(TOKEN_KEY, currentToken);
        localStorage.setItem(LEGACY_TOKEN_KEY, currentToken);
        if (data.user && data.user.username) {
          userGreeting.textContent = `Logged in as ${data.user.username}`;
        }
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        loadDashboard();
        showToast('Welcome to Srinidhi Eye Care Hospital Portal');
      } else {
        loginAlert.textContent = data.message || 'Invalid username or password.';
        loginAlert.className = 'login-alert alert-error';
        loginAlert.style.display = 'block';
      }
    } catch (err) {
      loginAlert.textContent = 'Unable to connect to hospital server. Please try again.';
      loginAlert.className = 'login-alert alert-error';
      loginAlert.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
      loginBtn.querySelector('span:first-child').textContent = 'Sign In to Hospital Portal';
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    currentToken = '';
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
    passwordInput.value = '';
    showToast('Signed out successfully.');
  });

  // Refresh handler
  refreshBtn.addEventListener('click', () => {
    loadDashboard(true);
  });

  // Fetch appointments and stats
  async function loadDashboard(isManualRefresh = false) {
    if (!currentToken) return;

    try {
      const res = await fetch('/api/admin/appointments?limit=150', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (res.status === 401) {
        logoutBtn.click();
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        appointments = data.data || [];
        recalculateCounters();
        renderAppointments();
        if (isManualRefresh) {
          showToast('Consultation list refreshed.');
        }
      } else {
        showToast(data.message || 'Failed to load records.', 'error');
      }
    } catch (err) {
      showToast('Network error while fetching appointments.', 'error');
    }
  }

  // Recalculate stats counters
  function recalculateCounters() {
    stats = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const appt of appointments) {
      stats.total++;
      const s = (appt.status || 'pending').toLowerCase();
      if (stats[s] !== undefined) {
        stats[s]++;
      }
    }

    statTotal.textContent = stats.total;
    statPending.textContent = stats.pending;
    statConfirmed.textContent = stats.confirmed;
    statCompleted.textContent = stats.completed;
    statCancelled.textContent = stats.cancelled;
  }

  // Filter & Render
  function renderAppointments() {
    let filtered = [...appointments];

    // Status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(a => (a.status || 'pending').toLowerCase() === currentFilter.toLowerCase());
    }

    // Search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(a => {
        const name = (a.customer_name || '').toLowerCase();
        const phone = (a.phone || '').toLowerCase();
        const dept = (a.service || '').toLowerCase();
        const id = (a.id || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || dept.includes(q) || id.includes(q);
      });
    }

    showingCount.textContent = filtered.length;

    if (filtered.length === 0) {
      appointmentsBody.innerHTML = '';
      emptyState.style.display = 'block';
      emptyMessage.textContent = searchTerm 
        ? `No patient records match "${searchTerm}".`
        : 'No consultation records found in this category.';
      return;
    }

    emptyState.style.display = 'none';

    let html = '';
    for (const appt of filtered) {
      const { email, notes } = parseNotesAndEmail(appt.message);
      const shortId = (appt.id || '').substring(0, 8).toUpperCase();
      const statusClass = `status-${(appt.status || 'pending').toLowerCase()}`;

      html += `
        <tr data-id="${appt.id}">
          <td class="patient-cell">
            <strong>${escapeHtml(appt.customer_name)}</strong>
            <span class="patient-id">SNE-${shortId}</span>
          </td>
          <td class="contact-cell">
            <a href="tel:${escapeHtml(appt.phone)}">${escapeHtml(appt.phone)}</a>
            ${email ? `<span class="patient-email">${escapeHtml(email)}</span>` : ''}
          </td>
          <td>
            <span class="dept-badge">${escapeHtml(appt.service)}</span>
          </td>
          <td>
            <span class="slot-date">${formatShortDate(appt.preferred_date)}</span>
            <span class="slot-time">${escapeHtml(appt.preferred_time)}</span>
          </td>
          <td>
            <div class="notes-preview" title="${escapeHtml(notes)}">${escapeHtml(notes)}</div>
          </td>
          <td>
            <select class="status-select ${statusClass}" data-id="${appt.id}" aria-label="Change status">
              <option value="pending" ${appt.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
              <option value="confirmed" ${appt.status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
              <option value="completed" ${appt.status === 'completed' ? 'selected' : ''}>🩺 Completed</option>
              <option value="cancelled" ${appt.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </td>
          <td>
            <div class="action-buttons">
              <button type="button" class="btn btn-outline btn-sm view-btn" data-id="${appt.id}">View Details</button>
            </div>
          </td>
        </tr>
      `;
    }

    appointmentsBody.innerHTML = html;
    bindTableEvents();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Bind dropdown & click events
  function bindTableEvents() {
    // Status Change
    const statusSelects = appointmentsBody.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = select.value;
        const previousStatus = appointments.find(a => a.id === id)?.status || 'pending';

        select.disabled = true;

        try {
          const res = await fetch(`/api/admin/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ status: newStatus })
          });

          if (res.status === 401) {
            logoutBtn.click();
            return;
          }

          const data = await res.json();
          if (res.ok && data.success) {
            const item = appointments.find(a => a.id === id);
            if (item) item.status = newStatus;
            select.className = `status-select status-${newStatus}`;
            recalculateCounters();
            showToast(`Status updated to ${newStatus.toUpperCase()}`);
          } else {
            select.value = previousStatus;
            showToast(data.message || 'Status update failed.', 'error');
          }
        } catch (err) {
          select.value = previousStatus;
          showToast('Network error while updating status.', 'error');
        } finally {
          select.disabled = false;
        }
      });
    });

    // View Details Click
    const viewBtns = appointmentsBody.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const appt = appointments.find(a => a.id === id);
        if (appt) openDetailModal(appt);
      });
    });
  }

  // Detail Modal Open
  function openDetailModal(appt) {
    const { email, notes } = parseNotesAndEmail(appt.message);
    const shortId = (appt.id || '').substring(0, 8).toUpperCase();

    modalRefId.textContent = `SNE-${shortId}`;
    modalCustomerName.textContent = appt.customer_name;
    modalPhone.textContent = appt.phone;
    modalEmail.textContent = email || 'Not provided';
    modalService.textContent = appt.service;
    modalSchedule.textContent = `${formatShortDate(appt.preferred_date)} at ${appt.preferred_time}`;
    modalStatusBadge.textContent = (appt.status || 'pending').toUpperCase();
    modalSubmitted.textContent = appt.created_at ? new Date(appt.created_at).toLocaleString('en-IN') : '-';
    modalNotes.textContent = notes;
    modalCallBtn.href = `tel:${appt.phone}`;

    detailModal.style.display = 'flex';
  }

  function closeDetailModal() {
    detailModal.style.display = 'none';
  }

  closeModalBtn.addEventListener('click', closeDetailModal);
  modalDismissBtn.addEventListener('click', closeDetailModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeDetailModal();
  });

  // Search input with debounce
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTerm = e.target.value.trim();
      renderAppointments();
    }, 250);
  });

  // Status Filter Select
  statusFilter.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    updateStatCardHighlight(currentFilter);
    renderAppointments();
  });

  // Stat Card click to filter
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      const st = card.getAttribute('data-status');
      currentFilter = st;
      statusFilter.value = st;
      updateStatCardHighlight(st);
      renderAppointments();
    });
  });

  function updateStatCardHighlight(st) {
    statCards.forEach(c => {
      if (c.getAttribute('data-status') === st) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailModal.style.display !== 'none') {
      closeDetailModal();
    }
  });

  // Init
  checkSession();
})();
