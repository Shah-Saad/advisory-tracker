const Sheet = require('../models/Sheet');
const Team = require('../models/Team');
const TeamSheet = require('../models/TeamSheet');
const SheetResponse = require('../models/SheetResponse');
const SheetResponseService = require('./SheetResponseService');
const FileProcessingService = require('./FileProcessingService');

class SheetService {
  static async getAllSheets() {
    return await Sheet.findAll();
  }

  static async getSheetById(id) {
    const sheet = await Sheet.findById(id);
    if (!sheet) {
      throw new Error('Sheet not found');
    }
    return sheet;
  }

  static async getSheetWithAssignments(id) {
    const assignments = await Sheet.findWithAssignments(id);
    if (!assignments || assignments.length === 0) {
      throw new Error('Sheet not found');
    }
    return assignments;
  }

  static async createMonthlySheet(sheetData, createdBy, fileInfo = null) {
    const { title, description, month_year } = sheetData;

    // Validate month_year format (YYYY-MM-DD or YYYY-MM)
    const monthYearDate = new Date(month_year);
    if (isNaN(monthYearDate.getTime())) {
      throw new Error('Invalid month_year format. Use YYYY-MM-DD or YYYY-MM');
    }

    // Check if sheet for this month already exists
    const existingSheets = await Sheet.getAll(1, 100, { 
      month_year: month_year.length === 7 ? `${month_year}-01` : month_year 
    });
    
    if (existingSheets.data.length > 0) {
      throw new Error(`Sheet for ${month_year} already exists`);
    }

    let processedFileData = null;
    let templateFields = [];

    // Process uploaded file if provided
    if (fileInfo) {
      try {
        processedFileData = await FileProcessingService.processSheetFile(
          fileInfo.path, 
          fileInfo.extension
        );

        // Validate file structure
        const validation = FileProcessingService.validateSheetStructure(processedFileData);
        if (!validation.isValid) {
          throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
        }

        templateFields = processedFileData.templateFields;
      } catch (error) {
        throw new Error(`File processing failed: ${error.message}`);
      }
    } else {
      // Use default template fields if no file uploaded
      templateFields = [
        { name: 'product_name', label: 'Product Name', type: 'text', required: true },
        { name: 'location', label: 'Location', type: 'text', required: true },
        { name: 'deployed_in_ke', label: 'Deployed in KE?', type: 'select', options: ['Yes', 'No'], required: true },
        { name: 'installation_date', label: 'Installation Date', type: 'date', required: false },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Pending'], required: true },
        { name: 'cost', label: 'Cost', type: 'number', required: false },
        { name: 'vendor', label: 'Vendor', type: 'text', required: false },
        { name: 'notes', label: 'Notes', type: 'textarea', required: false }
      ];
    }

    const sheetRecord = await Sheet.create({
      title,
      description,
      file_name: fileInfo ? fileInfo.originalName : null,
      file_path: fileInfo ? fileInfo.path : null,
      file_type: fileInfo ? fileInfo.extension.replace('.', '') : null,
      month_year: month_year.length === 7 ? `${month_year}-01` : month_year,
      uploaded_by: createdBy,
      status: 'draft'
    });

    // Save individual entries to database if file was processed
    let savedEntries = null;
    if (processedFileData && processedFileData.rows.length > 0) {
      try {
        const SheetEntryService = require('./SheetEntryService');
        savedEntries = await SheetEntryService.saveSheetEntries(sheetRecord.id, processedFileData);
        console.log(`✅ Saved ${savedEntries.count} entries to database for sheet ${sheetRecord.id}`);
      } catch (entryError) {
        console.error('Error saving entries to database:', entryError.message);
        // Don't fail the whole operation if entry saving fails
      }
    }

    // Automatically distribute to all three teams (Generation, Distribution, Transmission)
    try {
      const assignments = await this.distributeToAllTeams(sheetRecord.id, createdBy);
      console.log(`✅ Sheet ${sheetRecord.id} automatically distributed to all teams:`, assignments.length);
    } catch (distributionError) {
      console.error('Error auto-distributing sheet to teams:', distributionError.message);
      // Don't fail the creation if distribution fails
    }

    return {
      sheet: sheetRecord,
      fileData: processedFileData,
      templateFields: templateFields,
      savedEntries: savedEntries
    };
  }

  static async updateSheet(id, sheetData) {
    const existingSheet = await Sheet.findById(id);
    if (!existingSheet) {
      throw new Error('Sheet not found');
    }

    // Don't allow updating if sheet is already distributed
    if (existingSheet.status === 'distributed') {
      throw new Error('Cannot update sheet that has been distributed');
    }

    if (sheetData.template_fields) {
      sheetData.template_fields = JSON.stringify(sheetData.template_fields);
    }

    return await Sheet.update(id, sheetData);
  }

