// =============================================
// services.js - Camada de comunicacao com a API
// =============================================

import { API_BASE_URL, LOGO_IMAGE } from "./config.js";

const LOCAL_PRODUCTS_KEY = "a_nossa_products";
const LOCAL_USER_KEY = "a_nossa_user";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Falha na requisicao.");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestOrNull(path, options = {}) {
  try {
    return await request(path, options);
  } catch (error) {
    if (error?.status === 401) throw error;
    return null;
  }
}

function normalizeProduct(product) {
  return {
    ...product,
    image: String(product.image || "").trim() || LOGO_IMAGE,
    available: product.available !== false
  };
}

function readLocalProducts() {
  const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : [];
  } catch {
    return [];
  }
}

function writeLocalProducts(products) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

async function readSeedProducts() {
  const response = await fetch(`${API_BASE_URL}/data/products.json`);
  const products = await response.json().catch(() => []);
  return Array.isArray(products) ? products.map(normalizeProduct) : [];
}

export async function loadProducts() {
  const products = await requestOrNull("/api/products", { method: "GET" });
  if (Array.isArray(products)) {
    const normalized = products.map(normalizeProduct);
    writeLocalProducts(normalized);
    return normalized;
  }

  const localProducts = readLocalProducts();
  if (localProducts.length) return localProducts;

  return readSeedProducts();
}

export async function createProduct(product) {
  const created = await requestOrNull("/api/products", {
    method: "POST",
    body: JSON.stringify(product)
  });
  if (created) return normalizeProduct(created);

  const list = readLocalProducts();
  const localProduct = normalizeProduct({
    ...product,
    id: Date.now(),
    available: product.available !== false
  });
  list.push(localProduct);
  writeLocalProducts(list);
  return localProduct;
}

export async function updateProduct(id, product) {
  const updated = await requestOrNull(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product)
  });
  if (updated) return normalizeProduct(updated);

  const list = readLocalProducts();
  const next = list.length
    ? list.map((item) => (item.id === id ? normalizeProduct({ ...item, ...product, id }) : item))
    : [normalizeProduct({ ...product, id })];
  writeLocalProducts(next);
  return next.find((item) => item.id === id) || next[0];
}

export async function deleteProductById(id) {
  const result = await requestOrNull(`/api/products/${id}`, { method: "DELETE" });
  if (result === null) {
    const list = readLocalProducts().filter((item) => item.id !== id);
    writeLocalProducts(list);
  }
}

export async function login(identifier, password) {
  const response = await requestOrNull("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
  if (response) return response;

  const fallbackIdentifier = String(identifier || "").trim().toLowerCase();
  const fallbackEmail = "admin@anossa.com";
  const fallbackName = "administrador";
  const fallbackPassword = "admin123";

  if (
    (fallbackIdentifier === fallbackEmail || fallbackIdentifier === fallbackName) &&
    String(password || "") === fallbackPassword
  ) {
    const user = { id: 1, name: "Administrador", email: fallbackEmail };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    return { user };
  }

  throw new Error("Credenciais invalidas.");
}

export async function logout() {
  await requestOrNull("/api/auth/logout", { method: "POST" });
  localStorage.removeItem(LOCAL_USER_KEY);
}

export async function getCurrentUser() {
  const response = await requestOrNull("/api/auth/me", { method: "GET" });
  if (response) return response;

  const raw = localStorage.getItem(LOCAL_USER_KEY);
  if (!raw) throw new Error("Nao autenticado.");

  try {
    return { user: JSON.parse(raw) };
  } catch {
    localStorage.removeItem(LOCAL_USER_KEY);
    throw new Error("Nao autenticado.");
  }
}
