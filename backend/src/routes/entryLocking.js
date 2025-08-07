const express = require('express');
const router = express.Router();
const entryLockingController = require('../controllers/entryLockingController');
const { auth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');

// All routes require authentication
router.use(auth);

// Entry locking routes for team members
router.post('/:entryId/lock', requirePermission('fill_sheets'), entryLockingController.lockEntry);
router.post('/:entryId/unlock', requirePermission('fill_sheets'), entryLockingController.unlockEntry);
router.put('/:entryId/complete', requirePermission('fill_sheets'), entryLockingController.completeEntry);

// Get available entries for a sheet
router.get('/sheet/:sheetId/available', requirePermission('fill_sheets'), entryLockingController.getAvailableEntries);

// Get entries locked by current user
router.get('/my-locked', requirePermission('fill_sheets'), entryLockingController.getMyLockedEntries);

// Admin route to release expired locks
router.post('/release-expired', requirePermission('manage_sheets'), entryLockingController.releaseExpiredLocks);

module.exports = router;
