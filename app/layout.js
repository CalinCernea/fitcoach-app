// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"; // <-- Pasul 2.1: Importă

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
      </body>
    </html>
  );
}
