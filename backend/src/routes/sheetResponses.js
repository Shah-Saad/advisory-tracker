const express = require('express');
const router = express.Router();
const sheetResponseController = require('../controllers/sheetResponseController');
const { auth } = require('../middlewares/auth');
const { requireAnyPermission } = require('../middlewares/rbac');

// Team routes - for team members to work on their sheet copies
router.get('/sheets/:sheetId/teams/:teamId/entries', 
  auth, 
  requireAnyPermission(['read_sheets', 'fill_sheets']), 
  sheetResponseController.getTeamSheetEntries
);

router.put('/responses/:responseId', 
  auth, 
  requireAnyPermission(['fill_sheets']), 
  sheetResponseController.updateTeamSheetEntry
);

router.post('/sheets/:sheetId/teams/:teamId/complete', 
  auth, 
  requireAnyPermission(['fill_sheets']), 
  sheetResponseController.markTeamSheetCompleted
);

// Admin routes - for viewing all team responses
router.get('/admin/sheets/:sheetId/responses', 
  auth, 
  requireAnyPermission(['read_sheets', 'distribute_sheets']), 
  sheetResponseController.getAllTeamResponses
);

router.get('/admin/sheets/:sheetId/teams/:teamId/responses', 
  auth, 
  requireAnyPermission(['read_sheets', 'distribute_sheets']), 
  sheetResponseController.getTeamDetailedResponses
);

router.post('/admin/sheets/:sheetId/initialize-responses', 
  auth, 
  requireAnyPermission(['distribute_sheets']), 
  sheetResponseController.initializeTeamResponses
);

module.exports = router;
