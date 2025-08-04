import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import authService from '../../services/authService';

const TeamSheetEditor = () => {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadSheetData();
    setUser(authService.getCurrentUser());
  }, [sheetId]);

  const loadSheetData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get sheet entries
      const entriesData = await sheetService.getSheetEntries(sheetId);
      setEntries(entriesData);
      
      // Get sheet details from team sheets
      const teamSheets = await sheetService.getMyTeamSheets();
      const currentSheet = teamSheets.find(s => s.id === parseInt(sheetId));
      setSheet(currentSheet);
      
      // Initialize responses object
      const initialResponses = {};
      entriesData.forEach(entry => {
        initialResponses[entry.id] = {
          current_status: entry.current_status || '',
          comments: entry.comments || '',
          date: entry.date || '',
          deployed_in_ke: entry.deployed_in_ke || 'N',
          risk_level: entry.risk_level || '',
          vendor_contacted: entry.vendor_contacted || '',
          vendor_contact_date: entry.vendor_contact_date || '',
          patching_est_release_date: entry.patching_est_release_date || '',
          implementation_date: entry.implementation_date || '',
          compensatory_controls_provided: entry.compensatory_controls_provided || '',
          compensatory_controls_details: entry.compensatory_controls_details || '',
          estimated_time: entry.estimated_time || '',
          site: entry.site || '',
          patching: entry.patching || ''
        };
      });
      setResponses(initialResponses);
      
    } catch (err) {
      console.error('Failed to load sheet data:', err);
      setError(err.message || 'Failed to load sheet data');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (entryId, field, value) => {
    setResponses(prev => {
      const newResponses = {
        ...prev,
        [entryId]: {
          ...prev[entryId],
          [field]: value
        }
      };

      // Clear related fields when parent field changes
      if (field === 'vendor_contacted' && value !== 'Y') {
        newResponses[entryId].vendor_contact_date = '';
      }
      
      if (field === 'compensatory_controls_provided' && value !== 'Y') {
        newResponses[entryId].compensatory_controls_details = '';
      }
      
      if (field === 'current_status' && !['In Progress', 'Completed', 'Blocked'].includes(value)) {
        newResponses[entryId].implementation_date = '';
      }

      return newResponses;
    });
  };

  const handleSubmitSheet = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      // Submit the sheet with all responses
      await sheetService.submitTeamSheet(sheetId, responses);
      
      // Show success message and navigate back
      alert('Sheet submitted successfully!');
      navigate('/my-sheets');
      
    } catch (err) {
      console.error('Failed to submit sheet:', err);
      setError(err.message || 'Failed to submit sheet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Update each entry individually
      for (const entryId in responses) {
        await sheetService.updateEntry(entryId, responses[entryId]);
      }
      alert('Draft saved successfully!');
      await loadSheetData(); // Reload to show updated data
    } catch (err) {
      console.error('Failed to save draft:', err);
      setError(err.message || 'Failed to save draft');
    }
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

  if (!sheet) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">
          Sheet not found or you don't have access to it.
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
              <h1 className="h3 mb-0">Edit Team Sheet</h1>
              <p className="text-muted">
                {sheet.title} - {user?.team?.name || 'Your Team'}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => navigate('/my-sheets')}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Back to Sheets
              </button>
              <button 
                className="btn btn-outline-primary" 
                onClick={handleSaveDraft}
              >
                <i className="fas fa-save me-1"></i>
                Save Draft
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleSubmitSheet}
                disabled={submitting || sheet.assignment_status === 'completed'}
              >
                <i className="fas fa-paper-plane me-1"></i>
                {submitting ? 'Submitting...' : 'Submit Sheet'}
              </button>
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

          {sheet.assignment_status === 'completed' && (
            <div className="alert alert-success" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              This sheet has been completed and submitted.
            </div>
          )}

          {/* Entries Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Sheet Entries</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product Name</th>
                      <th>Vendor</th>
                      <th>Location/Site</th>
                      <th>Risk Level</th>
                      <th>Status</th>
                      <th>Deployed in KE?</th>
                      <th>Vendor Contacted</th>
                      <th>Vendor Contact Date</th>
                      <th>Est. Release Date</th>
                      <th>Implementation Date</th>
                      <th>Compensatory Controls</th>
                      <th>Control Details</th>
                      <th>Estimated Time</th>
                      <th>Patching Status</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <strong>{entry.product_name || 'N/A'}</strong>
                          {entry.product_category && (
                            <small className="d-block text-muted">
                              {entry.product_category}
                            </small>
                          )}
                        </td>
                        <td>{entry.vendor_name || entry.oem_vendor || 'N/A'}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={responses[entry.id]?.site || entry.location || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'site', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                            placeholder="Location/Site"
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={responses[entry.id]?.risk_level || entry.risk_level || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'risk_level', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          >
                            <option value="">Select Risk</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={responses[entry.id]?.current_status || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'current_status', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          >
                            <option value="">Select Status</option>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={responses[entry.id]?.deployed_in_ke || 'N'}
                            onChange={(e) => handleResponseChange(entry.id, 'deployed_in_ke', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          >
                            <option value="Y">Yes</option>
                            <option value="N">No</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={responses[entry.id]?.vendor_contacted || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'vendor_contacted', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          >
                            <option value="">Select</option>
                            <option value="Y">Yes</option>
                            <option value="N">No</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </td>
                        <td>
                          {responses[entry.id]?.vendor_contacted === 'Y' ? (
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={responses[entry.id]?.vendor_contact_date || ''}
                              onChange={(e) => handleResponseChange(entry.id, 'vendor_contact_date', e.target.value)}
                              disabled={sheet.assignment_status === 'completed'}
                            />
                          ) : (
                            <span className="text-muted small">Select "Yes" in Vendor Contacted</span>
                          )}
                        </td>
                        <td>
                          {responses[entry.id]?.vendor_contacted === 'Y' || responses[entry.id]?.current_status === 'In Progress' ? (
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={responses[entry.id]?.patching_est_release_date || ''}
                              onChange={(e) => handleResponseChange(entry.id, 'patching_est_release_date', e.target.value)}
                              disabled={sheet.assignment_status === 'completed'}
                            />
                          ) : (
                            <span className="text-muted small">Contact vendor or set status to In Progress</span>
                          )}
                        </td>
                        <td>
                          {['In Progress', 'Completed', 'Blocked'].includes(responses[entry.id]?.current_status) ? (
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={responses[entry.id]?.implementation_date || ''}
                              onChange={(e) => handleResponseChange(entry.id, 'implementation_date', e.target.value)}
                              disabled={sheet.assignment_status === 'completed'}
                            />
                          ) : (
                            <span className="text-muted small">Set status to In Progress, Completed, or Blocked</span>
                          )}
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={responses[entry.id]?.compensatory_controls_provided || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'compensatory_controls_provided', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          >
                            <option value="">Select</option>
                            <option value="Y">Yes</option>
                            <option value="N">No</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </td>
                        <td>
                          {responses[entry.id]?.compensatory_controls_provided === 'Y' ? (
                            <textarea
                              className="form-control form-control-sm"
                              rows="2"
                              placeholder="Control details..."
                              value={responses[entry.id]?.compensatory_controls_details || ''}
                              onChange={(e) => handleResponseChange(entry.id, 'compensatory_controls_details', e.target.value)}
                              disabled={sheet.assignment_status === 'completed'}
                            />
                          ) : (
                            <span className="text-muted small">Select "Yes" in Compensatory Controls</span>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Est. time"
                            value={responses[entry.id]?.estimated_time || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'estimated_time', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          />
                        </td>
                        <td>
                          <textarea
                            className="form-control form-control-sm"
                            rows="2"
                            placeholder="Patching status..."
                            value={responses[entry.id]?.patching || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'patching', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          />
                        </td>
                        <td>
                          <textarea
                            className="form-control form-control-sm"
                            rows="2"
                            placeholder="Add comments..."
                            value={responses[entry.id]?.comments || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'comments', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {entries.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-file-excel fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No Entries Found</h5>
              <p className="text-muted">This sheet doesn't have any entries yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamSheetEditor;
