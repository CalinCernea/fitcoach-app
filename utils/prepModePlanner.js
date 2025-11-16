// utils/prepModePlanner.js

import { ingredients as allIngredients } from "./recipeDatabase.js";

/**
 * Analizează planurile de masă pentru mai multe zile și generează o listă de componente
 * care pot fi pregătite în avans (meal prep).
 */
export function generatePrepList(dailyPlans) {
  console.log("🔍 generatePrepList called with:", dailyPlans);

  const aggregatedComponents = {};

  for (const plan of dailyPlans) {
    if (!plan || !plan.plan_data || !plan.plan_data.plan) {
      console.warn("⚠️ Invalid plan structure:", plan);
      continue;
    }

    console.log("📅 Processing plan for date:", plan.plan_date);

    for (const meal of plan.plan_data.plan) {
      if (!meal.ingredients) {
        console.warn("⚠️ Meal has no ingredients:", meal.name);
        continue;
      }

      console.log(
        `🍽️ Processing meal: ${meal.name} with ${meal.ingredients.length} ingredients`
      );

      for (const ingredient of meal.ingredients) {
        // Căutăm ingredientul în dicționarul nostru
        // Încercăm mai multe variante de matching
        let ingredientId = null;
        let ingredientInfo = null;

        // Varianta 1: Căutăm exact după nume
        const exactMatch = Object.entries(allIngredients).find(
          ([id, info]) =>
            info.name.toLowerCase() === ingredient.name.toLowerCase()
        );

        if (exactMatch) {
          ingredientId = exactMatch[0];
          ingredientInfo = exactMatch[1];
        } else {
          // Varianta 2: Căutăm parțial (ex: "Chicken Breast" conține "Chicken")
          const partialMatch = Object.entries(allIngredients).find(
            ([id, info]) =>
              info.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
              ingredient.name.toLowerCase().includes(info.name.toLowerCase())
          );

          if (partialMatch) {
            ingredientId = partialMatch[0];
            ingredientInfo = partialMatch[1];
          }
        }

        if (!ingredientInfo) {
          console.warn(
            `❌ Ingredient not found in database: "${ingredient.name}"`
          );
          continue;
        }

        console.log(
          `✅ Found ingredient: ${ingredientInfo.name} (ID: ${ingredientId})`
        );

        // Verificăm dacă poate fi pregătit
        if (ingredientInfo.prepInfo && ingredientInfo.prepInfo.canPrep) {
          const prepGroup = ingredientInfo.prepInfo.prepGroup;
          const amount = Number(ingredient.amount) || 0;

          console.log(
            `📦 Can prep: ${ingredientInfo.name} - ${amount}${ingredient.unit} (Group: ${prepGroup})`
          );

          if (!aggregatedComponents[prepGroup]) {
            aggregatedComponents[prepGroup] = {};
          }

          if (!aggregatedComponents[prepGroup][ingredientId]) {
            aggregatedComponents[prepGroup][ingredientId] = 0;
          }

          aggregatedComponents[prepGroup][ingredientId] += amount;
        } else {
          console.log(
            `⏭️ Cannot prep (fresh ingredient): ${ingredientInfo.name}`
          );
        }
      }
    }
  }

  console.log("📊 Aggregated components:", aggregatedComponents);

  // Transformăm în format pentru UI
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

  console.log("✨ Final prep list:", prepList);

  return prepList;
}

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

  // --- MODIFICARE 1: Adăugăm ingredientIds la pașii generici ---
  if (ovenUsed) {
    steps.push({
      id: "step_preheat",
      text: "Preheat your oven to 200°C (400°F).",
      ingredientIds: [], // Pas generic, fără ingrediente
    });
  }
  steps.push({
    id: "step_wash",
    text: "Wash all vegetables and rinse grains/legumes.",
    // Evidențiem toate legumele, grânele și leguminoasele
    ingredientIds: allItems
      .filter(
        (item) =>
          item.groupName.includes("Veggies") ||
          item.groupName.includes("Grains") ||
          item.groupName.includes("Legumes")
      )
      .map((item) => item.id),
  });

  // --- MODIFICARE 2: Adăugăm ingredientIds la pașii specifici și grupați ---
  allItems.forEach((item) => {
    if (
      item.groupName === "Chopped Aromatics" ||
      item.groupName === "Chopped Veggies"
    ) {
      if (!steps.some((s) => s.id === "step_chop_all")) {
        const itemsToChop = allItems.filter(
          (i) =>
            i.groupName === "Chopped Aromatics" ||
            i.groupName === "Chopped Veggies"
        );
        steps.push({
          id: "step_chop_all",
          text: `Chop all aromatics and vegetables: ${itemsToChop
            .map((i) => i.name)
            .join(", ")}.`,
          ingredientIds: itemsToChop.map((i) => i.id), // Adăugăm ID-urile tuturor legumelor de tăiat
        });
      }
      return; // Trecem la următorul item pentru a nu adăuga pași duplicați
    }

    // Pas individual pentru fiecare alt item
    steps.push({
      id: `step_${item.id}`,
      text: `${item.method} ${item.totalAmount}${item.unit || ""} of ${
        item.name
      }.`,
      ingredientIds: [item.id], // Adăugăm ID-ul ingredientului curent
    });
  });

  // --- MODIFICARE 3: Adăugăm ingredientIds la pasul final ---
  steps.push({
    id: "step_cool",
    text: "Let all cooked components cool down before storing them in separate containers in the fridge.",
    ingredientIds: allItems.map((item) => item.id), // Evidențiem toate ingredientele
  });

  const uniqueSteps = Array.from(
    new Map(steps.map((step) => [step.id, step])).values()
  );

  return uniqueSteps;
}
