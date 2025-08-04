import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import sheetService from '../../services/sheetService';

const AdminTeamSheetView = () => {
  const { sheetId, teamKey } = useParams();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeamSheetData();
  }, [sheetId, teamKey]);

  const loadTeamSheetData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch detailed team sheet data
      const detailedData = await sheetService.getTeamSheetData(sheetId, teamKey);
      
      setTeamData({
        ...detailedData,
        teamKey: teamKey,
        teamName: teamKey.charAt(0).toUpperCase() + teamKey.slice(1)
      });
      
    } catch (error) {
      console.error('Error fetching team sheet data:', error);
      setError('Failed to load team sheet data');
    } finally {
      setLoading(false);
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
                {teamData.teamName} Team - Sheet View
              </h1>
              <p className="text-muted">
                {teamData.sheet?.title}
              </p>
            </div>
            <div className="d-flex gap-2">
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
                  <h6 className="mb-0">Team Assignment</h6>
                </div>
                <div className="card-body">
                  <p><strong>Status:</strong> 
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
              <h6 className="mb-0">Team Responses ({teamData.responses?.length || 0})</h6>
            </div>
            <div className="card-body">
              {teamData.responses && teamData.responses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Vendor</th>
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
                    </thead>
                    <tbody>
                      {teamData.responses.map((response, index) => (
                        <tr key={response.id || index}>
                          <td>
                            <small>{response.product_name || 'N/A'}</small>
                          </td>
                          <td>
                            <small>{response.vendor_name || response.oem_vendor || 'N/A'}</small>
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
                          </td>
                          <td>
                            <small>{response.deployed_in_ke === 'Y' ? (response.patching_est_release_date || 'N/A') : 'N/A'}</small>
                          </td>
                          <td>
                            <small>{response.deployed_in_ke === 'Y' ? (response.compensatory_controls_provided || 'N/A') : 'N/A'}</small>
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
                            <small>{response.updated_at ? formatDate(response.updated_at) : 'N/A'}</small>
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
