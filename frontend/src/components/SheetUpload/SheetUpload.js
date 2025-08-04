import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import sheetService from '../../services/sheetService';
import authService from '../../services/authService';
import apiClient from '../../services/api';

const SheetUpload = () => {
  const [file, setFile] = useState(null);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [deletingSheet, setDeletingSheet] = useState(null);
  const navigate = useNavigate();

  // Initialize month with current month
  useEffect(() => {
    if (!month) {
      const currentMonth = new Date().getMonth();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      setMonth(monthNames[currentMonth]);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Load sheets when currentUser changes and is available
  useEffect(() => {
    if (currentUser) {
      loadSheets();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadSheets = async () => {
    if (!canUpload()) return;
    
    setLoadingSheets(true);
    try {
      const data = await sheetService.getAllSheets();
      setSheets(data);
    } catch (error) {
      console.error('Failed to load sheets:', error);
      toast.error('Failed to load sheets');
    } finally {
      setLoadingSheets(false);
    }
  };

  // Check if user has upload permissions (admin only)
  const canUpload = () => {
    return currentUser && currentUser.role === 'admin';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Clear previous messages when file changes
    setError('');
    setSuccess('');
    setUploadResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check permissions first
    if (!canUpload()) {
      setError('Access denied. Only administrators can upload sheets.');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!month || !year) {
      setError('Please select month and year');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Always distribute to teams automatically
      const result = await sheetService.uploadSheet(file, month, year, true);
      
      setSuccess(`Successfully uploaded ${result.processedCount} entries and automatically distributed to all teams!`);
      
      setUploadResult(result);
      
      // Reset only the file input, keep month/year selections
      setFile(null);
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Don't reset month/year as user might want to upload another file for the same period
      
      // Reload sheets list
      await loadSheets();
      
      // Show success toast
      toast.success(`Successfully uploaded ${result.processedCount} entries and distributed to all teams!`);
      
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleViewEntries = () => {
    navigate('/entries');
  };

  const handleDeleteSheet = async (sheetId, sheetTitle) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the sheet "${sheetTitle}"? This will also remove all team assignments and responses for this sheet. This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    setDeletingSheet(sheetId);
    setError('');
    setSuccess('');

    try {
      await sheetService.deleteSheet(sheetId);
      
      toast.success(
        `Successfully deleted sheet "${sheetTitle}" and all associated data`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
      
      setSuccess(`Sheet "${sheetTitle}" deleted successfully!`);
      
      // Reload sheets list
      loadSheets();
      
    } catch (error) {
      console.error('Error deleting sheet:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete sheet';
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setDeletingSheet(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'badge bg-success';
      case 'in_progress': return 'badge bg-warning text-dark';
      case 'pending': return 'badge bg-secondary';
      case 'distributed': return 'badge bg-info text-dark';
      default: return 'badge bg-light text-dark';
    }
  };

  const handleDeleteAllEntries = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL sheet entries from the database? This action cannot be undone.'
    );
    
    if (!confirmed) {
      return;
    }

    setDeletingAll(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.delete('/sheet-entries/all');
      
      toast.success(
        `Successfully deleted ${response.data.deletedCount} entries from the database`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
      
      setSuccess(`Database cleaned! Deleted ${response.data.deletedCount} entries.`);
      
    } catch (error) {
      console.error('Error deleting all entries:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete entries';
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-lg-8 offset-lg-2">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">Upload Sheet</h1>
              <p className="text-muted">Upload Excel or CSV files to add advisory entries</p>
            </div>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/dashboard')}
            >
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </button>
          </div>

          {/* Database Cleanup Section - Only for Admins */}
          {canUpload() && (
            <div className="card mb-4 border-warning">
              <div className="card-header bg-warning bg-opacity-10">
                <h5 className="mb-0 text-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Database Management
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">
                  Use this section to clear all existing sheet entries before uploading a new file. 
                  This is useful when you want to replace all data with a fresh upload.
                </p>
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    {success}
                  </div>
                )}
                
                <div className="d-flex align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteAllEntries}
                    disabled={deletingAll}
                  >
                    {deletingAll ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Deleting All Entries...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash me-2"></i>
                        Delete All Entries
                      </>
                    )}
                  </button>
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    This will permanently delete all sheet entries from the database
                  </small>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              {!canUpload() ? (
                <div className="alert alert-warning" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Access Denied</strong><br />
                  Only administrators can upload security sheets.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label htmlFor="month" className="form-label">Month</label>
                      <select
                        className="form-select"
                        id="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        required
                      >
                        <option value="">Select Month</option>
                        {months.map((monthName, index) => (
                          <option key={index} value={monthName}>
                            {monthName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="year" className="form-label">Year</label>
                      <select
                        className="form-select"
                        id="year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      >
                        {years.map((yearOption) => (
                          <option key={yearOption} value={yearOption}>
                            {yearOption}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="fileInput" className="form-label">Sheet File</label>
                    <div className="upload-area">
                      <input
                        type="file"
                        className="form-control"
                        id="fileInput"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        required
                      />
                      <div className="mt-2">
                        <small className="text-muted">
                          Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
                        </small>
                      </div>
                      {file && (
                        <div className="mt-2">
                          <small className="text-success">
                            <i className="fas fa-file me-1"></i>
                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success" role="alert">
                      <i className="fas fa-check-circle me-2"></i>
                      {success}
                    </div>
                  )}

                  {uploadResult && (
                    <div className="alert alert-info" role="alert">
                      <h6 className="alert-heading">Upload Summary</h6>
                      <ul className="mb-0">
                        <li>Total rows processed: {uploadResult.processedCount}</li>
                        <li>Successfully saved: {uploadResult.successCount || uploadResult.processedCount}</li>
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                          <li>Errors: {uploadResult.errors.length}</li>
                        )}
                      </ul>
                      <hr />
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-primary"
                          type="button"
                          onClick={handleViewEntries}
                        >
                          View Uploaded Entries
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="alert alert-info mb-4">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Auto-Distribution:</strong> Uploaded sheets will be automatically distributed to all operational teams (Generation, Distribution, Transmission) for completion.
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={uploading || !file}
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-upload me-2"></i>
                          Upload Sheet
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Uploaded Sheets Management
              </h5>
            </div>
            <div className="card-body">
              {loadingSheets ? (
                <div className="text-center">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading sheets...</p>
                </div>
              ) : sheets.length === 0 ? (
                <p className="text-muted mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  No sheets have been uploaded yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Sheet Title</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Upload Date</th>
                        <th>Distributed Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheets.map((sheet) => (
                        <tr key={sheet.id}>
                          <td>
                            <strong>{sheet.title || 'Untitled Sheet'}</strong>
                          </td>
                          <td>
                            <small className="text-muted">
                              {sheet.description || 'No description'}
                            </small>
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(sheet.status)}>
                              {sheet.status || 'pending'}
                            </span>
                          </td>
                          <td>
                            <small>{formatDate(sheet.created_at)}</small>
                          </td>
                          <td>
                            <small>{formatDate(sheet.distributed_at)}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteSheet(sheet.id, sheet.title || 'Untitled Sheet')}
                                disabled={deletingSheet === sheet.id}
                                title="Delete this sheet and all associated data"
                              >
                                {deletingSheet === sheet.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-trash me-1"></i>
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Upload Guidelines
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Supported Columns</h6>
                  <ul className="small">
                    <li>OEM/Vendor</li>
                    <li>Source</li>
                    <li>Risk Level</li>
                    <li>CVE</li>
                    <li>Deployed in KE</li>
                    <li>And 40+ additional columns...</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>File Requirements</h6>
                  <ul className="small">
                    <li>Maximum file size: 10MB</li>
                    <li>Supported formats: .xlsx, .xls, .csv</li>
                    <li>First row should contain column headers</li>
                    <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetUpload;
