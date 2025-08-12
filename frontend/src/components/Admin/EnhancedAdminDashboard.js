import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import userService from '../../services/userService';
import CISAReportGenerator from './CISAReportGenerator';
import './EnhancedAdminDashboard.css';

const EnhancedAdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalSheets: 0,
    totalEntries: 0,
    totalTeams: 0,
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    criticalRiskEntries: 0,
    highRiskEntries: 0,
    mediumRiskEntries: 0,
    lowRiskEntries: 0,
    completedSheets: 0,
    pendingSheets: 0,
    inProgressSheets: 0
  });
  const [dashboardData, setDashboardData] = useState({
    vendors: { total: 0, top: [] },
    products: { total: 0, top: [] },
    risks: [],
    statuses: []
  });
  const [recentSheets, setRecentSheets] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    databaseStatus: 'healthy',
    apiStatus: 'healthy',
    storageUsage: 45
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCISAGenerator, setShowCISAGenerator] = useState(false);


  useEffect(() => {
    loadDashboardData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard API Response:', data);
        console.log('📈 Summary data:', data.summary);
        setDashboardData(data);
        return data;
      } else {
        console.error('API response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    return null;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics from new API
      const dashboardStats = await fetchDashboardStats();
      
      // Load existing statistics
      const [sheets, entries, users] = await Promise.all([
        sheetService.getAllSheets(),
        sheetService.getAllEntries(),
        userService.getAllUsers()
      ]);

      // Calculate risk statistics from dashboard data or fallback to entries
      let riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      
      if (dashboardStats && dashboardStats.risks) {
        riskCounts = dashboardStats.risks.reduce((acc, risk) => {
          const level = risk.level?.toLowerCase();
          if (level === 'critical') acc.critical += risk.count;
          else if (level === 'high') acc.high += risk.count;
          else if (level === 'medium') acc.medium += risk.count;
          else if (level === 'low') acc.low += risk.count;
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });
      } else {
        // Fallback to old calculation
        riskCounts = entries.reduce((acc, entry) => {
          const risk = entry.risk_level?.toLowerCase();
          if (risk === 'critical') acc.critical++;
          else if (risk === 'high') acc.high++;
          else if (risk === 'medium') acc.medium++;
          else if (risk === 'low') acc.low++;
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });
      }

      const sheetStatusCounts = sheets.reduce((acc, sheet) => {
        const status = sheet.status?.toLowerCase();
        if (status === 'completed') acc.completed++;
        else if (status === 'in_progress') acc.inProgress++;
        else acc.pending++;
        return acc;
      }, { completed: 0, inProgress: 0, pending: 0 });

      const updatedStats = {
        totalSheets: sheets.length,
        totalEntries: entries.length,
        totalUsers: users.length,
        totalTeams: [...new Set(users.filter(u => u.team_name).map(u => u.team_name))].length,
        totalVendors: dashboardStats?.summary?.totalVendors || 0,
        totalProducts: dashboardStats?.summary?.totalProducts || 0,
        criticalRiskEntries: riskCounts.critical,
        highRiskEntries: riskCounts.high,
        mediumRiskEntries: riskCounts.medium,
        lowRiskEntries: riskCounts.low,
        completedSheets: sheetStatusCounts.completed,
        pendingSheets: sheetStatusCounts.pending,
        inProgressSheets: sheetStatusCounts.inProgress
      };

      console.log('📊 Setting stats:', updatedStats);
      console.log('🏪 Vendors from API:', dashboardStats?.summary?.totalVendors);
      console.log('📦 Products from API:', dashboardStats?.summary?.totalProducts);
      
      setStats(updatedStats);

      // Get recent sheets
      setRecentSheets(sheets.slice(0, 5));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="enhanced-admin-dashboard">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.first_name || user?.email}</p>
        </div>
        <div className="header-actions">
          <Link to="/upload" className="btn btn-primary">
            <i className="fas fa-upload me-2"></i>Upload Sheet
          </Link>
          <Link to="/admin/users" className="btn btn-outline-primary">
            <i className="fas fa-users me-2"></i>Manage Users
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <i className="fas fa-database"></i>
          </div>
          <div className="metric-content">
            <h3>{stats.totalEntries}</h3>
            <p>Total Entries</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="metric-content">
            <h3>{stats.totalSheets}</h3>
            <p>Total Sheets</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="metric-content">
            <h3>{stats.totalVendors}</h3>
            <p>Vendors</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <i className="fas fa-boxes"></i>
          </div>
          <div className="metric-content">
            <h3>{stats.totalProducts}</h3>
            <p>Products</p>
          </div>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="section-grid">
        <div className="risk-overview">
          <div className="section-header">
            <h3>Risk Overview</h3>
            <span className="status-badge healthy">
              {stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries} Total
            </span>
          </div>
          
          {/* Risk Pie Chart */}
          <div className="risk-pie-chart">
            <svg width="200" height="200" viewBox="0 0 200 200" className="pie-chart">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="4"
              />
              
              {/* Critical Risk Slice */}
              {stats.criticalRiskEntries > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r="35"
                  fill="none"
                  stroke="#dc3545"
                  strokeWidth="70"
                  strokeDasharray={`${(stats.criticalRiskEntries / (stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries)) * 220} 220`}
                  strokeDashoffset="0"
                  transform="rotate(-90 100 100)"
                />
              )}
              
              {/* High Risk Slice */}
              {stats.highRiskEntries > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r="35"
                  fill="none"
                  stroke="#ff6b6b"
                  strokeWidth="70"
                  strokeDasharray={`${(stats.highRiskEntries / (stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries)) * 220} 220`}
                  strokeDashoffset={`-${(stats.criticalRiskEntries / (stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries)) * 220}`}
                  transform="rotate(-90 100 100)"
                />
              )}
              
              {/* Medium Risk Slice */}
              {stats.mediumRiskEntries > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r="35"
                  fill="none"
                  stroke="#feca57"
                  strokeWidth="70"
                  strokeDasharray={`${(stats.mediumRiskEntries / (stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries)) * 220} 220`}
                  strokeDashoffset={`-${((stats.criticalRiskEntries + stats.highRiskEntries) / (stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries)) * 220}`}
                  transform="rotate(-90 100 100)"
                />
              )}
              
              {/* Low Risk Slice */}
              {stats.lowRiskEntries > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r="35"
                  fill="none"
                  stroke="#48dbfb"
                  strokeWidth="70"
                  strokeDasharray={`${(stats.lowRiskEntries / (stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries)) * 220} 220`}
                  strokeDashoffset={`-${((stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries) / (stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries)) * 220}`}
                  transform="rotate(-90 100 100)"
                />
              )}
              
              {/* Center text */}
              <text x="100" y="95" textAnchor="middle" className="pie-chart-center-text">
                <tspan fontSize="24" fontWeight="bold" fill="#2d3748">
                  {stats.criticalRiskEntries + stats.highRiskEntries + stats.mediumRiskEntries + stats.lowRiskEntries}
                </tspan>
              </text>
              <text x="100" y="110" textAnchor="middle" className="pie-chart-center-label">
                <tspan fontSize="12" fill="#718096">Total Risks</tspan>
              </text>
            </svg>
          </div>
          
          {/* Risk Legend */}
          <div className="risk-legend">
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#dc3545'}}></div>
              <span>Critical Risk ({stats.criticalRiskEntries})</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#ff6b6b'}}></div>
              <span>High Risk ({stats.highRiskEntries})</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#feca57'}}></div>
              <span>Medium Risk ({stats.mediumRiskEntries})</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#48dbfb'}}></div>
              <span>Low Risk ({stats.lowRiskEntries})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Progress */}
      <div className="section-grid">
        <div className="sheet-progress">
          <div className="section-header">
            <h3>Sheet Progress</h3>
            <Link to="/admin/team-sheets" className="btn btn-sm btn-outline-primary">View Details</Link>
          </div>
          <div className="progress-stats">
            <div className="progress-item">
              <div className="progress-circle completed">
                <span>{getProgressPercentage(stats.completedSheets, stats.totalSheets)}%</span>
              </div>
              <div className="progress-info">
                <h4>{stats.completedSheets}</h4>
                <p>Completed</p>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-circle in-progress">
                <span>{getProgressPercentage(stats.inProgressSheets, stats.totalSheets)}%</span>
              </div>
              <div className="progress-info">
                <h4>{stats.inProgressSheets}</h4>
                <p>In Progress</p>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-circle pending">
                <span>{getProgressPercentage(stats.pendingSheets, stats.totalSheets)}%</span>
              </div>
              <div className="progress-info">
                <h4>{stats.pendingSheets}</h4>
                <p>Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sheets */}
        <div className="recent-sheets">
          <div className="section-header">
            <h3>Recent Sheets</h3>
            <Link to="/upload" className="btn btn-sm btn-primary">
              <i className="fas fa-plus me-1"></i>Add New
            </Link>
          </div>
          <div className="sheets-list">
            {recentSheets.length > 0 ? (
              recentSheets.map(sheet => (
                <div key={sheet.id} className="sheet-item">
                  <div className="sheet-info">
                    <h5>{sheet.title || 'Untitled Sheet'}</h5>
                    <p>{new Date(sheet.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="sheet-status">
                    <span className={`status-badge ${sheet.status || 'pending'}`}>
                      {sheet.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <i className="fas fa-inbox"></i>
                <p>No sheets uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor & Product Insights */}
      {dashboardData && (dashboardData.vendors.top.length > 0 || dashboardData.products.top.length > 0) && (
        <div className="section-grid">
          {/* Top Vendors */}
          {dashboardData.vendors.top.length > 0 && (
            <div className="system-health">
              <div className="section-header">
                <h3>Top Vendors</h3>
                <span className="status-badge healthy">
                  {dashboardData.vendors.total} Total
                </span>
              </div>
              <div className="health-metrics">
                {dashboardData.vendors.top.slice(0, 5).map((vendor, index) => (
                  <div key={index} className="health-item">
                    <span className="health-label">{vendor.name}</span>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.min((vendor.entries / dashboardData.vendors.top[0].entries) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{vendor.entries}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          {dashboardData.products.top.length > 0 && (
            <div className="system-health">
              <div className="section-header">
                <h3>Top Products</h3>
                <span className="status-badge healthy">
                  {dashboardData.products.total} Total
                </span>
              </div>
              <div className="health-metrics">
                {dashboardData.products.top.slice(0, 5).map((product, index) => (
                  <div key={index} className="health-item">
                    <span className="health-label" title={product.name}>
                      {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
                    </span>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.min((product.entries / dashboardData.products.top[0].entries) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{product.entries}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/upload" className="action-card">
            <i className="fas fa-upload"></i>
            <span>Upload Sheet</span>
          </Link>
          <Link to="/admin/users" className="action-card">
            <i className="fas fa-user-plus"></i>
            <span>Add User</span>
          </Link>
          <button 
            onClick={() => setShowCISAGenerator(!showCISAGenerator)}
            className={`action-card action-button ${showCISAGenerator ? 'active' : ''}`}
          >
            <i className="fas fa-shield-alt"></i>
            <span>CISA Reports</span>
          </button>
          <Link to="/admin/team-sheets" className="action-card">
            <i className="fas fa-chart-bar"></i>
            <span>Team Reports</span>
          </Link>

        </div>
      </div>

      {/* CISA Report Generator */}
      {console.log('Rendering CISA Generator section, showCISAGenerator:', showCISAGenerator)}
      {showCISAGenerator && (
        <div className="cisa-generator-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-shield-alt me-2"></i>
              CISA Advisory Report Generator
            </h3>
            <button 
              onClick={() => setShowCISAGenerator(false)}
              className="btn btn-outline-secondary btn-sm"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <CISAReportGenerator />
        </div>
      )}


    </div>
  );
};

export default EnhancedAdminDashboard;
