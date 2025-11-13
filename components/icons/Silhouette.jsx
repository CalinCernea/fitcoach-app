// components/icons/Silhouette.jsx
import { motion } from "framer-motion";

export function Silhouette(props) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 320"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="currentColor"
        d="M60,40c-11.05,0-20-8.95-20-20S48.95,0,60,0s20,8.95,20,20S71.05,40,60,40z M90,65v85c0,8.28-6.72,15-15,15H75v155c0,8.28-6.72,15-15,15h-0c-8.28,0-15-6.72-15-15V165H30c-8.28,0-15-6.72-15-15V65c0-8.28,6.72-15,15-15h60C83.28,50,90,56.72,90,65z"
      />
    </motion.svg>
  );
}
