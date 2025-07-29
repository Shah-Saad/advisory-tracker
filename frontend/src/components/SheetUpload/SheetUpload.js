import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import authService from '../../services/authService';

const SheetUpload = () => {
  const [file, setFile] = useState(null);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
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
    setError('');
    setSuccess('');
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
      const result = await sheetService.uploadSheet(file, month, year);
      setSuccess(`Successfully uploaded ${result.processedCount} entries!`);
      setUploadResult(result);
      
      // Reset form
      setFile(null);
      document.getElementById('fileInput').value = '';
      
    } catch (error) {
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleViewEntries = () => {
    navigate('/entries');
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
