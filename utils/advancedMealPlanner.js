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

export function generateAdvancedMealPlan(profile) {
  const {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    liked_foods = [],
    disliked_foods = [],
  } = profile;

  let bestPlan = null;
  let smallestDifference = Infinity;

  const isTemplateAllowed = (template) => {
    const components = Object.values(template.components);
    return !components.some((componentKey) =>
      disliked_foods.includes(componentKey)
    );
  };

  let filteredBreakfastTemplates =
    mealTemplates.breakfast.filter(isTemplateAllowed);
  let filteredLunchTemplates = mealTemplates.lunch.filter(isTemplateAllowed);
  let filteredDinnerTemplates = mealTemplates.dinner.filter(isTemplateAllowed);

  const sortByLikes = (a, b) => {
    const aLikes = Object.values(a.components).filter((c) =>
      liked_foods.includes(c)
    ).length;
    const bLikes = Object.values(b.components).filter((c) =>
      liked_foods.includes(c)
    ).length;
    return bLikes - aLikes;
  };

  filteredBreakfastTemplates.sort(sortByLikes);
  filteredLunchTemplates.sort(sortByLikes);
  filteredDinnerTemplates.sort(sortByLikes);

  if (filteredBreakfastTemplates.length === 0) {
    console.warn(
      "No breakfast templates left after filtering. Using all templates."
    );
    filteredBreakfastTemplates = [...mealTemplates.breakfast];
  }
  if (filteredLunchTemplates.length === 0) {
    console.warn(
      "No lunch templates left after filtering. Using all templates."
    );
    filteredLunchTemplates = [...mealTemplates.lunch];
  }
  if (filteredDinnerTemplates.length === 0) {
    console.warn(
      "No dinner templates left after filtering. Using all templates."
    );
    filteredDinnerTemplates = [...mealTemplates.dinner];
  }

  for (let i = 0; i < 20; i++) {
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

    const selectTemplate = (templates) => {
      const index = Math.floor(Math.pow(Math.random(), 2) * templates.length);
      return templates[index];
    };

    const breakfastTemplate = selectTemplate(filteredBreakfastTemplates);
    const lunchTemplate = selectTemplate(filteredLunchTemplates);
    const dinnerTemplate = selectTemplate(filteredDinnerTemplates);

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

export function regenerateSingleMeal(profile, mealType, oldMealTargets) {
  const {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    liked_foods = [],
    disliked_foods = [],
  } = profile;

  const isTemplateAllowed = (template) => {
    const components = Object.values(template.components);
    return !components.some((componentKey) =>
      disliked_foods.includes(componentKey)
    );
  };

  let availableTemplates =
    mealTemplates[mealType]?.filter(isTemplateAllowed) || [];

  if (availableTemplates.length === 0) {
    console.warn(
      `No templates for ${mealType} after filtering. Using all templates.`
    );
    availableTemplates = [...mealTemplates[mealType]];
  }

  const sortByLikes = (a, b) => {
    const aLikes = Object.values(a.components).filter((c) =>
      liked_foods.includes(c)
    ).length;
    const bLikes = Object.values(b.components).filter((c) =>
      liked_foods.includes(c)
    ).length;
    return bLikes - aLikes;
  };
  availableTemplates.sort(sortByLikes);

  const mealTemplate = availableTemplates[0]; // Alegem cel mai bun șablon

  const mealTargets = {
    p: oldMealTargets.protein,
    c: oldMealTargets.carbs,
    f: oldMealTargets.fats,
  };

  const newMeal = generateSingleMealCascade(
    mealTemplate,
    oldMealTargets.calories,
    mealTargets,
    mealType
  );

  return newMeal;
}
