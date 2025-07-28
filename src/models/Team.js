const BaseModel = require('./BaseModel');

class Team extends BaseModel {
  static tableName = 'teams';

  static async findByName(name) {
    return this.findOneBy({ name });
  }

  static async findActiveTeams() {
    return this.findBy({ status: 'active' });
  }

  static async getTeamMembers(teamId) {
    const db = require('../config/db');
    return db('users')
      .where('team_id', teamId)
      .select('id', 'first_name', 'last_name', 'email', 'status');
  }

  static async addMemberToTeam(userId, teamId) {
    const db = require('../config/db');
    return db('users')
      .where('id', userId)
      .update({ team_id: teamId });
  }

  static async removeMemberFromTeam(userId) {
    const db = require('../config/db');
    return db('users')
      .where('id', userId)
      .update({ team_id: null });
  }
}

module.exports = Team;
