import React, { useState, useEffect } from 'react';
import sheetService from '../../services/sheetService';
import { userService } from '../../services/userService';

const SheetAssignment = () => {
  const [sheets, setSheets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sheetsData, usersData] = await Promise.all([
        sheetService.getAllSheets(),
        userService.getAllUsers()
      ]);
      setSheets(sheetsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleTeamSelection = (teamName) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamName)) {
        return prev.filter(team => team !== teamName);
      } else {
        return [...prev, teamName];
      }
    });
  };

  const assignToUsers = async () => {
    if (!selectedSheet || selectedUsers.length === 0) {
      showMessage('Please select a sheet and at least one user', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.assignSheetToUsers(selectedSheet, selectedUsers);
      showMessage(response.message, 'success');
      
      // Reset selections
      setSelectedSheet('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to assign sheet to users:', error);
      showMessage(error.message || 'Failed to assign sheet to users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const distributeToTeams = async () => {
    if (!selectedSheet) {
      showMessage('Please select a sheet', 'error');
      return;
    }

    try {
      setLoading(true);
      let response;
      
      if (selectedTeams.length > 0) {
        // Distribute to specific teams
        response = await sheetService.distributeToSpecificTeams(selectedSheet, selectedTeams);
      } else {
        // Distribute to operational teams by default
        response = await sheetService.distributeToOperationalTeams(selectedSheet);
      }
      
      showMessage(response.message, 'success');
      
      // Reset selections
      setSelectedSheet('');
      setSelectedTeams([]);
    } catch (error) {
      console.error('Failed to distribute sheet to teams:', error);
      showMessage(error.message || 'Failed to distribute sheet to teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearSelections = () => {
    setSelectedSheet('');
    setSelectedUsers([]);
    setSelectedTeams([]);
  };

  // Group users by team for better visualization
  const usersByTeam = users.reduce((acc, user) => {
    const teamName = user.team?.name || 'No Team';
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(user);
    return acc;
  }, {});

  // Get unique teams from users
  const availableTeams = [...new Set(users.filter(u => u.team?.name).map(u => u.team.name))];

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Sheet Assignment & Distribution</h2>
        <button 
          className="btn btn-outline-secondary"
          onClick={clearSelections}
        >
          Clear Selections
        </button>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="row">
        {/* Sheet Selection */}
        <div className="col-md-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>1. Select Sheet</h5>
            </div>
            <div className="card-body">
              <select 
                className="form-select"
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
              >
                <option value="">Select a sheet...</option>
                {sheets.map(sheet => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.title} - {new Date(sheet.month_year).toLocaleDateString()} 
                    {sheet.status && ` (${sheet.status})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Team Distribution */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>2a. Distribute to Teams</h5>
              <button 
                className="btn btn-primary btn-sm"
                onClick={distributeToTeams}
                disabled={!selectedSheet || loading}
              >
                {loading ? 'Distributing...' : 'Distribute to Teams'}
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <button 
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={() => setSelectedTeams(['Distribution', 'Transmission', 'General'])}
                >
                  Select Operational Teams
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSelectedTeams([])}
                >
                  Clear Team Selection
                </button>
              </div>
              
              <div className="row">
                {availableTeams.map(teamName => (
                  <div key={teamName} className="col-6 mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`team-${teamName}`}
                        checked={selectedTeams.includes(teamName)}
                        onChange={() => handleTeamSelection(teamName)}
                      />
                      <label className="form-check-label" htmlFor={`team-${teamName}`}>
                        {teamName}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedTeams.length === 0 && (
                <p className="text-muted small mt-2">
                  No teams selected. Will distribute to default operational teams.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Assignment */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>2b. Assign to Specific Users</h5>
              <button 
                className="btn btn-success btn-sm"
                onClick={assignToUsers}
                disabled={!selectedSheet || selectedUsers.length === 0 || loading}
              >
                {loading ? 'Assigning...' : `Assign to ${selectedUsers.length} Users`}
              </button>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(usersByTeam).map(([teamName, teamUsers]) => (
                <div key={teamName} className="mb-3">
                  <h6 className="text-primary border-bottom pb-1">{teamName}</h6>
                  {teamUsers.map(user => (
                    <div key={user.id} className="form-check mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                      />
                      <label className="form-check-label" htmlFor={`user-${user.id}`}>
                        {user.first_name} {user.last_name} ({user.username})
                        <small className="text-muted"> - {user.role}</small>
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedSheet || selectedUsers.length > 0 || selectedTeams.length > 0) && (
        <div className="card mt-4">
          <div className="card-header">
            <h5>Selection Summary</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <strong>Selected Sheet:</strong>
                <p className="mb-0">
                  {selectedSheet ? 
                    sheets.find(s => s.id.toString() === selectedSheet)?.title : 
                    'None selected'
                  }
                </p>
              </div>
              <div className="col-md-4">
                <strong>Selected Teams ({selectedTeams.length}):</strong>
                <p className="mb-0">
                  {selectedTeams.length > 0 ? selectedTeams.join(', ') : 'None selected'}
                </p>
              </div>
              <div className="col-md-4">
                <strong>Selected Users ({selectedUsers.length}):</strong>
                <p className="mb-0">
                  {selectedUsers.length > 0 ? 
                    selectedUsers.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return user ? `${user.first_name} ${user.last_name}` : 'Unknown';
                    }).join(', ') : 
                    'None selected'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetAssignment;
