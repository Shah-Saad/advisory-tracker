const db = require('../config/db');

class SheetResponse {
  static async findAll() {
    const result = await db.query('SELECT * FROM sheet_responses ORDER BY created_at DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM sheet_responses WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByTeamSheetId(teamSheetId) {
    const result = await db('sheet_responses as sr')
      .join('sheet_entries as se', 'sr.original_entry_id', 'se.id')
      .select('sr.*', 'se.product_name as original_product_name', 'se.site as original_site')
      .where('sr.team_sheet_id', teamSheetId)
      .orderBy('sr.id');
    return result;
  }

  static async findByTeamSheetAndEntry(teamSheetId, originalEntryId) {
    const result = await db.query(
      'SELECT * FROM sheet_responses WHERE team_sheet_id = $1 AND original_entry_id = $2',
      [teamSheetId, originalEntryId]
    );
    return result.rows[0];
  }

  static async findByTeamSheet(sheetId, teamId) {
    const results = await db('sheet_responses as sr')
      .join('sheet_entries as se', 'sr.original_entry_id', 'se.id')
      .join('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
      .where('ts.sheet_id', sheetId)
      .where('ts.team_id', teamId)
      .select(
        'sr.*',
        'se.product_name',
        'se.oem_vendor as vendor_name',
        'se.cve',
        'se.source',
        'se.risk_level as original_risk_level',
        'se.site as original_site',
        'ts.id as team_sheet_id'
      )
      .orderBy('sr.id');
    
    return results;
  }

  static async create(responseData) {
    const {
      team_sheet_id,
      original_entry_id,
      status,
      current_status,
      deployed_in_ke,
      vendor_contact_date,
      patching_est_release_date,
      implementation_date,
      estimated_completion_date,
      vendor_contacted,
      compensatory_controls_provided,
      compensatory_controls_details,
      estimated_time,
      comments,
      updated_by
    } = responseData;

    const result = await db.query(`
      INSERT INTO sheet_responses (
        team_sheet_id, original_entry_id, status, current_status, deployed_in_ke,
        vendor_contact_date, patching_est_release_date, implementation_date,
        estimated_completion_date, vendor_contacted, compensatory_controls_provided,
        compensatory_controls_details, estimated_time, comments, updated_by,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        NOW(), NOW()
      ) RETURNING *
    `, [
      team_sheet_id, original_entry_id, status, current_status, deployed_in_ke,
      vendor_contact_date, patching_est_release_date, implementation_date,
      estimated_completion_date, vendor_contacted, compensatory_controls_provided,
      compensatory_controls_details, estimated_time, comments, updated_by
    ]);

    return result.rows[0];
  }

  static async update(id, responseData) {
    const fields = [];
    const values = [];
    let paramCounter = 1;

    // Build dynamic update query
    Object.keys(responseData).forEach(key => {
      if (responseData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCounter}`);
        values.push(responseData[key]);
        paramCounter++;
      }
    });

    // Always update the updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE sheet_responses 
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM sheet_responses WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Initialize team responses when a sheet is assigned to a team
  static async initializeTeamResponses(teamSheetId, sheetId) {
    // Check if responses already exist
    const existingResponses = await this.findByTeamSheetId(teamSheetId);
    if (existingResponses.length > 0) {
      return existingResponses; // Already initialized
    }

    // Get all original entries for this sheet
    const originalEntries = await db('sheet_entries')
      .where('sheet_id', sheetId)
      .orderBy('id');

    // Create initial responses for each entry (only team-modifiable fields)
    const responses = [];
    for (const entry of originalEntries) {
      const responseData = {
        team_sheet_id: teamSheetId,
        original_entry_id: entry.id,
        status: entry.status || 'New',
        current_status: entry.current_status || 'New',
        deployed_in_ke: entry.deployed_in_ke || 'Unknown',
        vendor_contact_date: entry.vendor_contact_date,
        patching_est_release_date: entry.patching_est_release_date,
        implementation_date: entry.implementation_date,
        estimated_completion_date: entry.estimated_completion_date,
        vendor_contacted: entry.vendor_contacted || 'N',
        compensatory_controls_provided: entry.compensatory_controls_provided || 'N',
        compensatory_controls_details: entry.compensatory_controls_details,
        estimated_time: entry.estimated_time,
        comments: entry.comments,
        updated_by: null, // Will be set when team member actually updates
        created_at: new Date(),
        updated_at: new Date()
      };

      const [result] = await db('sheet_responses')
        .insert(responseData)
        .returning('*');

      responses.push(result);
    }

    return responses;
  }

  static async saveTeamResponse(sheetId, teamId, responses, userId) {
    try {
      // Get the team_sheet assignment
      const teamSheet = await db('team_sheets')
        .where({ sheet_id: sheetId, team_id: teamId })
        .first();
      
      if (!teamSheet) {
        throw new Error('Team sheet assignment not found');
      }

      // Save the responses as a JSON blob (simple implementation)
      const responseData = {
        team_sheet_id: teamSheet.id,
        response_data: JSON.stringify(responses),
        submitted_by: userId,
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      // Insert or update the response
      const existingResponse = await db('team_sheet_responses')
        .where('team_sheet_id', teamSheet.id)
        .first();

      if (existingResponse) {
        // Update existing response
        await db('team_sheet_responses')
          .where('team_sheet_id', teamSheet.id)
          .update({
            response_data: responseData.response_data,
            submitted_by: userId,
            submitted_at: new Date(),
            updated_at: new Date()
          });
      } else {
        // Create new response
        await db('team_sheet_responses').insert(responseData);
      }

      return { success: true, message: 'Team response saved successfully' };
    } catch (error) {
      console.error('Error saving team response:', error);
      throw error;
    }
  }

  static async getSheetResponsesSummary(sheetId) {
    try {
      const result = await db('team_sheets as ts')
        .join('teams as t', 'ts.team_id', 't.id')
        .leftJoin('team_sheet_responses as tsr', 'ts.id', 'tsr.team_sheet_id')
        .select(
          't.name as team_name',
          't.id as team_id',
          'ts.status as team_status',
          'ts.assigned_at',
          'ts.completed_at',
          'tsr.response_data',
          'tsr.submitted_at',
          'tsr.submitted_by'
        )
        .where('ts.sheet_id', sheetId)
        .orderBy('t.name');
      
      return result;
    } catch (error) {
      console.error('Error getting sheet responses summary:', error);
      throw error;
    }
  }
}

module.exports = SheetResponse;
