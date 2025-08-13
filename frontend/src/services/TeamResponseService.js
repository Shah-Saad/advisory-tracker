const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class TeamResponseService {
  static getToken() {
    return localStorage.getItem('token');
  }

  // Get team's assigned sheets
  static async getMyTeamSheets() {
    const response = await fetch('/api/team-responses/my-sheets', {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch team sheets');
    }

    return await response.json();
  }

  // Get team sheet entries for response
  static async getTeamSheetEntries(sheetId, teamId) {
    const response = await fetch(`/api/sheets/${sheetId}/team-id/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch team sheet entries');
    }

    const data = await response.json();
    // Extract the responses array from the team sheet data
    return data.responses || [];
  }

  // Update team entry status and comments
  static async updateEntryStatus(responseId, status, comments = '') {
    const response = await fetch(`/api/team-responses/responses/${responseId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, comments })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update entry status');
    }

    return await response.json();
  }

  // Mark entry as completed
  static async markEntryCompleted(responseId, completionData) {
    const response = await fetch(`/api/team-responses/responses/${responseId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(completionData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark entry as completed');
    }

    return await response.json();
  }

  // Mark entire team sheet as completed
  static async markTeamSheetCompleted(sheetId, teamId) {
    const response = await fetch(`/api/team-responses/sheets/${sheetId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completion_notes: 'Team sheet completed by team members' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete team sheet');
    }

    return await response.json();
  }

  // Update team entry (legacy method for backward compatibility)
  static async updateTeamEntry(responseId, updateData) {
    return this.updateEntryStatus(responseId, updateData.status, updateData.comments);
  }

  // Get estimated completion date
  static getEstimatedDate(daysFromNow = 30) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  // Get team progress for a specific team and sheet
  static async getTeamProgress(teamId, sheetId = null) {
    let url = `/api/team-responses/progress/${teamId}`;
    if (sheetId) {
      url += `?sheetId=${sheetId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch team progress');
    }

    return await response.json();
  }
}

export default TeamResponseService;
