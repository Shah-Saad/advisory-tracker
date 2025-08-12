import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import sheetService from '../../services/sheetService';
import './TeamSheetSwitcher.css';

const TeamSubmissionsOverview = () => {
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingSheet, setDeletingSheet] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [modalTeamData, setModalTeamData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [liveViewSheets, setLiveViewSheets] = useState(new Set());
  const [liveData, setLiveData] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchSheets();
  }, []);

  useEffect(() => {
    if (autoRefresh && liveViewSheets.size > 0) {
      // Set up auto-refresh every 30 seconds for live view sheets
      refreshIntervalRef.current = setInterval(() => {
        liveViewSheets.forEach(sheetId => {
          loadLiveViewData(sheetId);
        });
      }, 30000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }
  }, [autoRefresh, liveViewSheets]);

  const handleDeleteSheet = async (sheetId, sheetTitle) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the sheet "${sheetTitle}"? This will also remove all team assignments and responses for this sheet. This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    setDeletingSheet(sheetId);

    try {
      await sheetService.deleteSheet(sheetId);
      
      toast.success(
        `Successfully deleted sheet "${sheetTitle}" and all associated data`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
      
      // Reset selected sheet if it was deleted
      if (selectedSheet && selectedSheet.id === sheetId) {
        setSelectedSheet(null);
      }
      
      // Reload sheets list
      fetchSheets();
      
    } catch (error) {
      console.error('Error deleting sheet:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete sheet';
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setDeletingSheet(null);
    }
  };

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getAllSheetsWithTeamStatus();
      setSheets(data);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      toast.error('Failed to fetch sheets');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'badge bg-success';
      case 'in_progress': return 'badge bg-warning';
      case 'assigned': return 'badge bg-primary';
      case 'distributed': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  };

  const loadLiveViewData = async (sheetId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sheets/${sheetId}/live-view`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLiveData(prev => ({
          ...prev,
          [sheetId]: data
        }));
      } else {
        console.error('Failed to load live view data for sheet:', sheetId);
      }
    } catch (error) {
      console.error('Error loading live view data:', error);
    }
  };

  const toggleLiveView = async (sheetId) => {
    const newLiveViewSheets = new Set(liveViewSheets);
    
    if (newLiveViewSheets.has(sheetId)) {
      newLiveViewSheets.delete(sheetId);
      // Remove live data for this sheet
      setLiveData(prev => {
        const newData = { ...prev };
        delete newData[sheetId];
        return newData;
      });
    } else {
      newLiveViewSheets.add(sheetId);
      // Load initial live data
      await loadLiveViewData(sheetId);
    }
    
    setLiveViewSheets(newLiveViewSheets);
  };

  const getLiveViewStatusBadgeClass = (status) => {
    const statusMap = {
      'New': 'badge-info',
      'In Progress': 'badge-warning',
      'Pending': 'badge-warning',
      'Completed': 'badge-success',
      'Blocked': 'badge-danger',
      'Not Applicable': 'badge-secondary'
    };
    return statusMap[status] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="team-submissions-overview">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-0">
            <i className="fas fa-chart-bar me-2"></i>
            Team Submissions Overview
          </h2>
          <p className="text-muted mb-0">Monitor team progress and view submitted sheets</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading submissions data...</p>
        </div>
      ) : sheets.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
            <h5>No Sheets Available</h5>
            <p className="text-muted">Upload a sheet to see team submissions here.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {sheets.map((sheet) => (
            <div key={sheet.id} className="col-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{sheet.title}</h5>
                    <small className="text-muted">
                      Uploaded: {formatDate(sheet.created_at)}
                      {sheet.distributed_at && (
                        <> • Distributed: {formatDate(sheet.distributed_at)}</>
                      )}
                    </small>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <span className={getStatusBadgeClass(sheet.status)}>
                      {sheet.status}
                    </span>
                    <button
                      className={`btn btn-sm ${liveViewSheets.has(sheet.id) ? 'btn-success' : 'btn-outline-primary'}`}
                      onClick={() => toggleLiveView(sheet.id)}
                      title={liveViewSheets.has(sheet.id) ? 'Disable Live View' : 'Enable Live View'}
                    >
                      <i className={`fas ${liveViewSheets.has(sheet.id) ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      {liveViewSheets.has(sheet.id) ? ' Live View ON' : ' Live View'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteSheet(sheet.id, sheet.title)}
                      disabled={deletingSheet === sheet.id}
                      title="Delete this sheet"
                    >
                      {deletingSheet === sheet.id ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <TeamSubmissionTable sheetId={sheet.id} />
                  
                  {/* Live View Section */}
                  {liveViewSheets.has(sheet.id) && liveData[sheet.id] && (
                    <div className="live-view-section mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                          <i className="fas fa-eye text-success me-2"></i>
                          Live View - Real-time Updates
                        </h6>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`autoRefresh-${sheet.id}`}
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`autoRefresh-${sheet.id}`}>
                            Auto-refresh
                          </label>
                        </div>
                      </div>
                      
                      {/* Overall Statistics */}
                      <div className="row mb-3">
                        <div className="col-md-3">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h4 className="text-primary">{liveData[sheet.id].sheet?.total_entries || 0}</h4>
                              <small className="text-muted">Total Entries</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h4 className="text-success">{liveData[sheet.id].sheet?.total_completed || 0}</h4>
                              <small className="text-muted">Completed</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card bg-light">
                            <div className="card-body text-center">
                              <h4 className="text-warning">{liveData[sheet.id].sheet?.total_in_progress || 0}</h4>
                              <small className="text-muted">In Progress</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Progress Cards */}
                      <div className="row">
                        {liveData[sheet.id].team_views?.map((teamView) => (
                          <div key={teamView.team_id} className="col-md-6 col-lg-4 mb-3">
                            <div className="card">
                              <div className="card-header">
                                <h6 className="mb-0">{teamView.team_name}</h6>
                              </div>
                              <div className="card-body">
                                <div className="mb-2">
                                  <div className="d-flex justify-content-between mb-1">
                                    <small>Status</small>
                                    <small className={getStatusBadgeClass(teamView.assignment_status)}>
                                      {teamView.assignment_status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                                    </small>
                                  </div>
                                  <div className="d-flex justify-content-between">
                                    <small>Entries: {teamView.statistics.total_entries}</small>
                                    <small>Completed: {teamView.statistics.completed_entries}</small>
                                  </div>
                                </div>
                                <div className="row text-center">
                                  <div className="col-4">
                                    <div className="text-success">
                                      <strong>{teamView.statistics.completed_entries}</strong>
                                      <br />
                                      <small>Done</small>
                                    </div>
                                  </div>
                                  <div className="col-4">
                                    <div className="text-warning">
                                      <strong>{teamView.statistics.in_progress_entries}</strong>
                                      <br />
                                      <small>In Progress</small>
                                    </div>
                                  </div>
                                  <div className="col-4">
                                    <div className="text-secondary">
                                      <strong>{teamView.statistics.pending_entries}</strong>
                                      <br />
                                      <small>Pending</small>
                                    </div>
                                  </div>
                                </div>
                                {teamView.last_updated && (
                                  <small className="text-muted d-block mt-2">
                                    Last updated: {new Date(teamView.last_updated).toLocaleTimeString()}
                                  </small>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recent Activity */}
                      {liveData[sheet.id].last_activity && (
                        <div className="mt-3">
                          <small className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            Last activity: {new Date(liveData[sheet.id].last_activity).toLocaleString()}
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Sheet Modal */}
      {showTeamModal && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalTeamData?.teamName} Team - {modalTeamData?.sheet?.title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTeamModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {modalLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading team sheet data...</p>
                  </div>
                ) : modalTeamData ? (
                  <div>
                    {/* Sheet Information */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6>Sheet Information</h6>
                        <p><strong>Title:</strong> {modalTeamData.sheet?.title}</p>
                        <p><strong>Status:</strong> {modalTeamData.sheet?.status}</p>
                        <p><strong>Created:</strong> {modalTeamData.sheet?.created_at ? new Date(modalTeamData.sheet.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <h6>Team Assignment</h6>
                        <p><strong>Status:</strong> 
                          <span className={`badge ms-2 ${modalTeamData.assignment?.status === 'completed' ? 'bg-success' : 
                            modalTeamData.assignment?.status === 'in_progress' ? 'bg-warning' : 'bg-secondary'}`}>
                            {modalTeamData.assignment?.status || 'Unknown'}
                          </span>
                        </p>
                        <p><strong>Assigned:</strong> {modalTeamData.assignment?.assigned_at ? new Date(modalTeamData.assignment.assigned_at).toLocaleDateString() : 'N/A'}</p>
                        {modalTeamData.assignment?.completed_at && (
                          <p><strong>Completed:</strong> {new Date(modalTeamData.assignment.completed_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Response Statistics */}
                    <div className="row mb-4">
                      <div className="col-md-12">
                        <h6>Response Summary</h6>
                        <div className="row">
                          <div className="col-md-3">
                            <div className="card text-center">
                              <div className="card-body">
                                <h5 className="card-title text-primary">{modalTeamData.response_count || 0}</h5>
                                <p className="card-text">Total Responses</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="card text-center">
                              <div className="card-body">
                                <h5 className="card-title text-success">{modalTeamData.completion_percentage || 0}%</h5>
                                <p className="card-text">Completion</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Responses Table */}
                    {modalTeamData.responses && modalTeamData.responses.length > 0 ? (
                      <div>
                        <h6>Team Responses ({modalTeamData.responses.length})</h6>
                        <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                          <table className="table table-sm table-hover">
                            <thead className="table-light sticky-top">
                              <tr>
                                <th>Product Name</th>
                                <th>Current Status</th>
                                <th>Deployed in KE</th>
                                <th>Risk Level</th>
                                <th>Vendor Contacted</th>
                                <th>Compensatory Controls</th>
                                <th>Comments</th>
                                <th>Last Updated</th>
                              </tr>
                            </thead>
                            <tbody>
                              {modalTeamData.responses.map((response, index) => (
                                <tr key={response.id || index}>
                                  <td>
                                    <strong>{response.original_product_name || response.product_name || 'N/A'}</strong>
                                  </td>
                                  <td>
                                    <span className={`badge ${response.current_status === 'Completed' ? 'bg-success' : 
                                      response.current_status === 'In Progress' ? 'bg-warning' : 
                                      response.current_status === 'Blocked' ? 'bg-danger' : 'bg-secondary'}`}>
                                      {response.current_status || 'Not Started'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${response.deployed_in_ke === 'Y' ? 'bg-success' : 'bg-danger'}`}>
                                      {response.deployed_in_ke === 'Y' ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${response.risk_level === 'Critical' ? 'bg-danger' : 
                                      response.risk_level === 'High' ? 'bg-warning' : 
                                      response.risk_level === 'Medium' ? 'bg-info' : 'bg-secondary'}`}>
                                      {response.risk_level || 'N/A'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${response.vendor_contacted === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                      {response.vendor_contacted === 'Y' ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${response.compensatory_controls_provided === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                      {response.compensatory_controls_provided === 'Y' ? 'Yes' : 'No'}
                                    </span>
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
                                    <small>{response.updated_at ? new Date(response.updated_at).toLocaleDateString() : 'N/A'}</small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5>No Responses Yet</h5>
                        <p className="text-muted">This team hasn't submitted any responses for this sheet.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">No data available</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTeamModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal backdrop */}
      {showTeamModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
};

// Component to show team submission status for a specific sheet
const TeamSubmissionTable = ({ sheetId }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [modalTeamData, setModalTeamData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const teams = [
    { id: 1, name: 'Generation', key: 'generation' },
    { id: 2, name: 'Distribution', key: 'distribution' },
    { id: 3, name: 'Transmission', key: 'transmission' }
  ];

  useEffect(() => {
    fetchTeamData();
  }, [sheetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetByTeams(sheetId);
      setTeamData(data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (teamKey) => {
    if (!teamData?.team_versions) return 'not_assigned';
    const teamView = teamData.team_versions.find(tv => tv.team_name.toLowerCase() === teamKey);
    return teamView?.assignment_status || 'not_assigned';
  };

  const getResponseCount = (teamKey) => {
    if (!teamData?.team_versions) return 0;
    const teamView = teamData.team_versions.find(tv => tv.team_name.toLowerCase() === teamKey);
    return teamView?.response_count || 0;
  };

  const getLastUpdated = (teamKey) => {
    if (!teamData?.team_versions) return null;
    const teamView = teamData.team_versions.find(tv => tv.team_name.toLowerCase() === teamKey);
    return teamView?.completed_at || teamView?.assigned_at;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'badge bg-success';
      case 'in_progress': return 'badge bg-warning text-dark';
      case 'pending': return 'badge bg-secondary';
      case 'submitted': return 'badge bg-info text-dark';
      case 'not_assigned': return 'badge bg-light text-dark';
      default: return 'badge bg-light text-dark';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const handleViewTeamSheet = (teamKey) => {
    try {
      // Debug log
      console.log('🔍 handleViewTeamSheet called with:', {
        teamKey,
        sheetId,
        url: `/admin/team-sheets/${sheetId}/${teamKey}`
      });
      
      // Validate inputs
      if (!sheetId || !teamKey) {
        console.error('❌ Missing required parameters:', { sheetId, teamKey });
        alert('Error: Missing sheet ID or team key');
        return;
      }
      
      // Test if window.open is working
      const url = `/admin/team-sheets/${sheetId}/${teamKey}`;
      console.log('📋 About to open URL:', url);
      
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        console.log('✅ window.open succeeded');
      } else {
        console.log('❌ window.open returned null - popup blocked?');
        // Fallback: try to navigate in same window
        console.log('🔄 Falling back to same-window navigation');
        window.location.href = url;
      }
    } catch (error) {
      console.error('❌ Error in handleViewTeamSheet:', error);
      alert('Error opening team sheet view: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading team data...</span>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Team</th>
            <th>Status</th>
            <th>Entries</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const status = getSubmissionStatus(team.key);
            const responseCount = getResponseCount(team.key);
            const lastUpdated = getLastUpdated(team.key);
            
            return (
              <tr key={team.id}>
                <td>
                  <strong>{team.name}</strong>
                </td>
                <td>
                  <span className={getStatusBadgeClass(status)}>
                    {status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <small>Entries: {responseCount}</small>
                  </div>
                </td>
                <td>
                  <span className="badge bg-primary">{responseCount}</span>
                </td>
                <td>
                  <small>{formatDate(lastUpdated)}</small>
                </td>
                <td>
                  {(() => {
                    const shouldShowButton = status !== 'not_assigned';
                    console.log('🎯 Button logic for team:', team.name, {
                      status,
                      shouldShowButton,
                      sheetId
                    });
                    
                    return shouldShowButton ? (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleViewTeamSheet(team.key)}
                        title={`View ${team.name} team submission`}
                      >
                        <i className="fas fa-eye me-1"></i>
                        View
                      </button>
                    ) : (
                      <span className="text-muted">Not assigned</span>
                    );
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Team Sheet Modal for TeamSubmissionTable */}
      {showTeamModal && (
        <>
          <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalTeamData?.teamName} Team Submission Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowTeamModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {modalLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading team sheet data...</p>
                    </div>
                  ) : modalTeamData ? (
                    <div>
                      {/* Sheet Information */}
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <h6>Sheet Information</h6>
                          <p><strong>Title:</strong> {modalTeamData.sheet?.title}</p>
                          <p><strong>Status:</strong> {modalTeamData.sheet?.status}</p>
                          <p><strong>Created:</strong> {modalTeamData.sheet?.created_at ? new Date(modalTeamData.sheet.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <h6>Team Assignment</h6>
                          <p><strong>Status:</strong> 
                            <span className={`badge ms-2 ${modalTeamData.assignment?.status === 'completed' ? 'bg-success' : 
                              modalTeamData.assignment?.status === 'in_progress' ? 'bg-warning' : 'bg-secondary'}`}>
                              {modalTeamData.assignment?.status || 'Unknown'}
                            </span>
                          </p>
                          <p><strong>Assigned:</strong> {modalTeamData.assignment?.assigned_at ? new Date(modalTeamData.assignment.assigned_at).toLocaleDateString() : 'N/A'}</p>
                          {modalTeamData.assignment?.completed_at && (
                            <p><strong>Completed:</strong> {new Date(modalTeamData.assignment.completed_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      {/* Response Statistics */}
                      <div className="row mb-4">
                        <div className="col-md-12">
                          <h6>Response Summary</h6>
                          <div className="row">
                            <div className="col-md-3">
                              <div className="card text-center">
                                <div className="card-body">
                                  <h5 className="card-title text-primary">{modalTeamData.response_count || 0}</h5>
                                  <p className="card-text">Total Responses</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card text-center">
                                <div className="card-body">
                                  <h5 className="card-title text-success">{modalTeamData.completion_percentage || 0}%</h5>
                                  <p className="card-text">Completion</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Responses Table */}
                      {modalTeamData.responses && modalTeamData.responses.length > 0 ? (
                        <div>
                          <h6>Team Responses ({modalTeamData.responses.length})</h6>
                          <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                            <table className="table table-sm table-hover">
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th>Product Name</th>
                                  <th>Current Status</th>
                                  <th>Deployed in KE</th>
                                  <th>Risk Level</th>
                                  <th>Vendor Contacted</th>
                                  <th>Compensatory Controls</th>
                                  <th>Comments</th>
                                  <th>Last Updated</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalTeamData.responses.map((response, index) => (
                                  <tr key={response.id || index}>
                                    <td>
                                      <strong>{response.original_product_name || response.product_name || 'N/A'}</strong>
                                    </td>
                                    <td>
                                      <span className={`badge ${response.current_status === 'Completed' ? 'bg-success' : 
                                        response.current_status === 'In Progress' ? 'bg-warning' : 
                                        response.current_status === 'Blocked' ? 'bg-danger' : 'bg-secondary'}`}>
                                        {response.current_status || 'Not Started'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${response.deployed_in_ke === 'Y' ? 'bg-success' : 'bg-danger'}`}>
                                        {response.deployed_in_ke === 'Y' ? 'Yes' : 'No'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${response.risk_level === 'Critical' ? 'bg-danger' : 
                                        response.risk_level === 'High' ? 'bg-warning' : 
                                        response.risk_level === 'Medium' ? 'bg-info' : 'bg-secondary'}`}>
                                        {response.risk_level || 'N/A'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${response.vendor_contacted === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                        {response.vendor_contacted === 'Y' ? 'Yes' : 'No'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${response.compensatory_controls_provided === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                        {response.compensatory_controls_provided === 'Y' ? 'Yes' : 'No'}
                                      </span>
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
                                      <small>{response.updated_at ? new Date(response.updated_at).toLocaleDateString() : 'N/A'}</small>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                          <h5>No Responses Yet</h5>
                          <p className="text-muted">This team hasn't submitted any responses for this sheet.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">No data available</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowTeamModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal backdrop */}
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default TeamSubmissionsOverview;
