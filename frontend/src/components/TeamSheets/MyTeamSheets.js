import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeamResponseService from '../../services/TeamResponseService';
import { toast } from 'react-toastify';

const MyTeamSheets = ({ user }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeamSheets();
  }, []);

  const loadTeamSheets = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.team?.id) {
        throw new Error('User team information not available');
      }

      const data = await TeamResponseService.getMyTeamSheets();
      setSheets(data || []);
    } catch (err) {
      console.error('Failed to load team sheets:', err);
      setError(err.message || 'Failed to load team sheets');
      toast.error('Failed to load team sheets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'badge bg-success';
      case 'in_progress': return 'badge bg-warning text-dark';
      case 'assigned': return 'badge bg-primary';
      case 'pending': return 'badge bg-secondary';
      default: return 'badge bg-light text-dark';
    }
  };

  const getStatusBadge = (isCompleted, progressPercentage) => {
    if (isCompleted) {
      return <span className="badge bg-success">Completed</span>;
    }
    if (progressPercentage > 0) {
      return <span className="badge bg-warning text-dark">In Progress</span>;
    }
    return <span className="badge bg-secondary">Not Started</span>;
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">My Team Sheets</h1>
          <p className="text-muted">Team: {user?.team?.name || 'Unknown'}</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={loadTeamSheets}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>Refresh
        </button>
      </div>

      {/* Team Summary */}
      {sheets.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-primary">
              <div className="card-body text-center">
                <h5 className="card-title text-primary">Total Sheets</h5>
                <h2 className="display-6">{sheets.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-success">
              <div className="card-body text-center">
                <h5 className="card-title text-success">Completed</h5>
                <h2 className="display-6">{sheets.filter(s => s.is_completed).length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-warning">
              <div className="card-body text-center">
                <h5 className="card-title text-warning">In Progress</h5>
                <h2 className="display-6">
                  {sheets.filter(s => !s.is_completed && s.progress_percentage > 0).length}
                </h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-info">
              <div className="card-body text-center">
                <h5 className="card-title text-info">Total Entries</h5>
                <h2 className="display-6">{sheets.reduce((sum, s) => sum + s.total_entries, 0)}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
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

      {/* Sheets List */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Assigned Sheets</h5>
        </div>
        <div className="card-body">
          {sheets.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No sheets assigned</h5>
              <p className="text-muted">Your team hasn't been assigned any sheets yet.</p>
            </div>
          ) : (
            <div className="row">
              {sheets.map((sheet) => (
                <div key={sheet.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className={`card h-100 ${sheet.is_completed ? 'border-success' : 'border-primary'}`}>
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-truncate" title={sheet.name}>
                        {sheet.name}
                      </h6>
                      {getStatusBadge(sheet.is_completed, sheet.progress_percentage)}
                    </div>
                    <div className="card-body">
                      {sheet.description && (
                        <p className="card-text text-muted small mb-3">
                          {sheet.description.length > 100 
                            ? `${sheet.description.substring(0, 100)}...` 
                            : sheet.description}
                        </p>
                      )}
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Status</small>
                          <small className="fw-medium">{sheet.status || 'Unknown'}</small>
                        </div>
                      </div>

                      <div className="row text-center mb-3">
                        <div className="col-6">
                          <small className="text-muted">Total Entries</small>
                          <div className="fw-bold">{sheet.total_entries}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Completed</small>
                          <div className="fw-bold text-success">{sheet.completed_entries}</div>
                        </div>
                      </div>

                      <div className="text-muted small mb-3">
                        <i className="fas fa-calendar-alt me-1"></i>
                        Created: {new Date(sheet.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="d-grid">
                        <Link 
                          to={`/team-sheets/${sheet.id}/respond`}
                          className={`btn ${sheet.is_completed ? 'btn-outline-success' : 'btn-primary'}`}
                        >
                          <i className="fas fa-edit me-2"></i>
                          {sheet.is_completed ? 'View Responses' : 'Work on Sheet'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="card mt-4">
        <div className="card-body">
          <h6 className="card-title">
            <i className="fas fa-info-circle text-info me-2"></i>
            How to Use Team Sheets
          </h6>
          <ul className="mb-0 small text-muted">
            <li>Click "Work on Sheet" to view and respond to vulnerability entries assigned to your team</li>
            <li>Update the status of each entry as you work on patching vulnerabilities</li>
            <li>Add comments to track your progress and communicate with administrators</li>
            <li>Mark entries as completed when patches are applied</li>
            <li>Your progress is automatically tracked and reported to administrators</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyTeamSheets;
