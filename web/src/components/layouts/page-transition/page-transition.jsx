// src/components/layouts/page-transition.jsx
import React from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";

export default function PageTransition({ children }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="page-transition">
      {!prefersReducedMotion && (
        <Motion.div
          aria-hidden="true"
          className="page-transition__curtain"
          initial={{ scaleY: 1, originY: 0 }}
          animate={{ scaleY: 0, originY: 0 }}
          exit={{ scaleY: 1, originY: 1 }}
          transition={{ duration: 0.2, ease: [0.76, 0, 0.24, 1] }}
        />
      )}
      {children}
    </div>
  );
}
