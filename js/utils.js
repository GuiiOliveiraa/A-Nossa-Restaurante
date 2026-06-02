// =============================================
// utils.js — Funções utilitárias puras
// =============================================

/**
 * Formata um número como moeda BRL.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Escapa caracteres HTML para evitar XSS.
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
