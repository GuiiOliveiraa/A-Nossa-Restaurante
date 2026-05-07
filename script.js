// CONFIGURAÇÃO DO ATENDENTE
const WHATS_NUMBER = "5511999999999"; 

const state = {
    products: [
        { id: 1, name: "Prato Executivo Frango", price: 24.90, desc: "Arroz, feijão, fritas e salada.", cat: "Marmitas" },
        { id: 2, name: "Marmita G - Carne Assada", price: 32.00, desc: "Acompanha guarnição do dia.", cat: "Marmitas" },
        { id: 3, name: "Suco Natural Laranja", price: 9.00, desc: "500ml espremido na hora.", cat: "Bebidas" },
        { id: 4, name: "Refrigerante Lata", price: 6.50, desc: "350ml gelado.", cat: "Bebidas" },
        { id: 5, name: "Pudim Artesanal", price: 12.00, desc: "Calda de caramelo 150g.", cat: "Sobremesas" }
    ],
    cart: [],
    tempItem: null
};

// --- SISTEMA DE UI ---
function showToast(msg) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function toggleCart() {
    document.getElementById('side-cart').classList.toggle('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('modal-hidden');
}

// --- RENDERIZAÇÃO ---
function init() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = state.products.map(p => `
        <div class="product-card" onclick="openQtyModal(${p.id})">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.desc}</p>
                <span class="product-price">R$ ${p.price.toFixed(2)}</span>
            </div>
            <img src="https://via.placeholder.com/80/eeeeee/d32f2f?text=A+Nossa" class="product-img">
        </div>
    `).join('');
}

// --- LOGICA DO PEDIDO ---
function openQtyModal(id) {
    const prod = state.products.find(p => p.id === id);
    state.tempItem = { ...prod, qty: 1 };
    
    const modalArea = document.getElementById('modal-content-area');
    modalArea.innerHTML = `
        <h2 style="margin-bottom:10px">${prod.name}</h2>
        <p style="color:#666">Escolha a quantidade:</p>
        <div class="qty-controls">
            <button class="btn-circle" onclick="updateTempQty(-1)">-</button>
            <span id="temp-qty-display" style="font-size:1.5rem; font-weight:700">1</span>
            <button class="btn-circle" onclick="updateTempQty(1)">+</button>
        </div>
        <button class="btn-primary" onclick="confirmAddToCart()">Adicionar ao Pedido</button>
        <button class="btn-cancel" onclick="closeModal()" style="margin-top:10px; background:none; border:none; width:100%; cursor:pointer; color:#999">Cancelar</button>
    `;
    document.getElementById('modal-overlay').classList.remove('modal-hidden');
}

function updateTempQty(val) {
    state.tempItem.qty = Math.max(1, state.tempItem.qty + val);
    document.getElementById('temp-qty-display').innerText = state.tempItem.qty;
}

function confirmAddToCart() {
    for(let i=0; i < state.tempItem.qty; i++) {
        state.cart.push({ ...state.tempItem });
    }
    closeModal();
    updateCartUI();
    showToast(`${state.tempItem.qty}x ${state.tempItem.name} adicionado!`);
}

function updateCartUI() {
    const list = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('subtotal');
    const counter = document.getElementById('cart-counter');

    counter.innerText = state.cart.length;

    // Agrupamento para exibição no carrinho
    const grouped = state.cart.reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || { qty: 0, price: item.price });
        acc[item.name].qty++;
        return acc;
    }, {});

    list.innerHTML = Object.entries(grouped).map(([name, data]) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.9rem">
            <span><strong>${data.qty}x</strong> ${name}</span>
            <span>R$ ${(data.price * data.qty).toFixed(2)}</span>
        </div>
    `).join('');

    const total = state.cart.reduce((acc, curr) => acc + curr.price, 0);
    totalDisplay.innerText = `R$ ${total.toFixed(2)}`;
}

// --- CHECKOUT & DADOS DO CLIENTE ---
function openAddressStep() {
    if(state.cart.length === 0) return showToast("Seu carrinho está vazio!");
    
    toggleCart(); // Fecha o carrinho lateral
    const modalArea = document.getElementById('modal-content-area');
    modalArea.innerHTML = `
        <h3>Dados de Entrega</h3>
        <p style="font-size:0.8rem; color:#666; margin-bottom:15px">Quase lá! Precisamos saber quem recebe.</p>
        <input type="text" id="client-name" placeholder="Nome Completo" class="input-field">
        <input type="text" id="client-address" placeholder="Endereço Completo (Rua, Nº, Bairro)" class="input-field">
        <button class="btn-primary" onclick="processFinalOrder()">Finalizar no WhatsApp</button>
        <button onclick="closeModal()" style="margin-top:10px; background:none; border:none; width:100%; cursor:pointer; color:#999">Voltar</button>
    `;
    document.getElementById('modal-overlay').classList.remove('modal-hidden');
}

function processFinalOrder() {
    const nome = document.getElementById('client-name').value;
    const endereco = document.getElementById('client-address').value;

    if(!nome || !endereco) {
        return showToast("Preencha Nome e Endereço para continuar!");
    }

    const total = state.cart.reduce((acc, curr) => acc + curr.price, 0);
    const grouped = state.cart.reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + 1;
        return acc;
    }, {});

    // Gerador de Texto para WhatsApp
    let msg = `*NOVO PEDIDO - A NOSSA*%0A`;
    msg += `---------------------------%0A`;
    msg += `*Cliente:* ${nome}%0A`;
    msg += `*Endereço:* ${endereco}%0A`;
    msg += `---------------------------%0A`;
    
    Object.entries(grouped).forEach(([name, qty]) => {
        msg += `• ${qty}x ${name}%0A`;
    });

    msg += `---------------------------%0A`;
    msg += `*TOTAL: R$ ${total.toFixed(2)}*`;

    window.open(`https://api.whatsapp.com/send?phone=${WHATS_NUMBER}&text=${msg}`, '_blank');
    
    // Limpeza após pedido
    state.cart = [];
    updateCartUI();
    closeModal();
}

init();