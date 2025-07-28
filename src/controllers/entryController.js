const EntryService = require('../services/EntryService');

const entryController = {
  // Get all entries
  async getAllEntries(req, res) {
    try {
      const entries = await EntryService.getAllEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get entry by ID
  async getEntryById(req, res) {
    try {
      const { id } = req.params;
      const entry = await EntryService.getEntryById(id);
      res.json(entry);
    } catch (error) {
      const statusCode = error.message === 'Entry not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get entries by sheet ID
  async getEntriesBySheetId(req, res) {
    try {
      const { sheetId } = req.params;
      const entries = await EntryService.getEntriesBySheetId(sheetId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new entry
  async createEntry(req, res) {
    try {
      const entry = await EntryService.createEntry(req.body);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update entry
  async updateEntry(req, res) {
    try {
      const { id } = req.params;
      const entry = await EntryService.updateEntry(id, req.body);
      res.json(entry);
    } catch (error) {
      const statusCode = error.message === 'Entry not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Delete entry
  async deleteEntry(req, res) {
    try {
      const { id } = req.params;
      await EntryService.deleteEntry(id);
      res.status(204).send();
    } catch (error) {
      const statusCode = error.message === 'Entry not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = entryController;
