// =============================================
// data.js - Dados estaticos
// =============================================

export const categories = [
  { id: "promocao", label: "Promocao do dia" },
  { id: "normal", label: "Cardapio normal" },
  { id: "bebidas", label: "Bebidas" },
  { id: "sobremesas", label: "Sobremesas" }
];

export const plateBuilder = {
  basePrice: 27.9,
  options: {
    base: ["Arroz branco", "Arroz integral", "Sem arroz"],
    beans: ["Feijao carioca", "Feijao preto", "Sem feijao"],
    protein: [
      { name: "Frango grelhado", add: 0 },
      { name: "Carne assada", add: 5 },
      { name: "Omelete", add: 2 },
      { name: "File de peixe", add: 6 }
    ],
    side: ["Batata frita", "Farofa", "Legumes", "Pure de batata"],
    salad: ["Salada completa", "So alface", "Sem salada"],
    extra: [
      { name: "Sem extra", add: 0 },
      { name: "Ovo frito", add: 3 },
      { name: "Queijo", add: 4 },
      { name: "Porcao extra de proteina", add: 8 }
    ]
  }
};

export function getCategoryLabel(categoryId) {
  return categories.find((category) => category.id === categoryId)?.label ?? "Sem categoria";
}
