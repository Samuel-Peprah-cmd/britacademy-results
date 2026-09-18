import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import ResultChecker from './pages/student/ResultChecker';
import ResultSlip from './pages/student/ResultSlip';
import AdminDashboard from './pages/admin/AdminDashboard';
import TutorDashboard from './pages/tutor/TutorDashboard';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/check-result" element={<ResultChecker />} />
        <Route path="/result-slip" element={<ResultSlip />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Protected Tutor Routes */}
        <Route path="/tutor/*" element={
          <ProtectedRoute allowedRole="tutor">
            <TutorDashboard />
          </ProtectedRoute>
        } />

        {/* Missing/Unauthorized Route Fix */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center text-red-600 font-bold text-2xl bg-gray-50">
            Unauthorized Access
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;