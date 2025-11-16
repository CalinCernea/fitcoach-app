// components/ui/MagicButton.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";

export const MagicButton = ({
  children,
  onClick,
  isWiping,
  onWipeComplete,
  ...props
}) => {
  const [ripple, setRipple] = useState(null);

  const handleClick = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    setRipple({ x, y, size });

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <Button
        {...props}
        onClick={handleClick}
        className={`relative overflow-hidden ${props.className || ""}`}
      >
        {children}
        <AnimatePresence>
          {ripple && (
            <motion.span
              key="ripple"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onAnimationComplete={() => setRipple(null)}
              style={{
                position: "absolute",
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              }}
            />
          )}
        </AnimatePresence>
      </Button>

      {/* Animația de Wipe care pornește de la buton */}
      <AnimatePresence>
        {isWiping && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 150 }} // Un număr mare pentru a acoperi ecranul
            transition={{ duration: 0.8, ease: "easeIn" }}
            onAnimationComplete={onWipeComplete}
            className="fixed top-1/2 left-1/2 w-16 h-16 bg-blue-600 rounded-full z-50"
            style={{ x: "-50%", y: "-50%" }}
          />
        )}
      </AnimatePresence>
    </>
  );
};
