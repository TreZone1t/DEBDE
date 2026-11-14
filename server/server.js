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
      const exp = Math.floor(Date.now() / 1000) + (options.expiresIn === "7d" ? 7 * 86400 : 86400);
      const fullPayload = { ...payload, exp };
      const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
      const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
      const signature = crypto.createHmac("sha256", secret).update(`${b64Header}.${b64Payload}`).digest("base64url");
      return `${b64Header}.${b64Payload}.${signature}`;
    },
    verify: (token, secret, callback) => {
      try {
        if (!token || typeof token !== "string") return callback(new Error("Invalid token"));
        const parts = token.split(".");
        if (parts.length !== 3) return callback(new Error("Invalid format"));
        const [b64Header, b64Payload, sig] = parts;
        const expectedSig = crypto.createHmac("sha256", secret).update(`${b64Header}.${b64Payload}`).digest("base64url");
        if (sig !== expectedSig) return callback(new Error("Invalid signature"));
        const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
          return callback(new Error("Token expired"));
        }
        callback(null, payload);
      } catch (err) {
        callback(err);
      }
    }
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
const JWT_SECRET = process.env.JWT_SECRET || envConfig.JWT_SECRET || "debde_student_secret_key_2026";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Helper Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.debde_token || req.headers["authorization"]?.split(" ")[1];
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
  "/manage-listings.html",
  "/wishlist.html",
  "/post-item.html"
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
  }
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
    ownerId: 1,
  },
];

