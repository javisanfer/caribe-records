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
          transition={{ duration: 0.48, ease: [0.65, 0, 0.35, 1] }}
        />
      )}
      <Motion.div
        className="page-transition__content"
        initial={prefersReducedMotion ? false : { opacity: 0.88, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0.9, y: -6 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </Motion.div>
    </div>
  );
}
