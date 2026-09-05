import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import SupervisorDashboard from './pages/SupervisorDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import MyActivities from './pages/MyActivities';
import Communities from './pages/Communities';
import Alerts from './pages/Alerts';
import RegisterWorker from './pages/RegisterWorker';
import Patients from './pages/Patients';


// Private Route Guard Wrapper (Any authenticated user)
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  return token ? children : <Navigate to="/login" replace />;
};

// Supervisor Route Guard Wrapper (Only supervisors allowed)
const SupervisorRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return user && user.role === 'supervisor' ? children : <Navigate to="/" replace />;
};

// Root Dashboard Redirect (Supervisor vs. Worker entry points)
const DashboardHome = () => {
  const { user } = useAuth();
  
  if (user?.role === 'supervisor') {
    return <SupervisorDashboard />;
  }
  return <WorkerDashboard />;
};

// Layout Wrapper containing the responsive Sidebar
const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', next.toString());
      return next;
    });
  };

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public authentication route */}
          <Route path="/login" element={<Login />} />

          {/* Secure authenticated layout */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="my-activities" element={<MyActivities />} />
            <Route path="communities" element={<Communities />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="patients" element={<Patients />} />
            <Route 
              path="register-worker" 
              element={
                <SupervisorRoute>
                  <RegisterWorker />
                </SupervisorRoute>
              } 
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
