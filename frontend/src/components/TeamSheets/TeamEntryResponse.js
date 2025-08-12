import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeamResponseService from '../../services/TeamResponseService';
import { toast } from 'react-toastify';

const TeamEntryResponse = ({ user }) => {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    loadTeamEntries();
  }, [sheetId]);

  const loadTeamEntries = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.team?.id) {
        throw new Error('User team information not available');
      }

      const data = await TeamResponseService.getTeamSheetEntries(sheetId, user.team.id);
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to load team entries:', err);
      setError(err.message || 'Failed to load team entries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (responseId, newStatus, comments = '') => {
    try {
      setSaving(true);
      await TeamResponseService.updateEntryStatus(responseId, newStatus, comments);
      await loadTeamEntries(); // Reload entries
      toast.success('Entry status updated successfully');
    } catch (err) {
      console.error('Failed to update entry status:', err);
      toast.error(err.message || 'Failed to update entry status');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (responseId, completionData) => {
    try {
      setSaving(true);
      await TeamResponseService.markEntryCompleted(responseId, completionData);
      await loadTeamEntries(); // Reload entries
      toast.success('Entry marked as completed successfully');
    } catch (err) {
      console.error('Failed to mark entry as completed:', err);
      toast.error(err.message || 'Failed to mark entry as completed');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAllEntries = async () => {
    try {
      if (!window.confirm('Are you sure you want to mark the entire sheet as completed? This will notify administrators.')) {
        return;
      }

      setSaving(true);
      await TeamResponseService.markTeamSheetCompleted(sheetId, user.team.id);
      toast.success('Team sheet marked as completed successfully');
      navigate('/my-sheets');
    } catch (err) {
      console.error('Failed to complete team sheet:', err);
      toast.error(err.message || 'Failed to complete team sheet');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'badge bg-secondary';
      case 'in_progress':
        return 'badge bg-warning text-dark';
      case 'pending_patch':
        return 'badge bg-info';
      case 'completed':
        return 'badge bg-success';
      case 'patched':
        return 'badge bg-success';
      case 'closed':
        return 'badge bg-dark';
      default:
        return 'badge bg-light text-dark';
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return 'badge bg-danger';
      case 'high':
        return 'badge bg-warning text-dark';
      case 'medium':
        return 'badge bg-info';
      case 'low':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.cve?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || entry.risk_level === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const completedEntries = entries.filter(e => ['completed', 'patched', 'closed'].includes(e.status?.toLowerCase()));

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
          <h1 className="h3 mb-0">Team Sheet Response</h1>
          <p className="text-muted">
            Team: {user?.team?.name} | Progress: {completedEntries.length}/{entries.length} entries completed
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/my-sheets')}
          >
            <i className="fas fa-arrow-left me-2"></i>Back to My Sheets
          </button>
          <button 
            className="btn btn-success"
            onClick={handleCompleteAllEntries}
            disabled={saving || completedEntries.length < entries.length}
          >
            <i className="fas fa-check-circle me-2"></i>
            Mark Sheet Complete
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold">Team Progress</span>
            <span className="text-muted">{completedEntries.length} of {entries.length} entries completed</span>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div 
              className="progress-bar bg-success" 
              role="progressbar" 
              style={{ width: `${completedEntries.length / entries.length * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by product, vendor, or CVE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Status Filter</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_patch">Pending Patch</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Risk Filter</label>
              <select
                className="form-select"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="all">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

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

      {/* Entries Table */}
      <div className="card">
        <div className="card-body">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No entries found</h5>
              <p className="text-muted">No entries match your current filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Product/Vendor</th>
                    <th>CVE</th>
                    <th className="text-center">Risk Level</th>
                    <th className="text-center">Status</th>
                    <th>Comments</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <EntryRow 
                      key={entry.id} 
                      entry={entry} 
                      onStatusUpdate={handleStatusUpdate}
                      onMarkCompleted={handleMarkCompleted}
                      saving={saving}
                      getRiskBadgeClass={getRiskBadgeClass}
                      getStatusBadgeClass={getStatusBadgeClass}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Entry Row Component
const EntryRow = ({ entry, onStatusUpdate, onMarkCompleted, saving, getRiskBadgeClass, getStatusBadgeClass }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [comments, setComments] = useState(entry.comments || '');
  const [completionNotes, setCompletionNotes] = useState('');

  const handleQuickStatusUpdate = (newStatus) => {
    onStatusUpdate(entry.id, newStatus, comments);
  };

  const handleMarkCompleted = () => {
    onMarkCompleted(entry.id, {
      comments,
      completion_notes: completionNotes,
      patch_applied_date: new Date().toISOString().split('T')[0]
    });
  };

  const isCompleted = ['completed', 'patched', 'closed'].includes(entry.status?.toLowerCase());

  return (
    <>
      <tr className={isCompleted ? 'table-success' : ''}>
        <td>
          <div className="fw-medium">{entry.product_name || 'N/A'}</div>
          <small className="text-muted">{entry.vendor_name || entry.oem_vendor || 'Unknown Vendor'}</small>
        </td>
        <td>
          <code className="bg-light px-2 py-1 rounded">{entry.cve || 'N/A'}</code>
        </td>
        <td className="text-center">
          <span className={getRiskBadgeClass(entry.risk_level)}>
            {entry.risk_level || 'Unknown'}
          </span>
        </td>
        <td className="text-center">
          <span className={getStatusBadgeClass(entry.status)}>
            {entry.status || 'New'}
          </span>
        </td>
        <td>
          <div className="text-truncate" style={{ maxWidth: '200px' }}>
            {entry.comments || 'No comments'}
          </div>
        </td>
        <td className="text-center">
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowDetails(!showDetails)}
            >
              <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'}`}></i>
            </button>
            {!isCompleted && (
              <>
                <button
                  className="btn btn-warning"
                  onClick={() => handleQuickStatusUpdate('in_progress')}
                  disabled={saving}
                  title="Mark as In Progress"
                >
                  <i className="fas fa-play"></i>
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleMarkCompleted}
                  disabled={saving}
                  title="Mark as Completed"
                >
                  <i className="fas fa-check"></i>
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan="6" className="bg-light">
            <div className="p-3">
              <div className="row">
                <div className="col-md-6">
                  <h6>Entry Details</h6>
                  <p><strong>Source:</strong> {entry.source || 'N/A'}</p>
                  <p><strong>Site:</strong> {entry.original_site || 'N/A'}</p>
                  <p><strong>Last Updated:</strong> {entry.updated_at ? new Date(entry.updated_at).toLocaleString() : 'Never'}</p>
                </div>
                <div className="col-md-6">
                  <h6>Response Actions</h6>
                  <div className="mb-3">
                    <label className="form-label">Comments</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add your comments about this entry..."
                    />
                  </div>
                  {!isCompleted && (
                    <div className="mb-3">
                      <label className="form-label">Completion Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="Notes about patch completion..."
                      />
                    </div>
                  )}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onStatusUpdate(entry.id, entry.status || 'new', comments)}
                      disabled={saving}
                    >
                      Save Comments
                    </button>
                    {!isCompleted && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={handleMarkCompleted}
                        disabled={saving}
                      >
                        <i className="fas fa-check me-1"></i>Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default TeamEntryResponse;
