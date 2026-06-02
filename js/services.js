// =============================================
// services.js — Camada de armazenamento (localStorage)
// =============================================

import { PRODUCTS_STORAGE_KEY } from "./config.js";
import { defaultProducts } from "./data.js";

/**
 * Carrega os produtos do localStorage.
 * Retorna os produtos padrão se não houver dados salvos ou se forem inválidos.
 * @returns {Array}
 */
export function loadProducts() {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!saved) return [...defaultProducts];

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length ? parsed : [...defaultProducts];
    } catch {
        return [...defaultProducts];
    }
}

/**
 * Persiste o array de produtos no localStorage.
 * @param {Array} products
 */
export function persistProducts(products) {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}
