const Entry = require('../models/Entry');

class EntryService {
  static async getAllEntries() {
    return await Entry.findAll();
  }

  static async getEntryById(id) {
    const entry = await Entry.findById(id);
    if (!entry) {
      throw new Error('Entry not found');
    }
    return entry;
  }

  static async getEntriesBySheetId(sheetId) {
    return await Entry.findBySheetId(sheetId);
  }

  static async createEntry(entryData) {
    return await Entry.create(entryData);
  }

  static async updateEntry(id, entryData) {
    // Check if entry exists
    const existingEntry = await Entry.findById(id);
    if (!existingEntry) {
      throw new Error('Entry not found');
    }

    return await Entry.update(id, entryData);
  }

  static async deleteEntry(id) {
    // Check if entry exists
    const existingEntry = await Entry.findById(id);
    if (!existingEntry) {
      throw new Error('Entry not found');
    }

    return await Entry.delete(id);
  }
}

module.exports = EntryService;
