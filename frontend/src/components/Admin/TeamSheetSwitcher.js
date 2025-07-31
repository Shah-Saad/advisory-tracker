import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import sheetService from '../../services/sheetService';
import './TeamSheetSwitcher.css';

const TeamSheetSwitcher = () => {
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [teamViews, setTeamViews] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamSheetData, setTeamSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);

  const teams = [
    { id: 1, name: 'Generation', key: 'generation' },
    { id: 2, name: 'Distribution', key: 'distribution' },
    { id: 3, name: 'Transmission', key: 'transmission' }
  ];

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getAllSheetsWithTeamStatus();
      setSheets(data);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      toast.error('Failed to fetch sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = async (sheet) => {
    try {
      setSelectedSheet(sheet);
      setSelectedTeam(null);
      setTeamSheetData(null);
      setTeamLoading(true);

      const teamViewsData = await sheetService.getSheetByTeams(sheet.id);
      setTeamViews(teamViewsData);
    } catch (error) {
      console.error('Error fetching team views:', error);
      toast.error('Failed to fetch team views for this sheet');
      setTeamViews(null);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleTeamSelect = async (team) => {
    if (!selectedSheet) return;

    try {
      setSelectedTeam(team);
      setTeamLoading(true);

      const teamData = await sheetService.getSheetForTeam(selectedSheet.id, team.id);
      setTeamSheetData(teamData);
    } catch (error) {
      console.error('Error fetching team sheet data:', error);
      toast.error(`Failed to fetch ${team.name} team data`);
      setTeamSheetData(null);
    } finally {
      setTeamLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'badge bg-success';
      case 'in_progress': return 'badge bg-warning';
      case 'assigned': return 'badge bg-primary';
      case 'distributed': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="team-sheet-switcher">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Select Sheet</h5>
            </div>
            <div className="card-body">
              {sheets.length === 0 ? (
                <p className="text-muted">No distributed sheets available</p>
              ) : (
                <div className="list-group">
                  {sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      className={`list-group-item list-group-item-action ${
                        selectedSheet?.id === sheet.id ? 'active' : ''
                      }`}
                      onClick={() => handleSheetSelect(sheet)}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{sheet.title}</h6>
                        <small className={getStatusBadgeClass(sheet.status)}>
                          {sheet.status}
                        </small>
                      </div>
                      <p className="mb-1 small">{sheet.description}</p>
                      <small>
                        Uploaded: {formatDate(sheet.created_at)}
                        {sheet.distributed_at && (
                          <> • Distributed: {formatDate(sheet.distributed_at)}</>
                        )}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Select Team</h5>
            </div>
            <div className="card-body">
              {!selectedSheet ? (
                <p className="text-muted">Please select a sheet first</p>
              ) : teamLoading ? (
                <div className="text-center">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : !teamViews ? (
                <p className="text-muted">No team data available for this sheet</p>
              ) : (
                <div className="list-group">
                  {teams.map((team) => {
                    const teamView = teamViews.teamViews?.find(tv => tv.team_name.toLowerCase() === team.key);
                    return (
                      <button
                        key={team.id}
                        className={`list-group-item list-group-item-action ${
                          selectedTeam?.id === team.id ? 'active' : ''
                        } ${!teamView ? 'disabled' : ''}`}
                        onClick={() => teamView && handleTeamSelect(team)}
                        disabled={!teamView}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">{team.name}</h6>
                          {teamView && (
                            <small className={getStatusBadgeClass(teamView.status)}>
                              {teamView.status}
                            </small>
                          )}
                        </div>
                        {teamView ? (
                          <div>
                            <small>
                              Responses: {teamView.response_count || 0} entries
                              {teamView.assigned_at && (
                                <> • Assigned: {formatDate(teamView.assigned_at)}</>
                              )}
                            </small>
                          </div>
                        ) : (
                          <small className="text-muted">Not assigned to this team</small>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Team Sheet Preview</h5>
              {selectedTeam && (
                <small className="text-muted">
                  {selectedTeam.name} Team • {selectedSheet?.title}
                </small>
              )}
            </div>
            <div className="card-body">
              {!selectedTeam ? (
                <p className="text-muted">Please select a team to view their sheet data</p>
              ) : teamLoading ? (
                <div className="text-center">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : !teamSheetData ? (
                <p className="text-muted">No data available for this team</p>
              ) : (
                <div className="team-sheet-preview">
                  <div className="mb-3">
                    <strong>Assignment Details:</strong>
                    <ul className="list-unstyled mt-1">
                      <li><small>Status: <span className={getStatusBadgeClass(teamSheetData.assignment.status)}>{teamSheetData.assignment.status}</span></small></li>
                      <li><small>Assigned: {formatDate(teamSheetData.assignment.assigned_at)}</small></li>
                      {teamSheetData.assignment.completed_at && (
                        <li><small>Completed: {formatDate(teamSheetData.assignment.completed_at)}</small></li>
                      )}
                    </ul>
                  </div>

                  <div className="mb-3">
                    <strong>Response Summary:</strong>
                    <ul className="list-unstyled mt-1">
                      <li><small>Total Responses: {teamSheetData.response_count || 0}</small></li>
                      <li><small>Progress: {teamSheetData.completion_percentage || 0}%</small></li>
                    </ul>
                  </div>

                  {teamSheetData.responses && teamSheetData.responses.length > 0 && (
                    <div>
                      <strong>Recent Entries:</strong>
                      <div className="mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {teamSheetData.responses.slice(0, 5).map((response, index) => (
                          <div key={index} className="border rounded p-2 mb-2 bg-light">
                            <small>
                              <div><strong>Row {response.row_number}:</strong></div>
                              {response.response_data && Object.entries(response.response_data).slice(0, 3).map(([key, value]) => (
                                <div key={key}>
                                  <em>{key}:</em> {value || 'N/A'}
                                </div>
                              ))}
                              <div className="text-muted">
                                Updated: {formatDate(response.updated_at)}
                              </div>
                            </small>
                          </div>
                        ))}
                        {teamSheetData.responses.length > 5 && (
                          <small className="text-muted">
                            ... and {teamSheetData.responses.length - 5} more entries
                          </small>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSheetSwitcher;
