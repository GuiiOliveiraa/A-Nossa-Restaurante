// =============================================
// ui.js - Renderizacao e manipulacao do DOM
// =============================================

import { LOGO_IMAGE } from "./config.js";
import { categories, plateBuilder, getCategoryLabel } from "./data.js";
import { formatCurrency, escapeHtml } from "./utils.js";

export function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

export function openModal(htmlContent) {
  document.getElementById("modal-content-area").innerHTML = htmlContent;
  document.getElementById("modal-overlay").classList.remove("modal-hidden");
}

export function closeModal() {
  document.getElementById("modal-overlay").classList.add("modal-hidden");
}

export function toggleCart() {
  document.getElementById("side-cart").classList.toggle("active");
}

export function closeCart() {
  document.getElementById("side-cart").classList.remove("active");
}

export function showMenuPage() {
  document.getElementById("menu-page").classList.remove("is-hidden");
  document.getElementById("login-page").classList.add("is-hidden");
  document.getElementById("admin-page").classList.add("is-hidden");
}

export function showLoginPage() {
  document.getElementById("menu-page").classList.add("is-hidden");
  document.getElementById("login-page").classList.remove("is-hidden");
  document.getElementById("admin-page").classList.add("is-hidden");
}

export function showAdminPage() {
  document.getElementById("menu-page").classList.add("is-hidden");
  document.getElementById("login-page").classList.add("is-hidden");
  document.getElementById("admin-page").classList.remove("is-hidden");
}

export function setLoginError(message = "") {
  const errorElement = document.getElementById("login-error");
  errorElement.textContent = message;
  errorElement.classList.toggle("is-hidden", !message);
}

export function clearLoginForm() {
  document.getElementById("login-form").reset();
  setLoginError("");
}

export function renderCategoryTabs(activeTab, onTabClick) {
  const tabs = [...categories, { id: "monte-prato", label: "Monte o seu prato" }];

  document.getElementById("category-tabs").innerHTML = tabs
    .map(
      (tab) => `
        <button class="category-tab ${activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">
          ${escapeHtml(tab.label)}
        </button>
      `
    )
    .join("");

  document.querySelectorAll(".category-tab").forEach((button) => {
    button.addEventListener("click", () => onTabClick(button.dataset.tab));
  });
}

export function renderProductGrid(products, onProductClick) {
  const grid = document.getElementById("menu-grid");

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state">Nenhum produto disponível nesta categoria.</div>`;
    return;
  }

  grid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card" data-product-id="${product.id}">
          <div class="product-info">
            <span class="category-pill">${escapeHtml(getCategoryLabel(product.category))}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.desc)}</p>
            <span class="product-price">${formatCurrency(product.price)}</span>
          </div>
          <img
            src="${escapeHtml(product.image || LOGO_IMAGE)}"
            class="product-img"
            alt="${escapeHtml(product.name)}"
            onerror="this.src='${LOGO_IMAGE}'"
          />
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => onProductClick(Number(card.dataset.productId)));
  });
}

export function renderPlateBuilder(onAddPlate) {
  document.getElementById("menu-grid").innerHTML = `
    <section class="builder-panel">
      <div class="builder-header">
        <div>
          <span class="category-pill">Aba personalizada</span>
          <h3>Monte o seu prato</h3>
          <p>Escolha a combinacao do almoco e adicione ao carrinho.</p>
        </div>
        <strong id="builder-price">${formatCurrency(plateBuilder.basePrice)}</strong>
      </div>

      <div class="builder-grid">
        ${buildSelect("base", "Arroz", plateBuilder.options.base)}
        ${buildSelect("beans", "Feijao", plateBuilder.options.beans)}
        ${buildSelect("protein", "Proteina", plateBuilder.options.protein)}
        ${buildSelect("side", "Guarnicao", plateBuilder.options.side)}
        ${buildSelect("salad", "Salada", plateBuilder.options.salad)}
        ${buildSelect("extra", "Extra", plateBuilder.options.extra)}
      </div>

      <label>
        Observacao do prato
        <textarea id="plate-note" class="input-field" rows="3" placeholder="Ex: molho separado, pouco sal..."></textarea>
      </label>

      <button class="btn-primary" id="btn-add-plate">Adicionar prato personalizado</button>
    </section>
  `;

  document.querySelectorAll(".builder-grid select").forEach((select) => {
    select.addEventListener("change", updateBuilderPrice);
  });

  document.getElementById("btn-add-plate").addEventListener("click", onAddPlate);
  updateBuilderPrice();
}

function buildSelect(id, label, options) {
  return `
    <label>
      ${label}
      <select id="plate-${id}" class="input-field">
        ${options
          .map((option) => {
            const name = typeof option === "string" ? option : option.name;
            const add = typeof option === "string" ? 0 : option.add;
            const suffix = add > 0 ? ` (+${formatCurrency(add)})` : "";
            return `<option value="${escapeHtml(name)}" data-add="${add}">${escapeHtml(name + suffix)}</option>`;
          })
          .join("")}
      </select>
    </label>
  `;
}

function updateBuilderPrice() {
  const price = getBuilderPrice();
  const element = document.getElementById("builder-price");
  if (element) element.innerText = formatCurrency(price);
}

export function getBuilderPrice() {
  return ["base", "beans", "protein", "side", "salad", "extra"].reduce((total, field) => {
    const select = document.getElementById(`plate-${field}`);
    if (!select) return total;
    return total + Number(select.options[select.selectedIndex]?.dataset.add || 0);
  }, plateBuilder.basePrice);
}

