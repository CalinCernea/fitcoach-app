// app/(app)/dashboard/page.jsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import {
  generateAdvancedMealPlan,
  regenerateSingleMeal,
  getMealAlternatives,
} from "@/utils/advancedMealPlanner";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LogOut,
  RefreshCw,
  UtensilsCrossed,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Beef,
  Wheat,
  Droplets,
  ShoppingCart,
  BookOpen,
  ChefHat,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Helper Functions
const getFormattedDate = (date) => date.toISOString().split("T")[0];
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const generateShoppingList = (dailyPlans) => {
  const aggregatedIngredients = {};
  if (!dailyPlans || dailyPlans.length === 0) return {};
  dailyPlans.forEach((planWrapper) => {
    const planData = planWrapper.plan_data;
    if (planData && planData.plan) {
      planData.plan.forEach((meal) => {
        if (meal.ingredients) {
          meal.ingredients.forEach((ingredient) => {
            if (aggregatedIngredients[ingredient.name]) {
              aggregatedIngredients[ingredient.name] += ingredient.amount;
            } else {
              aggregatedIngredients[ingredient.name] = ingredient.amount;
            }
          });
        }
      });
    }
  });
  return aggregatedIngredients;
};
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Componentă separată pentru logica de refresh
function RefreshHandler({ profile, isRegenerating, onRegenerateAll }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shouldRefresh = searchParams.get("refresh");
    if (shouldRefresh === "true" && profile && !isRegenerating) {
      console.log("🔄 Prep status changed, regenerating plans...");
      onRegenerateAll();
      // Curățăm parametrul din URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, profile, isRegenerating, onRegenerateAll]);

  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startOfWeek, setStartOfWeek] = useState(getStartOfWeek(new Date()));
  const [weeklyPlans, setWeeklyPlans] = useState(new Map());
  const [shoppingList, setShoppingList] = useState({});
  const [shoppingListPeriod, setShoppingListPeriod] = useState(7);
  const [preppedComponents, setPreppedComponents] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchPlansForWeek = useCallback(async (userId, weekStartDate) => {
    const datesToFetch = Array.from({ length: 7 }, (_, i) =>
      getFormattedDate(addDays(weekStartDate, i))
    );
    const { data, error } = await supabase
      .from("daily_meal_plans")
      .select("plan_date, plan_data")
      .eq("user_id", userId)
      .in("plan_date", datesToFetch);
    if (error) {
      console.error("Error fetching weekly plans:", error);
      return new Map();
    }
    const plansMap = new Map(data.map((p) => [p.plan_date, p.plan_data]));
    setWeeklyPlans(plansMap);
    return plansMap;
  }, []);

  const fetchProfileAndPlans = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const user = session.user;
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profileError || !userProfile) {
      setError("Could not fetch profile.");
      setLoading(false);
      return;
    }
    setProfile(userProfile);

    // Verificăm dacă există prep_status și dacă nu a expirat
    if (userProfile.prep_status) {
      const expiryDate = new Date(userProfile.prep_status.expiresAt);
      const now = new Date();

      if (expiryDate > now) {
        setPreppedComponents(userProfile.prep_status.components);
      } else {
        // A expirat - ștergem statusul
        await supabase
          .from("profiles")
          .update({ prep_status: null })
          .eq("id", user.id);
        setPreppedComponents(null);
      }
    }

    await ensureMealPlansExist(user.id, userProfile);
    const plansMap = await fetchPlansForWeek(user.id, startOfWeek);
    const todayString = getFormattedDate(currentDate);
    if (plansMap.has(todayString)) {
      setCurrentPlan(plansMap.get(todayString));
    } else {
      const { data } = await supabase
        .from("daily_meal_plans")
        .select("plan_data")
        .eq("user_id", user.id)
        .eq("plan_date", todayString)
        .single();
      if (data) setCurrentPlan(data.plan_data);
    }
    setLoading(false);
  }, [router, currentDate, startOfWeek, fetchPlansForWeek]);

  useEffect(() => {
    fetchProfileAndPlans();
  }, [fetchProfileAndPlans]);

  useEffect(() => {
    if (weeklyPlans.size > 0) {
      const plansForPeriod = Array.from(weeklyPlans.values()).slice(
        0,
        shoppingListPeriod
      );
      const newList = generateShoppingList(
        plansForPeriod.map((p) => ({ plan_data: p }))
      );
      setShoppingList(newList);
    }
  }, [weeklyPlans, shoppingListPeriod]);

  const ensureMealPlansExist = async (userId, userProfile) => {
    const datesToCheck = [];
    for (let i = 0; i < 14; i++) {
      datesToCheck.push(getFormattedDate(addDays(new Date(), i)));
    }
    const { data: existingPlans, error } = await supabase
      .from("daily_meal_plans")
      .select("plan_date")
      .eq("user_id", userId)
      .in("plan_date", datesToCheck);
    if (error) {
      console.error("Error checking existing plans:", error);
      return;
    }
    const existingDates = new Set(existingPlans.map((p) => p.plan_date));
    const missingDates = datesToCheck.filter((d) => !existingDates.has(d));
    if (missingDates.length > 0) {
      const plansToInsert = missingDates.map((date) => {
        const plan = generateAdvancedMealPlan(userProfile, preppedComponents);
        return { user_id: userId, plan_date: date, plan_data: plan };
      });
      await supabase.from("daily_meal_plans").insert(plansToInsert);
    }
  };

  const savePlan = async (userId, dateString, plan) => {
    await supabase
      .from("daily_meal_plans")
      .upsert(
        { user_id: userId, plan_date: dateString, plan_data: plan },
        { onConflict: "user_id, plan_date" }
      );
  };

  const handleRegenerate = async () => {
    if (!profile) return;
    setLoading(true);
    const newPlan = generateAdvancedMealPlan(profile, preppedComponents);
    if (newPlan) {
      const dateString = getFormattedDate(currentDate);
      await savePlan(profile.id, dateString, newPlan);
      setCurrentPlan(newPlan);
      setWeeklyPlans((prev) => new Map(prev).set(dateString, newPlan));
    }
    setLoading(false);
  };

  const regenerateAllPlans = async () => {
    if (!profile || isRegenerating) return;

    setIsRegenerating(true);
    console.log("🔄 Regenerating all plans with updated prep status...");

    // Re-fetch profilul pentru a obține prep_status actualizat
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile.id)
      .single();

    if (!updatedProfile) {
      setIsRegenerating(false);
      return;
    }

    // Verificăm prep status și data de expirare
    let newPreppedComponents = null;
    let prepStartDate = null;
    let prepDays = 0;

    if (updatedProfile.prep_status) {
      const expiryDate = new Date(updatedProfile.prep_status.expiresAt);
      const now = new Date();
      if (expiryDate > now) {
        newPreppedComponents = updatedProfile.prep_status.components;
        prepStartDate = new Date(updatedProfile.prep_status.preppedAt);
        prepDays = updatedProfile.prep_status.daysPrepped || 0;
      }
    }
    setPreppedComponents(newPreppedComponents);

    // Regenerăm planurile pentru următoarele 14 zile (să acopere toate cazurile)
    const datesToRegenerate = Array.from({ length: 14 }, (_, i) =>
      addDays(new Date(), i)
    );

    const regeneratedPlans = [];

    for (let i = 0; i < datesToRegenerate.length; i++) {
      const date = datesToRegenerate[i];
      const dateString = getFormattedDate(date);

      // Verificăm dacă această zi este în perioada de prep
      let componentsForThisDay = null;
      if (newPreppedComponents && prepStartDate) {
        const daysSincePrep = Math.floor(
          (date - prepStartDate) / (1000 * 60 * 60 * 24)
        );
        // Dacă ziua este în primele X zile de la prep, folosim componentele pregătite
        if (daysSincePrep >= 0 && daysSincePrep < prepDays) {
          componentsForThisDay = newPreppedComponents;
          console.log(
            `✅ Day ${i} (${dateString}) - Using prep mode (day ${
              daysSincePrep + 1
            }/${prepDays})`
          );
        } else {
          console.log(
            `⏭️ Day ${i} (${dateString}) - Normal mode (outside prep window)`
          );
        }
      }

      const newPlan = generateAdvancedMealPlan(
        updatedProfile,
        componentsForThisDay
      );
      if (newPlan) {
        regeneratedPlans.push({
          user_id: profile.id,
          plan_date: dateString,
          plan_data: newPlan,
        });
      }
    }

    if (regeneratedPlans.length > 0) {
      const { error } = await supabase
        .from("daily_meal_plans")
        .upsert(regeneratedPlans, { onConflict: "user_id, plan_date" });

      if (error) {
        console.error("Error regenerating plans:", error);
      } else {
        console.log("✅ All plans regenerated successfully");

        // Reîncărcăm planurile săptămânale
        await fetchPlansForWeek(profile.id, startOfWeek);

        // Actualizăm planul curent
        const todayString = getFormattedDate(currentDate);
        const todayPlan = regeneratedPlans.find(
          (p) => p.plan_date === todayString
        );
        if (todayPlan) {
          setCurrentPlan(todayPlan.plan_data);
        }
      }
    }

    setIsRegenerating(false);
  };

  const handleRegenerateSingleMeal = async (mealIndex) => {
    if (!profile || !currentPlan) return;

    const mealType =
      currentPlan.plan[mealIndex].type ||
      ["breakfast", "lunch", "dinner"][mealIndex];
    const oldMeal = currentPlan.plan[mealIndex];

    const newMeal = regenerateSingleMeal(
      profile,
      mealType,
      oldMeal,
      preppedComponents
    );

    if (!newMeal) {
      console.error("Failed to generate a new meal.");
      return;
    }

    const newMealsArray = currentPlan.plan.map((meal, index) =>
      index === mealIndex ? newMeal : meal
    );

    const newTotals = newMealsArray.reduce(
      (acc, meal) => {
        acc.calories += meal.total_calories;
        acc.protein += meal.total_protein;
        acc.carbs += meal.total_carbs;
        acc.fats += meal.total_fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const newPlanState = {
      plan: newMealsArray,
      totals: newTotals,
    };

    setCurrentPlan(newPlanState);
    const dateString = getFormattedDate(currentDate);
    await savePlan(profile.id, dateString, newPlanState);
    setWeeklyPlans((prev) => new Map(prev).set(dateString, newPlanState));
  };

  const changeWeek = (offset) => {
    const newStartOfWeek = addDays(startOfWeek, offset * 7);
    setStartOfWeek(newStartOfWeek);
    handleDaySelect(newStartOfWeek);
  };

  const handleDaySelect = (date) => {
    setCurrentDate(date);
    const dateString = getFormattedDate(date);
    if (weeklyPlans.has(dateString)) {
      setCurrentPlan(weeklyPlans.get(dateString));
    } else {
      setCurrentPlan(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!profile) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  // Afișăm loading când regenerăm planurile
  if (isRegenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-lg font-medium text-slate-600">
          Updating meal plans with{" "}
          {preppedComponents ? "prep mode" : "fresh ingredients"}...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Suspense boundary pentru useSearchParams */}
      <Suspense fallback={null}>
        <RefreshHandler
          profile={profile}
          isRegenerating={isRegenerating}
          onRegenerateAll={regenerateAllPlans}
        />
      </Suspense>

      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {profile.name || "User"}!
          </h1>
          <p className="text-slate-500">Your meal plan dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/prep-mode">
              <ChefHat className="mr-2 h-4 w-4" />
              Prep Mode
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Shopping List
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>Your Shopping List</SheetTitle>
                <SheetDescription>
                  Aggregated ingredients for the selected period.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <div className="flex justify-center gap-2 mb-4">
                  <Button
                    variant={shoppingListPeriod === 3 ? "default" : "outline"}
                    onClick={() => setShoppingListPeriod(3)}
                  >
                    Next 3 Days
                  </Button>
                  <Button
                    variant={shoppingListPeriod === 7 ? "default" : "outline"}
                    onClick={() => setShoppingListPeriod(7)}
                  >
                    Next 7 Days
                  </Button>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto">
                <ul className="space-y-2 pr-4">
                  {Object.entries(shoppingList).map(([name, amount]) => (
                    <li
                      key={name}
                      className="flex justify-between items-center p-2 rounded-md bg-slate-100 dark:bg-slate-800"
                    >
                      <span className="font-medium">{name}</span>
                      <span className="font-mono text-slate-500">
                        {Math.round(amount)}g
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="icon" asChild>
            <Link href="/profile">
              <User className="h-4 w-4" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      {/* Prep Mode Status Banner */}
      {preppedComponents && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <p className="text-green-700 dark:text-green-400 font-medium">
                Prep Mode Active! Your meals are using prepped components with
                optimized instructions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Weekly Overview</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeWeek(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeWeek(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayDate = addDays(startOfWeek, i);
            const dayString = getFormattedDate(dayDate);
            const plan = weeklyPlans.get(dayString);
            const isSelected = getFormattedDate(currentDate) === dayString;
            return (
              <button
                key={dayString}
                onClick={() => handleDaySelect(dayDate)}
                className={`p-2 rounded-lg text-left border-2 transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/50"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <p className="font-bold text-sm">
                  {dayDate.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  {dayDate.toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </p>
                {plan ? (
                  <div className="text-xs">
                    <p className="font-semibold">
                      {Math.round(plan.totals.calories)} kcal
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No plan</p>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">
        Details for:{" "}
        {currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </h2>

      {!currentPlan ? (
        <div className="text-center p-8">
          Loading plan for the selected day...
        </div>
      ) : (
        <>
          <Card className="w-full mb-8">
            <CardHeader>
              <CardTitle>Day's Targets vs. Plan</CardTitle>
              <CardDescription>
                Your goals for the day compared to the generated plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <Label className="text-sm">Target Calories</Label>
                <p className="text-2xl font-bold text-blue-500">
                  {Math.round(profile.targetCalories || 0)}
                </p>
                <p className="text-xs text-slate-400">
                  Plan: {Math.round(currentPlan.totals.calories || 0)}
                </p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <Label className="text-sm">Protein</Label>
                <p className="text-xl font-semibold">
                  {Math.round(profile.targetProtein || 0)}g
                </p>
                <p className="text-xs text-slate-400">
                  Plan: {Math.round(currentPlan.totals.protein || 0)}g
                </p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <Label className="text-sm">Carbs</Label>
                <p className="text-xl font-semibold">
                  {Math.round(profile.targetCarbs || 0)}g
                </p>
                <p className="text-xs text-slate-400">
                  Plan: {Math.round(currentPlan.totals.carbs || 0)}g
                </p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <Label className="text-sm">Fats</Label>
                <p className="text-xl font-semibold">
                  {Math.round(profile.targetFats || 0)}g
                </p>
                <p className="text-xs text-slate-400">
                  Plan: {Math.round(currentPlan.totals.fats || 0)}g
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Meals for the Day</h2>
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate for this Day
            </Button>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-0"
          >
            {currentPlan.plan.map((meal, index) => (
              <AccordionItem
                value={`item-${index}`}
                key={`${index}-${meal.id}-${meal.total_calories}`}
              >
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <UtensilsCrossed className="h-5 w-5 text-slate-500" />
                      {meal.name}
                      {meal.isPrepMode && (
                        <Badge variant="secondary" className="ml-2">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Prep Mode
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      {meal.total_calories} kcal
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {meal.imageUrl && (
                    <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="absolute h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="px-4 pt-2 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500">Protein</span>
                        <div className="flex items-center gap-1 font-semibold">
                          <Beef className="h-4 w-4 text-red-500" />
                          {Math.round(meal.total_protein)}g
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500">Carbs</span>
                        <div className="flex items-center gap-1 font-semibold">
                          <Wheat className="h-4 w-4 text-yellow-500" />
                          {Math.round(meal.total_carbs)}g
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500">Fats</span>
                        <div className="flex items-center gap-1 font-semibold">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          {Math.round(meal.total_fats)}g
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8 p-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" /> Ingredients
                      </h4>

                      {/* Afișăm ingredientele separate dacă suntem în prep mode */}
                      {meal.isPrepMode && meal.categorizedIngredients ? (
                        <>
                          {meal.categorizedIngredients.prepped.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Prepped Components (from fridge)
                              </p>
                              <ul className="space-y-2">
                                {meal.categorizedIngredients.prepped.map(
                                  (ing, i) => (
                                    <li
                                      key={i}
                                      className="flex justify-between items-center p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                    >
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>{ing.name}</span>
                                      </div>
                                      <span className="font-mono text-slate-500">
                                        {ing.amount}
                                        {ing.unit}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {meal.categorizedIngredients.fresh.length > 0 && (
                            <div>
                              <p className="text-xs text-blue-600 font-medium mb-2">
                                Fresh Ingredients
                              </p>
                              <ul className="space-y-2">
                                {meal.categorizedIngredients.fresh.map(
                                  (ing, i) => (
                                    <li
                                      key={i}
                                      className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
                                    >
                                      <span>{ing.name}</span>
                                      <span className="font-mono text-slate-500">
                                        {ing.amount}
                                        {ing.unit}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <ul className="space-y-2">
                          {meal.ingredients &&
                            meal.ingredients.map((ing, i) => (
                              <li
                                key={i}
                                className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>{ing.name}</span>
                                </div>
                                <span className="font-mono text-slate-500">
                                  {ing.amount}
                                  {ing.unit}
                                </span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {meal.isPrepMode
                          ? "Quick Assembly Instructions"
                          : "Instructions"}
                      </h4>
                      {meal.instructions && meal.instructions.length > 0 ? (
                        <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                          {meal.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No instructions available for this meal.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateSingleMeal(index)}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Regenerate this meal
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}
    </div>
  );
}
