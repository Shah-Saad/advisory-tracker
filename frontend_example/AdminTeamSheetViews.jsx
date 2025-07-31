// Example React component for Admin Team Sheet Views
import React, { useState, useEffect } from 'react';
import { Card, Table, Tabs, Badge, Button, Spinner, Alert } from 'react-bootstrap';

const AdminTeamSheetViews = () => {
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [teamViews, setTeamViews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all sheets with team status summary
  const fetchSheetsWithTeamStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets/team-status-summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch sheets');
      
      const data = await response.json();
      setSheets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team-specific views for a sheet
  const fetchTeamViews = async (sheetId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sheets/${sheetId}/team-views`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch team views');
      
      const data = await response.json();
      setTeamViews(data);
      setSelectedSheet(sheetId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetsWithTeamStatus();
  }, []);

  const getStatusBadge = (status) => {
    const variants = {
      'assigned': 'secondary',
      'in_progress': 'warning',
      'completed': 'success'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchSheetsWithTeamStatus}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container-fluid">
      <h2>Team Sheet Management</h2>
      
      {!selectedSheet ? (
        <Card>
          <Card.Header>
            <h5>All Sheets - Team Status Overview</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Sheet Title</th>
                  <th>Month/Year</th>
                  <th>Status</th>
                  <th>Teams Assigned</th>
                  <th>Teams with Responses</th>
                  <th>Teams Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map(sheet => (
                  <tr key={sheet.id}>
                    <td>
                      <strong>{sheet.title}</strong>
                      {sheet.description && (
                        <div className="text-muted small">{sheet.description}</div>
                      )}
                    </td>
                    <td>{new Date(sheet.month_year).toLocaleDateString()}</td>
                    <td>{getStatusBadge(sheet.status)}</td>
                    <td>
                      <Badge bg="info">{sheet.total_teams_assigned}</Badge>
                    </td>
                    <td>
                      <Badge bg="primary">{sheet.teams_with_responses}</Badge>
                    </td>
                    <td>
                      <Badge bg="success">{sheet.teams_completed}</Badge>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => fetchTeamViews(sheet.id)}
                        disabled={sheet.total_teams_assigned === 0}
                      >
                        View Team Responses
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Team Views: {teamViews?.sheet?.title}</h4>
            <Button variant="secondary" onClick={() => setSelectedSheet(null)}>
              ← Back to All Sheets
            </Button>
          </div>

          {teamViews && (
            <Tabs defaultActiveKey="overview" className="mb-3">
              <Tabs.Tab eventKey="overview" title="Overview">
                <Card>
                  <Card.Body>
                    <div className="row">
                      <div className="col-md-8">
                        <h6>Sheet Information</h6>
                        <p><strong>Title:</strong> {teamViews.sheet.title}</p>
                        <p><strong>Description:</strong> {teamViews.sheet.description}</p>
                        <p><strong>Status:</strong> {getStatusBadge(teamViews.sheet.status)}</p>
                      </div>
                      <div className="col-md-4">
                        <h6>Team Summary</h6>
                        <p><strong>Total Teams:</strong> {teamViews.total_teams}</p>
                        <p><strong>Teams with Responses:</strong> {teamViews.team_versions.filter(t => t.response_count > 0).length}</p>
                        <p><strong>Completed Teams:</strong> {teamViews.team_versions.filter(t => t.assignment_status === 'completed').length}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Tabs.Tab>

              <Tabs.Tab eventKey="teams" title="Team Responses">
                <div className="row">
                  {teamViews.team_versions.map(teamView => (
                    <div key={teamView.team_id} className="col-lg-6 mb-3">
                      <Card>
                        <Card.Header className="d-flex justify-content-between">
                          <h6 className="mb-0">{teamView.team_name}</h6>
                          {getStatusBadge(teamView.assignment_status)}
                        </Card.Header>
                        <Card.Body>
                          <div className="mb-3">
                            <small className="text-muted">
                              Assigned: {new Date(teamView.assigned_at).toLocaleDateString()}
                              {teamView.completed_at && (
                                <> | Completed: {new Date(teamView.completed_at).toLocaleDateString()}</>
                              )}
                            </small>
                          </div>
                          
                          <p><strong>Responses:</strong> {teamView.response_count}</p>
                          
                          {teamView.response_count > 0 ? (
                            <div>
                              <h6>Sample Responses:</h6>
                              {Object.entries(teamView.responses).slice(0, 3).map(([fieldName, response]) => (
                                <div key={fieldName} className="mb-2">
                                  <small className="text-muted">{fieldName}:</small>
                                  <div className="border-start ps-2 ms-2">
                                    {response.value.length > 100 
                                      ? `${response.value.substring(0, 100)}...`
                                      : response.value
                                    }
                                  </div>
                                </div>
                              ))}
                              {Object.keys(teamView.responses).length > 3 && (
                                <small className="text-muted">
                                  +{Object.keys(teamView.responses).length - 3} more responses...
                                </small>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted">No responses yet</p>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Tabs.Tab>

              <Tabs.Tab eventKey="comparison" title="Side-by-Side Comparison">
                <Card>
                  <Card.Body>
                    <h6>Response Comparison</h6>
                    <p className="text-muted">Compare responses from different teams for the same fields</p>
                    
                    {/* This would show a table comparing the same fields across teams */}
                    <div className="table-responsive">
                      <Table bordered size="sm">
                        <thead>
                          <tr>
                            <th>Field</th>
                            {teamViews.team_versions.map(team => (
                              <th key={team.team_id}>{team.team_name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Get all unique field names across all teams */}
                          {Array.from(new Set(
                            teamViews.team_versions.flatMap(team => 
                              Object.keys(team.responses)
                            )
                          )).slice(0, 10).map(fieldName => (
                            <tr key={fieldName}>
                              <td><strong>{fieldName}</strong></td>
                              {teamViews.team_versions.map(team => (
                                <td key={team.team_id}>
                                  {team.responses[fieldName] ? (
                                    <div>
                                      {team.responses[fieldName].value.length > 50
                                        ? `${team.responses[fieldName].value.substring(0, 50)}...`
                                        : team.responses[fieldName].value
                                      }
                                      <div className="text-muted small">
                                        {new Date(team.responses[fieldName].submitted_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted">No response</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Tabs.Tab>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTeamSheetViews;
