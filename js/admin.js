// =============================================
// admin.js - Painel administrativo (CRUD de produtos)
// =============================================

import { LOGO_IMAGE } from "./config.js";
import { createProduct, deleteProductById, updateProduct } from "./services.js";
import { showToast, renderCategoryOptions, renderAdminList } from "./ui.js";
import { syncCartWithProduct, removeCartItemsByProduct } from "./cart.js";

let products = [];
let onProductChange = null;

export function initAdmin(initialProducts, onChangeCallback) {
  products = initialProducts;
  onProductChange = onChangeCallback;
}

export function getProducts() {
  return products;
}

export function setProducts(list) {
  products = list;
}

export function renderAdminPage() {
  renderCategoryOptions();
  renderAdminList(products, editProduct, deleteProduct);
}

function readProductForm() {
  const idField = document.getElementById("product-id");
  const id = idField.value ? Number(idField.value) : null;

  return {
    id,
    name: document.getElementById("product-name").value.trim(),
    desc: document.getElementById("product-desc").value.trim(),
    price: Number(document.getElementById("product-price").value),
    category: document.getElementById("product-category").value,
    image: document.getElementById("product-image").value.trim() || LOGO_IMAGE,
    available: document.getElementById("product-available").checked
  };
}

export async function saveProduct(event) {
  event.preventDefault();

  const product = readProductForm();

  if (!product.name || !product.desc || Number.isNaN(product.price)) {
    showToast("Preencha os dados do produto corretamente.");
    return false;
  }

  try {
    if (product.id) {
      const updated = await updateProduct(product.id, product);
      if (!updated) {
        throw new Error("Nao foi possivel atualizar o produto.");
      }
      products = products.map((item) => (item.id === updated.id ? updated : item));
      syncCartWithProduct(updated);
      showToast("Produto atualizado!");
    } else {
      const created = await createProduct(product);
      products = [...products, created];
      showToast("Produto cadastrado!");
    }

    resetProductForm();
    renderAdminList(products, editProduct, deleteProduct);
    onProductChange?.([...products]);
    return true;
  } catch (error) {
    showToast(error.message || "Nao foi possivel salvar o produto.");
    return false;
  }
}

export function editProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  document.getElementById("product-id").value = product.id;
  document.getElementById("product-name").value = product.name;
  document.getElementById("product-desc").value = product.desc;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-image").value = product.image || "";
  document.getElementById("product-available").checked = product.available !== false;
}

export async function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product || !window.confirm(`Excluir "${product.name}"?`)) return;

  try {
    await deleteProductById(id);
    products = products.filter((item) => item.id !== id);
    removeCartItemsByProduct(id);
    resetProductForm();
    renderAdminList(products, editProduct, deleteProduct);
    onProductChange?.([...products]);
    showToast("Produto removido!");
  } catch (error) {
    showToast(error.message || "Nao foi possivel remover o produto.");
  }
}

export function resetProductForm() {
  document.getElementById("product-form").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("product-available").checked = true;
}
