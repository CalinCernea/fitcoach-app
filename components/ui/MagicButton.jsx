// components/ui/MagicButton.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button"; // Importăm butonul de bază

export const MagicButton = ({ children, ...props }) => {
  const [ripple, setRipple] = useState(null);

  const handleClick = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    setRipple({ x, y, size });

    // Apelăm funcția onClick originală, dacă există
    if (props.onClick) {
      props.onClick(e);
    }
  };

  const handleAnimationComplete = () => {
    setRipple(null);
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      className={`relative overflow-hidden ${props.className || ""}`}
    >
      {/* Conținutul original al butonului */}
      {children}

      {/* Efectul de Ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.span
            key="ripple"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={handleAnimationComplete}
            style={{
              position: "absolute",
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.3)", // Culoarea efectului
            }}
          />
        )}
      </AnimatePresence>
    </Button>
  );
};
