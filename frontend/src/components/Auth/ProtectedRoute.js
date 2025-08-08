import React from 'react';
import { Navigate } from 'react-router-dom';

// Protected Route component for admin-only access
const AdminProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Access Denied
              </h4>
              <p>You don't have permission to access this page. Only administrators can view the dashboard.</p>
              <hr />
              <p className="mb-0">
                <strong>Your Role:</strong> {user.role || 'Unknown'} | 
                <strong> Team:</strong> {user.team?.name || 'No team assigned'}
              </p>
              <div className="mt-3">
                {user.role !== 'admin' && (
                  <a href="/my-sheets" className="btn btn-primary">
                    <i className="fas fa-clipboard-list me-1"></i>
                    Go to My Sheets
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

// Protected Route component for team member access
const TeamProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export { AdminProtectedRoute, TeamProtectedRoute };
