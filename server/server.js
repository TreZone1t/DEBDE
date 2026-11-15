const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
let cookieParser;
try {
  cookieParser = require("cookie-parser");
} catch (e) {
  cookieParser = () => (req, res, next) => {
    req.cookies = {};
    const rc = req.headers.cookie;
    if (rc) {
      rc.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        req.cookies[parts.shift().trim()] = decodeURIComponent(parts.join("="));
      });
    }
    next();
  };
}

let jwt;
try {
  jwt = require("jsonwebtoken");
} catch (e) {
  const crypto = require("crypto");
  jwt = {
    sign: (payload, secret, options = {}) => {
      const header = { alg: "HS256", typ: "JWT" };
      const exp =
        Math.floor(Date.now() / 1000) +
        (options.expiresIn === "7d" ? 7 * 86400 : 86400);
      const fullPayload = { ...payload, exp };
      const b64Header = Buffer.from(JSON.stringify(header)).toString(
        "base64url",
      );
      const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString(
        "base64url",
      );
      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${b64Header}.${b64Payload}`)
        .digest("base64url");
      return `${b64Header}.${b64Payload}.${signature}`;
    },
    verify: (token, secret, callback) => {
      try {
        if (!token || typeof token !== "string")
          return callback(new Error("Invalid token"));
        const parts = token.split(".");
        if (parts.length !== 3) return callback(new Error("Invalid format"));
        const [b64Header, b64Payload, sig] = parts;
        const expectedSig = crypto
          .createHmac("sha256", secret)
          .update(`${b64Header}.${b64Payload}`)
          .digest("base64url");
        if (sig !== expectedSig)
          return callback(new Error("Invalid signature"));
        const payload = JSON.parse(
          Buffer.from(b64Payload, "base64url").toString("utf8"),
        );
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
          return callback(new Error("Token expired"));
        }
        callback(null, payload);
      } catch (err) {
        callback(err);
      }
    },
  };
}

// Load .env variables
const envPath = path.join(__dirname, ".env");
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, ...vals] = line.trim().split("=");
    if (key && vals.length) envConfig[key.trim()] = vals.join("=").trim();
  });
}

const app = express();
const PORT = process.env.PORT || envConfig.PORT || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  envConfig.JWT_SECRET ||
  "debde_student_secret_key_2026";
const DEFAULT_IMAGE = "/assets/debde-icon.png";
const uploadDirectory = path.join(__dirname, "../client/assets/uploads");
if (!fs.existsSync(uploadDirectory)) fs.mkdirSync(uploadDirectory, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Helper Authentication Middleware
function authenticateToken(req, res, next) {
  const token =
    req.cookies.debde_token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) req.user = null;
    else req.user = user;
    next();
  });
}

// ==========================================
// STRICT PAGE-LEVEL ROUTE PROTECTION
// Redirects guests immediately to auth.html
// ==========================================
const protectedPages = [
  "/pages/manage-listings.html",
  "/pages/wishlist.html",
  "/pages/post-item.html",
  "/pages/post-announcement.html",
  "/manage-listings.html",
  "/wishlist.html",
  "/post-item.html",
];

app.use((req, res, next) => {
  if (protectedPages.some((p) => req.path.endsWith(p) || req.path === p)) {
    const token = req.cookies.debde_token;
    if (!token) {
      return res.redirect("/pages/auth.html");
    }
    return jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err || !user) {
        res.clearCookie("debde_token");
        return res.redirect("/pages/auth.html");
      }
      req.user = user;
      next();
    });
  }
  next();
});

// Serve static client files after protection layer
app.use(express.static(path.join(__dirname, "../client")));

// Mock Users Store (Supports Students, Clubs, and Suppliers)
let users = [
  {
    id: 1,
    name: "Demo Student",
    email: "student@ejust.edu.eg",
    password: "password123",
    role: "student",
    faculty: "Faculty of CS & IT",
    university: "E-JUST",
  },
  {
    id: 2,
    name: "IEEE CS Student Chapter",
    email: "ieee@ejust.edu.eg",
    password: "clubpassword",
    role: "club",
    faculty: "Engineering & IT Clubs",
    university: "E-JUST",
  },
  {
    id: 3,
    name: "Campus Supplies & Stationery",
    email: "store@campussupplies.eg",
    password: "storepassword",
    role: "supplier",
    faculty: "Commercial Supplier",
    university: "Alexandria / Borg El Arab",
  },
];

// Mock Items Store
let items = [
  {
    id: 1,
    title: "Rotring Technical Drawing Kit",
    category: "Engineering",
    faculty: "Faculty of Engineering",
    price: 250,
    isFree: false,
    condition: "Like New",
    pickup: "Campus Gate 2",
    status: "available",
    icon: "📐",
    image: DEFAULT_IMAGE,
    ownerId: 1,
  },
  {
    id: 2,
    title: "Data Structures & Algorithms Course Book",
    category: "Computer Science",
    faculty: "Faculty of CS & IT",
    price: 0,
    isFree: true,
    condition: "Good",
    pickup: "Central Library Hall",
    status: "available",
    icon: "📚",
    image: DEFAULT_IMAGE,
    ownerId: 1,
  },
  {
    id: 3,
    title: "Littmann Classic Stethoscope with Protective Case",
    category: "Medicine",
    faculty: "Faculty of Medicine",
    price: 650,
    isFree: false,
    condition: "Used",
    pickup: "Medical Compound Reception",
    status: "available",
    icon: "🩺",
    image: DEFAULT_IMAGE,
    ownerId: 2,
  },
  {
    id: 4,
    title: "Casio fx-991ARX Scientific Calculator",
    category: "Science",
    faculty: "Faculty of Science",
    price: 350,
    isFree: false,
    condition: "Like New",
    pickup: "Main Building 1",
    status: "sold",
    icon: "💻",
    image: "/assets/item-casio-real.jpeg",
    ownerId: 1,
  },
];

// Demo campus directory. The structure is intentionally data-driven so the
// Phase 1 mock can grow without changing the selector component.
const campusDirectory = [
  {
    university: "E-JUST",
    cities: [
      { city: "New Borg El Arab", campuses: ["Main Campus", "Student Activity Hub"] },
    ],
  },
  {
    university: "Alexandria University",
    cities: [
      { city: "Alexandria", campuses: ["Smouha Campus", "Medical Campus"] },
    ],
  },
  {
    university: "Cairo University",
    cities: [
      { city: "Giza", campuses: ["Main Campus", "Engineering Campus"] },
    ],
  },
];

// Announcements & Club Banners
let announcements = [
  {
    id: 1,
    type: "club",
    title: "IEEE CS Student Chapter: Web Programming Sprint & Workshop",
    author: "IEEE CS E-JUST",
    link: "/pages/announcement-details.html?id=1",
    university: "E-JUST",
    city: "New Borg El Arab",
    campus: "Main Campus",
    image: DEFAULT_IMAGE,
  },
  {
    id: 2,
    type: "campus",
    title: "Midterm Drafting Kit & Textbooks Swap at Gate 2",
    author: "Student Union",
    link: "/pages/announcement-details.html?id=2",
    university: "E-JUST",
    city: "New Borg El Arab",
    campus: "Student Activity Hub",
    image: DEFAULT_IMAGE,
  },
  {
    id: 3,
    type: "supplier",
    title:
      "Borg El-Arab Bookstore: 20% Discount on Casio Calculators for E-JUST Students",
    author: "Campus Supplies Partner",
    link: "/pages/announcement-details.html?id=3",
    university: "Alexandria University",
    city: "Alexandria",
    campus: "Smouha Campus",
    image: DEFAULT_IMAGE,
  },
  {
    id: 4,
    type: "student project",
    title: "Jogo Project is back: custom stickers, posters, photocards, and bookmarks are open for orders",
    description:
      "Midterms are over. Treat yourself to something made for your laptop, walls, photocard collection, or study desk.",
    author: "Jogo Project",
    link: "/pages/announcement-details.html?id=4",
    university: "E-JUST",
    city: "New Borg El Arab",
    campus: "Student Activity Hub",
    image: "/assets/jojo-stickers.jpeg",
  },
];

// ==========================================
// AUTHENTICATION ROUTES (Subsystem 3)
// ==========================================

// Check Auth Status (HTMX Guard)
app.get("/api/auth/check", authenticateToken, (req, res) => {
  if (!req.user) {
    res.setHeader("HX-Redirect", "/pages/auth.html");
    return res.status(401).send(`
      <script>window.location.href = '/pages/auth.html';</script>
    `);
  }
  res.send("");
});

// Dynamic Navbar Auth Items
app.get("/api/auth/nav", authenticateToken, (req, res) => {
  if (!req.user) {
    return res.send(`
      <div id="nav-auth-slot" class="nav-actions"><a href="/pages/auth.html" class="btn btn-primary btn-sm">Sign In</a></div>
    `);
  }
  const roleBadge =
    req.user.role === "club"
      ? "Club"
      : req.user.role === "supplier"
        ? "Store"
        : "Student";
  return res.send(`
    <div id="nav-auth-slot" class="nav-actions">
      <span class="nav-user"><strong>${req.user.name}</strong> <span class="badge badge-available">${roleBadge}</span></span>
    </div>
  `);
});

// Login endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    (u) => u.email.toLowerCase() === (email || "").toLowerCase().trim(),
  );

  if (!user || user.password !== password) {
    return res.status(400).send(`
      <div class="server-alert server-alert-error">
        Invalid email or password. Please try again.
      </div>
    `);
  }

  // Issue real JWT
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "student",
      faculty: user.faculty,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("debde_token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.setHeader("HX-Redirect", "/pages/manage-listings.html");
  res.send(`
    <div class="server-alert server-alert-success">
      Login successful! Redirecting to student dashboard...
    </div>
  `);
});

// Register endpoint
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, faculty, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).send(`
      <div class="server-alert server-alert-error">
        All fields are required.
      </div>
    `);
  }

  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
  );
  if (existing) {
    return res.status(400).send(`
      <div class="server-alert server-alert-error">
        An account with this email already exists.
      </div>
    `);
  }

  const newUser = {
    id: users.length + 1,
    name: name.trim(),
    email: email.trim(),
    password: password,
    role: role || "student",
    faculty: faculty || "General Faculty",
    university: "E-JUST",
  };
  users.push(newUser);

  const token = jwt.sign(
    {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      faculty: newUser.faculty,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("debde_token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.setHeader("HX-Redirect", "/pages/manage-listings.html");
  res.send(`
    <div class="server-alert server-alert-success">
      Account created successfully! Redirecting...
    </div>
  `);
});

// Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("debde_token");
  res.setHeader("HX-Redirect", "/pages/auth.html");
  res.send("");
});

// Get Current User Profile (for Dashboard sidebar)
app.get("/api/auth/me", authenticateToken, (req, res) => {
  if (!req.user) {
    return res.send(`
      <div class="card profile-empty">
        <p class="profile-note">Session Expired or Guest</p>
        <a href="/pages/auth.html" class="btn btn-primary btn-sm btn-block">Login with Student Email</a>
      </div>
    `);
  }

  const roleTitle =
    req.user.role === "club"
      ? "Club Representative"
      : req.user.role === "supplier"
        ? "Campus Supplier"
        : "Verified Student";

  res.send(`
    <div class="card">
      <h3>${req.user.name}</h3>
      <p class="profile-faculty">${req.user.faculty}</p>
      <span class="badge badge-available">${roleTitle}</span>
      <hr class="profile-divider">
      <ul class="profile-links">
        <li><a href="/pages/manage-listings.html" class="profile-primary-link">My Active Listings</a></li>
        <li><a href="/pages/wishlist.html">Saved Wishlist</a></li>
        <li><a href="/pages/post-item.html">+ Add Item</a></li>
        <li><a href="/pages/post-announcement.html">+ Add Announcement</a></li>
        <li>
          <button 
            class="btn btn-secondary btn-sm" 
            class="btn-block nav-logout"
            hx-post="/api/auth/logout">
            Logout
          </button>
        </li>
      </ul>
    </div>
  `);
});

// ==========================================
// ITEM LISTINGS & DASHBOARD ROUTES
// ==========================================

function renderItemCard(item) {
  const isFree = item.isFree || item.price === 0;
  const priceDisplay = isFree ? "Free (Donation)" : `${item.price} EGP`;
  const badgeClass = item.status === "sold" ? "badge-sold" : "badge-available";
  const badgeText = item.status === "sold" ? "Sold" : "Available";

  return `
    <div class="card-item" id="item-${item.id}">
      <div class="item-img-placeholder">
        <img class="item-image" src="${item.image || DEFAULT_IMAGE}" alt="">
      </div>
      <span class="badge ${badgeClass}">${badgeText}</span>
      <div class="item-title">${item.title}</div>
      <div class="item-price">${priceDisplay}</div>
      <p class="item-meta">${item.faculty} — ${item.pickup}</p>
      <a href="/pages/item-details.html?id=${item.id}" class="btn btn-primary btn-block">View Details</a>
    </div>
  `;
}

function renderManageCard(item) {
  const isSold = item.status === "sold";
  const badgeClass = isSold ? "badge-sold" : "badge-available";
  const badgeText = isSold ? "Sold" : "Available";
  const toggleBtnText = isSold ? "Mark Available" : "Mark as Sold";
  const toggleBtnClass = isSold ? "btn-primary" : "btn-secondary";

  return `
    <div class="card-item" id="manage-item-${item.id}">
      <div class="item-img-placeholder">
        <img class="item-image" src="${item.image || DEFAULT_IMAGE}" alt="">
      </div>
      <span class="badge ${badgeClass}">${badgeText}</span>
      <div class="item-title">${item.title}</div>
      <div class="item-price">${item.isFree ? "Free" : item.price + " EGP"}</div>
      <div class="manage-actions">
        <button 
          class="btn ${toggleBtnClass} btn-sm"
          hx-post="/api/items/${item.id}/toggle-status"
          hx-target="#manage-item-${item.id}"
          hx-swap="outerHTML">
          ${toggleBtnText}
        </button>
        <button 
          class="btn btn-secondary btn-sm" 
          class="nav-logout"
          hx-delete="/api/items/${item.id}"
          hx-target="#manage-item-${item.id}"
          hx-swap="outerHTML">
          Delete
        </button>
      </div>
    </div>
  `;
}

// Campus directory API used by the Home selector.
app.get("/api/campus/options", (req, res) => {
  res.json(campusDirectory);
});

// Announcements API. Filters are optional so the Home page has a useful
// default while still supporting University -> City -> Campus selection.
app.get("/api/announcements", (req, res) => {
  const university = String(req.query.university || "").trim();
  const city = String(req.query.city || "").trim();
  const campus = String(req.query.campus || "").trim();
  const filtered = announcements.filter((announcement) => {
    return (!university || announcement.university === university)
      && (!city || announcement.city === city)
      && (!campus || announcement.campus === campus);
  });
  const item = filtered[0] || announcements[0];
  res.send(`
    <div class="announcement-bar" data-university="${item.university}" data-city="${item.city}" data-campus="${item.campus}">
      <div class="container">
        <img class="announcement-image" src="${item.image}" alt="">
        <span><strong>[${item.author}]</strong> ${item.title} <small>${item.city} · ${item.campus}</small></span>
        <a href="${item.link}" class="announcement-link">View Details &rarr;</a>
      </div>
    </div>
  `);
});

app.get("/api/announcements/list", (req, res) => {
  const university = String(req.query.university || "").trim();
  const city = String(req.query.city || "").trim();
  const campus = String(req.query.campus || "").trim();
  const filtered = announcements.filter((announcement) => {
    return (!university || announcement.university === university)
      && (!city || announcement.city === city)
      && (!campus || announcement.campus === campus);
  });
  res.json(filtered.length ? filtered : announcements);
});

app.get("/api/announcements/manage", authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).send("");
  const mine = announcements.filter((announcement) => announcement.author === req.user.name);
  res.send(mine.length ? mine.map(renderAnnouncementManageCard).join("") : '<div class="loading-text">No announcements yet.</div>');
});

app.get("/api/announcements/:id", (req, res) => {
  const announcement = announcements.find((item) => item.id === parseInt(req.params.id));
  if (!announcement) return res.status(404).json({ error: "Announcement not found" });
  res.json(announcement);
});

function renderAnnouncementManageCard(announcement) {
  return `
    <div class="card-item announcement-manage-card">
      <div class="item-img-placeholder">
        <img class="item-image" src="${announcement.image || DEFAULT_IMAGE}" alt="">
      </div>
      <span class="announcement-type">${announcement.type}</span>
      <div class="item-title">${announcement.title}</div>
      <p class="item-meta">${announcement.city} · ${announcement.campus}</p>
      <a class="btn btn-primary btn-block" href="${announcement.link}">View Details</a>
    </div>`;
}

app.post("/api/announcements", authenticateToken, (req, res) => {
  if (!req.user) {
    res.setHeader("HX-Redirect", "/pages/auth.html");
    return res.status(401).send("");
  }
  const { title, type, description, city, campus, imageData } = req.body;
  let image = DEFAULT_IMAGE;
  if (typeof imageData === "string" && imageData.startsWith("data:image/")) {
    const match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (match && Buffer.byteLength(match[2], "base64") <= 5 * 1024 * 1024) {
      const extension = match[1] === "jpg" ? "jpeg" : match[1];
      const fileName = `announcement-${Date.now()}.${extension}`;
      fs.writeFileSync(path.join(uploadDirectory, fileName), Buffer.from(match[2], "base64"));
      image = `/assets/uploads/${fileName}`;
    }
  }
  const announcement = {
    id: announcements.length ? Math.max(...announcements.map((item) => item.id)) + 1 : 1,
    type: type || (req.user.role === "club" ? "club" : "student project"),
    title: title || "Campus announcement",
    description: description || "",
    author: req.user.name,
    link: `/pages/announcement-details.html?id=${announcements.length ? Math.max(...announcements.map((item) => item.id)) + 1 : 1}`,
    university: req.user.university || "E-JUST",
    city: city || "New Borg El Arab",
    campus: campus || "Main Campus",
    image,
  };
  announcements.push(announcement);
  res.send(`<div class="server-alert server-alert-success">Announcement published successfully. <a class="alert-link" href="/pages/announcement-details.html?id=${announcement.id}">View announcement</a></div>`);
});

// Feed for Home
app.get("/api/items/feed", (req, res) => {
  const activeItems = items.filter((i) => i.status === "available").slice(0, 3);
  const html = activeItems.map(renderItemCard).join("");
  res.send(html);
});

// Manage Listings for Dashboard (Protected)
app.get("/api/items/manage", authenticateToken, (req, res) => {
  if (!req.user) {
    res.setHeader("HX-Redirect", "/pages/auth.html");
    return res.status(401).send("");
  }
  const filter = req.query.filter || "all";
  let filtered = items.filter((item) => item.ownerId === req.user.id);
  if (filter === "available")
    filtered = items.filter((i) => i.status === "available");
  if (filter === "sold") filtered = items.filter((i) => i.status === "sold");

  const html = filtered.map(renderManageCard).join("");
  res.send(html);
});

// Toggle Status
app.post("/api/items/:id/toggle-status", authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).send("");
  const id = parseInt(req.params.id);
  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).send("");
  item.status = item.status === "available" ? "sold" : "available";
  res.send(renderManageCard(item));
});

// Delete Item
app.delete("/api/items/:id", authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).send("");
  const id = parseInt(req.params.id);
  items = items.filter((i) => i.id !== id);
  res.send("");
});

// Create new Item
app.post("/api/items", authenticateToken, (req, res) => {
  if (!req.user) {
    res.setHeader("HX-Redirect", "/pages/auth.html");
    return res.status(401).send("");
  }
  const { title, faculty, price, isFree, pickup, notes, imageData } = req.body;
  let image = DEFAULT_IMAGE;
  if (typeof imageData === "string" && imageData.startsWith("data:image/")) {
    const match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (match && Buffer.byteLength(match[2], "base64") <= 5 * 1024 * 1024) {
      const extension = match[1] === "jpg" ? "jpeg" : match[1];
      const fileName = `listing-${Date.now()}.${extension}`;
      fs.writeFileSync(path.join(uploadDirectory, fileName), Buffer.from(match[2], "base64"));
      image = `/assets/uploads/${fileName}`;
    }
  }
  const newItem = {
    id: items.length + 1,
    title: title || "Untitled Tool",
    category: "General",
    faculty: faculty || "Campus",
    price: isFree ? 0 : parseFloat(price) || 0,
    isFree: Boolean(isFree),
    condition: "Good",
    pickup: pickup || "Main Gate",
    status: "available",
    icon: "📦",
    image,
    ownerId: req.user.id,
  };
  items.unshift(newItem);
  res.send(`
    <div class="server-alert server-alert-success server-alert-large">
      ✓ Item <strong>"${newItem.title}"</strong> has been listed successfully! 
      <a href="/pages/manage-listings.html" class="alert-link">Go to Dashboard &rarr;</a>
    </div>
  `);
});

// Wishlist (Protected)
app.get("/api/wishlist", authenticateToken, (req, res) => {
  if (!req.user) {
    res.setHeader("HX-Redirect", "/pages/auth.html");
    return res.status(401).send(`
      <div class="loading-text">
        Please sign in to view your saved wishlist.
      </div>
    `);
  }
  const wishlist = items.slice(0, 2);
  const html = wishlist
    .map(
      (item) => `
    <div class="card-item" id="wishlist-${item.id}">
      <div class="item-img-placeholder">
        <img class="item-image" src="${item.image || DEFAULT_IMAGE}" alt="">
      </div>
      <div class="item-title">${item.title}</div>
      <div class="item-price">${item.isFree ? "Free" : item.price + " EGP"}</div>
      <a href="https://wa.me/201551353638" target="_blank" class="btn btn-primary btn-sm contact-link">Contact WhatsApp</a>
      <button 
        class="btn btn-secondary btn-sm" 
        class="btn-block nav-logout"
        hx-delete="/api/wishlist/${item.id}"
        hx-target="#wishlist-${item.id}"
        hx-swap="outerHTML">
        Remove
      </button>
    </div>
  `,
    )
    .join("");
  res.send(html);
});

app.delete("/api/wishlist/:id", authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).send("");
  res.send("");
});

require("./catalog-routes")(app, {
  getItems: () => items,
  getUsers: () => users,
  authenticateToken,
}); // Subsystem 2 (Basl)

app.listen(PORT, () => {
  console.log(`DeBDe Server running at http://localhost:${PORT}`);
});
