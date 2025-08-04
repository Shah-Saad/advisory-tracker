import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'react-toastify/dist/ReactToastify.css';

// Import components from the correct paths
import Login from './components/Auth/Login';
import ChangePassword from './components/Auth/ChangePassword';
import Dashboard from './components/Dashboard/Dashboard';
import SheetUpload from './components/SheetUpload/SheetUpload';
import EntryList from './components/EntryList/EntryList';
import Filters from './components/Filters/Filters';
import AdminUserManagement from './components/Admin/AdminUserManagement';
import TeamManagement from './components/Admin/TeamManagement';
import TeamSheetSwitcher from './components/Admin/TeamSheetSwitcher';
import NotificationPanel from './components/Admin/NotificationPanel';
import TeamSheets from './components/TeamSheets/TeamSheets';
import TeamSheetEditor from './components/TeamSheets/TeamSheetEditor';
import authService from './services/authService';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

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
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
              <div className="container-fluid">
                <span className="navbar-brand mb-0 h1">
                  <i className="fas fa-shield-alt me-2"></i>
                  Advisory Tracker
                </span>
                
                {/* Navigation Links */}
                <div className="navbar-nav me-auto">
                  <Link className="nav-link text-white" to="/dashboard">
                    <i className="fas fa-tachometer-alt me-1"></i>
                    Dashboard
                  </Link>
                  {user && user.role === 'admin' && (
                    <Link className="nav-link text-white" to="/upload">
                      <i className="fas fa-upload me-1"></i>
                      Upload
                    </Link>
                  )}
                  <Link className="nav-link text-white" to="/entries">
                    <i className="fas fa-list me-1"></i>
                    Entries
                  </Link>
                  {user && user.role !== 'admin' && (
                    <Link className="nav-link text-white" to="/my-sheets">
                      <i className="fas fa-file-alt me-1"></i>
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
                    <Link className="nav-link text-white" to="/admin/teams">
                      <i className="fas fa-users me-1"></i>
                      Teams
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
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  {user && user.role === 'admin' && (
                    <Route path="/upload" element={<SheetUpload />} />
                  )}
                  <Route path="/entries" element={<EntryList />} />
                  {user && user.role !== 'admin' && (
                    <Route path="/my-sheets" element={<TeamSheets user={user} />} />
                  )}
                  {user && user.role !== 'admin' && (
                    <Route path="/team-sheets/:sheetId/edit" element={<TeamSheetEditor />} />
                  )}
                  <Route path="/filters" element={<Filters />} />
                  {user && user.role === 'admin' && (
                    <Route path="/admin/users" element={<AdminUserManagement />} />
                  )}
                  {user && user.role === 'admin' && (
                    <Route path="/admin/teams" element={<TeamManagement />} />
                  )}
                  {user && user.role === 'admin' && (
                    <Route path="/admin/team-sheets" element={<TeamSheetSwitcher />} />
                  )}
                  <Route path="/" element={<Navigate to="/dashboard" />} />
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
