import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Add useAuth import here
import { AlertProvider } from './contexts/AlertContext';
import AlertMessage from './components/AlertMessage';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scheduler = lazy(() => import('./pages/Scheduler'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const GPATracker = lazy(() => import('./pages/GPATracker'));
const StudyRoom = lazy(() => import('./components/StudyRoom/StudyRoom'));

// Move PublicRoute outside of App component to avoid the issue with useAuth
function App() {
  return (
    <ErrorBoundary>
      <AlertProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AlertProvider>
    </ErrorBoundary>
  );
}

// Separate component for routes to access auth context safely
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AlertMessage />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes that cannot be accessed when logged in */}
          <Route path="/" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Protected routes that require authentication */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/scheduler" element={
            <ProtectedRoute>
              <Scheduler />
            </ProtectedRoute>
          } />
          
          <Route path="/my-courses" element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          } />
          
          <Route path="/gpa-tracker" element={
            <ProtectedRoute>
              <GPATracker />
            </ProtectedRoute>
          } />
          
          <Route path="/study-room" element={
            <ProtectedRoute>
              <StudyRoom />
            </ProtectedRoute>
          } />
          
          {/* Catch all route - redirect to dashboard if authenticated, otherwise to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

// Public route component to prevent authenticated users from accessing auth pages
// Move this component after the AuthProvider is rendered
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default App;