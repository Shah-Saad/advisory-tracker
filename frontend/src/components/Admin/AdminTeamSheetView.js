import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import sseService from '../../services/sseService';

const AdminTeamSheetView = () => {
  const { sheetId, teamKey } = useParams();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const intervalRef = useRef(null);
  const hasLoadedRef = useRef(false);

  // Filter states
  const [filters, setFilters] = useState({
    riskLevel: '',
    deployedInKE: '',
    vendorContacted: '',
    searchTerm: ''
  });
  const [filteredResponses, setFilteredResponses] = useState([]);

  const loadTeamSheetData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setRefreshing(true);
        setLoading(true);
      }
        setError('');
      
      console.log('🔄 Loading team sheet data for:', { sheetId, teamKey });
      const data = await sheetService.getAdminTeamSheetData(sheetId, teamKey);
      console.log('✅ Team sheet data received:', data);
      console.log('📊 Assignment status:', data.assignment_status);
      console.log('📊 Assignment object:', data.assignment);
      console.log('📊 Team name:', data.team_name);
      console.log('📊 Responses count:', data.responses?.length);
      console.log('📊 First response sample:', data.responses?.[0]);
      
      setTeamData(data);
      setLastUpdated(new Date());
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('❌ Error loading team sheet data:', err);
      setError(err.message || 'Failed to load team sheet data');
    } finally {
      if (showLoading) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, [sheetId, teamKey]);

  useEffect(() => {
    console.log('🔄 AdminTeamSheetView useEffect triggered:', { sheetId, teamKey });
    // Reset the loaded flag when sheetId or teamKey changes
    hasLoadedRef.current = false;
    if (sheetId && teamKey) {
    loadTeamSheetData();
    }
  }, [sheetId, teamKey, loadTeamSheetData]);

  // Auto-refresh functionality
  useEffect(() => {
    let interval;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        loadTeamSheetData(false); // Use silent refresh
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh, loadTeamSheetData]);

  // Check for recent updates and highlight them
  const isRecentlyUpdated = (updatedAt) => {
    if (!updatedAt) return false;
    const updateTime = new Date(updatedAt);
    const now = new Date();
    const diffInMinutes = (now - updateTime) / (1000 * 60);
    return diffInMinutes < 5; // Highlight updates from last 5 minutes
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Filter responses based on current filters
  const applyFilters = useCallback(() => {
    if (!teamData?.responses) {
      setFilteredResponses([]);
      return;
    }

    let filtered = [...teamData.responses];

    // Filter by risk level
    if (filters.riskLevel) {
      filtered = filtered.filter(response => {
        const riskLevel = response.risk_level || response.original_risk_level;
        return riskLevel === filters.riskLevel;
      });
    }

    // Filter by deployed in KE
    if (filters.deployedInKE) {
      filtered = filtered.filter(response => response.deployed_in_ke === filters.deployedInKE);
    }

    // Filter by vendor contacted
    if (filters.vendorContacted) {
      filtered = filtered.filter(response => response.vendor_contacted === filters.vendorContacted);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(response => 
        (response.product_name && response.product_name.toLowerCase().includes(searchLower)) ||
        (response.vendor_name && response.vendor_name.toLowerCase().includes(searchLower)) ||
        (response.oem_vendor && response.oem_vendor.toLowerCase().includes(searchLower)) ||
        (response.cve && response.cve.toLowerCase().includes(searchLower)) ||
        (response.site && response.site.toLowerCase().includes(searchLower)) ||
        (response.comments && response.comments.toLowerCase().includes(searchLower))
      );
    }

    setFilteredResponses(filtered);
  }, [teamData?.responses, filters]);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      riskLevel: '',
      deployedInKE: '',
      vendorContacted: '',
      searchTerm: ''
    });
  };

  const handleUnlockSheet = async () => {
    if (!window.confirm(`Are you sure you want to unlock this sheet for ${teamData.team_name || teamData.teamName}? This will reset the sheet status from completed back to in-progress, allowing the team to continue working on it.`)) {
      return;
    }

    setUnlocking(true);
    try {
      const reason = prompt('Please provide a reason for unlocking this sheet (optional):') || 'Admin decision';
      
      // Get team ID from the assignment data
      const teamId = teamData.assignment?.team_id || teamData.team_id;
      if (!teamId) {
        throw new Error('Team ID not found');
      }
      
      await sheetService.unlockTeamSheet(sheetId, teamId, reason);
      
      // Refresh the data to show updated status
      await loadTeamSheetData();
      
      alert('Sheet unlocked successfully! The team can now continue working on it.');
    } catch (error) {
      console.error('Failed to unlock sheet:', error);
      alert('Failed to unlock sheet: ' + (error.message || 'Unknown error'));
    } finally {
      setUnlocking(false);
    }
  };

  const getEntryStatusColor = (response) => {
    if (!response.current_status) return 'table-light';
    
    const hasKeyFields = response.vendor_contacted && 
                        ((response.deployed_in_ke === 'Y' && response.compensatory_controls_provided) || 
                         response.deployed_in_ke === 'N');
    
    if (hasKeyFields) return 'table-success';
    if (response.current_status) return 'table-warning';
    return 'table-light';
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
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
      <div className="container-fluid p-4">
        <div className="alert alert-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning">
          No team sheet data found.
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
              <h1 className="h3 mb-0">
                {teamData.team_name || teamData.teamName} Team - Live Sheet View
                {refreshing && (
                  <span className="ms-2">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Refreshing...</span>
                    </div>
                  </span>
                )}
              </h1>
              <p className="text-muted">
                {teamData.sheet?.title}
                {lastUpdated && (
                  <span className="ms-2 small">
                    • Last updated: {formatTimeAgo(lastUpdated)}
                  </span>
                )}
                <span className="ms-2 small">
                  • Real-time: 
                  <span className={`ms-1 ${sseConnected ? 'text-success' : 'text-warning'}`}>
                    <i className={`fas ${sseConnected ? 'fa-wifi' : 'fa-wifi-slash'} me-1`}></i>
                    {sseConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </span>
              </p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => navigate('/admin/team-sheets')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Back to Sheets
              </button>
              
              {/* Show unlock button only if sheet is completed */}
              {teamData.assignment?.status === 'completed' && (
                <button 
                  className="btn btn-warning" 
                  onClick={handleUnlockSheet}
                  disabled={unlocking}
                  title="Unlock sheet to allow team to continue working"
                >
                  {unlocking ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-unlock me-1"></i>
                      Unlock Sheet
                    </>
                  )}
                </button>
              )}
              
              <button 
                className="btn btn-outline-primary" 
                onClick={() => loadTeamSheetData()}
                disabled={refreshing}
              >
                <i className="fas fa-sync-alt me-1"></i>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button 
                className={`btn ${isAutoRefresh ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              >
                <i className="fas fa-eye me-1"></i>
                {isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>
            </div>
          </div>

          {/* Sheet Information */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Sheet Information</h6>
                </div>
                <div className="card-body">
                  <p><strong>Title:</strong> {teamData.sheet?.title}</p>
                  <p><strong>Status:</strong> {teamData.sheet?.status}</p>
                  <p><strong>Created:</strong> {teamData.sheet?.created_at ? formatDate(teamData.sheet.created_at) : 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Team Progress & Status</h6>
                </div>
                <div className="card-body">
                  <p><strong>Assignment Status:</strong> 
                    <span className={`ms-2 badge ${
                      teamData.assignment_status === 'completed' ? 'bg-success' :
                      teamData.assignment_status === 'in_progress' ? 'bg-warning text-dark' :
                      teamData.assignment_status === 'assigned' ? 'bg-secondary' : 'bg-light text-dark'
                    }`}>
                      {teamData.assignment_status?.replace('_', ' ') || 'Unknown'}
                    </span>
                    {teamData.assignment_status === 'completed' && (
                      <button
                        className="btn btn-outline-warning btn-sm ms-2"
                        onClick={handleUnlockSheet}
                        disabled={unlocking}
                        title="Unlock this sheet to allow the team to edit their responses again"
                      >
                        {unlocking ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-1" role="status"></div>
                            Unlocking...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-unlock me-1"></i>
                            Unlock Sheet
                          </>
                        )}
                      </button>
                    )}
                  </p>
                  
                  {/* Debug information */}
                  <div className="mt-2 small text-muted">
                    <strong>Debug Info:</strong> 
                    Assignment Status: {teamData.assignment_status || 'Unknown'} | 
                    Assignment Object Status: {teamData.assignment?.status || 'Unknown'} | 
                    Is Completed: {teamData.assignment_status === 'completed' ? 'Yes' : 'No'} | 
                    Unlocking: {unlocking ? 'Yes' : 'No'}
                  </div>
                  
                  <p><strong>Total Responses:</strong> {teamData.responses?.length || 0}</p>
                  <p><strong>Assigned At:</strong> {teamData.assigned_at ? formatDate(teamData.assigned_at) : 'N/A'}</p>
                  <p><strong>Submitted At:</strong> {teamData.submitted_at ? formatDate(teamData.submitted_at) : 'Not submitted'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Responses */}
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  Live Team Responses 
                  {filters.searchTerm || filters.riskLevel || filters.deployedInKE || filters.vendorContacted ? (
                    <span className="text-muted">
                      ({filteredResponses.length} of {teamData.responses?.length || 0})
                    </span>
                  ) : (
                    <span>({teamData.responses?.length || 0})</span>
                  )}
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <small className="text-muted">
                    <i className="fas fa-circle text-success" style={{fontSize: '8px'}}></i>
                    {isAutoRefresh ? ' Auto-updating every 30s' : ' Auto-update paused'}
                  </small>
                  {refreshing && <div className="spinner-border spinner-border-sm" role="status"></div>}
                </div>
              </div>
            </div>
            <div className="card-body">
              {teamData.responses && teamData.responses.length > 0 ? (
                <>
                  {/* Filters Section */}
                  <div className="mb-4">
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label small">Search</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Search products, vendors, CVE..."
                          value={filters.searchTerm}
                          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Risk Level</label>
                        <select
                          className="form-select form-select-sm"
                          value={filters.riskLevel}
                          onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                        >
                          <option value="">All Risk Levels</option>
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Deployed in KE</label>
                        <select
                          className="form-select form-select-sm"
                          value={filters.deployedInKE}
                          onChange={(e) => handleFilterChange('deployedInKE', e.target.value)}
                        >
                          <option value="">All</option>
                          <option value="Y">Yes</option>
                          <option value="N">No</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Vendor Contacted</label>
                        <select
                          className="form-select form-select-sm"
                          value={filters.vendorContacted}
                          onChange={(e) => handleFilterChange('vendorContacted', e.target.value)}
                        >
                          <option value="">All</option>
                          <option value="Y">Yes</option>
                          <option value="N">No</option>
                        </select>
                      </div>
                      <div className="col-md-3 d-flex align-items-end">
                        <button
                          className="btn btn-outline-secondary btn-sm me-2"
                          onClick={clearFilters}
                        >
                          <i className="fas fa-times me-1"></i>
                          Clear Filters
                        </button>
                        <span className="text-muted small">
                          Showing {filteredResponses.length} of {teamData.responses.length} entries
                        </span>
                      </div>
                    </div>
                  </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Vendor</th>
                        <th>Source</th>
                        <th>Risk Level</th>
                        <th>CVE</th>
                        <th>Deployed in KE?</th>
                        <th>Location/Site</th>
                        <th>Status</th>
                        <th>Vendor Contacted</th>
                        <th>Patching</th>
                        <th>Compensatory Controls</th>
                        <th>Comments</th>
                        <th>Updated</th>
                      </tr>
                      <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th style={{textAlign: 'center'}}>
                          <div className="d-flex justify-content-around">
                            <small>Est. Release Date</small>
                            <small>Implementation Date</small>
                          </div>
                        </th>
                        <th></th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                        {filteredResponses.map((response, index) => (
                        <tr key={response.id || index} className={`${getEntryStatusColor(response)} ${isRecentlyUpdated(response.updated_at) ? 'border-primary border-2' : ''}`}>
                          <td>
                            <small>{response.product_name || 'N/A'}</small>
                            {isRecentlyUpdated(response.updated_at) && (
                              <span className="badge bg-primary ms-1" style={{fontSize: '10px'}}>
                                <i className="fas fa-clock"></i> Updated
                              </span>
                            )}
                          </td>
                          <td>
                            <small>{response.vendor_name || response.oem_vendor || 'N/A'}</small>
                          </td>
                          <td>
                            {response.source ? (
                              <a href={response.source} target="_blank" rel="noopener noreferrer" className="text-primary">
                                <small>{response.source.includes('cisa.gov') ? 'CISA Advisory' : 'Source Link'}</small>
                              </a>
                            ) : (
                              <small className="text-muted">N/A</small>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              response.risk_level === 'Critical' ? 'bg-danger' :
                              response.risk_level === 'High' ? 'bg-warning text-dark' :
                              response.risk_level === 'Medium' ? 'bg-info text-dark' :
                                response.risk_level === 'Low' ? 'bg-success' : 
                                response.original_risk_level === 'Critical' ? 'bg-danger' :
                                response.original_risk_level === 'High' ? 'bg-warning text-dark' :
                                response.original_risk_level === 'Medium' ? 'bg-info text-dark' :
                                response.original_risk_level === 'Low' ? 'bg-success' : 'bg-secondary'
                              }`}>
                                {response.risk_level || response.original_risk_level || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <small>{response.cve || 'N/A'}</small>
                          </td>
                          <td>
                            <span className={`badge ${response.deployed_in_ke === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                              {response.deployed_in_ke === 'Y' ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            <small>{response.deployed_in_ke === 'Y' ? (response.site || 'N/A') : 'N/A'}</small>
                          </td>
                          <td>
                            <small>{response.deployed_in_ke === 'Y' ? (response.current_status || 'N/A') : 'N/A'}</small>
                          </td>
                          <td>
                            <small>{response.deployed_in_ke === 'Y' ? (response.vendor_contacted || 'N/A') : 'N/A'}</small>
                            {response.deployed_in_ke === 'Y' && response.vendor_contacted === 'Y' && response.vendor_contact_date && (
                              <div><small className="text-muted">Contact Date: {formatDate(response.vendor_contact_date)}</small></div>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <div className="flex-fill">
                                {response.deployed_in_ke === 'Y' && response.patching_est_release_date ? (
                                  <small>{formatDate(response.patching_est_release_date)}</small>
                                ) : (
                                  <small className="text-muted">N/A</small>
                                )}
                              </div>
                              <div className="flex-fill">
                                {response.deployed_in_ke === 'Y' && response.implementation_date ? (
                                  <small>{formatDate(response.implementation_date)}</small>
                                ) : (
                                  <small className="text-muted">N/A</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <small>{response.deployed_in_ke === 'Y' ? (response.compensatory_controls_provided || 'N/A') : 'N/A'}</small>
                            {response.deployed_in_ke === 'Y' && response.compensatory_controls_provided === 'Y' && response.compensatory_controls_details && (
                              <div><small className="text-muted">{response.compensatory_controls_details}</small></div>
                            )}
                          </td>
                          <td>
                            {response.comments ? (
                              <span title={response.comments}>
                                {response.comments.length > 50 ? 
                                  response.comments.substring(0, 50) + '...' : 
                                  response.comments}
                              </span>
                            ) : (
                              <span className="text-muted">No comments</span>
                            )}
                          </td>
                          <td>
                            <small>{formatDate(response.updated_at) || 'N/A'}</small>
                            {isRecentlyUpdated(response.updated_at) && (
                              <div>
                                <small className="text-primary">
                                  <i className="fas fa-pulse"></i> {formatTimeAgo(new Date(response.updated_at))}
                                </small>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <h5>
                    {filters.searchTerm || filters.riskLevel || filters.deployedInKE || filters.vendorContacted 
                      ? 'No Matching Responses' 
                      : 'No Responses Yet'}
                  </h5>
                  <p className="text-muted">
                    {filters.searchTerm || filters.riskLevel || filters.deployedInKE || filters.vendorContacted
                      ? 'No responses match your current filters. Try adjusting your search criteria.'
                      : 'This team hasn\'t submitted any responses for this sheet.'}
                  </p>
                  {(filters.searchTerm || filters.riskLevel || filters.deployedInKE || filters.vendorContacted) && (
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={clearFilters}
                    >
                      <i className="fas fa-times me-1"></i>
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTeamSheetView;
