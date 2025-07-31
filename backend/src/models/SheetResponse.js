const BaseModel = require('./BaseModel');

class SheetResponse extends BaseModel {
  static tableName = 'sheet_responses';

  static async findByTeamSheet(sheetId, teamId) {
    const db = require('../config/db');
    return db(this.tableName)
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .where('team_sheets.sheet_id', sheetId)
      .where('team_sheets.team_id', teamId)
      .select('sheet_responses.*');
  }

  static async findBySheetId(sheetId) {
    const db = require('../config/db');
    return db(this.tableName)
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .where('team_sheets.sheet_id', sheetId)
      .select('sheet_responses.*', 'team_sheets.team_id');
  }

  static async saveTeamResponse(sheetId, teamId, responses, userId) {
    const db = require('../config/db');
    
    // Get the team_sheet_id
    const teamSheet = await db('team_sheets')
      .where({ sheet_id: sheetId, team_id: teamId })
      .first();
    
    if (!teamSheet) {
      throw new Error('Team sheet assignment not found');
    }

    // Delete existing response for this team_sheet_id
    await db(this.tableName)
      .where({ team_sheet_id: teamSheet.id })
      .del();

    // Convert responses array to JSONB object
    const responseData = {};
    responses.forEach(response => {
      responseData[response.field_name] = response.field_value;
    });

    // Insert new response
    return db(this.tableName).insert({
      team_sheet_id: teamSheet.id,
      response_data: responseData,
      status: 'submitted',
      submitted_by: userId,
      submitted_at: new Date()
    }).returning('*');
  }

  static async deleteTeamResponses(sheetId, teamId) {
    const db = require('../config/db');
    return db(this.tableName)
      .whereIn('team_sheet_id', function() {
        this.select('id')
          .from('team_sheets')
          .where({ sheet_id: sheetId, team_id: teamId });
      })
      .del();
  }

  static async createMany(responseArray) {
    const db = require('../config/db');
    return db(this.tableName).insert(responseArray).returning('*');
  }

  static async getSheetResponsesSummary(sheetId) {
    const db = require('../config/db');
    return db(this.tableName)
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .join('users', 'sheet_responses.submitted_by', 'users.id')
      .where('team_sheets.sheet_id', sheetId)
      .select(
        'teams.name as team_name',
        'teams.id as team_id',
        'sheet_responses.response_data',
        'sheet_responses.status',
        'sheet_responses.submitted_at',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as submitted_by_name")
      )
      .orderBy(['teams.name']);
  }

  static async exportSheetData(sheetId) {
    const db = require('../config/db');
    
    // Get sheet info
    const sheetInfo = await db('sheets').where('id', sheetId).first();
    
    // Get all responses organized by team
    const responses = await db(this.tableName)
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .where('team_sheets.sheet_id', sheetId)
      .select(
        'teams.name as team_name',
        'teams.id as team_id',
        'sheet_responses.response_data',
        'sheet_responses.status',
        'sheet_responses.submitted_at'
      )
      .orderBy(['teams.name']);

    return {
      sheet: sheetInfo,
      responses: responses
    };
  }
}

module.exports = SheetResponse;

module.exports = SheetResponse;
