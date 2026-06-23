const path = require("path");

const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const jwt = require("jsonwebtoken");

const { getClient, getProductsCollection, MONGODB_DB_NAME } = require("./lib/mongo");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_COOKIE = "a_nossa_admin_token";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));

function hasRequiredEnv() {
  return Boolean(process.env.MONGODB_URI && JWT_SECRET && ADMIN_EMAIL && ADMIN_PASSWORD);
}

function getAdminUser() {
  return {
    id: 1,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10)
  };
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

function normalizeProduct(product) {
  return {
    id: Number(product.id),
    name: String(product.name || "").trim(),
    desc: String(product.desc || "").trim(),
    price: Number(product.price),
    category: String(product.category || "").trim(),
    image: String(product.image || "Logo.PNG").trim() || "Logo.PNG",
    available: product.available !== false
  };
}

app.get("/api/health", async (_req, res) => {
  const env = {
    MONGODB_URI: Boolean(process.env.MONGODB_URI),
    MONGODB_DB_NAME: Boolean(process.env.MONGODB_DB_NAME || "anossa_db"),
    JWT_SECRET: Boolean(process.env.JWT_SECRET),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD)
  };

  try {
    await (await getClient()).db(MONGODB_DB_NAME).command({ ping: 1 });
    return res.json({
      ok: env.MONGODB_URI && env.JWT_SECRET && env.ADMIN_EMAIL && env.ADMIN_PASSWORD,
      mongodb: true,
      databaseName: MONGODB_DB_NAME,
      env
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mongodb: false,
      databaseName: MONGODB_DB_NAME,
      env,
      mongodbError: error.message || "Falha ao conectar no MongoDB."
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  if (!hasRequiredEnv()) {
    return res.status(500).json({
      message:
        "Variaveis de ambiente ausentes. Configure MONGODB_URI, JWT_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD."
    });
  }

  const adminUser = getAdminUser();
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
  return res.json({ user: sanitizeUser(getAdminUser()) });
});

app.get("/api/products", async (_req, res) => {
  try {
    const productsCollection = await getProductsCollection();
    const products = await productsCollection.find({}).toArray();
    return res.json(products.map(normalizeProduct));
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro interno." });
  }
});

app.post("/api/products", requireApiAuth, async (req, res) => {
  const incoming = req.body || {};
  const validationError = validateProduct(incoming);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const productsCollection = await getProductsCollection();
    const product = normalizeProduct({
      id: Date.now(),
      name: incoming.name,
      desc: incoming.desc,
      price: incoming.price,
      category: incoming.category,
      image: incoming.image,
      available: incoming.available
    });

    await productsCollection.insertOne(product);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro interno." });
  }
});

app.put("/api/products/:id", requireApiAuth, async (req, res) => {
  const productId = Number(req.params.id);
  const incoming = req.body || {};
  const validationError = validateProduct(incoming);

  if (!productId) {
    return res.status(400).json({ message: "Produto invalido." });
  }

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const productsCollection = await getProductsCollection();
    const product = normalizeProduct({
      id: productId,
      name: incoming.name,
      desc: incoming.desc,
      price: incoming.price,
      category: incoming.category,
      image: incoming.image,
      available: incoming.available
    });

    const result = await productsCollection.updateOne(
      { id: productId },
      { $set: product }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: "Produto nao encontrado." });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro interno." });
  }
});

app.delete("/api/products/:id", requireApiAuth, async (req, res) => {
  const productId = Number(req.params.id);

  try {
    const productsCollection = await getProductsCollection();
    const result = await productsCollection.deleteOne({ id: productId });

    if (!result.deletedCount) {
      return res.status(404).json({ message: "Produto nao encontrado." });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro interno." });
  }
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
