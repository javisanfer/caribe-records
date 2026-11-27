import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/use-auth-context";

import SiteLoader from "../components/ui/site-loader";

function PrivateRoute({ role = "admin", children }) {
  const { user } = useAuthContext();
  const location = useLocation();

  if (user === undefined) return <SiteLoader fullPage />;
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  } else if (role && user.role !== role) {
    return <p role="alert" className="detail-state">Esta cuenta no tiene acceso al panel de administración.</p>;
  } else {
    return children;
  }
}

export default PrivateRoute;
