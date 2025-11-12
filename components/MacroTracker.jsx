// components/MacroTracker.jsx
"use client";

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

// O componentă reutilizabilă pentru un singur inel de progres
const MacroRing = ({ name, planValue, targetValue, color }) => {
  const value = Math.round(planValue);
  const total = Math.round(targetValue);

  // Calculăm procentajul, dar ne asigurăm că nu depășește 100% pentru afișajul vizual
  // Inelul se va umple complet la 100%, chiar dacă valoarea depășește ținta.
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const data = [{ name: name, value: percentage }];

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-full h-32 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%" // Creează efectul de "inel"
            outerRadius="90%"
            data={data}
            startAngle={90} // Începe de sus
            endAngle={-270} // Se termină tot sus (cerc complet)
            barSize={12} // Grosimea barei
          >
            {/* Axa care stă în spatele barei, practic background-ul inelului */}
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            {/* Bara de progres efectivă */}
            <RadialBar
              background
              dataKey="value"
              angleAxisId={0}
              fill={color}
              cornerRadius={6} // Colțuri rotunjite pentru bară
              className="transition-all duration-500"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Textul din centrul inelului */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <p className="text-xl font-bold">{value}g</p>
        </div>
      </div>
      <p className="font-semibold mt-2">{name}</p>
      <p className="text-xs text-slate-500">Target: {total}g</p>
    </div>
  );
};

export function MacroTracker({ profile, plan }) {
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
        <CardTitle>Macro Tracker</CardTitle>
        <CardDescription>
          Your daily progress against your targets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <MacroRing
            name="Protein"
            planValue={plan.totals.protein}
            targetValue={profile.targetProtein}
            color="#ef4444" // Roșu (Tailwind red-500)
          />
          <MacroRing
            name="Carbs"
            planValue={plan.totals.carbs}
            targetValue={profile.targetCarbs}
            color="#f59e0b" // Ambră (Tailwind amber-500)
          />
          <MacroRing
            name="Fats"
            planValue={plan.totals.fats}
            targetValue={profile.targetFats}
            color="#3b82f6" // Albastru (Tailwind blue-500)
          />
        </div>
      </CardContent>
    </Card>
  );
}
