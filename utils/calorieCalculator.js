// utils/calorieCalculator.js

export const calculateAdvancedMetrics = (data) => {
  // Gardă de siguranță pentru a preveni erorile
  if (
    !data ||
    !data.sex ||
    !data.weight ||
    !data.height ||
    !data.dob ||
    !data.activity ||
    !data.goal ||
    data.weeklyTarget === undefined
  ) {
    console.error("Calculation error: Missing required user data.", data);
    // Returnează un obiect cu valori nule sau zero pentru a nu crăpa UI-ul
    return {
      tdee: 0,
      targetCalories: 0,
      targetProtein: 0,
      targetCarbs: 0,
      targetFats: 0,
    };
  }

  const { sex, weight, height, dob, activity, goal, weeklyTarget } = data;

  const age = new Date().getFullYear() - new Date(dob).getFullYear();

  let bmr;
  if (sex === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * (activityMultipliers[activity] || 1.2);

  const weeklyCaloricChange = weeklyTarget * 7700;
  const dailyCaloricChange = weeklyCaloricChange / 7;

  let targetCalories;
  if (goal.includes("lose") || goal.includes("leaner")) {
    targetCalories = tdee - dailyCaloricChange;
  } else if (goal.includes("gain")) {
    targetCalories = tdee + dailyCaloricChange;
  } else {
    targetCalories = tdee;
  }

  const proteinGrams = weight * 1.8;
  const proteinCalories = proteinGrams * 4;
  const fatCalories = targetCalories * 0.25;
  const fatGrams = fatCalories / 9;
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = carbCalories / 4;

  return {
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    targetProtein: Math.round(proteinGrams),
    targetCarbs: Math.round(carbsGrams),
    targetFats: Math.round(fatGrams),
  };
};
