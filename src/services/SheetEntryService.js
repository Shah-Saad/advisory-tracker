const db = require('../config/db');

class SheetEntryService {
  
  // Save entries from processed file data to database
  static async saveSheetEntries(sheetId, processedData) {
    try {
      const entries = [];
      
      // Convert processed data to database entries
      processedData.rows.forEach((row, index) => {
        const entry = {
          sheet_id: sheetId,
          row_number: index + 1,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        // Handle both object and array format
        if (typeof row === 'object' && !Array.isArray(row)) {
          // Row is already an object
          Object.keys(row).forEach(key => {
            entry[key] = row[key];
          });
        } else {
          // Row is an array
          processedData.headers.forEach((header, colIndex) => {
            entry[header] = row[colIndex];
          });
        }
        
        entries.push(entry);
      });
      
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
  
  // Get all entries for a specific sheet
  static async getSheetEntries(sheetId) {
    try {
      const entries = await db('sheet_entries')
        .where('sheet_id', sheetId)
        .orderBy('row_number', 'asc');
      
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
        .orderBy(['sheets.month_year', 'sheet_entries.row_number']);
      
      return entries;
    } catch (error) {
      throw new Error(`Failed to get all entries: ${error.message}`);
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
        if (filters[key] !== undefined && filters[key] !== null) {
          if (key === 'sheet_id' || key === 'sheet_title') {
            // Handle sheet-level filters
            query = query.where(`sheets.${key.replace('sheet_', '')}`, filters[key]);
          } else {
            // Handle entry-level filters
            query = query.where(`sheet_entries.${key}`, filters[key]);
          }
        }
      });
      
      const entries = await query.orderBy(['sheets.month_year', 'sheet_entries.row_number']);
      
      return entries;
    } catch (error) {
      throw new Error(`Failed to filter entries: ${error.message}`);
    }
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
   * @returns {Object} Updated entry
   */
  static async updateEntry(id, updateData) {
    try {
      const allowedFields = [
        'product_name', 
        'location', 
        'status', 
        'deployed_in_ke', 
        'team', 
        'date', 
        'notes'
      ];

      // Filter update data to only allowed fields
      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      // Add updated timestamp
      filteredData.updated_at = new Date();

      const [updatedEntry] = await db('sheet_entries')
        .where('id', id)
        .update(filteredData)
        .returning('*');

      console.log(`Updated entry ${id} with data:`, filteredData);
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
        .orderBy('sheet_entries.row_number', 'asc');

      console.log(`Retrieved ${entries.length} entries for sheet ${sheetId}`);
      return entries;
    } catch (error) {
      console.error('Error getting entries by sheet:', error);
      throw new Error('Failed to retrieve entries by sheet');
    }
  }
}

module.exports = SheetEntryService;
