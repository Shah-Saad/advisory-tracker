import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import UserNotificationPanel from './UserNotificationPanel';

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
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #28a745 0%, #17a2b8 100%)' }}>
        <div className="text-center text-white">
          <div className="spinner-border mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Loading Your Dashboard...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #28a745 0%, #17a2b8 100%)' }}>
      {/* Header Section */}
      <div className="container-fluid p-4">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="h2 mb-1 fw-bold text-dark">
                      <i className="fas fa-users text-success me-3"></i>
                      Team Dashboard
                    </h1>
                    <p className="text-muted mb-0 fs-5">
                      Welcome, <span className="fw-semibold text-success">{user?.name || user?.email}</span>
                      {user?.team?.name && (
                        <span className="ms-2">
                          <i className="fas fa-users text-info me-1"></i>
                          {user.team.name} Team
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="d-flex gap-3 align-items-center">
                    <UserNotificationPanel />
                    <Link to="/my-sheets" className="btn btn-success btn-lg shadow-sm px-4">
                      <i className="fas fa-clipboard-list me-2"></i>My Sheets
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="container-fluid px-4 pb-4">
        <div className="row g-4">
          <div className="col-xl-3 col-md-6">
            <div className="card border-0 h-100 shadow-lg" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #28a745 100%)' }}>
              <div className="card-body text-white d-flex align-items-center p-4">
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
            <div className="card border-0 h-100 shadow-lg" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}>
              <div className="card-body text-white d-flex align-items-center p-4">
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
            <div className="card border-0 h-100 shadow-lg" style={{ background: 'linear-gradient(135deg, #fd7e14 0%, #ff8c00 100%)' }}>
              <div className="card-body text-white d-flex align-items-center p-4">
                <div className="me-3">
                  <i className="fas fa-clock fa-2x opacity-75"></i>
                </div>
                <div>
                  <h6 className="card-title text-white-50 mb-1">In Progress</h6>
                  <h2 className="mb-0 fw-bold">{stats.inProgress}</h2>
                  <small className="text-white-50">Currently working</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="card border-0 h-100 shadow-lg" style={{ background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' }}>
              <div className="card-body text-white d-flex align-items-center p-4">
                <div className="me-3">
                  <i className="fas fa-hourglass-half fa-2x opacity-75"></i>
                </div>
                <div>
                  <h6 className="card-title text-white-50 mb-1">Pending</h6>
                  <h2 className="mb-0 fw-bold">{stats.pending}</h2>
                  <small className="text-white-50">Awaiting action</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sheets Section */}
      <div className="container-fluid px-4 pb-4">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-transparent border-0 p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 fw-bold text-dark">
                    <i className="fas fa-list-alt text-success me-2"></i>
                    Recent Sheets
                  </h4>
                  <Link to="/my-sheets" className="btn btn-outline-success">
                    View All Sheets
                  </Link>
                </div>
              </div>
              <div className="card-body p-4">
                {teamSheets.length > 0 ? (
                  <div className="row g-4">
                    {teamSheets.slice(0, 6).map((sheet) => (
                      <div key={sheet.id} className="col-lg-6 col-xl-4">
                        <div className="card border-0 shadow-sm h-100" style={{ transition: 'transform 0.2s ease-in-out' }}
                             onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                             onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                          <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <h6 className="card-title fw-bold text-dark mb-0" style={{ fontSize: '1rem' }}>
                                {sheet.sheet_title || 'Untitled Sheet'}
                              </h6>
                              <span className={`badge ${getStatusBadge(sheet.assignment_status)}`}>
                                {getStatusText(sheet.assignment_status)}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <small className="text-muted">
                                <i className="fas fa-calendar-alt me-1"></i>
                                Assigned: {new Date(sheet.assigned_at).toLocaleDateString()}
                              </small>
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                              <Link 
                                to={`/team-sheets/${sheet.sheet_id}`} 
                                className="btn btn-success btn-sm"
                              >
                                <i className="fas fa-edit me-1"></i>
                                {sheet.assignment_status === 'completed' ? 'View' : 'Work On'}
                              </Link>
                              
                              {sheet.assignment_status === 'completed' && (
                                <Link 
                                  to={`/team-sheets/${sheet.sheet_id}?update=true`} 
                                  className="btn btn-outline-warning btn-sm"
                                >
                                  <i className="fas fa-edit me-1"></i>
                                  Update
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No Sheets Assigned</h5>
                    <p className="text-muted">You don't have any sheets assigned to your team yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="container-fluid px-4 pb-4">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-transparent border-0 p-4">
                <h4 className="mb-0 fw-bold text-dark">
                  <i className="fas fa-bolt text-success me-2"></i>
                  Quick Actions
                </h4>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="text-center p-4">
                      <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <i className="fas fa-clipboard-list fa-2x text-success"></i>
                      </div>
                      <h6 className="fw-bold">View My Sheets</h6>
                      <p className="text-muted small">Access all sheets assigned to your team</p>
                      <Link to="/my-sheets" className="btn btn-success">
                        Go to Sheets
                      </Link>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="text-center p-4">
                      <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <i className="fas fa-bell fa-2x text-info"></i>
                      </div>
                      <h6 className="fw-bold">Notifications</h6>
                      <p className="text-muted small">Check your latest notifications and updates</p>
                      <button className="btn btn-info" onClick={() => document.querySelector('.notification-panel button').click()}>
                        View Notifications
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
