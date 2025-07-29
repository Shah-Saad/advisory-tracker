import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import { vendorService, productService } from '../../services/vendorProductService';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalEntries: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    pendingPatches: 0,
    completedPatches: 0
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsData = await sheetService.getStatistics();
      setStats(statsData);

      // Load recent entries (limited)
      const allEntries = await sheetService.getAllEntries();
      setRecentEntries(allEntries.slice(0, 5));

      // Load vendors and products
      const vendorsData = await vendorService.getAllVendors();
      const productsData = await productService.getAllProducts();
      setVendors(vendorsData);
      setProducts(productsData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning text-dark';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">Dashboard</h1>
              <p className="text-muted">Welcome back, {user?.name || user?.email}</p>
            </div>
            <div>
              <Link to="/upload" className="btn btn-primary me-2">
                <i className="fas fa-upload me-2"></i>Upload Sheet
              </Link>
              <Link to="/entries" className="btn btn-outline-primary">
                <i className="fas fa-list me-2"></i>View All Entries
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="dashboard-card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Entries</h6>
                  <h2 className="mb-0">{stats.totalEntries}</h2>
                </div>
                <div className="card-icon">
                  <i className="fas fa-database"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="dashboard-card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">High Risk</h6>
                  <h2 className="mb-0">{stats.highRiskCount}</h2>
                </div>
                <div className="card-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="dashboard-card bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Medium Risk</h6>
                  <h2 className="mb-0">{stats.mediumRiskCount}</h2>
                </div>
                <div className="card-icon">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="dashboard-card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Low Risk</h6>
                  <h2 className="mb-0">{stats.lowRiskCount}</h2>
                </div>
                <div className="card-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Entries */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Entries</h5>
              <Link to="/entries" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {recentEntries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>OEM/Vendor</th>
                        <th>Source</th>
                        <th>Risk Level</th>
                        <th>CVE</th>
                        <th>Deployed in KE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEntries.map((entry, index) => (
                        <tr key={index}>
                          <td>{entry.oem_vendor || 'N/A'}</td>
                          <td>{entry.source || 'N/A'}</td>
                          <td>
                            <span className={`badge ${getRiskBadgeClass(entry.risk_level)}`}>
                              {entry.risk_level || 'Unknown'}
                            </span>
                          </td>
                          <td>{entry.cve || 'N/A'}</td>
                          <td>
                            <span className={`badge ${entry.deployed_in_ke === 'Yes' ? 'bg-success' : 'bg-secondary'}`}>
                              {entry.deployed_in_ke || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center py-4">No entries found. Upload a sheet to get started.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/upload" className="btn btn-primary">
                  <i className="fas fa-upload me-2"></i>Upload New Sheet
                </Link>
                <Link to="/entries" className="btn btn-outline-primary">
                  <i className="fas fa-list me-2"></i>View All Entries
                </Link>
                <Link to="/filters" className="btn btn-outline-secondary">
                  <i className="fas fa-filter me-2"></i>Advanced Filters
                </Link>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">System Overview</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <h4 className="text-primary">{vendors.length}</h4>
                  <small className="text-muted">Vendors</small>
                </div>
                <div className="col-6">
                  <h4 className="text-info">{products.length}</h4>
                  <small className="text-muted">Products</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
