const Team = require('../models/Team');

class TeamService {
  static async getAllTeams() {
    return await Team.findAll();
  }

  static async getActiveTeams() {
    return await Team.findActiveTeams();
  }

  static async getTeamById(id) {
    const team = await Team.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }
    return team;
  }

  static async createTeam(teamData) {
    // Check if team with same name already exists
    const existingTeam = await Team.findByName(teamData.name);
    if (existingTeam) {
      throw new Error('Team with this name already exists');
    }

    return await Team.create({
      ...teamData,
      status: 'active'
    });
  }

  static async updateTeam(id, teamData) {
    // Check if team exists
    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      throw new Error('Team not found');
    }

    // Check if name is being changed and if new name conflicts
    if (teamData.name && teamData.name !== existingTeam.name) {
      const conflictingTeam = await Team.findByName(teamData.name);
      if (conflictingTeam) {
        throw new Error('Team with this name already exists');
      }
    }

    return await Team.update(id, teamData);
  }

  static async deleteTeam(id) {
    // Check if team exists
    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      throw new Error('Team not found');
    }

    // Check if team has members
    const members = await Team.getTeamMembers(id);
    if (members.length > 0) {
      throw new Error('Cannot delete team that has members');
    }

    return await Team.delete(id);
  }

  static async getTeamMembers(teamId) {
    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    return await Team.getTeamMembers(teamId);
  }

  static async addMemberToTeam(userId, teamId) {
    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Verify user exists
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await Team.addMemberToTeam(userId, teamId);
  }

  static async removeMemberFromTeam(userId) {
    // Verify user exists
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await Team.removeMemberFromTeam(userId);
  }

  static async initializeDefaultTeams() {
    const defaultTeams = [
      {
        name: 'Distribution',
        description: 'Distribution team responsible for distribution-related advisory sheets',
        status: 'active'
      },
      {
        name: 'Transmission',
        description: 'Transmission team responsible for transmission-related advisory sheets',
        status: 'active'
      },
      {
        name: 'General',
        description: 'General team responsible for general advisory sheets',
        status: 'active'
      }
    ];

    const createdTeams = [];
    for (const teamData of defaultTeams) {
      try {
        const existingTeam = await Team.findByName(teamData.name);
        if (!existingTeam) {
          const team = await Team.create(teamData);
          createdTeams.push(team);
        }
      } catch (error) {
        console.error(`Error creating team ${teamData.name}:`, error.message);
      }
    }

    return createdTeams;
  }
}

module.exports = TeamService;
