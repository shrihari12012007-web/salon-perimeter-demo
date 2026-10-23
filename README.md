# SRINIDHI EYE CARE & OPTICALS — GANGAVATHI, KARNATAKA
### Classic Precision Optometry Clinic & Bespoke Eyewear Atelier
**Peerzad Street, Vidya Nagar (Near Chandrappa Hospital / Beside Yagna Olka Temple), Gangavathi - 583227, Koppal District, Karnataka**  
**Direct Line / WhatsApp**: `+91 87628 88866`

[![Live Website](https://img.shields.io/badge/Live%20Website-GitHub%20Pages-000000?style=for-the-badge&logo=github)](https://shrihari12012007-web.github.io/srinidhi-eye-care/)
[![Admin Portal](https://img.shields.io/badge/Staff%20Portal-Live-333333?style=for-the-badge&logo=render)](https://salon-perimeter-backend.onrender.com/admin)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-000000?style=for-the-badge&logo=postgresql)](https://render.com)
[![Build Status](https://img.shields.io/badge/Tests-17%2F17%20Passed-success?style=for-the-badge)](backend/test/backend-test.js)

---

## 👓 Overview & Clinic Reality

**Srinidhi Eye Care & Opticals** is an intimate, high-precision optometry clinic and curated optical atelier located on Peerzad Street in Vidya Nagar, Gangavathi. 

Focused on unhurried, personalized optical care, the clinic provides computerized eye refraction, prescription accuracy tuning, blue-cut computer screen protection, progressive lens adaptation, and handcrafted spectacle frame styling.

---

## 🌟 Key Features

1. **Scroll-Driven 3D Unfolding Spectacles**:
   - An interactive vector spectacle frame physically unfolds its temple arms (from closed 82° hinge to fully open 16° wear angle) as the user scrolls down the page.
   - Reveals internal lens science overlays:
     - **Blue-Cut & Anti-Glare Core**: 420nm high-energy blue light absorption.
     - **Progressive Corridor**: Seamless 3-in-1 focal zones for driving, computer work, and reading.
     - **Coating Simulator**: Interactive toggles for *Normal Vision*, *Blue-Cut Computer Filter*, *Anti-Glare Night Mode*, and *Progressive 3-Zone View*.

2. **Classic Black & White Luxury Editorial Aesthetic**:
   - Built with a pure monochrome luxury palette (`#000000` pitch black, `#FFFFFF` crisp white, and subtle dark stone accents).
   - High-end typography: **Playfair Display** (classic serif) paired with **Plus Jakarta Sans** (Swiss precision sans-serif).

3. **Focused Optometry Clinical Services**:
   - Computerized Vision Examination (objective auto-refraction + trial frame tuning).
   - Designer Frame Selection & Facial Fitting.
   - Progressive & Bifocal Consultation (corridor-free progressive optics).
   - Blue-Cut Screen Protection for digital workers & students.
   - Contact Lens Fitting & Hygienic Solution Counseling.
   - Preliminary Eye Health & Pressure Screening.

4. **Lens Science & Material Matrix**:
   - Comprehensive comparison matrix covering standard CR-39, Blue-Cut, High-Index 1.67/1.74 Ultra-Thin, and Digital Progressive lenses.

5. **Live Appointment Booking & Staff Admin Dashboard**:
   - Real-time booking form with Indian phone validation (`+91`), future date checking, duplicate prevention, and automated reference codes (`SNE-XXXX`).
   - Secure staff management portal at `/admin` with status management (Pending, Confirmed, Completed, Cancelled).

---

## 📍 Clinic Location & OPD Timings

- **Address**: Peerzad Street, Vidya Nagar (Near Chandrappa Hospital / Beside Yagna Olka Temple), Gangavathi - 583227, Koppal District, Karnataka.
- **Clinic OPD Timings**:
  - **Monday – Saturday**: 9:30 AM – 8:30 PM
  - **Sunday**: 10:00 AM – 2:00 PM (Afternoon Closed)
- **Direct Phone / WhatsApp**: `+91 87628 88866`
- **Email**: `care@srinidhieye.com`

---

## 💻 Tech Architecture

- **Frontend**: Vanilla HTML5, Modern CSS3 with 3D perspective transforms, Vanilla JavaScript ES6+.
- **Backend**: Node.js & Express REST API with security middleware (Helmet, CORS, Rate Limiting, Input Sanitization).
- **Database**: PostgreSQL on Render with fallback in-memory store for local development.
- **Admin Portal**: Fully responsive staff management interface at `/admin`.

---

## 🧪 Automated Verification Tests

To run the automated backend test suite (17 tests):

```bash
cd backend
node test/backend-test.js
```
