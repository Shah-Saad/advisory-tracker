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
  const intervalRef = useRef(null);

  const loadTeamSheetData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError('');
      } else {
        setRefreshing(true);
      }
      
      // Fetch detailed team sheet data
      const detailedData = await sheetService.getTeamSheetData(sheetId, teamKey);
      
      setTeamData({
        ...detailedData,
        teamKey: teamKey,
        teamName: teamKey.charAt(0).toUpperCase() + teamKey.slice(1)
      });
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching team sheet data:', error);
      if (!silent) {
        setError('Failed to load team sheet data');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [sheetId, teamKey]);

  useEffect(() => {
    loadTeamSheetData();
    
    // Set up auto-refresh (reduced frequency since we have real-time updates)
    if (isAutoRefresh) {
      intervalRef.current = setInterval(() => {
        loadTeamSheetData(true); // silent refresh
      }, 30000); // Keep 30 seconds as backup
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sheetId, teamKey, isAutoRefresh, loadTeamSheetData]);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    console.log('AdminTeamSheetView: Setting up SSE for sheet', sheetId);
    
    // Always ensure we have a connection - reconnect if needed
    const connectionStatus = sseService.getConnectionStatus();
    console.log('Current SSE status:', connectionStatus);
    
    if (!connectionStatus.isConnected) {
      console.log('SSE not connected - connecting now for admin live view');
      sseService.connect();
    } else {
      console.log('SSE already connected - using existing connection');
      setSseConnected(true);
    }

    // Handle connection status
    const handleSSEConnected = () => {
      setSseConnected(true);
      console.log('AdminTeamSheetView: Real-time updates connected for sheet', sheetId);
    };

    const handleSSEDisconnected = () => {
      setSseConnected(false);
      console.log('AdminTeamSheetView: Real-time updates disconnected for sheet', sheetId);
      
      // Don't immediately attempt to reconnect - let the SSE service handle its own reconnection logic
    };

    // Handle team sheet updates
    const handleTeamSheetUpdate = (data) => {
      console.log('AdminTeamSheetView: Received real-time update for sheet', sheetId, 'team', teamKey, ':', data);
      
      // Check if this update is for the current sheet AND team
      if (data.entry && data.entry.sheet_id === parseInt(sheetId)) {
        // Get team information from the update
        const updateTeam = data.updatedBy?.team || data.entry?.team || data.entry?.assigned_team;
        const currentTeamName = teamKey.toLowerCase();
        
        // Map team keys to names for comparison
        const teamNameMap = {
          'generation': 'Generation',
          'distribution': 'Distribution', 
          'transmission': 'Transmission'
        };
        
        // For admin views with team-specific data, only refresh if the update matches the current team
        // OR if no team info is available (general updates)
        const shouldRefresh = !updateTeam || // No team info = general update, refresh all
                             updateTeam.toLowerCase() === currentTeamName ||
                             updateTeam.toLowerCase() === teamNameMap[currentTeamName]?.toLowerCase() ||
                             updateTeam === teamNameMap[currentTeamName];
        
        if (shouldRefresh) {
          console.log('AdminTeamSheetView: Update affects current team view', teamKey, '- refreshing data...');
          loadTeamSheetData(true); // Silent refresh to show the updates
          setLastUpdated(new Date());
        } else {
          console.log('AdminTeamSheetView: Update is for different team', updateTeam, '- ignoring for team', teamKey);
        }
      } else {
        console.log('AdminTeamSheetView: Update is for different sheet', data.entry?.sheet_id, '- ignoring');
      }
    };

    // Register event listeners
    sseService.addEventListener('connected', handleSSEConnected);
    sseService.addEventListener('team_sheet_updated', handleTeamSheetUpdate);
    sseService.addEventListener('maxReconnectAttemptsReached', handleSSEDisconnected);

    // Check initial connection status
    if (sseService.getConnectionStatus().isConnected) {
      setSseConnected(true);
    }

    // Cleanup on unmount
    return () => {
      sseService.removeEventListener('connected', handleSSEConnected);
      sseService.removeEventListener('team_sheet_updated', handleTeamSheetUpdate);
      sseService.removeEventListener('maxReconnectAttemptsReached', handleSSEDisconnected);
      // Don't disconnect here as other admin views might be using it
    };
  }, [sheetId, loadTeamSheetData]);

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  const handleManualRefresh = () => {
    loadTeamSheetData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getProgressPercentage = (responses) => {
    if (!responses || responses.length === 0) return 0;
    
    const totalEntries = responses.length;
    const completedEntries = responses.filter(r => {
      // Consider an entry "completed" if it has key fields filled out
      return r.current_status && r.vendor_contacted && 
             ((r.deployed_in_ke === 'Y' && r.compensatory_controls_provided) || r.deployed_in_ke === 'N');
    }).length;
    
    return Math.round((completedEntries / totalEntries) * 100);
  };

  const isRecentlyUpdated = (updatedAt) => {
    if (!updatedAt) return false;
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMinutes = (now - updated) / (1000 * 60);
    return diffMinutes <= 30; // Consider "recent" if updated within last 30 minutes
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
                {teamData.teamName} Team - Live Sheet View
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
                className={`btn btn-sm ${isAutoRefresh ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={toggleAutoRefresh}
                title={isAutoRefresh ? 'Real-time updates + 30s backup refresh' : 'Only real-time updates (backup refresh disabled)'}
              >
                <i className={`fas ${isAutoRefresh ? 'fa-sync-alt fa-spin' : 'fa-pause'} me-1`}></i>
                {isAutoRefresh ? 'Live' : 'Paused'}
              </button>
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={handleManualRefresh}
                disabled={loading || refreshing}
              >
                <i className="fas fa-refresh me-1"></i>
                Refresh
              </button>
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => navigate('/admin/team-sheets')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Back to Overview
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
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span><strong>Completion Progress:</strong></span>
                      <span className="badge bg-primary">{getProgressPercentage(teamData.responses)}%</span>
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{width: `${getProgressPercentage(teamData.responses)}%`}}
                        aria-valuenow={getProgressPercentage(teamData.responses)} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <p><strong>Assignment Status:</strong> 
                    <span className={`ms-2 badge ${
                      teamData.assignment_status === 'completed' ? 'bg-success' :
                      teamData.assignment_status === 'in_progress' ? 'bg-warning text-dark' :
                      teamData.assignment_status === 'assigned' ? 'bg-secondary' : 'bg-light text-dark'
                    }`}>
                      {teamData.assignment_status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </p>
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
                <h6 className="mb-0">Live Team Responses ({teamData.responses?.length || 0})</h6>
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
                      {teamData.responses.map((response, index) => (
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
                              response.risk_level === 'Low' ? 'bg-success' : 'bg-secondary'
                            }`}>
                              {response.risk_level || 'Unknown'}
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
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <h5>No Responses Yet</h5>
                  <p className="text-muted">This team hasn't submitted any responses for this sheet.</p>
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
