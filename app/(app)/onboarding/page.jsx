// app/(app)/onboarding/page.jsx
"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

// --- MODIFICARE CHEIE AICI ---
// Importăm componenta OnboardingForm în mod dinamic și dezactivăm randarea pe server (ssr: false)
const OnboardingForm = dynamic(
  () => import("@/components/OnboardingForm").then((mod) => mod.OnboardingForm),
  {
    ssr: false, // Aceasta este partea cea mai importantă!
    loading: () => (
      <div className="w-full h-screen bg-slate-50 dark:bg-slate-950" />
    ), // Un placeholder simplu
  }
);

export default function OnboardingPage() {
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);
  return <OnboardingForm />;
}
