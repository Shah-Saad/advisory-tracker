const db = require('../config/db');

class EntryLockingService {
  // Lock an entry for a specific user
  static async lockEntry(entryId, userId) {
    const trx = await db.transaction();
    
    try {
      // Check if entry is already locked
      const entry = await trx('sheet_entries')
        .where('id', entryId)
        .first();
      
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      if (entry.locked_by_user_id && entry.locked_by_user_id !== userId) {
        // Check if lock is still valid (less than 30 minutes old)
        const lockAge = new Date() - new Date(entry.locked_at);
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (lockAge < thirtyMinutes) {
          throw new Error('Entry is currently locked by another user');
        }
      }
      
      // Lock the entry
      await trx('sheet_entries')
        .where('id', entryId)
        .update({
          locked_by_user_id: userId,
          locked_at: new Date()
        });
      
      await trx.commit();
      return { success: true, message: 'Entry locked successfully' };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  // Unlock an entry
  static async unlockEntry(entryId, userId) {
    const entry = await db('sheet_entries')
      .where('id', entryId)
      .first();
    
    if (!entry) {
      throw new Error('Entry not found');
    }
    
    if (entry.locked_by_user_id !== userId) {
      throw new Error('You can only unlock entries that you have locked');
    }
    
    await db('sheet_entries')
      .where('id', entryId)
      .update({
        locked_by_user_id: null,
        locked_at: null
      });
    
    return { success: true, message: 'Entry unlocked successfully' };
  }
  
  // Complete an entry (unlock and mark as completed)
  static async completeEntry(entryId, userId, entryData) {
    const trx = await db.transaction();
    
    try {
      console.log('EntryLockingService.completeEntry called with:', { entryId, userId, entryData });
      
      const entry = await trx('sheet_entries')
        .where('id', entryId)
        .first();
      
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      if (entry.locked_by_user_id !== userId) {
        throw new Error('You can only complete entries that you have locked');
      }
      
      // Only allow editing of specific fields
      const allowedFields = {
        deployed_in_ke: EntryLockingService.convertBooleanToEnum(entryData.deployed_in_ke),
        site: entryData.site,
        vendor_contacted: EntryLockingService.convertBooleanToEnum(entryData.vendor_contacted),
        vendor_contact_date: (entryData.vendor_contact_date === '' || entryData.vendor_contact_date === null || entryData.vendor_contact_date === undefined) ? null : entryData.vendor_contact_date, // Convert empty/null to null
        patching: entryData.patching,
        patching_est_release_date: (entryData.patching_est_release_date === '' || entryData.patching_est_release_date === null || entryData.patching_est_release_date === undefined) ? null : entryData.patching_est_release_date, // Convert empty/null to null
        implementation_date: (entryData.implementation_date === '' || entryData.implementation_date === null || entryData.implementation_date === undefined) ? null : entryData.implementation_date, // Convert empty/null to null
        estimated_time: entryData.estimated_time,
        compensatory_controls_provided: EntryLockingService.convertBooleanToEnum(entryData.compensatory_controls_provided),
        comments: entryData.comments,
        current_status: entryData.current_status
      };
      
      console.log('Allowed fields to update:', allowedFields);
      
      // Remove undefined values
      const updateData = Object.keys(allowedFields).reduce((acc, key) => {
        if (allowedFields[key] !== undefined) {
          acc[key] = allowedFields[key];
        }
        return acc;
      }, {});
      
      console.log('Final update data:', updateData);
      
      // Update entry data and mark as completed
      await trx('sheet_entries')
        .where('id', entryId)
        .update({
          ...updateData,
          is_completed: true,
          completed_at: new Date(),
          locked_by_user_id: null,
          locked_at: null
        });
      
      await trx.commit();
      console.log('Entry completed successfully');
      return { success: true, message: 'Entry completed successfully' };
    } catch (error) {
      console.error('Error in completeEntry:', error);
      await trx.rollback();
      throw error;
    }
  }
  
  // Get available entries for a user (not locked by others or locked by self)
  static async getAvailableEntries(sheetId, userId, teamId = null) {
    let query = db('sheet_entries')
      .select(
        'sheet_entries.*',
        'users.first_name as locked_by_first_name',
        'users.last_name as locked_by_last_name'
      )
      .leftJoin('users', 'sheet_entries.locked_by_user_id', 'users.id')
      .where('sheet_entries.sheet_id', sheetId);
    
    // Team filtering: Check if the sheet is assigned to the user's team
    if (teamId) {
      // Check if there's a team_sheets assignment for this team and sheet
      const teamAssignment = await db('team_sheets')
        .where('sheet_id', sheetId)
        .where('team_id', teamId)
        .first();
      
      if (!teamAssignment) {
        // If no team assignment exists, return empty array
        return [];
      }
    }
    
    // Only show entries that are:
    // 1. Not locked by anyone
    // 2. Locked by the current user
    // 3. Locked more than 30 minutes ago (expired locks)
    query = query.where(function() {
      this.whereNull('sheet_entries.locked_by_user_id')
        .orWhere('sheet_entries.locked_by_user_id', userId)
        .orWhere('sheet_entries.locked_at', '<', new Date(Date.now() - 30 * 60 * 1000));
    });
    
    return await query.orderBy('sheet_entries.created_at', 'asc');
  }
  
  // Get locked entries for a specific user
  static async getUserLockedEntries(userId) {
    return await db('sheet_entries')
      .select('sheet_entries.*', 'sheets.title as sheet_title')
      .join('sheets', 'sheet_entries.sheet_id', 'sheets.id')
      .where('sheet_entries.locked_by_user_id', userId)
      .where('sheet_entries.locked_at', '>', new Date(Date.now() - 30 * 60 * 1000))
      .orderBy('sheet_entries.locked_at', 'desc');
  }
  
  // Release expired locks (cleanup function)
  static async releaseExpiredLocks() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const result = await db('sheet_entries')
      .where('locked_at', '<', thirtyMinutesAgo)
      .whereNotNull('locked_by_user_id')
      .update({
        locked_by_user_id: null,
        locked_at: null
      });
    
    return { releasedLocks: result };
  }

  // Helper method to convert boolean/string values to database enum format
  static convertBooleanToEnum(value) {
    if (value === true || value === 'true' || value === 'Y' || value === 'Yes') {
      return 'Y';
    } else if (value === false || value === 'false' || value === 'N' || value === 'No') {
      return 'N';
    }
    // If it's already a valid enum value, return as is
    return value || 'N'; // Default to 'N' if undefined/null
  }
}

module.exports = EntryLockingService;
