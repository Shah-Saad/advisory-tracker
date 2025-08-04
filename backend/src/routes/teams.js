const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { auth } = require('../middlewares/auth');
const { requirePermission, requireAnyPermission } = require('../middlewares/rbac');
const SheetEntryService = require('../services/SheetEntryService');
const TeamService = require('../services/TeamService');

// All team routes require authentication
router.use(auth);

// View teams (available to all authenticated users)
router.get('/', requireAnyPermission(['manage_teams', 'view_teams']), teamController.getAllTeams);
router.get('/active', requireAnyPermission(['manage_teams', 'view_teams']), teamController.getActiveTeams);

// Operational teams endpoints
router.get('/operational', async (req, res) => {
  try {
    const teams = TeamService.getOperationalTeams();
    res.json(teams);
  } catch (error) {
    console.error('Error getting operational teams:', error);
    res.status(500).json({ error: 'Failed to get operational teams' });
  }
});

// Get team statistics for admin monitoring
router.get('/stats', requirePermission('manage_teams'), async (req, res) => {
  try {
    const teamStats = await SheetEntryService.getAllTeamStats();
    res.json(teamStats);
  } catch (error) {
    console.error('Error getting team statistics:', error);
    res.status(500).json({ error: 'Failed to get team statistics' });
  }
});

// Get entries by team (for team members and admins)
router.get('/:teamName/entries', async (req, res) => {
  try {
    const { teamName } = req.params;
    const { user } = req;
    
    // Check if user has permission to view this team's entries
    if (user.role !== 'admin' && user.team !== teamName) {
      return res.status(403).json({ error: 'You can only view entries for your own team' });
    }

    const filters = {
      search: req.query.search,
      status: req.query.status,
      vendor: req.query.vendor,
      deployed_in_ke: req.query.deployed_in_ke,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'id',
      sortOrder: req.query.sortOrder || 'asc'
    };

    const entries = await SheetEntryService.getEntriesByTeam(teamName, filters);
    res.json(entries);
  } catch (error) {
    console.error(`Error getting entries for team ${req.params.teamName}:`, error);
    res.status(500).json({ error: `Failed to get entries for team ${req.params.teamName}` });
  }
});

// Admin monitoring endpoint - get all team entries
router.get('/admin/monitoring', requirePermission('manage_teams'), async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      vendor: req.query.vendor,
      deployed_in_ke: req.query.deployed_in_ke
    };

    const teamData = await SheetEntryService.getEntriesForAdminMonitoring(filters);
    res.json(teamData);
  } catch (error) {
    console.error('Error getting entries for admin monitoring:', error);
    res.status(500).json({ error: 'Failed to get entries for admin monitoring' });
  }
});

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
