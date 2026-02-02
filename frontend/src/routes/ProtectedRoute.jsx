import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // 🔐 Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
