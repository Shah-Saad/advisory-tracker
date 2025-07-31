// Frontend service for team-specific sheet APIs
class TeamSheetService {
  constructor() {
    this.baseURL = '/api/sheets';
    this.getAuthHeaders = () => ({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all sheets with team status summary
  async getAllSheetsWithTeamStatus() {
    try {
      const response = await fetch(`${this.baseURL}/team-status-summary`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sheets with team status:', error);
      throw error;
    }
  }

  // Get team-specific views of a sheet
  async getSheetByTeams(sheetId) {
    try {
      const response = await fetch(`${this.baseURL}/${sheetId}/team-views`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching team views for sheet:', error);
      throw error;
    }
  }

  // Get specific team's version of a sheet
  async getSheetForTeam(sheetId, teamId) {
    try {
      const response = await fetch(`${this.baseURL}/${sheetId}/team/${teamId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sheet for team:', error);
      throw error;
    }
  }

  // Helper method to compare responses across teams
  static compareTeamResponses(teamViews) {
    if (!teamViews || !teamViews.team_versions) return {};

    // Get all unique field names across all teams
    const allFields = new Set();
    teamViews.team_versions.forEach(team => {
      Object.keys(team.responses).forEach(field => allFields.add(field));
    });

    // Create comparison object
    const comparison = {};
    Array.from(allFields).forEach(fieldName => {
      comparison[fieldName] = {};
      teamViews.team_versions.forEach(team => {
        comparison[fieldName][team.team_name] = team.responses[fieldName] || null;
      });
    });

    return comparison;
  }

  // Helper method to get completion statistics
  static getCompletionStats(teamViews) {
    if (!teamViews || !teamViews.team_versions) {
      return {
        totalTeams: 0,
        teamsWithResponses: 0,
        completedTeams: 0,
        completionPercentage: 0
      };
    }

    const totalTeams = teamViews.team_versions.length;
    const teamsWithResponses = teamViews.team_versions.filter(t => t.response_count > 0).length;
    const completedTeams = teamViews.team_versions.filter(t => t.assignment_status === 'completed').length;
    const completionPercentage = totalTeams > 0 ? Math.round((completedTeams / totalTeams) * 100) : 0;

    return {
      totalTeams,
      teamsWithResponses,
      completedTeams,
      completionPercentage
    };
  }

  // Helper method to export team comparison data as CSV
  static exportTeamComparisonCSV(teamViews, sheetTitle) {
    const comparison = this.compareTeamResponses(teamViews);
    const teamNames = teamViews.team_versions.map(t => t.team_name);
    
    // Create CSV headers
    const headers = ['Field Name', ...teamNames];
    const csvRows = [headers.join(',')];

    // Add data rows
    Object.entries(comparison).forEach(([fieldName, teamResponses]) => {
      const row = [fieldName];
      teamNames.forEach(teamName => {
        const response = teamResponses[teamName];
        const value = response ? response.value.replace(/"/g, '""') : '';
        row.push(`"${value}"`);
      });
      csvRows.push(row.join(','));
    });

    // Create downloadable file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${sheetTitle}_team_comparison.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Helper method to get team progress summary
  static getTeamProgressSummary(sheets) {
    if (!sheets || !Array.isArray(sheets)) return {};

    const summary = {
      totalSheets: sheets.length,
      sheetsInProgress: 0,
      sheetsCompleted: 0,
      teamPerformance: {}
    };

    sheets.forEach(sheet => {
      // Count sheet statuses
      if (sheet.teams_completed === sheet.total_teams_assigned) {
        summary.sheetsCompleted++;
      } else if (sheet.teams_with_responses > 0) {
        summary.sheetsInProgress++;
      }

      // Aggregate team performance
      sheet.teams.forEach(team => {
        if (!summary.teamPerformance[team.team_name]) {
          summary.teamPerformance[team.team_name] = {
            totalAssignments: 0,
            completedAssignments: 0,
            responsesSubmitted: 0
          };
        }

        const teamPerf = summary.teamPerformance[team.team_name];
        teamPerf.totalAssignments++;
        
        if (team.status === 'completed') {
          teamPerf.completedAssignments++;
        }
        
        if (team.has_responses) {
          teamPerf.responsesSubmitted++;
        }
      });
    });

    // Calculate completion rates for teams
    Object.keys(summary.teamPerformance).forEach(teamName => {
      const teamPerf = summary.teamPerformance[teamName];
      teamPerf.completionRate = teamPerf.totalAssignments > 0 
        ? Math.round((teamPerf.completedAssignments / teamPerf.totalAssignments) * 100)
        : 0;
    });

    return summary;
  }
}

export default TeamSheetService;
