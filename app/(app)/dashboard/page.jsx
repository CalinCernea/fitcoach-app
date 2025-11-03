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
  LogOut,
  RefreshCw,
  UtensilsCrossed,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

// --- Helper Functions ---
const getFormattedDate = (date) => date.toISOString().split("T")[0];

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

  const fetchProfileAndInitialPlan = useCallback(async () => {
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
    await loadPlanForDate(user.id, getFormattedDate(currentDate), userProfile);

    setLoading(false);
  }, [router, currentDate]);

  const loadPlanForDate = async (userId, dateString, userProfile) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_meal_plans")
      .select("plan_data")
      .eq("user_id", userId)
      .eq("plan_date", dateString)
      .single();

    if (data && data.plan_data) {
      setCurrentPlan(data.plan_data);
    } else {
      const newPlan = generateAdvancedMealPlan(userProfile);
      await savePlan(userId, dateString, newPlan);
      setCurrentPlan(newPlan);
    }
    setLoading(false);
  };

  const ensureMealPlansExist = async (userId, userProfile) => {
    const today = new Date();
    const datesToCheck = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return getFormattedDate(d);
    });

    const { data: existingPlans, error } = await supabase
      .from("daily_meal_plans")
      .select("plan_date")
      .eq("user_id", userId)
      .in("plan_date", datesToCheck);
    if (error) {
      console.error("Error checking existing plans:", error);
      return;
    }

    const existingDates = existingPlans.map((p) => p.plan_date);
    const missingDates = datesToCheck.filter((d) => !existingDates.includes(d));

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
    setLoading(false);
  };

  // --- AICI ESTE FUNCȚIA MODIFICATĂ ---
  const handleRegenerateSingleMeal = async (mealIndex) => {
    if (!profile || !currentPlan) return;

    const mealType = ["breakfast", "lunch", "dinner"][mealIndex];

    // Extrage țintele mesei vechi, pe care o vom înlocui
    const oldMeal = currentPlan.plan[mealIndex];
    const oldMealTargets = {
      calories: oldMeal.total_calories,
      protein: oldMeal.total_protein,
      carbs: oldMeal.total_carbs,
      fats: oldMeal.total_fats,
    };

    // Pasează aceste ținte funcției de regenerare
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
  };

  const changeDay = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  useEffect(() => {
    fetchProfileAndInitialPlan();
  }, [currentDate, fetchProfileAndInitialPlan]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!profile || !currentPlan) return <LoadingSpinner />;
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

      <div className="flex justify-between items-center p-4 mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <Button variant="outline" onClick={() => changeDay(-1)}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous Day
        </Button>
        <h2 className="text-xl font-semibold">
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h2>
        <Button variant="outline" onClick={() => changeDay(1)}>
          Next Day <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading plan...</div>
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

          <Accordion type="single" collapsible className="w-full">
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
