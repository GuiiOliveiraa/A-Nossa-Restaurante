// =============================================
// data.js — Dados estáticos: categorias, produtos padrão e construtor de prato
// =============================================

import { LOGO_IMAGE } from "./config.js";

export const categories = [
    { id: "promocao",   label: "Promoção do dia" },
    { id: "normal",     label: "Cardápio normal" },
    { id: "bebidas",    label: "Bebidas" },
    { id: "sobremesas", label: "Sobremesas" }
];

export const defaultProducts = [
    { id: 1, name: "Prato Executivo Frango",  price: 24.90, desc: "Arroz, feijão, fritas e salada.",    category: "promocao",   image: LOGO_IMAGE, available: true },
    { id: 2, name: "Marmita G - Carne Assada",price: 32.00, desc: "Acompanha guarnição do dia.",          category: "normal",     image: LOGO_IMAGE, available: true },
    { id: 3, name: "Prato Executivo Omelete",  price: 22.90, desc: "Arroz, feijão, legumes e salada.",   category: "normal",     image: LOGO_IMAGE, available: true },
    { id: 4, name: "Suco Natural Laranja",     price:  9.00, desc: "500ml espremido na hora.",           category: "bebidas",    image: LOGO_IMAGE, available: true },
    { id: 5, name: "Refrigerante Lata",        price:  6.50, desc: "350ml gelado.",                      category: "bebidas",    image: LOGO_IMAGE, available: true },
    { id: 6, name: "Pudim Artesanal",          price: 12.00, desc: "Calda de caramelo 150g.",            category: "sobremesas", image: LOGO_IMAGE, available: true }
];

export const plateBuilder = {
    basePrice: 27.90,
    options: {
        base:    ["Arroz branco", "Arroz integral", "Sem arroz"],
        beans:   ["Feijão carioca", "Feijão preto", "Sem feijão"],
        protein: [
            { name: "Frango grelhado",        add: 0 },
            { name: "Carne assada",            add: 5 },
            { name: "Omelete",                 add: 2 },
            { name: "Filé de peixe",           add: 6 }
        ],
        side:  ["Batata frita", "Farofa", "Legumes", "Purê de batata"],
        salad: ["Salada completa", "Só alface", "Sem salada"],
        extra: [
            { name: "Sem extra",                   add: 0 },
            { name: "Ovo frito",                   add: 3 },
            { name: "Queijo",                      add: 4 },
            { name: "Porção extra de proteína",    add: 8 }
        ]
    }
};

/**
 * Retorna o label legível de uma categoria pelo seu id.
 * @param {string} categoryId
 * @returns {string}
 */
export function getCategoryLabel(categoryId) {
    return categories.find((c) => c.id === categoryId)?.label ?? "Sem categoria";
}
