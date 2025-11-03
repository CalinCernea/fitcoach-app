// app/(app)/dashboard/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import {
  generateAdvancedMealPlan,
  regenerateSingleMeal,
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
} from "lucide-react";

// --- Helper Functions ---
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
        meal.ingredients.forEach((ingredient) => {
          if (aggregatedIngredients[ingredient.name]) {
            aggregatedIngredients[ingredient.name] += ingredient.amount;
          } else {
            aggregatedIngredients[ingredient.name] = ingredient.amount;
          }
        });
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

// --- Main Component ---
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

    await ensureMealPlansExist(user.id, userProfile);
    const plansMap = await fetchPlansForWeek(user.id, startOfWeek);

    const todayString = getFormattedDate(currentDate);
    if (plansMap.has(todayString)) {
      setCurrentPlan(plansMap.get(todayString));
    } else {
      // Dacă planul pentru ziua curentă nu e în hartă, îl încărcăm separat
      const { data, error } = await supabase
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
        const plan = generateAdvancedMealPlan(userProfile);
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
    const newPlan = generateAdvancedMealPlan(profile);
    const dateString = getFormattedDate(currentDate);
    await savePlan(profile.id, dateString, newPlan);
    setCurrentPlan(newPlan);
    setWeeklyPlans((prev) => new Map(prev).set(dateString, newPlan));
    setLoading(false);
  };

  const handleRegenerateSingleMeal = async (mealIndex) => {
    if (!profile || !currentPlan) return;
    const mealType = ["breakfast", "lunch", "dinner"][mealIndex];
    const oldMeal = currentPlan.plan[mealIndex];
    const oldMealTargets = {
      calories: oldMeal.total_calories,
      protein: oldMeal.total_protein,
      carbs: oldMeal.total_carbs,
      fats: oldMeal.total_fats,
    };
    const newMeal = regenerateSingleMeal(profile, mealType, oldMealTargets);
    if (!newMeal) {
      console.error("Failed to generate a new meal.");
      return;
    }
    const updatedPlan = { ...currentPlan };
    updatedPlan.plan[mealIndex] = newMeal;
    updatedPlan.totals = updatedPlan.plan.reduce(
      (acc, meal) => {
        acc.calories += meal.total_calories;
        acc.protein += meal.total_protein;
        acc.carbs += meal.total_carbs;
        acc.fats += meal.total_fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    setCurrentPlan(updatedPlan);
    const dateString = getFormattedDate(currentDate);
    await savePlan(profile.id, dateString, updatedPlan);
    setWeeklyPlans((prev) => new Map(prev).set(dateString, updatedPlan));
  };

  const changeWeek = (offset) => {
    const newStartOfWeek = addDays(startOfWeek, offset * 7);
    setStartOfWeek(newStartOfWeek);
    // Actualizăm și ziua curentă pentru a fi prima zi a noii săptămâni
    handleDaySelect(newStartOfWeek);
  };

  const handleDaySelect = (date) => {
    setCurrentDate(date);
    const dateString = getFormattedDate(date);
    if (weeklyPlans.has(dateString)) {
      setCurrentPlan(weeklyPlans.get(dateString));
    } else {
      // Dacă planul nu e încărcat, arătăm un loader temporar
      setCurrentPlan(null);
      // Logica de fetch va re-rula și va încărca planul corect
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!profile) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {profile.name || "User"}!
          </h1>
          <p className="text-slate-500">Your meal plan dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Shopping List
              </Button>
            </SheetTrigger>
            <SheetContent>
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
                <ul className="space-y-2">
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
                key={`${currentDate.toISOString()}-${index}`}
              >
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <UtensilsCrossed className="h-5 w-5 text-slate-500" />
                      {meal.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {meal.total_calories} kcal
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
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
                  <ul className="space-y-2 p-4">
                    {meal.ingredients.map((ing, i) => (
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