// Announcements & Club Banners
let announcements = [
  {
    id: 1,
    type: "club",
    title: "IEEE CS Student Chapter: Web Programming Sprint & Workshop",
    author: "IEEE CS E-JUST",
    link: "/pages/catalog.html"
  },
  {
    id: 2,
    type: "campus",
    title: "Midterm Drafting Kit & Textbooks Swap at Gate 2",
    author: "Student Union",
    link: "/pages/catalog.html"
  },
  {
    id: 3,
    type: "supplier",
    title: "Borg El-Arab Bookstore: 20% Discount on Casio Calculators for E-JUST Students",
    author: "Campus Supplies Partner",
    link: "/pages/catalog.html"
  }
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
      <li id="nav-auth-slot"><a href="/pages/auth.html" class="btn btn-primary btn-sm">Sign In</a></li>
    `);
  }
  const roleBadge = req.user.role === 'club' ? 'Club' : req.user.role === 'supplier' ? 'Store' : 'Student';
  return res.send(`
    <li id="nav-auth-slot">
      <span style="font-size: 13px; color: #334155; margin-right: 8px;"><strong>${req.user.name}</strong> <span class="badge badge-available">${roleBadge}</span></span>
      <a href="/pages/post-item.html" class="btn btn-primary btn-sm" style="margin-right: 6px;">+ Post Item</a>
      <button class="btn btn-secondary btn-sm" hx-post="/api/auth/logout" style="color: #ef4444;">Logout</button>
    </li>
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
      <div style="background-color: #fee2e2; color: #991b1b; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;">
        Invalid email or password. Please try again.
      </div>
    `);
  }

  // Issue real JWT
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role || "student", faculty: user.faculty },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("debde_token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.setHeader("HX-Redirect", "/pages/manage-listings.html");
  res.send(`
    <div style="background-color: #dcfce7; color: #15803d; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;">
      Login successful! Redirecting to student dashboard...
    </div>
  `);
});

// Register endpoint
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, faculty, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).send(`
      <div style="background-color: #fee2e2; color: #991b1b; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;">
        All fields are required.
      </div>
    `);
  }

  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
  );
  if (existing) {
    return res.status(400).send(`
      <div style="background-color: #fee2e2; color: #991b1b; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;">
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
    <div style="background-color: #dcfce7; color: #15803d; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;">
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
      <div class="card" style="text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">Session Expired or Guest</p>
        <a href="/pages/auth.html" class="btn btn-primary btn-sm" style="width: 100%;">Login with Student Email</a>
      </div>
    `);
  }

  const roleTitle = req.user.role === 'club' ? 'Club Representative' : req.user.role === 'supplier' ? 'Campus Supplier' : 'Verified Student';

  res.send(`
    <div class="card">
      <h3>${req.user.name}</h3>
      <p style="font-size: 13px; color: #64748b; margin: 5px 0 10px;">${req.user.faculty}</p>
      <span class="badge badge-available">${roleTitle}</span>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
      <ul style="list-style: none;">
        <li style="margin-bottom: 10px;"><a href="/pages/manage-listings.html" style="font-weight: bold; color: #1e3a8a;">My Active Listings</a></li>
        <li style="margin-bottom: 10px;"><a href="/pages/wishlist.html">Saved Wishlist</a></li>
        <li style="margin-bottom: 15px;"><a href="/pages/post-item.html">Post New Item</a></li>
        <li>
          <button 
            class="btn btn-secondary btn-sm" 
            style="width: 100%; color: #ef4444;"
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
      <div class="item-img-placeholder">${item.icon || "📦"}</div>
      <span class="badge ${badgeClass}">${badgeText}</span>
      <div class="item-title">${item.title}</div>
      <div class="item-price">${priceDisplay}</div>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">${item.faculty} — ${item.pickup}</p>
      <a href="/pages/catalog.html?id=${item.id}" class="btn btn-primary" style="width: 100%;">View Details</a>
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
      <div class="item-img-placeholder">${item.icon || "📦"}</div>
      <span class="badge ${badgeClass}">${badgeText}</span>
      <div class="item-title">${item.title}</div>
      <div class="item-price">${item.isFree ? "Free" : item.price + " EGP"}</div>
      <div style="margin-top: 10px;">
        <button 
          class="btn ${toggleBtnClass} btn-sm"
          hx-post="/api/items/${item.id}/toggle-status"
          hx-target="#manage-item-${item.id}"
          hx-swap="outerHTML">
          ${toggleBtnText}
        </button>
        <button 
          class="btn btn-secondary btn-sm" 
          style="color: #ef4444;"
          hx-delete="/api/items/${item.id}"
          hx-target="#manage-item-${item.id}"
          hx-swap="outerHTML">
          Delete
        </button>
      </div>
    </div>
  `;
}

// Announcements API
app.get("/api/announcements", (req, res) => {
  const item = announcements[0];
  res.send(`
    <div style="background-color: #1e3a8a; color: #ffffff; padding: 8px 0; font-size: 13px; text-align: center;">
      <div class="container">
        📢 <strong>[${item.author}]</strong> ${item.title} — <a href="${item.link}" style="color: #67e8f9; text-decoration: underline; margin-left: 8px;">View Details &rarr;</a>
      </div>
    </div>
  `);
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
  let filtered = items;
  if (filter === "available") filtered = items.filter((i) => i.status === "available");
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
  const { title, faculty, price, isFree, pickup, notes } = req.body;
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
    ownerId: req.user.id,
  };
  items.unshift(newItem);
  res.send(`
    <div style="background-color: #dcfce7; color: #15803d; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
      ✓ Item <strong>"${newItem.title}"</strong> has been listed successfully! 
      <a href="/pages/manage-listings.html" style="text-decoration: underline; font-weight: bold; margin-left: 10px;">Go to Dashboard &rarr;</a>
    </div>
  `);
});

// Wishlist (Protected)
app.get("/api/wishlist", authenticateToken, (req, res) => {
  if (!req.user) {
    res.setHeader("HX-Redirect", "/pages/auth.html");
    return res.status(401).send(`
      <div style="text-align: center; color: #64748b; padding: 20px;">
        Please sign in to view your saved wishlist.
      </div>
    `);
  }
  const wishlist = items.slice(0, 2);
  const html = wishlist
    .map(
      (item) => `
    <div class="card-item" id="wishlist-${item.id}">
      <div class="item-img-placeholder">${item.icon || "📦"}</div>
      <div class="item-title">${item.title}</div>
      <div class="item-price">${item.isFree ? "Free" : item.price + " EGP"}</div>
      <a href="https://wa.me/201551353638" target="_blank" class="btn btn-primary btn-sm" style="display: block; margin-bottom: 5px;">Contact WhatsApp</a>
      <button 
        class="btn btn-secondary btn-sm" 
        style="width: 100%; color: #ef4444;"
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

app.listen(PORT, () => {
  console.log(`DeBDe Server running at http://localhost:${PORT}`);
});
