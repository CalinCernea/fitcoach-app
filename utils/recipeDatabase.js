// utils/recipeDatabase.js

export const ingredients = {
  // --- Existing Ingredients with Prep Info ---
  chicken_breast: {
    id: "chicken_breast",
    name: "Chicken Breast",
    prepInfo: {
      canPrep: true,
      method: "Grill or bake",
      prepGroup: "Cooked Proteins",
    },
  },
  quinoa: {
    id: "quinoa",
    name: "Quinoa",
    prepInfo: {
      canPrep: true,
      method: "Boil according to instructions",
      prepGroup: "Boiled Grains",
    },
  },
  avocado: {
    id: "avocado",
    name: "Avocado",
    prepInfo: { canPrep: false }, // Best fresh
  },
  spinach: {
    id: "spinach",
    name: "Spinach",
    prepInfo: { canPrep: false }, // Best fresh
  },
  tomato: {
    id: "tomato",
    name: "Tomato",
    prepInfo: {
      canPrep: true,
      method: "Chop or slice",
      prepGroup: "Chopped Veggies",
    },
  },
  cucumber: {
    id: "cucumber",
    name: "Cucumber",
    prepInfo: { canPrep: true, method: "Slice", prepGroup: "Chopped Veggies" },
  },
  feta_cheese: {
    id: "feta_cheese",
    name: "Feta Cheese",
    prepInfo: { canPrep: false }, // Best fresh
  },
  olive_oil: {
    id: "olive_oil",
    name: "Olive Oil",
    prepInfo: { canPrep: false },
  },
  lemon: {
    id: "lemon",
    name: "Lemon",
    prepInfo: { canPrep: false },
  },
  salmon_filet: {
    id: "salmon_filet",
    name: "Salmon Filet",
    prepInfo: {
      canPrep: true,
      method: "Bake in the oven",
      prepGroup: "Cooked Proteins",
    },
  },
  asparagus: {
    id: "asparagus",
    name: "Asparagus",
    prepInfo: {
      canPrep: true,
      method: "Roast or steam",
      prepGroup: "Cooked Veggies",
    },
  },
  sweet_potato: {
    id: "sweet_potato",
    name: "Sweet Potato",
    prepInfo: {
      canPrep: true,
      method: "Cube and roast",
      prepGroup: "Cooked Veggies",
    },
  },
  greek_yogurt: {
    id: "greek_yogurt",
    name: "Greek Yogurt",
    prepInfo: { canPrep: false },
  },
  berries: {
    id: "berries",
    name: "Mixed Berries",
    prepInfo: { canPrep: false },
  },
  oats: {
    id: "oats",
    name: "Rolled Oats",
    prepInfo: { canPrep: false }, // Used in overnight oats or cooked fresh
  },
  protein_powder: {
    id: "protein_powder",
    name: "Protein Powder",
    prepInfo: { canPrep: false },
  },
  almond_milk: {
    id: "almond_milk",
    name: "Almond Milk",
    prepInfo: { canPrep: false },
  },
  eggs: {
    id: "eggs",
    name: "Eggs",
    prepInfo: { canPrep: true, method: "Hard boil", prepGroup: "Boiled Eggs" },
  },
  whole_wheat_bread: {
    id: "whole_wheat_bread",
    name: "Whole Wheat Bread",
    prepInfo: { canPrep: false },
  },
  turkey_breast: {
    id: "turkey_breast",
    name: "Turkey Breast",
    prepInfo: {
      canPrep: true,
      method: "Cook and slice",
      prepGroup: "Cooked Proteins",
    },
  },
  lettuce: {
    id: "lettuce",
    name: "Lettuce",
    prepInfo: { canPrep: false }, // Best fresh
  },
  beef_sirloin: {
    id: "beef_sirloin",
    name: "Beef Sirloin",
    prepInfo: {
      canPrep: true,
      method: "Cook and slice",
      prepGroup: "Cooked Proteins",
    },
  },
  broccoli: {
    id: "broccoli",
    name: "Broccoli",
    prepInfo: {
      canPrep: true,
      method: "Cut into florets and roast or steam",
      prepGroup: "Cooked Veggies",
    },
  },
  brown_rice: {
    id: "brown_rice",
    name: "Brown Rice",
    prepInfo: {
      canPrep: true,
      method: "Boil according to instructions",
      prepGroup: "Boiled Grains",
    },
  },
  tzatziki: {
    id: "tzatziki",
    name: "Tzatziki Sauce",
    prepInfo: { canPrep: false },
  },
  banana: {
    id: "banana",
    name: "Banana",
    prepInfo: { canPrep: false },
  },
  chia_seeds: {
    id: "chia_seeds",
    name: "Chia Seeds",
    prepInfo: { canPrep: false },
  },
  honey: {
    id: "honey",
    name: "Honey",
    prepInfo: { canPrep: false },
  },
  cottage_cheese: {
    id: "cottage_cheese",
    name: "Cottage Cheese",
    prepInfo: { canPrep: false },
  },
  peach: {
    id: "peach",
    name: "Peach",
    prepInfo: { canPrep: false },
  },
  almonds: {
    id: "almonds",
    name: "Almonds",
    prepInfo: { canPrep: false },
  },
  tuna_can: {
    id: "tuna_can",
    name: "Canned Tuna",
    prepInfo: { canPrep: false }, // Already prepped
  },
  mayonnaise: {
    id: "mayonnaise",
    name: "Light Mayonnaise",
    prepInfo: { canPrep: false },
  },
  onion: {
    id: "onion",
    name: "Red Onion",
    prepInfo: {
      canPrep: true,
      method: "Chop or slice",
      prepGroup: "Chopped Aromatics",
    },
  },
  whole_wheat_wrap: {
    id: "whole_wheat_wrap",
    name: "Whole Wheat Wrap",
    prepInfo: { canPrep: false },
  },
  lentils: {
    id: "lentils",
    name: "Lentils",
    prepInfo: {
      canPrep: true,
      method: "Boil until tender",
      prepGroup: "Boiled Legumes",
    },
  },
  carrot: {
    id: "carrot",
    name: "Carrot",
    prepInfo: {
      canPrep: true,
      method: "Chop or grate",
      prepGroup: "Chopped Veggies",
    },
  },
  celery: {
    id: "celery",
    name: "Celery",
    prepInfo: { canPrep: true, method: "Chop", prepGroup: "Chopped Veggies" },
  },
  vegetable_broth: {
    id: "vegetable_broth",
    name: "Vegetable Broth",
    prepInfo: { canPrep: false },
  },
  shrimp: {
    id: "shrimp",
    name: "Shrimp",
    prepInfo: {
      canPrep: true,
      method: "Cook until pink",
      prepGroup: "Cooked Proteins",
    },
  },
  garlic: {
    id: "garlic",
    name: "Garlic",
    prepInfo: {
      canPrep: true,
      method: "Mince",
      prepGroup: "Chopped Aromatics",
    },
  },
  bell_pepper: {
    id: "bell_pepper",
    name: "Bell Pepper",
    prepInfo: { canPrep: true, method: "Slice", prepGroup: "Chopped Veggies" },
  },
  black_beans: {
    id: "black_beans",
    name: "Black Beans",
    prepInfo: { canPrep: false }, // Canned beans are already prepped
  },
  corn: {
    id: "corn",
    name: "Corn",
    prepInfo: { canPrep: false }, // Canned corn is already prepped
  },
  lime: {
    id: "lime",
    name: "Lime",
    prepInfo: { canPrep: false },
  },
  cod_filet: {
    id: "cod_filet",
    name: "Cod Filet",
    prepInfo: {
      canPrep: true,
      method: "Bake or pan-sear",
      prepGroup: "Cooked Proteins",
    },
  },
  pesto: {
    id: "pesto",
    name: "Pesto",
    prepInfo: { canPrep: false },
  },
  cherry_tomatoes: {
    id: "cherry_tomatoes",
    name: "Cherry Tomatoes",
    prepInfo: {
      canPrep: true,
      method: "Halve or leave whole for roasting",
      prepGroup: "Cooked Veggies",
    },
  },
};

