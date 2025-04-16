import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type ProtectedRouteProps = {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireTeacher?: boolean;
};

const ProtectedRoute = ({
  requireAuth = true,
  requireAdmin = false,
  requireTeacher = false,
}: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin, isTeacher } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not logged in, redirect to login
  if (requireAuth && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not an admin
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // If teacher access is required but user is not a teacher or admin
  if (requireTeacher && !isTeacher()) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // If user is logged in but tries to access login/register page
  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
