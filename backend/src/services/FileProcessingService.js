const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class FileProcessingService {
  // Process uploaded Excel or CSV file
  static async processSheetFile(filePath, fileExtension) {
    try {
      let data;
      
      if (fileExtension === '.csv') {
        data = await this.processCSV(filePath);
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        data = await this.processExcel(filePath);
      } else {
        throw new Error('Unsupported file format');
      }
      
      return {
        headers: data.headers,
        rows: data.rows,
        totalRows: data.rows.length,
        templateFields: this.extractTemplateFields(data.headers)
      };
    } catch (error) {
      throw new Error(`File processing failed: ${error.message}`);
    }
  }
  
  // Process CSV file
  static async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      let headers = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          resolve({ headers, rows: results });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  // Process Excel file
  static async processExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with raw values preserved
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false, // Convert dates and numbers to strings for consistency
        dateNF: 'yyyy-mm-dd' // Format dates consistently
      });
      
      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }
      
      // Clean up headers - remove extra spaces and normalize
      const rawHeaders = jsonData[0] || [];
      const headers = rawHeaders.map(header => {
        if (typeof header === 'string') {
          return header.trim().replace(/\s+/g, ' '); // Normalize whitespace
        }
        return header;
      }).filter(header => header && header !== ''); // Remove empty headers
      
      // Process data rows
      const rows = jsonData.slice(1)
        .filter(row => row && row.some(cell => cell !== undefined && cell !== '')) // Remove empty rows
        .map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            let value = row[index];
            
            // Handle different data types
            if (value !== undefined && value !== null) {
              // Convert to string and trim
              value = String(value).trim();
              
              // Handle Y/N values
              if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'y') {
                value = 'Y';
              } else if (value.toLowerCase() === 'no' || value.toLowerCase() === 'n') {
                value = 'N';
              }
              
              // Handle dates - convert Excel serial dates
              if (typeof row[index] === 'number' && header.toLowerCase().includes('date')) {
                try {
                  const excelDate = XLSX.SSF.parse_date_code(row[index]);
                  if (excelDate) {
                    value = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                  }
                } catch (e) {
                  // Keep original value if date parsing fails
                }
              }
            } else {
              value = '';
            }
            
            obj[header] = value;
          });
          return obj;
        });
      
      console.log(`Processed Excel file: ${headers.length} columns, ${rows.length} rows`);
      console.log('Headers found:', headers);
      
      return { headers, rows };
    } catch (error) {
      console.error('Excel processing error:', error);
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }
  
  // Extract template fields from headers for form generation
  static extractTemplateFields(headers) {
    return headers.map(header => {
      const fieldName = header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      
      // Determine field type based on header name
      let fieldType = 'text';
      let options = null;
      
      if (header.toLowerCase().includes('date')) {
        fieldType = 'date';
      } else if (header.toLowerCase().includes('email')) {
        fieldType = 'email';
      } else if (header.toLowerCase().includes('number') || header.toLowerCase().includes('cost') || header.toLowerCase().includes('price')) {
        fieldType = 'number';
      } else if (header.toLowerCase().includes('deployed_in_ke') || header.toLowerCase().includes('status')) {
        fieldType = 'select';
        if (header.toLowerCase().includes('deployed_in_ke')) {
          options = ['Yes', 'No'];
        } else if (header.toLowerCase().includes('status')) {
          options = ['Active', 'Inactive', 'Pending', 'Completed'];
        }
      } else if (header.toLowerCase().includes('description') || header.toLowerCase().includes('notes')) {
        fieldType = 'textarea';
      }
      
      return {
        name: fieldName,
        label: header,
        type: fieldType,
        required: !header.toLowerCase().includes('optional') && !header.toLowerCase().includes('notes'),
        options: options
      };
    });
  }
  
  // Validate sheet data structure
  static validateSheetStructure(data) {
    const errors = [];
    
    if (!data.headers || data.headers.length === 0) {
      errors.push('No headers found in the sheet');
    }
    
    if (!data.rows || data.rows.length === 0) {
      errors.push('No data rows found in the sheet');
    }
    
    // Check for required columns - be flexible with column names
    const requiredColumns = [
      { name: 'product_name', alternatives: ['product name', 'product', 'name'] },
      { name: 'vendor', alternatives: ['oem/vendor', 'vendor', 'oem', 'manufacturer'] }
    ];
    
    const lowerHeaders = data.headers.map(h => h.toLowerCase().trim());
    
    requiredColumns.forEach(col => {
      const hasColumn = lowerHeaders.some(h => 
        h.includes(col.name) || 
        col.alternatives.some(alt => h.includes(alt))
      );
      
      if (!hasColumn) {
        errors.push(`Missing required column: ${col.name} (or similar: ${col.alternatives.join(', ')})`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  // Generate sample data for testing
  static generateSampleData() {
    return [
      {
        product_name: 'Smart Grid System',
        location: 'Nairobi',
        deployed_in_ke: 'Yes',
        installation_date: '2025-07-10',
        status: 'Active',
        cost: '50000',
        vendor: 'ABC Technologies',
        notes: 'Successfully deployed and operational'
      },
      {
        product_name: 'Distribution Transformer',
        location: 'Mombasa',
        deployed_in_ke: 'Yes',
        installation_date: '2025-07-15',
        status: 'Pending',
        cost: '75000',
        vendor: 'XYZ Equipment',
        notes: 'Installation in progress'
      }
    ];
  }
}

module.exports = FileProcessingService;
