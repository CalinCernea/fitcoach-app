// components/OnboardingForm.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SilhouetteMale } from "./icons/SilhouetteMale";
import { SilhouetteFemale } from "./icons/SilhouetteFemale";
import { Player } from "@lottiefiles/react-lottie-player";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  LayoutGroup,
} from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Flame,
  Zap,
  HeartPulse,
  PersonStanding,
  ChevronDown,
} from "lucide-react";

// --- Datele pentru opțiunile vizuale ---
const goals = [
  { id: "lose_weight", label: "Lose Weight", icon: Flame },
  { id: "gain_muscle", label: "Gain Muscle", icon: Zap },
  { id: "overall_health", label: "Improve Health", icon: HeartPulse },
];
const activities = [
  {
    id: "sedentary",
    label: "Mostly Seated",
    description: "Office job, minimal movement",
  },
  {
    id: "lightly_active",
    label: "Lightly Active",
    description: "Walks, light exercise 1-2 days/week",
  },
  {
    id: "active",
    label: "Active",
    description: "Moderate exercise 3-5 days/week",
  },
  {
    id: "very_active",
    label: "Very Active",
    description: "Intense exercise or physical job",
  },
];

// --- Logica de calcul (păstrată intact) ---
const calculateAdvancedMetrics = (data) => {
  const { sex, weight, height, dob, activity, goal, weeklyTarget } = data;
  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  let bmr;
  if (sex === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * activityMultipliers[activity];
  const weeklyCaloricChange = weeklyTarget * 7700;
  const dailyCaloricChange = weeklyCaloricChange / 7;
  let targetCalories;
  if (goal.includes("lose") || goal.includes("leaner")) {
    targetCalories = tdee - dailyCaloricChange;
  } else if (goal.includes("gain")) {
    targetCalories = tdee + dailyCaloricChange;
  } else {
    targetCalories = tdee;
  }
  const proteinGrams = weight * 1.8;
  const proteinCalories = proteinGrams * 4;
  const fatCalories = targetCalories * 0.25;
  const fatGrams = fatCalories / 9;
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = carbCalories / 4;
  return {
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    targetProtein: Math.round(proteinGrams),
    targetCarbs: Math.round(carbsGrams),
    targetFats: Math.round(fatGrams),
    daily_water_target: Math.round(weight * 35),
  };
};

// --- Componenta Principală ---
export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    dob: "1995-01-01",
    sex: "male",
    height: 180,
    weight: 80,
    activity: "lightly_active",
    goal: "lose_weight",
    weeklyTarget: 0.5,
  });
  const [direction, setDirection] = useState(1);

  const totalSteps = 6; // Am actualizat la 6 pași

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    setStep(totalSteps + 1); // Trecem la ecranul de calcul
    setTimeout(() => {
      const calculatedResults = calculateAdvancedMetrics(formData);
      const dataToStore = {
        onboardingData: formData,
        planResults: calculatedResults,
      };
      localStorage.setItem("onboardingSession", JSON.stringify(dataToStore));
      router.push("/signup");
    }, 2500); // Simulează un calcul de 2.5 secunde
  };

  const variants = {
    enter: (direction) => ({ opacity: 0, scale: 0.95 }),
    center: { opacity: 1, scale: 1 },
    exit: (direction) => ({ opacity: 0, scale: 0.95 }),
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* ================== HEADER FIX ================== */}
      <header className="flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className={
              step === 1 || step > totalSteps ? "invisible" : "visible"
            }
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <div className="flex-grow max-w-sm mx-4">
            <AnimatePresence>
              {step <= totalSteps && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Progress value={(step / totalSteps) * 100} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={step === 1 && formData.name.trim() === ""} // <-- CONDIȚIA DE DEZACTIVARE
            className={
              // Ascunde butonul la pașii 3 și 6
              step === 3 || step >= totalSteps
                ? "invisible"
                : // La pasul 1, dacă numele e gol, fă-l transparent și nu interactiv
                step === 1 && formData.name.trim() === ""
                ? "opacity-50 cursor-not-allowed"
                : // Altfel, fă-l vizibil
                  "visible"
            }
          >
            Next <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* ================== CONTAINER DE CONȚINUT SCROLLABIL INTERN ================== */}
      <main className="flex-grow relative overflow-y-auto flex flex-col justify-center">
        <LayoutGroup>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", ease: "circOut", duration: 0.5 }}
              className="w-full px-2" // Am adăugat un mic padding orizontal
            >
              {/* Aici, am învelit fiecare scenă într-un div pentru a asigura centrarea corectă */}
              <div className="max-w-3xl mx-auto flex flex-col justify-center min-h-[45vh]">
                {step === 1 && (
                  <StepName
                    value={formData.name}
                    onChange={handleChange}
                    onNext={handleNext}
                  />
                )}
                {step === 2 && (
                  <StepDemographics
                    formData={formData}
                    onChange={handleChange}
                  />
                )}
                {step === 3 && (
                  <StepGoal
                    name={formData.name}
                    value={formData.goal}
                    onChange={handleChange}
                    onNext={handleNext}
                  />
                )}
                {step === 4 && (
                  <StepMeasurements
                    formData={formData}
                    onChange={handleChange}
                  />
                )}
                {step === 5 && (
                  <StepActivity
                    value={formData.activity}
                    onChange={handleChange}
                    onNext={handleNext}
                  />
                )}
                {step === 6 && (
                  <StepWeeklyTarget
                    formData={formData}
                    onChange={handleChange}
                  />
                )}
                {step === totalSteps + 1 && <StepCalculating />}
              </div>
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </main>

      {/* ================== FOOTER FIX ================== */}
      <footer className="flex-shrink-0 h-20 flex items-center justify-center">
        {step === totalSteps && (
          <Button
            size="lg"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Build My Blueprint <Sparkles className="ml-2 w-4 h-4" />
          </Button>
        )}
      </footer>
    </div>
  );
}

