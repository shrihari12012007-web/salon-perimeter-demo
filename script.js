/**
 * ============================================================================
 * SRINIDHI EYE CARE & OPTICALS — CLIENT APPLICATION LOGIC
 * Peerzad Street, Vidya Nagar, Gangavathi, Karnataka - 583227
 * Phone: +91 87628 88866
 * ============================================================================
 */

(function () {
  'use strict';

  const config = window.SRINIDHI_CONFIG || {
    API_BASE_URL: 'http://localhost:5000'
  };

  const API_URL = `${config.API_BASE_URL}/api/appointments`;

  // ==========================================================================
  // 1. MOBILE DRAWER NAVIGATION
  // ==========================================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================================================
  // 2. THE INTERACTIVE SCROLL-TO-OPEN SPECTACLES ENGINE
  // ==========================================================================
  const spectStage = document.getElementById('spectStage');
  const spectStatusText = document.getElementById('spectStatusText');
  const spectProgressFill = document.getElementById('spectProgressFill');
  const spectPctText = document.getElementById('spectPctText');
  const templeLeft = document.getElementById('templeLeft');
  const templeRight = document.getElementById('templeRight');
  const spectFront = document.getElementById('spectFront');

  function updateSpectacleScroll() {
    if (!spectStage) return;

    const rect = spectStage.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Calculate normalized progress (0.0 to 1.0) while scrolling past the stage
    const totalDistance = rect.height + windowH * 0.4;
    const currentPassed = windowH - rect.top;
    let progress = Math.min(Math.max(currentPassed / totalDistance, 0), 1);

    const pct = Math.round(progress * 100);
    if (spectProgressFill) spectProgressFill.style.width = `${pct}%`;
    if (spectPctText) spectPctText.textContent = `${pct}%`;

    // Progressive unhinging of spectacle temples based on exact scroll position
    if (progress > 0.22) {
      spectStage.classList.add('unfolded');
      if (spectStatusText) {
        spectStatusText.textContent = 'State: Unfolded Precision Spectacles (Ready)';
      }

      // Calculate dynamic hinge angle: from 82deg closed down to 14deg fully open
      const unfoldRatio = Math.min((progress - 0.22) / 0.45, 1);
      const angle = 82 - (unfoldRatio * 66); // 82 -> 16 deg

      if (templeLeft) templeLeft.style.transform = `rotateY(${angle}deg) rotateZ(0deg)`;
      if (templeRight) templeRight.style.transform = `rotateY(-${angle}deg) rotateZ(0deg)`;

      // Gentle scale up for focus
      const scale = 1 + (unfoldRatio * 0.05);
      if (spectFront) spectFront.style.transform = `scale(${scale})`;
    } else {
      spectStage.classList.remove('unfolded');
      if (spectStatusText) {
        spectStatusText.textContent = 'State: Folded Eyewear Frame (Scroll to Open)';
      }
      if (templeLeft) templeLeft.style.transform = 'rotateY(82deg) rotateZ(-6deg)';
      if (templeRight) templeRight.style.transform = 'rotateY(-82deg) rotateZ(6deg)';
      if (spectFront) spectFront.style.transform = 'scale(1)';
    }
  }

  window.addEventListener('scroll', updateSpectacleScroll, { passive: true });
  window.addEventListener('resize', updateSpectacleScroll, { passive: true });
  updateSpectacleScroll(); // Initial check

  // ==========================================================================
  // 3. INTERACTIVE LENS COATING SIMULATOR
  // ==========================================================================
  const ctrlBtns = document.querySelectorAll('.ctrl-btn');
  const rims = document.querySelectorAll('.spectacle-rim');

  ctrlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ctrlBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterType = btn.getAttribute('data-filter');

      rims.forEach(rim => {
        rim.classList.remove('filter-bluecut', 'filter-antiglare', 'filter-progressive');
        if (filterType !== 'clear') {
          rim.classList.add(`filter-${filterType}`);
        }
      });
    });
  });

  // ==========================================================================
  // 4. SERVICE QUICK BOOKING BUTTONS
  // ==========================================================================
  const serviceSelect = document.getElementById('serviceSelect');
  const bookServiceBtns = document.querySelectorAll('.book-service-btn');

  bookServiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetService = btn.getAttribute('data-service');
      if (serviceSelect && targetService) {
        let matched = false;
        for (let i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].value === targetService) {
            serviceSelect.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) {
          const newOpt = new Option(targetService, targetService, true, true);
          serviceSelect.add(newOpt);
        }
      }

      const bookingSec = document.getElementById('booking');
      if (bookingSec) {
        bookingSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const nameInput = document.getElementById('clientName');
          if (nameInput) nameInput.focus();
        }, 600);
      }
    });
  });

  // ==========================================================================
  // 5. DATE PICKER SETUP (SET MIN DATE TO TODAY)
  // ==========================================================================
  const prefDateInput = document.getElementById('prefDate');
  if (prefDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    prefDateInput.min = `${yyyy}-${mm}-${dd}`;

    // Default to tomorrow if late evening
    const tomorrow = new Date(today);
    if (today.getHours() >= 18) {
      tomorrow.setDate(today.getDate() + 1);
    }
    const tY = tomorrow.getFullYear();
    const tM = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tD = String(tomorrow.getDate()).padStart(2, '0');
    prefDateInput.value = `${tY}-${tM}-${tD}`;
  }

  // ==========================================================================
  // 6. FORM VALIDATION & BACKEND SUBMISSION
  // ==========================================================================
  const form = document.getElementById('appointmentForm');
  const formAlert = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');

  const clientName = document.getElementById('clientName');
  const clientPhone = document.getElementById('clientPhone');
  const clientEmail = document.getElementById('clientEmail');
  const prefDate = document.getElementById('prefDate');
  const prefTime = document.getElementById('prefTime');
  const clientMessage = document.getElementById('clientMessage');

  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const emailError = document.getElementById('emailError');
  const serviceError = document.getElementById('serviceError');
  const dateError = document.getElementById('dateError');
  const timeError = document.getElementById('timeError');

  // Confirmation Modal Elements
  const confirmationModal = document.getElementById('confirmationModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalAcknowledgeBtn = document.getElementById('modalAcknowledgeBtn');
  const modalRefCode = document.getElementById('modalRefCode');
  const modalPatientName = document.getElementById('modalPatientName');
  const modalDepartment = document.getElementById('modalDepartment');
  const modalDate = document.getElementById('modalDate');
  const modalTime = document.getElementById('modalTime');
  const modalPhone = document.getElementById('modalPhone');
  const modalEmail = document.getElementById('modalEmail');
  const modalEmailRow = document.getElementById('modalEmailRow');

  function clearErrors() {
    [nameError, phoneError, emailError, serviceError, dateError, timeError].forEach(span => {
      if (span) span.textContent = '';
    });
    if (formAlert) {
      formAlert.style.display = 'none';
      formAlert.className = 'form-alert';
    }
  }

  function validateForm() {
    clearErrors();
    let isValid = true;

    // 1. Name
    const nameVal = clientName.value.trim();
    if (!nameVal) {
      nameError.textContent = 'Please enter your full name.';
      isValid = false;
    } else if (nameVal.length < 2) {
      nameError.textContent = 'Name must be at least 2 characters.';
      isValid = false;
    }

    // 2. Phone
    const phoneVal = clientPhone.value.trim();
    const cleanPhone = phoneVal.replace(/[\s\-\(\)\+]/g, '');
    const isIndianPhone = /^(?:91|0)?[6-9]\d{9}$/.test(cleanPhone);
    if (!phoneVal) {
      phoneError.textContent = 'Mobile number is required.';
      isValid = false;
    } else if (!isIndianPhone) {
      phoneError.textContent = 'Enter a valid 10-digit Indian mobile number (e.g. 8762888866).';
      isValid = false;
    }

    // 3. Email (Optional)
    const emailVal = clientEmail.value.trim();
    if (emailVal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }
    }

    // 4. Service
    if (!serviceSelect.value) {
      serviceError.textContent = 'Please select a consultation type.';
      isValid = false;
    }

    // 5. Date
    const dateVal = prefDate.value.trim();
    if (!dateVal) {
      dateError.textContent = 'Please select an appointment date.';
      isValid = false;
    } else {
      const chosen = new Date(dateVal + 'T00:00:00');
      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (chosen < todayDate) {
        dateError.textContent = 'Appointment date cannot be in the past.';
        isValid = false;
      }
    }

    // 6. Time Slot
    if (!prefTime.value) {
      timeError.textContent = 'Please select a preferred time slot.';
      isValid = false;
    }

    return isValid;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        const firstError = form.querySelector('.err-text:not(:empty)');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text');
      const spinner = submitBtn.querySelector('.spinner');
      if (btnText) btnText.textContent = 'Reserving Slot...';
      if (spinner) spinner.style.display = 'inline-block';

      const payload = {
        customer_name: clientName.value.trim(),
        phone: clientPhone.value.trim(),
        email: clientEmail.value.trim(),
        service: serviceSelect.value,
        preferred_date: prefDate.value.trim(),
        preferred_time: prefTime.value,
        message: clientMessage.value.trim()
      };

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const appointmentData = result.data || {};
          const refId = appointmentData.id 
            ? `SNE-${appointmentData.id.substring(0, 8).toUpperCase()}`
            : `SNE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

          modalRefCode.textContent = refId;
          modalPatientName.textContent = payload.customer_name;
          modalDepartment.textContent = payload.service;
          modalDate.textContent = formatDateIndian(payload.preferred_date);
          modalTime.textContent = payload.preferred_time;
          modalPhone.textContent = payload.phone;

          if (payload.email) {
            modalEmail.textContent = payload.email;
            modalEmailRow.style.display = 'flex';
          } else {
            modalEmailRow.style.display = 'none';
          }

          confirmationModal.style.display = 'flex';
          form.reset();

          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          prefDate.value = tomorrow.toISOString().split('T')[0];
        } else {
          formAlert.textContent = result.message || 'We could not process your request. Please call our clinic at +91 87628 88866.';
          formAlert.className = 'form-alert alert-error';
          formAlert.style.display = 'block';
          formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch (err) {
        console.error('[BOOKING] Error:', err);
        formAlert.innerHTML = `
          <strong>Connection Notice:</strong> Unable to reach server right now. 
          Please call or WhatsApp us directly at <a href="tel:+918762888866" style="color:#FFFFFF;text-decoration:underline;font-weight:bold;">+91 87628 88866</a> 
          to reserve your eye checkup immediately.
        `;
        formAlert.className = 'form-alert alert-error';
        formAlert.style.display = 'block';
        formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm Appointment Request';
        if (spinner) spinner.style.display = 'none';
      }
    });
  }

  function formatDateIndian(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  // ==========================================================================
  // 7. MODAL CONTROLS
  // ==========================================================================
  function closeModal() {
    if (confirmationModal) confirmationModal.style.display = 'none';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalAcknowledgeBtn) modalAcknowledgeBtn.addEventListener('click', closeModal);

  if (confirmationModal) {
    confirmationModal.addEventListener('click', (e) => {
      if (e.target === confirmationModal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmationModal && confirmationModal.style.display !== 'none') {
      closeModal();
    }
  });

})();
