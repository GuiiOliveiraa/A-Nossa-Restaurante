// CONFIGURAÇÃO DO ATENDENTE
const WHATS_NUMBER = "5511999999999";
const PRODUCTS_STORAGE_KEY = "aNossaRestaurante.products";
const LOGO_IMAGE = "Logo.PNG";

const categories = [
    { id: "promocao", label: "Promoção do dia" },
    { id: "normal", label: "Cardápio normal" },
    { id: "bebidas", label: "Bebidas" },
    { id: "sobremesas", label: "Sobremesas" }
];

const defaultProducts = [
    {
        id: 1,
        name: "Prato Executivo Frango",
        price: 24.90,
        desc: "Arroz, feijão, fritas e salada.",
        category: "promocao",
        image: LOGO_IMAGE,
        available: true
    },
    {
        id: 2,
        name: "Marmita G - Carne Assada",
        price: 32.00,
        desc: "Acompanha guarnição do dia.",
        category: "normal",
        image: LOGO_IMAGE,
        available: true
    },
    {
        id: 3,
        name: "Prato Executivo Omelete",
        price: 22.90,
        desc: "Arroz, feijão, legumes e salada.",
        category: "normal",
        image: LOGO_IMAGE,
        available: true
    },
    {
        id: 4,
        name: "Suco Natural Laranja",
        price: 9.00,
        desc: "500ml espremido na hora.",
        category: "bebidas",
        image: LOGO_IMAGE,
        available: true
    },
    {
        id: 5,
        name: "Refrigerante Lata",
        price: 6.50,
        desc: "350ml gelado.",
        category: "bebidas",
        image: LOGO_IMAGE,
        available: true
    },
    {
        id: 6,
        name: "Pudim Artesanal",
        price: 12.00,
        desc: "Calda de caramelo 150g.",
        category: "sobremesas",
        image: LOGO_IMAGE,
        available: true
    }
];

const plateBuilder = {
    basePrice: 27.90,
    options: {
        base: ["Arroz branco", "Arroz integral", "Sem arroz"],
        beans: ["Feijão carioca", "Feijão preto", "Sem feijão"],
        protein: [
            { name: "Frango grelhado", add: 0 },
            { name: "Carne assada", add: 5 },
            { name: "Omelete", add: 2 },
            { name: "Filé de peixe", add: 6 }
        ],
        side: ["Batata frita", "Farofa", "Legumes", "Purê de batata"],
        salad: ["Salada completa", "Só alface", "Sem salada"],
        extra: [
            { name: "Sem extra", add: 0 },
            { name: "Ovo frito", add: 3 },
            { name: "Queijo", add: 4 },
            { name: "Porção extra de proteína", add: 8 }
        ]
    }
};

const state = {
    products: loadProducts(),
    cart: [],
    tempItem: null,
    activeTab: "promocao"
};

function loadProducts() {
    const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);

    if (!savedProducts) {
        return [...defaultProducts];
    }

    try {
        const parsed = JSON.parse(savedProducts);
        return Array.isArray(parsed) && parsed.length ? parsed : [...defaultProducts];
    } catch (error) {
        return [...defaultProducts];
    }
}

function persistProducts() {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(state.products));
}

