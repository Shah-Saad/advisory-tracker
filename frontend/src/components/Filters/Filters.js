import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sheetService from '../../services/sheetService';

const Filters = () => {
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    risk_level: '',
    deployed_in_ke: '',
    vendor: '',
    source: '',
    cve: ''
  });
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); 
  const navigate = useNavigate();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const riskLevels = ['Low', 'Medium', 'High', 'Critical'];

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    setError('');

    try {
      // Remove empty filters
      const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      console.log('Applying filters:', activeFilters);
      const result = await sheetService.filterEntries(activeFilters);
      console.log('Filter results:', result);
      setFilteredEntries(result.data || result);
    } catch (error) {
      console.error('Filter error:', error);
      setError(error.message || 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      month: '',
      year: '',
      risk_level: '',
      deployed_in_ke: '',
      vendor: '',
      source: '',
      cve: ''
    });
    setFilteredEntries([]);
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

  const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '');

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">Advanced Filters</h1>
              <p className="text-muted">Filter entries based on multiple criteria</p>
            </div>
            <div>
              <button 
                className="btn btn-outline-secondary me-2"
                onClick={() => navigate('/dashboard')}
              >
                <i className="fas fa-arrow-left me-2"></i>Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/entries')}
              >
                <i className="fas fa-list me-2"></i>View All Entries
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Filter Form */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Filter Criteria</h5>
            </div>
            <div className="card-body">
              {/* Basic Filters */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label">Month</label>
                  <select
                    className="form-select"
                    value={filters.month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                  >
                    <option value="">All Months</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Risk Level</label>
                  <select
                    className="form-select"
                    value={filters.risk_level}
                    onChange={(e) => handleFilterChange('risk_level', e.target.value)}
                  >
                    <option value="">All Risk Levels</option>
                    {riskLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Deployed in KE</label>
                  <select
                    className="form-select"
                    value={filters.deployed_in_ke}
                    onChange={(e) => handleFilterChange('deployed_in_ke', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Vendor</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter vendor name..."
                    value={filters.vendor}
                    onChange={(e) => handleFilterChange('vendor', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Source</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter source..."
                    value={filters.source}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">CVE</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter CVE number..."
                    value={filters.cve}
                    onChange={(e) => handleFilterChange('cve', e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleApplyFilters}
                  disabled={loading || !hasActiveFilters}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Applying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-filter me-2"></i>
                      Apply Filters
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                >
                  <i className="fas fa-times me-2"></i>
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {filteredEntries.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-search-plus me-2"></i>
                  Filtered Results ({filteredEntries.length} entries)
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>OEM/Vendor</th>
                        <th>Source</th>
                        <th>Risk Level</th>
                        <th>CVE</th>
                        <th>Deployed in KE</th>
                        <th>Month/Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, index) => (
                        <tr key={entry.id || index}>
                          <td>{entry.oem_vendor || 'N/A'}</td>
                          <td>{entry.source || 'N/A'}</td>
                          <td>
                            <span className={`badge ${getRiskBadgeClass(entry.risk_level)}`}>
                              {entry.risk_level || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            {entry.cve ? (
                              <code className="small">{entry.cve}</code>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            <span className={`badge ${entry.deployed_in_ke === 'Yes' || entry.deployed_in_ke === 'Y' ? 'bg-success' : entry.deployed_in_ke === 'No' || entry.deployed_in_ke === 'N' ? 'bg-danger' : 'bg-secondary'}`}>
                              {entry.deployed_in_ke === 'Y' ? 'Yes' : entry.deployed_in_ke === 'N' ? 'No' : entry.deployed_in_ke || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            {entry.month && entry.year ? (
                              <small>{entry.month} {entry.year}</small>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {filteredEntries.length === 0 && hasActiveFilters && !loading && (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No entries match your filters</h5>
                <p className="text-muted">Try adjusting your filter criteria</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filters;
