// components/ui/FloatingLabelInput.jsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./input"; // Importăm componenta de bază de la shadcn

export const FloatingLabelInput = ({ id, label, value, ...props }) => {
  const isFloating = value && value.length > 0;

  const labelVariants = {
    initial: {
      top: "50%",
      y: "-50%",
      fontSize: "1.125rem", // text-lg
    },
    float: {
      top: "0.5rem", // 8px
      y: "0%",
      fontSize: "0.75rem", // text-xs
      color: "#3b82f6", // text-blue-500
    },
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
        className="p-6 text-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 focus-visible:border-blue-500"
        {...props}
      />
    </div>
  );
};
