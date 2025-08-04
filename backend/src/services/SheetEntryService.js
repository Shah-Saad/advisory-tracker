const db = require('../config/db');
const NotificationService = require('./NotificationService');

class SheetEntryService {
  
  // Save entries from processed file data to database
  static async saveSheetEntries(sheetId, processedData) {
    try {
      const entries = [];
      
      // Column mapping from Excel headers to database columns
      const columnMapping = {
        // Basic product information
        'Product Name': 'product_name',
        'Product Category': 'product_category', 
        'Vendor Name': 'vendor_name',
        'OEM/Vendor': 'oem_vendor',
        'Source': 'source',
        
        // Location and deployment
        'Installation Location': 'location',
        'Site': 'location', // Alternative header for location
        'Distribution Site': 'distribution_site',
        'Deployment Status': 'status',
        'Status': 'current_status', // Final status column
        'Deployed in KE?': 'deployed_in_ke',
        'Product Deployed in KE?': 'deployed_in_ke',
        'Y/N': 'deployed_in_ke', // Short form header
        
        // Risk and security
        'Risk Level': 'risk_level',
        'CVE': 'cve',
        
        // Dates
        'Date Installed': 'date',
        'Date': 'vendor_contact_date',
        'Patching Est. Release Date': 'patching_est_release_date',
        'Implementation Date': 'implementation_date',
        'Implementation Time': 'implementation_date', // Alternative header
        'Resolution Date': 'resolution_date',
        'Testing Date': 'testing_date',
        'Approval Date': 'approval_date',
        'Compliance Deadline': 'compliance_deadline',
        
        // Vendor interaction
        'Vendor Contacted': 'vendor_contacted',
        'Vendor Contacted (Y/N)': 'vendor_contacted',
        
        // Controls and mitigation
        'Compensatory Controls Provided': 'compensatory_controls_provided',
        'Compensatory Controls Provided (Y/N)': 'compensatory_controls_provided',
        'Compensatory Controls Details': 'compensatory_controls_details',
        'Mitigation Steps': 'mitigation_steps',
        
        // Time and comments
        'Est.Time': 'estimated_time',
        'Estimated Time': 'estimated_time',
        'Comments': 'comments',
        'Notes': 'notes',
        'Budget Allocated': 'budget_allocated',
        
        // Technical details
        'Technical Specifications': 'technical_specs',
        'Maintenance Schedule': 'maintenance_schedule',
        'Est. Time': 'estimated_time',
        'Estimated Time': 'estimated_time',
        'Affected Systems': 'affected_systems',
        
        // Status and tracking
        'Status': 'current_status',
        'Current Status': 'current_status',
        'Priority Level': 'priority_level',
        'Resolution Status': 'resolution_status',
        'Approval Status': 'approval_status',
        'Approved By': 'approved_by',
        
        // Comments and notes
        'Comments': 'comments',
        'Notes': 'notes',
        'Testing Results': 'testing_results',
        
        // Compliance
        'Compliance Required': 'compliance_required',
        'Compliance Framework': 'compliance_framework',
        'Testing Completed': 'testing_completed'
      };
      
      // Convert processed data to database entries
      console.log('Processing rows for database insertion...');
      
      for (const [index, row] of processedData.rows.entries()) {
        try {
          // Skip rows that look like headers or contain placeholder values
          const rowValues = typeof row === 'object' && !Array.isArray(row) 
            ? Object.values(row) 
            : row;
          
          // Check if this row contains header-like values
          const hasHeaderValues = rowValues.some(value => {
            if (!value) return false;
            const strValue = String(value).trim().toLowerCase();
            return strValue === 'y/n' || 
                   strValue === 'oem/vendor' || 
                   strValue === 'product name' ||
                   strValue === 'risk level' ||
                   strValue === 'cve' ||
                   strValue === 'source' ||
                   strValue === 'vendor contacted';
          });
          
          if (hasHeaderValues) {
            console.log(`Skipping row ${index + 1} - appears to be header row`);
            continue;
          }
          
          const entry = {
            sheet_id: sheetId,
            created_at: new Date(),
            updated_at: new Date()
          };
          
          // Handle both object and array format with column mapping
          if (typeof row === 'object' && !Array.isArray(row)) {
            // Row is already an object - apply column mapping
            Object.keys(row).forEach(key => {
              const dbColumn = columnMapping[key];
              if (dbColumn && row[key] !== null && row[key] !== undefined && row[key] !== '') {
                let value = String(row[key]).trim();
                
                // Handle specific data transformations
                if (dbColumn.includes('date') && value) {
                  // Ensure date format is correct
                  if (value.includes('/')) {
                    // Convert MM/DD/YYYY to YYYY-MM-DD
                    const parts = value.split('/');
                    if (parts.length === 3) {
                      value = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                    }
                  }
                }
                
                // Handle boolean-like values
                if (dbColumn === 'deployed_in_ke' || dbColumn === 'vendor_contacted' || dbColumn === 'compensatory_controls_provided') {
                  if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'y' || value === '1') {
                    value = 'Y';
                  } else if (value.toLowerCase() === 'no' || value.toLowerCase() === 'n' || value === '0') {
                    value = 'N';
                  } else if (value.toLowerCase() === 'y/n' || value.toLowerCase() === 'n/a' || value.toLowerCase() === 'na') {
                    // Skip placeholder values
                    value = null;
                  } else {
                    // If it's not a recognized Y/N value, set to null
                    value = null;
                  }
                }
                
                // Only set the value if it's not null after processing
                if (value !== null) {
                  entry[dbColumn] = value;
                }
              }
            });
          } else {
            // Row is an array
            processedData.headers.forEach((header, colIndex) => {
              const dbColumn = columnMapping[header];
              if (dbColumn && row[colIndex] !== null && row[colIndex] !== undefined && row[colIndex] !== '') {
                let value = String(row[colIndex]).trim();
                
                // Apply same transformations as above
                if (dbColumn.includes('date') && value) {
                  if (value.includes('/')) {
                    const parts = value.split('/');
                    if (parts.length === 3) {
                      value = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                    }
                  }
                }
                
                if (dbColumn === 'deployed_in_ke' || dbColumn === 'vendor_contacted' || dbColumn === 'compensatory_controls_provided') {
                  if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'y' || value === '1') {
                    value = 'Y';
                  } else if (value.toLowerCase() === 'no' || value.toLowerCase() === 'n' || value === '0') {
                    value = 'N';
                  } else if (value.toLowerCase() === 'y/n' || value.toLowerCase() === 'n/a' || value.toLowerCase() === 'na') {
                    // Skip placeholder values
                    value = null;
                  } else {
                    // If it's not a recognized Y/N value, set to null
                    value = null;
                  }
                }
                
                // Only set the value if it's not null after processing
                if (value !== null) {
                  entry[dbColumn] = value;
                }
              }
            });
          }

          // Try to match product and vendor based on product name
          if (entry.product_name) {
            try {
              const product = await this.findMatchingProduct(entry.product_name);
              if (product) {
                entry.product_id = product.id;
                entry.vendor_id = product.vendor_id;
              }
            } catch (productError) {
              console.warn(`Could not match product for row ${index + 1}:`, productError.message);
            }
          }

          // Ensure we have some minimal data before saving
          if (entry.product_name || entry.oem_vendor || entry.source) {
            entries.push(entry);
          } else {
            console.warn(`Skipping row ${index + 1} - insufficient data`);
          }
        } catch (rowError) {
          console.error(`Error processing row ${index + 1}:`, rowError);
          // Continue processing other rows
        }
      }
      
