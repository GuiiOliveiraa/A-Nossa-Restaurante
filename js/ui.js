// =============================================
// ui.js — Renderização e manipulação do DOM
// Regra: NÃO importa cart.js, admin.js ou main.js (evita dependência circular).
// Toda lógica de negócio chega via callbacks.
// =============================================

import { LOGO_IMAGE } from "./config.js";
import { categories, plateBuilder, getCategoryLabel } from "./data.js";
import { formatCurrency, escapeHtml } from "./utils.js";

// ─── Toast ────────────────────────────────────────────────────────────────────

export function showToast(msg) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function openModal(htmlContent) {
    document.getElementById("modal-content-area").innerHTML = htmlContent;
    document.getElementById("modal-overlay").classList.remove("modal-hidden");
}

export function closeModal() {
    document.getElementById("modal-overlay").classList.add("modal-hidden");
}

// ─── Carrinho lateral ─────────────────────────────────────────────────────────

export function toggleCart() {
    document.getElementById("side-cart").classList.toggle("active");
}

export function closeCart() {
    document.getElementById("side-cart").classList.remove("active");
}

// ─── Navegação entre páginas ──────────────────────────────────────────────────

export function showMenuPage() {
    document.getElementById("admin-page").classList.add("is-hidden");
    document.getElementById("menu-page").classList.remove("is-hidden");
}

export function showAdminPage() {
    document.getElementById("menu-page").classList.add("is-hidden");
    document.getElementById("admin-page").classList.remove("is-hidden");
}

// ─── Abas de categoria ────────────────────────────────────────────────────────

export function renderCategoryTabs(activeTab, onTabClick) {
    const tabs = [...categories, { id: "monte-prato", label: "Monte o seu prato" }];

    document.getElementById("category-tabs").innerHTML = tabs
        .map((tab) => `
            <button class="category-tab ${activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">
                ${escapeHtml(tab.label)}
            </button>
        `)
        .join("");

    document.querySelectorAll(".category-tab").forEach((btn) => {
        btn.addEventListener("click", () => onTabClick(btn.dataset.tab));
    });
}

// ─── Grade de produtos ────────────────────────────────────────────────────────

export function renderProductGrid(products, onProductClick) {
    const grid = document.getElementById("menu-grid");

    if (!products.length) {
        grid.innerHTML = `<div class="empty-state">Nenhum produto disponível nesta categoria.</div>`;
        return;
    }

    grid.innerHTML = products
        .map((p) => `
            <article class="product-card" data-product-id="${p.id}">
                <div class="product-info">
                    <span class="category-pill">${escapeHtml(getCategoryLabel(p.category))}</span>
                    <h3>${escapeHtml(p.name)}</h3>
                    <p>${escapeHtml(p.desc)}</p>
                    <span class="product-price">${formatCurrency(p.price)}</span>
                </div>
                <img
                    src="${escapeHtml(p.image || LOGO_IMAGE)}"
                    class="product-img"
                    alt="${escapeHtml(p.name)}"
                    onerror="this.src='${LOGO_IMAGE}'"
                />
            </article>
        `)
        .join("");

    document.querySelectorAll(".product-card").forEach((card) => {
        card.addEventListener("click", () => onProductClick(Number(card.dataset.productId)));
    });
}

// ─── Construtor de prato ──────────────────────────────────────────────────────

