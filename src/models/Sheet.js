const BaseModel = require('./BaseModel');

class Sheet extends BaseModel {
  static tableName = 'sheets';

  // Get all sheets with pagination and filters
  static async getAll(page = 1, limit = 10, filters = {}) {
    const db = require('../config/db');
    const offset = (page - 1) * limit;
    
    let query = db(this.tableName)
      .select('sheets.*', 'users.username as uploaded_by_username')
      .leftJoin('users', 'sheets.uploaded_by', 'users.id');

    // Apply filters
    if (filters.month_year) {
      query = query.where('sheets.month_year', filters.month_year);
    }
    
    if (filters.status) {
      query = query.where('sheets.status', filters.status);
    }
    
    if (filters.year) {
      query = query.whereRaw('EXTRACT(YEAR FROM sheets.month_year) = ?', [filters.year]);
    }
    
    if (filters.month) {
      query = query.whereRaw('EXTRACT(MONTH FROM sheets.month_year) = ?', [filters.month]);
    }

    if (filters.title) {
      query = query.where('sheets.title', 'ILIKE', `%${filters.title}%`);
    }

    const sheets = await query
      .orderBy('sheets.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    // Count total with same filters
    let countQuery = db(this.tableName).count('id as count');
    if (filters.month_year) {
      countQuery = countQuery.where('month_year', filters.month_year);
    }
    if (filters.status) {
      countQuery = countQuery.where('status', filters.status);
    }
    if (filters.year) {
      countQuery = countQuery.whereRaw('EXTRACT(YEAR FROM month_year) = ?', [filters.year]);
    }
    if (filters.month) {
      countQuery = countQuery.whereRaw('EXTRACT(MONTH FROM month_year) = ?', [filters.month]);
    }
    if (filters.title) {
      countQuery = countQuery.where('title', 'ILIKE', `%${filters.title}%`);
    }
    
    const total = await countQuery.first();
    
    return {
      data: sheets,
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    };
  }

  // Get sheet responses with data filtering
  static async getSheetResponsesWithFilters(sheetId, filters = {}) {
    const db = require('../config/db');
    
    let query = db('sheet_responses')
      .join('team_sheets', 'sheet_responses.team_sheet_id', 'team_sheets.id')
      .join('teams', 'team_sheets.team_id', 'teams.id')
      .join('users', 'sheet_responses.submitted_by', 'users.id')
      .select(
        'sheet_responses.*',
        'teams.name as team_name',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .where('team_sheets.sheet_id', sheetId)
      .where('sheet_responses.status', 'submitted');

    // Apply data filters on response_data JSON field
    if (filters.deployed_in_ke !== undefined) {
      query = query.whereRaw(`sheet_responses.response_data->>'deployed_in_ke' = ?`, [filters.deployed_in_ke]);
    }

    if (filters.product_name) {
      query = query.whereRaw(`sheet_responses.response_data->>'product_name' ILIKE ?`, [`%${filters.product_name}%`]);
    }

    if (filters.team_id) {
      query = query.where('teams.id', filters.team_id);
    }

    if (filters.status) {
      query = query.whereRaw(`sheet_responses.response_data->>'status' = ?`, [filters.status]);
    }

    // Add more filters as needed for your specific data structure
    if (filters.location) {
      query = query.whereRaw(`sheet_responses.response_data->>'location' ILIKE ?`, [`%${filters.location}%`]);
    }

    if (filters.date_from) {
      query = query.whereRaw(`sheet_responses.response_data->>'date' >= ?`, [filters.date_from]);
    }

    if (filters.date_to) {
      query = query.whereRaw(`sheet_responses.response_data->>'date' <= ?`, [filters.date_to]);
    }

    return await query.orderBy('sheet_responses.submitted_at', 'desc');
  }

  static async findByMonth(year, month) {
    return this.findBy({ year, month });
  }

  static async findByTeamAndMonth(teamId, year, month) {
    const db = require('../config/db');
    return db('team_sheets')
      .join('sheets', 'team_sheets.sheet_id', 'sheets.id')
      .where({
        'team_sheets.team_id': teamId,
        'sheets.year': year,
        'sheets.month': month
      })
      .select('sheets.*', 'team_sheets.status as assignment_status', 'team_sheets.assigned_at', 'team_sheets.completed_at')
      .first();
  }

  static async findWithAssignments(sheetId) {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('team_sheets', 'sheets.id', 'team_sheets.sheet_id')
      .leftJoin('teams', 'team_sheets.team_id', 'teams.id')
      .select(
        'sheets.*',
        'teams.name as team_name',
        'team_sheets.status as assignment_status',
        'team_sheets.assigned_at',
        'team_sheets.completed_at'
      )
      .where('sheets.id', sheetId);
  }

  static async getCurrentMonthSheets() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return this.findByMonth(year, month);
  }

  static async getSheetsByStatus(status) {
    return this.findBy({ status });
  }
}

module.exports = Sheet;
