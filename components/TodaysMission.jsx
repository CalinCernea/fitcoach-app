// components/TodaysMission.jsx
"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Coffee, Sun, Moon, UtensilsCrossed } from "lucide-react";

// Componenta pentru iconița mesei (similară cu cea din vechiul dashboard)
const MealIcon = ({ mealType, className = "h-5 w-5" }) => {
  const type = mealType?.toLowerCase();
  if (type?.includes("breakfast")) {
    return <Coffee className={`${className} text-amber-500`} />;
  }
  if (type?.includes("lunch")) {
    return <Sun className={`${className} text-orange-500`} />;
  }
  if (type?.includes("dinner")) {
    return <Moon className={`${className} text-indigo-500`} />;
  }
  return <UtensilsCrossed className={`${className} text-slate-500`} />;
};

export function TodaysMission({ plan, onViewMeal, onToggleMealConsumed }) {
  // --- Logica pentru a determina masa următoare ---
  const nextMeal = useMemo(() => {
    if (!plan?.plan || plan.plan.length === 0) {
      return { meal: null, mealIndex: -1 };
    }

    const now = new Date().getHours();
    // Presupunem 3 mese: mic dejun, prânz, cină
    // Intervalele orare pot fi ajustate
    if (now < 11) {
      // Înainte de 11:00, arătăm micul dejun
      return { meal: plan.plan[0], mealIndex: 0 };
    }
    if (now < 17) {
      // Între 11:00 și 17:00, arătăm prânzul
      return { meal: plan.plan[1] || plan.plan[0], mealIndex: 1 };
    }
    // După 17:00, arătăm cina
    return { meal: plan.plan[2] || plan.plan[1] || plan.plan[0], mealIndex: 2 };
  }, [plan]);

  if (!nextMeal.meal) {
    return (
      <Card className="flex flex-col justify-center items-center h-full">
        <CardContent className="text-center">
          <p className="text-slate-500">No meal plan available for today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Today's Mission</span>
          <MealIcon mealType={nextMeal.meal.type} className="h-6 w-6" />
        </CardTitle>
        <CardDescription>Here is your next scheduled meal.</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col justify-center items-center text-center">
        <p className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
          UP NEXT: {nextMeal.meal.type || "Meal"}
        </p>
        <h3 className="text-2xl font-bold mt-2">{nextMeal.meal.name}</h3>
        <p className="text-slate-500 mt-1">
          {Math.round(nextMeal.meal.total_calories)} kcal
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button
          size="lg"
          className="w-full"
          onClick={() => onViewMeal(nextMeal.meal)}
        >
          View Meal Details
        </Button>

        {/* Navigarea rapidă cu checkbox-uri */}
        <div className="flex justify-around items-center w-full pt-2">
          {plan.plan.map((meal, index) => {
            const isConsumed = plan.consumed_meals?.includes(index);
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => onViewMeal(meal)}
                  className={`p-2 rounded-full transition-colors ${
                    index === nextMeal.mealIndex
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title={`View ${meal.type || "meal"}`}
                >
                  <MealIcon mealType={meal.type} />
                </button>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`meal-${index}`}
                    checked={isConsumed}
                    onCheckedChange={() => onToggleMealConsumed(index)}
                    aria-label={`Mark ${meal.name} as eaten`}
                  />
                  <label
                    htmlFor={`meal-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 sr-only"
                  >
                    {meal.name}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}