// --- Componente Helper pentru Scene ---

const AnimatedTitle = ({ children }) => (
  <motion.h2
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className="text-3xl md:text-4xl font-bold text-center mb-8"
  >
    {children}
  </motion.h2>
);

const StepName = ({ value, onChange, onNext }) => {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="text-center" onClick={() => inputRef.current?.focus()}>
      <AnimatedTitle>First, what should we call you?</AnimatedTitle>
      <div className="relative max-w-lg mx-auto text-center text-3xl md:text-4xl font-bold p-8 cursor-text">
        <span className="text-slate-400 dark:text-slate-600">Hi, I'm </span>
        <span className="text-blue-500">{value}</span>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="inline-block h-10 w-1 bg-blue-500 align-middle"
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange("name", e.target.value)}
          className="absolute top-0 left-0 w-0 h-0 opacity-0"
          aria-hidden="true"
        />
      </form>
    </div>
  );
};

const StepDemographics = ({ formData, onChange }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 83 }, (_, i) => currentYear - 14 - i);
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  const dob = new Date(formData.dob);
  const selectedYear = dob.getFullYear();
  const selectedMonth = dob.getMonth();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateChange = (part, value) => {
    const newDob = new Date(formData.dob);
    if (part === "year") newDob.setFullYear(value);
    if (part === "month") newDob.setMonth(value);
    if (part === "day") newDob.setDate(value);

    // Corecție pentru zile invalide (ex: 31 Februarie)
    if (part === "year" || part === "month") {
      const newDaysInMonth = new Date(
        newDob.getFullYear(),
        newDob.getMonth() + 1,
        0
      ).getDate();
      if (newDob.getDate() > newDaysInMonth) {
        newDob.setDate(newDaysInMonth);
      }
    }

    onChange("dob", newDob.toISOString().split("T")[0]);
  };

  return (
    <div className="text-center">
      <AnimatedTitle>Tell us a bit about yourself.</AnimatedTitle>
      <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
        {/* Carduri 3D pentru Sex */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <InteractiveCard
            onClick={() => onChange("sex", "male")}
            isSelected={formData.sex === "male"}
          >
            <PersonStanding className="h-8 w-8 mx-auto mb-2" /> Male
          </InteractiveCard>
          <InteractiveCard
            onClick={() => onChange("sex", "female")}
            isSelected={formData.sex === "female"}
          >
            <PersonStanding className="h-8 w-8 mx-auto mb-2" /> Female
          </InteractiveCard>
        </div>

        {/* Selector de Dată Complet și Stilizat */}
        <div className="col-span-2 space-y-2">
          <label className="text-sm font-medium text-slate-500">
            Date of Birth
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Ziua */}
            <div className="relative">
              <select
                value={dob.getDate()}
                onChange={(e) => handleDateChange("day", e.target.value)}
                className="w-full p-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 appearance-none text-center text-base font-semibold focus:border-blue-500 focus:outline-none"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute inset-y-0 right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
            {/* Luna */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => handleDateChange("month", e.target.value)}
                className="w-full p-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 appearance-none text-center text-base font-semibold focus:border-blue-500 focus:outline-none"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute inset-y-0 right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
            {/* Anul */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => handleDateChange("year", e.target.value)}
                className="w-full p-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 appearance-none text-center text-base font-semibold focus:border-blue-500 focus:outline-none"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute inset-y-0 right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepGoal = ({ name, value, onChange, onNext }) => {
  // <-- Adaugă onNext aici
  const handleSelectAndNext = (id) => {
    onChange("goal", id); // Setează obiectivul
    setTimeout(() => onNext(), 100); // Așteaptă un moment scurt și apoi trece la pasul următor
  };

  return (
    <div className="text-center">
      <AnimatedTitle>
        Awesome, {name || "friend"}! What's our main goal?
      </AnimatedTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map(({ id, label, icon: Icon }) => {
          const isSelected = value === id;

          return (
            // --- MODIFICARE AICI: onClick apelează noua funcție ---
            <InteractiveCard
              key={id}
              onClick={() => handleSelectAndNext(id)}
              isSelected={isSelected}
            >
              <motion.div
                layoutId={isSelected ? "onboarding-icon-morph" : `icon-${id}`}
              >
                <Icon className="h-10 w-10 mx-auto mb-4 text-blue-500" />
              </motion.div>
              <span className="font-semibold text-xl">{label}</span>
            </InteractiveCard>
          );
        })}
      </div>
    </div>
  );
};

