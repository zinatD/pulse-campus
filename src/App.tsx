import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StudyRoom from './components/StudyRoom/StudyRoom';
import GPATracker from './pages/GPATracker';
import MyCourses from './pages/MyCourses';
import Scheduler from './pages/Scheduler';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import AlertContainer from './components/common/AlertContainer';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Router>
          <AlertContainer />
          <Routes>
            {/* Public routes */}
            <Route element={<ProtectedRoute requireAuth={false} />}>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            
            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute requireAuth={true} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/study-room" element={<StudyRoom />} />
              <Route path="/gpa-tracker" element={<GPATracker />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/scheduler" element={<Scheduler />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;