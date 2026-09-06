import React from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../contexts/use-auth-context";

export default function AdminEditLink({ to, label }) {
  const { user } = useAuthContext();

  if (!user || !to) return null;

  return (
    <Link className="admin-edit-link" to={to} aria-label={`Editar ${label}`}>
      Editar <span aria-hidden="true">↗</span>
    </Link>
  );
}
