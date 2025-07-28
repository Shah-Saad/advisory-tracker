const BaseModel = require('./BaseModel');

class SheetResponse extends BaseModel {
  static tableName = 'sheet_responses';

  static async findByTeamSheet(sheetId, teamId) {
    return this.findBy({ sheet_id: sheetId, team_id: teamId });
  }

  static async findBySheetId(sheetId) {
    return this.findBy({ sheet_id: sheetId });
  }

  static async saveTeamResponse(sheetId, teamId, responses, userId) {
    // First, delete existing responses for this team-sheet combination
    await this.deleteTeamResponses(sheetId, teamId);

    // Insert new responses
    const responseData = responses.map(response => ({
      sheet_id: sheetId,
      team_id: teamId,
      field_name: response.field_name,
      field_value: response.field_value,
      field_type: response.field_type || 'text',
      submitted_by: userId,
      submitted_at: new Date()
    }));

    return this.createMany(responseData);
  }

  static async deleteTeamResponses(sheetId, teamId) {
    const db = require('../config/db');
    return db(this.tableName)
      .where({ sheet_id: sheetId, team_id: teamId })
      .del();
  }

  static async createMany(responseArray) {
    const db = require('../config/db');
    return db(this.tableName).insert(responseArray).returning('*');
  }

  static async getSheetResponsesSummary(sheetId) {
    const db = require('../config/db');
    return db(this.tableName)
      .join('teams', 'sheet_responses.team_id', 'teams.id')
      .join('users', 'sheet_responses.submitted_by', 'users.id')
      .where('sheet_responses.sheet_id', sheetId)
      .select(
        'teams.name as team_name',
        'sheet_responses.field_name',
        'sheet_responses.field_value',
        'sheet_responses.field_type',
        'sheet_responses.submitted_at',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as submitted_by_name")
      )
      .orderBy(['teams.name', 'sheet_responses.field_name']);
  }

  static async exportSheetData(sheetId) {
    const db = require('../config/db');
    
    // Get sheet info
    const sheetInfo = await db('sheets').where('id', sheetId).first();
    
    // Get all responses organized by team
    const responses = await db(this.tableName)
      .join('teams', 'sheet_responses.team_id', 'teams.id')
      .where('sheet_responses.sheet_id', sheetId)
      .select(
        'teams.name as team_name',
        'sheet_responses.field_name',
        'sheet_responses.field_value',
        'sheet_responses.field_type',
        'sheet_responses.submitted_at'
      )
      .orderBy(['teams.name', 'sheet_responses.field_name']);

    return {
      sheet: sheetInfo,
      responses: responses
    };
  }
}

module.exports = SheetResponse;
