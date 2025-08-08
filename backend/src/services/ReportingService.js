const db = require('../config/db');

class ReportingService {
  /**
   * Generate monthly active entries report
   * @param {string} month - Month in YYYY-MM format
   * @param {number} adminId - Admin requesting the report
   */
  static async generateMonthlyActiveEntriesReport(month = null, adminId = null) {
    try {
      // Use current month if none specified
      if (!month) {
        const now = new Date();
        month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }

      console.log(`📊 Generating monthly report for ${month}`);

      // Get all entries that were active during the month
      const activeEntries = await db('sheet_entries as se')
        .leftJoin('sheet_responses as sr', 'se.id', 'sr.original_entry_id')
        .leftJoin('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
        .leftJoin('teams as t', 'ts.team_id', 't.id')
        .select(
          'se.id',
          'se.product_name',
          'se.oem_vendor',
          'se.cve',
          'se.risk_level',
          'se.source',
          'se.deployed_in_ke',
          'se.created_at',
          'sr.status as response_status',
          'sr.comments as team_comments',
          'sr.estimated_completion_date',
          'sr.updated_at as last_team_update',
          't.name as team_name',
          'ts.status as team_sheet_status'
        )
        .where(function() {
          this.where('se.created_at', '>=', `${month}-01`)
            .andWhere('se.created_at', '<', db.raw(`DATE_TRUNC('month', ?::date) + INTERVAL '1 month'`, [`${month}-01`]))
            .orWhere(function() {
              this.whereNull('sr.status')
                .orWhereNotIn('sr.status', ['completed', 'patched', 'closed']);
            });
        })
        .orderBy('se.risk_level', 'desc')
        .orderBy('se.created_at', 'desc');

      // Categorize entries by status
      const reportData = {
        month,
        generated_at: new Date(),
        generated_by: adminId,
        summary: {
          total_active_entries: 0,
          critical_risk: 0,
          high_risk: 0,
          medium_risk: 0,
          low_risk: 0,
          unknown_risk: 0,
          by_team: {},
          by_status: {
            new: 0,
            in_progress: 0,
            pending_patch: 0,
            completed: 0
          }
        },
        entries: activeEntries
      };

      // Process entries for summary
      activeEntries.forEach(entry => {
        reportData.summary.total_active_entries++;

        // Risk level counts
        switch (entry.risk_level?.toLowerCase()) {
          case 'critical':
            reportData.summary.critical_risk++;
            break;
          case 'high':
            reportData.summary.high_risk++;
            break;
          case 'medium':
            reportData.summary.medium_risk++;
            break;
          case 'low':
            reportData.summary.low_risk++;
            break;
          default:
            reportData.summary.unknown_risk++;
        }

        // Team counts
        const teamName = entry.team_name || 'Unassigned';
        if (!reportData.summary.by_team[teamName]) {
          reportData.summary.by_team[teamName] = {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            completed: 0
          };
        }
        reportData.summary.by_team[teamName].total++;
        
        if (entry.risk_level) {
          reportData.summary.by_team[teamName][entry.risk_level.toLowerCase()]++;
        }

        // Status counts
        if (!entry.response_status || entry.response_status === 'new') {
          reportData.summary.by_status.new++;
        } else if (['completed', 'patched', 'closed'].includes(entry.response_status.toLowerCase())) {
          reportData.summary.by_status.completed++;
          reportData.summary.by_team[teamName].completed++;
        } else if (entry.response_status === 'in_progress') {
          reportData.summary.by_status.in_progress++;
        } else {
          reportData.summary.by_status.pending_patch++;
        }
      });

      return reportData;
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw new Error(`Failed to generate monthly report: ${error.message}`);
    }
  }

  /**
   * Get patching progress summary
   */
  static async getPatchingProgressSummary() {
    try {
      const summary = await db('sheet_entries as se')
        .leftJoin('sheet_responses as sr', 'se.id', 'sr.original_entry_id')
        .leftJoin('team_sheets as ts', 'sr.team_sheet_id', 'ts.id')
        .leftJoin('teams as t', 'ts.team_id', 't.id')
        .select(
          db.raw('COUNT(*) as total_entries'),
          db.raw('COUNT(CASE WHEN sr.status IN (?, ?, ?) THEN 1 END) as completed_entries', ['completed', 'patched', 'closed']),
          db.raw('COUNT(CASE WHEN sr.status = ? THEN 1 END) as in_progress_entries', ['in_progress']),
          db.raw('COUNT(CASE WHEN sr.status IS NULL OR sr.status = ? THEN 1 END) as new_entries', ['new']),
          db.raw('COUNT(CASE WHEN se.risk_level = ? THEN 1 END) as critical_risk', ['Critical']),
          db.raw('COUNT(CASE WHEN se.risk_level = ? THEN 1 END) as high_risk', ['High']),
          db.raw('COUNT(CASE WHEN se.risk_level = ? THEN 1 END) as medium_risk', ['Medium']),
          db.raw('COUNT(CASE WHEN se.risk_level = ? THEN 1 END) as low_risk', ['Low'])
        )
        .first();

      // Calculate active entries (not completed)
      const activeEntries = summary.total_entries - summary.completed_entries;

      return {
        total_entries: parseInt(summary.total_entries),
        active_entries: activeEntries,
        completed_entries: parseInt(summary.completed_entries),
        in_progress_entries: parseInt(summary.in_progress_entries),
        new_entries: parseInt(summary.new_entries),
        critical_risk: parseInt(summary.critical_risk),
        high_risk: parseInt(summary.high_risk),
        medium_risk: parseInt(summary.medium_risk),
        low_risk: parseInt(summary.low_risk),
        completion_rate: summary.total_entries > 0 ? 
          ((summary.completed_entries / summary.total_entries) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting patching progress summary:', error);
      throw error;
    }
  }

  /**
   * Get team performance summary
   */
  static async getTeamPerformanceSummary() {
    try {
      const teamStats = await db('teams as t')
        .leftJoin('team_sheets as ts', 't.id', 'ts.team_id')
        .leftJoin('sheet_responses as sr', 'ts.id', 'sr.team_sheet_id')
        .leftJoin('sheet_entries as se', 'sr.original_entry_id', 'se.id')
        .groupBy('t.id', 't.name')
        .select(
          't.id',
          't.name as team_name',
          db.raw('COUNT(DISTINCT ts.id) as assigned_sheets'),
          db.raw('COUNT(DISTINCT CASE WHEN ts.status = ? THEN ts.id END) as completed_sheets', ['completed']),
          db.raw('COUNT(se.id) as total_entries'),
          db.raw('COUNT(CASE WHEN sr.status IN (?, ?, ?) THEN 1 END) as completed_entries', ['completed', 'patched', 'closed']),
          db.raw('COUNT(CASE WHEN se.risk_level = ? THEN 1 END) as critical_entries', ['Critical']),
          db.raw('COUNT(CASE WHEN se.risk_level = ? THEN 1 END) as high_entries', ['High'])
        );

      return teamStats.map(team => ({
        ...team,
        completion_rate: team.total_entries > 0 ? 
          ((team.completed_entries / team.total_entries) * 100).toFixed(1) : 0,
        sheet_completion_rate: team.assigned_sheets > 0 ?
          ((team.completed_sheets / team.assigned_sheets) * 100).toFixed(1) : 0
      }));
    } catch (error) {
      console.error('Error getting team performance summary:', error);
      throw error;
    }
  }
}

module.exports = ReportingService;
