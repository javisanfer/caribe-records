// src/components/layouts/page-transition.jsx
import React from "react";
import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.50, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}