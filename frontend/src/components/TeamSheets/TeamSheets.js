import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sheetService from '../../services/sheetService';

const TeamSheets = ({ user }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTeamSheets();
  }, [statusFilter]);

  const loadTeamSheets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filterStatus = statusFilter === 'all' ? null : statusFilter;
      const data = await sheetService.getMyTeamSheets(filterStatus);
      setSheets(data || []);
    } catch (err) {
      console.error('Failed to load team sheets:', err);
      setError(err.message || 'Failed to load team sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSheet = async (sheetId) => {
    try {
      await sheetService.startTeamSheet(sheetId);
      await loadTeamSheets(); // Reload to show updated status
    } catch (err) {
      setError(err.message || 'Failed to start sheet');
    }
  };

  const handleCompleteSheet = async (sheetId) => {
    try {
      await sheetService.completeTeamSheet(sheetId);
      await loadTeamSheets(); // Reload to show updated status
    } catch (err) {
      setError(err.message || 'Failed to complete sheet');
    }
  };

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
              <h1 className="h3 mb-0">My Team Sheets</h1>
              <p className="text-muted">
                Sheets assigned to {user?.team?.name || 'your team'}
              </p>
            </div>
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

          {/* Status Filter */}
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-filter"></i>
                </span>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Sheets</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sheets List */}
          <div className="row">
            {sheets.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="fas fa-file-excel fa-3x text-muted mb-3"></i>
                    <h5 className="card-title text-muted">No Sheets Found</h5>
                    <p className="card-text text-muted">
                      {statusFilter === 'all' 
                        ? 'No sheets have been assigned to your team yet.'
                        : `No sheets with status "${statusFilter}" found.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              sheets.map((sheet) => (
                <div key={sheet.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="card-title mb-0">{sheet.title}</h6>
                      <span className={getStatusBadgeClass(sheet.assignment_status)}>
                        {sheet.assignment_status}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <small className="text-muted">Month/Year:</small>
                        <div>{new Date(sheet.month_year).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}</div>
                      </div>
                      
                      <div className="mb-3">
                        <small className="text-muted">File:</small>
                        <div className="text-truncate" title={sheet.file_name}>
                          {sheet.file_name || 'N/A'}
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">Assigned:</small>
                        <div>{formatDate(sheet.assigned_at)}</div>
                      </div>

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
                        {(sheet.assignment_status === 'assigned' || sheet.assignment_status === 'in_progress') && (
                          <Link 
                            to={`/team-sheets/${sheet.id}/edit`}
                            className="btn btn-primary btn-sm flex-fill"
                          >
                            <i className="fas fa-edit me-1"></i>
                            Select & Edit
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
                        
                        {sheet.assignment_status === 'completed' && (
                          <span className="btn btn-outline-success btn-sm disabled">
                            <i className="fas fa-check me-1"></i>
                            Submitted
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
