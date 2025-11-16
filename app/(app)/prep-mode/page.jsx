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
    const checkInitialStatus = async () => {
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
        const activePrep = profile.prep_status;
        setCurrentPrepStatus(activePrep);

        // --- THIS IS THE FIX ---
        // We take the components saved in the profile and load them into our state.
        setPrepComponents(activePrep.components || []);
        // -----------------------

        // If it has a status, we also set the period as selected to show the cards
        setPeriodSelected(true);
      }
      setLoading(false);
    };

    checkInitialStatus();
  }, [router]); // <-- Am scos daysToPrep

  // 2. O funcție nouă pe care o vom apela la click pe butonul de confirmare
  const handleGeneratePlan = async () => {
    if (!userId) return;

    setLoading(true); // Afișăm un spinner pe toată pagina

    const dateStrings = Array.from({ length: daysToPrep }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    const { data: dailyPlans, error } = await supabase
      .from("daily_meal_plans")
      .select("plan_date, plan_data")
      .eq("user_id", userId)
      .in("plan_date", dateStrings);

    if (error) {
      toast.error("Could not load meal plans.");
      setLoading(false);
      return;
    }

    const components = generatePrepList(dailyPlans);
    const steps = generatePrepSteps(components);

    setPrepComponents(components);
    setPrepSteps(steps);
    setCompletedSteps(new Set());
    setActiveStepIndex(0);
    setPeriodSelected(true); // Confirmăm că perioada e selectată și trecem la pasul 2
    setLoading(false);
  };

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

  useEffect(() => {
    // Condiția pentru starea inițială
    const isInitialState = !periodSelected && !currentPrepStatus;

    if (isInitialState) {
      // Dacă suntem în starea inițială, blocăm scroll-ul pe întreaga pagină
      document.body.classList.add("overflow-hidden");
    } else {
      // Dacă ieșim din starea inițială, permitem din nou scroll-ul
      document.body.classList.remove("overflow-hidden");
    }

    // Funcția de curățare: se asigură că scroll-ul este reactivat
    // dacă utilizatorul părăsește pagina Prep Mode.
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [periodSelected, currentPrepStatus]);

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
    <div
      className={`w-full bg-slate-50 dark:bg-slate-950 transition-all duration-500 ${
        !periodSelected && !currentPrepStatus
          ? "h-screen flex flex-col justify-center p-4" // Stil pentru starea inițială (fix, centrat)
          : "min-h-screen p-4 sm:p-6 md:p-8" // Stil pentru starea normală (cu scroll)
      }`}
    >
      <div className="w-full max-w-7xl mx-auto">
        {/* ================== HEADER ================== */}
        <header className="flex justify-between items-center mb-6">
          {/* Partea stângă a header-ului cu titlul */}
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

          {/* --- ADAUGĂ ACEST BLOC PENTRU BUTON --- */}
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
          {/* ----------------------------------------- */}
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
                      Select how many days of effortless eating you're aiming
                      for. This will generate your prep list.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Containerul pentru noile carduri de selecție */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Card Opțiune 1: 3 Zile */}
                      <div
                        onClick={() => setDaysToPrep(3)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          daysToPrep === 3
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {daysToPrep === 3 && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        <h3 className="text-2xl font-bold">3 Days</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          A quick start.
                        </p>
                      </div>

                      {/* Card Opțiune 2: 5 Zile */}
                      <div
                        onClick={() => setDaysToPrep(5)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          daysToPrep === 5
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {daysToPrep === 5 && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        <h3 className="text-2xl font-bold">5 Days</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Cover the work week.
                        </p>
                      </div>

                      {/* Card Opțiune 3: 7 Zile */}
                      <div
                        onClick={() => setDaysToPrep(7)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          daysToPrep === 7
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {daysToPrep === 7 && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        <h3 className="text-2xl font-bold">7 Days</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          The full week sorted.
                        </p>
                      </div>
                    </div>

                    {/* Butonul de confirmare apare sub carduri */}
                    <div className="mt-6">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handleGeneratePlan}
                      >
                        Confirm and Generate Plan
                      </Button>
                    </div>
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
            >
              {/* --- CONDIȚIA CHEIE: Afișăm un layout diferit dacă prep mode e activ --- */}
              {currentPrepStatus ? (
                // =================================================
                // NOU: VEDEREA COMPACTĂ PENTRU "PREP MODE ACTIV"
                // =================================================
                <Card>
                  <CardHeader>
                    <CardTitle>Your Prepped Inventory</CardTitle>
                    <CardDescription>
                      These components are ready to be used in your meals.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {prepComponents.length > 0 ? (
                      <div className="space-y-6">
                        {prepComponents.map((group) => (
                          <div key={group.groupName}>
                            <h3 className="font-semibold text-lg mb-3 border-b pb-2 dark:border-slate-700">
                              {group.groupName}
                            </h3>
                            {/* Containerul pentru "Tag Cloud" */}
                            <div className="flex flex-wrap gap-3">
                              {group.items.map((item, index) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.03 }}
                                  className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2"
                                >
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  <span className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-700 rounded-full px-2 py-0.5">
                                    {item.totalAmount}
                                    {item.unit}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-10">
                        No prepped components found.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // =================================================
                // VECHI: LAYOUT-UL "MASTER-DETAIL" PENTRU PROCESUL DE PREP
                // =================================================
                <div className="grid md:grid-cols-12 gap-8">
                  {/* --- COLOANA STÂNGA: "MASTER" --- */}
                  <div className="md:col-span-5 space-y-6">
                    {/* Card Prep List */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Utensils /> 2. Your Prep List
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
                  </div>

                  {/* --- COLOANA DREAPTA: "DETAIL" --- */}
                  <div className="md:col-span-7">
                    {!currentPrepStatus && (
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
                                    ((activeStepIndex + 1) / prepSteps.length) *
                                    100
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
                                  transition={{
                                    duration: 0.4,
                                    ease: "circOut",
                                  }}
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
                                if (
                                  !completedSteps.has(
                                    prepSteps[activeStepIndex].id
                                  )
                                ) {
                                  handleStepToggle(
                                    prepSteps[activeStepIndex].id,
                                    activeStepIndex
                                  );
                                } else {
                                  if (activeStepIndex < prepSteps.length - 1) {
                                    setActiveStepIndex(activeStepIndex + 1);
                                  }
                                }
                              }}
                              disabled={
                                saving ||
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
