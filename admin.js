/**
 * ============================================================================
 * SRINIDHI EYE CARE & OPTICALS — CLINIC ADMIN PORTAL
 * Peerzad Street, Vidya Nagar, Gangavathi, Karnataka - 583227
 * Standalone Client-Side & Remote Hybrid Management System
 * ============================================================================
 */

(function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'srinidhi_admin_authenticated';
  const APPOINTMENTS_KEY = 'srinidhi_appointments';

  // State
  let isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
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
  const toastContainer = document.getElementById('toastContainer');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

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
  const modalWaBtn = document.getElementById('modalWaBtn');

  // Add Walk-in Modal
  const addWalkInModal = document.getElementById('addWalkInModal');
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const closeAddModalBtn = document.getElementById('closeAddModalBtn');
  const dismissAddModalBtn = document.getElementById('dismissAddModalBtn');
  const addWalkInForm = document.getElementById('addWalkInForm');
  const walkinDate = document.getElementById('walkinDate');

  // Helpers
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
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

  // Pre-seed default data if local storage is empty
  function getStoredAppointments() {
    try {
      const stored = localStorage.getItem(APPOINTMENTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    // Default seeded clinical consultations
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 4);

    const initialData = [
      {
        id: 'SNE-8472',
        customer_name: 'Anand Kumar',
        phone: '9845123456',
        email: 'anand.k@example.com',
        service: 'Computerised Automated Vision Testing',
        preferred_date: tomorrow.toISOString().split('T')[0],
        preferred_time: '10:00 AM - 11:30 AM',
        message: 'Experiencing blurred vision in right eye while driving at night.',
        status: 'confirmed',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'SNE-6190',
        customer_name: 'Rajesh Patil',
        phone: '9741234567',
        email: '',
        service: 'Progressive & Bifocal Clinic',
        preferred_date: dayAfter.toISOString().split('T')[0],
        preferred_time: '04:30 PM - 06:00 PM',
        message: 'Need seamless reading corridor without side distortion. Age 48.',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'SNE-4512',
        customer_name: 'Sneha Kulkarni',
        phone: '9980123456',
        email: 'sneha.k@techmail.com',
        service: 'Anti-Glare & Blue-Cut Lenses',
        preferred_date: nextWeek.toISOString().split('T')[0],
        preferred_time: '11:30 AM - 01:00 PM',
        message: '10+ hours daily screen usage. Looking for Crizal Prevencia or Essilor Blue-cut.',
        status: 'confirmed',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'SNE-2309',
        customer_name: 'Vijay Shettar',
        phone: '8762888866',
        email: 'v.shettar@karnataka.gov.in',
        service: 'Designer Frame Selection & Fitting',
        preferred_date: new Date().toISOString().split('T')[0],
        preferred_time: '06:00 PM - 08:00 PM',
        message: 'Selected handcrafted matte obsidian acetate frame. Completed fitting and centration.',
        status: 'completed',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString()
      }
    ];

    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(initialData));
    return initialData;
  }

  function saveAppointments(data) {
    appointments = data;
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(data));
    recalculateCounters();
    renderAppointments();
  }

  // Authentication check
  function checkAuthStatus() {
    if (isAuthenticated) {
      loginScreen.style.display = 'none';
      dashboardScreen.style.display = 'flex';
      loadDashboard();
    } else {
      loginScreen.style.display = 'flex';
      dashboardScreen.style.display = 'none';
    }
  }

  // Login handler
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = usernameInput.value.trim().toLowerCase();
    const p = passwordInput.value.trim();

    // Accepted usernames and passwords
    const validUsers = ['admin', 'srinidhi_admin', 'salon_owner'];
    const validPasswords = ['Srinidhi@2026', 'SrinidhiEye#2026', 'admin123', 'admin'];

    loginBtn.disabled = true;
    const btnText = loginBtn.querySelector('span');
    if (btnText) btnText.textContent = 'Verifying...';

    setTimeout(() => {
      if (validUsers.includes(u) && validPasswords.includes(p)) {
        isAuthenticated = true;
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        loadDashboard();
        showToast('Welcome to Srinidhi Eye Care Administration');
      } else {
        loginAlert.textContent = 'Invalid username or password. Please use admin / Srinidhi@2026';
        loginAlert.className = 'login-alert alert-error';
        loginAlert.style.display = 'block';
      }
      loginBtn.disabled = false;
      if (btnText) btnText.textContent = 'Sign In to Clinic Portal';
    }, 300);
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    isAuthenticated = false;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
    showToast('Signed out successfully.');
  });

  // Refresh handler
  refreshBtn.addEventListener('click', () => {
    loadDashboard(true);
  });

  function loadDashboard(isManual = false) {
    appointments = getStoredAppointments();
    recalculateCounters();
    renderAppointments();
    if (isManual) {
      showToast('Appointments refreshed from local registry.');
    }
  }

  function recalculateCounters() {
    stats = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const appt of appointments) {
      stats.total++;
      const s = (appt.status || 'pending').toLowerCase();
      if (stats[s] !== undefined) {
        stats[s]++;
      }
    }

    if (statTotal) statTotal.textContent = stats.total;
    if (statPending) statPending.textContent = stats.pending;
    if (statConfirmed) statConfirmed.textContent = stats.confirmed;
    if (statCompleted) statCompleted.textContent = stats.completed;
    if (statCancelled) statCancelled.textContent = stats.cancelled;
  }

  function renderAppointments() {
    let filtered = [...appointments];

    if (currentFilter !== 'all') {
      filtered = filtered.filter(a => (a.status || 'pending').toLowerCase() === currentFilter.toLowerCase());
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(a => {
        const name = (a.customer_name || '').toLowerCase();
        const phone = (a.phone || '').toLowerCase();
        const id = (a.id || '').toLowerCase();
        const s = (a.service || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || id.includes(q) || s.includes(q);
      });
    }

    if (showingCount) showingCount.textContent = filtered.length;

    if (filtered.length === 0) {
      appointmentsBody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    appointmentsBody.innerHTML = filtered.map(appt => {
      const status = (appt.status || 'pending').toLowerCase();
      const cleanPhone = (appt.phone || '').replace(/[\s\-\(\)\+]/g, '');
      const waText = encodeURIComponent(
        `Hello ${appt.customer_name}, Greetings from Srinidhi Eye Care & Opticals, Gangavathi.\nYour appointment for "${appt.service}" is confirmed for ${appt.preferred_date} at ${appt.preferred_time}.\nLocation: Peerzad Street, Vidya Nagar.\nPhone: +91 87628 88866.`
      );

      return `
        <tr data-id="${appt.id}">
          <td>
            <strong>${escapeHtml(appt.customer_name)}</strong>
            <br>
            <span class="ref-badge" style="font-size:10px;font-family:monospace;color:#888;">${escapeHtml(appt.id)}</span>
          </td>
          <td>
            <a href="tel:${cleanPhone}" style="color:#FFF;text-decoration:none;font-weight:600;">${escapeHtml(appt.phone)}</a>
            ${appt.email ? `<br><span style="font-size:11px;color:#888;">${escapeHtml(appt.email)}</span>` : ''}
          </td>
          <td>
            <span class="service-pill" style="font-size:12px;color:#D4D4D4;">${escapeHtml(appt.service)}</span>
          </td>
          <td>
            <span style="font-weight:600;">${escapeHtml(appt.preferred_date)}</span>
            <br>
            <span style="font-size:11px;color:#888;">${escapeHtml(appt.preferred_time)}</span>
          </td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#AAA;">
            ${escapeHtml(appt.message || 'No notes')}
          </td>
          <td>
            <select class="status-select status-${status}" data-id="${appt.id}" style="padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;background:#1A1A1A;color:#FFF;border:1px solid #444;cursor:pointer;">
              <option value="pending" ${status === 'pending' ? 'selected' : ''}>PENDING</option>
              <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>CONFIRMED</option>
              <option value="completed" ${status === 'completed' ? 'selected' : ''}>COMPLETED</option>
              <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>CANCELLED</option>
            </select>
          </td>
          <td>
            <div class="table-actions-cell">
              <a href="https://wa.me/91${cleanPhone}?text=${waText}" target="_blank" class="btn-wa" title="Send WhatsApp Confirmation">💬 WA</a>
              <button type="button" class="btn btn-outline btn-sm view-btn" data-id="${appt.id}" style="padding:4px 8px;font-size:11px;">View</button>
              <button type="button" class="btn-delete-row" data-id="${appt.id}" title="Remove entry">&times;</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Status change listener
    appointmentsBody.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.getAttribute('data-id');
        const newStatus = e.target.value;
        const item = appointments.find(a => a.id === id);
        if (item) {
          item.status = newStatus;
          saveAppointments(appointments);
          showToast(`Status updated to ${newStatus.toUpperCase()}`);
        }
      });
    });

    // View Details click
    appointmentsBody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = appointments.find(a => a.id === id);
        if (item) openDetailModal(item);
      });
    });

    // Delete row click
    appointmentsBody.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to remove this appointment record?')) {
          const updated = appointments.filter(a => a.id !== id);
          saveAppointments(updated);
          showToast('Record deleted.');
        }
      });
    });
  }

  // Detail Modal
  function openDetailModal(appt) {
    modalRefId.textContent = appt.id;
    modalCustomerName.textContent = appt.customer_name;
    modalPhone.textContent = appt.phone;
    modalEmail.textContent = appt.email || 'Not provided';
    modalService.textContent = appt.service;
    modalSchedule.textContent = `${appt.preferred_date} at ${appt.preferred_time}`;
    modalStatusBadge.textContent = (appt.status || 'pending').toUpperCase();
    modalSubmitted.textContent = appt.created_at ? new Date(appt.created_at).toLocaleString('en-IN') : '-';
    modalNotes.textContent = appt.message || 'No additional notes provided.';
    modalCallBtn.href = `tel:${appt.phone}`;

    const cleanPhone = (appt.phone || '').replace(/[\s\-\(\)\+]/g, '');
    const waText = encodeURIComponent(
      `Hello ${appt.customer_name}, Greetings from Srinidhi Eye Care & Opticals, Gangavathi.\nYour appointment for "${appt.service}" is scheduled for ${appt.preferred_date} at ${appt.preferred_time}.\nLocation: Peerzad Street, Vidya Nagar.\nPhone: +91 87628 88866.`
    );
    modalWaBtn.href = `https://wa.me/91${cleanPhone}?text=${waText}`;

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

  // Walk-in Add Modal
  if (walkinDate) {
    const today = new Date().toISOString().split('T')[0];
    walkinDate.value = today;
  }

  openAddModalBtn.addEventListener('click', () => {
    addWalkInModal.style.display = 'flex';
  });

  closeAddModalBtn.addEventListener('click', () => {
    addWalkInModal.style.display = 'none';
  });

  dismissAddModalBtn.addEventListener('click', () => {
    addWalkInModal.style.display = 'none';
  });

  addWalkInModal.addEventListener('click', (e) => {
    if (e.target === addWalkInModal) addWalkInModal.style.display = 'none';
  });

  addWalkInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newRecord = {
      id: `SNE-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: document.getElementById('walkinName').value.trim(),
      phone: document.getElementById('walkinPhone').value.trim(),
      email: document.getElementById('walkinEmail').value.trim(),
      service: document.getElementById('walkinService').value,
      preferred_date: document.getElementById('walkinDate').value,
      preferred_time: document.getElementById('walkinTime').value,
      message: document.getElementById('walkinNotes').value.trim(),
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    appointments.unshift(newRecord);
    saveAppointments(appointments);
    addWalkInForm.reset();
    addWalkInModal.style.display = 'none';
    showToast(`Walk-in patient ${newRecord.customer_name} added successfully!`);
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    if (appointments.length === 0) {
      showToast('No records to export', 'error');
      return;
    }

    const headers = ['Ref ID', 'Patient Name', 'Phone', 'Email', 'Service', 'Date', 'Time Slot', 'Status', 'Notes', 'Created At'];
    const rows = appointments.map(a => [
      `"${a.id}"`,
      `"${(a.customer_name || '').replace(/"/g, '""')}"`,
      `"${a.phone}"`,
      `"${a.email || ''}"`,
      `"${(a.service || '').replace(/"/g, '""')}"`,
      `"${a.preferred_date}"`,
      `"${a.preferred_time}"`,
      `"${a.status}"`,
      `"${(a.message || '').replace(/"/g, '""')}"`,
      `"${a.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `srinidhi_consultations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV successfully!');
  });

  // Search & Filter
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderAppointments();
  });

  statusFilter.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    updateStatCardHighlight(currentFilter);
    renderAppointments();
  });

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
      c.classList.toggle('active', c.getAttribute('data-status') === st);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize
  checkAuthStatus();

})();
