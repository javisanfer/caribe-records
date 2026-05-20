import React from "react";
import "../../../index.css";

export default function PageLayout({ children }) {
  return (
    <div className="page-layout-shell">
      <main className="page-layout">
        {children}
      </main>
    </div>
  );
}