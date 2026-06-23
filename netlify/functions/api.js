const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PRODUCTS_FILE = path.join(process.cwd(), "data", "products.json");
const JWT_SECRET = process.env.JWT_SECRET || "troque-esta-chave-em-producao";
const TOKEN_COOKIE = "a_nossa_admin_token";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@anossa.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

function readProducts() {
  const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function parseCookies(event) {
  const header = event.headers.cookie || event.headers.Cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
}

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body === undefined ? "" : JSON.stringify(body)
  };
}

function setCookieHeader(value) {
  return { "Set-Cookie": value };
}

function clearCookieHeader() {
  return {
    "Set-Cookie": `${TOKEN_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  };
}

function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function createAuthToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: "admin" }, JWT_SECRET, {
    expiresIn: "8h"
  });
}

function requireAuth(event) {
  const cookies = parseCookies(event);
  const token = cookies[TOKEN_COOKIE];
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
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

exports.handler = async (event) => {
  const { httpMethod, path: requestPath, body } = event;
  const route = requestPath.replace(/^\/(?:\.netlify\/functions\/api|api)/, "") || "/";
  const segments = route.split("/").filter(Boolean);
  const adminUser = {
    id: 1,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash: ADMIN_PASSWORD_HASH
  };

  try {
    if (segments[0] === "auth" && segments[1] === "login" && httpMethod === "POST") {
      const payload = JSON.parse(body || "{}");
      const identifier = String(payload.identifier || "").trim().toLowerCase();
      const password = String(payload.password || "");

      if (!identifier || !password) {
        return json(400, { message: "Informe usuario/e-mail e senha." });
      }

      const matchesUser =
        identifier === adminUser.email || identifier === adminUser.name.toLowerCase();

      if (!matchesUser || !(await bcrypt.compare(password, adminUser.passwordHash))) {
        return json(401, { message: "Credenciais invalidas." });
      }

      const token = createAuthToken(adminUser);
      return json(
        200,
        { user: sanitizeUser(adminUser) },
        setCookieHeader(
          `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`
        )
      );
    }

    if (segments[0] === "auth" && segments[1] === "logout" && httpMethod === "POST") {
      return {
        statusCode: 204,
        headers: clearCookieHeader(),
        body: ""
      };
    }

    if (segments[0] === "auth" && segments[1] === "me" && httpMethod === "GET") {
      const payload = requireAuth(event);
      if (!payload) return json(401, { message: "Sessao expirada. Faca login novamente." });
      return json(200, { user: sanitizeUser(adminUser) });
    }

    if (segments[0] === "products" && httpMethod === "GET") {
      return json(200, readProducts());
    }

    if (segments[0] === "products" && httpMethod === "POST") {
      if (!requireAuth(event)) return json(401, { message: "Sessao expirada. Faca login novamente." });
      const incoming = JSON.parse(body || "{}");
      const validationError = validateProduct(incoming);
      if (validationError) return json(400, { message: validationError });

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
      return json(201, product);
    }

    if (segments[0] === "products" && segments[1] && httpMethod === "PUT") {
      if (!requireAuth(event)) return json(401, { message: "Sessao expirada. Faca login novamente." });
      const productId = Number(segments[1]);
      const incoming = JSON.parse(body || "{}");
      const validationError = validateProduct(incoming);
      if (!productId) return json(400, { message: "Produto invalido." });
      if (validationError) return json(400, { message: validationError });

      const products = readProducts();
      const index = products.findIndex((product) => product.id === productId);
      if (index < 0) return json(404, { message: "Produto nao encontrado." });

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
      return json(200, products[index]);
    }

    if (segments[0] === "products" && segments[1] && httpMethod === "DELETE") {
      if (!requireAuth(event)) return json(401, { message: "Sessao expirada. Faca login novamente." });
      const productId = Number(segments[1]);
      const products = readProducts();
      const index = products.findIndex((product) => product.id === productId);
      if (index < 0) return json(404, { message: "Produto nao encontrado." });

      products.splice(index, 1);
      writeProducts(products);
      return { statusCode: 204, headers: {}, body: "" };
    }

    return json(404, { message: "Rota nao encontrada." });
  } catch (error) {
    return json(500, { message: error.message || "Erro interno." });
  }
};
