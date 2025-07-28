const TeamService = require('../services/TeamService');

const teamController = {
  // Get all teams
  async getAllTeams(req, res) {
    try {
      const teams = await TeamService.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get active teams only
  async getActiveTeams(req, res) {
    try {
      const teams = await TeamService.getActiveTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get team by ID
  async getTeamById(req, res) {
    try {
      const { id } = req.params;
      const team = await TeamService.getTeamById(id);
      res.json(team);
    } catch (error) {
      const statusCode = error.message === 'Team not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Create new team (Admin only)
  async createTeam(req, res) {
    try {
      const team = await TeamService.createTeam(req.body);
      res.status(201).json(team);
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Update team (Admin only)
  async updateTeam(req, res) {
    try {
      const { id } = req.params;
      const team = await TeamService.updateTeam(id, req.body);
      res.json(team);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Team not found') statusCode = 404;
      else if (error.message.includes('already exists')) statusCode = 409;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Delete team (Admin only)
  async deleteTeam(req, res) {
    try {
      const { id } = req.params;
      await TeamService.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Team not found') statusCode = 404;
      else if (error.message.includes('has members')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get team members
  async getTeamMembers(req, res) {
    try {
      const { id } = req.params;
      const members = await TeamService.getTeamMembers(id);
      res.json(members);
    } catch (error) {
      const statusCode = error.message === 'Team not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Add member to team
  async addMemberToTeam(req, res) {
    try {
      const { userId, teamId } = req.params;
      await TeamService.addMemberToTeam(parseInt(userId), parseInt(teamId));
      res.json({ message: 'User added to team successfully' });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Remove member from team
  async removeMemberFromTeam(req, res) {
    try {
      const { userId } = req.params;
      await TeamService.removeMemberFromTeam(parseInt(userId));
      res.json({ message: 'User removed from team successfully' });
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = teamController;

module.exports = teamController;
