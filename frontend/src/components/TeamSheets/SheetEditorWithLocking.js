import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Modal, Form, Spinner } from 'react-bootstrap';
import { FaLock, FaUnlock, FaEdit, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import entryLockingService from '../../services/entryLockingService';
import sheetService from '../../services/sheetService';
import './SheetEditorWithLocking.css';

const SheetEditorWithLocking = ({ user }) => {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  
  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState({});
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadSheetData();
    
    // Set up auto-refresh every 30 seconds to update lock status
    const interval = setInterval(() => {
      refreshEntries();
    }, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [sheetId]);

  const loadSheetData = async () => {
    try {
      setLoading(true);
      
      // Load sheet details
      const sheetData = await sheetService.getSheetById(sheetId);
      setSheet(sheetData);
      
      // Load available entries for user's team
      console.log('Loading entries for sheetId:', sheetId, 'teamId:', user?.team_id);
      const entriesData = await entryLockingService.getAvailableEntries(sheetId, user?.team_id);
      console.log('Received entries data:', entriesData);
      console.log('Entries array length:', entriesData.length);
      console.log('Type of entriesData:', typeof entriesData);
      console.log('Is entriesData an array?', Array.isArray(entriesData));
      if (entriesData && entriesData.length > 0) {
        console.log('First entry sample:', entriesData[0]);
      }
      setEntries(entriesData);
      
    } catch (error) {
      console.error('Error loading sheet data:', error);
      toast.error(error.message || 'Failed to load sheet data');
    } finally {
      setLoading(false);
    }
  };

  const refreshEntries = async () => {
    try {
      const entriesData = await entryLockingService.getAvailableEntries(sheetId, user?.team_id);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error refreshing entries:', error);
    }
  };

  const handleLockEntry = async (entryId) => {
    try {
      await entryLockingService.lockEntry(entryId);
      toast.success('Entry locked successfully');
      await refreshEntries();
    } catch (error) {
      toast.error(error.message || 'Failed to lock entry');
    }
  };

  const handleUnlockEntry = async (entryId) => {
    try {
      await entryLockingService.unlockEntry(entryId);
      toast.success('Entry unlocked successfully');
      await refreshEntries();
    } catch (error) {
      toast.error(error.message || 'Failed to unlock entry');
    }
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    // Set default values for editable fields
    setEditingEntry({ 
      ...entry,
      deployed_in_ke: entry.deployed_in_ke !== null ? entry.deployed_in_ke : false,
      vendor_contacted: entry.vendor_contacted !== null ? entry.vendor_contacted : false,
      patching: entry.patching || 'Not Applicable',
      compensatory_controls: entry.compensatory_controls_provided || 'Not Applicable',
      comments: entry.comments || '',
      status: entry.current_status || entry.status || 'Not Applicable',
      site: entry.site || '',
      patching_est_release_date: entry.patching_est_release_date || '',
      implementation_date: entry.implementation_date || '',
      vendor_contact_date: entry.vendor_contact_date || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEntry = async () => {
    try {
      await entryLockingService.completeEntry(selectedEntry.id, editingEntry);
      toast.success('Entry completed successfully');
      setShowEditModal(false);
      setSelectedEntry(null);
      setEditingEntry({});
      await refreshEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(error.message || 'Failed to save entry');
    }
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'assigned': return 'info';
      default: return 'secondary';
    }
  };

  const isEntryLocked = (entry) => {
    return entry.locked_by_user_id && entry.locked_by_user_id !== user?.id;
  };

  const isEntryLockedByMe = (entry) => {
    return entry.locked_by_user_id === user?.id;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading sheet data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{sheet?.title}</h4>
                  <small className="text-muted">
                    {sheet?.description} | Month: {sheet?.month_year}
                  </small>
                </div>
                <div>
                  <Badge variant={getStatusBadgeColor(sheet?.status)} className="me-2">
                    {sheet?.status}
                  </Badge>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => navigate('/team-sheets')}
                  >
                    Back to Sheets
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {entries.length === 0 ? (
                <Alert variant="info">
                  <div>No entries available for editing at this time.</div>
                  <div style={{fontSize: '12px', marginTop: '10px', color: '#666'}}>
                    Debug: Sheet ID: {sheetId}, User Team ID: {user?.team_id}, 
                    Entries loaded: {entries.length}, Loading: {loading.toString()}
                  </div>
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>OEM/Vendor</th>
                        <th>Product Name</th>
                        <th>Source</th>
                        <th>Risk Level</th>
                        <th>CVE</th>
                        <th>Product Deployed in KE?</th>
                        <th>Site</th>
                        <th>Vendor Contacted</th>
                        <th>Date</th>
                        <th>Patching</th>
                        <th>Est. Release Date</th>
                        <th>Implementation Date</th>
                        <th>Est. Time</th>
                        <th>Compensatory Controls Provided</th>
                        <th>Comments</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr 
                          key={entry.id}
                          className={
                            isEntryLockedByMe(entry) ? 'table-warning' :
                            isEntryLocked(entry) ? 'table-secondary' :
                            entry.is_completed ? 'table-success' : ''
                          }
                        >
                          <td>{entry.oem_vendor || 'N/A'}</td>
                          <td>{entry.product_name || 'N/A'}</td>
                          <td>
                            {entry.source ? (
                              <a href={entry.source} target="_blank" rel="noopener noreferrer">
                                Link
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td>
                            <Badge variant={getRiskBadgeColor(entry.risk_level)}>
                              {entry.risk_level || 'Unknown'}
                            </Badge>
                          </td>
                          <td>{entry.cve || 'N/A'}</td>
                          <td>
                            <Badge variant={entry.deployed_in_ke ? 'success' : 'secondary'}>
                              {entry.deployed_in_ke ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td>{entry.site || 'Not Applicable'}</td>
                          <td>
                            <Badge variant={entry.vendor_contacted ? 'success' : 'secondary'}>
                              {entry.vendor_contacted ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td>{entry.vendor_contact_date || 'Not Applicable'}</td>
                          <td>{entry.patching || 'Not Applicable'}</td>
                          <td>{entry.patching_est_release_date || 'Not Applicable'}</td>
                          <td>{entry.implementation_date || 'Not Applicable'}</td>
                          <td>{entry.estimated_time || 'Not Applicable'}</td>
                          <td>{entry.compensatory_controls_provided || 'Not Applicable'}</td>
                          <td>{entry.comments || 'N/A'}</td>
                          <td>
                            <Badge variant={getStatusBadgeColor(entry.current_status || entry.status)}>
                              {entry.current_status || entry.status || 'Not Applicable'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              {isEntryLocked(entry) ? (
                                <div className="text-muted small">
                                  <FaLock className="me-1" />
                                  Locked by {entry.locked_by_first_name} {entry.locked_by_last_name}
                                </div>
                              ) : isEntryLockedByMe(entry) ? (
                                <>
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleEditEntry(entry)}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleUnlockEntry(entry.id)}
                                  >
                                    <FaUnlock />
                                  </Button>
                                </>
                              ) : entry.is_completed ? (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  disabled
                                >
                                  <FaCheck /> Completed
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleLockEntry(entry.id)}
                                >
                                  <FaLock /> Select
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Entry Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Deployed in KE?</Form.Label>
                  <Form.Select
                    value={editingEntry.deployed_in_ke ? 'true' : 'false'}
                    onChange={(e) => {
                      const isDeployed = e.target.value === 'true';
                      setEditingEntry(prev => ({ 
                        ...prev, 
                        deployed_in_ke: isDeployed,
                        // Reset date fields if changing to No
                        estimated_release_date: isDeployed ? prev.estimated_release_date : '',
                        implementation_date: isDeployed ? prev.implementation_date : ''
                      }));
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Site</Form.Label>
                  <Form.Control
                    type="text"
                    value={editingEntry.site || ''}
                    onChange={(e) => setEditingEntry(prev => ({ ...prev, site: e.target.value }))}
                    placeholder="Enter site information"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendor Contacted</Form.Label>
                  <Form.Select
                    value={editingEntry.vendor_contacted ? 'true' : 'false'}
                    onChange={(e) => {
                      const isContacted = e.target.value === 'true';
                      setEditingEntry(prev => ({ 
                        ...prev, 
                        vendor_contacted: isContacted,
                        // Reset date field if changing to No
                        vendor_contact_date: isContacted ? prev.vendor_contact_date : ''
                      }));
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {editingEntry.vendor_contacted && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vendor Contact Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editingEntry.vendor_contact_date || ''}
                      onChange={(e) => setEditingEntry(prev => ({ ...prev, vendor_contact_date: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Patching</Form.Label>
                  <Form.Select
                    value={editingEntry.patching || 'Not Applicable'}
                    onChange={(e) => {
                      const patchingValue = e.target.value;
                      setEditingEntry(prev => ({ 
                        ...prev, 
                        patching: patchingValue,
                        // Reset date fields if changing to No or Not Applicable
                        patching_est_release_date: (patchingValue === 'Yes' && editingEntry.deployed_in_ke) ? prev.patching_est_release_date : '',
                        implementation_date: (patchingValue === 'Yes' && editingEntry.deployed_in_ke) ? prev.implementation_date : ''
                      }));
                    }}
                  >
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Show both date fields side by side when patching is "Yes" */}
            {editingEntry.patching === 'Yes' && editingEntry.deployed_in_ke && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Est. Release Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editingEntry.patching_est_release_date || ''}
                      onChange={(e) => setEditingEntry(prev => ({ ...prev, patching_est_release_date: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Implementation Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editingEntry.implementation_date || ''}
                      onChange={(e) => setEditingEntry(prev => ({ ...prev, implementation_date: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Compensatory Controls Provided</Form.Label>
              <Form.Select
                value={editingEntry.compensatory_controls || 'Not Applicable'}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditingEntry(prev => ({ 
                    ...prev, 
                    compensatory_controls: value,
                    // Reset estimated time if changing to No or Not Applicable
                    estimated_time: value === 'Yes' ? prev.estimated_time : ''
                  }));
                }}
              >
                <option value="Not Applicable">Not Applicable</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Select>
            </Form.Group>

            {/* Only show estimated time field when compensatory controls is "Yes" */}
            {editingEntry.compensatory_controls === 'Yes' && (
              <Form.Group className="mb-3">
                <Form.Label>Est. Time</Form.Label>
                <Form.Control
                  type="text"
                  value={editingEntry.estimated_time || ''}
                  onChange={(e) => setEditingEntry(prev => ({ ...prev, estimated_time: e.target.value }))}
                  placeholder="e.g., 2 weeks, 1 month"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Comments</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editingEntry.comments || ''}
                onChange={(e) => setEditingEntry(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Enter any additional comments"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editingEntry.status || 'Not Applicable'}
                onChange={(e) => setEditingEntry(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Not Applicable">Not Applicable</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEntry}>
            <FaCheck className="me-1" /> Complete Entry
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SheetEditorWithLocking;
