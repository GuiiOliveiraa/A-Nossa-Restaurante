const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getClient, getDb, getProductsCollection, MONGODB_DB_NAME } = require("../../lib/mongo");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_COOKIE = "a_nossa_admin_token";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI;

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

function normalizeProduct(product) {
  const id = product.id ?? (product._id ? product._id.toString() : Date.now());

  return {
    id: typeof id === "number" ? id : Number.isNaN(Number(id)) ? Date.now() : Number(id),
    name: String(product.name || "").trim(),
    desc: String(product.desc || "").trim(),
    price: Number(product.price),
    category: String(product.category || "").trim(),
    image: String(product.image || "Logo.PNG").trim() || "Logo.PNG",
    available: product.available !== false
  };
}

function getEnvStatus() {
  return {
    MONGODB_URI: Boolean(process.env.MONGODB_URI),
    MONGODB_DB_NAME: Boolean(process.env.MONGODB_DB_NAME || "anossa_db"),
    JWT_SECRET: Boolean(process.env.JWT_SECRET),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD)
  };
}

function hasRequiredEnv() {
  return Boolean(MONGODB_URI && JWT_SECRET && ADMIN_EMAIL && ADMIN_PASSWORD);
}

exports.handler = async (event) => {
  const { httpMethod, path: requestPath, body } = event;
  const route = requestPath.replace(/^\/(?:\.netlify\/functions\/api|api)/, "") || "/";
  const segments = route.split("/").filter(Boolean);

  try {
    if (segments[0] === "health" && httpMethod === "GET") {
      const env = getEnvStatus();
      let mongodb = false;
      let mongodbError = null;

      if (env.MONGODB_URI) {
        try {
          await (await getClient()).db(MONGODB_DB_NAME).command({ ping: 1 });
          mongodb = true;
        } catch (error) {
          mongodbError = error.message || "Falha ao conectar no MongoDB.";
        }
      }

      return json(200, {
        ok: mongodb && env.JWT_SECRET && env.ADMIN_EMAIL && env.ADMIN_PASSWORD,
        mongodb,
        databaseName: MONGODB_DB_NAME,
        env,
        ...(mongodbError ? { mongodbError } : {})
      });
    }

    if (!hasRequiredEnv()) {
      return json(500, {
        message:
          "Variaveis de ambiente ausentes. Configure MONGODB_URI, JWT_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD."
      });
    }

    const adminUser = {
      id: 1,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10)
    };

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

    const productsCollection = await getProductsCollection();

    if (segments[0] === "products" && httpMethod === "GET") {
      const products = await productsCollection.find({}).toArray();
      return json(200, products.map(normalizeProduct));
    }

    if (segments[0] === "products" && httpMethod === "POST") {
      if (!requireAuth(event)) return json(401, { message: "Sessao expirada. Faca login novamente." });
      const incoming = JSON.parse(body || "{}");
      const validationError = validateProduct(incoming);
      if (validationError) return json(400, { message: validationError });

      const product = normalizeProduct({
        id: Date.now(),
        name: String(incoming.name).trim(),
        desc: String(incoming.desc).trim(),
        price: Number(incoming.price),
        category: String(incoming.category).trim(),
        image: String(incoming.image || "Logo.PNG").trim() || "Logo.PNG",
        available: Boolean(incoming.available)
      });

      await productsCollection.insertOne(product);
      return json(201, product);
    }

    if (segments[0] === "products" && segments[1] && httpMethod === "PUT") {
      if (!requireAuth(event)) return json(401, { message: "Sessao expirada. Faca login novamente." });
      const productId = Number(segments[1]);
      const incoming = JSON.parse(body || "{}");
      const validationError = validateProduct(incoming);
      if (!productId) return json(400, { message: "Produto invalido." });
      if (validationError) return json(400, { message: validationError });

      const updatedProduct = {
        id: productId,
        name: String(incoming.name).trim(),
        desc: String(incoming.desc).trim(),
        price: Number(incoming.price),
        category: String(incoming.category).trim(),
        image: String(incoming.image || "Logo.PNG").trim() || "Logo.PNG",
        available: Boolean(incoming.available)
      };

      const result = await productsCollection.updateOne(
        { id: productId },
        { $set: updatedProduct }
      );

      if (!result.matchedCount) {
        return json(404, { message: "Produto nao encontrado." });
      }

      return json(200, updatedProduct);
    }

    if (segments[0] === "products" && segments[1] && httpMethod === "DELETE") {
      if (!requireAuth(event)) return json(401, { message: "Sessao expirada. Faca login novamente." });
      const productId = Number(segments[1]);
      const result = await productsCollection.deleteOne({ id: productId });
      if (!result.deletedCount) {
        return json(404, { message: "Produto nao encontrado." });
      }
      return { statusCode: 204, headers: {}, body: "" };
    }

    return json(404, { message: "Rota nao encontrada." });
  } catch (error) {
    return json(500, { message: error.message || "Erro interno." });
  }
};
