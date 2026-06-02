// =============================================
// main.js — Ponto de entrada. Orquestra todos os módulos.
// =============================================

import { loadProducts } from "./services.js";
import {
    showToast, toggleCart, closeCart, closeModal,
    showMenuPage, showAdminPage,
    renderCategoryTabs, renderProductGrid, renderPlateBuilder,
    openQtyModal, updateQtyDisplay,
    renderCategoryOptions, getPlateSummary
} from "./ui.js";
import { addProductToCart, addCustomPlateToCart, startCheckout } from "./cart.js";
import {
    initAdmin, getProducts, setProducts,
    renderAdminPage, saveProduct, resetProductForm
} from "./admin.js";

// ─── Estado local de navegação ────────────────────────────────────────────────

let activeTab = "promocao";
let tempItem  = null;          // produto selecionado no modal de quantidade

// ─── Menu ─────────────────────────────────────────────────────────────────────

function renderMenu() {
    renderCategoryTabs(activeTab, (tabId) => {
        activeTab = tabId;
        renderMenu();
    });

    if (activeTab === "monte-prato") {
        renderPlateBuilder(handleAddCustomPlate);
        return;
    }

    const filtered = getProducts().filter(
        (p) => p.category === activeTab && p.available !== false
    );
    renderProductGrid(filtered, handleOpenQtyModal);
}

// ─── Handlers de produto ──────────────────────────────────────────────────────

function handleOpenQtyModal(id) {
    const product = getProducts().find((p) => p.id === id);
    if (!product || product.available === false) {
        return showToast("Produto indisponível no momento.");
    }

    tempItem = { ...product, qty: 1 };

    openQtyModal(
        product,
        (delta) => {
            tempItem.qty = Math.max(1, tempItem.qty + delta);
            updateQtyDisplay(tempItem.qty);
        },
        () => {
            addProductToCart(tempItem, tempItem.qty);
            showToast(`${tempItem.qty}x ${tempItem.name} adicionado!`);
            closeModal();
        }
    );
}

function handleAddCustomPlate() {
    const plate = getPlateSummary();
    addCustomPlateToCart(plate);
}

// ─── Navegação ────────────────────────────────────────────────────────────────

function goToMenuPage() {
    showMenuPage();
    renderMenu();
}

function goToAdminPage() {
    closeCart();
    closeModal();
    showAdminPage();
    renderAdminPage();
}

// ─── Event listeners globais ──────────────────────────────────────────────────

function bindListeners() {
    // Cabeçalho
    document.querySelector(".cart-trigger") .addEventListener("click", toggleCart);
    document.querySelector(".admin-trigger").addEventListener("click", goToAdminPage);

    // Carrinho
    document.querySelector(".close-btn")  .addEventListener("click", toggleCart);
    document.querySelector(".btn-checkout").addEventListener("click", startCheckout);

    // Admin
    document.getElementById("btn-back-to-menu").addEventListener("click", goToMenuPage);
    document.getElementById("product-form")    .addEventListener("submit", (e) => {
        saveProduct(e);
        renderMenu(); // atualiza o cardápio após salvar
    });
    document.getElementById("btn-reset-form").addEventListener("click", resetProductForm);

    // Fechar modal ao clicar no overlay (fora do conteúdo)
    document.getElementById("modal-overlay").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
    const products = loadProducts();

    initAdmin(products, (updated) => {
        // Quando o admin muta produtos, re-renderiza o cardápio
        setProducts(updated);
        renderMenu();
    });

    renderCategoryOptions();
    renderMenu();
    bindListeners();
}

init();
