import React from "react";
import "../../../index.css";

export default function PageLayout({ children }) {
  return (
    <div className="page-layout-shell">
      <div className="page-layout">
        {children}
      </div>
    </div>
  );
}