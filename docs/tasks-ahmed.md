# Task Specifications: Subsystem 1 (Exploration & Campus Community)
**Assigned Student:** Ahmed Alaaeldin (Seat/ID: 320250193)  
**Project:** DeBDe — Campus Peer-to-Peer Tool & Course Material Exchange (CNC111)

---

## 🎯 Overview of Your Subsystem
You are responsible for the entry point of the application: making sure the student or campus visitor is oriented, informed about active campus events/club activities, and can quickly filter or search for tools across departments.

---

## 📋 Task Checklist & Step-by-Step Instructions

### Task 1: Campus Announcements & Club Banners (Ticker)
- **Location:** `client/index.html` (Above or inside the hero section).
- **Endpoint to use:** `GET /api/announcements`
- **What to do:**
  1. The backend server already exposes an endpoint at `/api/announcements` that returns active club announcements (e.g. IEEE events) and campus notices.
  2. Implement an animated or clean ticker bar at the very top using basic HTML/CSS.
  3. Ensure it dynamically loads using HTMX:
     ```html
     <div hx-get="/api/announcements" hx-trigger="load" hx-swap="outerHTML"></div>
     ```
  4. Allow students and clubs to view announcement details or click through to related materials.

---

### Task 2: Homepage Hero & Quick Search
- **Location:** `client/index.html`
- **What to do:**
  1. Refine the hero headline and subtext to clearly communicate the campus peer-to-peer exchange mission (E-JUST students sharing tools, calculators, books, lab coats).
  2. The quick search form should submit a search query (`GET /pages/catalog.html?q=...`) to Basl's catalog page.
  3. Keep the layout simple using standard CSS (`max-width`, `margin: 0 auto`, `inline-block` / `floats`). Do not use complicated modern frameworks.

---

### Task 3: Location & Faculty Quick Selector
- **Location:** `client/index.html`
- **What to do:**
  1. Add a quick filter bar beneath the hero section with campus faculty pills/buttons:
     - All Faculties
     - Engineering
     - Computer Science & IT
     - Medicine & Pharmacy
     - Applied Health Sciences
  2. When a student clicks a faculty pill, link them directly to the filtered catalog:
     - Example: `<a href="pages/catalog.html?faculty=Engineering" class="btn btn-secondary btn-sm">Engineering</a>`
  3. Add a campus location badge (e.g., Gate 2, Central Library, Main Building) so students know where meetups happen.

---

### Task 4: Unified Navbar & Header Integration
- **Location:** Ensure all pages keep a synchronized navbar structure.
- **Rules to observe:**
  1. Do **not** hardcode user names or static "Sign In" buttons.
  2. Use the dynamic auth slot handled by Abdulhakim's auth system:
     ```html
     <li id="nav-auth-slot" hx-get="/api/auth/nav" hx-trigger="load" hx-swap="outerHTML">
       <a href="pages/auth.html" class="btn btn-secondary btn-sm">Sign In</a>
     </li>
     ```
  3. All CSS styling must follow `client/css/style.css` (no inline styles, no CSS grid).

---

## 🧪 How to Test Your Work
1. Open terminal inside `server/` and start the server:
   ```bash
   node server.js
   ```
2. Navigate to `http://localhost:3000` in your web browser.
3. Verify that the announcement banner loads automatically at the top.
4. Test typing into the search box and clicking faculty pills to ensure they redirect with query parameters to `pages/catalog.html`.
