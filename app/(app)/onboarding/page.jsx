// app/(app)/onboarding/page.jsx
import { OnboardingForm } from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100">
        Almost There...
      </h1>
      <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
        Let's create your personalized plan.
      </p>
      <OnboardingForm />
    </div>
  );
}
