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
import { Utensils, ClipboardList, ChefHat, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function PrepModePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prepComponents, setPrepComponents] = useState([]);
  const [prepSteps, setPrepSteps] = useState([]);
  const [daysToPrep, setDaysToPrep] = useState(3);
  const [userId, setUserId] = useState(null);
  const [currentPrepStatus, setCurrentPrepStatus] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  useEffect(() => {
    const fetchAndGeneratePrepPlan = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Verificăm statusul de prep curent
      const { data: profile } = await supabase
        .from("profiles")
        .select("prep_status")
        .eq("id", user.id)
        .single();

      if (profile?.prep_status) {
        setCurrentPrepStatus(profile.prep_status);
      }

      // Fetch plans for the selected number of days
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
        toast.error("Could not load meal plans.");
        setLoading(false);
        return;
      }

      // Generate the prep list and steps
      const components = generatePrepList(dailyPlans);
      const steps = generatePrepSteps(components);

      setPrepComponents(components);
      setPrepSteps(steps);
      setCompletedSteps(new Set()); // Reset checkbox-urile când se schimbă perioada
      setLoading(false);
    };

    fetchAndGeneratePrepPlan();
  }, [daysToPrep, router]);

  const handleMarkAsPrepped = async () => {
    if (!userId || prepComponents.length === 0) {
      toast.error("No components to mark as prepped.");
      return;
    }

    setSaving(true);

    try {
      // MODIFICAT: Calculăm data de expirare pe baza numărului de zile selectat
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysToPrep);

      const prepStatus = {
        components: prepComponents,
        preppedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        daysPrepped: daysToPrep, // Numărul de zile pentru care sunt valabile componentele
      };

      // Salvăm în profil
      const { error } = await supabase
        .from("profiles")
        .update({ prep_status: prepStatus })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      setCurrentPrepStatus(prepStatus);
      toast.success(
        `Great! Prep mode activated for the next ${daysToPrep} days. Your meal plans are being updated...`
      );

      // Redirect cu parametrul refresh pentru a regenera planurile
      setTimeout(() => {
        router.push("/dashboard?refresh=true");
      }, 1500);
    } catch (error) {
      console.error("Error saving prep status:", error);
      toast.error("Could not save prep status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearPrepStatus = async () => {
    if (!userId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ prep_status: null })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      setCurrentPrepStatus(null);
      toast.success("Prep status cleared! Redirecting to dashboard...");

      // Redirect to dashboard after clearing
      setTimeout(() => {
        router.push("/dashboard?refresh=true");
      }, 1000);
    } catch (error) {
      console.error("Error clearing prep status:", error);
      toast.error("Could not clear prep status.");
      setSaving(false);
    }
  };

  const handleStepToggle = (stepId) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const allStepsCompleted =
    prepSteps.length > 0 && completedSteps.size === prepSteps.length;

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

      {/* Status banner */}
      {currentPrepStatus && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-700 dark:text-green-400">
                  Components Already Prepped
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPrepStatus}
                disabled={saving}
              >
                Clear Prep Status
              </Button>
            </div>
            <CardDescription>
              Prepped on:{" "}
              {new Date(currentPrepStatus.preppedAt).toLocaleDateString()} |
              Expires:{" "}
              {new Date(currentPrepStatus.expiresAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

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
              <>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    ✓ {completedSteps.size} of {prepSteps.length} steps
                    completed
                  </p>
                  {!allStepsCompleted && (
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      Complete all steps to activate prep mode
                    </p>
                  )}
                </div>
                {prepSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <Checkbox
                      id={`step-${index}`}
                      checked={completedSteps.has(step.id)}
                      onCheckedChange={() => handleStepToggle(step.id)}
                    />
                    <label
                      htmlFor={`step-${index}`}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${
                        completedSteps.has(step.id)
                          ? "line-through text-slate-500"
                          : ""
                      }`}
                    >
                      {step.text}
                    </label>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-slate-500">No steps to show.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      {prepComponents.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          {!allStepsCompleted && (
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                📋 Complete all prep steps above to activate prep mode
              </p>
            </div>
          )}
          <Button
            size="lg"
            onClick={handleMarkAsPrepped}
            disabled={saving || !allStepsCompleted}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                I've Prepped Everything!
              </>
            )}
          </Button>
          {!allStepsCompleted && (
            <p className="text-xs text-slate-500">
              {prepSteps.length - completedSteps.size} step
              {prepSteps.length - completedSteps.size !== 1 ? "s" : ""}{" "}
              remaining
            </p>
          )}
        </div>
      )}
    </div>
  );
}