export function getPlateSummary() {
  const fields = [
    ["Arroz", "base"],
    ["Feijao", "beans"],
    ["Proteina", "protein"],
    ["Guarnicao", "side"],
    ["Salada", "salad"],
    ["Extra", "extra"]
  ];
  const price = getBuilderPrice();
  const desc = fields
    .map(([label, id]) => `${label}: ${document.getElementById(`plate-${id}`)?.value ?? ""}`)
    .join(" | ");
  const note = document.getElementById("plate-note")?.value.trim();
  return { price, desc: note ? `${desc} | Obs: ${note}` : desc };
}

export function openQtyModal(product, onUpdateQty, onConfirm) {
  openModal(`
    <h2 class="modal-title">${escapeHtml(product.name)}</h2>
    <p class="muted-text">Escolha a quantidade:</p>
    <div class="qty-controls">
      <button class="btn-circle" id="qty-minus">-</button>
      <span id="temp-qty-display" class="qty-display">1</span>
      <button class="btn-circle" id="qty-plus">+</button>
    </div>
    <button class="btn-primary" id="btn-confirm-cart">Adicionar ao pedido</button>
    <button class="btn-link" id="btn-cancel-qty">Cancelar</button>
  `);

  document.getElementById("qty-minus").addEventListener("click", () => onUpdateQty(-1));
  document.getElementById("qty-plus").addEventListener("click", () => onUpdateQty(1));
  document.getElementById("btn-confirm-cart").addEventListener("click", onConfirm);
  document.getElementById("btn-cancel-qty").addEventListener("click", closeModal);
}

export function updateQtyDisplay(qty) {
  const element = document.getElementById("temp-qty-display");
  if (element) element.innerText = qty;
}

export function openAddressModal(onFinish) {
  openModal(`
    <h3 class="modal-title">Dados de entrega</h3>
    <p class="muted-text">Quase la! Precisamos saber quem recebe.</p>

    <input type="text" id="client-name" placeholder="Nome completo" class="input-field" />
    <input type="text" id="client-address" placeholder="Endereco completo (Rua, N°, Bairro)" class="input-field" />

    <label>
      Forma de pagamento
      <select id="payment-method" class="input-field">
        <option value="">Selecione</option>
        <option value="Pix">Pix</option>
        <option value="Credito">Credito</option>
        <option value="Debito">Debito</option>
      </select>
    </label>

    <label>
      Observacoes do cliente
      <textarea id="client-notes" class="input-field" rows="3"
        placeholder="Ex: nao quero salada, entregar sem tocar campainha..."></textarea>
    </label>

    <button class="btn-primary" id="btn-finish-order">Finalizar no WhatsApp</button>
    <button class="btn-link" id="btn-cancel-order">Voltar</button>
  `);

  document.getElementById("btn-finish-order").addEventListener("click", onFinish);
  document.getElementById("btn-cancel-order").addEventListener("click", closeModal);
}

export function renderCartUI(cart, total, count, onChangeQty, onRemove) {
  document.getElementById("cart-counter").innerText = count;
  document.getElementById("subtotal").innerText = formatCurrency(total);

  const list = document.getElementById("cart-items");

  if (!cart.length) {
    list.innerHTML = `<div class="empty-state">Seu carrinho esta vazio.</div>`;
    return;
  }

  list.innerHTML = cart
    .map(
      (item) => `
        <article class="cart-item">
          <div class="cart-item-info">
            <h4>${escapeHtml(item.name)}</h4>
            <p>${escapeHtml(item.desc)}</p>
            <strong>${formatCurrency(item.price * item.qty)}</strong>
          </div>
          <div class="cart-quantity">
            <button data-action="minus" data-id="${item.cartId}" aria-label="Diminuir">-</button>
            <span>${item.qty}</span>
            <button data-action="plus" data-id="${item.cartId}" aria-label="Aumentar">+</button>
          </div>
          <button class="remove-item" data-remove="${item.cartId}">Remover</button>
        </article>
      `
    )
    .join("");

  list.querySelectorAll("[data-action='minus']").forEach((button) => {
    button.addEventListener("click", () => onChangeQty(button.dataset.id, -1));
  });
  list.querySelectorAll("[data-action='plus']").forEach((button) => {
    button.addEventListener("click", () => onChangeQty(button.dataset.id, 1));
  });
  list.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => onRemove(button.dataset.remove));
  });
}

export function renderCategoryOptions() {
  document.getElementById("product-category").innerHTML = categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.label)}</option>`)
    .join("");
}

export function renderAdminList(products, onEdit, onDelete) {
  const list = document.getElementById("admin-product-list");

  if (!products.length) {
    list.innerHTML = `<div class="empty-state">Nenhum produto cadastrado.</div>`;
    return;
  }

  list.innerHTML = products
    .map(
      (product) => `
        <article class="admin-product">
          <img src="${escapeHtml(product.image || LOGO_IMAGE)}" alt="${escapeHtml(product.name)}" onerror="this.src='${LOGO_IMAGE}'" />
          <div>
            <span class="category-pill">${escapeHtml(getCategoryLabel(product.category))}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.desc)}</p>
            <strong>${formatCurrency(product.price)}</strong>
            <small>${product.available === false ? "Indisponivel" : "Disponivel"}</small>
          </div>
          <div class="admin-product-actions">
            <button class="btn-secondary btn-edit" data-id="${product.id}">Editar</button>
            <button class="btn-danger btn-delete" data-id="${product.id}">Excluir</button>
          </div>
        </article>
      `
    )
    .join("");

  list.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", () => onEdit(Number(button.dataset.id)));
  });
  list.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", () => onDelete(Number(button.dataset.id)));
  });
}
