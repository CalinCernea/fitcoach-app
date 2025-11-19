// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"; // <-- Pasul 2.1: Importă
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FitCoach AI",
  description: "Your personalized fitness and nutrition planner.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Analytics /> {/* <-- Pasul 2.2: Adaugă componenta aici */}
        <SpeedInsights />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
