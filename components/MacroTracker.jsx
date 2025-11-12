// components/MacroTracker.jsx
"use client";

import { useMemo } from "react"; // <-- ADAUGĂ ACEST IMPORT
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

// Componenta MacroRing rămâne aproape la fel, dar va afișa Consumat vs. Planificat
const MacroRing = ({ name, consumedValue, planValue, color }) => {
  const consumed = Math.round(consumedValue);
  const total = Math.round(planValue);

  const percentage = total > 0 ? (consumed / total) * 100 : 0;

  const data = [{ name: name, value: percentage }];

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-full h-32 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="90%"
            data={data}
            startAngle={90}
            endAngle={-270}
            barSize={12}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              angleAxisId={0}
              fill={color}
              cornerRadius={6}
              className="transition-all duration-500"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Afișăm valoarea consumată în centru */}
          <p className="text-xl font-bold">{consumed}g</p>
        </div>
      </div>
      <p className="font-semibold mt-2">{name}</p>
      {/* Afișăm ținta planificată sub inel */}
      <p className="text-xs text-slate-500">Plan: {total}g</p>
    </div>
  );
};

export function MacroTracker({ profile, plan }) {
  // --- NOU: Calculăm totalurile consumate ---
  const consumedTotals = useMemo(() => {
    if (!plan?.plan || !plan.consumed_meals) {
      return { protein: 0, carbs: 0, fats: 0 };
    }

    // Reducem array-ul de mese la un total al macronutrienților consumați
    return plan.consumed_meals.reduce(
      (acc, mealIndex) => {
        const meal = plan.plan[mealIndex];
        if (meal) {
          acc.protein += meal.total_protein;
          acc.carbs += meal.total_carbs;
          acc.fats += meal.total_fats;
        }
        return acc;
      },
      { protein: 0, carbs: 0, fats: 0 }
    );
  }, [plan]); // Recalculăm doar când planul se schimbă (ex: la bifarea unui checkbox)

  if (!profile || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Macro Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Live Macro Tracker</CardTitle>
        <CardDescription>
          Your consumed macros vs. today's plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <MacroRing
            name="Protein"
            consumedValue={consumedTotals.protein} // <-- Valoarea consumată
            planValue={plan.totals.protein} // <-- Valoarea totală a planului
            color="#ef4444"
          />
          <MacroRing
            name="Carbs"
            consumedValue={consumedTotals.carbs} // <-- Valoarea consumată
            planValue={plan.totals.carbs} // <-- Valoarea totală a planului
            color="#f59e0b"
          />
          <MacroRing
            name="Fats"
            consumedValue={consumedTotals.fats} // <-- Valoarea consumată
            planValue={plan.totals.fats} // <-- Valoarea totală a planului
            color="#3b82f6"
          />
        </div>
      </CardContent>
    </Card>
  );
}
