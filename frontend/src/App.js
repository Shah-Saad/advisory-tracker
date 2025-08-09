import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'react-toastify/dist/ReactToastify.css';

// Import components from the correct paths
import Login from './components/Auth/Login';
import ChangePassword from './components/Auth/ChangePassword';
import { AdminProtectedRoute, TeamProtectedRoute } from './components/Auth/ProtectedRoute';
import EnhancedAdminDashboard from './components/Admin/EnhancedAdminDashboard';
import TeamDashboard from './components/Dashboard/TeamDashboard';
import SheetUpload from './components/SheetUpload/SheetUpload';
import Filters from './components/Filters/Filters';
import AdminUserManagement from './components/Admin/AdminUserManagement';
import TeamSheetSwitcher from './components/Admin/TeamSheetSwitcher';
import AdminTeamSheetView from './components/Admin/AdminTeamSheetView';
import NotificationPanel from './components/Admin/NotificationPanel';
import TeamSheets from './components/TeamSheets/TeamSheets';
import TeamSheetEditor from './components/TeamSheets/TeamSheetEditor';
import SheetEditorWithLocking from './components/TeamSheets/SheetEditorWithLocking';
import authService from './services/authService';

import './App.css';

// Redirect component for non-admin users trying to access regular edit
const RedirectToEditWithLocking = () => {
  const { sheetId } = useParams();
  return <Navigate to={`/team-sheets/${sheetId}/edit-with-locking`} replace />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await authService.verifyToken();
      if (isAuthenticated) {
        const userData = authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          <>
            {/* Navigation */}
            <nav className={`navbar navbar-expand-lg`} style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <div className="container-fluid">
                <span className="navbar-brand mb-0 h1">
                  <i className="fas fa-shield-alt me-2" style={{ color: 'var(--primary)' }}></i>
                  <span style={{ color: 'var(--text)' }}>Advisory Tracker</span>
                </span>
                
                {/* Navigation Links */}
                <div className="navbar-nav me-auto">
                  {user && user.role === 'admin' && (
                    <Link className="nav-link text-white" to="/dashboard">
                      <i className="fas fa-tachometer-alt me-1"></i>
                      Admin Dashboard
                    </Link>
                  )}
                  {user && user.role !== 'admin' && (
                    <Link className="nav-link text-white" to="/team-dashboard">
                      <i className="fas fa-users me-1"></i>
                      Team Dashboard
                    </Link>
                  )}
                  {user && user.role === 'admin' && (
                    <Link className="nav-link text-white" to="/upload">
                      <i className="fas fa-upload me-1"></i>
                      Upload
                    </Link>
                  )}
                  {user && user.role !== 'admin' && (
                    <Link className="nav-link text-white" to="/my-sheets">
                      <i className="fas fa-clipboard-list me-1"></i>
                      My Sheets
                    </Link>
                  )}
                  {user && user.role === 'admin' && (
                    <Link className="nav-link text-white" to="/admin/users">
                      <i className="fas fa-users-cog me-1"></i>
                      Users
                    </Link>
                  )}
                  {user && user.role === 'admin' && (
                    <Link className="nav-link text-white" to="/admin/team-sheets">
                      <i className="fas fa-chart-bar me-1"></i>
                      Submissions Overview
                    </Link>
                  )}
                </div>
                
                <div className="navbar-nav ms-auto">
                  <div className="nav-item me-3 d-flex align-items-center">
                    <div className="btn-group" role="group" aria-label="Theme selector">
                      <button className="btn btn-sm" style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--surface)' }} onClick={() => setTheme('light')}>
                        <i className="fas fa-sun me-1" style={{ color: 'var(--warning)' }}></i>
                        Light
                      </button>
                      <button className="btn btn-sm" style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--surface)' }} onClick={() => setTheme('dark')}>
                        <i className="fas fa-moon me-1" style={{ color: 'var(--brand-blue)' }}></i>
                        Dark
                      </button>
                    </div>
                  </div>
                  {/* Notification Panel for Admin Users */}
                  {user && user.role === 'admin' && (
                    <div className="nav-item me-3 d-flex align-items-center">
                      <NotificationPanel />
                    </div>
                  )}
                  
                  <div className="nav-item dropdown">
                    <button className="nav-link dropdown-toggle text-white btn btn-link" data-bs-toggle="dropdown" aria-expanded="false" style={{ border: 'none', textDecoration: 'none' }}>
                      <i className="fas fa-user me-1"></i>
                      {user.first_name ? `${user.first_name} ${user.last_name}` : user.username || user.email}
                      {user.role && (
                        <span className="badge bg-light text-dark ms-2">{user.role}</span>
                      )}
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button 
                          className="dropdown-item" 
                          onClick={() => setShowChangePassword(true)}
                        >
                          <i className="fas fa-key me-2"></i>
                          Change Password
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item" onClick={handleLogout}>
                          <i className="fas fa-sign-out-alt me-2"></i>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <div className="container-fluid mt-3">
              {showChangePassword ? (
                <div className="row justify-content-center">
                  <div className="col-md-6">
                    <ChangePassword onCancel={() => setShowChangePassword(false)} />
                  </div>
                </div>
              ) : (
                <Routes>
                  {/* Admin-only Dashboard Route */}
                  <Route path="/dashboard" element={
                    <AdminProtectedRoute user={user}>
                      <EnhancedAdminDashboard user={user} />
                    </AdminProtectedRoute>
                  } />
                  
                  {/* Team Dashboard Route */}
                  <Route path="/team-dashboard" element={
                    <TeamProtectedRoute user={user}>
                      <TeamDashboard user={user} />
                    </TeamProtectedRoute>
                  } />
                  
                  {/* Admin-only Upload Route */}
                  {user && user.role === 'admin' && (
                    <Route path="/upload" element={<SheetUpload />} />
                  )}
                  
                  {/* Team member routes */}
                  {user && user.role !== 'admin' && (
                    <Route path="/my-sheets" element={<TeamSheets user={user} />} />
                  )}
                  {/* Team members can only access edit-with-locking route */}
                  {user && user.role !== 'admin' && (
                    <Route path="/team-sheets/:sheetId/edit-with-locking" element={<SheetEditorWithLocking user={user} />} />
                  )}
                  
                  {/* Redirect non-admin users from regular edit to edit-with-locking */}
                  {user && user.role !== 'admin' && (
                    <Route 
                      path="/team-sheets/:sheetId/edit" 
                      element={<RedirectToEditWithLocking />} 
                    />
                  )}
                  
                  {/* Admin can access both edit routes */}
                  {user && user.role === 'admin' && (
                    <Route path="/team-sheets/:sheetId/edit" element={<TeamSheetEditor />} />
                  )}
                  {user && user.role === 'admin' && (
                    <Route path="/team-sheets/:sheetId/edit-with-locking" element={<SheetEditorWithLocking user={user} />} />
                  )}
                  
                  {/* Filters accessible to all */}
                  <Route path="/filters" element={<Filters />} />
                  
                  {/* Admin management routes */}
                  {user && user.role === 'admin' && (
                    <Route path="/admin/users" element={<AdminUserManagement />} />
                  )}
                  {user && user.role === 'admin' && (
                    <Route path="/admin/team-sheets" element={<TeamSheetSwitcher />} />
                  )}
                  {user && user.role === 'admin' && (
                    <Route path="/admin/team-sheets/:sheetId/:teamKey" element={<AdminTeamSheetView />} />
                  )}
                  
                  {/* Default redirect based on role */}
                  <Route path="/" element={
                    user && user.role === 'admin' 
                      ? <Navigate to="/dashboard" />
                      : <Navigate to="/team-dashboard" />
                  } />
                </Routes>
              )}
            </div>
          </>
        ) : (
          <Login onLogin={handleLogin} />
        )}
        
        {/* Toast Container for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
