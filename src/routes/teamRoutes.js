const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// GET /teams - Get all teams (requires 'read_teams' permission)
router.get('/', authMiddleware, rbacMiddleware('read_teams'), teamController.getAllTeams);

// GET /teams/active - Get only active teams (requires 'read_teams' permission)
router.get('/active', authMiddleware, rbacMiddleware('read_teams'), teamController.getActiveTeams);

// GET /teams/:id - Get team by ID (requires 'read_teams' permission)
router.get('/:id', authMiddleware, rbacMiddleware('read_teams'), teamController.getTeamById);

// GET /teams/:id/members - Get team members (requires 'read_teams' permission)
router.get('/:id/members', authMiddleware, rbacMiddleware('read_teams'), teamController.getTeamMembers);

// POST /teams - Create new team (requires 'create_teams' permission)
router.post('/', authMiddleware, rbacMiddleware('create_teams'), teamController.createTeam);

// PUT /teams/:id - Update team (requires 'update_teams' permission)
router.put('/:id', authMiddleware, rbacMiddleware('update_teams'), teamController.updateTeam);

// DELETE /teams/:id - Delete team (requires 'delete_teams' permission)
router.delete('/:id', authMiddleware, rbacMiddleware('delete_teams'), teamController.deleteTeam);

// POST /teams/:teamId/members/:userId - Add member to team (requires 'manage_team_members' permission)
router.post('/:teamId/members/:userId', authMiddleware, rbacMiddleware('manage_team_members'), teamController.addMemberToTeam);

// DELETE /teams/members/:userId - Remove member from team (requires 'manage_team_members' permission)
router.delete('/members/:userId', authMiddleware, rbacMiddleware('manage_team_members'), teamController.removeMemberFromTeam);

module.exports = router;