// Înlocuiește complet funcția StepMeasurements din OnboardingForm.jsx

const StepMeasurements = ({ formData, onChange }) => {
  // Logica pentru animația de scalare
  const heightMotion = useSpring(formData.height, {
    stiffness: 200,
    damping: 30,
  });
  const weightMotion = useSpring(formData.weight, {
    stiffness: 200,
    damping: 30,
  });

  useEffect(() => {
    heightMotion.set(formData.height);
  }, [formData.height, heightMotion]);
  useEffect(() => {
    weightMotion.set(formData.weight);
  }, [formData.weight, weightMotion]);

  const scaleY = useTransform(heightMotion, [140, 210], [0.8, 1.2]);
  const scaleX = useTransform(weightMotion, [40, 120], [0.8, 1.2]);

  return (
    <div className="flex flex-col h-full">
      <AnimatedTitle>What are your current stats?</AnimatedTitle>
      <div className="flex-grow grid grid-cols-3 gap-6 items-center pt-8">
        <div className="flex flex-col items-center justify-center h-full">
          <label className="text-sm font-medium text-slate-500 mb-2">
            Height
          </label>
          <input
            type="range"
            min="140"
            max="210"
            step="1"
            value={formData.height}
            onChange={(e) => onChange("height", parseInt(e.target.value))}
            className="w-24 h-full [-webkit-appearance:slider-vertical] accent-blue-500"
            orient="vertical"
          />
        </div>
        <div className="relative flex flex-col items-center justify-center h-full">
          <motion.div
            layoutId="onboarding-icon-morph"
            className="h-full max-h-56"
            style={{
              scaleY,
              scaleX,
              transformOrigin: "bottom center",
            }}
          >
            {formData.sex === "female" ? (
              <SilhouetteFemale className="h-full w-auto mx-auto text-slate-300 dark:text-slate-700" />
            ) : (
              <SilhouetteMale className="h-full w-auto mx-auto text-slate-300 dark:text-slate-700" />
            )}
          </motion.div>
          <div className="absolute bottom-0 translate-y-12 flex gap-8 text-center">
            <div>
              <p className="text-2xl font-bold">
                {formData.height}
                <span className="text-lg text-slate-500"> cm</span>
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formData.weight}
                <span className="text-lg text-slate-500"> kg</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-full">
          <label className="text-sm font-medium text-slate-500 mb-2">
            Weight
          </label>
          <input
            type="range"
            min="40"
            max="120"
            step="1"
            value={formData.weight}
            onChange={(e) => onChange("weight", parseInt(e.target.value))}
            className="w-24 h-full [-webkit-appearance:slider-vertical] accent-blue-500"
            orient="vertical"
          />
        </div>
      </div>
    </div>
  );
};

