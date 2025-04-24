import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
const Courses = lazy(() => import('./pages/Courses'));
const GPATracker = lazy(() => import('./pages/GPATracker'));
const StudyRoom = lazy(() => import('./components/StudyRoom/StudyRoom'));

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

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AlertMessage />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
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

          <Route path="/courses" element={
            <ProtectedRoute>
              <Courses />
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
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default App;