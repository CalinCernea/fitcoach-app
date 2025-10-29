// app/(app)/layout.jsx
export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      {children}
    </div>
  );
}