const StepActivity = ({ value, onChange }) => (
  <div className="text-center">
    <AnimatedTitle>How active are you usually?</AnimatedTitle>
    <div className="space-y-4 max-w-lg mx-auto">
      {activities.map(({ id, label, description }) => (
        <button
          key={id}
          onClick={() => onChange("activity", id)}
          className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 flex items-center gap-4 ${
            value === id
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-lg"
              : "border-slate-200 dark:border-slate-800 hover:border-blue-400/50"
          }`}
        >
          <div
            className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
              value === id ? "bg-blue-500 border-blue-500" : "border-slate-400"
            }`}
          >
            {value === id && (
              <div className="h-2 w-2 rounded-full bg-white"></div>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg">{label}</p>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const StepWeeklyTarget = ({ formData, onChange }) => {
  const isLosing = formData.goal.includes("lose");
  const isGaining = formData.goal.includes("gain");
  if (!isLosing && !isGaining) {
    setTimeout(
      () => document.querySelector('button[type="submit"]')?.click(),
      100
    );
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">All Set!</h2>
        <p className="text-slate-500">
          You've chosen a maintenance goal. We're ready to calculate your plan.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <AnimatedTitle>What's a comfortable weekly pace?</AnimatedTitle>
      <div className="flex flex-col items-center gap-4">
        <p className="text-6xl font-bold tracking-tighter">
          {formData.weeklyTarget.toFixed(1)}{" "}
          <span className="text-3xl text-slate-500">kg/week</span>
        </p>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.1"
          value={formData.weeklyTarget}
          onChange={(e) => onChange("weeklyTarget", parseFloat(e.target.value))}
          className="w-full max-w-xs accent-blue-500"
        />
        <p className="text-sm text-slate-500">
          A sustainable rate is key. We recommend around 0.5 kg.
        </p>
      </div>
    </div>
  );
};

const StepCalculating = () => {
  const [text, setText] = useState("Analyzing your stats...");

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setText("Calculating your needs..."), 800),
      setTimeout(() => setText("Crafting your personal blueprint..."), 1600),
    ];
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center flex flex-col items-center"
    >
      {/* --- MODIFICARE CHEIE AICI --- */}
      <Player
        autoplay
        loop
        // Folosim calea publică direct, ca un URL
        src="/lottie/calculating.json"
        style={{ height: "200px", width: "200px" }}
      />

      <h2 className="text-3xl font-bold mt-4">Building Your Blueprint</h2>

      <div className="h-6 mt-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-slate-500"
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const InteractiveCard = ({ children, onClick, isSelected }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(ySpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`p-6 border-2 rounded-2xl text-center transition-all duration-200 w-full h-full flex flex-col justify-center items-center font-semibold text-lg ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-2xl shadow-blue-500/20"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div style={{ transform: "translateZ(20px)" }}>{children}</div>
    </motion.button>
  );
};
