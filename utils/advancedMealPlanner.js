// utils/advancedMealPlanner.js
import { ingredients as allIngredients, recipes } from "./recipeDatabase";

/**
 * Verifică dacă un ingredient este în lista de componente pregătite
 */
function isIngredientPrepped(ingredientId, preppedComponents) {
  if (!preppedComponents || preppedComponents.length === 0) return false;

  return preppedComponents.some((group) =>
    group.items.some((item) => item.id === ingredientId)
  );
}

/**
 * Generează instrucțiuni adaptate pentru prep mode
 */
function generatePrepModeInstructions(recipe, preppedComponents) {
  const preppedIngredients = recipe.ingredients.filter((ing) =>
    isIngredientPrepped(ing.ingredientId, preppedComponents)
  );

  const freshIngredients = recipe.ingredients.filter(
    (ing) => !isIngredientPrepped(ing.ingredientId, preppedComponents)
  );

  const instructions = [];

  // Instrucțiuni pentru ingrediente fresh
  if (freshIngredients.length > 0) {
    const freshNames = freshIngredients
      .map((ing) => allIngredients[ing.ingredientId]?.name)
      .filter(Boolean);

    if (freshNames.length > 0) {
      instructions.push(
        `Prepare the fresh ingredients: ${freshNames.join(", ")}.`
      );
    }
  }

  // Instrucțiuni pentru ingrediente pregătite
  if (preppedIngredients.length > 0) {
    const preppedNames = preppedIngredients
      .map((ing) => allIngredients[ing.ingredientId]?.name)
      .filter(Boolean);

    if (preppedNames.length > 0) {
      instructions.push(
        `Take your prepped ingredients from the fridge: ${preppedNames.join(
          ", "
        )}.`
      );
    }
  }

  // Instrucțiune de asamblare
  instructions.push(
    `Assemble the ${recipe.name}: combine all ingredients as needed.`
  );

  // Dacă e necesar să se încălzească
  if (
    preppedIngredients.some((ing) => {
      const ingredientInfo = allIngredients[ing.ingredientId];
      return (
        ingredientInfo?.prepInfo?.prepGroup === "Cooked Proteins" ||
        ingredientInfo?.prepInfo?.prepGroup === "Boiled Grains"
      );
    })
  ) {
    instructions.push(
      "Reheat the prepped components if desired (microwave 1-2 minutes or stovetop)."
    );
  }

  instructions.push("Serve and enjoy your meal!");

  return instructions;
}

/**
 * Categorizes ingredients into prepped vs fresh
 */
function categorizeIngredients(recipe, preppedComponents) {
  const categorized = {
    prepped: [],
    fresh: [],
  };

  recipe.ingredients.forEach((ing) => {
    const ingredientInfo = allIngredients[ing.ingredientId];
    const isPrepped = isIngredientPrepped(ing.ingredientId, preppedComponents);

    const ingredientData = {
      name: ingredientInfo.name,
      amount: ing.amount,
      unit: ing.unit,
      isPrepped: isPrepped,
    };

    if (isPrepped) {
      categorized.prepped.push(ingredientData);
    } else {
      categorized.fresh.push(ingredientData);
    }
  });

  return categorized;
}

/**
 * Creează o masă scalată dintr-o rețetă de bază pentru a atinge ținta calorică.
 * MODIFICAT: Acceptă și preppedComponents pentru a genera instrucțiuni adaptate.
 */