      // Batch insert all entries
      const insertedEntries = await db('sheet_entries').insert(entries).returning('*');
      
      return {
        success: true,
        count: insertedEntries.length,
        entries: insertedEntries
      };
      
    } catch (error) {
      console.error('Error saving sheet entries:', error);
      throw new Error(`Failed to save sheet entries: ${error.message}`);
    }
  }

  /**
   * Distribute existing sheet entries to multiple teams
   * Creates copies of existing entries for each team
   * @param {number} sheetId - Sheet ID to distribute
   * @param {number} distributedBy - User ID who is distributing
   * @param {Array} teams - Teams to distribute to
   * @returns {Object} Distribution results
   */
  static async distributeSheetToTeams(sheetId, distributedBy, teams = ['generation', 'distribution', 'transmission']) {
    try {
      console.log(`Distributing sheet ${sheetId} to teams:`, teams);
      
      // Get existing entries for this sheet
      const existingEntries = await db('sheet_entries')
        .where('sheet_id', sheetId)
        .whereNull('assigned_team'); // Only get entries not yet assigned to teams
      
      if (existingEntries.length === 0) {
        throw new Error('No entries found for this sheet or all entries are already assigned to teams');
      }
      
      console.log(`Found ${existingEntries.length} entries to distribute`);
      
      const distributionResults = [];
      
      for (const team of teams) {
        console.log(`Creating entries for team: ${team}`);
        
        // Create copies of entries for this team
        const teamEntries = existingEntries.map(entry => {
          const { id, assigned_team, created_at, updated_at, ...entryData } = entry;
          return {
            ...entryData,
            assigned_team: team,
            created_at: new Date(),
            updated_at: new Date()
          };
        });
        
        const insertedEntries = await db('sheet_entries')
          .insert(teamEntries)
          .returning('*');
        
        distributionResults.push({
          team,
          entriesCreated: insertedEntries.length,
          entries: insertedEntries
        });
        
        console.log(`Created ${insertedEntries.length} entries for ${team} team`);
      }
      
      // Update the sheet to mark it as distributed
      await db('sheets')
        .where('id', sheetId)
        .update({
          distributed_to_teams: JSON.stringify(teams),
          updated_at: new Date()
        });
      
      console.log(`Successfully distributed sheet ${sheetId} to ${teams.length} teams`);
      
      return {
        success: true,
        sheetId,
        teamsCount: teams.length,
        totalEntriesCreated: distributionResults.reduce((sum, result) => sum + result.entriesCreated, 0),
        distributionResults
      };
      
    } catch (error) {
      console.error('Error distributing sheet to teams:', error);
      throw new Error(`Failed to distribute sheet to teams: ${error.message}`);
    }
  }

  /**
   * Distribute new sheet data to multiple teams
   * Creates entries from processed data for each team
   */
  static async distributeNewSheetToTeams(sheetId, processedData, teams = ['generation', 'distribution', 'transmission']) {
    try {
      console.log(`Distributing new sheet ${sheetId} to teams:`, teams);
      
      const distributionResults = [];
      
      for (const team of teams) {
        console.log(`Creating entries for team: ${team}`);
        
        // Process data for this specific team
        const teamEntries = [];
        
        for (const [index, row] of processedData.rows.entries()) {
          try {
            // Create entry object for this team
            const entry = {
              sheet_id: sheetId,
              assigned_team: team,
              created_at: new Date(),
              updated_at: new Date()
            };

            // Apply column mapping (same as in saveSheetEntries)
            for (const [excelColumn, dbColumn] of Object.entries(this.getColumnMapping())) {
              if (row.hasOwnProperty(excelColumn) && row[excelColumn] !== null && row[excelColumn] !== undefined && row[excelColumn] !== '') {
                let value = row[excelColumn];
                
                // Handle dates
                if (dbColumn.includes('date') && value) {
                  try {
                    if (typeof value === 'number') {
                      const excelEpoch = new Date(1900, 0, 1);
                      const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
                      value = date.toISOString().split('T')[0];
                    } else if (typeof value === 'string') {
                      const parsedDate = new Date(value);
                      if (!isNaN(parsedDate.getTime())) {
                        value = parsedDate.toISOString().split('T')[0];
                      }
                    }
                  } catch (dateError) {
                    console.warn(`Date parsing error for ${dbColumn}:`, dateError);
                  }
                }
                
                entry[dbColumn] = value;
              }
            }

            // Try to match product and vendor
            if (entry.product_name) {
              try {
                const product = await this.findMatchingProduct(entry.product_name);
                if (product) {
                  entry.product_id = product.id;
                  entry.vendor_id = product.vendor_id;
                }
              } catch (productError) {
                console.warn(`Could not match product for ${team} team row ${index + 1}:`, productError.message);
              }
            }

            // Ensure we have minimal data
            if (entry.product_name || entry.oem_vendor || entry.source) {
              teamEntries.push(entry);
            }
          } catch (rowError) {
            console.error(`Error processing row ${index + 1} for team ${team}:`, rowError);
          }
        }
        
        // Insert entries for this team
        if (teamEntries.length > 0) {
          const insertedEntries = await db('sheet_entries').insert(teamEntries).returning('*');
          
          distributionResults.push({
            team: team,
            count: insertedEntries.length,
            entries: insertedEntries
          });
          
          console.log(`Successfully created ${insertedEntries.length} entries for ${team} team`);
        }
      }

      // Update sheet to mark as distributed
      await db('sheets')
        .where('id', sheetId)
        .update({
          distributed_to_teams: JSON.stringify(teams),
          updated_at: new Date()
        });

      return {
        success: true,
        distributedTeams: teams,
        results: distributionResults,
        totalEntries: distributionResults.reduce((sum, result) => sum + result.count, 0)
      };
      
    } catch (error) {
      console.error('Error distributing sheet to teams:', error);
      throw new Error(`Failed to distribute sheet to teams: ${error.message}`);
    }
  }

  /**
   * Get column mapping for consistent processing
   */
  static getColumnMapping() {
    return {
      // Basic product information
      'Product Name': 'product_name',
      'Product Category': 'product_category', 
      'Vendor Name': 'vendor_name',
      'OEM/Vendor': 'oem_vendor',
      'Source': 'source',
      
      // Location and deployment
      'Installation Location': 'location',
      'Site': 'location',
      'Distribution Site': 'distribution_site',
      'Deployment Status': 'status',
      'Status': 'current_status',
      'Deployed in KE?': 'deployed_in_ke',
      'Product Deployed in KE?': 'deployed_in_ke',
      'Y/N': 'deployed_in_ke',
      
      // Risk and security
      'Risk Level': 'risk_level',
      'CVE': 'cve',
      
      // Dates
      'Date Installed': 'date',
      'Date': 'vendor_contact_date',
      'Patching Est. Release Date': 'patching_est_release_date',
      'Implementation Date': 'implementation_date',
      'Implementation Time': 'implementation_date',
      'Resolution Date': 'resolution_date',
      'Testing Date': 'testing_date',
      'Approval Date': 'approval_date',
      'Compliance Deadline': 'compliance_deadline',
      
      // Vendor interaction
      'Vendor Contacted': 'vendor_contacted',
      'Vendor Contacted (Y/N)': 'vendor_contacted',
      
      // Controls and mitigation
      'Compensatory Controls Provided': 'compensatory_controls_provided',
      'Compensatory Controls Provided (Y/N)': 'compensatory_controls_provided',
      'Compensatory Controls Details': 'compensatory_controls_details',
      'Mitigation Steps': 'mitigation_steps',
      
      // Time and comments
      'Est.Time': 'estimated_time',
      'Estimated Time': 'estimated_time',
      'Comments': 'comments',
      'Notes': 'notes',
      'Budget Allocated': 'budget_allocated',
      
      // Technical details
      'Technical Specifications': 'technical_specs',
      'Maintenance Schedule': 'maintenance_schedule',
      'Affected Systems': 'affected_systems',
      
      // Status and tracking
      'Priority Level': 'priority_level',
      'Resolution Status': 'resolution_status',
      'Approval Status': 'approval_status',
      'Approved By': 'approved_by',
      'Testing Results': 'testing_results',
      
      // Compliance
      'Compliance Required': 'compliance_required',
      'Compliance Framework': 'compliance_framework',
      'Testing Completed': 'testing_completed'
    };
  }
  
  // Get all entries for a specific sheet
  static async getSheetEntries(sheetId) {
    try {
      const entries = await db('sheet_entries')
        .where('sheet_id', sheetId)
        .orderBy('id', 'asc');
      
      return entries;
    } catch (error) {
      throw new Error(`Failed to get sheet entries: ${error.message}`);
    }
  }
  
  // Get all entries from all sheets
  static async getAllEntries() {
    try {
      const entries = await db('sheet_entries')
        .join('sheets', 'sheet_entries.sheet_id', 'sheets.id')
        .select(
          'sheet_entries.*',
          'sheets.title as sheet_title',
          'sheets.month_year as sheet_month',
          'sheets.file_name as sheet_file'
        )
        .orderBy(['sheets.month_year', 'sheet_entries.id']);
      
      return entries;
    } catch (error) {
      throw new Error(`Failed to get all entries: ${error.message}`);
    }
  }

  // Get single entry by ID with detailed information
  static async getEntryById(id) {
    try {
      const entry = await db('sheet_entries')
        .join('sheets', 'sheet_entries.sheet_id', 'sheets.id')
        .select(
          'sheet_entries.*',
          'sheets.title as sheet_title',
          'sheets.month_year as sheet_month',
          'sheets.file_name as sheet_file',
          'sheets.created_at as sheet_created_at'
        )
        .where('sheet_entries.id', id)
        .first();
      
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      return entry;
    } catch (error) {
      throw new Error(`Failed to get entry: ${error.message}`);
    }
  }
  
  // Filter entries by criteria
  static async filterEntries(filters = {}) {
    try {
      let query = db('sheet_entries')
        .join('sheets', 'sheet_entries.sheet_id', 'sheets.id')
        .select(
          'sheet_entries.*',
          'sheets.title as sheet_title',
          'sheets.month_year as sheet_month',
          'sheets.file_name as sheet_file'
        );
      
      // Apply filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          if (key === 'month' || key === 'year') {
            // Handle month/year filtering using the sheets.month_year date column
            if (key === 'month') {
              const monthNumber = this.getMonthNumber(filters[key]);
              if (monthNumber) {
                query = query.whereRaw('EXTRACT(MONTH FROM sheets.month_year) = ?', [monthNumber]);
              }
            } else if (key === 'year') {
              query = query.whereRaw('EXTRACT(YEAR FROM sheets.month_year) = ?', [parseInt(filters[key])]);
            }
          } else if (key === 'sheet_id' || key === 'sheet_title') {
            // Handle sheet-level filters
            query = query.where(`sheets.${key.replace('sheet_', '')}`, filters[key]);
          } else {
            // Handle entry-level filters - check if column exists
            const entryLevelColumns = [
              'product_name', 'location', 'status', 'deployed_in_ke', 'team', 'date', 'notes',
              'oem_vendor', 'source', 'risk_level', 'cve', 'vendor_contacted', 
              'compensatory_controls_provided', 'patching', 'current_status', 'priority_level',
              'assigned_team'
            ];
            
            if (entryLevelColumns.includes(key)) {
              query = query.where(`sheet_entries.${key}`, filters[key]);
            }
          }
        }
      });
      
      const entries = await query.orderBy(['sheets.month_year', 'sheet_entries.id']);
      
      return entries;
    } catch (error) {
      throw new Error(`Failed to filter entries: ${error.message}`);
    }
  }

  // Helper method to convert month name to number
  static getMonthNumber(monthName) {
    const months = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
      'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    return months[monthName.toLowerCase()];
  }
  
  // Delete all entries for a sheet
  static async deleteSheetEntries(sheetId) {
    try {
      const deletedCount = await db('sheet_entries')
        .where('sheet_id', sheetId)
        .del();
      
      return deletedCount;
    } catch (error) {
      throw new Error(`Failed to delete sheet entries: ${error.message}`);
    }
  }
  
  // Get entry statistics
  static async getEntryStats() {
    try {
      const stats = await db('sheet_entries')
        .join('sheets', 'sheet_entries.sheet_id', 'sheets.id')
        .select(
          db.raw('COUNT(*) as total_entries'),
          db.raw('COUNT(DISTINCT sheet_entries.sheet_id) as total_sheets'),
          db.raw('SUM(CASE WHEN sheet_entries.deployed_in_ke = ? THEN 1 ELSE 0 END) as deployed_yes', ['Yes']),
          db.raw('SUM(CASE WHEN sheet_entries.deployed_in_ke = ? THEN 1 ELSE 0 END) as deployed_no', ['No']),
          db.raw('SUM(CASE WHEN sheet_entries.status = ? THEN 1 ELSE 0 END) as status_completed', ['Completed']),
          db.raw('SUM(CASE WHEN sheet_entries.status = ? THEN 1 ELSE 0 END) as status_in_progress', ['In Progress'])
        )
        .first();
      
      return stats;
    } catch (error) {
      throw new Error(`Failed to get entry statistics: ${error.message}`);
    }
  }

  /**
   * Update a specific sheet entry
   * @param {number} id - Entry ID
   * @param {Object} updateData - Data to update
   * @param {Object} user - User making the update (for notifications)
   * @returns {Object} Updated entry
   */
  static async updateEntry(id, updateData, user = null) {
    try {
      const allowedFields = [
        'product_name', 
        'location', 
        'status', 
        'current_status',
        'deployed_in_ke', 
        'team', 
        'date', 
        'notes',
        'comments',
        'patching',
        'patching_est_release_date',
        'implementation_date',
        'vendor_contacted',
        'compensatory_controls_provided',
        'compensatory_controls_details',
        'site',
        'vendor_contact_date',
        'estimated_time',
        'estimated_completion_date',
        'risk_level'
      ];

      // Filter update data to only allowed fields
      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          let value = updateData[key];
          
          // Handle date fields - convert empty strings to null
          const dateFields = [
            'date', 
            'patching_est_release_date', 
            'implementation_date', 
            'vendor_contact_date',
            'estimated_completion_date'
          ];
          
          if (dateFields.includes(key)) {
            // Convert empty strings to null for date fields
            if (value === '' || value === undefined || value === null) {
              value = null;
            }
          }
          
          filteredData[key] = value;
        }
      });

      // Add updated timestamp
      filteredData.updated_at = new Date();

      const [updatedEntry] = await db('sheet_entries')
        .where('id', id)
        .update(filteredData)
        .returning('*');

      if (!updatedEntry) {
        throw new Error('Entry not found or could not be updated');
      }

      console.log(`Updated entry ${id} with data:`, filteredData);

      // Send notification to admins if user is provided and not an admin
      if (user && user.role !== 'admin' && updatedEntry) {
        try {
          await NotificationService.handleEntryUpdate(updatedEntry, user);
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Don't fail the update if notification fails
        }
      }

      return updatedEntry;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw new Error('Failed to update entry');
    }
  }

  /**
   * Delete a specific sheet entry
   * @param {number} id - Entry ID
   * @returns {boolean} Success status
   */
  static async deleteEntry(id) {
    try {
      const deletedCount = await db('sheet_entries')
        .where('id', id)
        .del();

      if (deletedCount === 0) {
        throw new Error('Entry not found');
      }

      console.log(`Deleted entry ${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw new Error('Failed to delete entry');
    }
  }

  /**
   * Get entries by sheet ID
   * @param {number} sheetId - Sheet ID
   * @returns {Array} Array of entries
   */
  static async getEntriesBySheet(sheetId) {
    try {
      const entries = await db('sheet_entries')
        .join('sheets', 'sheet_entries.sheet_id', 'sheets.id')
        .select(
          'sheet_entries.*',
          'sheets.title as sheet_title',
          'sheets.month_year as sheet_month'
        )
        .where('sheet_entries.sheet_id', sheetId)
        .orderBy('sheet_entries.id', 'asc');

      console.log(`Retrieved ${entries.length} entries for sheet ${sheetId}`);
      return entries;
    } catch (error) {
      console.error('Error getting entries by sheet:', error);
      throw new Error('Failed to retrieve entries by sheet');
    }
  }

  /**
   * Delete all sheet entries from the database
   * @returns {Object} Result object with deleted count
   */
  static async deleteAllEntries() {
    try {
      console.log('Starting to delete all sheet entries');
      
      // Get count of entries before deletion
      const countResult = await db('sheet_entries').count('* as count').first();
      const totalEntries = parseInt(countResult.count);
      
      console.log(`Found ${totalEntries} entries to delete`);
      
      // Delete all entries
      const deletedCount = await db('sheet_entries').del();
      
      console.log(`Successfully deleted ${deletedCount} sheet entries`);
      
      // Send notification about the deletion
      await NotificationService.addNotification({
        type: 'info',
        title: 'Database Cleanup',
        message: `All sheet entries (${deletedCount} total) have been deleted from the database`,
        timestamp: new Date().toISOString()
      });
      
      return {
        deletedCount,
        totalEntries
      };
    } catch (error) {
      console.error('Error deleting all entries:', error);
      
      // Send error notification
      await NotificationService.addNotification({
        type: 'error',
        title: 'Database Cleanup Failed',
        message: `Failed to delete all sheet entries: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      
      throw new Error('Failed to delete all entries');
    }
  }

  /**
   * Find matching product based on product name
   * @param {string} productName - Product name to search for
   * @returns {Object|null} Matching product with vendor info
   */
  static async findMatchingProduct(productName) {
    try {
      // First try exact match
      let product = await db('products')
        .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
        .select(
          'products.*',
          'vendors.name as vendor_name'
        )
        .where('products.name', 'ilike', productName)
        .first();

      // If no exact match, try partial match
      if (!product) {
        product = await db('products')
          .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
          .select(
            'products.*',
            'vendors.name as vendor_name'
          )
          .where('products.name', 'ilike', `%${productName}%`)
          .first();
      }

      return product;
    } catch (error) {
      console.error('Error finding matching product:', error);
      return null;
    }
  }

  /**
   * Get entries assigned to a specific team
   * @param {string} teamName - Team name (generation, distribution, transmission)
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of entries for the team
   */
  static async getEntriesByTeam(teamName, filters = {}) {
    try {
      const operationalTeams = ['generation', 'distribution', 'transmission'];
      if (!operationalTeams.includes(teamName)) {
        throw new Error(`Invalid team name. Must be one of: ${operationalTeams.join(', ')}`);
      }

      let query = db('sheet_entries')
        .leftJoin('sheets', 'sheet_entries.sheet_id', 'sheets.id')
        .leftJoin('products', 'sheet_entries.product_id', 'products.id')
        .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
        .select(
          'sheet_entries.*',
          'sheets.title as sheet_title',
          'sheets.month_year as sheet_month',
          'products.name as product_name_from_db',
          'vendors.name as vendor_name'
        )
        .where('sheet_entries.assigned_team', teamName);

      // Apply additional filters
      query = this.applyFilters(query, filters);

      const entries = await query.orderBy('sheet_entries.id', 'asc');

      console.log(`Retrieved ${entries.length} entries for team ${teamName}`);
      return entries;
    } catch (error) {
      console.error(`Error getting entries for team ${teamName}:`, error);
      throw new Error(`Failed to retrieve entries for team ${teamName}`);
    }
  }

  /**
   * Get statistics for all teams
   * @returns {Object} Team statistics with entry counts and progress
   */
  static async getAllTeamStats() {
    try {
      const teamStatsArray = [];

      // Get all active teams from the teams table
      const teams = await db('teams')
        .where('is_active', true)
        .select('id', 'name');

      // Get user counts per team
      const userCounts = await db('users')
        .select('team_id')
        .count('* as count')
        .groupBy('team_id');

      const userCountMap = {};
      userCounts.forEach(row => {
        userCountMap[row.team_id] = parseInt(row.count) || 0;
      });

      for (const team of teams) {
        const stats = await db('sheet_entries')
          .select(
            db.raw('COUNT(*) as total_entries'),
            db.raw("COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed"),
            db.raw("COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress"),
            db.raw("COUNT(CASE WHEN status = 'Not Started' THEN 1 END) as not_started"),
            db.raw("COUNT(CASE WHEN status = 'On Hold' THEN 1 END) as on_hold")
          )
          .where('assigned_team', team.name)
          .first();

        teamStatsArray.push({
          team_name: team.name,
          user_count: userCountMap[team.id] || 0,
          total_entries: parseInt(stats.total_entries) || 0,
          completed_entries: parseInt(stats.completed) || 0,
          pending_entries: parseInt(stats.in_progress) + parseInt(stats.not_started) + parseInt(stats.on_hold) || 0,
          in_progress: parseInt(stats.in_progress) || 0,
          not_started: parseInt(stats.not_started) || 0,
          on_hold: parseInt(stats.on_hold) || 0,
          completion_percentage: stats.total_entries > 0 
            ? Math.round((stats.completed / stats.total_entries) * 100) 
            : 0
        });
      }

      console.log('Retrieved team statistics for all active teams');
      return teamStatsArray;
    } catch (error) {
      console.error('Error getting team statistics:', error);
      throw new Error('Failed to retrieve team statistics');
    }
  }

  /**
   * Get entries for admin monitoring across all teams
   * @param {Object} filters - Optional filters
   * @returns {Object} Entries grouped by team
   */
  static async getEntriesForAdminMonitoring(filters = {}) {
    try {
      const operationalTeams = ['generation', 'distribution', 'transmission'];
      const teamData = {};

      for (const team of operationalTeams) {
        const entries = await this.getEntriesByTeam(team, filters);
        teamData[team] = entries;
      }

      console.log('Retrieved entries for admin monitoring across all teams');
      return teamData;
    } catch (error) {
      console.error('Error getting entries for admin monitoring:', error);
      throw new Error('Failed to retrieve entries for admin monitoring');
    }
  }

  /**
   * Apply filters to a query
   * @param {Object} query - Knex query object
   * @param {Object} filters - Filters to apply
   * @returns {Object} Modified query object
   */
  static applyFilters(query, filters = {}) {
    // Apply search filter
    if (filters.search) {
      query = query.where(function() {
        this.where('sheet_entries.product_name', 'ilike', `%${filters.search}%`)
            .orWhere('sheet_entries.oem_vendor', 'ilike', `%${filters.search}%`)
            .orWhere('sheet_entries.source', 'ilike', `%${filters.search}%`)
            .orWhere('sheet_entries.location', 'ilike', `%${filters.search}%`);
      });
    }

    // Apply status filter
    if (filters.status) {
      query = query.where('sheet_entries.status', filters.status);
    }

    // Apply vendor filter
    if (filters.vendor) {
      query = query.where('sheet_entries.oem_vendor', 'ilike', `%${filters.vendor}%`);
    }

    // Apply deployed_in_ke filter
    if (filters.deployed_in_ke) {
      query = query.where('sheet_entries.deployed_in_ke', filters.deployed_in_ke);
    }

    // Apply pagination
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.offset(offset).limit(filters.limit);
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortOrder === 'desc' ? 'desc' : 'asc';
      query = query.orderBy(`sheet_entries.${filters.sortBy}`, order);
    }

    return query;
  }
}

module.exports = SheetEntryService;
