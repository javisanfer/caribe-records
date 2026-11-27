import React from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../contexts/use-auth-context";

export default function AdminEditLink({ to, label, children = "Editar" }) {
  const { user } = useAuthContext();

  if (user?.role !== "admin" || !to) return null;

  return (
    <Link className="admin-edit-link" to={to} aria-label={`Editar ${label}`}>
      {children} <span aria-hidden="true">↗</span>
    </Link>
  );
}
