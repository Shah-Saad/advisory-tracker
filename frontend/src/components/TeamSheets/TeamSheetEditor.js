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

      // Auto-mark columns as "N/A" when "Deployed in KE?" is "No"
      if (field === 'deployed_in_ke' && value === 'N') {
        newResponses[entryId].site = 'N/A';
        newResponses[entryId].current_status = 'N/A';
        newResponses[entryId].vendor_contacted = 'N/A';
        newResponses[entryId].vendor_contact_date = '';
        newResponses[entryId].patching_est_release_date = '';
        newResponses[entryId].implementation_date = '';
        newResponses[entryId].compensatory_controls_provided = 'N/A';
        newResponses[entryId].compensatory_controls_details = '';
        newResponses[entryId].estimated_time = 'N/A';
        newResponses[entryId].patching = 'N/A';
      }

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

  // Helper function to check if a field should be disabled when "Deployed in KE?" is "No"
  const isFieldDisabledWhenNotDeployed = (entryId, fieldName) => {
    const isNotDeployed = responses[entryId]?.deployed_in_ke === 'N';
    const fieldsToDisable = [
      'site',
      'current_status', 
      'vendor_contacted', 
      'vendor_contact_date', 
      'patching_est_release_date', 
      'implementation_date',
      'compensatory_controls_provided', 
      'compensatory_controls_details', 
      'estimated_time', 
      'patching'
    ];
    return isNotDeployed && fieldsToDisable.includes(fieldName);
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
        const responseData = responses[entryId];
        console.log(`Saving draft for entry ${entryId}:`, responseData);
        
        // Log specific date fields
        const dateFields = ['vendor_contact_date', 'patching_est_release_date', 'implementation_date'];
        dateFields.forEach(field => {
          if (responseData[field]) {
            console.log(`  ${field}: "${responseData[field]}" (type: ${typeof responseData[field]})`);
          }
        });
        
        await sheetService.updateEntry(entryId, responseData);
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

          {/* Help text for form behavior */}
          <div className="alert alert-info" role="alert">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Form Guidelines:</strong>
            <ul className="mb-0 mt-2">
              <li>When <strong>"Deployed in KE?"</strong> is set to <strong>"No"</strong>, all other fields will automatically be marked as "N/A"</li>
              <li><strong>Risk Level</strong> and <strong>CVE</strong> are read-only and determined by the source data</li>
              <li><strong>Location/Site</strong> field is only available when deployed in KE</li>
              <li><strong>Vendor Contact Date</strong> appears only when "Vendor Contacted" is "Yes"</li>
              <li><strong>Estimated Time</strong> appears only when "Compensatory Controls Provided" is "Yes"</li>
              <li>Date fields will only appear when their prerequisite conditions are met</li>
              <li>Use <strong>"Save Draft"</strong> to save your progress without submitting</li>
            </ul>
          </div>

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
                      <th style={{minWidth: '120px'}}>OEM/Vendor</th>
                      <th style={{minWidth: '120px'}}>Product Name</th>
                      <th style={{minWidth: '150px'}}>Source</th>
                      <th style={{minWidth: '80px'}}>Risk Level</th>
                      <th style={{minWidth: '100px'}}>CVE</th>
                      <th style={{minWidth: '120px'}}>Deployed in KE</th>
                      <th style={{minWidth: '200px'}}>Patching</th>
                      <th style={{minWidth: '120px'}}>Vendor Contacted</th>
                      <th style={{minWidth: '150px'}}>Compensatory Controls</th>
                      <th style={{minWidth: '100px'}}>Status</th>
                      <th style={{minWidth: '150px'}}>Comments</th>
                      <th style={{minWidth: '100px'}}>Month/Year</th>
                    </tr>
                    <tr>
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
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        {/* OEM/Vendor */}
                        <td style={{fontSize: '0.85rem'}}>
                          <strong>{entry.vendor_name || entry.oem_vendor || 'N/A'}</strong>
                        </td>
                        
                        {/* Product Name */}
                        <td style={{fontSize: '0.85rem'}}>
                          <strong>{entry.product_name || 'N/A'}</strong>
                          {entry.product_category && (
                            <small className="d-block text-muted">
                              {entry.product_category}
                            </small>
                          )}
                        </td>
                        
                        {/* Source */}
                        <td style={{fontSize: '0.85rem'}}>
                          {entry.source ? (
                            <a href={entry.source} target="_blank" rel="noopener noreferrer" className="text-primary">
                              {entry.source.includes('cisa.gov') ? 'CISA Advisory' : 'Source Link'}
                            </a>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        
                        {/* Risk Level */}
                        <td>
                          <span className={`badge ${
                            entry.risk_level === 'Critical' ? 'bg-danger' :
                            entry.risk_level === 'High' ? 'bg-warning text-dark' :
                            entry.risk_level === 'Medium' ? 'bg-info' :
                            entry.risk_level === 'Low' ? 'bg-success' :
                            'bg-secondary'
                          }`} style={{fontSize: '0.75rem'}}>
                            {entry.risk_level || 'N/A'}
                          </span>
                        </td>
                        
                        {/* CVE */}
                        <td style={{fontSize: '0.85rem'}}>
                          <span className="text-muted">{entry.cve || 'N/A'}</span>
                        </td>
                        
                        {/* Deployed in KE */}
                        <td>
                          <select
                            className="form-select form-select-sm"
                            style={{fontSize: '0.85rem'}}
                            value={responses[entry.id]?.deployed_in_ke || 'N'}
                            onChange={(e) => handleResponseChange(entry.id, 'deployed_in_ke', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                          >
                            <option value="Y">Yes</option>
                            <option value="N">No</option>
                          </select>
                          {responses[entry.id]?.deployed_in_ke === 'Y' && (
                            <input
                              type="text"
                              className="form-control form-control-sm mt-1"
                              value={responses[entry.id]?.site || entry.location || ''}
                              onChange={(e) => handleResponseChange(entry.id, 'site', e.target.value)}
                              disabled={sheet.assignment_status === 'completed'}
                              placeholder="Site"
                              style={{fontSize: '0.8rem'}}
                            />
                          )}
                        </td>
                        
                        {/* Patching (Est. Release Date & Implementation Date) */}
                        <td>
                          <div className="d-flex gap-1">
                            <div className="flex-fill">
                              {responses[entry.id]?.deployed_in_ke === 'N' ? (
                                <span className="text-muted small">N/A</span>
                              ) : (responses[entry.id]?.vendor_contacted === 'Y' || responses[entry.id]?.current_status === 'In Progress') ? (
                                <input
                                  type="date"
                                  className="form-control form-control-sm"
                                  value={responses[entry.id]?.patching_est_release_date || ''}
                                  onChange={(e) => handleResponseChange(entry.id, 'patching_est_release_date', e.target.value)}
                                  disabled={sheet.assignment_status === 'completed'}
                                  style={{fontSize: '0.75rem'}}
                                />
                              ) : (
                                <span className="text-muted small">Date</span>
                              )}
                            </div>
                            <div className="flex-fill">
                              {responses[entry.id]?.deployed_in_ke === 'N' ? (
                                <span className="text-muted small">N/A</span>
                              ) : ['In Progress', 'Completed', 'Blocked'].includes(responses[entry.id]?.current_status) ? (
                                <input
                                  type="date"
                                  className="form-control form-control-sm"
                                  value={responses[entry.id]?.implementation_date || ''}
                                  onChange={(e) => handleResponseChange(entry.id, 'implementation_date', e.target.value)}
                                  disabled={sheet.assignment_status === 'completed'}
                                  style={{fontSize: '0.75rem'}}
                                />
                              ) : (
                                <span className="text-muted small">Date</span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Vendor Contacted */}
                        <td>
                          {responses[entry.id]?.deployed_in_ke === 'N' ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <>
                              <select
                                className="form-select form-select-sm"
                                style={{fontSize: '0.85rem'}}
                                value={responses[entry.id]?.vendor_contacted || ''}
                                onChange={(e) => handleResponseChange(entry.id, 'vendor_contacted', e.target.value)}
                                disabled={sheet.assignment_status === 'completed'}
                              >
                                <option value="">Select</option>
                                <option value="Y">Yes</option>
                                <option value="N">No</option>
                              </select>
                              {responses[entry.id]?.vendor_contacted === 'Y' && (
                                <input
                                  type="date"
                                  className="form-control form-control-sm mt-1"
                                  value={responses[entry.id]?.vendor_contact_date || ''}
                                  onChange={(e) => handleResponseChange(entry.id, 'vendor_contact_date', e.target.value)}
                                  disabled={sheet.assignment_status === 'completed'}
                                  style={{fontSize: '0.75rem'}}
                                />
                              )}
                            </>
                          )}
                        </td>
                        
                        {/* Compensatory Controls */}
                        <td>
                          {responses[entry.id]?.deployed_in_ke === 'N' ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <>
                              <select
                                className="form-select form-select-sm"
                                style={{fontSize: '0.85rem'}}
                                value={responses[entry.id]?.compensatory_controls_provided || ''}
                                onChange={(e) => handleResponseChange(entry.id, 'compensatory_controls_provided', e.target.value)}
                                disabled={sheet.assignment_status === 'completed'}
                              >
                                <option value="">Select</option>
                                <option value="Y">Yes</option>
                                <option value="N">No</option>
                                <option value="N/A">Not Applicable</option>
                              </select>
                              {responses[entry.id]?.compensatory_controls_provided === 'Y' && (
                                <>
                                  <textarea
                                    className="form-control form-control-sm mt-1"
                                    rows="1"
                                    placeholder="Control details..."
                                    value={responses[entry.id]?.compensatory_controls_details || ''}
                                    onChange={(e) => handleResponseChange(entry.id, 'compensatory_controls_details', e.target.value)}
                                    disabled={sheet.assignment_status === 'completed'}
                                    style={{fontSize: '0.75rem'}}
                                  />
                                  <input
                                    type="text"
                                    className="form-control form-control-sm mt-1"
                                    placeholder="Est. time"
                                    value={responses[entry.id]?.estimated_time || ''}
                                    onChange={(e) => handleResponseChange(entry.id, 'estimated_time', e.target.value)}
                                    disabled={sheet.assignment_status === 'completed'}
                                    style={{fontSize: '0.75rem'}}
                                  />
                                </>
                              )}
                            </>
                          )}
                        </td>
                        
                        {/* Status */}
                        <td>
                          {responses[entry.id]?.deployed_in_ke === 'N' ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <select
                              className="form-select form-select-sm"
                              style={{fontSize: '0.85rem'}}
                              value={responses[entry.id]?.current_status || ''}
                              onChange={(e) => handleResponseChange(entry.id, 'current_status', e.target.value)}
                              disabled={sheet.assignment_status === 'completed'}
                            >
                              <option value="">Select Status</option>
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                          )}
                        </td>
                        
                        {/* Comments */}
                        <td>
                          <textarea
                            className="form-control form-control-sm"
                            rows="1"
                            placeholder="Comments"
                            value={responses[entry.id]?.comments || ''}
                            onChange={(e) => handleResponseChange(entry.id, 'comments', e.target.value)}
                            disabled={sheet.assignment_status === 'completed'}
                            style={{fontSize: '0.75rem'}}
                          />
                        </td>
                        
                        {/* Month/Year */}
                        <td style={{fontSize: '0.85rem'}}>
                          <span className="text-muted">N/A</span>
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
