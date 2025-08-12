const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const NotificationService = require('../services/NotificationService');
const SheetResponse = require('../models/SheetResponse');
const User = require('../models/User');
const Team = require('../models/Team');
const db = require('../config/db');

// Get team's assigned sheet entries
router.get('/sheets/:sheetId/entries', auth, async (req, res) => {
  try {
    const { sheetId } = req.params;
    const userId = req.user.id;

    // Get user's team
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('team');

    if (!user || !user.team) {
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    // Get team's sheet responses for this sheet
    // Note: sheet_responses doesn't have team_id directly, need to join through team_sheets
    const responses = await db('sheet_responses')
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .where('team_sheets.sheet_id', sheetId)
      .where('team_sheets.team_id', user.team.id)
      .select('sheet_responses.*')
      .orderBy('sheet_responses.created_at', 'desc');

    // Format response data
    const formattedResponses = responses.map(response => ({
      id: response.id,
      sheet_id: response.sheet_id,
      team_id: response.team_id,
      status: response.status,
      comments: response.comments,
      completion_notes: response.completion_notes,
      patch_applied_date: response.patch_applied_date,
      estimated_completion_date: response.estimated_completion_date,
      updated_at: response.updated_at,
      created_at: response.created_at,
      
      // Original entry data
      product_name: response.originalEntry?.product_name,
      vendor_name: response.originalEntry?.vendor_name,
      oem_vendor: response.originalEntry?.oem_vendor,
      cve: response.originalEntry?.cve,
      original_risk_level: response.originalEntry?.risk_level,
      source: response.originalEntry?.source,
      original_site: response.originalEntry?.site,
      
      // Sheet information
      sheet_name: response.sheet?.name
    }));

    res.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching team sheet entries:', error);
    res.status(500).json({ error: 'Failed to fetch team sheet entries' });
  }
});

// Update team entry status and comments
router.put('/responses/:responseId/status', auth, async (req, res) => {
  try {
    const { responseId } = req.params;
    const updateData = req.body; // Accept all form data, not just specific fields
    const userId = req.user.id;
    const teamId = req.user.team_id;

    if (!teamId) {
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    // Verify the response belongs to the user's team
    const response = await db('sheet_responses')
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .where('sheet_responses.id', responseId)
      .andWhere('team_sheets.team_id', teamId)
      .select('sheet_responses.*')
      .first();

    if (!response) {
      return res.status(404).json({ error: 'Response not found or access denied' });
    }

    // Filter and validate the update data - only include columns that actually exist
    const allowedFields = [
      'status', 'current_status', 'deployed_in_ke', 'vendor_contact_date',
      'patching_est_release_date', 'implementation_date', 'estimated_completion_date',
      'vendor_contacted', 'compensatory_controls_provided', 'compensatory_controls_details',
      'estimated_time', 'comments', 'site'
    ];

    const filteredUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        // Convert empty strings to null for database compatibility
        filteredUpdateData[key] = updateData[key] === "" ? null : updateData[key];
      }
    });

    // Add updated_by and timestamp
    filteredUpdateData.updated_by = userId;
    filteredUpdateData.updated_at = db.fn.now();

    // Update the response
    const updatedResponse = await SheetResponse.update(responseId, filteredUpdateData);

    // Create notification for admins about any update activity
    try {
      const responseWithDetails = await db('sheet_responses as sr')
        .join('sheet_entries as se', 'sr.original_entry_id', 'se.id')
        .join('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
        .join('teams as t', 'ts.team_id', 't.id')
        .join('sheets as s', 'ts.sheet_id', 's.id')
        .join('users as u', 'u.id', userId)
        .where('sr.id', responseId)
        .select(
          'se.product_name',
          't.name as team_name',
          's.title as sheet_title',
          'u.username as updated_by_name'
        )
        .first();

      if (responseWithDetails) {
        // Create notification for any update
        await NotificationService.createNotification({
          user_id: userId,
          type: 'team_response_updated',
          title: 'Team Response Updated',
          message: `${responseWithDetails.updated_by_name} from ${responseWithDetails.team_name} updated "${responseWithDetails.product_name}" in sheet "${responseWithDetails.sheet_title}"`,
          data: {
            response_id: responseId,
            team_id: teamId,
            team_name: responseWithDetails.team_name,
            sheet_id: response.sheet_id,
            product_name: responseWithDetails.product_name,
            action: 'response_updated',
            updated_fields: Object.keys(filteredUpdateData).filter(key => !['updated_by', 'updated_at'].includes(key))
          }
        });

        // Create special notification for significant status changes
        if (updateData.status && ['in_progress', 'pending_patch', 'completed'].includes(updateData.status.toLowerCase())) {
          await NotificationService.createNotification({
            user_id: userId,
            type: 'team_status_changed',
            title: `Status Changed to ${updateData.status}`,
            message: `${responseWithDetails.updated_by_name} from ${responseWithDetails.team_name} changed status to "${updateData.status}" for "${responseWithDetails.product_name}"`,
            data: {
              response_id: responseId,
              team_id: teamId,
              team_name: responseWithDetails.team_name,
              sheet_id: response.sheet_id,
              product_name: responseWithDetails.product_name,
              action: 'status_changed',
              new_status: updateData.status
            }
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to create update notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json(updatedResponse);
  } catch (error) {
    console.error('Error updating response status:', error);
    res.status(500).json({ error: 'Failed to update response status' });
  }
});

// Save draft - accepts all form fields
router.put('/responses/:responseId/draft', auth, async (req, res) => {
  try {
    console.log('🔄 Draft save request received:', {
      responseId: req.params.responseId,
      body: req.body,
      userId: req.user.id,
      teamId: req.user.team_id
    });

    const { responseId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const teamId = req.user.team_id;

    if (!teamId) {
      console.log('❌ No team ID found for user');
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    // Verify the response belongs to the user's team
    const response = await db('sheet_responses')
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .where('sheet_responses.id', responseId)
      .andWhere('team_sheets.team_id', teamId)
      .select('sheet_responses.*')
      .first();

    console.log('🔍 Found response:', response);

    if (!response) {
      console.log('❌ Response not found or access denied');
      return res.status(404).json({ error: 'Response not found or access denied' });
    }

    // Filter and validate the update data
    const allowedFields = [
      'status', 'current_status', 'deployed_in_ke', 'vendor_contact_date',
      'patching_est_release_date', 'implementation_date', 'estimated_completion_date',
      'vendor_contacted', 'compensatory_controls_provided', 'compensatory_controls_details',
      'estimated_time', 'comments', 'site'
    ];

    const filteredUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        // Convert empty strings to null for database compatibility
        filteredUpdateData[key] = updateData[key] === "" ? null : updateData[key];
      }
    });

    console.log('🔧 Filtered update data:', filteredUpdateData);

    // Add updated_by and timestamp
    filteredUpdateData.updated_by = userId;
    filteredUpdateData.updated_at = db.fn.now();

    console.log('📝 Final update data:', filteredUpdateData);

    // Update the response using direct database query instead of model
    try {
      const result = await db('sheet_responses')
        .where('id', responseId)
        .update(filteredUpdateData)
        .returning('*');
      
      const updatedResponse = result[0];
      console.log('✅ Response updated successfully:', updatedResponse);

      // Update team sheet status to in_progress if not already
      await db('team_sheets')
        .where('id', response.team_sheet_id)
        .where('status', 'assigned')
        .update({
          status: 'in_progress',
          started_at: db.raw('COALESCE(started_at, CURRENT_TIMESTAMP)'),
          started_by: userId
        });

      // Create notification for admins about draft activity
      try {
        // Get basic response details without joining sheet_entries (in case original_entry_id doesn't exist)
        const responseWithDetails = await db('sheet_responses as sr')
          .join('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
          .join('teams as t', 'ts.team_id', 't.id')
          .join('sheets as s', 'ts.sheet_id', 's.id')
          .join('users as u', 'u.id', userId)
          .where('sr.id', responseId)
          .select(
            't.name as team_name',
            's.title as sheet_title',
            'u.username as updated_by_name'
          )
          .first();

        if (responseWithDetails) {
          await NotificationService.createNotification({
            user_id: userId,
            type: 'team_draft_saved',
            title: 'Team Draft Saved',
            message: `${responseWithDetails.updated_by_name} from ${responseWithDetails.team_name} saved a draft in sheet "${responseWithDetails.sheet_title}"`,
            data: {
              response_id: responseId,
              team_id: teamId,
              team_name: responseWithDetails.team_name,
              sheet_id: response.sheet_id,
              action: 'draft_saved'
            }
          });
        }
      } catch (notificationError) {
        console.error('Failed to create draft notification:', notificationError);
        // Don't fail the request if notification fails
      }

      res.json(updatedResponse);
    } catch (updateError) {
      console.error('❌ Failed to update response:', updateError);
      res.status(500).json({ error: 'Failed to update response' });
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// Mark team entry as completed
router.put('/responses/:responseId/complete', auth, async (req, res) => {
  try {
    const { responseId } = req.params;
    const { comments, completion_notes, patch_applied_date } = req.body;
    const userId = req.user.id;

    // Get user's team
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('team');

    if (!user || !user.team) {
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    // Verify the response belongs to the user's team
    const response = await SheetResponse.query()
      .findById(responseId)
      .where('team_id', user.team.id);

    if (!response) {
      return res.status(404).json({ error: 'Response not found or access denied' });
    }

    // Update the response as completed
    const updatedResponse = await SheetResponse.update(responseId, {
        status: 'completed',
        comments: comments !== undefined ? comments : response.comments,
        completion_notes: completion_notes || response.completion_notes,
        patch_applied_date: patch_applied_date || new Date().toISOString().split('T')[0]
      });

    // Create notification for admins
    try {
      const responseWithDetails = await SheetResponse.query()
        .findById(responseId)
        .withGraphFetched('[originalEntry, sheet, team]');

      await NotificationService.createNotification({
        title: `Entry Completed: ${responseWithDetails.originalEntry?.product_name || 'Entry'}`,
        message: `Team "${responseWithDetails.team?.name}" marked entry as completed for sheet "${responseWithDetails.sheet?.name}"`,
        type: 'entry_completed',
        data: {
          response_id: responseId,
          team_id: user.team.id,
          team_name: user.team.name,
          sheet_id: response.sheet_id,
          product_name: responseWithDetails.originalEntry?.product_name,
          cve: responseWithDetails.originalEntry?.cve,
          completion_notes: completion_notes,
          patch_applied_date: patch_applied_date
        }
      });
    } catch (notificationError) {
      console.error('Failed to create completion notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json(updatedResponse);
  } catch (error) {
    console.error('Error marking response as completed:', error);
    res.status(500).json({ error: 'Failed to mark response as completed' });
  }
});

// Mark entire team sheet as completed
router.put('/sheets/:sheetId/complete', auth, async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { completion_notes } = req.body;
    const userId = req.user.id;

    // Get user's team
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('team');

    if (!user || !user.team) {
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    await SheetResponse.transaction(async (trx) => {
      // Get all team responses for this sheet
      const responses = await SheetResponse.query(trx)
        .where('sheet_id', sheetId)
        .where('team_id', user.team.id);

      if (responses.length === 0) {
        throw new Error('No responses found for this team and sheet');
      }

      // Update all responses to completed status
      await SheetResponse.query(trx)
        .where('sheet_id', sheetId)
        .where('team_id', user.team.id)
        .patch({
          status: 'completed',
          completion_notes: completion_notes || 'Bulk completion by team',
          patch_applied_date: new Date().toISOString().split('T')[0],
          updated_at: new Date()
        });

      // Create notification for admins
      try {
        const sheet = await SheetResponse.query(trx)
          .where('sheet_id', sheetId)
          .where('team_id', user.team.id)
          .first()
          .withGraphFetched('sheet');

        await NotificationService.createNotification({
          title: `Team Sheet Completed: ${sheet?.sheet?.name || 'Sheet'}`,
          message: `Team "${user.team.name}" has completed all entries for sheet "${sheet?.sheet?.name}". Total entries: ${responses.length}`,
          type: 'team_sheet_completed',
          data: {
            sheet_id: sheetId,
            team_id: user.team.id,
            team_name: user.team.name,
            sheet_name: sheet?.sheet?.name,
            total_entries: responses.length,
            completion_notes: completion_notes
          }
        });
      } catch (notificationError) {
        console.error('Failed to create sheet completion notification:', notificationError);
        // Don't fail the request if notification fails
      }
    });

    res.json({ 
      success: true, 
      message: `All entries for sheet marked as completed by team ${user.team.name}` 
    });
  } catch (error) {
    console.error('Error completing team sheet:', error);
    res.status(500).json({ error: error.message || 'Failed to complete team sheet' });
  }
});

// Admin: Unlock team sheet (reset from completed back to in_progress)
router.put('/admin/sheets/:sheetId/teams/:teamId/unlock', auth, async (req, res) => {
  try {
    const { sheetId, teamId } = req.params;
    const { reason = 'Admin decision' } = req.body;
    const userId = req.user.id;

    // Check if user is admin
    const user = await db('users').where('id', userId).first();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Verify the team sheet assignment exists
    const teamSheet = await db('team_sheets')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .where('team_sheets.sheet_id', sheetId)
      .where('team_sheets.team_id', teamId)
      .select('team_sheets.*', 'teams.name as team_name')
      .first();

    if (!teamSheet) {
      return res.status(404).json({ error: 'Team sheet assignment not found' });
    }

    // Only allow unlocking if status is 'completed'
    if (teamSheet.status !== 'completed') {
      return res.status(400).json({ error: 'Can only unlock completed sheets' });
    }

    // Update team sheet status back to in_progress
    await db('team_sheets')
      .where('id', teamSheet.id)
      .update({
        status: 'in_progress',
        completed_at: null,
        updated_at: db.fn.now()
      });

    // Create notification for the team about the unlock
    try {
      // Create database notifications for team members (no email)
      const teamMembers = await db('users').where('team_id', teamId).select('id');
      
      for (const member of teamMembers) {
        await NotificationService.createNotification({
          user_id: member.id,
          type: 'sheet_unlocked',
          title: 'Sheet Unlocked',
          message: `Your sheet "${teamSheet.sheet_title || 'Sheet'}" has been unlocked by an administrator. You can now continue working on it.`,
          data: {
            sheet_id: sheetId,
            team_id: teamId,
            team_name: teamSheet.team_name,
            unlocked_by: user.username,
            reason: reason,
            action: 'sheet_unlocked'
          }
        });
      }

      // Create notification for other admins about the unlock action
      const otherAdmins = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .where('roles.name', 'admin')
        .where('users.id', '!=', userId)
        .select('users.id');

      for (const admin of otherAdmins) {
        await NotificationService.createNotification({
          user_id: userId, // The admin who performed the unlock
          admin_id: admin.id, // The admin who should receive the notification
          type: 'admin_sheet_unlocked',
          title: 'Sheet Unlocked by Admin',
          message: `${user.username} unlocked sheet for ${teamSheet.team_name} team. Reason: ${reason}`,
          data: {
            sheet_id: sheetId,
            team_id: teamId,
            team_name: teamSheet.team_name,
            unlocked_by: user.username,
            reason: reason,
            action: 'admin_sheet_unlocked'
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to create unlock notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({
      message: 'Sheet unlocked successfully',
      team_sheet_id: teamSheet.id,
      team_name: teamSheet.team_name,
      new_status: 'in_progress',
      unlocked_by: user.username,
      unlock_reason: reason
    });

  } catch (error) {
    console.error('Error unlocking team sheet:', error);
    res.status(500).json({ error: 'Failed to unlock team sheet' });
  }
});

// Get team's assigned sheets
router.get('/my-sheets', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's team
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('team');

    if (!user || !user.team) {
      return res.status(400).json({ error: 'User is not assigned to a team' });
    }

    // Get team's sheet assignments with progress information
    const teamSheets = await SheetResponse.query()
      .select('sheet_id')
      .where('team_id', user.team.id)
      .groupBy('sheet_id')
      .withGraphFetched('sheet')
      .modifyGraph('sheet', builder => {
        builder.select('id', 'name', 'description', 'created_at', 'status');
      });

    // Get progress information for each sheet
    const sheetsWithProgress = await Promise.all(
      teamSheets.map(async (teamSheet) => {
        const responses = await SheetResponse.query()
          .where('sheet_id', teamSheet.sheet_id)
          .where('team_id', user.team.id);

        const completedResponses = responses.filter(r => 
          ['completed', 'patched', 'closed'].includes(r.status?.toLowerCase())
        );

        return {
          id: teamSheet.sheet_id,
          name: teamSheet.sheet?.name,
          description: teamSheet.sheet?.description,
          created_at: teamSheet.sheet?.created_at,
          status: teamSheet.sheet?.status,
          total_entries: responses.length,
          completed_entries: completedResponses.length,
          is_completed: completedResponses.length === responses.length && responses.length > 0
        };
      })
    );

    res.json(sheetsWithProgress);
  } catch (error) {
    console.error('Error fetching team sheets:', error);
    res.status(500).json({ error: 'Failed to fetch team sheets' });
  }
});

// Get team progress summary
router.get('/progress/:teamId?', auth, requireRole('admin'), async (req, res) => {
  try {
    const { teamId } = req.params;
    
    let teamsQuery = Team.query().withGraphFetched('users');
    
    if (teamId) {
      teamsQuery = teamsQuery.where('id', teamId);
    }
    
    const teams = await teamsQuery;
    
    const teamProgress = await Promise.all(
      teams.map(async (team) => {
        const responses = await SheetResponse.query()
          .where('team_id', team.id)
          .withGraphFetched('sheet');

        const completedResponses = responses.filter(r => 
          ['completed', 'patched', 'closed'].includes(r.status?.toLowerCase())
        );

        const groupedBySheet = responses.reduce((acc, response) => {
          if (!acc[response.sheet_id]) {
            acc[response.sheet_id] = {
              sheet_name: response.sheet?.name,
              total: 0,
              completed: 0
            };
          }
          acc[response.sheet_id].total++;
          if (['completed', 'patched', 'closed'].includes(response.status?.toLowerCase())) {
            acc[response.sheet_id].completed++;
          }
          return acc;
        }, {});

        return {
          team_id: team.id,
          team_name: team.name,
          total_entries: responses.length,
          completed_entries: completedResponses.length,
          progress_percentage: responses.length > 0 ? 
            Math.round((completedResponses.length / responses.length) * 100) : 0,
          sheets: Object.values(groupedBySheet),
          member_count: team.users?.length || 0
        };
      })
    );

    res.json(teamProgress);
  } catch (error) {
    console.error('Error fetching team progress:', error);
    res.status(500).json({ error: 'Failed to fetch team progress' });
  }
});

module.exports = router;
