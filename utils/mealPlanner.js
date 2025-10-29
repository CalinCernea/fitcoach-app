// utils/mealPlanner.js
import { mealDatabase } from "./mealDatabase";

// Funcție ajutătoare pentru a alege un element aleatoriu dintr-un array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateMealPlan(profile) {
  const {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    dietaryPreferences,
  } = profile;

  // 1. Filtrează mesele conform restricțiilor
  let availableMeals = mealDatabase;
  if (dietaryPreferences === "vegan") {
    availableMeals = mealDatabase.filter((meal) => meal.tags.includes("vegan"));
  } else if (dietaryPreferences === "vegetarian") {
    availableMeals = mealDatabase.filter((meal) =>
      meal.tags.includes("vegetarian")
    );
  } // Adaugă alte filtre aici

  const breakfastOptions = availableMeals.filter((m) => m.type === "breakfast");
  const lunchOptions = availableMeals.filter((m) => m.type === "lunch");
  const dinnerOptions = availableMeals.filter((m) => m.type === "dinner");
  const snackOptions = availableMeals.filter((m) => m.type === "snack");

  if (
    breakfastOptions.length === 0 ||
    lunchOptions.length === 0 ||
    dinnerOptions.length === 0
  ) {
    return {
      plan: [],
      totals: {},
      error: "Not enough main meal options for your diet.",
    };
  }

  // --- NOUL ALGORITM ITERATIV ---

  // PASUL A: Alege mesele principale (fundația)
  let mealPlan = [
    getRandom(breakfastOptions),
    getRandom(lunchOptions),
    getRandom(dinnerOptions),
  ];

  // Calculează totalurile curente
  let currentTotals = calculateTotals(mealPlan);

  // PASUL B: Ajustarea fină cu gustări
  // Calculează diferența de calorii și adaugă gustări pentru a umple golul
  const calorieDifference = targetCalories - currentTotals.calories;

  if (calorieDifference > 50 && snackOptions.length > 0) {
    // Adăugăm gustări doar dacă diferența e semnificativă
    mealPlan = addSnacks(mealPlan, snackOptions, calorieDifference);
  }

  // Recalculează totalurile finale după adăugarea gustărilor
  const finalTotals = calculateTotals(mealPlan);

  // Sortează planul pentru afișare (mic dejun, prânz, cină, gustări)
  const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
  mealPlan.sort((a, b) => mealOrder[a.type] - mealOrder[b.type]);

  return {
    plan: mealPlan,
    totals: finalTotals,
    error: null,
  };
}

// Funcție ajutătoare pentru a calcula totalurile unui plan
function calculateTotals(plan) {
  return plan.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fats += meal.fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

// Funcție ajutătoare pentru a adăuga gustări
function addSnacks(currentPlan, snackOptions, neededCalories) {
  let caloriesToFill = neededCalories;
  const newPlan = [...currentPlan];

  // Sortează gustările de la cea mai mare la cea mai mică pentru eficiență
  snackOptions.sort((a, b) => b.calories - a.calories);

  // Adaugă gustări până când ne apropiem de țintă
  while (caloriesToFill > 75 && snackOptions.length > 0) {
    // 75 = marja de eroare
    // Găsește cea mai potrivită gustare (care nu depășește cu mult necesarul)
    let bestSnack = snackOptions.find(
      (snack) => snack.calories <= caloriesToFill
    );

    if (!bestSnack) {
      // Dacă toate gustările sunt prea mari, ieșim din buclă
      break;
    }

    newPlan.push(bestSnack);
    caloriesToFill -= bestSnack.calories;
  }

  return newPlan;
}
