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
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

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
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // --- STAREA NOUĂ PENTRU EVIDENȚIERE ---
  const [highlightedIngredients, setHighlightedIngredients] = useState(
    new Set()
  );

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("prep_status")
        .eq("id", user.id)
        .single();

      if (profile?.prep_status) {
        setCurrentPrepStatus(profile.prep_status);
      }

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

      const components = generatePrepList(dailyPlans);
      const steps = generatePrepSteps(components);

      // --- LOG 1: Verificăm pașii generați ---
      console.log("[LOG 1] Pașii generați (verifică ingredientIds):", steps);

      setPrepComponents(components);
      setPrepSteps(steps);
      setCompletedSteps(new Set());
      setActiveStepIndex(0); // Resetăm și pasul activ
      setLoading(false);
    };

    fetchAndGeneratePrepPlan();
  }, [daysToPrep, router]);

  // --- HOOK-UL NOU PENTRU A ACTUALIZA EVIDENȚIEREA ---
  useEffect(() => {
    if (prepSteps.length > 0 && prepSteps[activeStepIndex]) {
      const currentStep = prepSteps[activeStepIndex];
      const idsToHighlight = new Set(currentStep.ingredientIds || []);

      // --- LOG 2: Verificăm ce ID-uri se evidențiază ---
      console.log(
        `[LOG 2] Pasul activ ${activeStepIndex}. Se evidențiază ID-urile:`,
        idsToHighlight
      );

      setHighlightedIngredients(idsToHighlight);
    }
  }, [activeStepIndex, prepSteps]);

  const handleMarkAsPrepped = async () => {
    if (!userId || prepComponents.length === 0) {
      toast.error("No components to mark as prepped.");
      return;
    }
    setSaving(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysToPrep);
      const prepStatus = {
        components: prepComponents,
        preppedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        daysPrepped: daysToPrep,
      };
      const { error } = await supabase
        .from("profiles")
        .update({ prep_status: prepStatus })
        .eq("id", userId);
      if (error) throw error;
      confetti({
        particleCount: 150, // Numărul de bucățele de confetti
        spread: 90, // Cât de larg se împrăștie
        origin: { y: 0.6 }, // De unde pornește (puțin mai jos de centru)
        zIndex: 1000, // Se asigură că este deasupra celorlalte elemente
      });
      setCurrentPrepStatus(prepStatus);
      toast.success(
        `Great! Prep mode activated for the next ${daysToPrep} days. Your meal plans are being updated...`
      );
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
      if (error) throw error;
      setCurrentPrepStatus(null);
      toast.success("Prep status cleared! Redirecting to dashboard...");
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
    const newSet = new Set(completedSteps);
    if (newSet.has(stepId)) {
      newSet.delete(stepId);
      setCompletedSteps(newSet);
    } else {
      newSet.add(stepId);
      setCompletedSteps(newSet);
      if (activeStepIndex < prepSteps.length - 1) {
        setTimeout(() => {
          setActiveStepIndex(activeStepIndex + 1);
        }, 300);
      }
    }
  };

  const allStepsCompleted =
    prepSteps.length > 0 && completedSteps.size === prepSteps.length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-4"
          >
            <ChefHat className="h-10 w-10 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Your Weekly Headstart
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Prep once, eat well all week. Let's get cooking.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </motion.div>
        </header>

        <main className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            {currentPrepStatus ? (
              <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <CardTitle className="text-green-700 dark:text-green-400">
                        Prep Mode is Active
                      </CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearPrepStatus}
                      disabled={saving}
                    >
                      {saving ? "Clearing..." : "Clear Prep Status"}
                    </Button>
                  </div>
                  <CardDescription className="pt-1">
                    Ready to use until{" "}
                    <span className="font-semibold">
                      {new Date(
                        currentPrepStatus.expiresAt
                      ).toLocaleDateString()}
                    </span>
                    .
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Prep Window</CardTitle>
                  <CardDescription>
                    How many days of effortless eating are you aiming for?
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    variant={daysToPrep === 3 ? "default" : "outline"}
                    onClick={() => setDaysToPrep(3)}
                  >
                    3 Days
                  </Button>
                  <Button
                    variant={daysToPrep === 5 ? "default" : "outline"}
                    onClick={() => setDaysToPrep(5)}
                  >
                    5 Days
                  </Button>
                  <Button
                    variant={daysToPrep === 7 ? "default" : "outline"}
                    onClick={() => setDaysToPrep(7)}
                  >
                    7 Days
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* --- AICI ESTE STRUCTURA CORECTATĂ --- */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* --- Coloana 1: Your Prep List --- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils /> Your Prep List
                  </CardTitle>
                  <CardDescription>
                    The building blocks for your upcoming meals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {prepComponents.length > 0 ? (
                    <AnimatePresence>
                      {prepComponents.map((group, index) => (
                        <motion.div
                          key={group.groupName}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <h3 className="font-semibold mb-2 text-lg">
                            {group.groupName}
                          </h3>
                          <ul className="space-y-2">
                            {group.items.map((item) => {
                              // --- LOGICA DE EVIDENȚIERE APLICATĂ AICI ---
                              const isHighlighted = highlightedIngredients.has(
                                item.id
                              );
                              if (isHighlighted) {
                                console.log(
                                  `[LOG 3] Se aplică stilul pentru: ${item.name} (ID: ${item.id})`
                                );
                              }
                              return (
                                <li
                                  key={item.id}
                                  className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-300 ${
                                    isHighlighted
                                      ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500"
                                      : "bg-slate-100 dark:bg-slate-800/50"
                                  }`}
                                >
                                  <span>{item.name}</span>
                                  <span className="font-mono text-slate-500">
                                    {item.totalAmount}
                                    {item.unit}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <p className="text-slate-500 text-center pt-10">
                      No components to prep.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* --- Coloana 2: Your Action Plan (Focus Mode) --- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            >
              <Card className="flex-grow flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList /> Your Action Plan
                  </CardTitle>
                  <CardDescription>
                    One step at a time. Focus and flow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center items-center">
                  {prepSteps.length > 0 ? (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-6">
                        <motion.div
                          className="bg-blue-500 h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              (completedSteps.size / prepSteps.length) * 100
                            }%`,
                          }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                      </div>
                      <AnimatePresence mode="wait">
                        {prepSteps.map(
                          (step, index) =>
                            index === activeStepIndex && (
                              <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="w-full flex items-center gap-4 p-6 rounded-xl bg-slate-100 dark:bg-slate-800/50"
                              >
                                <Checkbox
                                  id={`step-${index}`}
                                  checked={completedSteps.has(step.id)}
                                  onCheckedChange={() =>
                                    handleStepToggle(step.id)
                                  }
                                  className="h-8 w-8"
                                />
                                <label
                                  htmlFor={`step-${index}`}
                                  className="text-lg font-semibold leading-tight flex-grow cursor-pointer"
                                >
                                  {step.text}
                                </label>
                              </motion.div>
                            )
                        )}
                      </AnimatePresence>
                      <div className="mt-8 w-full">
                        <Button
                          size="lg"
                          onClick={handleMarkAsPrepped}
                          disabled={saving || !allStepsCompleted}
                          className="w-full transition-all duration-300"
                        >
                          {saving ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              Activate Prep Mode
                            </>
                          )}
                        </Button>
                        {!allStepsCompleted && (
                          <p className="text-xs text-center text-slate-500 mt-2">
                            {prepSteps.length - completedSteps.size} step
                            {prepSteps.length - completedSteps.size !== 1
                              ? "s"
                              : ""}{" "}
                            remaining
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center">
                      No steps to show.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
