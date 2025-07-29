import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => (
  <nav style={{ marginBottom: 20 }}>
    <Link to="/dashboard">Dashboard</Link> |{' '}
    <Link to="/upload">Upload Sheet</Link>
  </nav>
);

export default Navigation; 