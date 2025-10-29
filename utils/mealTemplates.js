// utils/mealTemplates.js
export const mealTemplates = {
  breakfast: [
    {
      name: "Protein-Rich Scramble",
      components: {
        proteinSource: "eggs",
        fatSource: "olive_oil",
        veg: "spinach",
      },
      macroDistribution: { p: 0.4, c: 0.15, f: 0.45 },
    },
    {
      name: "Oatmeal Power Bowl",
      components: {
        carbSource: "oats",
        proteinSource: "protein_powder",
        fatSource: "almonds",
      },
      macroDistribution: { p: 0.3, c: 0.5, f: 0.2 },
    },
    {
      name: "Cottage Cheese & Fruits",
      components: {
        proteinSource: "cottage_cheese",
        carbSource: "berries_mixed",
        fatSource: "chia_seeds",
      },
      macroDistribution: { p: 0.4, c: 0.4, f: 0.2 },
    },
    {
      name: "Avocado & Egg Toast",
      components: {
        carbSource: "bread",
        proteinSource: "eggs",
        fatSource: "avocado",
      },
      macroDistribution: { p: 0.25, c: 0.4, f: 0.35 },
    },
  ],
  lunch: [
    {
      name: "Classic Bodybuilder Meal",
      components: {
        proteinSource: "chicken_breast",
        carbSource: "white_rice_cooked",
        veg: "broccoli",
      },
      macroDistribution: { p: 0.45, c: 0.5, f: 0.05 },
    },
    {
      name: "Omega-3 Rich Meal",
      components: {
        proteinSource: "salmon",
        carbSource: "quinoa_cooked",
        veg: "spinach",
      },
      macroDistribution: { p: 0.4, c: 0.3, f: 0.3 },
    },
    {
      name: "Hearty Pork & Potatoes",
      components: {
        proteinSource: "pork_loin",
        carbSource: "potatoes",
        veg: "bell_pepper",
      },
      macroDistribution: { p: 0.4, c: 0.4, f: 0.2 },
    },
    {
      name: "Tuna Salad Power Lunch",
      components: {
        proteinSource: "tuna_canned",
        fatSource: "avocado",
        carbSource: "bread",
      },
      macroDistribution: { p: 0.4, c: 0.3, f: 0.3 },
    },
    {
      name: "Vegan Chickpea Curry",
      components: {
        proteinSource: "chickpeas_cooked",
        carbSource: "brown_rice_cooked",
        fatSource: "olive_oil",
      },
      macroDistribution: { p: 0.2, c: 0.6, f: 0.2 },
    },
  ],
  dinner: [
    {
      name: "Lean Steak Dinner",
      components: {
        proteinSource: "steak",
        carbSource: "sweet_potatoes",
        veg: "broccoli",
      },
      macroDistribution: { p: 0.4, c: 0.3, f: 0.3 },
    },
    {
      name: "Light Cod & Veggies",
      components: {
        proteinSource: "cod",
        carbSource: "quinoa_cooked",
        veg: "mixed_salad_greens",
      },
      macroDistribution: { p: 0.5, c: 0.3, f: 0.2 },
    },
    {
      name: "Chicken Thigh & Pasta",
      components: {
        proteinSource: "chicken_thigh",
        carbSource: "pasta_cooked",
        fatSource: "olive_oil",
      },
      macroDistribution: { p: 0.3, c: 0.4, f: 0.3 },
    },
    {
      name: "Vegan Lentil Stew",
      components: {
        proteinSource: "lentils_cooked",
        carbSource: "potatoes",
        veg: "spinach",
      },
      macroDistribution: { p: 0.25, c: 0.65, f: 0.1 },
    },
    {
      name: "Tofu Stir-fry",
      components: {
        proteinSource: "tofu",
        carbSource: "white_rice_cooked",
        fatSource: "peanut_butter",
      },
      macroDistribution: { p: 0.25, c: 0.45, f: 0.3 },
    },
  ],
};
