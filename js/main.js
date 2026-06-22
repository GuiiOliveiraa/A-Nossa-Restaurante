// =============================================
// main.js - Ponto de entrada
// =============================================

import { restoreSession, isAuthenticated, loginUser, logoutUser } from "./auth.js";
import {
  showToast,
  toggleCart,
  closeCart,
  closeModal,
  showMenuPage,
  showLoginPage,
  showAdminPage,
  setLoginError,
  clearLoginForm,
  renderCategoryTabs,
  renderProductGrid,
  renderPlateBuilder,
  openQtyModal,
  updateQtyDisplay,
  renderCategoryOptions,
  getPlateSummary
} from "./ui.js";
import { loadProducts } from "./services.js";
import { addProductToCart, addCustomPlateToCart, startCheckout } from "./cart.js";
import { initAdmin, getProducts, setProducts, renderAdminPage, saveProduct, resetProductForm } from "./admin.js";

let activeTab = "promocao";
let tempItem = null;

function navigate(pathname, { replace = false } = {}) {
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", pathname);
}

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
    (product) => product.category === activeTab && product.available !== false
  );
  renderProductGrid(filtered, handleOpenQtyModal);
}

function handleOpenQtyModal(id) {
  const product = getProducts().find((item) => item.id === id);
  if (!product || product.available === false) {
    return showToast("Produto indisponivel no momento.");
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

function goToMenuPage({ updateHistory = true } = {}) {
  showMenuPage();
  if (updateHistory) {
    navigate("/");
  }
  renderMenu();
}

function goToLoginPage() {
  closeCart();
  closeModal();
  clearLoginForm();
  showLoginPage();
  navigate("/login");
}

async function goToAdminPage() {
  closeCart();
  closeModal();

  if (!isAuthenticated()) {
    goToLoginPage();
    setLoginError("Faça login para acessar o painel administrativo.");
    return;
  }

  showAdminPage();
  navigate("/admin");
  renderAdminPage();
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const identifier = document.getElementById("login-identifier").value.trim();
  const password = document.getElementById("login-password").value;

  setLoginError("");

  try {
    await loginUser(identifier, password);
    clearLoginForm();
    showToast("Login realizado com sucesso.");
    await goToAdminPage();
  } catch (error) {
    setLoginError(error.message || "Credenciais invalidas.");
  }
}

async function handleLogout() {
  await logoutUser();
  resetProductForm();
  showToast("Sessao encerrada.");
  goToLoginPage();
}

async function handleProtectedSaveProduct(event) {
  if (!isAuthenticated()) {
    setLoginError("Sua sessao expirou. Faça login novamente.");
    goToLoginPage();
    return;
  }

  const saved = await saveProduct(event);
  if (saved) {
    renderMenu();
  }
}

async function syncRouteWithSession() {
  const pathname = window.location.pathname;

  if (pathname === "/admin") {
    if (!isAuthenticated()) {
      goToLoginPage();
      setLoginError("Faça login para acessar o painel administrativo.");
      return;
    }

    showAdminPage();
    renderAdminPage();
    return;
  }

  if (pathname === "/login") {
    if (isAuthenticated()) {
      showAdminPage();
      navigate("/admin", { replace: true });
      renderAdminPage();
      return;
    }

    showLoginPage();
    return;
  }

  goToMenuPage({ updateHistory: false });
}

function bindListeners() {
  document.querySelector(".cart-trigger").addEventListener("click", toggleCart);
  document.querySelector(".admin-trigger").addEventListener("click", goToAdminPage);

  document.querySelector(".close-btn").addEventListener("click", toggleCart);
  document.querySelector(".btn-checkout").addEventListener("click", startCheckout);

  document.getElementById("btn-back-to-menu").addEventListener("click", goToMenuPage);
  document.getElementById("btn-reset-form").addEventListener("click", resetProductForm);
  document.getElementById("btn-login-back").addEventListener("click", goToMenuPage);
  document.getElementById("btn-logout").addEventListener("click", handleLogout);
  document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);
  document.getElementById("product-form").addEventListener("submit", handleProtectedSaveProduct);

  document.getElementById("modal-overlay").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeModal();
  });

  window.addEventListener("popstate", syncRouteWithSession);
}

async function init() {
  const products = await loadProducts();

  initAdmin(products, (updated) => {
    setProducts(updated);
    renderMenu();
  });

  renderCategoryOptions();
  renderMenu();
  bindListeners();
  await restoreSession();
  await syncRouteWithSession();
}

init().catch((error) => {
  console.error(error);
  const message =
    error instanceof TypeError
      ? "Nao foi possivel conectar ao servidor. Execute com 'npm run dev' em vez do Live Server."
      : "Nao foi possivel inicializar a aplicacao.";
  showToast(message);
});
