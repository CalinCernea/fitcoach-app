// app/(marketing)/page.js
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* --- NOU: Header pentru Navigare --- */}
      <header className="absolute top-0 left-0 w-full z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Numele Aplicației / Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-slate-900 dark:text-white"
          >
            FitCoach
          </Link>

          {/* Butoanele de Acțiune */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="default" asChild>
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="text-center pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Stop Guessing. Start Seeing Results.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg lg:text-xl text-slate-600 dark:text-slate-400">
              Your personalized fitness and nutrition plan is one click away. We
              do the math, you do the work. Get the body you&apos;ve always
              wanted, guided by science.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="text-lg shadow-lg shadow-blue-500/20"
              >
                <Link href="/onboarding">
                  Create My Free Plan <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Free to start. No credit card required.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Your Path to Success in 3 Simple Steps
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                From plan to progress, faster than ever.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 mx-auto mb-4">
                  <span className="text-3xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                  Tell Us About You
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Complete a 2-minute quiz about your body, goals, and
                  lifestyle. This is the key to your unique plan.
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 mx-auto mb-4">
                  <span className="text-3xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                  Get Your Custom Plan
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Our algorithm instantly calculates your ideal calories &
                  macros and generates a starting workout plan.
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 mx-auto mb-4">
                  <span className="text-3xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                  Track & Adapt
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Log your meals and workouts. Our system auto-adjusts your plan
                  to keep you on track when progress stalls.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">
              Ready to Build Your Dream Body?
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-blue-100">
              Your future self will thank you. The plan is free. The only thing
              it costs is an excuse.
            </p>
            <div className="mt-8">
              {/* --- AICI ESTE CORECȚIA --- */}
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="text-lg shadow-lg"
              >
                <Link href="/onboarding">
                  Start My Transformation Now{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
