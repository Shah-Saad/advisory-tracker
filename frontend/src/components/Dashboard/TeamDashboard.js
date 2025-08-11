import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sheetService from '../../services/sheetService';

const TeamDashboard = ({ user }) => {
  const [teamSheets, setTeamSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load team sheets
      const sheets = await sheetService.getMyTeamSheets();
      setTeamSheets(sheets);
      
      // Calculate stats
      const completed = sheets.filter(s => s.assignment_status === 'completed').length;
      const inProgress = sheets.filter(s => s.assignment_status === 'in_progress').length;
      const pending = sheets.filter(s => s.assignment_status === 'pending').length;
      
      setStats({
        totalAssigned: sheets.length,
        completed,
        inProgress,
        pending
      });
      
    } catch (err) {
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'in_progress':
        return 'bg-warning text-dark';
      case 'pending':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Your Dashboard...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="h2 mb-1 fw-bold text-dark">
                    <i className="fas fa-users text-primary me-3"></i>
                    Team Dashboard
                  </h1>
                  <p className="text-muted mb-0 fs-5">
                    Welcome, <span className="fw-semibold text-primary">{user?.name || user?.email}</span>
                    {user?.team?.name && (
                      <span className="ms-2">
                        <i className="fas fa-users text-info me-1"></i>
                        {user.team.name} Team
                      </span>
                    )}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Link to="/my-sheets" className="btn btn-primary btn-lg shadow-sm">
                    <i className="fas fa-clipboard-list me-2"></i>My Sheets
                  </Link>
                  <Link to="/entries" className="btn btn-outline-primary btn-lg shadow-sm">
                    <i className="fas fa-search me-2"></i>Browse
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4 g-3">
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white d-flex align-items-center">
              <div className="me-3">
                <i className="fas fa-clipboard-list fa-2x opacity-75"></i>
              </div>
              <div>
                <h6 className="card-title text-white-50 mb-1">Total Assigned</h6>
                <h2 className="mb-0 fw-bold">{stats.totalAssigned}</h2>
                <small className="text-white-50">Sheets assigned to you</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}>
            <div className="card-body text-white d-flex align-items-center">
              <div className="me-3">
                <i className="fas fa-check-circle fa-2x opacity-75"></i>
              </div>
              <div>
                <h6 className="card-title text-white-50 mb-1">Completed</h6>
                <h2 className="mb-0 fw-bold">{stats.completed}</h2>
                <small className="text-white-50">Finished sheets</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)' }}>
            <div className="card-body text-dark d-flex align-items-center">
              <div className="me-3">
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
              <div>
                <h6 className="card-title text-dark opacity-75 mb-1">In Progress</h6>
                <h2 className="mb-0 fw-bold">{stats.inProgress}</h2>
                <small className="text-dark opacity-75">Currently working</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' }}>
            <div className="card-body text-white d-flex align-items-center">
              <div className="me-3">
                <i className="fas fa-hourglass-half fa-2x opacity-75"></i>
              </div>
              <div>
                <h6 className="card-title text-white-50 mb-1">Pending</h6>
                <h2 className="mb-0 fw-bold">{stats.pending}</h2>
                <small className="text-white-50">Awaiting start</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sheets */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header bg-transparent border-0 pt-4">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-clipboard-list text-primary me-2"></i>
                Your Assigned Sheets
              </h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              
              {teamSheets.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold">Sheet Title</th>
                        <th className="border-0 fw-semibold text-center">Status</th>
                        <th className="border-0 fw-semibold">Assigned Date</th>
                        <th className="border-0 fw-semibold">Due Date</th>
                        <th className="border-0 fw-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamSheets.map((sheet) => (
                        <tr key={sheet.id}>
                          <td>
                            <div className="fw-medium">{sheet.title}</div>
                            {sheet.description && (
                              <small className="text-muted">{sheet.description}</small>
                            )}
                          </td>
                          <td className="text-center">
                            <span className={`badge rounded-pill px-3 py-2 ${getStatusBadge(sheet.assignment_status)}`}>
                              {getStatusText(sheet.assignment_status)}
                            </span>
                          </td>
                          <td>
                            {sheet.assigned_at ? new Date(sheet.assigned_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            {sheet.due_date ? new Date(sheet.due_date).toLocaleDateString() : 'No due date'}
                          </td>
                          <td className="text-center">
                            {sheet.assignment_status !== 'completed' ? (
                              <Link 
                                to={`/team-sheets/${sheet.id}/edit`}
                                className="btn btn-sm btn-primary"
                              >
                                <i className="fas fa-edit me-1"></i>
                                Select & Edit
                              </Link>
                            ) : (
                              <span className="text-muted">
                                <i className="fas fa-check me-1"></i>
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-clipboard fa-3x text-muted mb-3 opacity-25"></i>
                  <h6 className="text-muted">No sheets assigned</h6>
                  <p className="text-muted">You don't have any sheets assigned to you yet. Check back later or contact your administrator.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
