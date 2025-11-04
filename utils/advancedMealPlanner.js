// utils/advancedMealPlanner.js
import { foodComponents } from "./foodComponentDatabase";
import { mealTemplates } from "./mealTemplates";

/* -------------------------------------------------------------------------- */
/*                            Funcții existente                               */
/* -------------------------------------------------------------------------- */
function addIngredientToMeal(meal, component, amountGrams) {
  if (!component || !amountGrams || amountGrams <= 5) return null;
  const ratio = amountGrams / 100;
  const nutrients = {
    calories: Math.round(component.calories * ratio),
    protein: Math.round(component.protein * ratio),
    carbs: Math.round(component.carbs * ratio),
    fats: Math.round(component.fats * ratio),
  };
  meal.ingredients.push({
    name: component.name,
    amount: Math.round(amountGrams),
    unit: component.unit,
    ...nutrients,
  });
  meal.total_calories += nutrients.calories;
  meal.total_protein += nutrients.protein;
  meal.total_carbs += nutrients.carbs;
  meal.total_fats += nutrients.fats;
  return nutrients;
}

function generateSingleMealCascade(
  template,
  targetMealCalories,
  targetMealMacros,
  mealType
) {
  const meal = {
    name: template.name,
    type: mealType,
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
    ingredients: [],
  };
  let remainingMacros = { ...targetMealMacros };

  const processIngredient = (componentKey, targetMacro, macroName) => {
    if (!componentKey || remainingMacros[macroName] <= 0) return;
    const component = foodComponents[componentKey];
    if (!component || component[targetMacro] === 0) return;

    let neededGrams;
    if (macroName === "p") {
      neededGrams = ((remainingMacros.p * 0.85) / component.protein) * 100;
    } else {
      neededGrams = (remainingMacros[macroName] / component[targetMacro]) * 100;
    }

    const addedNutrients = addIngredientToMeal(meal, component, neededGrams);
    if (addedNutrients) {
      remainingMacros.p -= addedNutrients.protein;
      remainingMacros.c -= addedNutrients.carbs;
      remainingMacros.f -= addedNutrients.fats;
    }
  };

  processIngredient(template.components.proteinSource, "protein", "p");
  processIngredient(template.components.carbSource, "carbs", "c");
  processIngredient(template.components.fatSource, "fats", "f");
  const vegKey = template.components.veg;
  if (vegKey) addIngredientToMeal(meal, foodComponents[vegKey], 150);

  return meal;
}

/* -------------------------------------------------------------------------- */
/*                    🔥 Integrare preferințe alimentare                      */
/* -------------------------------------------------------------------------- */

function filterMealTemplates(templates, liked_foods, disliked_foods) {
  const filtered = templates.filter((tpl) => {
    const comps = Object.values(tpl.components);
    return !comps.some((key) => disliked_foods.includes(key));
  });

  if (filtered.length === 0) return templates;

  const liked = filtered.filter((tpl) =>
    Object.values(tpl.components).some((key) => liked_foods.includes(key))
  );
  const normal = filtered.filter(
    (tpl) =>
      !Object.values(tpl.components).some((key) => liked_foods.includes(key))
  );

  return [...liked, ...normal];
}

