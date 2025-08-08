import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import ProgressUpdateModal from './ProgressUpdateModal';
import VulnerabilityGroupModal from './VulnerabilityGroupModal';

const TeamSheets = ({ user }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [viewMode, setViewMode] = useState('my_entries'); // 'my_entries', 'all_entries', 'by_vulnerability'
  const [availableSites, setAvailableSites] = useState([]);
  
  // Modal states
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [vulnerabilityModalOpen, setVulnerabilityModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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
      
      // Check if user is from generation team
      const isGenerationTeam = user?.team_name?.toLowerCase().includes('generation');
      
      console.log('👤 User team check:', {
        userTeamName: user?.team_name,
        isGenerationTeam,
        loadingData: true
      });
      
      if (isGenerationTeam) {
        // For generation team, use the new generation API endpoints
        const filters = {
          view_mode: viewMode,
          status: statusFilter === 'all' ? null : statusFilter,
          site: siteFilter === 'all' ? null : siteFilter
        };
        
        const data = await sheetService.getGenerationEntries(viewMode, filters);
        console.log('📊 Generation team data from API:', data);
        
        setSheets(data || []);
        
        // Extract unique sites for filtering
        const sites = [...new Set(data.map(entry => entry.site || entry.assigned_to_site || entry.distribution_site).filter(Boolean))];
        setAvailableSites(sites);
        
        console.log('🎯 Generation team data processed:', {
          totalEntries: data?.length || 0,
          availableSites: sites.length,
          sampleEntry: data?.[0],
          sampleSites: sites.slice(0, 3)
        });
      } else {
        // For other teams, use the existing team sheets API
        const filterStatus = statusFilter === 'all' ? null : statusFilter;
        const data = await sheetService.getMyTeamSheets(filterStatus);
        
        console.log('📊 Regular team data from API:', data);
        
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
        
        setSheets(allEntries.length > 0 ? allEntries : data || []);
        
        // Extract unique sites for filtering
        const sites = [...new Set(allEntries.map(entry => entry.site).filter(Boolean))];
        setAvailableSites(sites);
        
        console.log('🎯 Regular team data processed:', {
          totalEntries: allEntries.length,
          totalSheets: data?.length || 0,
          availableSites: sites.length,
          sampleEntry: allEntries[0] || data?.[0],
          sampleSites: sites.slice(0, 3)
        });
      }
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
  }, [statusFilter, siteFilter, viewMode, user?.team_id, user?.role, user?.team_name]);

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

  const handleSelectEntry = async (originalEntryId, entryId) => {
    try {
      // For generation team, this should create a user copy instead of just selecting
      if (isGenerationTeam) {
        const result = await sheetService.claimEntryForUser(originalEntryId, user.id);
        console.log('✅ Claimed entry result:', result);
        await loadTeamSheets(); // Reload to show updated status
        setError(''); // Clear any previous errors
      } else {
        // Regular selection for other teams  
        const result = await sheetService.selectEntry(originalEntryId, entryId);
        console.log('✅ Select entry result:', result);
        await loadTeamSheets();
        setError('');
      }
    } catch (err) {
      console.error('❌ Entry action error:', err);
      const errorMessage = err?.error || err?.message || 'Failed to process entry';
      setError(`Action failed: ${errorMessage}`);
    }
  };

  const handleUpdateProgress = async (entryId) => {
    try {
      // Find the entry and open the progress modal
      const entry = sheets.find(s => s.id === entryId);
      if (entry) {
        setSelectedEntry(entry);
        setProgressModalOpen(true);
      }
    } catch (err) {
      setError('Failed to open progress update: ' + err.message);
    }
  };

  const handleSaveProgress = async (progressData) => {
    try {
      setModalLoading(true);
      await sheetService.updateEntryProgress(selectedEntry.id, progressData);
      setProgressModalOpen(false);
      setSelectedEntry(null);
      await loadTeamSheets(); // Reload data
      setError(''); // Clear any errors
    } catch (err) {
      setError('Failed to update progress: ' + (err.message || 'Unknown error'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkAsPatched = async (entryId) => {
    try {
      const confirmed = window.confirm(
        'Are you sure this vulnerability has been patched? This will close the entry and notify the admin.'
      );
      if (confirmed) {
        await sheetService.markEntryAsPatched(entryId);
        await loadTeamSheets();
        // This should also trigger an admin notification
      }
    } catch (err) {
      setError('Failed to mark as patched: ' + err.message);
    }
  };

  const handleReleaseEntry = async (entryId) => {
    try {
      const confirmed = window.confirm(
        'Are you sure you want to release this entry? It will become available for others to claim.'
      );
      if (confirmed) {
        await sheetService.releaseEntry(entryId);
        await loadTeamSheets();
      }
    } catch (err) {
      setError('Failed to release entry: ' + err.message);
    }
  };

  const handleViewVulnerabilityGroup = async (vulnerabilityId) => {
    try {
      // Find the entry to get vulnerability info
      const entry = sheets.find(s => s.id === vulnerabilityId || s.original_id === vulnerabilityId);
      if (entry) {
        setSelectedEntry(entry);
        setVulnerabilityModalOpen(true);
      }
    } catch (err) {
      setError('Failed to load vulnerability group: ' + err.message);
    }
  };

  const isGenerationTeam = user?.team_name?.toLowerCase().includes('generation');

  // Filter sheets/entries based on current filters and viewMode
  const filteredSheets = React.useMemo(() => {
    let filtered = sheets;
    
    console.log('🔍 Filtering sheets:', {
      totalSheets: sheets.length,
      siteFilter,
      statusFilter,
      viewMode,
      isGenerationTeam
    });
    
    // For generation team, apply view mode filtering first
    if (isGenerationTeam) {
      switch (viewMode) {
        case 'my_entries':
          filtered = filtered.filter(entry => entry.assigned_to === user?.id);
          break;
        case 'all_entries':
          // Show all entries (no additional filtering by view mode)
          break;
        case 'by_vulnerability':
          // Group entries by vulnerability - this would need special handling
          // For now, show all entries
          break;
        case 'team_overview':
          // Show all entries with team perspective
          break;
        default:
          break;
      }
      console.log(`🎯 After view mode filter (${viewMode}):`, filtered.length);
    }
    
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
          if (statusFilter === 'claimed') return entry.assigned_to === user?.id;
          if (statusFilter === 'assigned') return entry.assigned_to && entry.assigned_to !== user?.id;
          if (statusFilter === 'pending_patch') return entry.progress_status === 'awaiting_patch';
          if (statusFilter === 'patched') return entry.progress_status === 'patched';
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
  }, [sheets, siteFilter, statusFilter, viewMode, isGenerationTeam, user?.id]);

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
            {isGenerationTeam && (
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-eye"></i>
                  </span>
                  <select 
                    className="form-select"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                  >
                    <option value="my_entries">My Claimed Entries</option>
                    <option value="all_entries">All Available Entries</option>
                    <option value="by_vulnerability">Group by Vulnerability</option>
                    <option value="team_overview">Team Progress Overview</option>
                  </select>
                </div>
              </div>
            )}
            <div className={`col-md-${isGenerationTeam ? '3' : '4'}`}>
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
                  {isGenerationTeam && <option value="available">Available to Claim</option>}
                  {isGenerationTeam && <option value="claimed">Claimed by Me</option>}
                  {isGenerationTeam && <option value="pending_patch">Pending Patch</option>}
                  {isGenerationTeam && <option value="patched">Patched & Closed</option>}
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
                            <th>Site</th>
                            <th>Claimed By</th>
                            <th>Progress Status</th>
                            <th>Last Updated</th>
                            <th>Patching Status</th>
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
                                <span className="badge bg-info">
                                  {entry.site || entry.assigned_to_site || user?.site || 'Not specified'}
                                </span>
                              </td>
                              <td>
                                {entry.assigned_to ? (
                                  <div>
                                    <strong>{entry.assigned_to_name || 'Unknown User'}</strong>
                                    <br />
                                    <small className="text-muted">{entry.assigned_to_site || 'Unknown Site'}</small>
                                  </div>
                                ) : (
                                  <span className="text-muted">Available</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${
                                  entry.progress_status === 'investigating' ? 'bg-warning' :
                                  entry.progress_status === 'awaiting_patch' ? 'bg-info' :
                                  entry.progress_status === 'testing_patch' ? 'bg-primary' :
                                  entry.progress_status === 'patched' ? 'bg-success' :
                                  'bg-light text-dark'
                                }`}>
                                  {entry.progress_status || 'Not Started'}
                                </span>
                              </td>
                              <td>
                                {entry.last_updated ? formatDate(entry.last_updated) : 'N/A'}
                              </td>
                              <td>
                                {entry.patching_est_release_date ? (
                                  <div>
                                    <div>ETA: {formatDate(entry.patching_est_release_date)}</div>
                                    {entry.patching_status && (
                                      <small className="text-muted">{entry.patching_status}</small>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted">No ETA</span>
                                )}
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  {/* Available to claim */}
                                  {!entry.assigned_to && viewMode === 'all_entries' && (
                                    <button 
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleSelectEntry(entry.original_id || entry.id, entry.id)}
                                      title="Claim this entry for your site"
                                    >
                                      <i className="fas fa-hand-pointer"></i>
                                    </button>
                                  )}
                                  
                                  {/* User's claimed entries */}
                                  {entry.assigned_to === user?.id && (
                                    <>
                                      <Link
                                        to={`/team-sheets/${entry.sheet_id}/edit-with-locking`}
                                        className="btn btn-primary btn-sm"
                                        title="Edit this entry"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </Link>
                                      
                                      <button 
                                        className="btn btn-info btn-sm"
                                        onClick={() => handleUpdateProgress(entry.id)}
                                        title="Update progress"
                                      >
                                        <i className="fas fa-clipboard-list"></i>
                                      </button>
                                      
                                      <button 
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleMarkAsPatched(entry.id)}
                                        title="Mark as patched and close"
                                      >
                                        <i className="fas fa-check-circle"></i>
                                      </button>
                                      
                                      <button 
                                        className="btn btn-warning btn-sm"
                                        onClick={() => handleReleaseEntry(entry.id)}
                                        title="Release this entry"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Entries claimed by others */}
                                  {entry.assigned_to && entry.assigned_to !== user?.id && (
                                    <button 
                                      className="btn btn-outline-secondary btn-sm"
                                      disabled
                                      title={`Claimed by ${entry.assigned_to_name || 'another user'} at ${entry.assigned_to_site || 'unknown site'}`}
                                    >
                                      <i className="fas fa-user-check"></i>
                                    </button>
                                  )}
                                  
                                  {/* View vulnerability group */}
                                  <button 
                                    className="btn btn-outline-info btn-sm"
                                    onClick={() => handleViewVulnerabilityGroup(entry.original_id || entry.id)}
                                    title="View all instances of this vulnerability"
                                  >
                                    <i className="fas fa-layer-group"></i>
                                  </button>
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

      {/* Progress Update Modal */}
      <ProgressUpdateModal
        isOpen={progressModalOpen}
        onClose={() => {
          setProgressModalOpen(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
        onSave={handleSaveProgress}
        loading={modalLoading}
      />

      {/* Vulnerability Group Modal */}
      <VulnerabilityGroupModal
        isOpen={vulnerabilityModalOpen}
        onClose={() => {
          setVulnerabilityModalOpen(false);
          setSelectedEntry(null);
        }}
        vulnerabilityId={selectedEntry?.id || selectedEntry?.original_id}
        vulnerabilityInfo={selectedEntry}
      />
    </div>
  );
};

export default TeamSheets;
