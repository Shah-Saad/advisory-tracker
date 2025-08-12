const SheetService = require('../services/SheetService');
const SheetEntryService = require('../services/SheetEntryService');

const sheetController = {
  // Get all sheets (Admin only)
  async getAllSheets(req, res) {
    try {
      const sheets = await SheetService.getAllSheets();
      res.json(sheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all sheets with team status (Admin only)
  async getAllSheetsWithTeamStatus(req, res) {
    try {
      const sheets = await SheetService.getAllSheetsWithTeamStatus();
      res.json(sheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get detailed team sheet data (Admin only)
  async getTeamSheetData(req, res) {
    try {
      const { id, teamKey } = req.params;
      
      console.log('🔄 getTeamSheetData called with:', { id, teamKey });
      
      // Get team ID from database based on team name/key
      const db = require('../config/db');
      const team = await db('teams')
        .where('name', 'like', `%${teamKey}%`)
        .orWhere('name', 'ilike', teamKey)
        .first();
      
      console.log('🔍 Found team:', team);
      
      if (!team) {
        console.log('❌ Team not found for key:', teamKey);
        return res.status(400).json({ error: 'Team not found' });
      }
      
      const teamId = team.id;
      console.log('🔍 Using team ID:', { teamKey, teamId, teamName: team.name });
      
      console.log('📞 Calling SheetService.getTeamSheetData...');
      const teamData = await SheetService.getTeamSheetData(id, teamId);
      console.log('✅ SheetService.getTeamSheetData returned:', teamData ? 'success' : 'null');
      
      res.json(teamData);
    } catch (error) {
      console.error('❌ Error in getTeamSheetData:', error);
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get admin live view of all team responses (Admin only)
  async getAdminLiveView(req, res) {
    try {
      const { id } = req.params;
      const liveView = await SheetService.getAdminLiveView(id);
      res.json(liveView);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get sheet progress summary for admin dashboard (Admin only)
  async getSheetProgressSummary(req, res) {
    try {
      const { id } = req.params;
      const summary = await SheetService.getSheetProgressSummary(id);
      res.json(summary);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get real-time updates for a specific team (Admin only)
  async getTeamLiveUpdates(req, res) {
    try {
      const { id, teamId } = req.params;
      const { lastUpdateTime } = req.query;
      
      const updates = await SheetService.getTeamLiveUpdates(id, teamId, lastUpdateTime);
      res.json(updates);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' || error.message === 'Team not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get sheet by ID with assignments
  async getSheetById(req, res) {
    try {
      const { id } = req.params;
      const sheet = await SheetService.getSheetWithAssignments(id);
      res.json(sheet);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Create monthly sheet with file upload (Admin only)
  async createMonthlySheet(req, res) {
    try {
      const createdBy = req.user.id;
      const fileInfo = req.fileInfo; // Set by upload middleware
      
      // Validate required fields
      if (!req.body.title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      if (!req.body.month_year) {
        return res.status(400).json({ error: 'Month year is required (format: YYYY-MM)' });
      }
      
      const result = await SheetService.createMonthlySheet(req.body, createdBy, fileInfo);
      res.status(201).json({
        message: 'Monthly sheet created successfully',
        sheet: result.sheet,
        templateFields: result.templateFields,
        fileProcessed: !!fileInfo,
        totalRows: result.fileData ? result.fileData.totalRows : 0
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('already exists')) statusCode = 409;
      else if (error.message.includes('validation failed') || error.message.includes('required')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Create sheet without file upload (for testing)
  async createBasicSheet(req, res) {
    try {
      const createdBy = req.user.id;
      const result = await SheetService.createMonthlySheet(req.body, createdBy);
      res.status(201).json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('already exists')) statusCode = 409;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Update sheet (Admin only, before distribution)
  async updateSheet(req, res) {
    try {
      const { id } = req.params;
      const sheet = await SheetService.updateSheet(id, req.body);
      res.json(sheet);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Sheet not found') statusCode = 404;
      else if (error.message.includes('distributed')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Distribute sheet to teams (Admin only)
  async distributeSheetToTeams(req, res) {
    try {
      const { id } = req.params;
      const { team_ids } = req.body;
      const distributedBy = req.user.id;

      const assignments = await SheetService.distributeSheetToTeams(id, team_ids, distributedBy);
      res.json({ message: 'Sheet distributed successfully', assignments });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('already distributed')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Distribute sheet to all teams (Admin only)
  async distributeToAllTeams(req, res) {
    try {
      const { id } = req.params;
      const distributedBy = req.user.id;

      const assignments = await SheetService.distributeToAllTeams(id, distributedBy);
      res.json({ message: 'Sheet distributed to all teams successfully', assignments });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('already distributed')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Distribute sheet entries to operational teams (Admin only)
  async distributeSheetToOperationalTeams(req, res) {
    try {
      const { id } = req.params;
      const distributedBy = req.user.id;

      const result = await SheetEntryService.distributeSheetToTeams(id, distributedBy);
      res.json({ 
        message: 'Sheet entries distributed to operational teams successfully', 
        result 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      else if (error.message.includes('No entries found')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get sheets assigned to user's team
  async getMyTeamSheets(req, res) {
    try {
      const user = req.user;
      if (!user.team_id) {
        return res.status(400).json({ error: 'User is not assigned to any team' });
      }

      const { status } = req.query;
      const sheets = await SheetService.getTeamSheets(user.team_id, status);
      res.json(sheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Start working on a team sheet
  async startTeamSheet(req, res) {
    try {
      const { id } = req.params; // sheet ID
      const user = req.user;
      
      if (!user.team_id) {
        return res.status(400).json({ error: 'User is not assigned to any team' });
      }

      await SheetService.startTeamSheet(id, user.team_id, user.id);
      res.json({ message: 'Sheet started successfully' });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not assigned')) statusCode = 404;
      else if (error.message.includes('not in assigned status')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Submit team sheet responses
  async submitTeamSheet(req, res) {
    try {
      const { id } = req.params; // sheet ID
      const { responses } = req.body;
      const user = req.user;
      
      console.log('🚀 Submit team sheet called:');
      console.log('  - Sheet ID:', id);
      console.log('  - User ID:', user.id);
      console.log('  - Team ID:', user.team_id);
      console.log('  - Request body keys:', Object.keys(req.body));
      console.log('  - Responses type:', typeof responses);
      console.log('  - Responses count:', responses ? (Array.isArray(responses) ? responses.length : Object.keys(responses).length) : 0);
      
      if (!user.team_id) {
        return res.status(400).json({ error: 'User is not assigned to any team' });
      }

      const result = await SheetService.submitTeamSheet(id, user.team_id, responses, user.id);
      console.log('✅ Sheet submitted successfully:', result);
      res.json(result);
    } catch (error) {
      console.error('❌ Error submitting team sheet:', error);
      let statusCode = 500;
      if (error.message.includes('not assigned')) statusCode = 404;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get sheet responses (Admin only)
  async getSheetResponses(req, res) {
    try {
      const { id } = req.params;
      const responses = await SheetService.getSheetResponses(id);
      res.json(responses);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Export sheet data (Admin only)
  async exportSheetData(req, res) {
    try {
      const { id } = req.params;
      const data = await SheetService.exportSheetData(id);
      res.json(data);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get current month sheets
  async getCurrentMonthSheets(req, res) {
    try {
      const sheets = await SheetService.getCurrentMonthSheets();
      res.json(sheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get sheets by status
  async getSheetsByStatus(req, res) {
    try {
      const { status } = req.params;
      const sheets = await SheetService.getSheetsByStatus(status);
      res.json(sheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete sheet (Admin only, cascades to all related records)
  async deleteSheet(req, res) {
    try {
      const { id } = req.params;
      const result = await SheetService.deleteSheet(id);
      
      res.json({
        message: 'Sheet and all related records deleted successfully',
        details: {
          sheetId: id,
          deletedEntries: result.deletedEntries,
          deletedTeamSheets: result.deletedTeamSheets
        }
      });
    } catch (error) {
      console.error('Error deleting sheet:', error);
      let statusCode = 500;
      if (error.message === 'Sheet not found') statusCode = 404;
      else if (error.message.includes('distributed')) statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get sheets with filters and pagination (Admin only)
  async getSheetsWithFilters(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const filters = {};
      if (req.query.year) filters.year = parseInt(req.query.year);
      if (req.query.month) filters.month = parseInt(req.query.month);
      if (req.query.status) filters.status = req.query.status;
      if (req.query.title) filters.title = req.query.title;
      if (req.query.month_year) filters.month_year = req.query.month_year;

      const result = await SheetService.getAllSheetsWithFilters(page, limit, filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get filtered sheet data for analysis (Admin only)
  async getFilteredSheetData(req, res) {
    try {
      const { id } = req.params;
      
      const filters = {};
      // Data filters from response_data JSON
      if (req.query.deployed_in_ke !== undefined) {
        filters.deployed_in_ke = req.query.deployed_in_ke;
      }
      if (req.query.product_name) filters.product_name = req.query.product_name;
      if (req.query.location) filters.location = req.query.location;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.team_id) filters.team_id = parseInt(req.query.team_id);
      if (req.query.date_from) filters.date_from = req.query.date_from;
      if (req.query.date_to) filters.date_to = req.query.date_to;

      const result = await SheetService.getFilteredSheetData(id, filters);
      res.json(result);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get monthly sheet summary (Admin only)
  async getMonthlySheetSummary(req, res) {
    try {
      const { year, month } = req.params;
      const result = await SheetService.getMonthlySheetSummary(parseInt(year), parseInt(month));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Export sheet data with filters (Admin only)
  async exportSheetData(req, res) {
    try {
      const { id } = req.params;
      const format = req.query.format || 'json';
      
      const filters = {};
      if (req.query.deployed_in_ke !== undefined) {
        filters.deployed_in_ke = req.query.deployed_in_ke;
      }
      if (req.query.product_name) filters.product_name = req.query.product_name;
      if (req.query.location) filters.location = req.query.location;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.team_id) filters.team_id = parseInt(req.query.team_id);
      if (req.query.date_from) filters.date_from = req.query.date_from;
      if (req.query.date_to) filters.date_to = req.query.date_to;

      const result = await SheetService.exportSheetData(id, filters, format);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      
      if (format === 'csv') {
        res.send(result.data);
      } else {
        res.json(result.data);
      }
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get team-specific sheet views (Admin only)
  async getSheetByTeams(req, res) {
    try {
      const { id } = req.params;
      const teamViews = await SheetService.getSheetByTeams(id);
      res.json(teamViews);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get specific team's version of a sheet (Admin only)
  async getSheetForTeam(req, res) {
    try {
      const { id, teamId } = req.params;
      const teamSheet = await SheetService.getSheetForTeam(id, teamId);
      res.json(teamSheet);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Sheet not found' || error.message === 'Team not found' || error.message === 'Team not assigned to this sheet') {
        statusCode = 404;
      }
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get all sheets with team-specific summary (Admin only)
  async getAllSheetsWithTeamStatus(req, res) {
    try {
      const sheets = await SheetService.getAllSheetsWithTeamStatus();
      res.json(sheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get team sheet data using numeric teamId (for team members)
  async getTeamSheetDataById(req, res) {
    try {
      const { id, teamId } = req.params;
      const teamData = await SheetService.getTeamSheetData(id, parseInt(teamId));
      res.json(teamData);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get detailed team sheet data using teamKey (Admin only)
  async getTeamSheetDataByKey(req, res) {
    try {
      const { id, teamKey } = req.params;
      
      // Map team key to team ID (using correct team IDs from database)
      const teamMap = {
        'generation': 44,
        'distribution': 41,
        'transmission': 42,
        'general': 43
      };
      
      const teamId = teamMap[teamKey.toLowerCase()];
      if (!teamId) {
        return res.status(400).json({ error: 'Invalid team key' });
      }
      
      const teamData = await SheetService.getTeamSheetData(id, teamId);
      res.json(teamData);
    } catch (error) {
      const statusCode = error.message === 'Sheet not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = sheetController;
