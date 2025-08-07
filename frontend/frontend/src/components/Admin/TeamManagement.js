// Team Management Dashboard Component for Admin Users
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/api';
import './TeamManagement.css';

const TeamManagement = () => {
  const [teamStats, setTeamStats] = useState([]);
  const [teamEntries, setTeamEntries] = useState({});
  const [selectedTeam, setSelectedTeam] = useState('');
  const [users, setUsers] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributionLoading, setDistributionLoading] = useState(false);
  const [showUserAssignment, setShowUserAssignment] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [newTeam, setNewTeam] = useState('');

  const operationalTeams = ['generation', 'distribution', 'transmission'];

  useEffect(() => {
    fetchTeamData();
    fetchUsers();
    fetchSheets();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team statistics
      const statsResponse = await apiClient.get('/admin/teams/stats');
      // Ensure teamStats is always an array
      setTeamStats(Array.isArray(statsResponse.data) ? statsResponse.data : []);

      // Fetch team entries for monitoring
      const entriesResponse = await apiClient.get('/admin/teams/monitoring');
      // Ensure teamEntries is always an object
      setTeamEntries(entriesResponse.data || {});

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to fetch team data');
      // Set default empty values on error
      setTeamStats([]);
      setTeamEntries({});
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchSheets = async () => {
    try {
      const response = await apiClient.get('/sheets');
      setSheets(response.data);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      // Don't show error toast for permission issues, just log it
      if (error.response?.status === 403) {
        console.log('Sheets access restricted - user may not have read_sheets permission');
        setSheets([]); // Set empty array to show fallback message
      } else {
        toast.error('Failed to fetch sheets');
      }
    }
  };

  const distributeSheetToTeams = async (sheetId) => {
    try {
      setDistributionLoading(true);
      await apiClient.post(`/admin/sheets/${sheetId}/distribute-to-teams`);
      toast.success('Sheet distributed to all teams successfully!');
      await fetchTeamData(); // Refresh data
    } catch (error) {
      console.error('Error distributing sheet:', error);
      toast.error('Failed to distribute sheet to teams');
    } finally {
      setDistributionLoading(false);
    }
  };

  const assignUserToTeam = async () => {
    if (!selectedUser || !newTeam) {
      toast.error('Please select both user and team');
      return;
    }

    try {
      await apiClient.patch(`/admin/users/${selectedUser}/team`, { team: newTeam });
      toast.success('User assigned to team successfully!');
      await fetchUsers();
      setSelectedUser('');
      setNewTeam('');
      setShowUserAssignment(false);
    } catch (error) {
      console.error('Error assigning user to team:', error);
      toast.error('Failed to assign user to team');
    }
  };

  const getTeamColor = (teamName) => {
    const colors = {
      generation: '#3b82f6',
      distribution: '#10b981',
      transmission: '#f59e0b'
    };
    return colors[teamName] || '#6b7280';
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="team-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="team-management">
      <div className="team-management-header">
        <h2>Team Management Dashboard</h2>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowUserAssignment(!showUserAssignment)}
          >
            Assign Users to Teams
          </button>
          <button 
            className="btn btn-secondary"
            onClick={fetchTeamData}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* User Assignment Panel */}
      {showUserAssignment && (
        <div className="user-assignment-panel">
          <h3>Assign User to Team</h3>
          <div className="assignment-form">
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="form-select"
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.username}) - Current: {user.team || 'None'}
                </option>
              ))}
            </select>
            <select 
              value={newTeam} 
              onChange={(e) => setNewTeam(e.target.value)}
              className="form-select"
            >
              <option value="">Select Team</option>
              {operationalTeams.map(team => (
                <option key={team} value={team}>
                  {team.charAt(0).toUpperCase() + team.slice(1)}
                </option>
              ))}
            </select>
            <button 
              className="btn btn-success"
              onClick={assignUserToTeam}
              disabled={!selectedUser || !newTeam}
            >
              Assign to Team
            </button>
          </div>
        </div>
      )}

      {/* Team Statistics Cards */}
      <div className="team-stats-grid">
        {Array.isArray(teamStats) && teamStats.length > 0 ? (
          teamStats.map(team => (
            <div key={team.team_name} className="team-stat-card">
              <div 
                className="team-header"
                style={{ borderTopColor: getTeamColor(team.team_name) }}
              >
                <h3>{team.team_name ? team.team_name.charAt(0).toUpperCase() + team.team_name.slice(1) : 'Unknown'} Team</h3>
                <div className="team-badge" style={{ backgroundColor: getTeamColor(team.team_name) }}>
                  {team.user_count || 0} users
                </div>
              </div>
            
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Total Entries</span>
                <span className="stat-value">{team.total_entries}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed</span>
                <span className="stat-value text-success">{team.completed_entries}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending</span>
                <span className="stat-value text-warning">{team.pending_entries}</span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-label">
                Progress: {getProgressPercentage(team.completed_entries, team.total_entries)}%
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${getProgressPercentage(team.completed_entries, team.total_entries)}%`,
                    backgroundColor: getTeamColor(team.team_name)
                  }}
                ></div>
              </div>
            </div>

            <button 
              className="btn btn-outline"
              onClick={() => setSelectedTeam(selectedTeam === team.team_name ? '' : team.team_name)}
            >
              {selectedTeam === team.team_name ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        ))) : (
          <div className="no-team-stats">
            <p className="text-muted">
              <i className="fas fa-info-circle me-2"></i>
              No team statistics available. Team data may still be loading or there might be an issue with the API.
            </p>
          </div>
        )}
      </div>

      {/* Sheet Distribution Section */}
      <div className="sheet-distribution-section">
        <h3>Distribute Sheets to Teams</h3>
        <div className="distribution-info">
          <p>Select a sheet to distribute to all three operational teams. This will create copies for each team to work on independently.</p>
        </div>
        <div className="sheets-grid">
          {sheets.length > 0 ? (
            sheets.map(sheet => (
              <div key={sheet.id} className="sheet-card">
                <div className="sheet-info">
                  <h4>{sheet.title}</h4>
                  <p>Uploaded: {sheet.created_at ? new Date(sheet.created_at).toLocaleDateString() : 'Unknown'}</p>
                  <p>Entries: {sheet.entry_count || 0}</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => distributeSheetToTeams(sheet.id)}
                  disabled={distributionLoading}
                >
                  {distributionLoading ? 'Distributing...' : 'Distribute to Teams'}
                </button>
              </div>
            ))
          ) : (
            <div className="no-sheets-message">
              <p className="text-muted">
                <i className="fas fa-info-circle me-2"></i>
                {sheets.length === 0 && !loading ? 
                  'No sheets available for distribution. This may be due to permission restrictions or no sheets have been uploaded yet.' :
                  'No sheets available for distribution. Upload sheets from the Upload page first.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Details Section */}
      {selectedTeam && teamEntries && teamEntries[selectedTeam] && Array.isArray(teamEntries[selectedTeam]) && (
        <div className="team-details-section">
          <h3>{selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)} Team - Entry Details</h3>
          <div className="entries-table-container">
            <table className="entries-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Assigned User</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {teamEntries[selectedTeam] && Array.isArray(teamEntries[selectedTeam]) && teamEntries[selectedTeam].slice(0, 10).map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.product_name || 'N/A'}</td>
                    <td>{entry.vendor_name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-${entry.status || 'unknown'}`}>
                        {entry.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{entry.assigned_user_name || 'Unassigned'}</td>
                    <td>{entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {teamEntries[selectedTeam] && Array.isArray(teamEntries[selectedTeam]) && teamEntries[selectedTeam].length > 10 && (
              <div className="table-footer">
                <p>Showing 10 of {teamEntries[selectedTeam].length} entries</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Users Section */}
      <div className="team-users-section">
        <h3>Team Members</h3>
        <div className="teams-grid">
          {operationalTeams.map(teamName => {
            const teamUsers = Array.isArray(users) ? users.filter(user => user.team === teamName) : [];
            return (
              <div key={teamName} className="team-users-card">
                <h4>{teamName.charAt(0).toUpperCase() + teamName.slice(1)} Team</h4>
                <div className="users-list">
                  {teamUsers.length > 0 ? (
                    teamUsers.map(user => (
                      <div key={user.id} className="user-item">
                        <span className="user-name">{user.first_name} {user.last_name}</span>
                        <span className="user-role">{user.role}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-users">No users assigned to this team</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
