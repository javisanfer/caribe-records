import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/use-auth-context";

function PrivateRoute({ role, children }) {
  const { user } = useAuthContext();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  } else if (role && user.role !== role) {
    return <Navigate to="/403" />;
  } else {
    return children;
  }
}

export default PrivateRoute;
