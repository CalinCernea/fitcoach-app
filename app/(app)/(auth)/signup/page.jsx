// app/(app)/(auth)/signup/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { MagicButton } from "@/components/ui/MagicButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Sparkles, Loader2, XCircle } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailValidationState = useMemo(() => {
    if (!emailTouched) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "valid" : "invalid";
  }, [email, emailTouched]);

  const passwordValidationState = useMemo(() => {
    if (!passwordTouched) return null;
    return password.length >= 6 ? "valid" : "invalid";
  }, [password, passwordTouched]);

  const passwordStrength = useMemo(() => {
    if (!passwordTouched || password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
    if (score === 0 && password.length >= 6) return 1;
    return score;
  }, [password, passwordTouched]);

  const strengthColors = {
    0: "bg-transparent",
    1: "bg-red-500",
    2: "bg-yellow-500",
    3: "bg-green-500",
  };

  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem("onboardingSession"));
    if (sessionData && sessionData.onboardingData.name) {
      setUserName(sessionData.onboardingData.name.split(" ")[0]);
    }
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (user) {
      const sessionData = JSON.parse(localStorage.getItem("onboardingSession"));
      if (sessionData) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          ...sessionData.onboardingData,
          ...sessionData.planResults,
        });
        if (profileError) {
          setError(
            `Account created, but failed to save profile: ${profileError.message}`
          );
          setLoading(false);
          return;
        }
        localStorage.removeItem("onboardingSession");
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          <h1 className="text-3xl md:text-4xl font-bold mt-4">
            Your Blueprint is Ready, {userName || "friend"}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Just one final step. Create your account to unlock your personalized
            plan.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <FloatingLabelInput
            id="email"
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            validationState={emailValidationState}
          />

          <div className="space-y-1">
            <FloatingLabelInput
              id="password"
              label="Password"
              type="password"
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              validationState={passwordValidationState}
            />
            <div className="h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 mx-1">
              <motion.div
                className={`h-full ${
                  strengthColors[passwordStrength] || "bg-transparent"
                }`}
                initial={{ width: "0%" }}
                animate={{ width: `${(passwordStrength / 3) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <MagicButton
            type="submit"
            size="lg"
            className="w-full text-lg p-6 bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Unlock My Plan
              </>
            )}
          </MagicButton>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-500 hover:underline"
          >
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
