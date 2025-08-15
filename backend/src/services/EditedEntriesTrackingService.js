const db = require('../config/db');

class EditedEntriesTrackingService {
  
  /**
   * Track when a user edits an entry
   * @param {number} userId - User ID
   * @param {number} sheetId - Sheet ID
   * @param {number} entryId - Entry ID
   * @param {number} responseId - Response ID (optional)
   */
  static async trackEntryEdit(userId, sheetId, entryId, responseId = null) {
    try {
      // Check if tracking record already exists
      const existingTracking = await db('edited_entries_tracking')
        .where({
          user_id: userId,
          sheet_id: sheetId,
          entry_id: entryId
        })
        .first();

      if (existingTracking) {
        // Update existing tracking record
        await db('edited_entries_tracking')
          .where('id', existingTracking.id)
          .update({
            response_id: responseId,
            last_edited_at: db.fn.now(),
            edit_count: db.raw('edit_count + 1')
          });
      } else {
        // Create new tracking record
        await db('edited_entries_tracking').insert({
          user_id: userId,
          sheet_id: sheetId,
          entry_id: entryId,
          response_id: responseId,
          first_edited_at: db.fn.now(),
          last_edited_at: db.fn.now(),
          edit_count: 1
        });
      }
    } catch (error) {
      console.error('Error tracking entry edit:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get edited entries for a user in a specific sheet
   * @param {number} userId - User ID
   * @param {number} sheetId - Sheet ID
   * @returns {Array} Array of edited entry IDs
   */
  static async getEditedEntryIds(userId, sheetId) {
    try {
      const trackingRecords = await db('edited_entries_tracking')
        .where({
          user_id: userId,
          sheet_id: sheetId
        })
        .select('entry_id');

      return trackingRecords.map(record => record.entry_id);
    } catch (error) {
      console.error('Error getting edited entry IDs:', error);
      return [];
    }
  }

  /**
   * Get edited entries for a team in a specific sheet
   * @param {number} teamId - Team ID
   * @param {number} sheetId - Sheet ID
   * @returns {Array} Array of edited entry IDs
   */
  static async getTeamEditedEntryIds(teamId, sheetId) {
    try {
      console.log(`🔍 Getting edited entry IDs for team ${teamId}, sheet ${sheetId}`);
      
      // Get team name from team ID
      const team = await db('teams').where('id', teamId).first();
      if (!team) {
        console.log(`❌ Team with ID ${teamId} not found`);
        return [];
      }
      
      const trackingRecords = await db('edited_entries_tracking as eet')
        .join('users as u', 'eet.user_id', 'u.id')
        .join('sheet_entries as se', 'eet.entry_id', 'se.id')
        .where({
          'u.team_id': teamId,
          'eet.sheet_id': sheetId
          // Teams can edit any entry in the sheet, not just assigned ones
        })
        .select('eet.entry_id');

      const editedEntryIds = [...new Set(trackingRecords.map(record => record.entry_id))];
      console.log(`🔍 Found ${editedEntryIds.length} edited entries:`, editedEntryIds);
      
      return editedEntryIds;
    } catch (error) {
      console.error('Error getting team edited entry IDs:', error);
      return [];
    }
  }

  /**
   * Get edit statistics for a user
   * @param {number} userId - User ID
   * @returns {Object} Edit statistics
   */
  static async getUserEditStats(userId) {
    try {
      const stats = await db('edited_entries_tracking')
        .where('user_id', userId)
        .select(
          db.raw('COUNT(DISTINCT sheet_id) as sheets_worked_on'),
          db.raw('COUNT(DISTINCT entry_id) as total_entries_edited'),
          db.raw('SUM(edit_count) as total_edits')
        )
        .first();

      return {
        sheets_worked_on: parseInt(stats.sheets_worked_on) || 0,
        total_entries_edited: parseInt(stats.total_entries_edited) || 0,
        total_edits: parseInt(stats.total_edits) || 0
      };
    } catch (error) {
      console.error('Error getting user edit stats:', error);
      return {
        sheets_worked_on: 0,
        total_entries_edited: 0,
        total_edits: 0
      };
    }
  }

  /**
   * Remove tracking for an entry (when entry is deleted or reset)
   * @param {number} sheetId - Sheet ID
   * @param {number} entryId - Entry ID
   */
  static async removeEntryTracking(sheetId, entryId) {
    try {
      await db('edited_entries_tracking')
        .where({
          sheet_id: sheetId,
          entry_id: entryId
        })
        .del();
    } catch (error) {
      console.error('Error removing entry tracking:', error);
    }
  }

  /**
   * Check if table exists, if not create it
   */
  static async ensureTableExists() {
    try {
      // Check if table exists
      const tableExists = await db.schema.hasTable('edited_entries_tracking');
      
      if (!tableExists) {
        console.log('Creating edited_entries_tracking table...');
        await db.schema.createTable('edited_entries_tracking', (table) => {
          table.increments('id').primary();
          table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
          table.integer('sheet_id').notNullable().references('id').inTable('sheets').onDelete('CASCADE');
          table.integer('entry_id').notNullable().references('id').inTable('sheet_entries').onDelete('CASCADE');
          table.integer('response_id').references('id').inTable('sheet_responses').onDelete('CASCADE');
          table.timestamp('first_edited_at').defaultTo(db.fn.now());
          table.timestamp('last_edited_at').defaultTo(db.fn.now());
          table.integer('edit_count').defaultTo(1);
          
          // Composite unique constraint to prevent duplicate tracking
          table.unique(['user_id', 'sheet_id', 'entry_id']);
          
          // Indexes for better performance
          table.index(['user_id', 'sheet_id']);
          table.index(['sheet_id', 'entry_id']);
          table.index(['user_id']);
        });
        console.log('✅ edited_entries_tracking table created successfully');
      }
    } catch (error) {
      console.error('Error ensuring table exists:', error);
    }
  }
}

module.exports = EditedEntriesTrackingService;

