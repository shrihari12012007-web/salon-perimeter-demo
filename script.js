/**
 * Salon Perimeter Shimoga — Interactive Demo Website Script
 * Exclusively Serving Women & Children • Shivamogga, Karnataka
 * Features: Mobile Nav, Services Filter, Gallery Lightbox, Form Validation & Simulation Modal
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

  if (prefDateInput) {
    // Prevent selection of past dates by setting min attribute to today (YYYY-MM-DD)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDateString = `${yyyy}-${mm}-${dd}`;
    prefDateInput.min = minDateString;

    // Real-time check for Tuesday closure
    prefDateInput.addEventListener('change', () => {
      validateDateSelection(prefDateInput.value);
    });
  }

  function validateDateSelection(dateValue) {
    const dateError = document.getElementById('dateError');
    const formGroup = prefDateInput.closest('.form-group');

    if (!dateValue) {
      if (dateError) dateError.textContent = 'Please choose a preferred date.';
      if (formGroup) formGroup.classList.add('has-error');
      return false;
    }

    const selectedDate = new Date(dateValue + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 2 = Tuesday, 6 = Saturday

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      if (dateError) dateError.textContent = 'Appointments cannot be scheduled on past dates.';
      if (formGroup) formGroup.classList.add('has-error');
      return false;
    }

    // Tuesday is day 2
    if (dayOfWeek === 2) {
      if (dateError) dateError.textContent = 'Salon Perimeter is closed on Tuesdays. Please pick Wed–Mon.';
      if (formGroup) formGroup.classList.add('has-error');
      if (dateHint) {
        dateHint.textContent = '⚠️ Closed on Tuesdays. Please select another day.';
        dateHint.classList.add('warning');
      }
      return false;
    }

    // Clear error
    if (dateError) dateError.textContent = '';
    if (formGroup) formGroup.classList.remove('has-error');
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

    // Sticky header shadow
    if (scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Active nav link highlight on scroll
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

  function openMobileMenu() {
    mobileDrawer.classList.add('open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileDrawer.classList.remove('open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
  if (menuClose) menuClose.addEventListener('click', closeMobileMenu);
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMobileMenu);

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mobileDrawer.classList.contains('open')) closeMobileMenu();
      if (lightboxModal && lightboxModal.classList.contains('open')) closeLightbox();
      if (confirmationModal && confirmationModal.classList.contains('open')) closeConfirmationModal();
    }
  });

  // ==========================================================================
  // 4. SERVICE CARDS CATEGORY FILTER
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
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // "Enquire Now" button clicks on service cards pre-fill the form
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
        serviceSelect.style.boxShadow = '0 0 0 4px rgba(183, 110, 121, 0.3)';
        setTimeout(() => {
          serviceSelect.style.boxShadow = '';
        }, 1500);
      }
    });
  });

  // ==========================================================================
  // 5. GALLERY FILTER & LIGHTBOX MODAL
  // ==========================================================================
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  // Filter gallery
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

  // Lightbox Data Collection
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

  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    const title = item.querySelector('.gallery-title')?.textContent || 'Salon Perimeter';
    const category = item.querySelector('.gallery-category')?.textContent || 'Gallery';
    const src = img.src;
    const alt = img.alt;

    galleryData.push({ src, alt, title, category });

    // Open lightbox on click or Enter key
    item.addEventListener('click', () => {
      openLightbox(index);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
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
  }

  function updateLightboxContent() {
    const item = galleryData[currentGalleryIndex];
    if (!item) return;

    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxTitle.textContent = item.title;
    lightboxCategory.textContent = item.category;
    lightboxCounter.textContent = `${currentGalleryIndex + 1} of ${galleryData.length}`;
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

  // Keyboard navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('open')) return;

    if (e.key === 'ArrowLeft') {
      prevLightboxItem();
    } else if (e.key === 'ArrowRight') {
      nextLightboxItem();
    }
  });

  // ==========================================================================
  // 6. APPOINTMENT ENQUIRY FORM VALIDATION & SIMULATION
  // ==========================================================================
  const appointmentForm = document.getElementById('appointmentForm');
  const submitBtn = document.getElementById('submitBtn');

  // Input Fields
  const clientName = document.getElementById('clientName');
  const clientPhone = document.getElementById('clientPhone');
  const guestType = document.getElementById('guestType');
  const clientMessage = document.getElementById('clientMessage');
  const prefTime = document.getElementById('prefTime');

  // Confirmation Modal Elements
  const confirmationModal = document.getElementById('confirmationModal');
  const confirmationBackdrop = document.getElementById('confirmationBackdrop');
  const confirmClose = document.getElementById('confirmClose');
  const confirmDoneBtn = document.getElementById('confirmDoneBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');

  // Summary Elements
  const summaryName = document.getElementById('summaryName');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryGuest = document.getElementById('summaryGuest');
  const summaryService = document.getElementById('summaryService');
  const summaryDate = document.getElementById('summaryDate');
  const summaryTime = document.getElementById('summaryTime');
  const summaryNotes = document.getElementById('summaryNotes');
  const summaryNotesRow = document.getElementById('summaryNotesRow');

  // Validation Helpers
  function setFieldError(field, errorId, message) {
    const formGroup = field.closest('.form-group');
    const errorEl = document.getElementById(errorId);
    if (formGroup) formGroup.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
    field.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field, errorId) {
    const formGroup = field.closest('.form-group');
    const errorEl = document.getElementById(errorId);
    if (formGroup) formGroup.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
    field.setAttribute('aria-invalid', 'false');
  }

  // Real-time clearing of errors
  if (clientName) {
    clientName.addEventListener('input', () => {
      if (clientName.value.trim().length >= 2) clearFieldError(clientName, 'nameError');
    });
  }

  if (clientPhone) {
    clientPhone.addEventListener('input', () => {
      const cleanPhone = clientPhone.value.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length >= 10) clearFieldError(clientPhone, 'phoneError');
    });
  }

  if (guestType) {
    guestType.addEventListener('change', () => {
      if (guestType.value) clearFieldError(guestType, 'guestError');
    });
  }

  if (serviceSelect) {
    serviceSelect.addEventListener('change', () => {
      if (serviceSelect.value) clearFieldError(serviceSelect, 'serviceError');
    });
  }

  if (prefTime) {
    prefTime.addEventListener('change', () => {
      if (prefTime.value) clearFieldError(prefTime, 'timeError');
    });
  }

  // Form Submission Handler
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      let firstErrorField = null;

      // Validate Name
      const nameVal = clientName ? clientName.value.trim() : '';
      if (!nameVal || nameVal.length < 2) {
        setFieldError(clientName, 'nameError', 'Please enter your full name (at least 2 letters).');
        isValid = false;
        if (!firstErrorField) firstErrorField = clientName;
      } else {
        clearFieldError(clientName, 'nameError');
      }

      // Validate Phone (Indian numbers: 10 digits, optional +91 or 0 prefix)
      const phoneVal = clientPhone ? clientPhone.value.trim() : '';
      const digitsOnly = phoneVal.replace(/\D/g, '');
      // Standard Indian mobile is 10 digits (optionally preceded by 91 or 0, total 10 to 12 digits)
      const isValidPhone = digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91')) || (digitsOnly.length === 11 && digitsOnly.startsWith('0'));

      if (!phoneVal || !isValidPhone) {
        setFieldError(clientPhone, 'phoneError', 'Please enter a valid 10-digit phone number.');
        isValid = false;
        if (!firstErrorField) firstErrorField = clientPhone;
      } else {
        clearFieldError(clientPhone, 'phoneError');
      }

      // Validate Guest Type
      if (!guestType || !guestType.value) {
        setFieldError(guestType, 'guestError', 'Please specify who this appointment is for.');
        isValid = false;
        if (!firstErrorField) firstErrorField = guestType;
      } else {
        clearFieldError(guestType, 'guestError');
      }

      // Validate Service
      if (!serviceSelect || !serviceSelect.value) {
        setFieldError(serviceSelect, 'serviceError', 'Please select a desired service.');
        isValid = false;
        if (!firstErrorField) firstErrorField = serviceSelect;
      } else {
        clearFieldError(serviceSelect, 'serviceError');
      }

      // Validate Date (including Tuesday check & past date prevention)
      const dateVal = prefDateInput ? prefDateInput.value : '';
      const isDateValid = validateDateSelection(dateVal);
      if (!isDateValid) {
        isValid = false;
        if (!firstErrorField) firstErrorField = prefDateInput;
      }

      // Validate Time
      if (!prefTime || !prefTime.value) {
        setFieldError(prefTime, 'timeError', 'Please choose a preferred time slot.');
        isValid = false;
        if (!firstErrorField) firstErrorField = prefTime;
      } else {
        clearFieldError(prefTime, 'timeError');
      }

      // If invalid, focus first error field
      if (!isValid) {
        if (firstErrorField) firstErrorField.focus();
        return;
      }

      // If valid, simulate realistic submission with button spinner
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        // Format Date nicely
        const dateObj = new Date(dateVal + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-IN', options);

        // Populate Summary Modal
        summaryName.textContent = nameVal;
        summaryPhone.textContent = phoneVal;
        summaryGuest.textContent = guestType.value;
        summaryService.textContent = serviceSelect.value;
        summaryDate.textContent = formattedDate;
        summaryTime.textContent = prefTime.value;

        const messageVal = clientMessage ? clientMessage.value.trim() : '';
        if (messageVal) {
          summaryNotes.textContent = messageVal;
          summaryNotesRow.style.display = 'flex';
        } else {
          summaryNotesRow.style.display = 'none';
        }

        // Open Confirmation Modal
        openConfirmationModal();
      }, 650);
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
  }

  if (confirmClose) confirmClose.addEventListener('click', closeConfirmationModal);
  if (confirmationBackdrop) confirmationBackdrop.addEventListener('click', closeConfirmationModal);
  if (confirmDoneBtn) confirmDoneBtn.addEventListener('click', closeConfirmationModal);

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', () => {
      closeConfirmationModal();
      if (appointmentForm) {
        appointmentForm.reset();
        // Restore default min date
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        prefDateInput.min = `${yyyy}-${mm}-${dd}`;
      }
      if (clientName) clientName.focus();
    });
  }

  // ==========================================================================
  // 7. SMOOTH SCROLLING FOR ALL INTERNAL LINKS
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

  // Console Welcome & Transparency Note
  console.log(
    '%c✨ SALON PERIMETER SHIMOGA — PORTFOLIO DEMO CONCEPT ✨\n' +
    '%cExclusively serving women & children on Sharavathi Nagar Main Road, Shivamogga, Karnataka.\n' +
    'Note: This website is an independent portfolio demonstration created to showcase web development capabilities. It is NOT an officially commissioned or endorsed website by Salon Perimeter.',
    'color: #B76E79; font-size: 14px; font-weight: bold;',
    'color: #594F4A; font-size: 12px;'
  );
});
