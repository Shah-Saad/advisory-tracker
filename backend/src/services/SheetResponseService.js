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
      const db = require('../config/db');
      const teamMemberResult = await db('users as u')
        .join('team_sheets as ts', 'u.team_id', 'ts.team_id')
        .where('u.id', userId)
        .where('ts.id', response.team_sheet_id)
        .select('u.id')
        .first();

      if (!teamMemberResult) {
        throw new Error('User not authorized to edit this response');
      }

      // Update the response
      updateData.updated_by = userId;
      const updatedResponse = await SheetResponse.update(responseId, updateData);

      // Update team sheet status to in_progress if not already
      await db('team_sheets')
        .where('id', response.team_sheet_id)
        .where('status', 'assigned')
        .update({
          status: 'in_progress',
          started_at: db.raw('COALESCE(started_at, CURRENT_TIMESTAMP)'),
          started_by: userId
        });

      // Get team and sheet info for notification
      const notificationData = await db('team_sheets as ts')
        .join('sheets as s', 'ts.sheet_id', 's.id')
        .join('teams as t', 'ts.team_id', 't.id')
        .join('users as u', 'u.id', userId)
        .where('ts.id', response.team_sheet_id)
        .select(
          's.title as sheet_name',
          't.name as team_name',
          'ts.sheet_id',
          'ts.team_id',
          'u.username as updated_by_name'
        )
        .first();

      if (notificationData) {
        const { sheet_name, team_name, sheet_id, team_id, updated_by_name } = notificationData;

        // Send notification to admin about the update
        await NotificationService.createNotification({
          user_id: userId,
          type: 'team_entry_updated',
          title: 'Team Entry Updated',
          message: `${updated_by_name} from ${team_name} team updated an entry in "${sheet_name}"`,
          data: {
            sheet_id,
            team_id,
            response_id: responseId,
            updated_by: userId,
            sheet_name,
            team_name,
            action: 'entry_updated'
          }
        });

        // If entry is marked as completed/patched, send special notification
        if (updateData.status && ['completed', 'patched', 'closed'].includes(updateData.status.toLowerCase())) {
          await NotificationService.createNotification({
            user_id: userId,
            type: 'entry_completed',
            title: 'Entry Marked as Completed',
            message: `${updated_by_name} from ${team_name} team completed patching for an entry in "${sheet_name}"`,
            data: {
              sheet_id,
              team_id,
              response_id: responseId,
              updated_by: userId,
              sheet_name,
              team_name,
              action: 'entry_completed',
              completion_status: updateData.status
            }
          });
        }
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
    console.log('📝 markTeamSheetCompleted called:');
    console.log('  - Sheet ID:', sheetId);
    console.log('  - Team ID:', teamId);
    console.log('  - User ID:', userId);
    
    try {
      const db = require('../config/db');
      
      // Verify user belongs to the team
      const teamMember = await db('users')
        .where({ id: userId, team_id: teamId })
        .first();

      if (!teamMember) {
        throw new Error('User does not belong to this team');
      }
      console.log('✅ User belongs to team');

      // Update team sheet status
      const updatedAssignment = await db('team_sheets')
        .where({ sheet_id: sheetId, team_id: teamId })
        .update({
          status: 'completed',
          completed_at: db.fn.now(),
          completed_by: userId
        })
        .returning('*');

      if (updatedAssignment.length === 0) {
        throw new Error('Team sheet assignment not found');
      }
      console.log('✅ Updated team sheet status to completed');

      // Get notification data
      const notificationData = await db('sheets as s')
        .join('teams as t', 't.id', teamId)
        .join('users as u', 'u.id', userId)
        .where('s.id', sheetId)
        .select(
          's.title as sheet_name',
          's.title as sheet_title', 
          't.name as team_name',
          'u.username as completed_by_name'
        )
        .first();

      if (notificationData) {
        const { sheet_name, sheet_title, team_name, completed_by_name } = notificationData;
        console.log('📧 Creating notifications for sheet completion:', { sheet_title, team_name, completed_by_name });

        // Get all admin users
        const adminUsers = await db('users')
          .join('roles', 'users.role_id', 'roles.id')
          .where('roles.name', 'admin')
          .select('users.id');
        
        console.log(`👥 Found ${adminUsers.length} admin users`);

        // Create notification for each admin
        for (const admin of adminUsers) {
          await NotificationService.createNotification({
            user_id: userId, // User who completed the sheet
            admin_id: admin.id, // Admin who should receive the notification
            type: 'team_sheet_completed',
            title: 'Team Sheet Completed',
            message: `${team_name} team has completed their work on sheet "${sheet_title || sheet_name}" (completed by ${completed_by_name})`,
            data: {
              sheet_id: sheetId,
              team_id: teamId,
              completed_by: userId
            }
          });
          console.log(`✅ Created notification for admin ${admin.id}`);
        }
      }

      return updatedAssignment[0];
    } catch (error) {
      console.error('❌ Error in markTeamSheetCompleted:', error);
      throw new Error(`Failed to mark team sheet as completed: ${error.message}`);
    }
  }

  // Initialize responses when a sheet is assigned to teams
  static async initializeTeamSheetResponses(sheetId, teamIds, assignedBy) {
    try {
      const db = require('../config/db');
      const results = [];

      for (const teamId of teamIds) {
        // Get or create team sheet assignment
        let teamSheet = await db('team_sheets')
          .where({ sheet_id: sheetId, team_id: teamId })
          .first();

        let teamSheetId;
        if (!teamSheet) {
          // Create team sheet assignment
          const newTeamSheet = await db('team_sheets')
            .insert({
              sheet_id: sheetId,
              team_id: teamId,
              status: 'assigned',
              assigned_by: assignedBy
            })
            .returning(['id']);
          teamSheetId = newTeamSheet[0].id;
        } else {
          teamSheetId = teamSheet.id;
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
