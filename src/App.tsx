import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import AlertMessage from './components/AlertMessage';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import Notes from './pages/Notes';

// Lazy load components for better performance
const Attendance = lazy(() => import('./components/Attendance'));
const Login = lazy(() => import('./pages/Auth/Login'));
const SelectRole = lazy(() => import('./pages/Auth/SelectRole'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Welcome = lazy(() => import('./pages/Auth/Welcome'));
const Scheduler = lazy(() => import('./pages/Scheduler'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const Courses = lazy(() => import('./pages/Courses'));
const GPATracker = lazy(() => import('./pages/GPATracker'));
const StudyRoom = lazy(() => import('./components/StudyRoom/StudyRoom'));
const Assignments = lazy(() => import('./pages/Assignments'));
const StudyGroups = lazy(() => import('./pages/StudyGroups'));
// Make sure this import uses the correct casing
const Quiz = lazy(() => import('./pages/Quiz'));
const QuizTake = lazy(() => import('./pages/Quiz/Take'));

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

          {/* Update SelectRole route to allow registration data */}
          <Route path="/select" element={
            <PublicRoute>
              <SelectRole />
            </PublicRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

<Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

        <Route path="/notes" element={
                    <ProtectedRoute>
                      <Notes />
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

          <Route path="/assignments" element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          } />

          <Route path="/study-groups" element={
            <ProtectedRoute>
              <StudyGroups />
            </ProtectedRoute>
          } />

          {/* Update Quiz routes to handle nested paths */}
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/take" element={<QuizTake />} />

          {/* Fix the duplicate attendance route */}
          <Route path="/attendance" element={
            <ProtectedRoute>
              <Attendance />
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