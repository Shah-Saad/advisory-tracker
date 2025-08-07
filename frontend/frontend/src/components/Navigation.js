import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const Navigation = () => {
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <nav style={{ marginBottom: 20 }}>
      <Link to="/dashboard">Dashboard</Link>
      {isAdmin && (
        <>
          {' | '}
          <Link to="/upload">Upload Sheet</Link>
        </>
      )}
    </nav>
  );
};

export default Navigation; 