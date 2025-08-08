import React, { useState } from 'react';

const ProgressUpdateModal = ({ 
  isOpen, 
  onClose, 
  entry, 
  onSave,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    progress_status: entry?.progress_status || 'investigating',
    progress_notes: entry?.progress_notes || '',
    estimated_completion_date: entry?.estimated_completion_date || '',
    patching_est_release_date: entry?.patching_est_release_date || '',
    patching_status: entry?.patching_status || ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.progress_status) {
      newErrors.progress_status = 'Progress status is required';
    }
    
    if (formData.estimated_completion_date) {
      const date = new Date(formData.estimated_completion_date);
      if (date < new Date()) {
        newErrors.estimated_completion_date = 'Completion date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
  };

  const handleReset = () => {
    setFormData({
      progress_status: entry?.progress_status || 'investigating',
      progress_notes: entry?.progress_notes || '',
      estimated_completion_date: entry?.estimated_completion_date || '',
      patching_est_release_date: entry?.patching_est_release_date || '',
      patching_status: entry?.patching_status || ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-clipboard-list me-2"></i>
              Update Progress - {entry?.product_name || 'Entry'}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Entry Summary */}
              <div className="card mb-3">
                <div className="card-body py-2">
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted">Product:</small>
                      <div className="fw-bold">{entry?.product_name || 'N/A'}</div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">CVE:</small>
                      <div><code>{entry?.cve || 'N/A'}</code></div>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-md-6">
                      <small className="text-muted">Risk Level:</small>
                      <div>
                        <span className={`badge ${
                          entry?.risk_level === 'Critical' || entry?.risk_level === 'High' ? 'bg-danger' :
                          entry?.risk_level === 'Medium' ? 'bg-warning text-dark' : 'bg-success'
                        }`}>
                          {entry?.risk_level || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">Site:</small>
                      <div className="fw-bold text-primary">{entry?.site || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Status */}
              <div className="mb-3">
                <label className="form-label">
                  Progress Status <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.progress_status ? 'is-invalid' : ''}`}
                  name="progress_status"
                  value={formData.progress_status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="investigating">🔍 Investigating</option>
                  <option value="awaiting_patch">⏳ Awaiting Patch</option>
                  <option value="testing_patch">🧪 Testing Patch</option>
                  <option value="patch_scheduled">📅 Patch Scheduled</option>
                  <option value="patched">✅ Patched</option>
                </select>
                {errors.progress_status && (
                  <div className="invalid-feedback">{errors.progress_status}</div>
                )}
              </div>

              {/* Progress Notes */}
              <div className="mb-3">
                <label className="form-label">Progress Notes</label>
                <textarea
                  className="form-control"
                  name="progress_notes"
                  value={formData.progress_notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe current progress, findings, or actions taken..."
                  disabled={loading}
                />
              </div>

              {/* Estimated Completion Date */}
              <div className="mb-3">
                <label className="form-label">Estimated Completion Date</label>
                <input
                  type="date"
                  className={`form-control ${errors.estimated_completion_date ? 'is-invalid' : ''}`}
                  name="estimated_completion_date"
                  value={formData.estimated_completion_date}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.estimated_completion_date && (
                  <div className="invalid-feedback">{errors.estimated_completion_date}</div>
                )}
              </div>

              {/* Patching Information */}
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Patch ETA</label>
                    <input
                      type="date"
                      className="form-control"
                      name="patching_est_release_date"
                      value={formData.patching_est_release_date}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Patching Status</label>
                    <select
                      className="form-select"
                      name="patching_status"
                      value={formData.patching_status}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select status...</option>
                      <option value="not_available">Patch Not Available</option>
                      <option value="available">Patch Available</option>
                      <option value="in_progress">Patching In Progress</option>
                      <option value="completed">Patching Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                <i className="fas fa-undo me-1"></i>
                Reset
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-1"></i>
                    Save Progress
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProgressUpdateModal;
