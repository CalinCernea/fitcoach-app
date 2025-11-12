// app/(marketing)/page.js
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// --- Componenta Principală a Paginii ---
export default function LandingPage() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end end"],
  });

  // Transformăm progresul scroll-ului în valori de animație
  const scale = useTransform(scrollYProgress, [0.1, 0.3, 0.8], [0.8, 1, 0.8]);
  const x = useTransform(scrollYProgress, [0.4, 0.8], ["0%", "-80%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  return (
    <div className="bg-white dark:bg-black text-slate-900 dark:text-white">
      {/* --- Header --- */}
      <header className="fixed top-0 left-0 w-full z-20 backdrop-blur-md bg-white/50 dark:bg-black/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            FitCoach
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/onboarding">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ================================================== */}
        {/* SECȚIUNEA 1: THE HERO - TITLU MASIV ȘI CURAT       */}
        {/* ================================================== */}
        <section className="h-screen flex flex-col justify-center items-center text-center relative">
          <div className="container px-6">
            <Badge variant="secondary" className="mb-6">
              <Zap className="h-3 w-3 mr-1.5" /> Your Nutrition, Solved.
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
              The End of Dieting.
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent mt-2">
              The Start of Results.
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
              Stop the guesswork. We build the perfect meal plan for your body
              and goals. You just follow it.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild className="text-lg">
                <Link href="/onboarding">
                  Build My Plan <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="absolute bottom-8 text-sm text-slate-500 animate-bounce">
            Scroll to discover
          </div>
        </section>

        {/* ================================================== */}
        {/* SECȚIUNEA 2: THE REVEAL - ANIMAȚIE LA SCROLL      */}
        {/* ================================================== */}
        <section ref={targetRef} className="h-[300vh] relative">
          <div className="sticky top-0 h-screen flex items-center justify-start overflow-hidden">
            <motion.div style={{ x }} className="flex gap-8">
              {/* --- CARD 1: PERSONALIZARE --- */}
              <FeatureCard
                scale={scale}
                opacity={opacity}
                title="A Plan Built Only For You."
                description="Your body is unique. Your plan should be too. We analyze your stats, goals, and lifestyle to create a nutritional blueprint that is 100% yours."
                image="/images/feature-onboarding.png" // Asigură-te că ai aceste imagini
              />

              {/* --- CARD 2: COMMAND CENTER --- */}
              <FeatureCard
                scale={scale}
                opacity={opacity}
                title="Your Daily Command Center."
                description="No more confusion. Your dashboard shows you exactly what to eat, when to eat, and tracks your progress live. It's your entire day, at a glance."
                image="/images/feature-dashboard.png"
              />

              {/* --- CARD 3: FLEXIBILITATE --- */}
              <FeatureCard
                scale={scale}
                opacity={opacity}
                title="Food You Actually Love."
                description="Don't like a meal? Swap it with one click. Our smart system finds a delicious alternative that keeps you on track with your goals."
                image="/images/feature-swap.png"
              />

              {/* --- CARD 4: EFICIENȚĂ --- */}
              <FeatureCard
                scale={scale}
                opacity={opacity}
                title="Save Hours Every Week."
                description="Our intelligent Prep Mode and automated Shopping Lists turn hours of planning and cooking into minutes. More results, less stress."
                image="/images/feature-prep.png"
              />
            </motion.div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECȚIUNEA 3: FINAL CTA - SIMPLU ȘI PUTERNIC       */}
        {/* ================================================== */}
        <section className="h-screen flex flex-col justify-center items-center text-center">
          <div className="container px-6">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">
              Ready for the change?
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
              Your personalized blueprint to a better body is waiting. The plan
              is free. The only cost is your old excuses.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                asChild
                className="text-lg bg-blue-600 hover:bg-blue-700 text-white scale-110"
              >
                <Link href="/onboarding">
                  Start My Transformation <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// --- Componenta Helper pentru Cardurile Animate ---
function FeatureCard({ scale, opacity, title, description, image }) {
  return (
    <motion.div
      style={{ scale, opacity }}
      className="w-screen h-screen flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-8"
    >
      <div className="lg:w-1/2">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
      <div className="lg:w-1/2 p-8">
        <img
          src={image}
          alt={title}
          className="rounded-2xl shadow-2xl object-contain"
        />
      </div>
    </motion.div>
  );
}
