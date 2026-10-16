/**
 * Salon Perimeter Shimoga — Interactive Demo Website Script
 * Exclusively Serving Women & Children • Shivamogga, Karnataka
 * Features: Mobile Nav, Services Filter, Accessible Gallery Lightbox, Form Validation & Demo Simulation Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================================================
  // 1. DYNAMIC DATE SETUP & CURRENT YEAR
  // ==========================================================================
  const yearSpan = document.getElementById('yearSpan');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const prefDateInput = document.getElementById('prefDate');
  const dateHint = document.getElementById('dateHint');

  // Prevent selection of past dates by dynamically setting min to today (YYYY-MM-DD)
  function initMinDate() {
    if (!prefDateInput) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    prefDateInput.min = `${yyyy}-${mm}-${dd}`;
  }
  initMinDate();

  if (prefDateInput) {
    prefDateInput.addEventListener('change', () => {
      validateDateSelection(prefDateInput.value);
    });
  }

  function validateDateSelection(dateValue) {
    const dateError = document.getElementById('dateError');
    const formGroup = prefDateInput ? prefDateInput.closest('.form-group') : null;

    if (!dateValue) {
      if (dateError) dateError.textContent = 'Please choose a preferred date.';
      if (formGroup) formGroup.classList.add('has-error');
      if (prefDateInput) prefDateInput.setAttribute('aria-invalid', 'true');
      return false;
    }

    const selectedDate = new Date(dateValue + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 2 = Tuesday, 6 = Saturday

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      if (dateError) dateError.textContent = 'Appointments cannot be scheduled on past dates.';
      if (formGroup) formGroup.classList.add('has-error');
      if (prefDateInput) prefDateInput.setAttribute('aria-invalid', 'true');
      return false;
    }

    // Tuesday is day 2 (Salon Perimeter is closed on Tuesdays)
    if (dayOfWeek === 2) {
      if (dateError) dateError.textContent = 'Salon Perimeter is closed on Tuesdays. Please select Wed–Mon.';
      if (formGroup) formGroup.classList.add('has-error');
      if (prefDateInput) prefDateInput.setAttribute('aria-invalid', 'true');
      if (dateHint) {
        dateHint.textContent = '⚠️ Closed on Tuesdays. Please pick another day.';
        dateHint.classList.add('warning');
      }
      return false;
    }

    // Date is valid
    if (dateError) dateError.textContent = '';
    if (formGroup) formGroup.classList.remove('has-error');
    if (prefDateInput) prefDateInput.setAttribute('aria-invalid', 'false');
    if (dateHint) {
      dateHint.textContent = 'Min: Today • Closed on Tuesdays';
      dateHint.classList.remove('warning');
    }
    return true;
  }

  // ==========================================================================
  // 2. HEADER SCROLL & ACTIVE LINK HIGHLIGHTING
  // ==========================================================================
  const header = document.getElementById('header');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    if (header) {
      if (scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Highlight active section nav link
    let currentSectionId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });
    }
  }, { passive: true });

  // ==========================================================================
  // 3. MOBILE NAVIGATION DRAWER
  // ==========================================================================
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  let lastNavTrigger = null;

  function openMobileMenu() {
    if (!mobileDrawer) return;
    lastNavTrigger = document.activeElement;
    mobileDrawer.classList.add('open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (menuClose) menuClose.focus();
  }

  function closeMobileMenu() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastNavTrigger && typeof lastNavTrigger.focus === 'function') {
      lastNavTrigger.focus();
    }
  }

  if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
  if (menuClose) menuClose.addEventListener('click', closeMobileMenu);
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMobileMenu);

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // ==========================================================================
  // 4. SERVICE CARDS CATEGORY FILTER & ENQUIRE BUTTON PRE-FILL
  // ==========================================================================
  const serviceTabs = document.querySelectorAll('.filter-tab');
  const serviceCards = document.querySelectorAll('.service-card');

  serviceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      serviceTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const filterValue = tab.getAttribute('data-filter');

      serviceCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
          }, 40);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // "Enquire Now" buttons on service cards pre-fill the form and scroll down
  const selectServiceBtns = document.querySelectorAll('.select-service-btn');
  const serviceSelect = document.getElementById('serviceSelect');

  selectServiceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceValue = btn.getAttribute('data-service-value');
      
      if (serviceSelect && serviceValue) {
        serviceSelect.value = serviceValue;
        
        // Scroll smoothly to appointment section
        const appointmentSection = document.getElementById('appointment');
        if (appointmentSection) {
          appointmentSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Highlight select field
        serviceSelect.focus();
        serviceSelect.style.borderColor = 'var(--rose-gold)';
        serviceSelect.style.boxShadow = '0 0 0 4px rgba(168, 90, 101, 0.25)';
        setTimeout(() => {
          serviceSelect.style.boxShadow = '';
        }, 1500);
      }
    });
  });

  // ==========================================================================
  // 5. GALLERY FILTER & ACCESSIBLE LIGHTBOX MODAL
  // ==========================================================================
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  galleryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-gallery-filter');

      galleryItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (filter === 'all' || itemCategory === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox Data & Controls
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const lightboxCounter = document.getElementById('lightboxCounter');

  let currentGalleryIndex = 0;
  const galleryData = [];
  let lastGalleryTrigger = null;

  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    const title = item.querySelector('.gallery-title')?.textContent || 'Salon Perimeter';
    const category = item.querySelector('.gallery-category')?.textContent || 'Gallery';
    const src = img.src;
    const alt = img.alt;

    galleryData.push({ src, alt, title, category });

    // Open lightbox on click or Enter/Space
    item.addEventListener('click', () => {
      lastGalleryTrigger = item;
      openLightbox(index);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        lastGalleryTrigger = item;
        openLightbox(index);
      }
    });
  });

  function openLightbox(index) {
    if (!lightboxModal) return;
    currentGalleryIndex = index;
    updateLightboxContent();
    lightboxModal.classList.add('open');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('open');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastGalleryTrigger && typeof lastGalleryTrigger.focus === 'function') {
      lastGalleryTrigger.focus();
    }
  }

  function updateLightboxContent() {
    const item = galleryData[currentGalleryIndex];
    if (!item) return;

    if (lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
    }
    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxCategory) lightboxCategory.textContent = item.category;
    if (lightboxCounter) lightboxCounter.textContent = `${currentGalleryIndex + 1} of ${galleryData.length}`;
  }

  function prevLightboxItem() {
    currentGalleryIndex = (currentGalleryIndex - 1 + galleryData.length) % galleryData.length;
    updateLightboxContent();
  }

  function nextLightboxItem() {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryData.length;
    updateLightboxContent();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightboxItem);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightboxItem);

  // Close if clicking outside the modal dialog
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }

  // ==========================================================================
  // 6. APPOINTMENT ENQUIRY FORM VALIDATION & FRONT-END SIMULATION
  // ==========================================================================
  const appointmentForm = document.getElementById('appointmentForm');
  const submitBtn = document.getElementById('submitBtn');

  // Input Fields (Exactly the 6 requested fields)
  const clientName = document.getElementById('clientName');
  const clientPhone = document.getElementById('clientPhone');
  const clientMessage = document.getElementById('clientMessage');
  const prefTime = document.getElementById('prefTime');

  // Confirmation Modal Elements
  const confirmationModal = document.getElementById('confirmationModal');
  const confirmationBackdrop = document.getElementById('confirmationBackdrop');
  const confirmClose = document.getElementById('confirmClose');
  const confirmDoneBtn = document.getElementById('confirmDoneBtn');
  let lastModalTrigger = null;

  // Summary Ticket Elements
  const summaryName = document.getElementById('summaryName');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryService = document.getElementById('summaryService');
  const summaryDate = document.getElementById('summaryDate');
  const summaryTime = document.getElementById('summaryTime');
  const summaryNotes = document.getElementById('summaryNotes');
  const summaryNotesRow = document.getElementById('summaryNotesRow');

  // Validation Helpers
  function setFieldError(field, errorId, message) {
    if (!field) return;
    const formGroup = field.closest('.form-group');
    const errorEl = document.getElementById(errorId);
    if (formGroup) formGroup.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
    field.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field, errorId) {
    if (!field) return;
    const formGroup = field.closest('.form-group');
    const errorEl = document.getElementById(errorId);
    if (formGroup) formGroup.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
    field.setAttribute('aria-invalid', 'false');
  }

  // Form Error Banner Elements & Helpers
  const formErrorBanner = document.getElementById('formErrorBanner');
  const formErrorText = document.getElementById('formErrorText');

  function showFormError(msg) {
    if (formErrorBanner) {
      if (formErrorText) formErrorText.textContent = msg;
      formErrorBanner.style.display = 'flex';
      formErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function hideFormError() {
    if (formErrorBanner) {
      formErrorBanner.style.display = 'none';
    }
  }

  // Real-time error clearing on input
  if (clientName) {
    clientName.addEventListener('input', () => {
      hideFormError();
      if (clientName.value.trim().length >= 2) clearFieldError(clientName, 'nameError');
    });
  }

  if (clientPhone) {
    clientPhone.addEventListener('input', () => {
      hideFormError();
      const cleanPhone = clientPhone.value.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length >= 10) clearFieldError(clientPhone, 'phoneError');
    });
  }

  if (serviceSelect) {
    serviceSelect.addEventListener('change', () => {
      hideFormError();
      if (serviceSelect.value) clearFieldError(serviceSelect, 'serviceError');
    });
  }

  if (prefTime) {
    prefTime.addEventListener('change', () => {
      hideFormError();
      if (prefTime.value) clearFieldError(prefTime, 'timeError');
    });
  }

  // Sensible Indian Mobile Phone Validation
  function isSensibleIndianPhone(phoneString) {
    if (!phoneString) return false;
    // Strip all formatting spaces, hyphens, plus, parentheses
    const clean = phoneString.replace(/[\s\-\(\)\+]/g, '');
    
    // 10 digits starting with 6, 7, 8, or 9
    if (/^[6-9]\d{9}$/.test(clean)) return true;
    // 12 digits starting with country code 91 followed by 6-9
    if (/^91[6-9]\d{9}$/.test(clean)) return true;
    // 11 digits starting with trunk 0 followed by 6-9
    if (/^0[6-9]\d{9}$/.test(clean)) return true;
    
    return false;
  }

  // Form Submission Handler with Real Full-Stack API Integration
  let isSubmitting = false;

  if (appointmentForm) {
    appointmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Prevent accidental duplicate submission
      if (isSubmitting) return;

      hideFormError();

      let isValid = true;
      let firstErrorField = null;

      // 1. Validate Name
      const nameVal = clientName ? clientName.value.trim() : '';
      if (!nameVal || nameVal.length < 2) {
        setFieldError(clientName, 'nameError', 'Please enter your full name (at least 2 characters).');
        isValid = false;
        if (!firstErrorField) firstErrorField = clientName;
      } else {
        clearFieldError(clientName, 'nameError');
      }

      // 2. Validate Phone
      const phoneVal = clientPhone ? clientPhone.value.trim() : '';
      if (!isSensibleIndianPhone(phoneVal)) {
        setFieldError(clientPhone, 'phoneError', 'Please enter a valid 10-digit Indian phone number (e.g. +91 95913 24243).');
        isValid = false;
        if (!firstErrorField) firstErrorField = clientPhone;
      } else {
        clearFieldError(clientPhone, 'phoneError');
      }

      // 3. Validate Service Category
      if (!serviceSelect || !serviceSelect.value) {
        setFieldError(serviceSelect, 'serviceError', 'Please select a service category.');
        isValid = false;
        if (!firstErrorField) firstErrorField = serviceSelect;
      } else {
        clearFieldError(serviceSelect, 'serviceError');
      }

      // 4. Validate Preferred Date (including Tuesday check & past date prevention)
      const dateVal = prefDateInput ? prefDateInput.value : '';
      const isDateValid = validateDateSelection(dateVal);
      if (!isDateValid) {
        isValid = false;
        if (!firstErrorField) firstErrorField = prefDateInput;
      }

      // 5. Validate Preferred Time
      if (!prefTime || !prefTime.value) {
        setFieldError(prefTime, 'timeError', 'Please choose a preferred time slot.');
        isValid = false;
        if (!firstErrorField) firstErrorField = prefTime;
      } else {
        clearFieldError(prefTime, 'timeError');
      }

      // If validation fails, focus the first invalid field
      if (!isValid) {
        if (firstErrorField) firstErrorField.focus();
        return;
      }

      // Set submitting state & show loading spinner
      isSubmitting = true;
      if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
      }

      // Build payload for API
      const messageVal = clientMessage ? clientMessage.value.trim() : '';
      const payload = {
        customer_name: nameVal,
        phone: phoneVal,
        service: serviceSelect.value,
        preferred_date: dateVal,
        preferred_time: prefTime.value,
        message: messageVal
      };

      const apiBaseUrl = (window.SALON_CONFIG && window.SALON_CONFIG.API_BASE_URL) ? window.SALON_CONFIG.API_BASE_URL : '';
      const endpoint = `${apiBaseUrl}/api/appointments`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Success confirmed by backend database
          const savedRecord = data.data || payload;

          // Format Date nicely for display without timezone shifting
          let formattedDate = savedRecord.preferred_date;
          const dateMatch = String(savedRecord.preferred_date).match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            const monthIndex = parseInt(dateMatch[2], 10) - 1;
            const day = parseInt(dateMatch[3], 10);
            const d = new Date(year, monthIndex, day);
            formattedDate = d.toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } else {
            const d = new Date(savedRecord.preferred_date);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }
          }

          // Populate Confirmation Modal with actual confirmed values from database
          if (summaryName) summaryName.textContent = savedRecord.customer_name;
          if (summaryPhone) summaryPhone.textContent = savedRecord.phone;
          if (summaryService) summaryService.textContent = savedRecord.service;
          if (summaryDate) summaryDate.textContent = formattedDate;
          if (summaryTime) summaryTime.textContent = savedRecord.preferred_time;

          const summaryRefRow = document.getElementById('summaryRefRow');
          const summaryRefId = document.getElementById('summaryRefId');
          if (summaryRefRow && summaryRefId) {
            if (savedRecord.id) {
              summaryRefId.textContent = savedRecord.id;
              summaryRefRow.style.display = 'flex';
            } else {
              summaryRefRow.style.display = 'none';
            }
          }

          if (summaryNotes && summaryNotesRow) {
            if (savedRecord.message) {
              summaryNotes.textContent = savedRecord.message;
              summaryNotesRow.style.display = 'flex';
            } else {
              summaryNotesRow.style.display = 'none';
            }
          }

          // Clear form after verified database storage
          appointmentForm.reset();
          initMinDate();

          // Open Confirmation Modal displaying confirmed request details
          lastModalTrigger = submitBtn;
          openConfirmationModal();
        } else {
          // Server or validation failure — do NOT display fake success modal
          const errorMsg = data.message || 'Unable to submit your appointment enquiry. Please try again or call +91 95913 24243.';
          showFormError(errorMsg);
        }
      } catch (networkError) {
        console.error('[APPOINTMENTS] Network connection error:', networkError);
        showFormError('Could not connect to the booking server. Please verify your connection or call Salon Perimeter directly at +91 95913 24243.');
      } finally {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
        }
      }
    });
  }

  function openConfirmationModal() {
    if (!confirmationModal) return;
    confirmationModal.classList.add('open');
    confirmationModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (confirmDoneBtn) confirmDoneBtn.focus();
  }

  function closeConfirmationModal() {
    if (!confirmationModal) return;
    confirmationModal.classList.remove('open');
    confirmationModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
      lastModalTrigger.focus();
    }
  }

  if (confirmClose) confirmClose.addEventListener('click', closeConfirmationModal);
  if (confirmationBackdrop) confirmationBackdrop.addEventListener('click', closeConfirmationModal);
  if (confirmDoneBtn) confirmDoneBtn.addEventListener('click', closeConfirmationModal);

  // Close modal when clicking outside dialog
  if (confirmationModal) {
    confirmationModal.addEventListener('click', (e) => {
      if (e.target === confirmationModal) {
        closeConfirmationModal();
      }
    });
  }

  // ==========================================================================
  // 7. KEYBOARD ACCESSIBILITY (ESCAPE KEY & ARROWS)
  // ==========================================================================
  document.addEventListener('keydown', (e) => {
    // Escape key closes open overlay/modal
    if (e.key === 'Escape') {
      if (confirmationModal && confirmationModal.classList.contains('open')) {
        closeConfirmationModal();
      } else if (lightboxModal && lightboxModal.classList.contains('open')) {
        closeLightbox();
      } else if (mobileDrawer && mobileDrawer.classList.contains('open')) {
        closeMobileMenu();
      }
    }

    // Lightbox Arrow Navigation
    if (lightboxModal && lightboxModal.classList.contains('open')) {
      if (e.key === 'ArrowLeft') {
        prevLightboxItem();
      } else if (e.key === 'ArrowRight') {
        nextLightboxItem();
      }
    }
  });

  // ==========================================================================
  // 8. SMOOTH SCROLLING FOR ALL INTERNAL LINKS
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Console Welcome & Transparency Notice
  console.log(
    '%c✨ SALON PERIMETER SHIMOGA — PORTFOLIO DEMO CONCEPT ✨\n' +
    '%cExclusively serving women & children on Sharavathi Nagar Main Road, Shivamogga, Karnataka.\n' +
    'Notice: This website is an independent portfolio demonstration. It has not been approved or endorsed by Salon Perimeter.',
    'color: #A85A65; font-size: 14px; font-weight: bold;',
    'color: #4E4540; font-size: 12px;'
  );
});
