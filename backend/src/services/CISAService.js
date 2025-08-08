const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

class CISAService {
  constructor() {
    this.baseUrl = 'https://www.cisa.gov/news-events/cybersecurity-advisories';
    this.advisoryTypeFilter = '?f%5B0%5D=advisory_type%3A95';
  }

  /**
   * Scrape CISA advisories for a specific month and year
   * @param {number} month - Month (1-12)
   * @param {number} year - Year (e.g., 2025)
   * @returns {Array} Array of advisory objects
   */
  async scrapeAdvisories(month, year) {
    try {
      console.log(`🔍 Scraping CISA advisories for ${month}/${year}...`);
      
      const advisories = [];
      let page = 0;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const url = `${this.baseUrl}${this.advisoryTypeFilter}&page=${page}`;
        console.log(`📄 Fetching page ${page + 1}: ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 30000
        });
        
        const $ = cheerio.load(response.data);
        const pageAdvisories = [];
        
        // Find all advisory articles
        $('.c-teaser').each((index, element) => {
          try {
            const $teaser = $(element);
            
            // Extract date
            const dateText = $teaser.find('.c-teaser__date time').attr('datetime') || 
                           $teaser.find('.c-teaser__date time').text().trim();
            
            if (!dateText) return;
            
            const advisoryDate = new Date(dateText);
            const advisoryMonth = advisoryDate.getMonth() + 1; // JavaScript months are 0-indexed
            const advisoryYear = advisoryDate.getFullYear();
            
            // Only include advisories from the specified month and year
            if (advisoryMonth !== month || advisoryYear !== year) {
              return;
            }
            
            // Extract advisory ID
            const metaText = $teaser.find('.c-teaser__meta').text().trim();
            const advisoryId = metaText.includes('|') ? 
              metaText.split('|')[1].trim() : 
              metaText;
            
            // Extract title and link
            const titleElement = $teaser.find('.c-teaser__title a');
            const title = titleElement.find('span').text().trim() || titleElement.text().trim();
            const relativeLink = titleElement.attr('href');
            const fullLink = relativeLink ? `https://www.cisa.gov${relativeLink}` : '';
            
            // Extract advisory type
            const advisoryType = metaText.includes('|') ? 
              metaText.split('|')[0].trim() : 
              'ICS Advisory';
            
            if (title && advisoryId) {
              const advisory = {
                date: advisoryDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                advisoryId,
                title,
                type: advisoryType,
                link: fullLink,
                month: advisoryMonth,
                year: advisoryYear
              };
              
              pageAdvisories.push(advisory);
              console.log(`✅ Found advisory: ${advisoryId} - ${title}`);
            }
          } catch (error) {
            console.error('Error parsing advisory:', error);
          }
        });
        
        advisories.push(...pageAdvisories);
        
        // Check if we found any advisories on this page for the target month
        // If no advisories from target month found and we've checked several pages, stop
        if (pageAdvisories.length === 0) {
          hasMorePages = false;
        } else {
          page++;
          // Add delay to be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Safety limit to prevent infinite loops
        if (page > 20) {
          console.log('⚠️ Reached page limit, stopping...');
          hasMorePages = false;
        }
      }
      
      console.log(`📊 Found ${advisories.length} advisories for ${month}/${year}`);
      return advisories.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
      
    } catch (error) {
      console.error('Error scraping CISA advisories:', error);
      throw new Error(`Failed to scrape CISA advisories: ${error.message}`);
    }
  }

  /**
   * Generate Excel file from advisories data
   * @param {Array} advisories - Array of advisory objects
   * @param {number} month - Target month
   * @param {number} year - Target year
   * @returns {Buffer} Excel file buffer
   */
  async generateExcelFile(advisories, month, year) {
    try {
      console.log(`📝 Generating Excel file for ${advisories.length} advisories...`);
      
      // Prepare data for Excel
      const excelData = advisories.map((advisory, index) => ({
        'S.No': index + 1,
        'Date': advisory.date,
        'Advisory ID': advisory.advisoryId,
        'Title': advisory.title,
        'Type': advisory.type,
        'Link': advisory.link,
        'Vendor/OEM': '', // Empty for manual entry
        'Product': '', // Empty for manual entry
        'Risk Level': '', // Empty for manual entry
        'Status': 'Pending', // Default status
        'Comments': '' // Empty for manual entry
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 6 },   // S.No
        { wch: 12 },  // Date
        { wch: 18 },  // Advisory ID
        { wch: 50 },  // Title
        { wch: 15 },  // Type
        { wch: 40 },  // Link
        { wch: 20 },  // Vendor/OEM
        { wch: 25 },  // Product
        { wch: 12 },  // Risk Level
        { wch: 12 },  // Status
        { wch: 30 }   // Comments
      ];
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const sheetName = `${monthNames[month - 1]} ${year} CISA Advisories`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      console.log('✅ Excel file generated successfully');
      return buffer;
      
    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw new Error(`Failed to generate Excel file: ${error.message}`);
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
   * Generate filename for the Excel file
   * @param {number} month - Month number
   * @param {number} year - Year
   * @returns {string} Filename
   */
  generateFilename(month, year) {
    const monthName = this.getMonthName(month);
    return `CISA_Advisories_${monthName}_${year}.xlsx`;
  }

  /**
   * Main method to scrape and generate Excel file
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Object} Result object with buffer and filename
   */
  async generateMonthlyReport(month, year) {
    try {
      // Validate inputs
      if (!month || month < 1 || month > 12) {
        throw new Error('Invalid month. Please provide a month between 1 and 12.');
      }
      
      if (!year || year < 2020 || year > new Date().getFullYear() + 1) {
        throw new Error('Invalid year. Please provide a valid year.');
      }
      
      console.log(`🚀 Starting CISA advisory report generation for ${this.getMonthName(month)} ${year}`);
      
      // Scrape advisories
      const advisories = await this.scrapeAdvisories(month, year);
      
      if (advisories.length === 0) {
        console.log(`⚠️ No advisories found for ${this.getMonthName(month)} ${year}`);
      }
      
      // Generate Excel file
      const buffer = await this.generateExcelFile(advisories, month, year);
      const filename = this.generateFilename(month, year);
      
      return {
        buffer,
        filename,
        count: advisories.length,
        month: this.getMonthName(month),
        year,
        advisories
      };
      
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }
}

module.exports = new CISAService();
