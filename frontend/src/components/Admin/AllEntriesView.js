import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AllEntriesView.css';

const AllEntriesView = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    deployedInKE: 'all',
    status: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    deployed: 0,
    notDeployed: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  useEffect(() => {
    fetchAllEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, filters]);

  const fetchAllEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/sheet-entries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setEntries(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Error loading entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (entriesData) => {
    const stats = {
      total: entriesData.length,
      deployed: entriesData.filter(entry => entry.deployed_in_ke === 'Y').length,
      notDeployed: entriesData.filter(entry => entry.deployed_in_ke === 'N').length,
      completed: entriesData.filter(entry => entry.status === 'Completed').length,
      inProgress: entriesData.filter(entry => entry.status === 'In Progress').length,
      pending: entriesData.filter(entry => entry.status === 'New').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Filter by "Deployed in KE?"
    if (filters.deployedInKE !== 'all') {
      filtered = filtered.filter(entry => entry.deployed_in_ke === filters.deployedInKE);
    }

    // Filter by Status
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    setFilteredEntries(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'New': return 'info';
      case 'Blocked': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="all-entries-container">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-entries-container">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="all-entries-container">
      {/* Header */}
      <div className="entries-header">
        <div className="header-content">
          <h2>
            <i className="fas fa-list-alt me-2"></i>
            All Entries Overview
          </h2>
          <p className="text-muted">
            View and filter all entries submitted by all teams across all sheets
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline-primary"
            onClick={fetchAllEntries}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-list"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Entries</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon deployed">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.deployed}</h3>
            <p>Deployed in KE</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon not-deployed">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.notDeployed}</h3>
            <p>Not Deployed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <i className="fas fa-flag-checkered"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon in-progress">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h4>
            <i className="fas fa-filter me-2"></i>
            Filters
          </h4>
          <span className="filter-count">
            Showing {filteredEntries.length} of {entries.length} entries
          </span>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="deployedFilter" className="form-label">
              <i className="fas fa-server me-1"></i>
              Deployed in KE?
            </label>
            <select
              id="deployedFilter"
              className="form-select"
              value={filters.deployedInKE}
              onChange={(e) => handleFilterChange('deployedInKE', e.target.value)}
            >
              <option value="all">All Entries</option>
              <option value="Y">Yes (Deployed)</option>
              <option value="N">No (Not Deployed)</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="statusFilter" className="form-label">
              <i className="fas fa-tasks me-1"></i>
              Status
            </label>
            <select
              id="statusFilter"
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="New">New</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="form-label">
              <i className="fas fa-times me-1"></i>
              Clear Filters
            </label>
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => setFilters({ deployedInKE: 'all', status: 'all' })}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="entries-table-container">
        <div className="table-responsive">
          <table className="table table-hover entries-table">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Sheet</th>
                <th>Team</th>
                <th>Product Name</th>
                <th>Vendor</th>
                <th>Risk Level</th>
                <th>Deployed in KE?</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="entry-row">
                    <td>
                      <span className="entry-id">#{entry.id}</span>
                    </td>
                    <td>
                      <div className="sheet-info">
                        <span className="sheet-title">{entry.sheet_title || 'N/A'}</span>
                        <small className="text-muted">{entry.sheet_month_year || 'N/A'}</small>
                      </div>
                    </td>
                    <td>
                      <span className="team-badge">{entry.team_name || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="product-info">
                        <span className="product-name" title={entry.product_name}>
                          {entry.product_name && entry.product_name.length > 50 
                            ? entry.product_name.substring(0, 50) + '...' 
                            : entry.product_name || 'N/A'}
                        </span>
                        {entry.cve && (
                          <small className="text-muted d-block">
                            CVE: {entry.cve.length > 30 ? entry.cve.substring(0, 30) + '...' : entry.cve}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="vendor-name">{entry.oem_vendor || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`badge bg-${getRiskLevelColor(entry.risk_level)}`}>
                        {entry.risk_level || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${entry.deployed_in_ke === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                        {entry.deployed_in_ke === 'Y' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusColor(entry.status)}`}>
                        {entry.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <span className="update-date">
                        {entry.updated_at ? formatDate(entry.updated_at) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          title="View Details"
                          onClick={() => window.open(entry.source, '_blank')}
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-info"
                          title="View Sheet"
                          onClick={() => window.open(`/admin/team-sheets/${entry.sheet_id}/${entry.team_id}`, '_blank')}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    <div className="no-entries">
                      <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No entries found matching the current filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllEntriesView;
