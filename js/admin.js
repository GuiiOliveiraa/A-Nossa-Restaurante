// =============================================
// admin.js — Painel administrativo (CRUD de produtos)
// =============================================

import { LOGO_IMAGE } from "./config.js";
import { persistProducts } from "./services.js";
import { showToast, renderCategoryOptions, renderAdminList } from "./ui.js";
import { syncCartWithProduct, removeCartItemsByProduct } from "./cart.js";

// ─── Estado ───────────────────────────────────────────────────────────────────

let _products        = [];
let _onProductChange = null; // callback(updatedProducts) → chamado após cada mutação

// ─── Inicialização ────────────────────────────────────────────────────────────

/**
 * @param {Array}    initialProducts
 * @param {Function} onChangeCallback  Chamado com o array atualizado a cada mutação
 */
export function initAdmin(initialProducts, onChangeCallback) {
    _products        = initialProducts;
    _onProductChange = onChangeCallback;
}

export function getProducts()       { return _products; }
export function setProducts(list)   { _products = list; }

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderAdminPage() {
    renderCategoryOptions();
    renderAdminList(_products, editProduct, deleteProduct);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function saveProduct(event) {
    event.preventDefault();

    const idField = document.getElementById("product-id");
    const id      = idField.value ? Number(idField.value) : Date.now();

    const product = {
        id,
        name:      document.getElementById("product-name").value.trim(),
        desc:      document.getElementById("product-desc").value.trim(),
        price:     Number(document.getElementById("product-price").value),
        category:  document.getElementById("product-category").value,
        image:     document.getElementById("product-image").value.trim() || LOGO_IMAGE,
        available: document.getElementById("product-available").checked
    };

    if (!product.name || !product.desc || Number.isNaN(product.price)) {
        return showToast("Preencha os dados do produto corretamente.");
    }

    const idx = _products.findIndex((p) => p.id === id);
    if (idx >= 0) {
        _products[idx] = product;
        syncCartWithProduct(product);
        showToast("Produto atualizado!");
    } else {
        _products.push(product);
        showToast("Produto cadastrado!");
    }

    persistProducts(_products);
    resetProductForm();
    renderAdminList(_products, editProduct, deleteProduct);
    _onProductChange?.([..._products]);
}

export function editProduct(id) {
    const p = _products.find((p) => p.id === id);
    if (!p) return;

    document.getElementById("product-id").value       = p.id;
    document.getElementById("product-name").value     = p.name;
    document.getElementById("product-desc").value     = p.desc;
    document.getElementById("product-price").value    = p.price;
    document.getElementById("product-category").value = p.category;
    document.getElementById("product-image").value    = p.image || "";
    document.getElementById("product-available").checked = p.available !== false;
}

export function deleteProduct(id) {
    const p = _products.find((p) => p.id === id);
    if (!p || !confirm(`Excluir "${p.name}"?`)) return;

    _products = _products.filter((p) => p.id !== id);
    removeCartItemsByProduct(id);
    persistProducts(_products);
    resetProductForm();
    renderAdminList(_products, editProduct, deleteProduct);
    _onProductChange?.([..._products]);
    showToast("Produto removido!");
}

export function resetProductForm() {
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    document.getElementById("product-available").checked = true;
}