// --- YOUR RECIPES (UNCHANGED) ---
export const recipes = [
  // ... (all your recipes remain exactly as you provided them)
  /* -------------------------------------------------------------------------- */
  /*                                  BREAKFAST                                 */
  /* -------------------------------------------------------------------------- */
  {
    id: "protein-oats",
    name: "Protein Oatmeal",
    mealType: ["breakfast"],
    baseCalories: 450,
    imageUrl:
      "https://images.unsplash.com/photo-1584960407932-c1631ea3a5e0?q=80&w=1974&auto=format&fit=crop",
    tags: ["oats", "protein_powder", "berries"],
    ingredients: [
      { ingredientId: "oats", amount: 50, unit: "g" },
      { ingredientId: "protein_powder", amount: 30, unit: "g" },
      { ingredientId: "almond_milk", amount: 200, unit: "ml" },
      { ingredientId: "berries", amount: 75, unit: "g" },
    ],
    instructions: [
      "Combine oats, protein powder, and almond milk in a bowl.",
      "Microwave for 2-3 minutes, stirring halfway through.",
      "Top with mixed berries and serve.",
    ],
  },
  {
    id: "scrambled-eggs-toast",
    name: "Scrambled Eggs on Toast",
    mealType: ["breakfast"],
    baseCalories: 400,
    imageUrl:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=2080&auto=format&fit=crop",
    tags: ["eggs", "whole_wheat_bread", "avocado"],
    ingredients: [
      { ingredientId: "eggs", amount: 3, unit: "pcs" },
      { ingredientId: "whole_wheat_bread", amount: 2, unit: "slices" },
      { ingredientId: "avocado", amount: 50, unit: "g" },
    ],
    instructions: [
      "Whisk eggs in a bowl. Season with salt and pepper.",
      "Cook in a non-stick pan over medium heat, stirring gently.",
      "Toast the bread and top with mashed avocado.",
      "Serve scrambled eggs on top of the avocado toast.",
    ],
  },
  {
    id: "yogurt-chia-bowl",
    name: "Greek Yogurt & Chia Bowl",
    mealType: ["breakfast"],
    baseCalories: 380,
    imageUrl:
      "https://images.unsplash.com/photo-1565005792934-3638f39c1a53?q=80&w=1974&auto=format&fit=crop",
    tags: ["greek_yogurt", "chia_seeds", "banana", "honey"],
    ingredients: [
      { ingredientId: "greek_yogurt", amount: 200, unit: "g" },
      { ingredientId: "chia_seeds", amount: 15, unit: "g" },
      { ingredientId: "banana", amount: 1, unit: "pcs" },
      { ingredientId: "honey", amount: 10, unit: "ml" },
    ],
    instructions: [
      "In a bowl, mix the Greek yogurt and chia seeds.",
      "Let it sit for 5 minutes for the chia seeds to soften.",
      "Slice the banana and add it on top.",
      "Drizzle with honey before serving.",
    ],
  },
  {
    id: "cottage-cheese-peach",
    name: "Cottage Cheese with Peach & Almonds",
    mealType: ["breakfast"],
    baseCalories: 350,
    imageUrl:
      "https://images.unsplash.com/photo-1632203171997-83e95a5f97a3?q=80&w=1964&auto=format&fit=crop",
    tags: ["cottage_cheese", "peach", "almonds"],
    ingredients: [
      { ingredientId: "cottage_cheese", amount: 200, unit: "g" },
      { ingredientId: "peach", amount: 1, unit: "pcs" },
      { ingredientId: "almonds", amount: 20, unit: "g" },
    ],
    instructions: [
      "Add cottage cheese to a bowl.",
      "Slice the peach and arrange it on top of the cottage cheese.",
      "Sprinkle with almonds for a crunchy texture.",
      "Serve immediately for a quick and high-protein breakfast.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /*                                LUNCH & DINNER                              */
  /* -------------------------------------------------------------------------- */
  {
    id: "chicken-quinoa-bowl",
    name: "Grilled Chicken & Quinoa Bowl",
    mealType: ["lunch", "dinner"],
    baseCalories: 550,
    imageUrl:
      "https://images.unsplash.com/photo-1598245728635-2454b836058a?q=80&w=1974&auto=format&fit=crop",
    tags: ["chicken_breast", "quinoa", "avocado", "spinach"],
    ingredients: [
      { ingredientId: "chicken_breast", amount: 150, unit: "g" },
      { ingredientId: "quinoa", amount: 60, unit: "g" },
      { ingredientId: "spinach", amount: 100, unit: "g" },
      { ingredientId: "avocado", amount: 50, unit: "g" },
      { ingredientId: "tomato", amount: 1, unit: "pcs" },
    ],
    instructions: [
      "Cook quinoa according to package directions.",
      "Season and grill chicken breast until cooked through. Slice it.",
      "Assemble the bowl: start with a bed of spinach, add quinoa, sliced chicken, avocado, and chopped tomato.",
      "Drizzle with a light vinaigrette if desired.",
    ],
  },
  {
    id: "salmon-asparagus",
    name: "Roasted Salmon with Asparagus",
    mealType: ["lunch", "dinner"],
    baseCalories: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1604329421922-342d743493d4?q=80&w=2070&auto=format&fit=crop",
    tags: ["salmon_filet", "asparagus", "lemon"],
    ingredients: [
      { ingredientId: "salmon_filet", amount: 180, unit: "g" },
      { ingredientId: "asparagus", amount: 200, unit: "g" },
      { ingredientId: "olive_oil", amount: 10, unit: "ml" },
      { ingredientId: "lemon", amount: 0.5, unit: "pcs" },
    ],
    instructions: [
      "Preheat oven to 200°C (400°F  ).",
      "Toss asparagus with olive oil, salt, and pepper on a baking sheet.",
      "Place salmon filet on the same sheet. Season and squeeze lemon juice over it.",
      "Roast for 12-15 minutes, or until salmon is cooked to your liking.",
    ],
  },
  {
    id: "beef-broccoli-stir-fry",
    name: "Beef and Broccoli Stir-fry",
    mealType: ["lunch", "dinner"],
    baseCalories: 600,
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1664475944379-6344383f5545?q=80&w=2070&auto=format&fit=crop",
    tags: ["beef_sirloin", "broccoli", "brown_rice"],
    ingredients: [
      { ingredientId: "beef_sirloin", amount: 150, unit: "g" },
      { ingredientId: "broccoli", amount: 200, unit: "g" },
      { ingredientId: "brown_rice", amount: 75, unit: "g" },
    ],
    instructions: [
      "Cook brown rice according to package directions.",
      "Slice beef thinly. Cut broccoli into florets.",
      "In a wok or large pan, stir-fry beef until browned. Remove from pan.",
      "Add broccoli to the pan with a splash of water, cover and steam for 3-4 minutes.",
      "Return beef to the pan, add soy sauce or other stir-fry sauce, and cook for another minute.",
      "Serve over brown rice.",
    ],
  },
  {
    id: "chicken-tzatziki-bowl",
    name: "Chicken Tzatziki Bowl",
    mealType: ["lunch", "dinner"],
    baseCalories: 520,
    imageUrl:
      "https://images.unsplash.com/photo-1644824133418-34ff684d585e?q=80&w=1964&auto=format&fit=crop",
    tags: ["chicken_breast", "cucumber", "tomato", "tzatziki"],
    ingredients: [
      { ingredientId: "chicken_breast", amount: 150, unit: "g" },
      { ingredientId: "cucumber", amount: 100, unit: "g" },
      { ingredientId: "tomato", amount: 1, unit: "pcs" },
      { ingredientId: "brown_rice", amount: 50, unit: "g" },
      { ingredientId: "tzatziki", amount: 2, unit: "tbsp" },
    ],
    instructions: [
      "Grill or pan-sear the chicken breast, then slice.",
      "Cook rice as per instructions.",
      "Dice cucumber and tomato.",
      "Assemble the bowl with rice, chicken, cucumber, and tomato.",
      "Top with a generous dollop of tzatziki sauce.",
    ],
  },
  {
    id: "tuna-salad-wrap",
    name: "Tuna Salad Wrap",
    mealType: ["lunch"],
    baseCalories: 450,
    imageUrl:
      "https://images.unsplash.com/photo-1625102137997-f43942358838?q=80&w=1974&auto=format&fit=crop",
    tags: ["tuna_can", "mayonnaise", "onion", "lettuce", "whole_wheat_wrap"],
    ingredients: [
      { ingredientId: "tuna_can", amount: 1, unit: "can" },
      { ingredientId: "mayonnaise", amount: 30, unit: "g" },
      { ingredientId: "onion", amount: 25, unit: "g" },
      { ingredientId: "lettuce", amount: 50, unit: "g" },
      { ingredientId: "whole_wheat_wrap", amount: 1, unit: "pcs" },
    ],
    instructions: [
      "Drain the canned tuna.",
      "Finely chop the red onion.",
      "In a bowl, mix tuna, mayonnaise, and onion. Season with salt and pepper.",
      "Lay the wrap flat, top with lettuce, then spoon the tuna salad on top.",
      "Roll the wrap tightly and serve.",
    ],
  },
  {
    id: "lentil-soup",
    name: "Hearty Lentil Soup",
    mealType: ["lunch", "dinner"],
    baseCalories: 480,
    imageUrl:
      "https://images.unsplash.com/photo-1608797178721-9a223c3b310a?q=80&w=1974&auto=format&fit=crop",
    tags: ["lentils", "carrot", "celery", "onion", "vegetable_broth"],
    ingredients: [
      { ingredientId: "lentils", amount: 100, unit: "g" },
      { ingredientId: "carrot", amount: 1, unit: "pcs" },
      { ingredientId: "celery", amount: 1, unit: "stalk" },
      { ingredientId: "onion", amount: 0.5, unit: "pcs" },
      { ingredientId: "vegetable_broth", amount: 500, unit: "ml" },
    ],
    instructions: [
      "Finely chop carrot, celery, and onion.",
      "In a large pot, sauté the vegetables until softened.",
      "Rinse the lentils and add them to the pot along with the vegetable broth.",
      "Bring to a boil, then reduce heat and simmer for 25-30 minutes, or until lentils are tender.",
      "Season to taste and serve hot.",
    ],
  },
  {
    id: "shrimp-stir-fry",
    name: "Garlic Shrimp & Veggie Stir-fry",
    mealType: ["lunch", "dinner"],
    baseCalories: 530,
    imageUrl:
      "https://images.unsplash.com/photo-1603208849635-61986423a8b8?q=80&w=1964&auto=format&fit=crop",
    tags: ["shrimp", "broccoli", "bell_pepper", "garlic"],
    ingredients: [
      { ingredientId: "shrimp", amount: 150, unit: "g" },
      { ingredientId: "broccoli", amount: 150, unit: "g" },
      { ingredientId: "bell_pepper", amount: 1, unit: "pcs" },
      { ingredientId: "garlic", amount: 2, unit: "cloves" },
      { ingredientId: "olive_oil", amount: 15, unit: "ml" },
    ],
    instructions: [
      "Chop broccoli and bell pepper. Mince the garlic.",
      "In a large pan or wok, heat olive oil over medium-high heat.",
      "Add garlic and cook for 30 seconds until fragrant.",
      "Add broccoli and bell pepper, stir-frying for 4-5 minutes.",
      "Add the shrimp and cook for another 2-3 minutes until pink and cooked through.",
      "Serve immediately, optionally over a bed of quinoa or brown rice.",
    ],
  },
  {
    id: "turkey-avocado-sandwich",
    name: "Turkey Avocado Sandwich",
    mealType: ["lunch"],
    baseCalories: 470,
    imageUrl:
      "https://images.unsplash.com/photo-1516257305296-2f054a78833a?q=80&w=1974&auto=format&fit=crop",
    tags: ["turkey_breast", "whole_wheat_bread", "avocado", "lettuce"],
    ingredients: [
      { ingredientId: "turkey_breast", amount: 100, unit: "g" },
      { ingredientId: "whole_wheat_bread", amount: 2, unit: "slices" },
      { ingredientId: "avocado", amount: 50, unit: "g" },
      { ingredientId: "lettuce", amount: 30, unit: "g" },
      { ingredientId: "tomato", amount: 0.5, unit: "pcs" },
    ],
    instructions: [
      "Toast the bread slices lightly.",
      "Mash the avocado and spread it on one slice of bread.",
      "Layer the lettuce, sliced tomato, and turkey breast on top.",
      "Close the sandwich with the second slice of bread and serve.",
    ],
  },
  {
    id: "pesto-cod-tomatoes",
    name: "Pesto Cod with Cherry Tomatoes",
    mealType: ["dinner"],
    baseCalories: 480,
    imageUrl:
      "https://images.unsplash.com/photo-1625944232252-74c1b9e98481?q=80&w=1974&auto=format&fit=crop",
    tags: ["cod_filet", "pesto", "cherry_tomatoes", "spinach"],
    ingredients: [
      { ingredientId: "cod_filet", amount: 180, unit: "g" },
      { ingredientId: "pesto", amount: 30, unit: "g" },
      { ingredientId: "cherry_tomatoes", amount: 150, unit: "g" },
      { ingredientId: "spinach", amount: 100, unit: "g" },
    ],
    instructions: [
      "Preheat oven to 190°C (375°F  ).",
      "Place the cod filet on a piece of parchment paper on a baking sheet.",
      "Spread the pesto evenly over the top of the cod.",
      "Scatter the cherry tomatoes around the filet.",
      "Bake for 15-20 minutes, or until the cod is flaky.",
      "Serve hot on a bed of fresh spinach.",
    ],
  },
];