/* -------------------------------------------------------------------------- */
/*                      Generare plan avansat cu preferințe                  */
/* -------------------------------------------------------------------------- */
export function generateAdvancedMealPlan(profile) {
  // 🔹 AICI ESTE PLASA DE SIGURANȚĂ 🔹
  const safeProfile = {
    ...profile,
    liked_foods: profile.liked_foods || [],
    disliked_foods: profile.disliked_foods || [],
  };

  const {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    liked_foods,
    disliked_foods,
  } = safeProfile; // Folosim profilul sigur

  let bestPlan = null;
  let smallestDifference = Infinity;

  for (let i = 0; i < 10; i++) {
    const mealDistribution = { breakfast: 0.3, lunch: 0.4, dinner: 0.3 };

    const breakfastTargets = {
      p: targetProtein * mealDistribution.breakfast,
      c: targetCarbs * mealDistribution.breakfast,
      f: targetFats * mealDistribution.breakfast,
    };
    const lunchTargets = {
      p: targetProtein * mealDistribution.lunch,
      c: targetCarbs * mealDistribution.lunch,
      f: targetFats * mealDistribution.lunch,
    };
    const dinnerTargets = {
      p: targetProtein * mealDistribution.dinner,
      c: targetCarbs * mealDistribution.dinner,
      f: targetFats * mealDistribution.dinner,
    };

    const breakfastTemplates = filterMealTemplates(
      mealTemplates.breakfast,
      liked_foods,
      disliked_foods
    );
    const lunchTemplates = filterMealTemplates(
      mealTemplates.lunch,
      liked_foods,
      disliked_foods
    );
    const dinnerTemplates = filterMealTemplates(
      mealTemplates.dinner,
      liked_foods,
      disliked_foods
    );

    const breakfastTemplate =
      breakfastTemplates[Math.floor(Math.random() * breakfastTemplates.length)];
    const lunchTemplate =
      lunchTemplates[Math.floor(Math.random() * lunchTemplates.length)];
    const dinnerTemplate =
      dinnerTemplates[Math.floor(Math.random() * dinnerTemplates.length)];

    const breakfast = generateSingleMealCascade(
      breakfastTemplate,
      targetCalories * mealDistribution.breakfast,
      breakfastTargets,
      "breakfast"
    );
    const lunch = generateSingleMealCascade(
      lunchTemplate,
      targetCalories * mealDistribution.lunch,
      lunchTargets,
      "lunch"
    );
    const dinner = generateSingleMealCascade(
      dinnerTemplate,
      targetCalories * mealDistribution.dinner,
      dinnerTargets,
      "dinner"
    );

    const currentPlan = [breakfast, lunch, dinner];
    const currentTotals = currentPlan.reduce(
      (acc, meal) => {
        acc.calories += meal.total_calories;
        acc.protein += meal.total_protein;
        acc.carbs += meal.total_carbs;
        acc.fats += meal.total_fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const difference = Math.abs(targetCalories - currentTotals.calories);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      bestPlan = { plan: currentPlan, totals: currentTotals, error: null };
    }
  }
  return bestPlan;
}

/* -------------------------------------------------------------------------- */
/*             Regenerare individuală a unei mese cu preferințe              */
/* -------------------------------------------------------------------------- */
export function regenerateSingleMeal(profile, mealType) {
  // 🔹 AICI ESTE PLASA DE SIGURANȚĂ 🔹
  const safeProfile = {
    ...profile,
    liked_foods: profile.liked_foods || [],
    disliked_foods: profile.disliked_foods || [],
  };

  const {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    liked_foods,
    disliked_foods,
  } = safeProfile; // Folosim profilul sigur

  if (
    !targetCalories ||
    !mealTemplates[mealType] ||
    mealTemplates[mealType].length === 0
  ) {
    console.error(
      "Cannot regenerate meal: No templates found for type " + mealType
    );
    return null;
  }

  const mealDistribution = { breakfast: 0.3, lunch: 0.4, dinner: 0.3 };
  const distributionRatio = mealDistribution[mealType] || 0.33;

  const mealTargets = {
    p: targetProtein * distributionRatio,
    c: targetCarbs * distributionRatio,
    f: targetFats * distributionRatio,
  };

  const filteredTemplates = filterMealTemplates(
    mealTemplates[mealType],
    liked_foods,
    disliked_foods
  );
  const mealTemplate =
    filteredTemplates[Math.floor(Math.random() * filteredTemplates.length)];

  const newMeal = generateSingleMealCascade(
    mealTemplate,
    targetCalories * distributionRatio,
    mealTargets,
    mealType
  );

  return newMeal;
}
