// =============================================
// cart.js — Estado do carrinho e envio via WhatsApp
// =============================================

import { WHATS_NUMBER } from "./config.js";
import { formatCurrency } from "./utils.js";
import { renderCartUI, openAddressModal, showToast, closeModal, closeCart } from "./ui.js";

// ─── Estado privado ───────────────────────────────────────────────────────────

let cart = [];

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getCart()      { return cart; }
export function getCartTotal() { return cart.reduce((t, i) => t + i.price * i.qty, 0); }
export function getCartCount() { return cart.reduce((t, i) => t + i.qty, 0); }

// ─── Mutações ─────────────────────────────────────────────────────────────────

export function addProductToCart(product, qty) {
    const existing = cart.find((i) => i.productId === product.id && !i.custom);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            cartId:    `product-${product.id}`,
            productId: product.id,
            name:  product.name,
            price: product.price,
            desc:  product.desc,
            qty,
            custom: false
        });
    }
    refreshCartUI();
}

export function addCustomPlateToCart(plate) {
    cart.push({
        cartId:    `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        productId: null,
        name:  "Monte o seu prato",
        price: plate.price,
        desc:  plate.desc,
        qty:   1,
        custom: true
    });
    refreshCartUI();
    showToast("Prato personalizado adicionado!");
}

export function changeCartQty(cartId, delta) {
    const item = cart.find((i) => i.cartId === cartId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((i) => i.cartId !== cartId);
    refreshCartUI();
}

export function removeCartItem(cartId) {
    cart = cart.filter((i) => i.cartId !== cartId);
    refreshCartUI();
}

export function clearCart() {
    cart = [];
    refreshCartUI();
}

export function syncCartWithProduct(product) {
    cart = cart.map((i) =>
        i.productId !== product.id ? i : { ...i, name: product.name, price: product.price, desc: product.desc }
    );
    refreshCartUI();
}

export function removeCartItemsByProduct(productId) {
    cart = cart.filter((i) => i.productId !== productId);
    refreshCartUI();
}

// ─── Re-render ────────────────────────────────────────────────────────────────

function refreshCartUI() {
    renderCartUI(cart, getCartTotal(), getCartCount(), changeCartQty, removeCartItem);
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export function startCheckout() {
    if (!cart.length) return showToast("Seu carrinho está vazio!");
    closeCart();
    openAddressModal(processFinalOrder);
}

function processFinalOrder() {
    const name    = document.getElementById("client-name").value.trim();
    const address = document.getElementById("client-address").value.trim();
    const payment = document.getElementById("payment-method").value;
    const notes   = document.getElementById("client-notes").value.trim();

    if (!name || !address || !payment) return showToast("Preencha nome, endereço e forma de pagamento!");

    let msg = "*NOVO PEDIDO - A NOSSA*\n";
    msg += "---------------------------\n";
    msg += `*Cliente:* ${name}\n`;
    msg += `*Endereço:* ${address}\n`;
    msg += `*Pagamento:* ${payment}\n`;
    msg += notes ? `*Observações:* ${notes}\n` : "*Observações:* Nenhuma\n";
    msg += "---------------------------\n";

    cart.forEach((item) => {
        msg += `• ${item.qty}x ${item.name} - ${formatCurrency(item.price * item.qty)}\n`;
        if (item.desc) msg += `  ${item.desc}\n`;
    });

    msg += "---------------------------\n";
    msg += `*TOTAL: ${formatCurrency(getCartTotal())}*`;

    window.open(`https://api.whatsapp.com/send?phone=${WHATS_NUMBER}&text=${encodeURIComponent(msg)}`, "_blank");
    clearCart();
    closeModal();
}
