const SheetResponseService = require('../services/SheetResponseService');

const sheetResponseController = {
  // Get team-specific sheet entries
  async getTeamSheetEntries(req, res) {
    try {
      const { sheetId, teamId } = req.params;
      const userId = req.user.id;

      const entries = await SheetResponseService.getTeamSheetEntries(sheetId, teamId, userId);
      res.json(entries);
    } catch (error) {
      console.error('Error getting team sheet entries:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update a team's sheet entry
  async updateTeamSheetEntry(req, res) {
    try {
      const { responseId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const updatedEntry = await SheetResponseService.updateTeamSheetEntry(responseId, updateData, userId);
      res.json(updatedEntry);
    } catch (error) {
      console.error('Error updating team sheet entry:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all team responses for a sheet (admin)
  async getAllTeamResponses(req, res) {
    try {
      const { sheetId } = req.params;
      
      const responses = await SheetResponseService.getAllTeamResponses(sheetId);
      res.json(responses);
    } catch (error) {
      console.error('Error getting all team responses:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get detailed responses for a specific team (admin)
  async getTeamDetailedResponses(req, res) {
    try {
      const { sheetId, teamId } = req.params;
      
      const responses = await SheetResponseService.getTeamDetailedResponses(sheetId, teamId);
      res.json(responses);
    } catch (error) {
      console.error('Error getting team detailed responses:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Mark team sheet as completed
  async markTeamSheetCompleted(req, res) {
    try {
      const { sheetId, teamId } = req.params;
      const userId = req.user.id;

      const result = await SheetResponseService.markTeamSheetCompleted(sheetId, teamId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error marking team sheet as completed:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Initialize team responses when distributing sheets
  async initializeTeamResponses(req, res) {
    try {
      const { sheetId } = req.params;
      const { teamIds } = req.body;
      const assignedBy = req.user.id;

      const results = await SheetResponseService.initializeTeamSheetResponses(sheetId, teamIds, assignedBy);
      res.json(results);
    } catch (error) {
      console.error('Error initializing team responses:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = sheetResponseController;