  static async distributeSheetToTeams(sheetId, teamIds, distributedBy) {
    const sheet = await Sheet.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    if (sheet.status === 'distributed') {
      throw new Error('Sheet has already been distributed');
    }

    // Verify all teams exist
    for (const teamId of teamIds) {
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }
    }

    // Assign sheet to each team
    const assignments = [];
    for (const teamId of teamIds) {
      try {
        const assignment = await TeamSheet.assignSheetToTeam(sheetId, teamId, distributedBy);
        assignments.push(assignment);
      } catch (error) {
        // Continue if already assigned
        if (!error.message.includes('already assigned')) {
          throw error;
        }
      }
    }

    // Update sheet status to distributed
    await Sheet.update(sheetId, { 
      status: 'distributed',
      distributed_at: new Date()
    });

    return assignments;
  }

  static async distributeToAllTeams(sheetId, distributedBy) {
    const activeTeams = await Team.findActiveTeams();
    const teamIds = activeTeams.map(team => team.id);
    
    return await this.distributeSheetToTeams(sheetId, teamIds, distributedBy);
  }

  static async getTeamSheets(teamId, status = null) {
    let assignments = await TeamSheet.getTeamSheetProgress(teamId);
    
    if (status) {
      assignments = assignments.filter(assignment => assignment.assignment_status === status);
    }
    
    return assignments;
  }

  static async startTeamSheet(sheetId, teamId, userId) {
    const assignment = await TeamSheet.findTeamAssignment(sheetId, teamId);
    if (!assignment) {
      throw new Error('Sheet not assigned to this team');
    }

    if (assignment.status !== 'assigned') {
      throw new Error('Sheet is not in assigned status');
    }

    return await TeamSheet.updateAssignmentStatus(sheetId, teamId, 'in_progress', userId);
  }

  static async submitTeamSheet(sheetId, teamId, responses, userId) {
    console.log('🔄 SheetService.submitTeamSheet called:');
    console.log('  - Sheet ID:', sheetId);
    console.log('  - Team ID:', teamId);
    console.log('  - User ID:', userId);
    console.log('  - Responses type:', typeof responses);
    console.log('  - Responses value:', responses);
    
    const assignment = await TeamSheet.findTeamAssignment(sheetId, teamId);
    if (!assignment) {
      throw new Error('Sheet not assigned to this team');
    }
    console.log('✅ Found team assignment:', assignment);

    // Validate responses parameter
    if (!responses) {
      throw new Error('No responses provided');
    }

    // Convert responses to array format if it's an object
    let responsesArray = [];
    if (Array.isArray(responses)) {
      responsesArray = responses;
    } else if (typeof responses === 'object') {
      // Convert object format { "entryId": responseData } to array format
      responsesArray = Object.entries(responses).map(([entryId, responseData]) => ({
        original_entry_id: parseInt(entryId),
        ...responseData
      }));
    } else {
      throw new Error('Invalid responses format. Expected array or object.');
    }

    console.log(`💾 Processing ${responsesArray.length} responses...`);

    // Get team sheet ID for saving responses
    const db = require('../config/db');
    const teamSheet = await db('team_sheets')
      .where({ sheet_id: sheetId, team_id: teamId })
      .first();

    if (!teamSheet) {
      throw new Error('Team sheet assignment not found');
    }

    // Save each individual response to sheet_responses table
    console.log(`💾 Saving ${responsesArray.length} responses to database...`);
    for (const response of responsesArray) {
      // Handle object format where entry ID is key and response is value
      let entryId, responseData;
      
      if (response && response.original_entry_id) {
        // Array format: [{ original_entry_id: 123, ...responseData }]
        entryId = response.original_entry_id;
        responseData = response;
      } else if (response && response.entryId) {
        // Alternative format: [{ entryId: 123, ...responseData }]
        entryId = response.entryId;
        responseData = response;
      } else {
        console.log('⚠️ Skipping invalid response (missing entry ID):', response);
        continue;
      }

      // Map frontend field names to database column names (using actual existing columns)
      const fieldMapping = {
        'current_status': 'current_status',
        'comments': 'comments',
        'risk_level': 'risk_level',
        'patching': 'comments', // Map patching info to comments since no dedicated field
        'patching_est_release_date': 'patching_est_release_date',
        'implementation_date': 'implementation_date',
        'vendor_contacted': 'vendor_contacted',
        'vendor_contact_date': 'vendor_contact_date',
        'compensatory_controls_provided': 'compensatory_controls_provided',
        'compensatory_controls_details': 'compensatory_controls_details',
        'estimated_time': 'estimated_time'
      };

      // Transform response data to match database schema
      const dbResponseData = {};
      Object.keys(responseData).forEach(key => {
        if (key === 'original_entry_id') {
          return; // Skip this as it's handled separately
        }
        
        const dbColumnName = fieldMapping[key] || key;
        
        // Only include fields that actually exist in the current database schema
        const actualValidColumns = [
          'product_name', 'vendor_name', 'oem_vendor', 'site', 'status', 'current_status',
          'deployed_in_ke', 'risk_level', 'cve', 'date', 'vendor_contact_date',
          'patching_est_release_date', 'implementation_date', 'estimated_completion_date',
          'resolution_date', 'vendor_contacted', 'compensatory_controls_provided',
          'compensatory_controls_details', 'estimated_time', 'comments'
        ];
        
        if (actualValidColumns.includes(dbColumnName)) {
          // Convert empty strings to null for database compatibility
          let processedValue = responseData[key];
          if (processedValue === "" || processedValue === null || processedValue === undefined) {
            processedValue = null;
          }
          dbResponseData[dbColumnName] = processedValue;
        }
      });

      console.log(`📝 Mapped response for entry ${entryId}:`, Object.keys(dbResponseData));

      // Check if response already exists
      const existingResponse = await db('sheet_responses')
        .where({
          team_sheet_id: teamSheet.id,
          original_entry_id: entryId
        })
        .first();

      if (existingResponse) {
        // Update existing response
        await db('sheet_responses')
          .where('id', existingResponse.id)
          .update({
            ...dbResponseData,
            updated_by: userId,
            updated_at: db.fn.now()
          });
        console.log(`✅ Updated response for entry ${entryId}`);
      } else {
        // Create new response
        await db('sheet_responses')
          .insert({
            team_sheet_id: teamSheet.id,
            original_entry_id: entryId,
            ...dbResponseData,
            updated_by: userId,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
          });
        console.log(`✅ Created new response for entry ${entryId}`);
      }
    }
    console.log('✅ Saved team responses');

    // Mark as completed and create notification
    const SheetResponseService = require('./SheetResponseService');
    await SheetResponseService.markTeamSheetCompleted(sheetId, teamId, userId);
    console.log('✅ Marked sheet as completed and created notifications');

    return { message: 'Sheet submitted successfully' };
  }

  static async getSheetResponses(sheetId) {
    const sheet = await Sheet.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    return await SheetResponse.getSheetResponsesSummary(sheetId);
  }

  static async exportSheetData(sheetId) {
    const sheet = await Sheet.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    return await SheetResponse.exportSheetData(sheetId);
  }

  static async getCurrentMonthSheets() {
    return await Sheet.getCurrentMonthSheets();
  }

  static async getSheetsByStatus(status) {
    return await Sheet.getSheetsByStatus(status);
  }

  static async deleteSheet(id) {
    const db = require('../config/db');
    
    // Use a transaction to ensure all deletions succeed or fail together
    return await db.transaction(async (trx) => {
      const existingSheet = await Sheet.findById(id);
      if (!existingSheet) {
        throw new Error('Sheet not found');
      }

      // Check if sheet has been distributed to teams
      const teamSheets = await trx('team_sheets').where('sheet_id', id);
      if (teamSheets.length > 0) {
        console.log(`Sheet ${id} has been distributed to ${teamSheets.length} teams, cleaning up...`);
        
        // Delete all sheet responses first (cascade should handle this, but explicit cleanup)
        for (const teamSheet of teamSheets) {
          await trx('sheet_responses').where('team_sheet_id', teamSheet.id).del();
        }
        
        // Delete team sheet assignments
        await trx('team_sheets').where('sheet_id', id).del();
      }

      // Delete all sheet entries associated with this sheet
      const deletedEntries = await trx('sheet_entries').where('sheet_id', id).del();
      console.log(`Deleted ${deletedEntries} sheet entries for sheet ${id}`);

      // Finally delete the main sheet record
      const deletedCount = await trx('sheets').where('id', id).del();
      
      if (deletedCount === 0) {
        throw new Error('Sheet could not be deleted');
      }

      console.log(`Successfully deleted sheet ${id} and all related records`);
      return { 
        success: true, 
        deletedSheet: true,
        deletedEntries,
        deletedTeamSheets: teamSheets.length
      };
    });
  }

  static async getTeamSheetDetails(sheetId, teamId) {
    const sheet = await Sheet.findByTeamAndMonth(teamId, null, null); // Will need to adjust this
    if (!sheet) {
      throw new Error('Sheet not found for this team');
    }

    const responses = await SheetResponse.findByTeamSheet(sheetId, teamId);
    
    return {
      sheet,
      responses
    };
  }

  // Get all sheets with pagination and filters
  static async getAllSheetsWithFilters(page = 1, limit = 10, filters = {}) {
    try {
      return await Sheet.getAll(page, limit, filters);
    } catch (error) {
      throw new Error(`Failed to get sheets: ${error.message}`);
    }
  }

  // Get filtered sheet responses for admin analysis
  static async getFilteredSheetData(sheetId, filters = {}) {
    try {
      const sheet = await Sheet.findById(sheetId);
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      const responses = await Sheet.getSheetResponsesWithFilters(sheetId, filters);
      
      // Add summary statistics
      const summary = {
        total_responses: responses.length,
        teams_responded: [...new Set(responses.map(r => r.team_name))].length,
        deployed_in_ke_yes: responses.filter(r => 
          r.response_data && r.response_data.deployed_in_ke === 'Yes'
        ).length,
        deployed_in_ke_no: responses.filter(r => 
          r.response_data && r.response_data.deployed_in_ke === 'No'
        ).length
      };

      return {
        sheet,
        responses,
        summary,
        filters_applied: filters
      };
    } catch (error) {
      throw new Error(`Failed to get filtered sheet data: ${error.message}`);
    }
  }

  // Get monthly sheet summary for admin dashboard
  static async getMonthlySheetSummary(year, month) {
    try {
      const sheets = await Sheet.getAll(1, 100, { year, month });
      
      const summary = {
        total_sheets: sheets.data.length,
        completed_sheets: sheets.data.filter(s => s.status === 'completed').length,
        in_progress_sheets: sheets.data.filter(s => s.status === 'in_progress').length,
        distributed_sheets: sheets.data.filter(s => s.status === 'distributed').length
      };

      return {
        year,
        month,
        sheets: sheets.data,
        summary
      };
    } catch (error) {
      throw new Error(`Failed to get monthly summary: ${error.message}`);
    }
  }

  // Export sheet data with applied filters
  static async exportSheetData(sheetId, filters = {}, format = 'json') {
    try {
      const data = await this.getFilteredSheetData(sheetId, filters);
      
      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(data.responses);
        return {
          data: csv,
          filename: `sheet_${sheetId}_export_${new Date().toISOString().split('T')[0]}.csv`,
          contentType: 'text/csv'
        };
      }
      
      return {
        data: data,
        filename: `sheet_${sheetId}_export_${new Date().toISOString().split('T')[0]}.json`,
        contentType: 'application/json'
      };
    } catch (error) {
      throw new Error(`Failed to export sheet data: ${error.message}`);
    }
  }

  // Helper method to convert data to CSV
  static convertToCSV(responses) {
    if (!responses.length) return '';
    
    // Get all possible keys from response_data
    const allKeys = new Set();
    responses.forEach(response => {
      if (response.response_data) {
        Object.keys(response.response_data).forEach(key => allKeys.add(key));
      }
    });
    
    const headers = ['team_name', 'username', 'submitted_at', ...Array.from(allKeys)];
    
    const rows = responses.map(response => {
      const row = {
        team_name: response.team_name,
        username: response.username,
        submitted_at: response.submitted_at
      };
      
      // Add response data fields
      if (response.response_data) {
        allKeys.forEach(key => {
          row[key] = response.response_data[key] || '';
        });
      }
      
      return headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  // Get sheet with team-specific versions (Admin only)
  static async getSheetByTeams(sheetId) {
    try {
      console.log('🔍 getSheetByTeams called for sheet:', sheetId);
      
      // Get the basic sheet information
      const sheet = await this.getSheetById(sheetId);
      console.log('✅ Found sheet:', sheet.title);
      
      // Get all teams that have this sheet assigned
      const db = require('../config/db');
      const teamAssignments = await db('team_sheets')
        .join('teams', 'team_sheets.team_id', 'teams.id')
        .where('team_sheets.sheet_id', sheetId)
        .select(
          'teams.id as team_id',
          'teams.name as team_name',
          'team_sheets.status',
          'team_sheets.assigned_at',
          'team_sheets.completed_at'
        );

      console.log(`📋 Found ${teamAssignments.length} team assignments`);

      // Get responses for each team
      const teamViews = await Promise.all(
        teamAssignments.map(async (assignment) => {
          console.log(`🔎 Getting responses for team ${assignment.team_name} (ID: ${assignment.team_id})`);
          
          const responses = await SheetResponseService.getTeamDetailedResponses(sheetId, assignment.team_id);
          console.log(`📊 Found ${responses.length} responses for team ${assignment.team_name}`);
          
          return {
            team_id: assignment.team_id,
            team_name: assignment.team_name,
            assignment_status: assignment.status,
            assigned_at: assignment.assigned_at,
            completed_at: assignment.completed_at,
            responses: responses,
            response_count: responses.length
          };
        })
      );

      console.log('✅ getSheetByTeams completed successfully');
      
      return {
        sheet: sheet,
        team_versions: teamViews,
        total_teams: teamViews.length
      };
    } catch (error) {
      console.error('❌ Error in getSheetByTeams:', error);
      throw error;
    }
  }

  // Get specific team's version of a sheet (Admin only)
  static async getSheetForTeam(sheetId, teamId) {
    // Verify sheet exists
    const sheet = await this.getSheetById(sheetId);
    
    // Verify team assignment
    const db = require('../config/db');
    const assignment = await db('team_sheets')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .where({
        'team_sheets.sheet_id': sheetId,
        'team_sheets.team_id': teamId
      })
      .select(
        'teams.id as team_id',
        'teams.name as team_name',
        'team_sheets.status',
        'team_sheets.assigned_at',
        'team_sheets.completed_at'
      )
      .first();

    if (!assignment) {
      throw new Error('Team not assigned to this sheet');
    }

    // Get team's responses
    const responses = await SheetResponse.findByTeamSheet(sheetId, teamId);
    
    // Process response data from JSONB format
    let responseMap = {};
    let responseCount = 0;
    
    if (responses.length > 0) {
      const response = responses[0]; // Should be only one response per team
      if (response.response_data) {
        responseMap = response.response_data;
        responseCount = Object.keys(response.response_data).length;
      }
    }

    return {
      sheet: sheet,
      team: {
        team_id: assignment.team_id,
        team_name: assignment.team_name,
        assignment_status: assignment.status,
        assigned_at: assignment.assigned_at,
        completed_at: assignment.completed_at
      },
      responses: responseMap,
      response_count: responseCount
    };
  }

  // Get all sheets with team-specific status summary (Admin only)
  static async getAllSheetsWithTeamStatus() {
    const db = require('../config/db');
    
    // Get all sheets with basic info
    const sheets = await Sheet.findAll();
    
    // For each sheet, get team assignment summary
    const sheetsWithTeamStatus = await Promise.all(
      sheets.map(async (sheet) => {
        // Get team assignments for this sheet
        const teamAssignments = await db('team_sheets')
          .join('teams', 'team_sheets.team_id', 'teams.id')
          .where('team_sheets.sheet_id', sheet.id)
          .select(
            'teams.id as team_id',
            'teams.name as team_name',
            'team_sheets.status',
            'team_sheets.assigned_at',
            'team_sheets.completed_at'
          );

        // Get response counts for each team
        const teamSummary = await Promise.all(
          teamAssignments.map(async (assignment) => {
            const responseCount = await db('sheet_responses')
              .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
              .where({
                'team_sheets.sheet_id': sheet.id,
                'team_sheets.team_id': assignment.team_id
              })
              .count('* as count')
              .first();

            return {
              team_id: assignment.team_id,
              team_name: assignment.team_name,
              status: assignment.status,
              assigned_at: assignment.assigned_at,
              completed_at: assignment.completed_at,
              response_count: parseInt(responseCount.count),
              has_responses: parseInt(responseCount.count) > 0
            };
          })
        );

        return {
          ...sheet,
          teams: teamSummary,
          total_teams_assigned: teamSummary.length,
          teams_with_responses: teamSummary.filter(t => t.has_responses).length,
          teams_completed: teamSummary.filter(t => t.status === 'completed').length
        };
      })
    );

    return sheetsWithTeamStatus;
  }

  static async getTeamSheetData(sheetId, teamId) {
    const sheet = await Sheet.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    // Get team assignment details
    const assignment = await TeamSheet.findTeamAssignment(sheetId, teamId);
    if (!assignment) {
      throw new Error('Team not assigned to this sheet');
    }

    // Get team responses using the correct method
    const responses = await SheetResponse.findByTeamSheet(sheetId, teamId);

    return {
      sheet,
      assignment,
      responses,
      response_count: responses.length,
      completion_percentage: assignment.completion_percentage || 0
    };
  }
}

module.exports = SheetService;
