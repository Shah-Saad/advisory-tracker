const BaseModel = require('./BaseModel');

class TeamSheet extends BaseModel {
  static tableName = 'team_sheets';

  static async assignSheetToTeam(sheetId, teamId, assignedBy) {
    const existing = await this.findOneBy({ sheet_id: sheetId, team_id: teamId });
    if (existing) {
      throw new Error('Sheet already assigned to this team');
    }

    return this.create({
      sheet_id: sheetId,
      team_id: teamId,
      status: 'assigned',
      assigned_by: assignedBy,
      assigned_at: new Date()
    });
  }

  static async updateAssignmentStatus(sheetId, teamId, status, userId = null) {
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date();
      updateData.completed_by = userId;
    } else if (status === 'in_progress') {
      updateData.started_at = new Date();
      updateData.started_by = userId;
    }

    const db = require('../config/db');
    return db(this.tableName)
      .where({ sheet_id: sheetId, team_id: teamId })
      .update(updateData);
  }

  static async findBySheetId(sheetId) {
    return this.findBy({ sheet_id: sheetId });
  }

  static async findByTeamId(teamId) {
    return this.findBy({ team_id: teamId });
  }

  static async findTeamAssignment(sheetId, teamId) {
    return this.findOneBy({ sheet_id: sheetId, team_id: teamId });
  }

  static async getTeamSheetProgress(teamId) {
    const db = require('../config/db');
    return db(this.tableName)
      .join('sheets', 'team_sheets.sheet_id', 'sheets.id')
      .where('team_sheets.team_id', teamId)
      .select(
        'sheets.*',
        'team_sheets.status as assignment_status',
        'team_sheets.assigned_at',
        'team_sheets.started_at',
        'team_sheets.completed_at'
      )
      .orderBy('sheets.created_at', 'desc');
  }
}

module.exports = TeamSheet;
