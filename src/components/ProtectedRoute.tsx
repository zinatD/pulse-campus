import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'student';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, sessionChecked, profile, getUserRole, refreshProfile } = useAuth();
  const [checkCount, setCheckCount] = useState(0);
  const location = useLocation();
  
  // Periodically retry auth check if not authenticated and not explicitly signed out
  useEffect(() => {
    // Only try a few times to avoid infinite loops
    if (checkCount < 3 && !isAuthenticated && !isLoading && sessionChecked) {
      const timer = setTimeout(() => {
        console.log(`🔄 Auth retry attempt ${checkCount + 1}`);
        refreshProfile();
        setCheckCount(prevCount => prevCount + 1);
      }, 1000); // Retry after 1 second
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, sessionChecked, checkCount, refreshProfile]);
  
  // Show loading screen while checking auth state
  if (isLoading || !sessionChecked) {
    return <LoadingScreen />;
  }
  
  // After all retries, if still not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🚫 Not authenticated, redirecting to login');
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }
  
  // Check for role-based access if a required role is specified
  if (requiredRole) {
    const userRole = getUserRole();
    
    if (userRole === 'admin') {
      return <>{children}</>; // Admin can access everything
    }
    
    if (userRole !== requiredRole) {
      console.log(`🚫 Access denied: Required role ${requiredRole}, user has ${userRole}`);
      return <Navigate to="/dashboard" state={{ 
        accessDenied: true,
        message: `Access denied: You need ${requiredRole} privileges to view this page.`
      }} replace />;
    }
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
