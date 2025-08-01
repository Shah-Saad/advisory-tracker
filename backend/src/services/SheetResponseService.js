const SheetResponse = require('../models/SheetResponse');
const NotificationService = require('./NotificationService');

class SheetResponseService {
  // Get team-specific sheet entries (their copy to work on)
  static async getTeamSheetEntries(sheetId, teamId, userId) {
    try {
      const db = require('../config/db');
      
      // Check if user belongs to the team
      const teamMember = await db('users')
        .where({ id: userId, team_id: teamId })
        .first();

      if (!teamMember) {
        throw new Error('User does not belong to this team');
      }

      // Get team sheet assignment
      const teamSheet = await db('team_sheets')
        .where({ sheet_id: sheetId, team_id: teamId })
        .first();

      if (!teamSheet) {
        throw new Error('Sheet not assigned to this team');
      }

      const teamSheetId = teamSheet.id;

      // Get or initialize team responses
      let responses = await SheetResponse.findByTeamSheetId(teamSheetId);
      
      if (responses.length === 0) {
        // Initialize responses by copying original entries
        responses = await SheetResponse.initializeTeamResponses(teamSheetId, sheetId);
      }

      return responses;
    } catch (error) {
      throw new Error(`Failed to get team sheet entries: ${error.message}`);
    }
  }

  // Update a specific entry for a team
  static async updateTeamSheetEntry(responseId, updateData, userId) {
    try {
      // Get the response to verify ownership
      const response = await SheetResponse.findById(responseId);
      if (!response) {
        throw new Error('Sheet response not found');
      }

      // Verify user belongs to the team
      const teamMemberResult = await require('../config/db').query(`
        SELECT u.id 
        FROM users u 
        JOIN team_sheets ts ON u.team_id = ts.team_id 
        WHERE u.id = $1 AND ts.id = $2
      `, [userId, response.team_sheet_id]);

      if (teamMemberResult.rows.length === 0) {
        throw new Error('User not authorized to edit this response');
      }

      // Update the response
      updateData.updated_by = userId;
      const updatedResponse = await SheetResponse.update(responseId, updateData);

      // Update team sheet status to in_progress if not already
      await require('../config/db').query(`
        UPDATE team_sheets 
        SET status = 'in_progress', started_at = COALESCE(started_at, CURRENT_TIMESTAMP), started_by = $1
        WHERE id = $2 AND status = 'assigned'
      `, [userId, response.team_sheet_id]);

      // Get team and sheet info for notification
      const notificationData = await require('../config/db').query(`
        SELECT 
          s.name as sheet_name,
          t.name as team_name,
          ts.sheet_id,
          ts.team_id,
          u.username as updated_by_name
        FROM team_sheets ts
        JOIN sheets s ON ts.sheet_id = s.id
        JOIN teams t ON ts.team_id = t.id
        JOIN users u ON u.id = $1
        WHERE ts.id = $2
      `, [userId, response.team_sheet_id]);

      if (notificationData.rows.length > 0) {
        const { sheet_name, team_name, sheet_id, team_id, updated_by_name } = notificationData.rows[0];

        // Send notification to admin about the update
        await NotificationService.createNotification({
          user_id: null, // System notification
          type: 'team_sheet_updated',
          title: 'Team Sheet Entry Updated',
          message: `${updated_by_name} from ${team_name} updated an entry in sheet "${sheet_name}"`,
          data: {
            sheet_id,
            team_id,
            response_id: responseId,
            updated_by: userId
          }
        });
      }

      return updatedResponse;
    } catch (error) {
      throw new Error(`Failed to update team sheet entry: ${error.message}`);
    }
  }

  // Get all team responses for a sheet (admin view)
  static async getAllTeamResponses(sheetId) {
    try {
      const summary = await SheetResponse.getSheetResponsesSummary(sheetId);
      return summary;
    } catch (error) {
      throw new Error(`Failed to get team responses: ${error.message}`);
    }
  }

  // Get detailed responses for a specific team
  static async getTeamDetailedResponses(sheetId, teamId) {
    try {
      const responses = await SheetResponse.findByTeamSheet(sheetId, teamId);
      return responses;
    } catch (error) {
      throw new Error(`Failed to get team detailed responses: ${error.message}`);
    }
  }

  // Mark team responses as completed
  static async markTeamSheetCompleted(sheetId, teamId, userId) {
    try {
      // Verify user belongs to the team
      const teamMemberResult = await require('../config/db').query(
        'SELECT id FROM users WHERE id = $1 AND team_id = $2',
        [userId, teamId]
      );

      if (teamMemberResult.rows.length === 0) {
        throw new Error('User does not belong to this team');
      }

      // Update team sheet status
      const result = await require('../config/db').query(`
        UPDATE team_sheets 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completed_by = $1
        WHERE sheet_id = $2 AND team_id = $3
        RETURNING *
      `, [userId, sheetId, teamId]);

      if (result.rows.length === 0) {
        throw new Error('Team sheet assignment not found');
      }

      // Send notification to admin
      const notificationData = await require('../config/db').query(`
        SELECT 
          s.name as sheet_name,
          t.name as team_name,
          u.username as completed_by_name
        FROM sheets s, teams t, users u
        WHERE s.id = $1 AND t.id = $2 AND u.id = $3
      `, [sheetId, teamId, userId]);

      if (notificationData.rows.length > 0) {
        const { sheet_name, team_name, completed_by_name } = notificationData.rows[0];

        await NotificationService.createNotification({
          user_id: null, // System notification
          type: 'team_sheet_completed',
          title: 'Team Sheet Completed',
          message: `${team_name} has completed their work on sheet "${sheet_name}" (completed by ${completed_by_name})`,
          data: {
            sheet_id: sheetId,
            team_id: teamId,
            completed_by: userId
          }
        });
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to mark team sheet as completed: ${error.message}`);
    }
  }

  // Initialize responses when a sheet is assigned to teams
  static async initializeTeamSheetResponses(sheetId, teamIds, assignedBy) {
    try {
      const results = [];

      for (const teamId of teamIds) {
        // Get or create team sheet assignment
        let teamSheetResult = await require('../config/db').query(
          'SELECT id FROM team_sheets WHERE sheet_id = $1 AND team_id = $2',
          [sheetId, teamId]
        );

        let teamSheetId;
        if (teamSheetResult.rows.length === 0) {
          // Create team sheet assignment
          const newTeamSheet = await require('../config/db').query(`
            INSERT INTO team_sheets (sheet_id, team_id, status, assigned_by)
            VALUES ($1, $2, 'assigned', $3)
            RETURNING id
          `, [sheetId, teamId, assignedBy]);
          teamSheetId = newTeamSheet.rows[0].id;
        } else {
          teamSheetId = teamSheetResult.rows[0].id;
        }

        // Initialize responses for this team
        const responses = await SheetResponse.initializeTeamResponses(teamSheetId, sheetId);
        results.push({
          team_id: teamId,
          team_sheet_id: teamSheetId,
          responses_count: responses.length
        });
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to initialize team sheet responses: ${error.message}`);
    }
  }
}

module.exports = SheetResponseService;
