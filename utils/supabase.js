// utils/supabase.js
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createPagesBrowserClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

// Helper pentru a gestiona erorile de sesiune
export const handleAuthError = async (error) => {
  if (error?.message?.includes("Refresh Token")) {
    console.log("Session expired, signing out...");
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
};
