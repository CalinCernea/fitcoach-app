// app/(app)/prep-mode/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { generatePrepList, generatePrepSteps } from "@/utils/prepModePlanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, ClipboardList, ChefHat } from "lucide-react";
import Link from "next/link";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function PrepModePage() {
  const [loading, setLoading] = useState(true);
  const [prepComponents, setPrepComponents] = useState([]);
  const [prepSteps, setPrepSteps] = useState([]);
  const [daysToPrep, setDaysToPrep] = useState(3); // Default: prep for next 3 days

  useEffect(() => {
    const fetchAndGeneratePrepPlan = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch plans for the selected number of days
      const dateStrings = Array.from({ length: daysToPrep }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
      });

      const { data: dailyPlans, error } = await supabase
        .from("daily_meal_plans")
        .select("plan_date, plan_data")
        .eq("user_id", user.id)
        .in("plan_date", dateStrings);

      if (error) {
        console.error("Error fetching plans for prep mode:", error);
        setLoading(false);
        return;
      }

      // 2. Generate the prep list and steps using our engine
      const components = generatePrepList(dailyPlans);
      const steps = generatePrepSteps(components);

      setPrepComponents(components);
      setPrepSteps(steps);
      setLoading(false);
    };

    fetchAndGeneratePrepPlan();
  }, [daysToPrep]); // Recalculează dacă utilizatorul schimbă numărul de zile

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Prep Mode</h1>
            <p className="text-slate-500">
              Your smart cooking assistant for the week.
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            How many days do you want to prep for?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={daysToPrep === 3 ? "default" : "outline"}
            onClick={() => setDaysToPrep(3)}
          >
            Next 3 Days
          </Button>
          <Button
            variant={daysToPrep === 5 ? "default" : "outline"}
            onClick={() => setDaysToPrep(5)}
          >
            Next 5 Days
          </Button>
          <Button
            variant={daysToPrep === 7 ? "default" : "outline"}
            onClick={() => setDaysToPrep(7)}
          >
            Next 7 Days
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Column 1: What to Prep */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils /> What to Prep
            </CardTitle>
            <CardDescription>
              These are the base components you'll cook now and use later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prepComponents.length > 0 ? (
              prepComponents.map((group) => (
                <div key={group.groupName}>
                  <h3 className="font-semibold mb-2 text-lg">
                    {group.groupName}
                  </h3>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
                      >
                        <span>{item.name}</span>
                        <span className="font-mono text-slate-500">
                          {item.totalAmount}
                          {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-slate-500">
                No components to prep for the selected period.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Column 2: How to Prep */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList /> How to Prep
            </CardTitle>
            <CardDescription>
              Follow this optimized checklist for maximum efficiency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prepSteps.length > 0 ? (
              prepSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Checkbox id={`step-${index}`} />
                  <label
                    htmlFor={`step-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {step.text}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No steps to show.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
