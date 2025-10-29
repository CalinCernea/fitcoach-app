// utils/advancedMealPlanner.js
import { foodComponents } from "./foodComponentDatabase";
import { mealTemplates } from "./mealTemplates";

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
  targetMealMacros
) {
  const meal = {
    name: template.name,
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
      // Țintim doar 85% din necesarul de proteine, lăsând loc pentru cele din alte surse
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

export function generateAdvancedMealPlan(profile) {
  const { targetCalories, targetProtein, targetCarbs, targetFats } = profile;
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

    const breakfastTemplate =
      mealTemplates.breakfast[
        Math.floor(Math.random() * mealTemplates.breakfast.length)
      ];
    const lunchTemplate =
      mealTemplates.lunch[
        Math.floor(Math.random() * mealTemplates.lunch.length)
      ];
    const dinnerTemplate =
      mealTemplates.dinner[
        Math.floor(Math.random() * mealTemplates.dinner.length)
      ];

    const breakfast = generateSingleMealCascade(
      breakfastTemplate,
      targetCalories * mealDistribution.breakfast,
      breakfastTargets
    );
    const lunch = generateSingleMealCascade(
      lunchTemplate,
      targetCalories * mealDistribution.lunch,
      lunchTargets
    );
    const dinner = generateSingleMealCascade(
      dinnerTemplate,
      targetCalories * mealDistribution.dinner,
      dinnerTargets
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
