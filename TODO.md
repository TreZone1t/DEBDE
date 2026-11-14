# DeBDe Project — Planned Tasks & Architecture TODO

## 📌 High Priority — Next Phase Refactoring

### 1. Filter Component Extraction (Catalog Filter Button & Drawer)
- [ ] **Separate Filter into Dedicated Toggle Button:**
  - Instead of having a permanently fixed left sidebar for filters in `client/pages/catalog.html`, convert the filter into a dedicated **"Filter & Refine"** action button.
  - When clicked, it opens a clean slide-over drawer or compact modal dialog containing:
    - Faculty / Department selector.
    - Price type (`Free / Donation` vs `Paid`).
    - Condition filter (`New`, `Like New`, `Used`).
    - Sorting options (`Newest`, `Price: Low to High`, `Price: High to Low`).
  - Applying the filter triggers `hx-get="/api/items/feed"` into `#catalog-grid` and closes the modal automatically.

### 2. Route Protection & Auth Gateways (Subsystem 3 - Abdulhakim)
- [x] **Strict Server Middleware Protection:**
  - Direct GET requests to `/pages/manage-listings.html`, `/pages/wishlist.html`, and `/pages/post-item.html` verify `debde_token` HTTP-only cookie. Guests are redirected immediately to `/pages/auth.html`.
- [x] **Client-Side Auth Guards:**
  - Instant script and HTMX check (`/api/auth/check`) inside protected pages preventing guest preview.
- [x] **Dynamic Auth Slot in Navbar:**
  - Replaced hardcoded buttons with reactive HTMX slot (`/api/auth/nav`) hiding `+ Post Item` and showing `Sign In` for guests; showing username and `Logout` for authenticated users.

### 3. Teammate Subsystem Integrations
- [ ] **Subsystem 1 Integration (Ahmed Alaaeldin):**
  - Connect quick search input on `index.html` to catalog query params (`/pages/catalog.html?q=...`).
  - Add interactive faculty quick-selector buttons under the hero section.
  - Finalize the dynamic campus announcement ticker banner from `/api/announcements`.
- [ ] **Subsystem 2 Integration (Basl Kelg):**
  - Render full catalog grid view from `/api/items/feed`.
  - Wire item cards to WhatsApp contact links and campus meetup details (Gate 2, Central Library).
  - Implement item usage history and "Save to Wishlist" action buttons.

### 4. Roles & Permissions (Students, Clubs, Suppliers)
- [x] Multi-account registration schema in `server.js` and `auth.html` (`student`, `club`, `supplier`).
- [ ] Role-specific dashboards (e.g. Club accounts managing campus announcements vs Suppliers managing store listings).
