const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

class CISAReportService {
  
  /**
   * Preview CISA advisories for a specific month/year
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Promise<Object>} Preview data
   */
  async previewAdvisories(month, year) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/preview-cisa-advisories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month, year })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to preview advisories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error previewing CISA advisories:', error);
      throw error;
    }
  }

  /**
   * Generate and download CISA advisory Excel report
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Promise<void>}
   */
  async generateReport(month, year) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/generate-cisa-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month, year })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `CISA_Advisories_${month}_${year}.xlsx`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error('Error generating CISA report:', error);
      throw error;
    }
  }

  /**
   * Get month name from number
   * @param {number} month - Month number (1-12)
   * @returns {string} Month name
   */
  getMonthName(month) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1] || 'Unknown';
  }

  /**
   * Get list of months for dropdown
   * @returns {Array} Array of month objects
   */
  getMonthOptions() {
    return [
      { value: 1, label: 'January' },
      { value: 2, label: 'February' },
      { value: 3, label: 'March' },
      { value: 4, label: 'April' },
      { value: 5, label: 'May' },
      { value: 6, label: 'June' },
      { value: 7, label: 'July' },
      { value: 8, label: 'August' },
      { value: 9, label: 'September' },
      { value: 10, label: 'October' },
      { value: 11, label: 'November' },
      { value: 12, label: 'December' }
    ];
  }

  /**
   * Get list of years for dropdown
   * @returns {Array} Array of year objects
   */
  getYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Add years from 2020 to current year + 1
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push({ value: year, label: year.toString() });
    }
    
    return years.reverse(); // Most recent first
  }
}

const cisaReportService = new CISAReportService();
export default cisaReportService;
