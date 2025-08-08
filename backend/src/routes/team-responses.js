const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const NotificationService = require('../services/NotificationService');
const SheetResponse = require('../models/SheetResponse');
const User = require('../models/User');
const Team = require('../models/Team');

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
    const responses = await SheetResponse.query()
      .where('sheet_id', sheetId)
      .where('team_id', user.team.id)
      .withGraphFetched('[originalEntry, sheet]')
      .orderBy('created_at', 'desc');

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
    const { status, comments, estimated_completion_date } = req.body;
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

    // Update the response
    const updatedResponse = await SheetResponse.query()
      .patchAndFetchById(responseId, {
        status: status || response.status,
        comments: comments !== undefined ? comments : response.comments,
        estimated_completion_date: estimated_completion_date || response.estimated_completion_date,
        updated_at: new Date()
      });

    // Create notification for admins if status changed to significant states
    if (status && ['in_progress', 'pending_patch', 'completed'].includes(status.toLowerCase())) {
      try {
        const responseWithDetails = await SheetResponse.query()
          .findById(responseId)
          .withGraphFetched('[originalEntry, sheet, team]');

        await NotificationService.createNotification({
          title: `Team Response Updated: ${responseWithDetails.originalEntry?.product_name || 'Entry'}`,
          message: `Team "${responseWithDetails.team?.name}" updated entry status to "${status}" for sheet "${responseWithDetails.sheet?.name}"`,
          type: 'team_response_update',
          data: {
            response_id: responseId,
            team_id: user.team.id,
            team_name: user.team.name,
            sheet_id: response.sheet_id,
            status: status,
            product_name: responseWithDetails.originalEntry?.product_name,
            cve: responseWithDetails.originalEntry?.cve
          }
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.json(updatedResponse);
  } catch (error) {
    console.error('Error updating response status:', error);
    res.status(500).json({ error: 'Failed to update response status' });
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
    const updatedResponse = await SheetResponse.query()
      .patchAndFetchById(responseId, {
        status: 'completed',
        comments: comments !== undefined ? comments : response.comments,
        completion_notes: completion_notes || response.completion_notes,
        patch_applied_date: patch_applied_date || new Date().toISOString().split('T')[0],
        updated_at: new Date()
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
          progress_percentage: responses.length > 0 ? 
            Math.round((completedResponses.length / responses.length) * 100) : 0,
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