export function renderPlateBuilder(onAddPlate) {
    document.getElementById("menu-grid").innerHTML = `
        <section class="builder-panel">
            <div class="builder-header">
                <div>
                    <span class="category-pill">Aba personalizada</span>
                    <h3>Monte o seu prato</h3>
                    <p>Escolha a combinação do almoço e adicione ao carrinho.</p>
                </div>
                <strong id="builder-price">${formatCurrency(plateBuilder.basePrice)}</strong>
            </div>

            <div class="builder-grid">
                ${buildSelect("base",    "Arroz",      plateBuilder.options.base)}
                ${buildSelect("beans",   "Feijão",     plateBuilder.options.beans)}
                ${buildSelect("protein", "Proteína",   plateBuilder.options.protein)}
                ${buildSelect("side",    "Guarnição",  plateBuilder.options.side)}
                ${buildSelect("salad",   "Salada",     plateBuilder.options.salad)}
                ${buildSelect("extra",   "Extra",      plateBuilder.options.extra)}
            </div>

            <label>
                Observação do prato
                <textarea id="plate-note" class="input-field" rows="3" placeholder="Ex: molho separado, pouco sal..."></textarea>
            </label>

            <button class="btn-primary" id="btn-add-plate">Adicionar prato personalizado</button>
        </section>
    `;

    // Atualiza preço ao trocar seleção
    document.querySelectorAll(".builder-grid select").forEach((sel) =>
        sel.addEventListener("change", updateBuilderPrice)
    );

    document.getElementById("btn-add-plate").addEventListener("click", onAddPlate);
    updateBuilderPrice();
}

function buildSelect(id, label, options) {
    return `
        <label>
            ${label}
            <select id="plate-${id}" class="input-field">
                ${options.map((opt) => {
                    const name = typeof opt === "string" ? opt : opt.name;
                    const add  = typeof opt === "string" ? 0   : opt.add;
                    const suffix = add > 0 ? ` (+${formatCurrency(add)})` : "";
                    return `<option value="${escapeHtml(name)}" data-add="${add}">${escapeHtml(name + suffix)}</option>`;
                }).join("")}
            </select>
        </label>
    `;
}

function updateBuilderPrice() {
    const price = getBuilderPrice();
    const el = document.getElementById("builder-price");
    if (el) el.innerText = formatCurrency(price);
}

export function getBuilderPrice() {
    return ["base", "beans", "protein", "side", "salad", "extra"].reduce((total, field) => {
        const sel = document.getElementById(`plate-${field}`);
        if (!sel) return total;
        return total + Number(sel.options[sel.selectedIndex]?.dataset.add || 0);
    }, plateBuilder.basePrice);
}

export function getPlateSummary() {
    const fields = [
        ["Arroz",      "base"],
        ["Feijão",     "beans"],
        ["Proteína",   "protein"],
        ["Guarnição",  "side"],
        ["Salada",     "salad"],
        ["Extra",      "extra"]
    ];
    const price = getBuilderPrice();
    const desc  = fields.map(([label, id]) => `${label}: ${document.getElementById(`plate-${id}`)?.value ?? ""}`).join(" | ");
    const note  = document.getElementById("plate-note")?.value.trim();
    return { price, desc: note ? `${desc} | Obs: ${note}` : desc };
}

// ─── Modal de quantidade ──────────────────────────────────────────────────────

export function openQtyModal(product, onUpdateQty, onConfirm) {
    openModal(`
        <h2 class="modal-title">${escapeHtml(product.name)}</h2>
        <p class="muted-text">Escolha a quantidade:</p>
        <div class="qty-controls">
            <button class="btn-circle" id="qty-minus">-</button>
            <span id="temp-qty-display" class="qty-display">1</span>
            <button class="btn-circle" id="qty-plus">+</button>
        </div>
        <button class="btn-primary" id="btn-confirm-cart">Adicionar ao Pedido</button>
        <button class="btn-link"    id="btn-cancel-qty">Cancelar</button>
    `);

    document.getElementById("qty-minus").addEventListener("click", () => onUpdateQty(-1));
    document.getElementById("qty-plus").addEventListener("click",  () => onUpdateQty(1));
    document.getElementById("btn-confirm-cart").addEventListener("click", onConfirm);
    document.getElementById("btn-cancel-qty").addEventListener("click", closeModal);
}

export function updateQtyDisplay(qty) {
    const el = document.getElementById("temp-qty-display");
    if (el) el.innerText = qty;
}

// ─── Modal de entrega ─────────────────────────────────────────────────────────

