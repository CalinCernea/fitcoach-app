// app/(app)/(auth)/signup/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Creează contul în Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (user) {
      // 2. Preluăm datele din localStorage
      const sessionData = JSON.parse(localStorage.getItem("onboardingSession"));

      if (sessionData) {
        // 3. Salvăm datele de profil în baza de date Supabase
        // (Vom crea tabelul 'profiles' în pasul următor)
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id, // Legătura cu utilizatorul autentificat
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

        // 4. Curățăm localStorage și redirecționăm
        localStorage.removeItem("onboardingSession");
        router.push("/dashboard"); // Redirecționăm către dashboard
      } else {
        // Dacă nu există date de onboarding, doar redirecționăm
        router.push("/dashboard");
      }
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          You're one step away from your personalized plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
