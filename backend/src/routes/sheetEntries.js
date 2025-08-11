const express = require('express');
const router = express.Router();
const path = require('path');
const SheetEntryService = require('../services/SheetEntryService');
const SheetService = require('../services/SheetService');
const FileProcessingService = require('../services/FileProcessingService');
const { auth } = require('../middlewares/auth');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware');
const { broadcastToAdmins } = require('./sse'); // Import SSE broadcasting

/**
 * @route POST /api/sheet-entries/upload
 * @desc Upload and process a sheet file (Excel/CSV)
 * @access Private
 */
router.post('/upload', auth, uploadMiddleware, async (req, res) => {
    try {
        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can upload sheets.' 
            });
        }

        console.log('File upload request received');
        
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('File details:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        });

        // Process the uploaded file
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        console.log('Processing file with extension:', fileExtension);
        
        // Create a proper sheet first
        const { month, year } = req.body;
        const monthYear = month && year ? `${year}-${month.padStart(2, '0')}` : new Date().toISOString().slice(0, 7);
        
        // Create sheet data
        const sheetData = {
            title: `Monthly Advisory Report - ${monthYear}`,
            description: `Uploaded sheet for ${monthYear}`,
            month_year: `${monthYear}-01`
        };
        
        // Create the sheet using SheetService (this will process the file)
        const sheetResult = await SheetService.createMonthlySheet(sheetData, req.user.id, {
            originalName: req.file.originalname,
            path: req.file.path,
            extension: path.extname(req.file.originalname).toLowerCase()
        });
        
        const sheetId = sheetResult.sheet.id;
        console.log('File processed successfully:', {
            sheetId: sheetId,
            totalRows: sheetResult.fileData ? sheetResult.fileData.totalRows : 0,
            templateFields: sheetResult.templateFields ? sheetResult.templateFields.length : 0
        });
        
        // Sheet is automatically distributed to all teams in SheetService.uploadFileToSheet
        res.json({
            message: 'File uploaded and distributed to all teams successfully',
            sheet: sheetResult.sheet,
            processedCount: sheetResult.fileData ? sheetResult.fileData.totalRows : 0,
            totalRows: sheetResult.fileData ? sheetResult.fileData.totalRows : 0,
            headers: sheetResult.fileData ? sheetResult.fileData.headers : []
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ 
            message: 'Failed to upload and process file', 
            error: error.message,
            details: error.stack
        });
    }
});

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
 * @route POST /api/sheet-entries/filter
 * @desc Filter sheet entries with POST body
 * @access Private
 */
router.post('/filter', auth, async (req, res) => {
    try {
        const filters = req.body.filters || {};
        const entries = await SheetEntryService.filterEntries(filters);
        
        res.json({
            message: 'Entries filtered successfully',
            data: entries,
            count: entries.length
        });
    } catch (error) {
        console.error('Error filtering entries:', error);
        res.status(500).json({ 
            message: 'Failed to filter entries', 
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
 * @queryParams {string} vendor - Filter by vendor/OEM name (uses oem_vendor field)
 * @queryParams {number} vendor_id - Filter by vendor ID
 * @queryParams {number} product_id - Filter by product ID
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

        if (req.query.vendor_name) {
            filters.vendor_name = req.query.vendor_name;
        }

        

        if (req.query.vendor_id) {
            filters.vendor_id = req.query.vendor_id;
        }

        if (req.query.product_id) {
            filters.product_id = req.query.product_id;
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
        
        console.log(`🔄 PUT /api/sheet-entries/${id} called by user ${req.user.email} (${req.user.role})`);
        console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
        
        // Validate that the entry exists
        console.log('🔍 Checking if entry exists...');
        let existingEntries = await SheetEntryService.filterEntries({ id });
        let actualEntryId = id;
        
        if (existingEntries.length === 0) {
            // Entry not found in sheet_entries, check if it's a sheet_responses.id
            console.log('🔍 Entry not found in sheet_entries, checking if it\'s a sheet_responses.id...');
            const sheetResponse = await require('../config/db')('sheet_responses')
                .where('id', id)
                .first();
                
            if (sheetResponse) {
                console.log('✅ Found sheet_response with id:', id, '-> original_entry_id:', sheetResponse.original_entry_id);
                actualEntryId = sheetResponse.original_entry_id;
                existingEntries = await SheetEntryService.filterEntries({ id: actualEntryId });
            }
        }
        
        if (existingEntries.length === 0) {
            console.log('❌ Entry not found in either table');
            return res.status(404).json({ message: 'Sheet entry not found' });
        }
        
        const existingEntry = existingEntries[0];
        console.log('✅ Entry found:', existingEntry.id, existingEntry.product_name);
        
        // Team isolation: Check if user has access to this entry
        // Only admins or users from the correct team can update entries
        if (req.user.role !== 'admin') {
            console.log('🔐 Checking team access for non-admin user...');
            // Get team assignment for this sheet
            const teamAssignment = await require('../config/db')('team_sheets')
                .where('sheet_id', existingEntry.sheet_id)
                .where('team_id', req.user.team_id)
                .first();
            
            if (!teamAssignment) {
                console.log('❌ Access denied - entry not assigned to user team');
                return res.status(403).json({ 
                    message: 'Access denied. This entry is not assigned to your team.' 
                });
            }
            console.log('✅ Team access verified');
        } else {
            console.log('✅ Admin user - full access');
        }
        
        // Update the entry with user information for notifications
        console.log('💾 Calling SheetEntryService.updateEntry...');
        const updatedEntry = await SheetEntryService.updateEntry(actualEntryId, updateData, req.user);
        console.log('✅ Entry updated successfully:', updatedEntry.id);
        
        // Broadcast real-time update to all connected admin clients
        try {
            broadcastToAdmins({
                type: 'entry_updated',
                entryId: id,
                entry: updatedEntry,
                updatedBy: {
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    team: req.user.team?.name
                },
                timestamp: new Date().toISOString()
            });
            console.log(`📡 Broadcasted entry update for entry ${id} by user ${req.user.email}`);
        } catch (sseError) {
            console.warn('Failed to broadcast SSE update:', sseError);
            // Don't fail the request if SSE fails
        }
        
        res.json({
            message: 'Entry updated successfully',
            entry: updatedEntry
        });
    } catch (error) {
        console.error('❌ Error updating entry:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            message: 'Failed to update entry', 
            error: error.message 
        });
    }
});

/**
 * @route DELETE /api/sheet-entries/all
 * @desc Delete all sheet entries from database
 * @access Admin only
 */
router.delete('/all', auth, async (req, res) => {
    try {
        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can delete all entries.' 
            });
        }

        console.log(`Admin ${req.user.username} is deleting all sheet entries`);
        
        const result = await SheetEntryService.deleteAllEntries();
        
        console.log(`Successfully deleted ${result.deletedCount} entries`);
        
        res.json({
            message: 'All sheet entries deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting all entries:', error);
        res.status(500).json({ 
            message: 'Failed to delete all entries', 
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

/**
 * @route GET /api/sheet-entries/:id
 * @desc Get a single entry by ID with detailed information
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Invalid entry ID' });
        }

        const entry = await SheetEntryService.getEntryById(parseInt(id));
        res.json({
            message: 'Entry retrieved successfully',
            data: entry
        });
    } catch (error) {
        console.error('Error getting entry:', error);
        if (error.message === 'Entry not found') {
            res.status(404).json({ message: 'Entry not found' });
        } else {
            res.status(500).json({ 
                message: 'Failed to retrieve entry', 
                error: error.message 
            });
        }
    }
});

module.exports = router;
