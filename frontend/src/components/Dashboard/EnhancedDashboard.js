import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import sheetService from '../../services/sheetService';
import { vendorService, productService } from '../../services/vendorProductService';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const EnhancedDashboard = ({ user }) => {
  console.log('🚀 EnhancedDashboard component rendered for user:', user?.email, 'role:', user?.role);
  
  // Initialize all hooks first (must be called unconditionally)
  const [stats, setStats] = useState({
    totalEntries: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    criticalRiskCount: 0,
    pendingPatches: 0,
    completedPatches: 0
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allEntries, setAllEntries] = useState([]);

  // Load dashboard data function - must be declared before useEffect
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data for user:', user?.role);
      
      // Load enhanced statistics for admins using the new reporting API
      if (user?.role === 'admin') {
        console.log('👑 Loading admin dashboard data...');
        // Get comprehensive dashboard stats for admin
        const dashboardStatsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/reports/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('📊 Dashboard stats response status:', dashboardStatsResponse.status);
        
        if (dashboardStatsResponse.ok) {
          const dashboardStatsData = await dashboardStatsResponse.json();
          console.log('📊 Dashboard stats data:', dashboardStatsData);
          const patchingStats = dashboardStatsData.data.patching_summary;
          
          // Update stats with real active entries data
          setStats({
            totalEntries: patchingStats.active_entries, // Only active entries
            highRiskCount: patchingStats.high_risk,
            mediumRiskCount: patchingStats.medium_risk,
            lowRiskCount: patchingStats.low_risk,
            criticalRiskCount: patchingStats.critical_risk,
            pendingPatches: patchingStats.new_entries + patchingStats.in_progress_entries,
            completedPatches: patchingStats.completed_entries
          });
          console.log('✅ Stats updated successfully');
        } else {
          console.error('❌ Dashboard stats API failed:', dashboardStatsResponse.status, dashboardStatsResponse.statusText);
        }

        // Load only ACTIVE entries for the chart (not completed/patched)
        const allEntriesResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/sheet-entries`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (allEntriesResponse.ok) {
          let allEntriesData = await allEntriesResponse.json();
          
          // Filter to only show entries that are NOT completed/patched
          allEntriesData = allEntriesData.filter(entry => {
            return !entry.status || !['completed', 'patched', 'closed'].includes(entry.status?.toLowerCase());
          });
          
          console.log('Active entries loaded for chart:', allEntriesData.length);
          setAllEntries(allEntriesData);
          setRecentEntries(allEntriesData.slice(0, 5));
        }
      } else {
        // Team members only see their assigned active entries
        try {
          const teamSheets = await sheetService.getMyTeamSheets();
          if (teamSheets && teamSheets.length > 0) {
            // Get entries from all assigned sheets - only active ones
            const entriesPromises = teamSheets.map(sheet => 
              sheetService.getSheetEntries(sheet.id).catch(err => {
                console.warn(`Failed to load entries for sheet ${sheet.id}:`, err);
                return [];
              })
            );
            const entriesArrays = await Promise.all(entriesPromises);
            let allEntriesData = entriesArrays.flat();
            
            // Filter to only active entries for team members too
            allEntriesData = allEntriesData.filter(entry => {
              return !entry.status || !['completed', 'patched', 'closed'].includes(entry.status?.toLowerCase());
            });
            
            console.log('Active team entries loaded:', allEntriesData.length);
            setAllEntries(allEntriesData);
            setRecentEntries(allEntriesData.slice(0, 5));

            // Calculate basic stats for team members
            setStats({
              totalEntries: allEntriesData.length,
              highRiskCount: allEntriesData.filter(e => e.risk_level === 'High').length,
              mediumRiskCount: allEntriesData.filter(e => e.risk_level === 'Medium').length,
              lowRiskCount: allEntriesData.filter(e => e.risk_level === 'Low').length,
              criticalRiskCount: allEntriesData.filter(e => e.risk_level === 'Critical').length,
              pendingPatches: allEntriesData.length,
              completedPatches: 0
            });
          }
        } catch (teamError) {
          console.warn('Failed to load team sheets:', teamError);
          setAllEntries([]);
        }
      }

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

  // Real-time updates using SSE for all authenticated users
  useEffect(() => {
    // Set up SSE connection for real-time sync between admin and users
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/sse/subscribe?token=${localStorage.getItem('token')}`);
    
    eventSource.onopen = () => {
      console.log('✅ Real-time updates connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📊 Real-time update received:', data);
        
        if (data.type === 'entry_update') {
          loadDashboardData(); // Refresh all dashboard data
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Initial data load and refresh interval
  useEffect(() => {
    // Only load data if user is properly authenticated
    if (user && localStorage.getItem('token')) {
      console.log('🔄 Initial data load triggered for user:', user.email, 'role:', user.role);
      loadDashboardData();
      
      // Refresh dashboard every 30 seconds for the latest data
      const refreshInterval = setInterval(() => {
        loadDashboardData();
      }, 30000);

      return () => clearInterval(refreshInterval);
    } else {
      console.log('⚠️ User or token not ready, skipping data load:', { user: !!user, token: !!localStorage.getItem('token') });
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-muted">Loading Dashboard...</h4>
        </div>
      </div>
    );
  }

  // Pie chart data based on risk levels  
  const getRiskLevelChartData = () => {
    const riskCounts = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Unknown: 0
    };

    console.log('Total entries for chart:', allEntries.length);
    
    allEntries.forEach(entry => {
      const risk = entry.risk_level || 'Unknown';
      console.log('Processing entry with risk level:', risk);
      
      // Normalize risk level names
      const normalizedRisk = risk.toLowerCase();
      if (normalizedRisk === 'critical') {
        riskCounts.Critical++;
      } else if (normalizedRisk === 'high') {
        riskCounts.High++;
      } else if (normalizedRisk === 'medium') {
        riskCounts.Medium++;
      } else if (normalizedRisk === 'low') {
        riskCounts.Low++;
      } else {
        riskCounts.Unknown++;
      }
    });

    console.log('Risk counts:', riskCounts);

    // Filter out zero counts
    const filteredLabels = Object.keys(riskCounts).filter(key => riskCounts[key] > 0);
    const filteredData = filteredLabels.map(label => riskCounts[label]);
    
    console.log('Filtered labels:', filteredLabels);
    console.log('Filtered data:', filteredData);
    
    const filteredColors = filteredLabels.map(label => {
      switch(label) {
        case 'Critical': return '#dc3545';
        case 'High': return '#fd7e14';
        case 'Medium': return '#ffc107';
        case 'Low': return '#28a745';
        default: return '#6c757d';
      }
    });

    const chartData = {
      labels: filteredLabels,
      datasets: [
        {
          label: 'Risk Level Distribution',
          data: filteredData,
          backgroundColor: filteredColors,
          borderColor: filteredColors.map(color => {
            // Darken the colors for borders
            return color.replace('#', '#').replace(/(.{2})(.{2})(.{2})/, (match, r, g, b) => {
              const newR = Math.max(0, parseInt(r, 16) - 30).toString(16).padStart(2, '0');
              const newG = Math.max(0, parseInt(g, 16) - 30).toString(16).padStart(2, '0');
              const newB = Math.max(0, parseInt(b, 16) - 30).toString(16).padStart(2, '0');
              return `#${newR}${newG}${newB}`;
            });
          }),
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    };
    
    console.log('Chart data:', chartData);
    return chartData;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} entries (${percentage}%)`;
          }
        }
      }
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return 'bg-danger';
      case 'high':
        return 'bg-warning text-dark';
      case 'medium':
        return 'bg-info';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const renderSourceLink = (source) => {
    if (!source || source === 'N/A') {
      return <span className="text-muted">N/A</span>;
    }
    
    if (source.toLowerCase().includes('cisa') || source.toLowerCase().includes('us-cert')) {
      if (source.toLowerCase() === 'cisa' || source.toLowerCase() === 'us-cert') {
        return (
          <a 
            href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary text-decoration-none"
          >
            <i className="fas fa-external-link-alt me-1"></i>
            CISA KEV
          </a>
        );
      }
    }
    
    if (isValidUrl(source)) {
      return (
        <a 
          href={source} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary text-decoration-none"
        >
          <i className="fas fa-external-link-alt me-1"></i>
          Source
        </a>
      );
    }
    
    return <span className="text-muted">{source}</span>;
  };

  return (
    <div className="dashboard-container" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <div className="container-fluid p-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="h2 mb-1 fw-bold text-dark">
                      <i className="fas fa-tachometer-alt text-primary me-3"></i>
                      Advisory Tracker Dashboard
                    </h1>
                    <p className="text-muted mb-0 fs-5">
                      Welcome back, <span className="fw-semibold text-primary">{user?.name || user?.email}</span>
                      {user?.team?.name && (
                        <span className="ms-2">
                          <i className="fas fa-users text-info me-1"></i>
                          {user.team.name} Team
                        </span>
                      )}
                      <span className="ms-3 small">
                        <i className="fas fa-sync-alt text-success me-1"></i>
                        Real-time sync enabled
                      </span>
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    {user?.role === 'admin' && (
                      <Link to="/upload" className="btn btn-primary btn-lg shadow-sm">
                        <i className="fas fa-cloud-upload-alt me-2"></i>Upload Sheet
                      </Link>
                    )}
                    <Link to="/entries" className="btn btn-outline-primary btn-lg shadow-sm">
                      <i className="fas fa-list me-2"></i>View All
                    </Link>
                    <button 
                      onClick={loadDashboardData}
                      className="btn btn-outline-secondary btn-lg shadow-sm"
                      disabled={loading}
                    >
                      <i className={`fas fa-sync-alt me-2 ${loading ? 'fa-spin' : ''}`}></i>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards Row - Now showing ACTIVE entries only */}
        <div className="row mb-4 g-3">
          <div className="col-xl-3 col-lg-6">
            <div className="stats-card card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white d-flex align-items-center">
                <div className="stats-icon me-3">
                  <i className="fas fa-database fa-2x opacity-75"></i>
                </div>
                <div>
                  <h6 className="card-title text-white-50 mb-1">Active Entries</h6>
                  <h2 className="mb-0 fw-bold">{allEntries.length}</h2>
                  <small className="text-white-50">In patching stage</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6">
            <div className="stats-card card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
              <div className="card-body text-white d-flex align-items-center">
                <div className="stats-icon me-3">
                  <i className="fas fa-exclamation-triangle fa-2x opacity-75"></i>
                </div>
                <div>
                  <h6 className="card-title text-white-50 mb-1">Critical/High Risk</h6>
                  <h2 className="mb-0 fw-bold">
                    {allEntries.filter(e => ['Critical', 'High'].includes(e.risk_level)).length}
                  </h2>
                  <small className="text-white-50">Urgent patching needed</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6">
            <div className="stats-card card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)' }}>
              <div className="card-body text-dark d-flex align-items-center">
                <div className="stats-icon me-3">
                  <i className="fas fa-exclamation-circle fa-2x opacity-75"></i>
                </div>
                <div>
                  <h6 className="card-title text-dark opacity-75 mb-1">Medium Risk</h6>
                  <h2 className="mb-0 fw-bold">
                    {allEntries.filter(e => e.risk_level === 'Medium').length}
                  </h2>
                  <small className="text-dark opacity-75">Active monitoring</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6">
            <div className="stats-card card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' }}>
              <div className="card-body text-white d-flex align-items-center">
                <div className="stats-icon me-3">
                  <i className="fas fa-shield-alt fa-2x opacity-75"></i>
                </div>
                <div>
                  <h6 className="card-title text-white-50 mb-1">Low Risk</h6>
                  <h2 className="mb-0 fw-bold">
                    {allEntries.filter(e => e.risk_level === 'Low').length}
                  </h2>
                  <small className="text-white-50">Lower priority</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Entries Row */}
        <div className="row mb-4 g-4">
          {/* Risk Level Distribution Pie Chart */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg h-100" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-transparent border-0 pt-4">
                <h5 className="mb-0 fw-bold text-center">
                  <i className="fas fa-chart-pie text-primary me-2"></i>
                  Active Patching Status by Risk Level
                </h5>
                <small className="text-muted text-center d-block">Entries currently in patching stage</small>
              </div>
              <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '350px' }}>
                {allEntries.length > 0 ? (
                  <div style={{ width: '100%', height: '300px' }}>
                    <Pie data={getRiskLevelChartData()} options={chartOptions} />
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    <i className="fas fa-chart-pie fa-3x mb-3 opacity-25"></i>
                    <p className="mb-0">No data available</p>
                    <small>Upload sheets to see distribution</small>
                    <div className="mt-2">
                      <button 
                        onClick={loadDashboardData}
                        className="btn btn-sm btn-outline-primary"
                        disabled={loading}
                      >
                        <i className={`fas fa-sync-alt me-1 ${loading ? 'fa-spin' : ''}`}></i>
                        Refresh Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg h-100" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-transparent border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">
                    <i className="fas fa-clock text-warning me-2"></i>
                    Recent Entries
                  </h5>
                  <Link to="/entries" className="btn btn-outline-primary btn-sm">
                    <i className="fas fa-external-link-alt me-1"></i>View All
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {recentEntries.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold">Vendor</th>
                          <th className="border-0 fw-semibold">Product</th>
                          <th className="border-0 fw-semibold text-center">Risk</th>
                          <th className="border-0 fw-semibold">CVE</th>
                          <th className="border-0 fw-semibold text-center">Deployed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEntries.map((entry, index) => (
                          <tr key={index} className="border-bottom">
                            <td className="fw-medium">{entry.vendor_name || entry.oem_vendor || 'N/A'}</td>
                            <td>
                              <div className="fw-medium">{entry.product_name || 'N/A'}</div>
                              {entry.product_category && (
                                <small className="text-muted">{entry.product_category}</small>
                              )}
                            </td>
                            <td className="text-center">
                              <span className={`badge rounded-pill px-3 py-2 ${getRiskBadgeClass(entry.risk_level)}`}>
                                {entry.risk_level || 'Unknown'}
                              </span>
                            </td>
                            <td>
                              <code className="bg-light px-2 py-1 rounded">{entry.cve || 'N/A'}</code>
                            </td>
                            <td className="text-center">
                              <span className={`badge rounded-pill px-3 py-2 ${entry.deployed_in_ke === 'Y' ? 'bg-success' : entry.deployed_in_ke === 'N' ? 'bg-secondary' : 'bg-warning text-dark'}`}>
                                {entry.deployed_in_ke === 'Y' ? 'Yes' : entry.deployed_in_ke === 'N' ? 'No' : 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-inbox fa-3x text-muted mb-3 opacity-25"></i>
                    <h6 className="text-muted">No entries found</h6>
                    <p className="text-muted">Upload a sheet or assign team sheets to get started.</p>
                    {user?.role === 'admin' && (
                      <Link to="/upload" className="btn btn-primary mt-2">
                        <i className="fas fa-upload me-1"></i>Upload Sheet
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions and System Info */}
        <div className="row g-4">
          {/* Quick Actions */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-transparent border-0 pt-4">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-bolt text-warning me-2"></i>
                  Quick Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {user?.role === 'admin' ? (
                    <>
                      <div className="col-md-4">
                        <Link to="/upload" className="btn btn-outline-primary btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none">
                          <i className="fas fa-cloud-upload-alt fa-2x mb-2"></i>
                          <span className="fw-semibold">Upload Sheet</span>
                          <small className="text-muted">Add new entries</small>
                        </Link>
                      </div>
                      <div className="col-md-4">
                        <Link to="/admin/teams" className="btn btn-outline-info btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none">
                          <i className="fas fa-users-cog fa-2x mb-2"></i>
                          <span className="fw-semibold">Manage Teams</span>
                          <small className="text-muted">Assign & review</small>
                        </Link>
                      </div>
                      <div className="col-md-4">
                        <Link to="/admin/users" className="btn btn-outline-success btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none">
                          <i className="fas fa-user-shield fa-2x mb-2"></i>
                          <span className="fw-semibold">User Management</span>
                          <small className="text-muted">Roles & permissions</small>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-md-6">
                        <Link to="/my-sheets" className="btn btn-outline-primary btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none">
                          <i className="fas fa-clipboard-list fa-2x mb-2"></i>
                          <span className="fw-semibold">My Sheets</span>
                          <small className="text-muted">View assigned sheets</small>
                        </Link>
                      </div>
                      <div className="col-md-6">
                        <Link to="/entries" className="btn btn-outline-info btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none">
                          <i className="fas fa-search fa-2x mb-2"></i>
                          <span className="fw-semibold">Browse Entries</span>
                          <small className="text-muted">Search & filter</small>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg h-100" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-transparent border-0 pt-4">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-cogs text-info me-2"></i>
                  System Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3 text-center">
                  <div className="col-6">
                    <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <h3 className="text-white fw-bold mb-1">{vendors.length}</h3>
                      <small className="text-white-50 fw-medium">Vendors</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                      <h3 className="text-white fw-bold mb-1">{products.length}</h3>
                      <small className="text-white-50 fw-medium">Products</small>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-medium text-dark">Sync Status</span>
                        <span className="badge bg-success px-3 py-2">
                          <i className="fas fa-check-circle me-1"></i>Online
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-top">
                        <small className="text-muted">
                          <i className="fas fa-sync-alt me-1"></i>
                          Last sync: {new Date().toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
