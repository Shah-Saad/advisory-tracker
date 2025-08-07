const EntryLockingService = require('../services/EntryLockingService');

const entryLockingController = {
  // Lock an entry for editing
  async lockEntry(req, res) {
    try {
      const { entryId } = req.params;
      const userId = req.user.id;
      
      const result = await EntryLockingService.lockEntry(entryId, userId);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('locked by another user')) statusCode = 409;
      res.status(statusCode).json({ error: error.message });
    }
  },
  
  // Unlock an entry
  async unlockEntry(req, res) {
    try {
      const { entryId } = req.params;
      const userId = req.user.id;
      
      const result = await EntryLockingService.unlockEntry(entryId, userId);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('can only unlock')) statusCode = 403;
      res.status(statusCode).json({ error: error.message });
    }
  },
  
  // Complete an entry (update data and unlock)
  async completeEntry(req, res) {
    try {
      const { entryId } = req.params;
      const userId = req.user.id;
      const entryData = req.body;
      
      const result = await EntryLockingService.completeEntry(entryId, userId, entryData);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('can only complete')) statusCode = 403;
      res.status(statusCode).json({ error: error.message });
    }
  },
  
  // Get available entries for current user
  async getAvailableEntries(req, res) {
    try {
      const { sheetId } = req.params;
      const userId = req.user.id;
      const { teamId } = req.query;
      
      const entries = await EntryLockingService.getAvailableEntries(sheetId, userId, teamId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get entries locked by current user
  async getMyLockedEntries(req, res) {
    try {
      const userId = req.user.id;
      const entries = await EntryLockingService.getUserLockedEntries(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Admin function to release expired locks
  async releaseExpiredLocks(req, res) {
    try {
      const result = await EntryLockingService.releaseExpiredLocks();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = entryLockingController;
