# Salon Perimeter Shimoga — Luxury Demo Website Concept
> **Unofficial Portfolio Demonstration Concept**  
> *Dedicated to Women & Children in Shivamogga, Karnataka*

---

## 🌟 Project Overview

This repository contains a modern, mobile-first **portfolio demonstration website** designed for **Salon Perimeter Shimoga**, a boutique salon located on **Sharavathi Nagar Main Road in Shivamogga, Karnataka**, catering exclusively to **women and children**.

> [!IMPORTANT]  
> **Portfolio Transparency Notice:**  
> This project is an independent design concept created to showcase web development, UX design, and digital presentation skills. It is **NOT an officially commissioned website**, and has **not been endorsed or approved by Salon Perimeter Shimoga**.  
>  
> - No fake reviews, ratings, follower numbers, awards, staff profiles, or prices were invented.  
> - All photographs used are royalty-free stock assets curated specifically for visual demonstration purposes and do not represent the salon's actual staff or prior client work.  
> - The appointment enquiry form functions as an interactive client experience prototype and does not transmit actual bookings. To contact the salon directly, please call **+91 95913 24243**.

---

## 🏢 Business Reference Details

- **Business Name:** Salon Perimeter Shimoga
- **Location:** Sharavathi Nagar Main Road, Shivamogga, Karnataka 577201
- **Phone:** `+91 95913 24243`
- **Instagram:** [`@perimeter_shimoga`](https://www.instagram.com/perimeter_shimoga/)
- **Target Audience:** Exclusively Women & Children (No men's barbering or beard grooming)
- **Listed Hours:** 10:00 AM – 7:00 PM (Wednesday through Monday; **Closed on Tuesday**)

---

## 🎨 Visual Identity & Design System

The design reflects a serene, high-end beauty salon experience:
- **Color Palette:**
  - Cream & Ivory (`#FAF7F2`, `#FFFDF9`, `#F3ECE3`)
  - Rose Gold & Champagne Bronze accents (`#B76E79`, `#C58B7C`, `#C59B6C`)
  - Soft Blush glazes (`#FBF0ED`, `#F4E2DE`)
  - Warm Espresso typography (`#272220`, `#594F4A`)
- **Typography:**
  - Headings: `Cormorant Garamond` (classic, editorial elegance)
  - Body & UI: `Plus Jakarta Sans` (clean, contemporary, legible)
- **Imagery:** High-definition photography of female hair transformations, hair spa washes, gentle styling, and cheerful children's haircut care.

---

## 🚀 Key Features & Functionality

1. **Responsive Mobile-First Header & Navigation:**
   - Sticky header with glassmorphism blur and active scroll highlighting.
   - Accessible mobile drawer menu with backdrop blur, focus handling, and Escape key dismissal.
   - Mobile floating action bar for instant one-tap calling, Instagram viewing, and demo booking.

2. **Hero Section:**
   - Headline: *"Your Beauty, Our Art."*
   - Arched luxury visual framing with ambient badges.
   - Quick factual highlight badges (location, hours, ladies & kids focus).

3. **About Section:**
   - Dedicated narrative on why a specialized women and children salon offers superior comfort, privacy, and peace of mind in Shivamogga.
   - Honest value pillars: Comfort & Privacy, Gentle Pediatric Hair Care, Attentive Consultations, and Hygiene Protocols.

4. **Service Cards with Interactive Booking Integration:**
   - 6 detailed cards covering Women's Cuts, Hair Spa, Smoothening/Keratin, Color/Balayage, Kids Grooming, and Skin/Facials.
   - Category filter tabs (All, Haircuts, Treatments, Color, Kids, Beauty).
   - "Enquire Now" action buttons that scroll directly to the booking form and **automatically pre-select that specific service** in the form dropdown.

5. **Featured Instagram-Inspired Rituals:**
   - Editorial highlights inspired by `@perimeter_shimoga` content (Silken Smooth Therapy, Dimensional Caramel Highlights, Deep Moisture Spa, Joyful Little Star Sessions).

6. **Interactive Photo Gallery with Lightbox:**
   - Category filtering (All, Hair, Treatments, Kids, Ambiance).
   - Lightbox modal with Next/Previous arrows, keyboard navigation (`ArrowLeft`, `ArrowRight`, `Escape`), photo counter, and stock disclaimer caption.

7. **Why Choose Us (Zero Fake Stats):**
   - Grounded, honest differentiators focused on customer comfort, kid-friendly handling, and prime location.

8. **Instagram Community Showcase:**
   - Visual feed mockups linking directly to [`https://www.instagram.com/perimeter_shimoga/`](https://www.instagram.com/perimeter_shimoga/).

9. **Appointment Enquiry Prototype (Simulator):**
   - Visible amber warning banner clarifying that the form is a portfolio simulator.
   - **Form Validation:**
     - Full name validation.
     - Indian 10-digit phone format validation.
     - Dynamic **past date prevention** (sets HTML5 `min` to current date).
     - **Tuesday Closure Advisory:** Checks if the selected date falls on a Tuesday (day 2); displays an inline advisory that the salon is closed on Tuesdays and guides the user to select another day.
     - Required field highlighting with accessible `:focus-visible` styling.
   - **Dynamic Confirmation Modal:**
     - Displays an elegant digital booking ticket with submitted details (name, phone, guest type, service, formatted date, time, and special notes).
     - Option to copy or simulate another booking.

10. **Contact & Location:**
    - Clickable phone links (`tel:+919591324243`).
    - Clean Google Maps embed centered on Sharavathi Nagar Main Road, Shivamogga.
    - Clear operating hours with Tuesday CLOSED highlighted in red.

11. **Footer & Demo Transparency Disclosure:**
    - High-visibility banner stating:  
      *“UNOFFICIAL WEBSITE CONCEPT — CREATED FOR PORTFOLIO DEMONSTRATION”*

---

## 🛠️ Technology Stack

- **HTML5:** Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, `<footer>`, `<dialog>`), Open Graph tags, WCAG AA compliance.
- **CSS3:** Custom properties (CSS variables), CSS Grid, Flexbox, backdrop-filter, smooth animations, mobile-first media queries.
- **JavaScript (Vanilla ES6+):** Pure client-side code with zero dependencies. No external bulky frameworks.

---

## 📂 Project Structure

```
salon-perimeter-demo/
├── index.html     # Semantic HTML5 markup and layout
├── style.css      # Luxury responsive styling, variables, animations
├── script.js      # Interactive features, lightbox, validation, modal
└── README.md      # Documentation and deployment instructions
```

---

## 🌐 How to Deploy

### Option 1: GitHub Pages (Free & Recommended)
1. Initialize a Git repository and commit the files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Salon Perimeter Shimoga demo"
   ```
2. Create a new repository on [GitHub](https://github.com).
3. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/salon-perimeter-shimoga.git
   git branch -M main
   git push -u origin main
   ```
4. In GitHub, go to **Settings > Pages**.
5. Under **Branch**, select `main` and root `/`, then click **Save**.
6. Your website will be live at `https://<your-username>.github.io/salon-perimeter-shimoga/`.

### Option 2: Render (Static Site)
1. Sign up or log in at [Render.com](https://render.com).
2. Click **New + > Static Site**.
3. Connect your GitHub repository.
4. Set:
   - **Name:** `salon-perimeter-shimoga`
   - **Branch:** `main`
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `./`
5. Click **Create Static Site**. Render will provision your URL in seconds.

---

## 💻 Local Testing

You can preview the website locally using any standard HTTP server or by opening `index.html` directly:

- **Using Python:**
  ```bash
  python -m http.server 8000
  ```
  Open `http://localhost:8000` in your web browser.

- **Using Node `npx serve`:**
  ```bash
  npx serve .
  ```

---

## 📄 License & Attribution

- Built as an independent design portfolio sample.
- Business details referenced from public directory listings for Salon Perimeter Shimoga.
- Stock photography sourced via [Unsplash](https://unsplash.com) with standard royalty-free usage rights.
