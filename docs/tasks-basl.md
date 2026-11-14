# Task Specifications: Subsystem 2 (Catalog, Filtering & Item Details)
**Assigned Student:** Basl Wasim Ali Kelg (Seat/ID: 320250177)  
**Project:** DeBDe — Campus Peer-to-Peer Tool & Course Material Exchange (CNC111)

---

## 🎯 Overview of Your Subsystem
You are responsible for the core discovery engine: allowing students to browse available academic tools, textbooks, and kits, filter them by price (Free/Donation vs Paid), faculty, and condition, and open the item details to initiate a campus meetup or WhatsApp contact.

---

## 📋 Task Checklist & Step-by-Step Instructions

### Task 1: Multi-Attribute Filter Sidebar
- **Location:** `client/pages/catalog.html` (Left column `col-sidebar`).
- **What to do:**
  1. Build a sidebar form with filter controls:
     - **Faculty / Department:** Checkboxes or select dropdown (Engineering, CS & IT, Medicine, Pharmacy, Science, Other).
     - **Price Type:** Radio buttons (`All`, `Free / Donation Only (0 EGP)`, `Paid`).
     - **Condition:** Checkboxes (`New`, `Like New`, `Used`).
     - **Sort by:** Select (`Newest First`, `Price: Low to High`, `Price: High to Low`).
  2. Wire the form to submit via HTMX without full page reload:
     ```html
     <form hx-get="/api/items/feed" hx-target="#catalog-grid" hx-swap="innerHTML">
       <!-- Filter inputs -->
       <button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Apply Filters</button>
     </form>
     ```

---

### Task 2: Catalog Grid View & Dynamic Loading
- **Location:** `client/pages/catalog.html` (Right column `col-main`).
- **Endpoint to use:** `GET /api/items/feed` (or `GET /api/items/manage`)
- **What to do:**
  1. Replace the placeholder in `catalog.html` with a dynamic HTMX container:
     ```html
     <div class="row" id="catalog-grid" hx-get="/api/items/feed" hx-trigger="load" hx-swap="innerHTML">
       <div style="text-align: center; padding: 20px;">Loading catalog items...</div>
     </div>
     ```
  2. Each card rendered must display:
     - Item icon / placeholder (`📐`, `📚`, `🩺`, `💻`).
     - Availability badge (`Available` in green, `Sold` in grey).
     - Title, faculty, and campus pickup spot (e.g. Gate 2, Library).
     - Price (`Free (Donation)` or `X EGP`).
     - "View Details" button linking to the item details modal or page.

---

### Task 3: Item Details Page & Usage History
- **Location:** `client/pages/item-details.html` (or a modal inside `catalog.html`).
- **What to do:**
  1. Display item metadata: course name, term/semester used, condition notes, and owner's verified student badge.
  2. Include a "Usage History" section: e.g. "Used for 1 semester in CS101 - Spring 2025".
  3. Include an "Add to Saved Wishlist" button that connects to Abdulhakim's wishlist feature.

---

### Task 4: Direct WhatsApp & Campus Meetup Modal
- **Location:** Inside the item details or card action.
- **What to do:**
  1. Add a direct contact button that opens WhatsApp with a pre-filled message:
     ```html
     <a href="https://wa.me/201XXXXXXXXX?text=Hi,%20I%20am%20interested%20in%20your%20listing%20on%20DeBDe" 
        target="_blank" 
        class="btn btn-primary">
       Contact on WhatsApp
     </a>
     ```
  2. Add a simple campus meetup modal or notice showing safe exchange spots (Gate 2 Security, Library Reception, Student Activity Hub).

---

## 🧪 How to Test Your Work
1. Start the server from `server/`:
   ```bash
   node server.js
   ```
2. Open `http://localhost:3000/pages/catalog.html` in your browser.
3. Test applying filters and ensure items refresh dynamically.
4. Test clicking on an item and checking that the WhatsApp link contains proper campus meetup details.
