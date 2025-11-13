// components/ui/FloatingLabelInput.jsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./input";
import { CheckCircle, XCircle } from "lucide-react"; // Importăm iconițele

// Am adăugat `validationState` ca prop
export const FloatingLabelInput = ({
  id,
  label,
  value,
  validationState,
  ...props
}) => {
  const isFloating = value && value.length > 0;

  const labelVariants = {
    initial: { top: "50%", y: "-50%", fontSize: "1.125rem" },
    float: { top: "0.5rem", y: "0%", fontSize: "0.75rem", color: "#3b82f6" },
  };

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        variants={labelVariants}
        initial="initial"
        animate={isFloating ? "float" : "initial"}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute left-6 text-slate-400 pointer-events-none"
      >
        {label}
      </motion.label>
      <Input
        id={id}
        value={value}
        // Adăugăm padding în dreapta pentru a face loc iconiței
        className="p-6 pr-12 text-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 focus-visible:border-blue-500"
        {...props}
      />

      {/* --- NOU: Container pentru Iconița de Validare --- */}
      <div className="absolute inset-y-0 right-4 flex items-center">
        <AnimatePresence mode="wait">
          {validationState === "valid" && (
            <motion.div
              key="valid"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
            </motion.div>
          )}
          {validationState === "invalid" && (
            <motion.div
              key="invalid"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <XCircle className="h-5 w-5 text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
