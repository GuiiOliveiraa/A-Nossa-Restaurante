const fs = require("fs");
const path = require("path");

const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "troque-esta-chave-em-producao";
const TOKEN_COOKIE = "a_nossa_admin_token";
const PRODUCTS_FILE = path.join(__dirname, "data", "products.json");

const adminUser = {
  id: 1,
  name: process.env.ADMIN_NAME || "Administrador",
  email: (process.env.ADMIN_EMAIL || "admin@anossa.com").toLowerCase(),
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10)
};

app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));

function readProducts() {
  const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function createAuthToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function getTokenFromRequest(req) {
  return req.cookies[TOKEN_COOKIE];
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireApiAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Sessao expirada. Faca login novamente." });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.clearCookie(TOKEN_COOKIE);
    return res.status(401).json({ message: "Sessao invalida. Faca login novamente." });
  }
}

function requirePageAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.redirect("/login");
  }

  try {
    verifyToken(token);
    next();
  } catch {
    res.clearCookie(TOKEN_COOKIE);
    return res.redirect("/login");
  }
}

function validateProduct(product) {
  if (!product || typeof product !== "object") return "Produto invalido.";
  if (!String(product.name || "").trim()) return "Nome do produto e obrigatorio.";
  if (!String(product.desc || "").trim()) return "Descricao do produto e obrigatoria.";
  if (!String(product.category || "").trim()) return "Categoria do produto e obrigatoria.";
  if (Number.isNaN(Number(product.price)) || Number(product.price) < 0) {
    return "Preco do produto invalido.";
  }
  return null;
}

app.post("/api/auth/login", async (req, res) => {
  const identifier = String(req.body?.identifier || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!identifier || !password) {
    return res.status(400).json({ message: "Informe usuario/e-mail e senha." });
  }

  const matchesUser =
    identifier === adminUser.email || identifier === adminUser.name.toLowerCase();

  if (!matchesUser) {
    return res.status(401).json({ message: "Credenciais invalidas." });
  }

  const validPassword = await bcrypt.compare(password, adminUser.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: "Credenciais invalidas." });
  }

  const token = createAuthToken(adminUser);

  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000
  });

  return res.json({ user: sanitizeUser(adminUser) });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(TOKEN_COOKIE);
  return res.status(204).send();
});

app.get("/api/auth/me", requireApiAuth, (req, res) => {
  return res.json({ user: sanitizeUser(adminUser) });
});

app.get("/api/products", (_req, res) => {
  return res.json(readProducts());
});

app.post("/api/products", requireApiAuth, (req, res) => {
  const incoming = req.body || {};
  const validationError = validateProduct(incoming);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const products = readProducts();
  const product = {
    id: Date.now(),
    name: String(incoming.name).trim(),
    desc: String(incoming.desc).trim(),
    price: Number(incoming.price),
    category: String(incoming.category).trim(),
    image: String(incoming.image || "Logo.PNG").trim() || "Logo.PNG",
    available: Boolean(incoming.available)
  };

  products.push(product);
  writeProducts(products);
  return res.status(201).json(product);
});

app.put("/api/products/:id", requireApiAuth, (req, res) => {
  const productId = Number(req.params.id);
  const incoming = req.body || {};
  const validationError = validateProduct(incoming);

  if (!productId) {
    return res.status(400).json({ message: "Produto invalido." });
  }

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const products = readProducts();
  const index = products.findIndex((product) => product.id === productId);

  if (index < 0) {
    return res.status(404).json({ message: "Produto nao encontrado." });
  }

  products[index] = {
    ...products[index],
    name: String(incoming.name).trim(),
    desc: String(incoming.desc).trim(),
    price: Number(incoming.price),
    category: String(incoming.category).trim(),
    image: String(incoming.image || "Logo.PNG").trim() || "Logo.PNG",
    available: Boolean(incoming.available)
  };

  writeProducts(products);
  return res.json(products[index]);
});

app.delete("/api/products/:id", requireApiAuth, (req, res) => {
  const productId = Number(req.params.id);
  const products = readProducts();
  const index = products.findIndex((product) => product.id === productId);

  if (index < 0) {
    return res.status(404).json({ message: "Produto nao encontrado." });
  }

  products.splice(index, 1);
  writeProducts(products);
  return res.status(204).send();
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", requirePageAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`A Nossa Restaurante rodando em http://localhost:${PORT}`);
});
