import { Navigate } from "react-router-dom";
import { getUserRole, isLoggedIn } from "../../utils/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();

  // If roles are specified, check permission
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access Denied
      </div>
    );
  }

  return children;
}
