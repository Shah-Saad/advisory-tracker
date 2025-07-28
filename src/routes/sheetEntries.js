const express = require('express');
const router = express.Router();
const SheetEntryService = require('../services/SheetEntryService');
const auth = require('../middlewares/auth');

/**
 * @route GET /api/sheet-entries
 * @desc Get all sheet entries from database
 * @access Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const entries = await SheetEntryService.getAllEntries();
        res.json(entries);
    } catch (error) {
        console.error('Error getting all entries:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve entries', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/sheet-entries/stats
 * @desc Get statistics about sheet entries
 * @access Private
 */
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await SheetEntryService.getEntryStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting entry statistics:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve statistics', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/sheet-entries/filter
 * @desc Filter sheet entries based on query parameters
 * @access Private
 * @queryParams {string} deployed_in_ke - Filter by deployment status (Yes/No)
 * @queryParams {string} status - Filter by status (Completed/In Progress/Pending)
 * @queryParams {string} team - Filter by team
 * @queryParams {string} location - Filter by location
 * @queryParams {string} product_name - Filter by product name
 */
router.get('/filter', auth, async (req, res) => {
    try {
        const filters = {};
        
        // Build filter object from query parameters
        if (req.query.deployed_in_ke) {
            filters.deployed_in_ke = req.query.deployed_in_ke;
        }
        
        if (req.query.status) {
            filters.status = req.query.status;
        }
        
        if (req.query.team) {
            filters.team = req.query.team;
        }
        
        if (req.query.location) {
            filters.location = req.query.location;
        }
        
        if (req.query.product_name) {
            filters.product_name = req.query.product_name;
        }
        
        const entries = await SheetEntryService.filterEntries(filters);
        
        res.json(entries);
    } catch (error) {
        console.error('Error filtering entries:', error);
        res.status(500).json({ 
            message: 'Failed to filter entries', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/sheet-entries/sheet/:sheetId
 * @desc Get all entries for a specific sheet
 * @access Private
 */
router.get('/sheet/:sheetId', auth, async (req, res) => {
    try {
        const { sheetId } = req.params;
        const entries = await SheetEntryService.filterEntries({ sheet_id: sheetId });
        res.json(entries);
    } catch (error) {
        console.error('Error getting entries for sheet:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve entries for sheet', 
            error: error.message 
        });
    }
});

/**
 * @route PUT /api/sheet-entries/:id
 * @desc Update a specific sheet entry
 * @access Private
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Validate that the entry exists
        const existingEntries = await SheetEntryService.filterEntries({ id });
        if (existingEntries.length === 0) {
            return res.status(404).json({ message: 'Sheet entry not found' });
        }
        
        // Update the entry
        const updatedEntry = await SheetEntryService.updateEntry(id, updateData);
        res.json({
            message: 'Entry updated successfully',
            entry: updatedEntry
        });
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ 
            message: 'Failed to update entry', 
            error: error.message 
        });
    }
});

/**
 * @route DELETE /api/sheet-entries/:id
 * @desc Delete a specific sheet entry
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate that the entry exists
        const existingEntries = await SheetEntryService.filterEntries({ id });
        if (existingEntries.length === 0) {
            return res.status(404).json({ message: 'Sheet entry not found' });
        }
        
        // Delete the entry
        await SheetEntryService.deleteEntry(id);
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ 
            message: 'Failed to delete entry', 
            error: error.message 
        });
    }
});

module.exports = router;
