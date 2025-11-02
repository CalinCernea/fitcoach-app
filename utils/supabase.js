// utils/supabase.js
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// Folosim createPagesBrowserClient deoarece suntem într-un mediu client-side (nu server-side)
// pentru a simplifica setup-ul inițial.
export const supabase = createPagesBrowserClient({
  // AICI FOLOSIM NUMELE VARIABILELOR, NU VALORILE LOR
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
