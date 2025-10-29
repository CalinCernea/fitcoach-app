// VERSIUNEA CORECTĂ
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FitCoach - Your Personalized Fitness Plan",
  description:
    "Stop guessing. Start seeing results with a science-backed nutrition and workout plan.",
};

export default function RootLayout({ children }) {
  return (
    // Comentariul poate sta aici, în afara tag-urilor returnate
    // Am adăugat 'dark' pentru un dark mode implicit
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
