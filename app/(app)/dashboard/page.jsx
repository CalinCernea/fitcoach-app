// app/(app)/dashboard/page.jsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import {
  generateAdvancedMealPlan,
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
// NOU: Am adăugat componentele pentru Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Replace, // NOU: Iconiță nouă pentru butonul de swap
  Coffee, // <-- ADAUGĂ AICI
  Sun, // <-- ADAUGĂ AICI
  Moon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WaterTracker } from "@/components/WaterTracker";
import { TodaysMission } from "@/components/TodaysMission";
import { MacroTracker } from "@/components/MacroTracker";
import { WeeklyOverviewWidget } from "@/components/WeeklyOverviewWidget";
import { MealDetailDialog } from "@/components/MealDetailDialog";

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

const MealIcon = ({ mealType }) => {
  const type = mealType?.toLowerCase();
  if (type?.includes("breakfast")) {
    return <Coffee className="h-5 w-5 text-amber-500" />;
  }
  if (type?.includes("lunch")) {
    return <Sun className="h-5 w-5 text-orange-500" />;
  }
  if (type?.includes("dinner")) {
    return <Moon className="h-5 w-5 text-indigo-500" />;
  }
  return <UtensilsCrossed className="h-5 w-5 text-slate-500" />;
};

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
  const [allFetchedPlans, setAllFetchedPlans] = useState(new Map());

  // NOU: Stări pentru dialogul de swap
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [mealAlternatives, setMealAlternatives] = useState([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState(null);
  const [isMealDetailOpen, setIsMealDetailOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);

  const getPrepStatusForDate = useCallback(
    (date) => {
      if (profile?.prep_status) {
        const expiryDate = new Date(profile.prep_status.expiresAt);
        const prepStartDate = new Date(profile.prep_status.preppedAt);
        const prepDays = profile.prep_status.daysPrepped || 0;
        const targetDate = new Date(date); // Asigură-te că e obiect Date

        // Resetează orele pentru o comparație corectă a zilelor
        prepStartDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        if (expiryDate > new Date()) {
          const daysSincePrep = Math.floor(
            (targetDate - prepStartDate) / (1000 * 60 * 60 * 24)
          );

          // Verifică dacă data curentă este în intervalul de prep
          if (daysSincePrep >= 0 && daysSincePrep < prepDays) {
            return profile.prep_status.components; // Returnează componentele dacă e în prep mode
          }
        }
      }
      return null; // Nu este în prep mode pentru această dată
    },
    [profile]
  );

  // ACEASTA ESTE FUNCȚIA NOUĂ
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
      return;
    }

    const newPlansMap = new Map(data.map((p) => [p.plan_date, p.plan_data]));

    // Actualizăm planurile pentru săptămâna curentă (pentru afișaj)
    setWeeklyPlans(newPlansMap);

    // Adăugăm planurile noi la sursa noastră de adevăr
    setAllFetchedPlans((prev) => new Map([...prev, ...newPlansMap]));
    return newPlansMap;
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

    if (userProfile.prep_status) {
      const expiryDate = new Date(userProfile.prep_status.expiresAt);
      const now = new Date();

      if (expiryDate > now) {
        setPreppedComponents(userProfile.prep_status.components);
      } else {
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

  // BLOCUL NOU PENTRU SHOPPING LIST
  useEffect(() => {
    // Verificăm dacă avem planuri din care să calculăm
    if (allFetchedPlans.size > 0) {
      console.log(
        "🛒 Recalculating shopping list using the main data source..."
      );

      // 1. Definim datele de care avem nevoie: de azi pentru X zile
      const today = new Date();
      const datesForShoppingList = Array.from(
        { length: shoppingListPeriod },
        (_, i) => getFormattedDate(addDays(today, i))
      );

      // 2. Extragem planurile relevante din sursa noastră de adevăr
      const relevantPlans = datesForShoppingList
        .map((date) => allFetchedPlans.get(date))
        .filter(Boolean); // Filtrăm zilele pentru care nu avem (încă) un plan

      // 3. Generăm lista de cumpărături
      const newList = generateShoppingList(
        relevantPlans.map((p) => ({ plan_data: p }))
      );

      setShoppingList(newList);
    }
  }, [allFetchedPlans, shoppingListPeriod]); // Rulează când se schimbă ORICE plan sau perioada

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
    const componentsForThisDay = getPrepStatusForDate(currentDate);
    const newPlan = generateAdvancedMealPlan(profile, componentsForThisDay);

    if (newPlan) {
      const dateString = getFormattedDate(currentDate);
      await savePlan(profile.id, dateString, newPlan);
      setCurrentPlan(newPlan);

      // Actualizează ambele hărți
      setWeeklyPlans((prev) => new Map(prev).set(dateString, newPlan));
      setAllFetchedPlans((prev) => new Map(prev).set(dateString, newPlan));
    }
    setLoading(false);
  };

  const regenerateAllPlans = async () => {
    if (!profile || isRegenerating) return;

    setIsRegenerating(true);
    console.log("🔄 Regenerating all plans with updated prep status...");

    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile.id)
      .single();

    if (!updatedProfile) {
      setIsRegenerating(false);
      return;
    }

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

    const datesToRegenerate = Array.from({ length: 14 }, (_, i) =>
      addDays(new Date(), i)
    );

    const regeneratedPlans = [];

    for (let i = 0; i < datesToRegenerate.length; i++) {
      const date = datesToRegenerate[i];
      const dateString = getFormattedDate(date);

      let componentsForThisDay = null;
      if (newPreppedComponents && prepStartDate) {
        const daysSincePrep = Math.floor(
          (date - prepStartDate) / (1000 * 60 * 60 * 24)
        );
        if (daysSincePrep >= 0 && daysSincePrep < prepDays) {
          componentsForThisDay = newPreppedComponents;
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
        await fetchPlansForWeek(profile.id, startOfWeek);
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

  // NOU: Funcție pentru a deschide dialogul și a încărca alternativele
  const handleOpenSwapDialog = async (mealIndex) => {
    if (!profile || !currentPlan) return;

    setActiveMealIndex(mealIndex);
    setIsSwapDialogOpen(true);
    setLoadingAlternatives(true);
    setMealAlternatives([]);

    const mealToSwap = currentPlan.plan[mealIndex];
    const mealType =
      mealToSwap.type || ["breakfast", "lunch", "dinner"][mealIndex];

    // Aflăm statusul de prep specific pentru ziua curentă
    const componentsForThisDay = getPrepStatusForDate(currentDate); // << APELĂM FUNCȚIA HELPER

    console.log(
      `🔄 Swapping meal for ${getFormattedDate(currentDate)}. Prep mode is ${
        componentsForThisDay ? "ACTIVE" : "INACTIVE"
      }.`
    );

    const alternatives = await getMealAlternatives(
      profile,
      mealType,
      mealToSwap,
      componentsForThisDay // << TRIMITEM STATUSUL CORECT PENTRU ZIUA CURENTĂ
    );

    setMealAlternatives(alternatives || []);
    setLoadingAlternatives(false);
  };

  const handleSelectAlternative = async (selectedMeal) => {
    if (activeMealIndex === null || !currentPlan) return;

    const newMealsArray = currentPlan.plan.map((meal, index) =>
      index === activeMealIndex ? selectedMeal : meal
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
    const newPlanState = { plan: newMealsArray, totals: newTotals };

    setCurrentPlan(newPlanState);
    const dateString = getFormattedDate(currentDate);
    await savePlan(profile.id, dateString, newPlanState);

    // Actualizează ambele hărți
    setWeeklyPlans((prev) => new Map(prev).set(dateString, newPlanState));
    setAllFetchedPlans((prev) => new Map(prev).set(dateString, newPlanState));

    setIsSwapDialogOpen(false);
    setActiveMealIndex(null);
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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <Suspense fallback={null}>
        <RefreshHandler
          profile={profile}
          isRegenerating={isRegenerating}
          onRegenerateAll={regenerateAllPlans}
        />
      </Suspense>

      {/* ================= HEADER (PĂSTRAT) ================= */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome, {profile.name || "User"}!
          </h1>
          <p className="text-slate-500">Your command center is ready.</p>
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

      {/* ================= NOTIFICARE PREP MODE (PĂSTRATĂ) ================= */}
      {preppedComponents && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <p className="text-green-700 dark:text-green-400 font-medium">
                Prep Mode Active! Your meals are using prepped components.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= NOUL GRID 2x2 "COMMAND CENTER" ================= */}
      {!currentPlan ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* --- WIDGET 1: TODAY'S MISSION --- */}
          <TodaysMission
            profile={profile}
            plan={currentPlan}
            onViewMeal={(meal) => {
              setSelectedMeal(meal);
              setIsMealDetailOpen(true);
            }}
          />

          {/* --- WIDGET 2: MACRO TRACKER --- */}
          <MacroTracker profile={profile} plan={currentPlan} />

          {/* --- WIDGET 3: WEEKLY OVERVIEW --- */}
          <WeeklyOverviewWidget
            plans={weeklyPlans}
            currentDate={currentDate}
            startOfWeek={startOfWeek}
            onDaySelect={handleDaySelect}
            changeWeek={changeWeek}
          />

          {/* --- WIDGET 4: SMART WATER TRACKER --- */}
          <WaterTracker
            userId={profile.id}
            dailyTarget={profile.daily_water_target || 2500}
          />
        </div>
      )}

      {/* ================= DIALOGURI (RĂMÂN LA FINAL) ================= */}
      <MealDetailDialog
        meal={selectedMeal}
        isOpen={isMealDetailOpen}
        onOpenChange={setIsMealDetailOpen}
        onSwap={() => {
          const mealIndex = currentPlan.plan.findIndex(
            (m) => m.id === selectedMeal.id
          );
          if (mealIndex !== -1) {
            setIsMealDetailOpen(false);
            // Așteaptă puțin ca primul dialog să se închidă
            setTimeout(() => handleOpenSwapDialog(mealIndex), 150);
          }
        }}
      />

      <Dialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Choose an Alternative
            </DialogTitle>
            <DialogDescription>
              Select a meal that fits your taste. Macros are similar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-[70vh] overflow-y-auto pr-3">
            {loadingAlternatives ? (
              <div className="flex flex-col justify-center items-center h-60 gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-slate-500">Finding tasty alternatives...</p>
              </div>
            ) : mealAlternatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mealAlternatives.map((altMeal, altIndex) => (
                  <div
                    key={altIndex}
                    style={{ animationDelay: `${altIndex * 100}ms` }}
                    className="animate-in fade-in slide-in-from-bottom-5 group relative flex flex-col rounded-xl border bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {altMeal.imageUrl ? (
                        <img
                          src={altMeal.imageUrl}
                          alt={altMeal.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <UtensilsCrossed className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg mb-2">{altMeal.name}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex-grow">
                        <p>
                          {Math.round(altMeal.total_calories)} kcal &bull; P:{" "}
                          {Math.round(altMeal.total_protein)}g &bull; C:{" "}
                          {Math.round(altMeal.total_carbs)}g &bull; F:{" "}
                          {Math.round(altMeal.total_fats)}g
                        </p>
                      </div>
                      <Button
                        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                        onClick={() => handleSelectAlternative(altMeal)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Select this Meal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16">
                <p className="font-semibold text-lg">No alternatives found</p>
                <p className="text-sm mt-1">
                  Try regenerating the entire day for a fresh set of meals.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
