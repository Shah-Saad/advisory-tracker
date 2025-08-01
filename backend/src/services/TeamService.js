const Team = require('../models/Team');
const db = require('../config/db');

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

  /**
   * Get the three operational teams (static list)
   */
  static getOperationalTeams() {
    return ['generation', 'distribution', 'transmission'];
  }

  /**
   * Get operational teams from database
   */
  static async getOperationalTeamsFromDB() {
    const teams = await db('teams')
      .whereIn('name', ['generation', 'distribution', 'transmission'])
      .select('*')
      .orderBy('name', 'asc');
    
    return teams;
  }

  /**
   * Get users by team name
   */
  static async getUsersByTeamName(teamName) {
    return await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select(
        'users.id',
        'users.first_name', 
        'users.last_name',
        'users.email',
        'users.team',
        'users.is_active',
        'roles.name as role_name'
      )
      .where('users.team', teamName)
      .where('users.is_active', true);
  }

  /**
   * Get team statistics with entry counts
   */
  static async getTeamStatsWithEntries() {
    try {
      // Get user counts per team
      const userStats = await db('users')
        .select('team')
        .count('* as user_count')
        .where('is_active', true)
        .groupBy('team');

      // Get entry counts per team
      const entryStats = await db('sheet_entries')
        .select('assigned_team as team')
        .count('* as entry_count')
        .whereNotNull('assigned_team')
        .groupBy('assigned_team');

      // Get team definitions
      const teams = await db('teams')
        .whereIn('name', ['generation', 'distribution', 'transmission'])
        .select('*');

      // Combine statistics
      const teamStats = teams.map(team => {
        const userStat = userStats.find(s => s.team === team.name);
        const entryStat = entryStats.find(s => s.team === team.name);
        
        return {
          ...team,
          user_count: userStat ? parseInt(userStat.user_count) : 0,
          entry_count: entryStat ? parseInt(entryStat.entry_count) : 0
        };
      });

      return teamStats;
    } catch (error) {
      console.error('Error getting team statistics:', error);
      throw new Error('Failed to retrieve team statistics');
    }
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
