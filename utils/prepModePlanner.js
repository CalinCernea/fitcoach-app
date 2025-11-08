// utils/prepModePlanner.js

import { ingredients as allIngredients } from "./recipeDatabase.js";

// --- NOU: Creăm un dicționar invers pentru a găsi ID-ul pe baza numelui ---
// Acest obiect va arăta așa: { "Chicken Breast": "chicken_breast", "Quinoa": "quinoa", ... }
const nameToIdMap = Object.fromEntries(
  Object.entries(allIngredients).map(([id, data]) => [data.name, id])
);

/**
 * Analizează planurile de masă pentru mai multe zile și generează o listă de componente
 * care pot fi pregătite în avans (meal prep).
 */
export function generatePrepList(dailyPlans) {
  const aggregatedComponents = {};

  for (const plan of dailyPlans) {
    if (!plan || !plan.plan_data || !plan.plan_data.plan) {
      continue;
    }

    for (const meal of plan.plan_data.plan) {
      if (!meal.ingredients) {
        continue;
      }

      for (const ingredient of meal.ingredients) {
        // --- MODIFICAT: Folosim dicționarul invers pentru a găsi ID-ul corect ---
        const ingredientId = nameToIdMap[ingredient.name];
        const ingredientInfo = ingredientId
          ? allIngredients[ingredientId]
          : null;

        if (
          ingredientInfo &&
          ingredientInfo.prepInfo &&
          ingredientInfo.prepInfo.canPrep
        ) {
          const prepGroup = ingredientInfo.prepInfo.prepGroup;
          const amount = Number(ingredient.amount) || 0;

          if (!aggregatedComponents[prepGroup]) {
            aggregatedComponents[prepGroup] = {};
          }

          if (!aggregatedComponents[prepGroup][ingredientId]) {
            aggregatedComponents[prepGroup][ingredientId] = 0;
          }

          aggregatedComponents[prepGroup][ingredientId] += amount;
        }
      }
    }
  }

  // Restul funcției rămâne neschimbat
  const prepList = Object.entries(aggregatedComponents).map(
    ([groupName, ingredients]) => {
      return {
        groupName: groupName,
        items: Object.entries(ingredients).map(
          ([ingredientId, totalAmount]) => {
            const ingredientInfo = allIngredients[ingredientId];
            return {
              id: ingredientId,
              name: ingredientInfo.name,
              totalAmount: Math.round(totalAmount),
              unit: ingredientInfo.unit || "g",
              method: ingredientInfo.prepInfo.method,
            };
          }
        ),
      };
    }
  );

  return prepList;
}

// --- Funcția generatePrepSteps rămâne neschimbată ---
const prepGroupPriorities = {
  "Chopped Aromatics": 1,
  "Chopped Veggies": 2,
  "Boiled Grains": 3,
  "Boiled Legumes": 3,
  "Boiled Eggs": 3,
  "Cooked Veggies": 4,
  "Cooked Proteins": 5,
};

export function generatePrepSteps(prepComponents) {
  const steps = [];
  let ovenUsed = false;

  const allItems = prepComponents
    .flatMap((group) =>
      group.items.map((item) => ({ ...item, groupName: group.groupName }))
    )
    .sort((a, b) => {
      const priorityA = prepGroupPriorities[a.groupName] || 99;
      const priorityB = prepGroupPriorities[b.groupName] || 99;
      return priorityA - priorityB;
    });

  if (
    allItems.some(
      (item) =>
        item.method.toLowerCase().includes("oven") ||
        item.method.toLowerCase().includes("bake") ||
        item.method.toLowerCase().includes("roast")
    )
  ) {
    ovenUsed = true;
  }

  if (ovenUsed) {
    steps.push({
      id: "step_preheat",
      text: "Preheat your oven to 200°C (400°F).",
    });
  }
  steps.push({
    id: "step_wash",
    text: "Wash all vegetables and rinse grains/legumes.",
  });

  allItems.forEach((item) => {
    if (
      item.groupName === "Chopped Aromatics" ||
      item.groupName === "Chopped Veggies"
    ) {
      if (!steps.some((s) => s.id === "step_chop_all")) {
        steps.push({
          id: "step_chop_all",
          text: "Chop all aromatics (onions, garlic) and vegetables (carrots, celery, etc.).",
        });
      }
      return;
    }

    steps.push({
      id: `step_${item.id}`,
      text: `${item.method} ${item.totalAmount}${item.unit || ""} of ${
        item.name
      }.`,
    });
  });

  steps.push({
    id: "step_cool",
    text: "Let all cooked components cool down before storing them in separate containers in the fridge.",
  });

  const uniqueSteps = Array.from(
    new Map(steps.map((step) => [step.id, step])).values()
  );

  return uniqueSteps;
}
