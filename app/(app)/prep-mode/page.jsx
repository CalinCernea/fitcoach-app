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
  const [periodSelected, setPeriodSelected] = useState(false);

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

  const handleStepToggle = (stepId, index) => {
    const newSet = new Set(completedSteps);

    if (newSet.has(stepId)) {
      // Dacă debifăm, doar actualizăm starea
      newSet.delete(stepId);
      setCompletedSteps(newSet);
    } else {
      // Dacă bifăm, actualizăm starea și avansăm
      newSet.add(stepId);
      setCompletedSteps(newSet);

      // Setăm pasul curent la cel pe care am dat click, pentru a actualiza focusul
      setActiveStepIndex(index);

      // Și avansăm automat la următorul pas, dacă nu e ultimul
      if (index < prepSteps.length - 1) {
        setTimeout(() => {
          setActiveStepIndex(index + 1);
        }, 400); // O mică întârziere pentru animație
      }
    }
  };

  const goToPrevStep = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
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
        {/* ================== HEADER ================== */}
        <header className="flex justify-between items-center mb-6">
          {/* ... conținutul header-ului rămâne neschimbat ... */}
        </header>

        {/* ================== MAIN CONTENT AREA (Master-Detail) ================== */}
        <main className="flex flex-col gap-8">
          {/* Cardul 1: Apare mereu la început dacă nu e activat prep mode */}
          <AnimatePresence>
            {!currentPrepStatus && !periodSelected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>1. Choose Your Prep Window</CardTitle>
                    <CardDescription>
                      How many days of effortless eating are you aiming for?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button
                      variant={daysToPrep === 3 ? "default" : "outline"}
                      onClick={() => {
                        setDaysToPrep(3);
                        setPeriodSelected(true);
                      }}
                    >
                      3 Days
                    </Button>
                    <Button
                      variant={daysToPrep === 5 ? "default" : "outline"}
                      onClick={() => {
                        setDaysToPrep(5);
                        setPeriodSelected(true);
                      }}
                    >
                      5 Days
                    </Button>
                    <Button
                      variant={daysToPrep === 7 ? "default" : "outline"}
                      onClick={() => {
                        setDaysToPrep(7);
                        setPeriodSelected(true);
                      }}
                    >
                      7 Days
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cardul de Status: Apare dacă prep mode este deja activ */}
          {currentPrepStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
            </motion.div>
          )}

          {/* Layout-ul Master-Detail: Apare doar DUPĂ ce s-a selectat perioada sau dacă prep mode e deja activ */}
          {(periodSelected || currentPrepStatus) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid md:grid-cols-12 gap-8"
            >
              {/* --- COLOANA STÂNGA: "MASTER" --- */}
              <div className="md:col-span-5 space-y-6">
                {/* Card Prep List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Utensils />{" "}
                      {currentPrepStatus
                        ? "Prepped Components"
                        : "2. Your Prep List"}
                    </CardTitle>
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
                                const isHighlighted =
                                  highlightedIngredients.has(item.id);
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

                {/* Card Action Plan (lista completă) */}
              </div>

              {/* --- COLOANA DREAPTA: "DETAIL" --- */}
              {!currentPrepStatus && (
                <div className="md:col-span-7">
                  <div className="sticky top-24">
                    <Card className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-2xl">
                      <CardHeader>
                        <p className="text-sm font-semibold text-blue-500">
                          FOCUS ON: STEP {activeStepIndex + 1} OF{" "}
                          {prepSteps.length}
                        </p>
                        <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2 mt-2">
                          <motion.div
                            className="bg-blue-500 h-2 rounded-full"
                            animate={{
                              width: `${
                                ((activeStepIndex + 1) / prepSteps.length) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="py-10 md:py-20">
                        <AnimatePresence mode="wait">
                          {prepSteps[activeStepIndex] && (
                            <motion.div
                              key={activeStepIndex}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -30 }}
                              transition={{ duration: 0.4, ease: "circOut" }}
                              className="text-center"
                            >
                              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                {prepSteps[activeStepIndex].text}
                              </h2>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                      <div className="p-6 border-t dark:border-slate-700/50">
                        <Button
                          size="lg"
                          onClick={() => {
                            // Dacă pasul nu e completat, îl marcăm și avansăm
                            if (
                              !completedSteps.has(prepSteps[activeStepIndex].id)
                            ) {
                              handleStepToggle(
                                prepSteps[activeStepIndex].id,
                                activeStepIndex
                              );
                            } else {
                              // Dacă e deja completat, doar avansăm
                              if (activeStepIndex < prepSteps.length - 1) {
                                setActiveStepIndex(activeStepIndex + 1);
                              }
                            }
                          }}
                          disabled={
                            saving ||
                            // Se dezactivează doar dacă e ultimul pas ȘI e completat
                            (completedSteps.has(
                              prepSteps[activeStepIndex]?.id
                            ) &&
                              activeStepIndex === prepSteps.length - 1)
                          }
                          className="w-full"
                        >
                          {(() => {
                            const isCompleted = completedSteps.has(
                              prepSteps[activeStepIndex]?.id
                            );
                            const isLastStep =
                              activeStepIndex === prepSteps.length - 1;

                            if (isCompleted && isLastStep) {
                              return (
                                <>
                                  <CheckCircle2 className="mr-2 h-5 w-5" />
                                  All Steps Done!
                                </>
                              );
                            }
                            if (isCompleted) {
                              return "Next Step";
                            }
                            return "Mark as Done";
                          })()}
                        </Button>

                        {/* --- BUTONUL NOU ADAUGAT AICI --- */}
                        <div className="text-center mt-4">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={goToPrevStep}
                            disabled={activeStepIndex === 0}
                            className="text-slate-500"
                          >
                            Go to Previous Step
                          </Button>
                        </div>
                        {/* -------------------------------- */}
                      </div>
                    </Card>
                    {allStepsCompleted && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6"
                      >
                        <Button
                          size="lg"
                          onClick={handleMarkAsPrepped}
                          disabled={saving}
                          className="w-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                        >
                          {saving
                            ? "Saving..."
                            : "All Done! Activate Prep Mode"}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
