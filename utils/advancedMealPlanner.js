// utils/advancedMealPlanner.js
import { ingredients as allIngredients, recipes } from "./recipeDatabase";

/**
 * Creează o masă scalată dintr-o rețetă de bază pentru a atinge ținta calorică.
 * Valorile nutriționale sunt calculate pe baza rețetei și a scalării.
 */
function createMealFromRecipe(
  recipe,
  targetCalories,
  mealType,
  profile = null
) {
  if (!recipe) {
    return {
      id: "error-meal",
      name: "Error: No Recipe Found",
      type: mealType,
      imageUrl: "",
      instructions: [],
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fats: 0,
      ingredients: [],
    };
  }

  const scalingFactor =
    recipe.baseCalories > 0 ? targetCalories / recipe.baseCalories : 1;

  const scaledMeal = {
    id: recipe.id,
    name: recipe.name,
    type: mealType,
    imageUrl: recipe.imageUrl,
    instructions: recipe.instructions,
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
    ingredients: [],
  };

  recipe.ingredients.forEach((ing) => {
    const scaledAmount = Math.round(ing.amount * scalingFactor);
    if (scaledAmount > 0) {
      const ingredientInfo = allIngredients[ing.ingredientId];
      scaledMeal.ingredients.push({
        name: ingredientInfo.name,
        amount: scaledAmount,
        unit: ing.unit,
      });
    }
  });

  // Calculăm caloriile scalate
  scaledMeal.total_calories = Math.round(recipe.baseCalories * scalingFactor);

  // Calculăm macronutrienții pe baza rețetei și profilului
  if (
    profile &&
    profile.targetProtein &&
    profile.targetCarbs &&
    profile.targetFats
  ) {
    // Calculăm distribuția pe baza tipului de masă
    const mealDistribution = { breakfast: 0.3, lunch: 0.4, dinner: 0.3 };
    const ratio = mealDistribution[mealType] || 0.33;

    // Adăugăm variație aleatorie de ±10% pentru fiecare macronutrient
    const variation = () => 0.9 + Math.random() * 0.2; // între 0.9 și 1.1

    scaledMeal.total_protein = Math.round(
      profile.targetProtein * ratio * variation()
    );
    scaledMeal.total_carbs = Math.round(
      profile.targetCarbs * ratio * variation()
    );
    scaledMeal.total_fats = Math.round(
      profile.targetFats * ratio * variation()
    );
  } else {
    // Fallback: calculăm pe baza caloriilor cu variație
    const variation = () => 0.9 + Math.random() * 0.2;
    scaledMeal.total_carbs = Math.round(
      (scaledMeal.total_calories * 0.45 * variation()) / 4
    );
    scaledMeal.total_protein = Math.round(
      (scaledMeal.total_calories * 0.3 * variation()) / 4
    );
    scaledMeal.total_fats = Math.round(
      (scaledMeal.total_calories * 0.25 * variation()) / 9
    );
  }

  return scaledMeal;
}

/**
 * Filtrează și selectează o rețetă pe baza preferințelor utilizatorului.
 */
function selectRecipe(
  mealType,
  liked_foods = [],
  disliked_foods = [],
  excludeIds = []
) {
  console.log("🔍 selectRecipe called:", {
    mealType,
    liked_foods,
    disliked_foods,
  });

  let potentialRecipes = recipes.filter(
    (r) =>
      r.mealType.includes(mealType) &&
      !r.tags.some((tag) => disliked_foods.includes(tag)) &&
      !excludeIds.includes(r.id)
  );

  console.log(
    "📋 Filtered recipes:",
    potentialRecipes.map((r) => ({ id: r.id, tags: r.tags }))
  );

  if (potentialRecipes.length === 0) {
    console.warn(
      "⚠️ No recipes found matching preferences. Trying without excludeIds..."
    );
    // Fallback 1: Reîncercăm fără excludeIds (permite re-selectarea aceluiași meal)
    potentialRecipes = recipes.filter(
      (r) =>
        r.mealType.includes(mealType) &&
        !r.tags.some((tag) => disliked_foods.includes(tag))
    );

    if (potentialRecipes.length === 0) {
      console.warn(
        "⚠️ Still no recipes without disliked foods. Trying only with mealType..."
      );
      // Fallback 2: Ignorăm excludeIds dar păstrăm disliked
      potentialRecipes = recipes.filter(
        (r) => r.mealType.includes(mealType) && !excludeIds.includes(r.id)
      );

      if (potentialRecipes.length === 0) {
        console.warn(
          "⚠️ Last resort: returning all recipes for this meal type."
        );
        // Fallback 3: Ultimul resort - toate rețetele pentru acest tip de masă
        potentialRecipes = recipes.filter((r) => r.mealType.includes(mealType));
      }
    }
  }

  const likedRecipes = potentialRecipes.filter((r) =>
    r.tags.some((tag) => liked_foods.includes(tag))
  );

  let chosenRecipe;
  if (likedRecipes.length > 0 && Math.random() > 0.3) {
    chosenRecipe =
      likedRecipes[Math.floor(Math.random() * likedRecipes.length)];
  } else {
    chosenRecipe =
      potentialRecipes[Math.floor(Math.random() * potentialRecipes.length)];
  }

  return chosenRecipe;
}

