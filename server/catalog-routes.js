// DeBDe - Subsystem 2 (Catalog, Filtering & Item Details) - Basl
// Self-contained: it does NOT change any existing route in server.js.
// Hooked in with ONE line in server.js (see below).

module.exports = function catalogRoutes(app, ctx) {
  const { getItems, getUsers, authenticateToken } = ctx;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const isFree = (i) => i.isFree || Number(i.price) === 0;

  // Demo usage-history data for the mock items (items posted later fall back to defaults)
  const itemExtras = {
    1: { course: "Engineering Drawing", term: "Fall 2025", conditionNotes: "Complete set, barely used", usageHistory: ["Used for 1 semester in Engineering Drawing - Fall 2025"] },
    2: { course: "Data Structures (CS201)", term: "Spring 2025", conditionNotes: "Some highlighting inside", usageHistory: ["Used for 1 semester in CS201 - Spring 2025"] },
    3: { course: "Clinical Skills", term: "Fall 2025", conditionNotes: "Includes protective case", usageHistory: ["Used for 2 semesters in Clinical Skills"] },
    4: { course: "Calculus II", term: "Spring 2025", conditionNotes: "Works perfectly", usageHistory: ["Used for 1 semester in Calculus II - Spring 2025"] },
  };

  function renderCard(i) {
    const sold = i.status === "sold";
    return `
    <div class="card-item" id="catalog-item-${esc(i.id)}">
      <div class="item-img-placeholder">${esc(i.icon || "📦")}</div>
      <span class="badge ${sold ? "badge-sold" : "badge-available"}">${sold ? "Sold" : "Available"}</span>
      <div class="item-title">${esc(i.title)}</div>
      <div class="item-price">${isFree(i) ? "Free (Donation)" : esc(i.price) + " EGP"}</div>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">${esc(i.faculty)} — ${esc(i.pickup)}</p>
      <a href="/pages/item-details.html?id=${encodeURIComponent(i.id)}" class="btn btn-primary" style="width: 100%;">View Details</a>
    </div>`;
  }

  // Faculty names coming from the Home page are longer, so map them to keywords
  const known = ["engineering", "cs & it", "medicine", "pharmacy", "science"];
  const aliases = {
    "computer science & it": ["cs & it", "computer science"],
    "medicine & pharmacy": ["medicine", "pharmacy"],
    "applied health sciences": ["health"],
  };
  function matchFaculty(f, x) {
    const fl = (f || "").toLowerCase();
    if (x === "Other") return !known.some((k) => fl.includes(k));
    return (aliases[x.toLowerCase()] || [x.toLowerCase()]).some((w) => fl.includes(w));
  }

  // GET /api/catalog  -> filtered + sorted grid (HTML for HTMX)
  app.get("/api/catalog", (req, res) => {
    const q = req.query;
    const arr = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
    const faculties = arr(q.faculty);
    const conditions = arr(q.condition);
    const search = (q.q || "").toString().trim().toLowerCase();

    const list = getItems().filter((i) => {
      const facultyOk = !faculties.length || faculties.some((x) => matchFaculty(i.faculty, x));
      const conditionOk = !conditions.length || conditions.includes(i.condition);
      const priceOk = q.price === "free" ? isFree(i) : q.price === "paid" ? !isFree(i) : true;
      const searchOk = !search || [i.title, i.faculty, i.category, i.pickup].some((v) => (v || "").toLowerCase().includes(search));
      return facultyOk && conditionOk && priceOk && searchOk;
    });

    if (q.sort === "price_asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (q.sort === "price_desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else list.sort((a, b) => b.id - a.id); // newest first

    if (!list.length) return res.send('<div class="loading-text">No items match your filters.</div>');
    res.send(list.map(renderCard).join(""));
  });

  // GET /api/catalog/:id -> item details (JSON) for item-details.html
  app.get("/api/catalog/:id", (req, res) => {
    const item = getItems().find((i) => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: "Item not found" });
    const owner = getUsers().find((u) => u.id === item.ownerId);
    const extra = itemExtras[item.id] || {};
    res.json({
      id: item.id,
      title: item.title,
      icon: item.icon,
      status: item.status,
      price: isFree(item) ? 0 : item.price,
      faculty: item.faculty,
      condition: item.condition,
      conditionNotes: extra.conditionNotes || "",
      course: extra.course || item.category,
      term: extra.term || "-",
      pickupSpot: item.pickup,
      ownerName: owner ? owner.name : "Student",
      ownerVerified: Boolean(owner && owner.role === "student"),
      ownerPhone: (owner && owner.phone) || "201551353638", // demo number (same one the wishlist page uses)
      usageHistory: extra.usageHistory || [],
    });
  });

  // POST /api/catalog/wishlist/:id -> "Add to Saved Wishlist" button (mock until the wishlist stores real data)
  app.post("/api/catalog/wishlist/:id", authenticateToken, (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Login required" });
    res.json({ ok: true });
  });
};
