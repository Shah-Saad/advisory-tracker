import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import sheetService from '../../services/sheetService';

const TeamSheets = ({ user }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [availableSites, setAvailableSites] = useState([]);

  const loadTeamSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user has a team assigned
      if (!user?.team_id && user?.role !== 'admin') {
        setError('You are not assigned to any team. Please contact your administrator.');
        setSheets([]);
        return;
      }
      
      // If user is admin without team, show appropriate message
      if (!user?.team_id && user?.role === 'admin') {
        setError('As an admin, you can view all team sheets through the Admin panel instead.');
        setSheets([]);
        return;
      }
      
      const filterStatus = statusFilter === 'all' ? null : statusFilter;
      const data = await sheetService.getMyTeamSheets(filterStatus);
      
      console.log('📊 Raw data from API:', data);
      
      // Check if user is from generation team
      const isGenerationTeam = user?.team_name?.toLowerCase().includes('generation');
      
      console.log('👤 User team check:', {
        userTeamName: user?.team_name,
        isGenerationTeam,
        dataLength: data?.length || 0
      });
      
      // For all teams, flatten entries from all sheets for table view
      const allEntries = [];
      (data || []).forEach(sheet => {
        if (sheet.entries && Array.isArray(sheet.entries)) {
          sheet.entries.forEach(entry => {
            allEntries.push({
              ...entry,
              sheet_id: sheet.id,
              sheet_title: sheet.title,
              sheet_status: sheet.status
            });
          });
        }
      });
      
      setSheets(allEntries);
      
      // Extract unique sites for filtering
      const sites = [...new Set(allEntries.map(entry => entry.site).filter(Boolean))];
      setAvailableSites(sites);
      
      console.log('🎯 Team data processed:', {
        totalEntries: allEntries.length,
        availableSites: sites.length,
        sampleEntry: allEntries[0],
        sampleSites: sites.slice(0, 3)
      });
    } catch (err) {
      console.error('Failed to load team sheets:', err);
      if (err.message && err.message.includes('not assigned to any team')) {
        setError('You are not assigned to any team. Please contact your administrator.');
      } else {
        setError(err.message || 'Failed to load team sheets');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, siteFilter, user?.team_id, user?.role, user?.team_name]);

  useEffect(() => {
    loadTeamSheets();
  }, [loadTeamSheets]);

  const handleStartSheet = async (sheetId) => {
    try {
      await sheetService.startTeamSheet(sheetId);
      await loadTeamSheets(); // Reload to show updated status
    } catch (err) {
      setError(err.message || 'Failed to start sheet');
    }
  };

  const handleSelectEntry = async (sheetId, entryId) => {
    try {
      const result = await sheetService.selectEntry(sheetId, entryId);
      console.log('✅ Select entry result:', result);
      await loadTeamSheets(); // Reload to show updated status
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('❌ Select entry error:', err);
      const errorMessage = err?.error || err?.message || 'Failed to select entry';
      setError(`Selection failed: ${errorMessage}`);
    }
  };

  const isGenerationTeam = user?.team_name?.toLowerCase().includes('generation');

  // Filter sheets/entries based on current filters
  const filteredSheets = React.useMemo(() => {
    let filtered = sheets;
    
    console.log('🔍 Filtering sheets:', {
      totalSheets: sheets.length,
      siteFilter,
      statusFilter,
      isGenerationTeam
    });
    
    // Apply site filter for all teams
    if (siteFilter !== 'all') {
      filtered = filtered.filter(entry => entry.site === siteFilter);
      console.log('📍 After site filter:', filtered.length);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (isGenerationTeam) {
        // For generation team, filter by entry selection status
        filtered = filtered.filter(entry => {
          if (statusFilter === 'available') return !entry.assigned_to;
          if (statusFilter === 'selected') return entry.assigned_to === user?.id;
          if (statusFilter === 'assigned') return entry.assigned_to && entry.assigned_to !== user?.id;
          return true;
        });
      } else {
        // For other teams, filter by entry status or assignment
        filtered = filtered.filter(entry => {
          if (statusFilter === 'assigned') return entry.assigned_to;
          if (statusFilter === 'in_progress') return entry.status === 'in_progress';
          if (statusFilter === 'completed') return entry.status === 'completed';
          return true;
        });
      }
      console.log(`🎯 After status filter (${statusFilter}):`, filtered.length);
    }
    
    console.log('✅ Final filtered results:', filtered.length);
    return filtered;
  }, [sheets, siteFilter, statusFilter, isGenerationTeam, user?.id]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return 'badge bg-secondary';
      case 'in_progress':
        return 'badge bg-warning text-dark';
      case 'completed':
        return 'badge bg-success';
      default:
        return 'badge bg-light text-dark';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">
                {isGenerationTeam ? 'Available Entries - Pick & Choose' : 'My Team Entries'}
              </h1>
              <p className="text-muted">
                {isGenerationTeam 
                  ? `Select entries from your site: ${user?.site || 'All sites'}`
                  : `Entries assigned to ${user?.team?.name || 'your team'}`
                }
                {/* Debug Info */}
                <br />
                <small className="text-info">
                  Debug: {sheets.length} total entries, {filteredSheets.length} after filters
                </small>
              </p>
            </div>
            {isGenerationTeam && (
              <div className="text-end">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Entries are locked once selected by another user
                </small>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError('')}
              ></button>
            </div>
          )}

          {/* Filters */}
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-filter"></i>
                </span>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  {isGenerationTeam && <option value="available">Available to Pick</option>}
                  {isGenerationTeam && <option value="selected">Selected by Me</option>}
                </select>
              </div>
            </div>
            {availableSites.length > 0 && (
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-map-marker-alt"></i>
                  </span>
                  <select 
                    className="form-select"
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                  >
                    <option value="all">All Sites</option>
                    {availableSites.map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </div>
                <small className="text-muted">Note: Site data not populated in entries</small>
              </div>
            )}
          </div>

          {/* Sheets/Entries List */}
          <div className="row">
            {filteredSheets.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="fas fa-file-excel fa-3x text-muted mb-3"></i>
                    <h5 className="card-title text-muted">
                      {isGenerationTeam ? 'No Entries Available' : 'No Sheets Found'}
                    </h5>
                    <p className="card-text text-muted">
                      {statusFilter === 'all' 
                        ? (isGenerationTeam 
                            ? 'No entries are available for selection yet.'
                            : 'No sheets have been assigned to your team yet.'
                          )
                        : `No ${isGenerationTeam ? 'entries' : 'sheets'} with status "${statusFilter}" found.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : isGenerationTeam ? (
              // Table view for Generation Team entries
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="fas fa-list me-2"></i>
                      Available Entries ({filteredSheets.length})
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover table-striped mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>OEM/Vendor</th>
                            <th>Product Name</th>
                            <th>Source</th>
                            <th>Risk Level</th>
                            <th>CVE</th>
                            <th>Deployed in KE</th>
                            <th>Patching</th>
                            <th>Vendor Contacted</th>
                            <th>Compensatory Controls</th>
                            <th>Status</th>
                            <th>Comments</th>
                            <th>Month/Year</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSheets.map((entry) => (
                            <tr key={entry.id} className={entry.assigned_to === user?.id ? 'table-warning' : ''}>
                              <td>{entry.oem_vendor || 'N/A'}</td>
                              <td>
                                <div className="text-truncate" style={{ maxWidth: '200px' }} title={entry.product_name}>
                                  {entry.product_name || 'Unknown Product'}
                                </div>
                              </td>
                              <td>
                                {entry.source ? (
                                  <a href={entry.source} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                    <i className="fas fa-external-link-alt"></i>
                                  </a>
                                ) : 'N/A'}
                              </td>
                              <td>
                                {entry.risk_level && (
                                  <span className={`badge ${
                                    entry.risk_level === 'Critical' ? 'bg-danger' :
                                    entry.risk_level === 'High' ? 'bg-danger' : 
                                    entry.risk_level === 'Medium' ? 'bg-warning text-dark' : 
                                    'bg-success'
                                  }`}>
                                    {entry.risk_level}
                                  </span>
                                )}
                              </td>
                              <td>
                                {entry.cve ? (
                                  <code className="small">{entry.cve}</code>
                                ) : 'N/A'}
                              </td>
                              <td>
                                <span className={`badge ${entry.deployed_in_ke === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                  {entry.deployed_in_ke === 'Y' ? 'Yes' : entry.deployed_in_ke === 'N' ? 'No' : 'Unknown'}
                                </span>
                              </td>
                              <td>
                                {entry.patching_est_release_date ? 
                                  formatDate(entry.patching_est_release_date) : 
                                  'Not Applicable'
                                }
                              </td>
                              <td>
                                <span className={`badge ${entry.vendor_contacted === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                  {entry.vendor_contacted === 'Y' ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${entry.compensatory_controls_provided === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                  {entry.compensatory_controls_provided === 'Y' ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  entry.assigned_to === user?.id ? 'bg-warning text-dark' :
                                  entry.assigned_to ? 'bg-secondary' : 'bg-light text-dark'
                                }`}>
                                  {entry.assigned_to === user?.id ? 'Selected by Me' :
                                   entry.assigned_to ? 'Selected by Other' : 'Available'}
                                </span>
                              </td>
                              <td>
                                <div className="text-truncate" style={{ maxWidth: '150px' }} title={entry.comments}>
                                  {entry.comments || 'N/A'}
                                </div>
                              </td>
                              <td>
                                {entry.sheet_title ? new Date().toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short' 
                                }) : 'N/A'}
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  {!entry.assigned_to && (
                                    <button 
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleSelectEntry(entry.sheet_id, entry.id)}
                                      title="Pick this entry"
                                    >
                                      <i className="fas fa-hand-pointer"></i>
                                    </button>
                                  )}
                                  
                                  {entry.assigned_to === user?.id && (
                                    <>
                                      <button 
                                        className="btn btn-warning btn-sm"
                                        onClick={() => handleSelectEntry(entry.sheet_id, entry.id)}
                                        title="Unpick this entry"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                      <button 
                                        className="btn btn-primary btn-sm"
                                        title="Edit this entry"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                    </>
                                  )}
                                  
                                  {entry.assigned_to && entry.assigned_to !== user?.id && (
                                    <button 
                                      className="btn btn-secondary btn-sm"
                                      disabled
                                      title="Entry is locked by another user"
                                    >
                                      <i className="fas fa-lock"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Card view for other teams (existing logic)
              filteredSheets.map((sheet) => (
                <div key={sheet.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="card-title mb-0">
                        {isGenerationTeam ? 
                          `${sheet.product_name || 'Unknown Product'}` : 
                          sheet.title
                        }
                      </h6>
                      <div className="d-flex gap-2 align-items-center">
                        <span className={getStatusBadgeClass(isGenerationTeam ? sheet.status : sheet.assignment_status)}>
                          {isGenerationTeam ? (sheet.assigned_to ? 'Selected' : 'Available') : sheet.assignment_status}
                        </span>
                        {sheet.patching_date && (
                          <span className="badge bg-warning text-dark" title="Patching Date">
                            <i className="fas fa-clock me-1"></i>
                            {formatDate(sheet.patching_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      {!isGenerationTeam && (
                        <div className="mb-3">
                          <small className="text-muted">Month/Year:</small>
                          <div>{new Date(sheet.month_year).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}</div>
                        </div>
                      )}
                      
                      {isGenerationTeam && (
                        <>
                          <div className="mb-3">
                            <small className="text-muted">From Sheet:</small>
                            <div className="fw-bold">{sheet.sheet_title}</div>
                          </div>
                          
                          <div className="mb-3">
                            <small className="text-muted">Site:</small>
                            <div className="fw-bold text-primary">
                              {sheet.site || sheet.distribution_site || 'Not specified'}
                            </div>
                          </div>
                          
                          {sheet.risk_level && (
                            <div className="mb-3">
                              <small className="text-muted">Risk Level:</small>
                              <div>
                                <span className={`badge ${
                                  sheet.risk_level === 'High' ? 'bg-danger' : 
                                  sheet.risk_level === 'Medium' ? 'bg-warning text-dark' : 
                                  'bg-success'
                                }`}>
                                  {sheet.risk_level}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {sheet.cve && (
                            <div className="mb-3">
                              <small className="text-muted">CVE:</small>
                              <div><code>{sheet.cve}</code></div>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="mb-3">
                        <small className="text-muted">File:</small>
                        <div className="text-truncate" title={sheet.file_name}>
                          {sheet.file_name || 'N/A'}
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">
                          {isGenerationTeam ? 'Available Since:' : 'Assigned:'}
                        </small>
                        <div>{formatDate(sheet.assigned_at)}</div>
                      </div>

                      {sheet.selected_by && sheet.selected_by !== user?.id && (
                        <div className="mb-3">
                          <small className="text-muted">Selected By:</small>
                          <div className="text-danger">
                            <i className="fas fa-lock me-1"></i>
                            {sheet.selected_by_name || 'Another user'}
                          </div>
                        </div>
                      )}

                      {sheet.started_at && (
                        <div className="mb-3">
                          <small className="text-muted">Started:</small>
                          <div>{formatDate(sheet.started_at)}</div>
                        </div>
                      )}

                      {sheet.completed_at && (
                        <div className="mb-3">
                          <small className="text-muted">Completed:</small>
                          <div>{formatDate(sheet.completed_at)}</div>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <div className="d-flex gap-2">
                        {/* View Details - Available to all teams */}
                        {!isGenerationTeam && (
                          <Link 
                            to={`/entries?sheet=${sheet.id}`}
                            className="btn btn-outline-primary btn-sm flex-fill"
                          >
                            <i className="fas fa-eye me-1"></i>
                            View Details
                          </Link>
                        )}
                        
                        {/* Generation Team - Individual Entry Logic */}
                        {isGenerationTeam && (
                          <>
                            {!sheet.assigned_to && (
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleSelectEntry(sheet.sheet_id, sheet.id)}
                                title="Select this entry to work on"
                              >
                                <i className="fas fa-hand-pointer me-1"></i>
                                Select Entry
                              </button>
                            )}
                            
                            {sheet.assigned_to === user?.id && (
                              <button 
                                className="btn btn-warning btn-sm"
                                onClick={() => handleSelectEntry(sheet.sheet_id, sheet.id)}
                                title="Unselect this entry"
                              >
                                <i className="fas fa-times me-1"></i>
                                Unselect
                              </button>
                            )}
                            
                            {sheet.assigned_to && sheet.assigned_to !== user?.id && (
                              <button 
                                className="btn btn-secondary btn-sm"
                                disabled
                                title="Entry is locked by another user"
                              >
                                <i className="fas fa-lock me-1"></i>
                                Locked
                              </button>
                            )}
                          </>
                        )}
                        
                        {/* Regular Team Logic */}
                        {!isGenerationTeam && (
                          <>
                            {(sheet.assignment_status === 'assigned' || sheet.assignment_status === 'in_progress') && (
                              <Link 
                                to={`/team-sheets/${sheet.id}/edit`}
                                className="btn btn-primary btn-sm"
                              >
                                <i className="fas fa-edit me-1"></i>
                                Edit Sheet
                              </Link>
                            )}
                            
                            {sheet.assignment_status === 'assigned' && (
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleStartSheet(sheet.id)}
                              >
                                <i className="fas fa-play me-1"></i>
                                Start
                              </button>
                            )}
                          </>
                        )}
                        
                        {sheet.assignment_status === 'completed' && (
                          <span className="btn btn-outline-success btn-sm disabled">
                            <i className="fas fa-check me-1"></i>
                            {isGenerationTeam ? 'Completed' : 'Submitted'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSheets;
