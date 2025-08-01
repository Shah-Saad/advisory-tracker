const express = require('express');
const router = express.Router();
const sheetController = require('../controllers/sheetController');
const { auth } = require('../middlewares/auth');
const { requirePermission, requireAnyPermission } = require('../middlewares/rbac');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware');

// All sheet routes require authentication
router.use(auth);

// Admin-only routes for sheet management
router.get('/', requirePermission('read_sheets'), sheetController.getAllSheets);
router.get('/team-status-summary', requirePermission('read_sheets'), sheetController.getAllSheetsWithTeamStatus);
router.get('/filtered', requirePermission('filter_sheet_data'), sheetController.getSheetsWithFilters);
router.post('/', 
    requirePermission('create_sheets'),
    uploadMiddleware,
    sheetController.createMonthlySheet
);
router.get('/current-month', requireAnyPermission(['read_sheets', 'fill_sheets']), sheetController.getCurrentMonthSheets);
router.get('/status/:status', requirePermission('read_sheets'), sheetController.getSheetsByStatus);

// Monthly summary routes (Admin only)
router.get('/summary/:year/:month', requirePermission('read_sheets'), sheetController.getMonthlySheetSummary);

// Team member routes - get sheets assigned to their team
router.get('/my-team', requireAnyPermission(['fill_sheets', 'read_sheets']), sheetController.getMyTeamSheets);

// Sheet-specific routes
router.get('/:id', requireAnyPermission(['read_sheets', 'fill_sheets']), sheetController.getSheetById);
router.get('/:id/filtered-data', requirePermission('filter_sheet_data'), sheetController.getFilteredSheetData);
router.put('/:id', requirePermission('update_sheets'), sheetController.updateSheet);
router.delete('/:id', requirePermission('delete_sheets'), sheetController.deleteSheet);

// Admin-only distribution routes
router.post('/:id/distribute', requirePermission('distribute_sheets'), sheetController.distributeSheetToTeams);
router.post('/:id/distribute-all', requirePermission('distribute_sheets'), sheetController.distributeToAllTeams);
router.post('/:id/distribute-operational', requirePermission('distribute_sheets'), sheetController.distributeSheetToOperationalTeams);

// Team member routes for working with sheets
router.post('/:id/start', requireAnyPermission(['fill_sheets']), sheetController.startTeamSheet);
router.post('/:id/submit', requireAnyPermission(['fill_sheets']), sheetController.submitTeamSheet);

// Admin-only response viewing and export
router.get('/:id/responses', requirePermission('read_sheets'), sheetController.getSheetResponses);
router.get('/:id/export', requireAnyPermission(['export_sheet_data']), sheetController.exportSheetData);

// Admin-only team-specific sheet views
router.get('/:id/team-views', requirePermission('read_sheets'), sheetController.getSheetByTeams);
router.get('/:id/team/:teamId', requirePermission('read_sheets'), sheetController.getSheetForTeam);

module.exports = router;