function formatCurrency(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getCategoryLabel(categoryId) {
    return categories.find((category) => category.id === categoryId)?.label || "Sem categoria";
}

function showToast(msg) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function toggleCart() {
    document.getElementById("side-cart").classList.toggle("active");
}

function closeCart() {
    document.getElementById("side-cart").classList.remove("active");
}

function closeModal() {
    document.getElementById("modal-overlay").classList.add("modal-hidden");
}

function openMenuPage() {
    document.getElementById("admin-page").classList.add("is-hidden");
    document.getElementById("menu-page").classList.remove("is-hidden");
    renderMenu();
}

function openAdminPage() {
    closeCart();
    closeModal();
    document.getElementById("menu-page").classList.add("is-hidden");
    document.getElementById("admin-page").classList.remove("is-hidden");
    renderAdminPage();
}

function renderCategoryTabs() {
    const tabs = [
        ...categories,
        { id: "monte-prato", label: "Monte o seu prato" }
    ];

    document.getElementById("category-tabs").innerHTML = tabs.map((tab) => `
        <button
            class="category-tab ${state.activeTab === tab.id ? "active" : ""}"
            onclick="setActiveTab('${tab.id}')"
        >
            ${escapeHtml(tab.label)}
        </button>
    `).join("");
}

function setActiveTab(tabId) {
    state.activeTab = tabId;
    renderMenu();
}

function renderMenu() {
    renderCategoryTabs();

    if (state.activeTab === "monte-prato") {
        renderPlateBuilder();
        return;
    }

    const products = state.products.filter((product) =>
        product.category === state.activeTab && product.available !== false
    );

    const grid = document.getElementById("menu-grid");

    if (!products.length) {
        grid.innerHTML = `
            <div class="empty-state">
                Nenhum produto disponível nesta categoria.
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map((product) => `
        <article class="product-card" onclick="openQtyModal(${product.id})">
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
    `).join("");
}

function renderPlateBuilder() {
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
                ${buildSelect("base", "Arroz", plateBuilder.options.base)}
                ${buildSelect("beans", "Feijão", plateBuilder.options.beans)}
                ${buildSelect("protein", "Proteína", plateBuilder.options.protein)}
                ${buildSelect("side", "Guarnição", plateBuilder.options.side)}
                ${buildSelect("salad", "Salada", plateBuilder.options.salad)}
                ${buildSelect("extra", "Extra", plateBuilder.options.extra)}
            </div>

            <label>
                Observação do prato
                <textarea
                    id="plate-note"
                    class="input-field"
                    rows="3"
                    placeholder="Ex: molho separado, pouco sal..."
                ></textarea>
            </label>

            <button class="btn-primary" onclick="addCustomPlate()">Adicionar prato personalizado</button>
        </section>
    `;

    updateBuilderPrice();
}

function buildSelect(id, label, options) {
    return `
        <label>
            ${label}
            <select id="plate-${id}" class="input-field" onchange="updateBuilderPrice()">
                ${options.map((option) => {
                    const optionName = typeof option === "string" ? option : option.name;
                    const optionAdd = typeof option === "string" ? 0 : option.add;
                    const suffix = optionAdd > 0 ? ` (+${formatCurrency(optionAdd)})` : "";
                    return `<option value="${escapeHtml(optionName)}" data-add="${optionAdd}">${escapeHtml(optionName + suffix)}</option>`;
                }).join("")}
            </select>
        </label>
    `;
}

function getSelectedPlateOption(id) {
    const select = document.getElementById(`plate-${id}`);
    const option = select.options[select.selectedIndex];
    return {
        name: select.value,
        add: Number(option.dataset.add || 0)
    };
}

function getPlateSummary() {
    const selections = [
        ["Arroz", getSelectedPlateOption("base")],
        ["Feijão", getSelectedPlateOption("beans")],
        ["Proteína", getSelectedPlateOption("protein")],
        ["Guarnição", getSelectedPlateOption("side")],
        ["Salada", getSelectedPlateOption("salad")],
        ["Extra", getSelectedPlateOption("extra")]
    ];

    const price = selections.reduce((total, [, option]) => total + option.add, plateBuilder.basePrice);
    const desc = selections.map(([label, option]) => `${label}: ${option.name}`).join(" | ");
    const note = document.getElementById("plate-note")?.value.trim();

    return {
        price,
        desc: note ? `${desc} | Obs: ${note}` : desc
    };
}

function updateBuilderPrice() {
    const price = getPlateSummary().price;
    const display = document.getElementById("builder-price");

    if (display) {
        display.innerText = formatCurrency(price);
    }
}

function addCustomPlate() {
    const plate = getPlateSummary();

    state.cart.push({
        cartId: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        productId: null,
        name: "Monte o seu prato",
        price: plate.price,
        desc: plate.desc,
        qty: 1,
        custom: true
    });

    updateCartUI();
    showToast("Prato personalizado adicionado!");
}

function openQtyModal(id) {
    const product = state.products.find((item) => item.id === id);

    if (!product || product.available === false) {
        return showToast("Produto indisponível no momento.");
    }

    state.tempItem = { ...product, qty: 1 };

    document.getElementById("modal-content-area").innerHTML = `
        <h2 class="modal-title">${escapeHtml(product.name)}</h2>
        <p class="muted-text">Escolha a quantidade:</p>
        <div class="qty-controls">
            <button class="btn-circle" onclick="updateTempQty(-1)">-</button>
            <span id="temp-qty-display" class="qty-display">1</span>
            <button class="btn-circle" onclick="updateTempQty(1)">+</button>
        </div>
        <button class="btn-primary" onclick="confirmAddToCart()">Adicionar ao Pedido</button>
        <button class="btn-link" onclick="closeModal()">Cancelar</button>
    `;
    document.getElementById("modal-overlay").classList.remove("modal-hidden");
}

function updateTempQty(value) {
    state.tempItem.qty = Math.max(1, state.tempItem.qty + value);
    document.getElementById("temp-qty-display").innerText = state.tempItem.qty;
}

function confirmAddToCart() {
    const product = state.tempItem;
    const existingItem = state.cart.find((item) => item.productId === product.id && !item.custom);

    if (existingItem) {
        existingItem.qty += product.qty;
    } else {
        state.cart.push({
            cartId: `product-${product.id}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            desc: product.desc,
            qty: product.qty,
            custom: false
        });
    }

    closeModal();
    updateCartUI();
    showToast(`${product.qty}x ${product.name} adicionado!`);
}

function changeCartQty(cartId, value) {
    const item = state.cart.find((cartItem) => cartItem.cartId === cartId);

    if (!item) {
        return;
    }

    item.qty += value;

    if (item.qty <= 0) {
        state.cart = state.cart.filter((cartItem) => cartItem.cartId !== cartId);
    }

    updateCartUI();
}

function removeCartItem(cartId) {
    state.cart = state.cart.filter((cartItem) => cartItem.cartId !== cartId);
    updateCartUI();
}

function getCartTotal() {
    return state.cart.reduce((total, item) => total + item.price * item.qty, 0);
}

function getCartCount() {
    return state.cart.reduce((total, item) => total + item.qty, 0);
}

function updateCartUI() {
    const list = document.getElementById("cart-items");
    const totalDisplay = document.getElementById("subtotal");
    const counter = document.getElementById("cart-counter");

    counter.innerText = getCartCount();
    totalDisplay.innerText = formatCurrency(getCartTotal());

    if (!state.cart.length) {
        list.innerHTML = `<div class="empty-state">Seu carrinho está vazio.</div>`;
        return;
    }

    list.innerHTML = state.cart.map((item) => `
        <article class="cart-item">
            <div class="cart-item-info">
                <h4>${escapeHtml(item.name)}</h4>
                <p>${escapeHtml(item.desc)}</p>
                <strong>${formatCurrency(item.price * item.qty)}</strong>
            </div>

            <div class="cart-quantity">
                <button onclick="changeCartQty('${item.cartId}', -1)" aria-label="Diminuir quantidade">-</button>
                <span>${item.qty}</span>
                <button onclick="changeCartQty('${item.cartId}', 1)" aria-label="Aumentar quantidade">+</button>
            </div>

            <button class="remove-item" onclick="removeCartItem('${item.cartId}')">Remover</button>
        </article>
    `).join("");
}

function openAddressStep() {
    if (!state.cart.length) {
        return showToast("Seu carrinho está vazio!");
    }

    closeCart();
    document.getElementById("modal-content-area").innerHTML = `
        <h3 class="modal-title">Dados de Entrega</h3>
        <p class="muted-text">Quase lá! Precisamos saber quem recebe.</p>

        <input type="text" id="client-name" placeholder="Nome completo" class="input-field" />
        <input type="text" id="client-address" placeholder="Endereço completo (Rua, Nº, Bairro)" class="input-field" />

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
            <textarea
                id="client-notes"
                class="input-field"
                rows="3"
                placeholder="Ex: não quero salada, entregar sem tocar campainha..."
            ></textarea>
        </label>

        <button class="btn-primary" onclick="processFinalOrder()">Finalizar no WhatsApp</button>
        <button class="btn-link" onclick="closeModal()">Voltar</button>
    `;
    document.getElementById("modal-overlay").classList.remove("modal-hidden");
}

function processFinalOrder() {
    const name = document.getElementById("client-name").value.trim();
    const address = document.getElementById("client-address").value.trim();
    const payment = document.getElementById("payment-method").value;
    const notes = document.getElementById("client-notes").value.trim();

    if (!name || !address || !payment) {
        return showToast("Preencha nome, endereço e forma de pagamento!");
    }

    let msg = "*NOVO PEDIDO - A NOSSA*\n";
    msg += "---------------------------\n";
    msg += `*Cliente:* ${name}\n`;
    msg += `*Endereço:* ${address}\n`;
    msg += `*Pagamento:* ${payment}\n`;
    msg += notes ? `*Observações:* ${notes}\n` : "*Observações:* Nenhuma\n";
    msg += "---------------------------\n";

    state.cart.forEach((item) => {
        msg += `• ${item.qty}x ${item.name} - ${formatCurrency(item.price * item.qty)}\n`;
        if (item.desc) {
            msg += `  ${item.desc}\n`;
        }
    });

    msg += "---------------------------\n";
    msg += `*TOTAL: ${formatCurrency(getCartTotal())}*`;

    window.open(`https://api.whatsapp.com/send?phone=${WHATS_NUMBER}&text=${encodeURIComponent(msg)}`, "_blank");

    state.cart = [];
    updateCartUI();
    closeModal();
}

function renderCategoryOptions() {
    document.getElementById("product-category").innerHTML = categories.map((category) => `
        <option value="${category.id}">${escapeHtml(category.label)}</option>
    `).join("");
}

function renderAdminPage() {
    renderCategoryOptions();
    renderAdminList();
}

function renderAdminList() {
    const list = document.getElementById("admin-product-list");

    if (!state.products.length) {
        list.innerHTML = `<div class="empty-state">Nenhum produto cadastrado.</div>`;
        return;
    }

    list.innerHTML = state.products.map((product) => `
        <article class="admin-product">
            <img
                src="${escapeHtml(product.image || LOGO_IMAGE)}"
                alt="${escapeHtml(product.name)}"
                onerror="this.src='${LOGO_IMAGE}'"
            />
            <div>
                <span class="category-pill">${escapeHtml(getCategoryLabel(product.category))}</span>
                <h3>${escapeHtml(product.name)}</h3>
                <p>${escapeHtml(product.desc)}</p>
                <strong>${formatCurrency(product.price)}</strong>
                <small>${product.available === false ? "Indisponível" : "Disponível"}</small>
            </div>
            <div class="admin-product-actions">
                <button class="btn-secondary" onclick="editProduct(${product.id})">Editar</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">Excluir</button>
            </div>
        </article>
    `).join("");
}

function saveProduct(event) {
    event.preventDefault();

    const idField = document.getElementById("product-id");
    const id = idField.value ? Number(idField.value) : Date.now();
    const product = {
        id,
        name: document.getElementById("product-name").value.trim(),
        desc: document.getElementById("product-desc").value.trim(),
        price: Number(document.getElementById("product-price").value),
        category: document.getElementById("product-category").value,
        image: document.getElementById("product-image").value.trim() || LOGO_IMAGE,
        available: document.getElementById("product-available").checked
    };

    if (!product.name || !product.desc || Number.isNaN(product.price)) {
        return showToast("Preencha os dados do produto corretamente.");
    }

    const existingIndex = state.products.findIndex((item) => item.id === id);

    if (existingIndex >= 0) {
        state.products[existingIndex] = product;
        updateCartItemsFromProduct(product);
        showToast("Produto atualizado!");
    } else {
        state.products.push(product);
        showToast("Produto cadastrado!");
    }

    persistProducts();
    resetProductForm();
    renderMenu();
    renderAdminList();
    updateCartUI();
}

function updateCartItemsFromProduct(product) {
    state.cart = state.cart.map((item) => {
        if (item.productId !== product.id) {
            return item;
        }

        return {
            ...item,
            name: product.name,
            price: product.price,
            desc: product.desc
        };
    });
}

function editProduct(id) {
    const product = state.products.find((item) => item.id === id);

    if (!product) {
        return;
    }

    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-desc").value = product.desc;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-image").value = product.image || "";
    document.getElementById("product-available").checked = product.available !== false;
}

function deleteProduct(id) {
    const product = state.products.find((item) => item.id === id);

    if (!product || !confirm(`Excluir "${product.name}"?`)) {
        return;
    }

    state.products = state.products.filter((item) => item.id !== id);
    state.cart = state.cart.filter((item) => item.productId !== id);

    persistProducts();
    resetProductForm();
    renderMenu();
    renderAdminList();
    updateCartUI();
    showToast("Produto removido!");
}

function resetProductForm() {
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    document.getElementById("product-available").checked = true;
}

function init() {
    renderCategoryOptions();
    renderMenu();
    updateCartUI();
}

init();
