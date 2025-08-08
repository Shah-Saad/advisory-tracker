import React, { useState } from 'react';
import cisaReportService from '../../services/cisaReportService';
import './CISAReportGenerator.css';

const CISAReportGenerator = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const monthOptions = cisaReportService.getMonthOptions();
  const yearOptions = cisaReportService.getYearOptions();

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      setError('');
      setPreview(null);

      const previewData = await cisaReportService.previewAdvisories(selectedMonth, selectedYear);
      setPreview(previewData);
    } catch (error) {
      setError(error.message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await cisaReportService.generateReport(selectedMonth, selectedYear);
      setSuccess(`Successfully generated CISA advisory report for ${cisaReportService.getMonthName(selectedMonth)} ${selectedYear}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
    setPreview(null);
  };

  return (
    <div className="cisa-report-generator">
      <div className="cisa-header">
        <div className="cisa-header-content">
          <h2>
            <i className="fas fa-shield-alt"></i>
            CISA Advisory Report Generator
          </h2>
          <p>Generate monthly Excel reports of CISA cybersecurity advisories</p>
        </div>
      </div>

      <div className="cisa-form-container">
        <div className="cisa-form">
          <div className="cisa-form-group">
            <label htmlFor="month-select">
              <i className="fas fa-calendar-alt"></i>
              Month
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(parseInt(e.target.value));
                clearMessages();
              }}
              className="cisa-select"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="cisa-form-group">
            <label htmlFor="year-select">
              <i className="fas fa-calendar"></i>
              Year
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                clearMessages();
              }}
              className="cisa-select"
            >
              {yearOptions.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          <div className="cisa-actions">
            <button
              onClick={handlePreview}
              disabled={previewing}
              className="cisa-btn cisa-btn-preview"
            >
              {previewing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Previewing...
                </>
              ) : (
                <>
                  <i className="fas fa-eye"></i>
                  Preview Advisories
                </>
              )}
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="cisa-btn cisa-btn-generate"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i>
                  Generate Excel Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="cisa-message cisa-error">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="cisa-message cisa-success">
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        {/* Preview Section */}
        {preview && (
          <div className="cisa-preview">
            <div className="cisa-preview-header">
              <h3>
                <i className="fas fa-list"></i>
                Preview: {preview.month} {preview.year} CISA Advisories
              </h3>
              <div className="cisa-preview-stats">
                <span className="cisa-count">
                  Found {preview.totalFound} advisories
                </span>
              </div>
            </div>

            {preview.totalFound > 0 ? (
              <div className="cisa-preview-content">
                <div className="cisa-preview-note">
                  <i className="fas fa-info-circle"></i>
                  Showing first {Math.min(10, preview.totalFound)} advisories. 
                  Generate the full Excel report to see all {preview.totalFound} advisories.
                </div>

                <div className="cisa-advisories-list">
                  {preview.advisories.map((advisory, index) => (
                    <div key={index} className="cisa-advisory-item">
                      <div className="advisory-header">
                        <span className="advisory-id">{advisory.advisoryId}</span>
                        <span className="advisory-date">{advisory.date}</span>
                      </div>
                      <div className="advisory-title">{advisory.title}</div>
                      <div className="advisory-meta">
                        <span className="advisory-type">{advisory.type}</span>
                        {advisory.link && (
                          <a 
                            href={advisory.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="advisory-link"
                          >
                            <i className="fas fa-external-link-alt"></i>
                            View Advisory
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="cisa-no-results">
                <i className="fas fa-info-circle"></i>
                No CISA advisories found for {preview.month} {preview.year}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="cisa-info">
        <h4>
          <i className="fas fa-info-circle"></i>
          About CISA Advisory Reports
        </h4>
        <ul>
          <li>Reports are generated from official CISA cybersecurity advisories</li>
          <li>Excel files include columns for vendor/OEM, product, risk level, and comments</li>
          <li>Data is fetched in real-time from the CISA website</li>
          <li>Generated files are ready for manual completion and import into the system</li>
        </ul>
      </div>
    </div>
  );
};

export default CISAReportGenerator;