export function openAddressModal(onFinish) {
    openModal(`
        <h3 class="modal-title">Dados de Entrega</h3>
        <p class="muted-text">Quase lá! Precisamos saber quem recebe.</p>

        <input type="text" id="client-name"    placeholder="Nome completo"                            class="input-field" />
        <input type="text" id="client-address" placeholder="Endereço completo (Rua, Nº, Bairro)"     class="input-field" />

        <label>
            Forma de pagamento
            <select id="payment-method" class="input-field">
                <option value="">Selecione</option>
                <option value="Pix">Pix</option>
                <option value="Crédito">Crédito</option>
                <option value="Débito">Débito</option>
            </select>
        </label>

        <label>
            Observações do cliente
            <textarea id="client-notes" class="input-field" rows="3"
                placeholder="Ex: não quero salada, entregar sem tocar campainha..."></textarea>
        </label>

        <button class="btn-primary" id="btn-finish-order">Finalizar no WhatsApp</button>
        <button class="btn-link"    id="btn-cancel-order">Voltar</button>
    `);

    document.getElementById("btn-finish-order").addEventListener("click", onFinish);
    document.getElementById("btn-cancel-order").addEventListener("click", closeModal);
}

// ─── Carrinho — renderização ──────────────────────────────────────────────────

export function renderCartUI(cart, total, count, onChangeQty, onRemove) {
    document.getElementById("cart-counter").innerText = count;
    document.getElementById("subtotal").innerText     = formatCurrency(total);

    const list = document.getElementById("cart-items");

    if (!cart.length) {
        list.innerHTML = `<div class="empty-state">Seu carrinho está vazio.</div>`;
        return;
    }

    list.innerHTML = cart.map((item) => `
        <article class="cart-item">
            <div class="cart-item-info">
                <h4>${escapeHtml(item.name)}</h4>
                <p>${escapeHtml(item.desc)}</p>
                <strong>${formatCurrency(item.price * item.qty)}</strong>
            </div>
            <div class="cart-quantity">
                <button data-action="minus" data-id="${item.cartId}" aria-label="Diminuir">-</button>
                <span>${item.qty}</span>
                <button data-action="plus"  data-id="${item.cartId}" aria-label="Aumentar">+</button>
            </div>
            <button class="remove-item" data-remove="${item.cartId}">Remover</button>
        </article>
    `).join("");

    list.querySelectorAll("[data-action='minus']").forEach((btn) =>
        btn.addEventListener("click", () => onChangeQty(btn.dataset.id, -1))
    );
    list.querySelectorAll("[data-action='plus']").forEach((btn) =>
        btn.addEventListener("click", () => onChangeQty(btn.dataset.id, 1))
    );
    list.querySelectorAll("[data-remove]").forEach((btn) =>
        btn.addEventListener("click", () => onRemove(btn.dataset.remove))
    );
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function renderCategoryOptions() {
    document.getElementById("product-category").innerHTML = categories
        .map((c) => `<option value="${c.id}">${escapeHtml(c.label)}</option>`)
        .join("");
}

export function renderAdminList(products, onEdit, onDelete) {
    const list = document.getElementById("admin-product-list");

    if (!products.length) {
        list.innerHTML = `<div class="empty-state">Nenhum produto cadastrado.</div>`;
        return;
    }

    list.innerHTML = products.map((p) => `
        <article class="admin-product">
            <img src="${escapeHtml(p.image || LOGO_IMAGE)}" alt="${escapeHtml(p.name)}" onerror="this.src='${LOGO_IMAGE}'" />
            <div>
                <span class="category-pill">${escapeHtml(getCategoryLabel(p.category))}</span>
                <h3>${escapeHtml(p.name)}</h3>
                <p>${escapeHtml(p.desc)}</p>
                <strong>${formatCurrency(p.price)}</strong>
                <small>${p.available === false ? "Indisponível" : "Disponível"}</small>
            </div>
            <div class="admin-product-actions">
                <button class="btn-secondary btn-edit"   data-id="${p.id}">Editar</button>
                <button class="btn-danger   btn-delete"  data-id="${p.id}">Excluir</button>
            </div>
        </article>
    `).join("");

    list.querySelectorAll(".btn-edit").forEach((btn) =>
        btn.addEventListener("click", () => onEdit(Number(btn.dataset.id)))
    );
    list.querySelectorAll(".btn-delete").forEach((btn) =>
        btn.addEventListener("click", () => onDelete(Number(btn.dataset.id)))
    );
}
