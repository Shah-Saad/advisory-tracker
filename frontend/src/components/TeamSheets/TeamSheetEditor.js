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
  const [submitEnabled, setSubmitEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Real-time sync for collaborative editing
  useEffect(() => {
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/sse/subscribe?token=${localStorage.getItem('token')}`);
    
    eventSource.onopen = () => {
      console.log('✅ Real-time sync connected for sheet editor');
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'entry_updated' && data.data?.entry) {
        const updatedEntry = data.data.entry;
        const updatedBy = data.data.updatedBy;
        
        // Only sync if the update was made by someone else
        if (updatedBy?.id !== user?.id) {
          console.log(`🔄 Syncing entry ${updatedEntry.id} updated by ${updatedBy?.name || updatedBy?.email}`);
          
          // Update the specific entry in our responses state
          setResponses(prev => ({
            ...prev,
            [updatedEntry.id]: {
              ...prev[updatedEntry.id],
              ...updatedEntry
            }
          }));
        }
      } else if (data.type === 'team_response_updated' && data.data?.response) {
        const updatedResponse = data.data.response;
        const updatedBy = data.data.updatedBy;
        
        // Only sync if the update was made by someone else
        if (updatedBy?.id !== user?.id) {
          console.log(`🔄 Syncing team response ${updatedResponse.id} updated by ${updatedBy?.name || updatedBy?.email}`);
          
          // Update the specific response in our responses state
          setResponses(prev => ({
            ...prev,
            [updatedResponse.original_entry_id]: {
              ...prev[updatedResponse.original_entry_id],
              ...updatedResponse
            }
          }));
        }
      }
    };

    eventSource.onerror = (error) => {
      console.warn('⚠️ Real-time sync error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  useEffect(() => {
    loadSheetData();
    setUser(authService.getCurrentUser());
  }, [sheetId]);

  // Timer effect for submit button availability
  useEffect(() => {
    if (!sheet || !sheet.assigned_at) return;

    const assignedTime = new Date(sheet.assigned_at);
    const now = new Date();
    const timeElapsed = now - assignedTime;
    const oneMinuteMs = 60 * 1000; // 1 minute in milliseconds

    if (timeElapsed >= oneMinuteMs) {
      // More than 1 minute has passed
      setSubmitEnabled(true);
      setTimeRemaining(0);
    } else {
      // Less than 1 minute has passed, start countdown
      const remaining = oneMinuteMs - timeElapsed;
      setTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
      setSubmitEnabled(false);

      // Start countdown timer
      const timer = setInterval(() => {
        const currentTime = new Date();
        const currentElapsed = currentTime - assignedTime;
        
        if (currentElapsed >= oneMinuteMs) {
          setSubmitEnabled(true);
          setTimeRemaining(0);
          clearInterval(timer);
        } else {
          const currentRemaining = oneMinuteMs - currentElapsed;
          setTimeRemaining(Math.ceil(currentRemaining / 1000));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sheet]);

  const loadSheetData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user's team ID
      const currentUser = authService.getCurrentUser();
      const teamId = currentUser?.team_id;
      
      if (!teamId) {
        throw new Error('User is not assigned to a team');
      }
      
      // Get team-specific sheet data
      const teamSheetData = await sheetService.getTeamSheetData(sheetId, teamId);
      setSheet(teamSheetData.sheet);
      setEntries(teamSheetData.responses);
      
      // Initialize responses object from team responses
      const initialResponses = {};
      teamSheetData.responses.forEach(response => {
        initialResponses[response.id] = {
          current_status: response.current_status || '',
          comments: response.comments || '',
          deployed_in_ke: response.deployed_in_ke || 'N',
          vendor_contacted: response.vendor_contacted || '',
          vendor_contact_date: response.vendor_contact_date || '',
          patching_est_release_date: response.patching_est_release_date || '',
          implementation_date: response.implementation_date || '',
          compensatory_controls_provided: response.compensatory_controls_provided || '',
          compensatory_controls_details: response.compensatory_controls_details || '',
          estimated_time: response.estimated_time || '',
          site: response.site || '',
          patching: response.patching || ''
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

  // Auto-save individual entry changes (debounced)
  const autoSaveEntry = async (entryId, responseData) => {
    try {
      setAutoSaving(true);
      console.log(`🔄 Auto-saving team response ${entryId} with data:`, responseData);
      
      // Update the team response in the sheet_responses table
      const currentUser = authService.getCurrentUser();
      const teamId = currentUser?.team_id;
      
      if (!teamId) {
        throw new Error('User is not assigned to a team');
      }
      
      // Find the team response record
      const response = entries.find(r => r.id === entryId);
      if (!response) {
        throw new Error('Response not found');
      }
      
      console.log(`✅ Found team response record for auto-save:`, response);
      
      // Use the new draft saving method
      const result = await sheetService.saveTeamResponseDraft(response.id, responseData);
      console.log(`✅ Auto-save successful for entry ${entryId}:`, result);
      
      setLastSaved(new Date());
    } catch (error) {
      console.error(`❌ Auto-save failed for entry ${entryId}:`, error);
      console.error('❌ Auto-save error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Don't show alert for auto-save failures, just log them
      setError(`Auto-save failed: ${error.message}`);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleResponseChange = (entryId, field, value) => {
    console.log(`🔄 Changing field "${field}" to "${value}" for entry ${entryId}`);
    
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
        console.log(`📝 Setting all fields to N/A for entry ${entryId} because deployed_in_ke = N`);
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
        console.log(`✅ Updated response for entry ${entryId}:`, newResponses[entryId]);
      }

      // Clear related fields when parent field changes
      if (field === 'vendor_contacted' && value !== 'Y') {
        newResponses[entryId].vendor_contact_date = '';
      }
      
      if (field === 'compensatory_controls_provided' && value !== 'Y') {
        newResponses[entryId].compensatory_controls_details = '';
        newResponses[entryId].estimated_time = '';
      }
      
      if (field === 'current_status' && !['In Progress', 'Completed', 'Blocked'].includes(value)) {
        newResponses[entryId].implementation_date = '';
      }

      // Clear patching-related fields when patching is set to "No" or "N/A"
      if (field === 'patching' && (value === 'N' || value === 'N/A' || value === 'No')) {
        newResponses[entryId].patching_est_release_date = '';
        newResponses[entryId].implementation_date = '';
      }

      // Immediately auto-save with the new response data
      setTimeout(() => {
        autoSaveEntry(entryId, newResponses[entryId]);
      }, 100); // Reduced to 100ms for faster response

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

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
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
      console.log('🔄 Starting draft save process...');
      console.log('📝 Responses to save:', responses);
      
      if (!responses || Object.keys(responses).length === 0) {
        alert('No data to save. Please fill in some fields first.');
        return;
      }
      
      // Update each team response individually
      for (const entryId in responses) {
        const responseData = {
          ...responses[entryId],
          _timestamp: Date.now() // Add cache-busting timestamp
        };
        console.log(`💾 Saving draft for team response ${entryId}:`, responseData);
        
        // Log specific date fields
        const dateFields = ['vendor_contact_date', 'patching_est_release_date', 'implementation_date'];
        dateFields.forEach(field => {
          if (responseData[field]) {
            console.log(`  ${field}: "${responseData[field]}" (type: ${typeof responseData[field]})`);
          }
        });
        
        // Find the team response record
        const response = entries.find(r => r.id === parseInt(entryId));
        if (!response) {
          console.warn(`⚠️ Team response not found for entry ${entryId}`);
          continue;
        }
        
        console.log(`✅ Found team response record:`, response);
        
        // Use the new draft saving method
        const result = await sheetService.saveTeamResponseDraft(response.id, responseData);
        console.log(`✅ Draft saved successfully for entry ${entryId}:`, result);
      }
      
      console.log('🎉 All drafts saved successfully!');
      alert('Draft saved successfully!');
      await loadSheetData(); // Reload to show updated data
    } catch (err) {
      console.error('❌ Failed to save draft:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to save draft';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      alert(`Failed to save draft: ${errorMessage}`);
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
              <h1 className="h3 mb-0">
                Edit Team Sheet
                {autoSaving && (
                  <span className="ms-2 small text-primary">
                    <i className="fas fa-spinner fa-spin"></i> Auto-saving...
                  </span>
                )}
                {lastSaved && !autoSaving && (
                  <span className="ms-2 small text-success">
                    <i className="fas fa-check"></i> Saved {formatTimeAgo(lastSaved)}
                  </span>
                )}
              </h1>
              <p className="text-muted">
                {sheet.title} - {user?.team?.name || 'Your Team'}
                <span className="ms-2 small text-info">
                  <i className="fas fa-bolt"></i> Changes auto-save as you type
                </span>
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
                className={`btn ${submitEnabled ? 'btn-success' : 'btn-secondary'}`}
                onClick={handleSubmitSheet}
                disabled={submitting || sheet.assignment_status === 'completed' || !submitEnabled}
                title={!submitEnabled ? `Submit will be available in ${timeRemaining} seconds` : 'Submit your completed sheet'}
              >
                <i className="fas fa-paper-plane me-1"></i>
                {submitting ? 'Submitting...' : 
                 !submitEnabled ? `Wait ${timeRemaining}s` : 
                 'Submit Sheet'}
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

          {!submitEnabled && timeRemaining > 0 && sheet.assignment_status !== 'completed' && (
            <div className="alert alert-info" role="alert">
              <i className="fas fa-clock me-2"></i>
              <strong>Submit Timer:</strong> You can submit this sheet in <strong>{timeRemaining} seconds</strong>. 
              Use this time to review and complete your responses.
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
