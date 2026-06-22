// =============================================
// services.js - Camada de comunicacao com a API
// =============================================

import { LOGO_IMAGE } from "./config.js";

async function request(path, options = {}) {
  const response = await fetch(path, {
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

function normalizeProduct(product) {
  return {
    ...product,
    image: String(product.image || "").trim() || LOGO_IMAGE,
    available: product.available !== false
  };
}

export async function loadProducts() {
  const products = await request("/api/products", { method: "GET" });
  return Array.isArray(products) ? products.map(normalizeProduct) : [];
}

export async function createProduct(product) {
  const created = await request("/api/products", {
    method: "POST",
    body: JSON.stringify(product)
  });
  return normalizeProduct(created);
}

export async function updateProduct(id, product) {
  const updated = await request(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product)
  });
  return normalizeProduct(updated);
}

export async function deleteProductById(id) {
  await request(`/api/products/${id}`, { method: "DELETE" });
}

export async function login(identifier, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
}

export async function logout() {
  await request("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser() {
  return request("/api/auth/me", { method: "GET" });
}
