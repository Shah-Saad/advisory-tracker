const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middlewares/auth');
const { requirePermission, requireAnyPermission } = require('../middlewares/rbac');

// All team routes require authentication
router.use(auth);

// View teams (available to all authenticated users)
router.get('/', requireAnyPermission(['manage_teams', 'view_teams']), teamController.getAllTeams);
router.get('/active', requireAnyPermission(['manage_teams', 'view_teams']), teamController.getActiveTeams);

// Admin-only team management
router.post('/', requirePermission('manage_teams'), teamController.createTeam);
router.get('/:id', requireAnyPermission(['manage_teams', 'view_teams']), teamController.getTeamById);
router.put('/:id', requirePermission('manage_teams'), teamController.updateTeam);
router.delete('/:id', requirePermission('manage_teams'), teamController.deleteTeam);

// Team member management (Admin only)
router.get('/:id/members', requireAnyPermission(['manage_teams', 'manage_users']), teamController.getTeamMembers);
router.post('/:teamId/members/:userId', requirePermission('manage_teams'), teamController.addMemberToTeam);
router.delete('/members/:userId', requirePermission('manage_teams'), teamController.removeMemberFromTeam);

module.exports = router;
