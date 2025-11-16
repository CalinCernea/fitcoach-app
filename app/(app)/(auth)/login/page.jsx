// app/(app)/(auth)/login/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Loader2 } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { MagicButton } from "@/components/ui/MagicButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailValidationState = useMemo(() => {
    if (!emailTouched) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "valid" : "invalid";
  }, [email, emailTouched]);

  const passwordValidationState = useMemo(() => {
    if (!passwordTouched) return null;
    // Pentru login, o simplă verificare că nu e gol este suficientă.
    // Putem păstra și regula de 6 caractere dacă dorim consistență.
    return password.length >= 6 ? "valid" : "invalid";
  }, [password, passwordTouched]);

  useEffect(() => {
    // Când componenta se montează, adaugă clasa pe body
    document.body.classList.add("overflow-hidden");

    // Când componenta se demontează (utilizatorul navighează în altă parte),
    // elimină clasa pentru a permite scroll-ul pe alte pagini (ex: dashboard).
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Setăm flag-ul și pornim animația
      localStorage.setItem("playWipeTransition", "true");
      setIsWiping(true);
      // Nu mai facem redirect aici, așteptăm finalul animației
    }
  };

  // Funcție nouă pentru a gestiona finalul animației
  const handleWipeComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <LogIn className="h-16 w-16 mx-auto text-blue-500" />
          <h1 className="text-3xl md:text-4xl font-bold mt-4">Welcome Back!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Log in to access your personalized command center.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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

          <FloatingLabelInput
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            validationState={passwordValidationState}
          />

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
            disabled={
              loading ||
              emailValidationState !== "valid" ||
              passwordValidationState !== "valid"
            }
            isWiping={isWiping}
            onWipeComplete={handleWipeComplete}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Log In
              </>
            )}
          </MagicButton>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-500 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
