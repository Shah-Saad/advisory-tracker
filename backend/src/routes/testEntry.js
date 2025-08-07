const express = require('express');
const router = express.Router();
const EntryLockingService = require('../services/EntryLockingService');

// Test endpoint to simulate entry completion without authentication
router.post('/test-completion', async (req, res) => {
  try {
    console.log('Test completion endpoint called with body:', req.body);
    
    // Simulate the same data structure that would come from the frontend
    const testData = req.body || {
      deployed_in_ke: false,
      vendor_contacted: true,
      compensatory_controls_provided: false,
      site: "Test Site",
      patching: "Available",
      comments: "Test completion",
      current_status: "in_progress"
    };
    
    // Find a test entry to use
    const db = require('../config/db');
    const testEntry = await db('sheet_entries').where('locked_by_user_id', null).first();
    
    if (!testEntry) {
      return res.status(404).json({ error: 'No unlocked entries found for testing' });
    }
    
    console.log('Using test entry ID:', testEntry.id);
    
    // Lock the entry first
    await db('sheet_entries')
      .where('id', testEntry.id)
      .update({
        locked_by_user_id: 1,
        locked_at: new Date()
      });
    
    // Try to complete the entry using the service
    const result = await EntryLockingService.completeEntry(testEntry.id, 1, testData);
    
    res.json({ 
      success: true, 
      message: 'Test completion successful',
      result,
      entryId: testEntry.id 
    });
  } catch (error) {
    console.error('Test completion error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
});

module.exports = router;