function createMealFromRecipe(
  recipe,
  targetCalories,
  mealType,
  profile = null,
  preppedComponents = null
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
      categorizedIngredients: { prepped: [], fresh: [] },
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
    categorizedIngredients: { prepped: [], fresh: [] },
  };

  // Scale ingredients
  const scaledRecipe = {
    ...recipe,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      amount: Math.round(ing.amount * scalingFactor),
    })),
  };

  scaledRecipe.ingredients.forEach((ing) => {
    if (ing.amount > 0) {
      const ingredientInfo = allIngredients[ing.ingredientId];
      scaledMeal.ingredients.push({
        name: ingredientInfo.name,
        amount: ing.amount,
        unit: ing.unit,
      });
    }
  });

  // Dacă avem componente pregătite, generăm instrucțiuni adaptate
  if (preppedComponents && preppedComponents.length > 0) {
    scaledMeal.instructions = generatePrepModeInstructions(
      scaledRecipe,
      preppedComponents
    );
    scaledMeal.categorizedIngredients = categorizeIngredients(
      scaledRecipe,
      preppedComponents
    );
    scaledMeal.isPrepMode = true;
  } else {
    scaledMeal.isPrepMode = false;
  }

  // Calculăm caloriile scalate
  const variation = () => 0.98 + Math.random() * 0.04; // O variație mai mică, de +/- 2%
  scaledMeal.total_calories = Math.round(
    recipe.baseCalories * scalingFactor * variation()
  );

  // Calculăm macronutrienții
  if (
    profile &&
    profile.targetProtein &&
    profile.targetCarbs &&
    profile.targetFats
  ) {
    const mealDistribution = { breakfast: 0.3, lunch: 0.4, dinner: 0.3 };
    const ratio = mealDistribution[mealType] || 0.33;
    const variation = () => 0.9 + Math.random() * 0.2;

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
  let potentialRecipes = recipes.filter(
    (r) =>
      r.mealType.includes(mealType) &&
      !r.tags.some((tag) => disliked_foods.includes(tag)) &&
      !excludeIds.includes(r.id)
  );

  if (potentialRecipes.length === 0) {
    potentialRecipes = recipes.filter(
      (r) =>
        r.mealType.includes(mealType) &&
        !r.tags.some((tag) => disliked_foods.includes(tag))
    );

    if (potentialRecipes.length === 0) {
      potentialRecipes = recipes.filter(
        (r) => r.mealType.includes(mealType) && !excludeIds.includes(r.id)
      );

      if (potentialRecipes.length === 0) {
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

export function generateAdvancedMealPlan(profile, preppedComponents = null) {
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
    safeProfile,
    preppedComponents
  );
  const lunch = createMealFromRecipe(
    lunchRecipe,
    lunchCalories,
    "lunch",
    safeProfile,
    preppedComponents
  );
  const dinner = createMealFromRecipe(
    dinnerRecipe,
    dinnerCalories,
    "dinner",
    safeProfile,
    preppedComponents
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

export function regenerateSingleMeal(
  profile,
  mealType,
  oldMeal,
  preppedComponents = null
) {
  const safeProfile = {
    ...profile,
    liked_foods: profile.liked_foods || [],
    disliked_foods: profile.disliked_foods || [],
  };

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
    safeProfile,
    preppedComponents
  );

  return newMeal;
}

// Funcție helper pentru a obține alternative de mese
export function getMealAlternatives(
  profile,
  mealType,
  currentMeal,
  preppedComponents = null
) {
  const safeProfile = {
    ...profile,
    liked_foods: profile.liked_foods || [],
    disliked_foods: profile.disliked_foods || [],
  };

  const { liked_foods, disliked_foods } = safeProfile;

  // --- PASUL 1: Definirea țintelor și a toleranțelor ---
  // Folosim masa curentă ca punct de referință pentru calorii și macro-uri.
  const targetCalories = currentMeal.total_calories;
  const targetProtein = currentMeal.total_protein;

  // Definim praguri de toleranță stricte. Acestea pot fi ajustate.
  const CALORIE_TOLERANCE = 75; // +/- 75 kcal
  const PROTEIN_TOLERANCE = 10; // +/- 10g

  // --- PASUL 2: Găsirea și crearea meselor candidate ---
  // Găsim toate rețetele posibile, fără a le scala încă.
  const candidateRecipes = recipes.filter(
    (r) =>
      r.mealType.includes(mealType) &&
      r.id !== currentMeal?.id &&
      !r.tags.some((tag) => disliked_foods.includes(tag))
  );

  // Creăm mesele scalate pe baza caloriilor țintă ale mesei ORIGINALE.
  // Acest lucru asigură că toate alternativele sunt comparabile.
  const candidateMeals = candidateRecipes.map((recipe) =>
    createMealFromRecipe(
      recipe,
      targetCalories, // Scalăm toate alternativele la caloriile mesei curente
      mealType,
      safeProfile,
      preppedComponents
    )
  );

  // --- PASUL 3: Filtrarea strictă a alternativelor ---
  const suitableAlternatives = candidateMeals.filter((alt) => {
    const calorieDiff = Math.abs(alt.total_calories - targetCalories);
    const proteinDiff = Math.abs(alt.total_protein - targetProtein);

    // Verificăm dacă alternativa se încadrează în ambele praguri
    return calorieDiff <= CALORIE_TOLERANCE && proteinDiff <= PROTEIN_TOLERANCE;
  });

  // --- PASUL 4: Sortarea inteligentă a rezultatelor ---
  // Sortăm alternativele rămase pe baza "potrivirii" lor.
  // O valoare mai mică înseamnă o potrivire mai bună.
  suitableAlternatives.sort((a, b) => {
    const scoreA =
      Math.abs(a.total_calories - targetCalories) +
      Math.abs(a.total_protein - targetProtein) * 2; // Dăm o importanță dublă proteinelor

    const scoreB =
      Math.abs(b.total_calories - targetCalories) +
      Math.abs(b.total_protein - targetProtein) * 2;

    return scoreA - scoreB;
  });

  // --- PASUL 5: Returnarea celor mai bune 4-6 alternative ---
  // Returnăm un număr rezonabil de opțiuni de înaltă calitate.
  return suitableAlternatives.slice(0, 6);
}