/* -------------------------------------------------------------------------- */
/*                      Funcții Exportate                                     */
/* -------------------------------------------------------------------------- */

export function generateAdvancedMealPlan(profile) {
  const safeProfile = {
    ...profile,
    liked_foods: profile.liked_foods || [],
    disliked_foods: profile.disliked_foods || [],
  };

  const { targetCalories, liked_foods, disliked_foods } = safeProfile;
  if (!targetCalories) return null;

  const mealDistribution = { breakfast: 0.3, lunch: 0.4, dinner: 0.3 };

  const breakfastRecipe = selectRecipe(
    "breakfast",
    liked_foods,
    disliked_foods
  );
  const lunchRecipe = selectRecipe(
    "lunch",
    liked_foods,
    disliked_foods,
    [breakfastRecipe?.id].filter(Boolean)
  );
  const dinnerRecipe = selectRecipe(
    "dinner",
    liked_foods,
    disliked_foods,
    [breakfastRecipe?.id, lunchRecipe?.id].filter(Boolean)
  );

  const breakfastCalories = targetCalories * mealDistribution.breakfast;
  const lunchCalories = targetCalories * mealDistribution.lunch;
  const dinnerCalories = targetCalories * mealDistribution.dinner;

  const breakfast = createMealFromRecipe(
    breakfastRecipe,
    breakfastCalories,
    "breakfast",
    safeProfile
  );
  const lunch = createMealFromRecipe(
    lunchRecipe,
    lunchCalories,
    "lunch",
    safeProfile
  );
  const dinner = createMealFromRecipe(
    dinnerRecipe,
    dinnerCalories,
    "dinner",
    safeProfile
  );

  const plan = [breakfast, lunch, dinner];
  const totals = plan.reduce(
    (acc, meal) => {
      acc.calories += meal.total_calories;
      acc.protein += meal.total_protein;
      acc.carbs += meal.total_carbs;
      acc.fats += meal.total_fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return { plan, totals, error: null };
}

export function regenerateSingleMeal(profile, mealType, oldMeal) {
  const safeProfile = {
    ...profile,
    liked_foods: profile.liked_foods || [],
    disliked_foods: profile.disliked_foods || [],
  };

  console.log("🔄 regenerateSingleMeal called:", {
    mealType,
    oldMealId: oldMeal?.id,
    liked: safeProfile.liked_foods,
    disliked: safeProfile.disliked_foods,
  });

  const { targetCalories, liked_foods, disliked_foods } = safeProfile;

  if (!targetCalories) {
    console.error(
      "Cannot regenerate meal: Missing target calories from profile."
    );
    return null;
  }

  const mealDistribution = { breakfast: 0.3, lunch: 0.4, dinner: 0.3 };
  const distributionRatio = mealDistribution[mealType] || 0.33;
  const mealTargetCalories = targetCalories * distributionRatio;

  const newRecipe = selectRecipe(
    mealType,
    liked_foods,
    disliked_foods,
    [oldMeal?.id].filter(Boolean)
  );

  const newMeal = createMealFromRecipe(
    newRecipe,
    mealTargetCalories,
    mealType,
    safeProfile // Pasăm întregul profil
  );

  console.log("✅ Meal regenerated:", {
    old: {
      id: oldMeal?.id,
      cal: oldMeal?.total_calories,
      protein: oldMeal?.total_protein,
    },
    new: {
      id: newMeal.id,
      cal: newMeal.total_calories,
      protein: newMeal.total_protein,
    },
  });

  return newMeal;
}
