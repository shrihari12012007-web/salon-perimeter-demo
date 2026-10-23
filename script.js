/**
 * ============================================================================
 * SRINIDHI EYE CARE HOSPITAL — CLIENT SCRIPT & APPLICATION LOGIC
 * Super Speciality Eye Hospital & Micro-Surgery Laser Center
 * Hospital Road, Near CBS Circle, Gangavathi, Koppal District, Karnataka - 583227
 * ============================================================================
 */

(function () {
  'use strict';

  // Config fallback
  const config = window.SRINIDHI_CONFIG || window.SALON_CONFIG || {
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
  // 2. INTERACTIVE VISION SYMPTOM CHECKER
  // ==========================================================================
  const symptomData = {
    cataract: {
      icon: '🌫️',
      category: 'Lens Opacity Analysis',
      title: 'Possible Cataract (Lens Clouding)',
      description: 'Progressive clouding of the eye’s natural crystalline lens, leading to faded colors, halos around oncoming headlights during night driving, and blurred vision.',
      investigation: 'Digital Slit Lamp Biomicroscopy + Biometry IOL Master',
      department: 'Micro-Incision Cataract Surgery (MICS / Phaco)',
      treatment: 'Blade-free 1.8mm MICS Phacoemulsification with Foldable Toric or Multifocal IOL (Day Care)'
    },
    lasik: {
      icon: '👓',
      category: 'Refractive Assessment',
      title: 'High Myopia, Hyperopia or Astigmatism (Glasses Dependency)',
      description: 'Corneal curvature error preventing light rays from focusing sharply on the retina. Ideal candidates are between 18 and 35 years old with stable refractive power for at least 1 year.',
      investigation: 'Corneal Topography Pentacam + Pachymetry Corneal Thickness Scan',
      department: 'Contoura Vision & Blade-Free LASIK',
      treatment: 'Contoura Vision / Femto Blade-Free LASIK (15-Minute Permanent Specs Removal)'
    },
    retina: {
      icon: '⚡',
      category: 'Posterior Segment & Vitreo-Retina',
      title: 'Vitreo-Retinal Changes / Diabetic Retinopathy',
      description: 'Sudden onset of dark floating spots (floaters), flashes of light, or distorted vision. In diabetic patients, this may indicate microvascular bleeding or macular edema.',
      investigation: 'Topcon 3D Optical Coherence Tomography (OCT) + Dilated Fundoscopy',
      department: 'Vitreo-Retina & Diabetic Eye Care',
      treatment: 'Targeted Green Laser Photocoagulation / Intravitreal Anti-VEGF Injections'
    },
    glaucoma: {
      icon: '👁️',
      category: 'Optic Nerve & Intraocular Pressure',
      title: 'Suspected Glaucoma / Ocular Hypertension',
      description: 'Known as the "silent thief of sight", high intraocular fluid pressure causes gradual peripheral vision tunneling often without initial pain.',
      investigation: 'Zeiss Humphrey Visual Field (HFA3) + Applanation Tonometry + RNFL OCT',
      department: 'Glaucoma Early Detection & Treatment',
      treatment: 'Pressure-lowering eye drops / Selective Laser Trabeculoplasty (SLT) / Trabeculectomy'
    },
    dryeye: {
      icon: '🔥',
      category: 'Ocular Surface & Tear Film',
      title: 'Chronic Dry Eye Syndrome / Digital Eye Strain',
      description: 'Evaporative tear film deficiency caused by prolonged computer/mobile screen usage, AC environment, or Meibomian gland dysfunction (MGD).',
      investigation: 'Schirmer’s Tear Test + Slit Lamp Tear Break-Up Time (TBUT)',
      department: 'Cornea, Dry Eye & Ocular Surface Clinic',
      treatment: 'Ocular Surface Spa, Preservative-Free Lubricants & Blue-Cut Computer Lenses'
    },
    pediatric: {
      icon: '👶',
      category: 'Pediatric Strabismus & Refraction',
      title: 'Childhood Strabismus (Squint) / Amblyopia (Lazy Eye)',
      description: 'Misaligned visual axes where one or both eyes turn inward or outward. Early treatment before age 8 prevents permanent amblyopia (lazy eye).',
      investigation: 'Cycloplegic Pediatric Refraction + Synoptophore Binocular Vision Test',
      department: 'Pediatric Ophthalmology & Squint Clinic',
      treatment: 'Corrective refractive glasses, patch occlusion therapy, or precision micro-squint surgery'
    }
  };

  const symptomCards = document.querySelectorAll('.symptom-card');
  const recommendationPanel = document.getElementById('recommendationPanel');
  const recIcon = document.getElementById('recIcon');
  const recCategory = document.getElementById('recCategory');
  const recTitle = document.getElementById('recTitle');
  const recDescription = document.getElementById('recDescription');
  const recInvestigation = document.getElementById('recInvestigation');
  const recDept = document.getElementById('recDept');
  const recTreatment = document.getElementById('recTreatment');
  const recBookBtn = document.getElementById('recBookBtn');
  const serviceSelect = document.getElementById('serviceSelect');

  let activeSymptomDept = '';

  symptomCards.forEach(card => {
    card.addEventListener('click', () => {
      symptomCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const symptomKey = card.getAttribute('data-symptom');
      const data = symptomData[symptomKey];

      if (data && recommendationPanel) {
        recIcon.textContent = data.icon;
        recCategory.textContent = data.category;
        recTitle.textContent = data.title;
        recDescription.textContent = data.description;
        recInvestigation.textContent = data.investigation;
        recDept.textContent = data.department;
        recTreatment.textContent = data.treatment;
        activeSymptomDept = data.department;

        recommendationPanel.style.display = 'block';
        recommendationPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  if (recBookBtn) {
    recBookBtn.addEventListener('click', () => {
      if (activeSymptomDept && serviceSelect) {
        serviceSelect.value = activeSymptomDept;
      }
      scrollToBooking();
    });
  }

  // ==========================================================================
  // 3. SPECIALTY CATEGORY FILTER TABS
  // ==========================================================================
  const specTabs = document.querySelectorAll('.spec-tab');
  const specialtyCards = document.querySelectorAll('.specialty-card');

  specTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      specTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      specialtyCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Department quick booking buttons
  const bookDeptBtns = document.querySelectorAll('.book-dept-btn');
  bookDeptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const deptName = btn.getAttribute('data-department');
      if (serviceSelect && deptName) {
        // Try exact match or select first match
        let found = false;
        for (let i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].value === deptName || deptName.includes(serviceSelect.options[i].value)) {
            serviceSelect.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          // Add temporary option if doctor specific
          const newOpt = new Option(deptName, deptName, true, true);
          serviceSelect.add(newOpt);
        }
      }
      scrollToBooking();
    });
  });

  function scrollToBooking() {
    const bookingSec = document.getElementById('booking');
    if (bookingSec) {
      bookingSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const nameInput = document.getElementById('clientName');
        if (nameInput) nameInput.focus();
      }, 600);
    }
  }

  // ==========================================================================
  // 4. ANIMATED STATISTICS COUNTER ON SCROLL
  // ==========================================================================
  let countersAnimated = false;
  const metricNums = document.querySelectorAll('.metric-num');

  function animateCounters() {
    if (countersAnimated) return;
    const strip = document.querySelector('.metrics-strip');
    if (!strip) return;

    const rect = strip.getBoundingClientRect();
    if (rect.top <= window.innerHeight && rect.bottom >= 0) {
      countersAnimated = true;
      metricNums.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'), 10);
        if (isNaN(target)) return;
        const duration = 1800;
        const startTime = performance.now();

        function updateCount(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out expo
          const currentVal = Math.floor(target * (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)));
          counter.textContent = `${currentVal.toLocaleString('en-IN')}+`;

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          } else {
            counter.textContent = `${target.toLocaleString('en-IN')}+`;
          }
        }

        requestAnimationFrame(updateCount);
      });
    }
  }

  window.addEventListener('scroll', animateCounters, { passive: true });
  animateCounters(); // Check on init

  // ==========================================================================
  // 5. DATE PICKER SETUP (PREVENT PAST DATES)
  // ==========================================================================
  const prefDateInput = document.getElementById('prefDate');
  if (prefDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    prefDateInput.min = `${yyyy}-${mm}-${dd}`;

    // Default to tomorrow if current time is late evening
    const tomorrow = new Date(today);
    if (today.getHours() >= 17) {
      tomorrow.setDate(today.getDate() + 1);
    }
    const tYyyy = tomorrow.getFullYear();
    const tMm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tDd = String(tomorrow.getDate()).padStart(2, '0');
    prefDateInput.value = `${tYyyy}-${tMm}-${tDd}`;
  }

  // ==========================================================================
  // 6. FORM VALIDATION & REAL BACKEND SUBMISSION
  // ==========================================================================
  const form = document.getElementById('appointmentForm');
  const formAlert = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');

  // Input fields
  const clientName = document.getElementById('clientName');
  const clientPhone = document.getElementById('clientPhone');
  const clientEmail = document.getElementById('clientEmail');
  const prefDate = document.getElementById('prefDate');
  const prefTime = document.getElementById('prefTime');
  const clientMessage = document.getElementById('clientMessage');

  // Error spans
  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const emailError = document.getElementById('emailError');
  const serviceError = document.getElementById('serviceError');
  const dateError = document.getElementById('dateError');
  const timeError = document.getElementById('timeError');

  // Modal elements
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
      nameError.textContent = 'Please enter patient full name.';
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
      phoneError.textContent = 'Mobile phone number is required.';
      isValid = false;
    } else if (!isIndianPhone) {
      phoneError.textContent = 'Enter a valid 10-digit Indian mobile number (e.g. 9448123456).';
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

    // 4. Speciality
    if (!serviceSelect.value) {
      serviceError.textContent = 'Please select a clinical department.';
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
      timeError.textContent = 'Please select a preferred OPD slot.';
      isValid = false;
    }

    return isValid;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        const firstError = form.querySelector('.field-error:not(:empty)');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Lock UI & show spinner
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text');
      const spinner = submitBtn.querySelector('.spinner');
      if (btnText) btnText.textContent = 'Securing OPD Slot...';
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

          // Populate Confirmation Modal
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

          // Open Modal
          confirmationModal.style.display = 'flex';
          form.reset();

          // Reset date to tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          prefDate.value = tomorrow.toISOString().split('T')[0];
        } else {
          // Display error banner
          formAlert.textContent = result.message || 'We were unable to process your appointment. Please call our hospital reception directly at +91 94481 23456.';
          formAlert.className = 'form-alert alert-error';
          formAlert.style.display = 'block';
          formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch (err) {
        console.error('[BOOKING] Submission network error:', err);
        formAlert.innerHTML = `
          <strong>Connection Timeout / Server Notice:</strong> 
          We could not reach the server right now. Please call our hospital front desk directly at 
          <a href="tel:+919448123456" style="color: #00E5FF; text-decoration: underline; font-weight: bold;">+91 94481 23456</a> 
          or <strong>08533-270123</strong> to book your OPD slot immediately.
        `;
        formAlert.className = 'form-alert alert-error';
        formAlert.style.display = 'block';
        formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm OPD Appointment Request';
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
  // 7. CONFIRMATION MODAL CONTROLS
  // ==========================================================================
  function closeModal() {
    if (confirmationModal) {
      confirmationModal.style.display = 'none';
    }
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
