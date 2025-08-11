const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

class CISAService {
  constructor() {
    this.baseUrl = 'https://www.cisa.gov/news-events/cybersecurity-advisories';
    // Default to ICS Advisory filter
    this.advisoryTypeFilter = '?f%5B0%5D=advisory_type%3A95';
  }

  async fetchAdvisoryDetails(url) {
    if (!url) return {};
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });
    const $ = cheerio.load(response.data);

    // Vendor from Vendor section or list item
    let vendor = '';
    $('h2').each((_, h) => {
      const txt = $(h).text().trim().toLowerCase();
      if (!vendor && txt === 'vendor') {
        const li = $(h).nextAll('.l-page-section__content').first().find('li').first();
        if (li && li.length) vendor = li.text().trim();
      }
    });
    if (!vendor) {
      $('li').each((_, li) => {
        const text = $(li).text().trim();
        const m = text.match(/^Vendor\s*:\s*(.+)$/i);
        if (!vendor && m) vendor = m[1].trim();
      });
    }

    // Enhanced Product Name Extraction
    let productName = '';
    
    // Method 1: Look for Equipment in <li> tags with <strong>Equipment</strong> (original logic)
    $('li').each((_, li) => {
      const html = $(li).html() || '';
      if (!productName && /<strong>\s*Equipment\s*<\/strong>\s*:/i.test(html)) {
        const m = $(li).text().trim().match(/^Equipment\s*:\s*(.+)$/i);
        if (m) productName = m[1].trim();
      }
    });
    
    // Method 2: Look for other product-related patterns in various HTML elements
    if (!productName) {
      const productKeywords = ['product', 'equipment', 'system', 'device', 'software', 'hardware', 'platform'];
      const productPatterns = [
        /(?:product|equipment|system|device|software|hardware|platform)\s*:?\s*([^.\n\r]+)/i,
        /(?:product|equipment|system|device|software|hardware|platform)\s+name\s*:?\s*([^.\n\r]+)/i,
        /(?:product|equipment|system|device|software|hardware|platform)\s+information\s*:?\s*([^.\n\r]+)/i
      ];
      
      $('p, li, div, h1, h2, h3, h4, h5, h6').each((_, element) => {
        if (productName) return; // Stop if we found a product name
        
        const text = $(element).text().trim();
        
        // Check for product keywords in the text
        const hasProductKeyword = productKeywords.some(keyword => 
          text.toLowerCase().includes(keyword)
        );
        
        if (hasProductKeyword) {
          // Try to extract product name using patterns
          for (const pattern of productPatterns) {
            const match = text.match(pattern);
            if (match && match[1].trim().length > 2) {
              const extracted = match[1].trim();
              // Filter out common non-product text
              if (!extracted.toLowerCase().includes('advisory') && 
                  !extracted.toLowerCase().includes('vulnerability') &&
                  !extracted.toLowerCase().includes('security') &&
                  extracted.length < 200) { // Reasonable length for product name
                productName = extracted;
                break;
              }
            }
          }
        }
      });
    }
    
    // Method 3: Look for product information in tables
    if (!productName) {
      $('table').each((_, table) => {
        if (productName) return; // Stop if we found a product name
        
        const $table = $(table);
        const rows = $table.find('tr');
        
        // Look for product-related headers
        rows.each((_, row) => {
          if (productName) return;
          
          const $row = $(row);
          const cells = $row.find('td, th');
          
          cells.each((cellIndex, cell) => {
            if (productName) return;
            
            const cellText = $(cell).text().trim().toLowerCase();
            if (cellText.includes('product') || cellText.includes('equipment') || 
                cellText.includes('system') || cellText.includes('device')) {
              
              // Look for product name in adjacent cells
              const nextCell = cells.eq(cellIndex + 1);
              if (nextCell.length) {
                const nextCellText = nextCell.text().trim();
                if (nextCellText.length > 2 && nextCellText.length < 200) {
                  productName = nextCellText;
                }
              }
            }
          });
        });
      });
    }
    
    // Method 4: Extract from advisory title if it contains product information
    if (!productName) {
      const title = $('h1, .page-title, .advisory-title').first().text().trim();
      if (title) {
        // Look for product names in title (often in parentheses or after specific patterns)
        const titlePatterns = [
          /\(([^)]+)\)/, // Text in parentheses
          /for\s+([^,\n]+)/i, // "for Product Name"
          /affecting\s+([^,\n]+)/i, // "affecting Product Name"
          /in\s+([^,\n]+)/i // "in Product Name"
        ];
        
        for (const pattern of titlePatterns) {
          const match = title.match(pattern);
          if (match && match[1].trim().length > 2 && match[1].trim().length < 100) {
            const extracted = match[1].trim();
            // Filter out common non-product text
            if (!extracted.toLowerCase().includes('advisory') && 
                !extracted.toLowerCase().includes('vulnerability') &&
                !extracted.toLowerCase().includes('security') &&
                !extracted.toLowerCase().includes('update')) {
              productName = extracted;
              break;
            }
          }
        }
      }
    }

    // CVEs anywhere on the page
    const cves = new Set();
    $('a').each((_, a) => {
      const t = $(a).text().trim();
      const matches = t.match(/CVE-\d{4}-\d{4,7}/gi);
      if (matches) matches.forEach(v => cves.add(v.toUpperCase()));
    });
    $('p, li').each((_, el) => {
      const t = $(el).text();
      const matches = t.match(/CVE-\d{4}-\d{4,7}/gi);
      if (matches) matches.forEach(v => cves.add(v.toUpperCase()));
    });

    // CVSS score detection and risk
    let maxScore = null;
    const scoreRegexes = [
      /CVSS\s*v?\d(?:\.\d)?\s*(?:base\s*score\s*of\s*)?(\d+(?:\.\d)?)/i,
      /Base\s*Score\s*:?\s*(\d+(?:\.\d)?)/i
    ];
    $('p, li').each((_, el) => {
      const t = $(el).text();
      for (const rx of scoreRegexes) {
        const m = t.match(rx);
        if (m) {
          const val = parseFloat(m[1]);
          if (!isNaN(val)) maxScore = Math.max(maxScore ?? 0, val);
        }
      }
    });

    const riskLevel = this.calculateRiskLevel(maxScore);
    
    // Log product name extraction results for debugging
    if (productName) {
      console.log(`✅ Extracted product name: "${productName}"`);
    } else {
      console.log(`⚠️ No product name extracted from advisory page`);
    }
    
    return { vendor, productName, cves: Array.from(cves), cvss: maxScore, riskLevel };
  }

  calculateRiskLevel(score) {
    if (score == null || isNaN(score)) return '';
    if (score >= 9.0) return 'Critical';
    if (score >= 7.0) return 'High';
    if (score >= 4.0) return 'Medium';
    return 'Low';
  }

  /**
   * Scrape CISA advisories for a specific month and year
   * @param {number} month - Month (1-12)
   * @param {number} year - Year (e.g., 2025)
   * @returns {Array} Array of advisory objects
   */
  async scrapeAdvisories(month, year, options = { useFilter: true }) {
    try {
      console.log(`🔍 Scraping CISA advisories for ${month}/${year}...`);
      
      const advisories = [];
      let page = 0;
      let hasMorePages = true;
      const useFilter = options && options.useFilter !== false;
      
      // Define target month window for early-stop logic
      const targetStart = new Date(Date.UTC(year, month - 1, 1));
      const targetEnd = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));

      while (hasMorePages) {
        const url = useFilter
          ? `${this.baseUrl}${this.advisoryTypeFilter}&page=${page}`
          : `${this.baseUrl}?page=${page}`;
        console.log(`📄 Fetching page ${page + 1}: ${url}`);

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 30000
        });

        const $ = cheerio.load(response.data);
        const pageAdvisories = [];

        const teasersOnPage = $('.c-teaser').length;
        if (teasersOnPage === 0) {
          // No more items available on the site for this listing
          console.log('ℹ️ No teasers found on page; stopping pagination');
          break;
        }

        // Find all advisory articles
        const pageDates = [];
        $('.c-teaser').each((index, element) => {
          try {
            const $teaser = $(element);
            
            // Extract date
            const timeEl = $teaser.find('.c-teaser__date time');
            const datetimeAttr = timeEl.attr('datetime');
            const textDate = timeEl.text().trim();

            if (!datetimeAttr && !textDate) return;

            let advisoryDate = null;
            let advisoryMonth = null;
            let advisoryYear = null;

            if (datetimeAttr) {
              const d = new Date(datetimeAttr);
              if (!isNaN(d.getTime())) {
                advisoryDate = d;
                advisoryMonth = d.getUTCMonth() + 1;
                advisoryYear = d.getUTCFullYear();
              }
            }

            // Fallback to parsing visible text like "Jul 01, 2025"
            if ((!advisoryDate || advisoryMonth === null || advisoryYear === null) && textDate) {
              const match = textDate.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{4})$/);
              const monthMap = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
              if (match) {
                const mon = monthMap[match[1]];
                const day = parseInt(match[2], 10);
                const yr = parseInt(match[3], 10);
                if (mon && day && yr) {
                  advisoryMonth = mon;
                  advisoryYear = yr;
                  // Construct UTC date to avoid TZ shifts
                  advisoryDate = new Date(Date.UTC(yr, mon - 1, day));
                }
              } else {
                // Last resort: let Date parse, but use UTC parts
                const d = new Date(textDate);
                if (!isNaN(d.getTime())) {
                  advisoryDate = d;
                  advisoryMonth = d.getUTCMonth() + 1;
                  advisoryYear = d.getUTCFullYear();
                }
              }
            }

            if (!advisoryDate) return;

            pageDates.push(advisoryDate);
            
            // Only include advisories from the specified month and year
            if (advisoryMonth !== month || advisoryYear !== year) {
              return;
            }
            
            // Extract advisory ID (robust across markup changes)
            const metaText = $teaser.find('.c-teaser__meta').text().trim();
            let advisoryId = metaText.includes('|') ? metaText.split('|')[1].trim() : metaText;

            // Extract title and link
            const titleElement = $teaser.find('.c-teaser__title a');
            const title = titleElement.find('span').text().trim() || titleElement.text().trim();
            const relativeLink = titleElement.attr('href');
            const fullLink = relativeLink ? `https://www.cisa.gov${relativeLink}` : '';
            
            // Extract advisory type
            const advisoryType = metaText.includes('|') ? 
              metaText.split('|')[0].trim() : 
              'ICS Advisory';

            // Fallbacks for missing advisoryId
            if (!advisoryId || advisoryId.length < 3) {
              if (relativeLink) {
                const lastSegment = relativeLink.split('/').filter(Boolean).pop() || '';
                const cleaned = lastSegment.replace(/\.(html?)$/i, '').toUpperCase();
                if (cleaned) advisoryId = cleaned;
              }
            }
            if (!advisoryId || advisoryId.length < 3) {
              // Try extracting known patterns from title, e.g., ICSA-25-XYZ, AA23-xxx
              const idMatch = title && title.match(/\b(?:ICSA|AA|CSA)[-\s]?\d{2}[-\w]+/i);
              if (idMatch) advisoryId = idMatch[0].toUpperCase();
            }
            
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

        // Determine if we can stop based on page date range relative to target month
        if (pageDates.length > 0) {
          const maxDate = new Date(Math.max(...pageDates.map(d => d.getTime())));
          const minDate = new Date(Math.min(...pageDates.map(d => d.getTime())));
          // If the newest item on this page is older than the target start, we've passed the month
          if (maxDate < targetStart) {
            console.log('🛑 Newest item on page is before target month; stopping pagination');
            break;
          }
          // If the oldest item is still newer than or equal to targetEnd, we haven't reached the month yet; continue
        }

        page++;
        // Add delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 700));

        // Safety limit to prevent infinite loops
        if (page > 400) {
          console.log('⚠️ Reached page limit, stopping...');
          hasMorePages = false;
        }
      }
      
      console.log(`📊 Found ${advisories.length} advisories for ${month}/${year}${useFilter ? ' (filtered ICS)' : ''}`);

      // Enrich each advisory with details from its page (vendor, product/equipment, CVEs, CVSS/risk)
      for (let i = 0; i < advisories.length; i++) {
        try {
          const details = await this.fetchAdvisoryDetails(advisories[i].link);
          advisories[i] = { ...advisories[i], ...details };
        } catch (e) {
          console.warn(`⚠️ Failed to enrich advisory ${advisories[i].advisoryId}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 250));
      }

      if (advisories.length === 0 && useFilter) {
        console.log('↩️ No results with ICS filter; retrying unfiltered to ensure coverage...');
        return await this.scrapeAdvisories(month, year, { useFilter: false });
      }
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

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Define header rows matching client's template
      const headerTop = [
        'OEM/Vendor',
        'Source',
        'Product Name',
        'Risk Level',
        'CVE',
        'Product Deployed in KE?', // spans next two columns
        '',
        'Vendor Contacted', // spans next two columns
        '',
        'Patching', // spans next two columns
        '',
        'Compensatory Controls Provided', // spans next two columns
        '',
        'Comments',
        'Status'
      ];

      const headerBottom = [
        'OEM/Vendor',
        'Source',
        'Product Name',
        'Risk Level',
        'CVE',
        'Y/N',
        'Site',
        'Y/N',
        'Date',
        'Est. Release Date',
        'Implementation Time',
        'Y/N',
        'Est. Time',
        'Comments',
        'Status'
      ];

      // Build data rows in the exact order
      const dataRows = advisories.map(a => ([
        a.vendor || '',
        'CISA',
        a.productName || '',
        a.riskLevel || '',
        (a.cves && a.cves.length) ? a.cves.join(', ') : '',
        'N',
        '',
        'N',
        '',
        '',
        '',
        'N',
        '',
        'Product not deployed',
        'N/A'
      ]));

      // Assemble sheet using arrays-of-arrays for precise layout
      const aoa = [headerTop, headerBottom, ...dataRows];
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);

      // Define merges to create grouped headers
      worksheet['!merges'] = [
        // Freeze first row labels across two rows where needed
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // OEM/Vendor
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Source
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Product Name
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Risk Level
        { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // CVE
        { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }, // Product Deployed in KE? (Y/N, Site)
        { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } }, // Vendor Contacted (Y/N, Date)
        { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // Patching (Est. Release Date, Implementation Time)
        { s: { r: 0, c: 11 }, e: { r: 0, c: 12 } }, // Compensatory Controls Provided (Y/N, Est. Time)
        { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } }, // Comments
        { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } }, // Status
      ];

      // Column widths tuned for template
      worksheet['!cols'] = [
        { wch: 18 }, // OEM/Vendor
        { wch: 10 }, // Source
        { wch: 28 }, // Product Name
        { wch: 10 }, // Risk Level
        { wch: 20 }, // CVE
        { wch: 6 },  // Deployed Y/N
        { wch: 10 }, // Site
        { wch: 6 },  // Vendor Contacted Y/N
        { wch: 12 }, // Vendor Contacted Date
        { wch: 16 }, // Est. Release Date
        { wch: 18 }, // Implementation Time
        { wch: 6 },  // Controls Y/N
        { wch: 12 }, // Controls Est. Time
        { wch: 30 }, // Comments
        { wch: 10 }, // Status
      ];

      // Add hyperlinks for Source cells to point to the advisory link
      for (let i = 0; i < advisories.length; i++) {
        const rowIndex = 2 + i; // data starts at third row (0-based indexing)
        const cellAddr = XLSX.utils.encode_cell({ r: rowIndex, c: 1 }); // column B (Source)
        const existing = worksheet[cellAddr] || { t: 's', v: 'CISA' };
        existing.l = { Target: advisories[i].link || '', Tooltip: advisories[i].title || 'View advisory' };
        existing.v = 'CISA';
        worksheet[cellAddr] = existing;
        // Note: CVEs are already included in the data rows from fetchAdvisoryDetails
        // No need to extract from title as we have proper CVE extraction
      }

      // Sheet name
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const sheetName = `${monthNames[month - 1]} ${year} CISA Advisories`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log('✅ Excel file generated in template format successfully');
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
   * Generate a monthly CISA advisory report
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year
   * @returns {object} Object containing buffer, filename, and count
   */
  async generateMonthlyReport(month, year) {
    try {
      console.log(`📊 Generating CISA advisory report for ${this.getMonthName(month)} ${year}`);
      
      const advisories = await this.scrapeAdvisories(month, year);
      
      if (advisories.length === 0) {
        throw new Error(`No advisories found for ${this.getMonthName(month)} ${year}`);
      }
      
      const buffer = await this.generateExcelFile(advisories, month, year);
      const filename = this.generateFilename(month, year);
      
      console.log(`✅ Generated report: ${filename} (${advisories.length} advisories)`);
      return {
        buffer,
        filename,
        count: advisories.length
      };
      
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }
}

module.exports = new CISAService();
