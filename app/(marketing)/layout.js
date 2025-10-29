// app/(marketing)/layout.js
import Link from "next/link";

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Aici poți adăuga un <header> comun pentru paginile de marketing, dacă vrei */}
      <main className="flex-grow">{children}</main>

      {/* --- Footer Nou --- */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t">
        <div className="container mx-auto px-4 py-6 text-center text-slate-500">
          <div className="mb-4">
            <Link href="/about" className="text-sm hover:underline mx-2">
              About Us
            </Link>
            {/* Aici poți adăuga link-uri viitoare: Terms of Service, Privacy Policy etc. */}
          </div>
          <p className="text-xs max-w-2xl mx-auto">
            <strong>Disclaimer:</strong> The information provided by this
            application is for general informational purposes only and is not a
            substitute for professional medical advice, diagnosis, or treatment.
            Always seek the advice of your physician or other qualified health
            provider with any questions you may have regarding a medical
            condition. Never disregard professional medical advice or delay in
            seeking it because of something you have read on this application.
          </p>
          <p className="text-sm mt-4">
            © {new Date().getFullYear()} FitCoach AI. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
