import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sheetService from '../../services/sheetService';
import authService from '../../services/authService';

const EntryList = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingEntry, setViewingEntry] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const navigate = useNavigate();

  // State for conditional fields
  const [showSiteField, setShowSiteField] = useState({});
  const [showDateField, setShowDateField] = useState({});
  const [showEstTimeField, setShowEstTimeField] = useState({});

  useEffect(() => {
    loadEntries();
    loadCurrentUser();
  }, []);

  // Add escape key handler for modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showViewModal) {
        handleCloseViewModal();
      }
    };

    if (showViewModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showViewModal]);

  const loadCurrentUser = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getAllEntries();
      setEntries(data);
    } catch (error) {
      setError(error.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id) => {
    // Only admins can delete entries
    if (currentUser?.role !== 'admin') {
      setError('Only administrators can delete entries');
      return;
    }

    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await sheetService.deleteEntry(id);
        setEntries(entries.filter(entry => entry.id !== id));
      } catch (error) {
        setError(error.message || 'Failed to delete entry');
      }
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry.id);
    setEditForm({
      patching: entry.patching || '',
      patching_est_release_date: entry.patching_est_release_date || '',
      patching_est_release_option: entry.patching_est_release_date ? 'Date' : 'Not Applicable',
      implementation_date: entry.implementation_date || '',
      implementation_date_option: entry.implementation_date ? 'Date' : 'Not Applicable',
      deployed_in_ke: entry.deployed_in_ke || '',
      vendor_contacted: entry.vendor_contacted || '',
      compensatory_controls_provided: entry.compensatory_controls_provided || '',
      site: entry.site || '',
      vendor_contact_date: entry.vendor_contact_date || '',
      estimated_time: entry.estimated_time || '',
      estimated_completion_date: entry.estimated_completion_date || '',
      estimated_time_option: entry.estimated_completion_date ? 'Date' : 'Not Applicable'
    });
    
    // Initialize conditional field visibility
    setShowSiteField(prev => ({
      ...prev,
      [entry.id]: entry.deployed_in_ke === 'Yes'
    }));
    setShowDateField(prev => ({
      ...prev,
      [entry.id]: entry.vendor_contacted === 'Yes'
    }));
    setShowEstTimeField(prev => ({
      ...prev,
      [entry.id]: entry.compensatory_controls_provided === 'Yes'
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await sheetService.updateEntry(editingEntry, editForm);
      setEntries(entries.map(entry => 
        entry.id === editingEntry 
          ? { ...entry, ...editForm }
          : entry
      ));
      setEditingEntry(null);
      setEditForm({});
    } catch (error) {
      setError(error.message || 'Failed to update entry');
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const handleEditFormChange = (field, value) => {
    // Handle deployed_in_ke special case - auto-set other fields when "No" is selected
    if (field === 'deployed_in_ke' && value === 'No') {
      setEditForm(prev => ({
        ...prev,
        [field]: value,
        // Reset all conditional fields to "No" or "Not Applicable"
        vendor_contacted: 'No',
        compensatory_controls_provided: 'No',
        site: '',
        vendor_contact_date: '',
        estimated_completion_date: '',
        // Reset option fields to "Not Applicable"
        estimated_time_option: 'Not Applicable'
      }));
      
      // Hide all conditional fields
      setShowSiteField(prev => ({
        ...prev,
        [editingEntry]: false
      }));
      setShowDateField(prev => ({
        ...prev,
        [editingEntry]: false
      }));
      setShowEstTimeField(prev => ({
        ...prev,
        [editingEntry]: false
      }));
      return;
    }

    // Regular form change handling
    setEditForm({
      ...editForm,
      [field]: value
    });

    // Handle conditional field visibility
    if (field === 'deployed_in_ke') {
      setShowSiteField(prev => ({
        ...prev,
        [editingEntry]: value === 'Yes'
      }));
    } else if (field === 'vendor_contacted') {
      setShowDateField(prev => ({
        ...prev,
        [editingEntry]: value === 'Yes'
      }));
    } else if (field === 'compensatory_controls_provided') {
      setShowEstTimeField(prev => ({
        ...prev,
        [editingEntry]: value === 'Yes'
      }));
    } else if (field === 'patching_est_release_option' && value === 'Not Applicable') {
      // Clear the date when "Not Applicable" is selected
      setEditForm(prev => ({
        ...prev,
        [field]: value,
        patching_est_release_date: ''
      }));
      return;
    } else if (field === 'implementation_date_option' && value === 'Not Applicable') {
      // Clear the date when "Not Applicable" is selected
      setEditForm(prev => ({
        ...prev,
        [field]: value,
        implementation_date: ''
      }));
      return;
    } else if (field === 'estimated_time_option' && value === 'Not Applicable') {
      // Clear the date when "Not Applicable" is selected
      setEditForm(prev => ({
        ...prev,
        [field]: value,
        estimated_completion_date: ''
      }));
      return;
    }
  };

  // Handle viewing entry details
  const handleViewEntry = async (entryId) => {
    try {
      setModalLoading(true);
      setError(''); // Clear any previous errors
      
      const entryDetails = await sheetService.getEntryById(entryId);
      setViewingEntry(entryDetails);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error loading entry details:', error);
      const errorMessage = error.message || 'Failed to load entry details';
      setError(errorMessage);
      setViewingEntry(null);
      // Don't show modal if there's an error
      setShowViewModal(false);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingEntry(null);
    setModalLoading(false); // Ensure loading state is cleared
    setError(''); // Clear any error when closing modal
  };

  // Check if user can edit specific fields
  const canEditEntry = () => {
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'user');
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning text-dark';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  // Filter and sort entries
  const filteredEntries = entries.filter(entry =>
    Object.values(entry).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = sortedEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">All Entries</h1>
              <p className="text-muted">Total: {entries.length} entries</p>
            </div>
            <div>
              <button 
                className="btn btn-outline-secondary me-2"
                onClick={() => navigate('/dashboard')}
              >
                <i className="fas fa-arrow-left me-2"></i>Back
              </button>
              <button 
                className="btn btn-primary me-2"
                onClick={() => navigate('/upload')}
              >
                <i className="fas fa-upload me-2"></i>Upload Sheet
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={() => navigate('/filters')}
              >
                <i className="fas fa-filter me-2"></i>Advanced Filters
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Search and Controls */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <small className="text-muted">
                    Showing {currentEntries.length} of {sortedEntries.length} entries
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Entries Table */}
          <div className="card">
            <div className="card-body">
              {currentEntries.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        {/* First row - Main headers with Patching spanning two columns */}
                        <tr>
                          <th 
                            scope="col" 
                            rowSpan="2"
                            style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                            onClick={() => handleSort('oem_vendor')}
                          >
                            OEM/Vendor
                            {sortField === 'oem_vendor' && (
                              <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th 
                            scope="col"
                            rowSpan="2"
                            style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                            onClick={() => handleSort('source')}
                          >
                            Source
                            {sortField === 'source' && (
                              <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th 
                            scope="col"
                            rowSpan="2"
                            style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                            onClick={() => handleSort('risk_level')}
                          >
                            Risk Level
                            {sortField === 'risk_level' && (
                              <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th scope="col" rowSpan="2" style={{ verticalAlign: 'middle' }}>CVE</th>
                          <th 
                            scope="col"
                            rowSpan="2"
                            style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                            onClick={() => handleSort('deployed_in_ke')}
                          >
                            Deployed in KE
                            {sortField === 'deployed_in_ke' && (
                              <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th scope="col" colSpan="2" className="text-center" style={{ verticalAlign: 'middle' }}>Patching</th>
                          <th scope="col" rowSpan="2" style={{ verticalAlign: 'middle' }}>Vendor Contacted</th>
                          <th scope="col" rowSpan="2" style={{ verticalAlign: 'middle' }}>Compensatory Controls</th>
                          <th scope="col" rowSpan="2" style={{ verticalAlign: 'middle' }}>Month/Year</th>
                          <th scope="col" rowSpan="2" style={{ verticalAlign: 'middle' }}>Actions</th>
                        </tr>
                        {/* Second row - Patching sub-headers */}
                        <tr>
                          <th scope="col" className="text-center">Est. Release Date</th>
                          <th scope="col" className="text-center">Implementation Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEntries.map((entry, index) => (
                          <tr key={entry.id || index}>
                            <td>{entry.oem_vendor || 'N/A'}</td>
                            <td>{entry.source || 'N/A'}</td>
                            <td>
                              <span className={`badge ${getRiskBadgeClass(entry.risk_level)}`}>
                                {entry.risk_level || 'Unknown'}
                              </span>
                            </td>
                            <td>
                              {entry.cve ? (
                                <code className="small">{entry.cve}</code>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {editingEntry === entry.id ? (
                                <div>
                                  <select
                                    className="form-select form-select-sm mb-2"
                                    value={editForm.deployed_in_ke}
                                    onChange={(e) => handleEditFormChange('deployed_in_ke', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                  {showSiteField[entry.id] && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={editForm.site}
                                      onChange={(e) => handleEditFormChange('site', e.target.value)}
                                      placeholder="Site"
                                    />
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className={`badge ${entry.deployed_in_ke === 'Yes' ? 'bg-success' : entry.deployed_in_ke === 'No' ? 'bg-danger' : 'bg-secondary'}`}>
                                    {entry.deployed_in_ke || 'Unknown'}
                                  </span>
                                  {entry.deployed_in_ke === 'Yes' && entry.site && (
                                    <div><small className="text-muted">Site: {entry.site}</small></div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              {editingEntry === entry.id ? (
                                <div>
                                  <select
                                    className="form-select form-select-sm mb-2"
                                    value={editForm.patching_est_release_option}
                                    onChange={(e) => handleEditFormChange('patching_est_release_option', e.target.value)}
                                    disabled={editForm.deployed_in_ke === 'No'}
                                  >
                                    <option value="Not Applicable">Not Applicable</option>
                                    <option value="Date">Date</option>
                                  </select>
                                  {editForm.patching_est_release_option === 'Date' && editForm.deployed_in_ke !== 'No' && (
                                    <input
                                      type="date"
                                      className="form-control form-control-sm"
                                      value={editForm.patching_est_release_date}
                                      onChange={(e) => handleEditFormChange('patching_est_release_date', e.target.value)}
                                    />
                                  )}
                                </div>
                              ) : (
                                entry.deployed_in_ke === 'No' ? 'N/A' : (entry.patching_est_release_date || 'Not Applicable')
                              )}
                            </td>
                            <td>
                              {editingEntry === entry.id ? (
                                <div>
                                  <select
                                    className="form-select form-select-sm mb-2"
                                    value={editForm.implementation_date_option}
                                    onChange={(e) => handleEditFormChange('implementation_date_option', e.target.value)}
                                    disabled={editForm.deployed_in_ke === 'No'}
                                  >
                                    <option value="Not Applicable">Not Applicable</option>
                                    <option value="Date">Date</option>
                                  </select>
                                  {editForm.implementation_date_option === 'Date' && editForm.deployed_in_ke !== 'No' && (
                                    <input
                                      type="date"
                                      className="form-control form-control-sm"
                                      value={editForm.implementation_date}
                                      onChange={(e) => handleEditFormChange('implementation_date', e.target.value)}
                                    />
                                  )}
                                </div>
                              ) : (
                                entry.deployed_in_ke === 'No' ? 'N/A' : (entry.implementation_date || 'Not Applicable')
                              )}
                            </td>
                            <td>
                              {editingEntry === entry.id ? (
                                <div>
                                  <select
                                    className="form-select form-select-sm mb-2"
                                    value={editForm.vendor_contacted}
                                    onChange={(e) => handleEditFormChange('vendor_contacted', e.target.value)}
                                    disabled={editForm.deployed_in_ke === 'No'}
                                  >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                  {showDateField[entry.id] && editForm.deployed_in_ke !== 'No' && (
                                    <input
                                      type="date"
                                      className="form-control form-control-sm"
                                      value={editForm.vendor_contact_date}
                                      onChange={(e) => handleEditFormChange('vendor_contact_date', e.target.value)}
                                    />
                                  )}
                                </div>
                              ) : (
                                entry.deployed_in_ke === 'No' ? (
                                  <span className="text-muted">N/A</span>
                                ) : (
                                  <div>
                                    <span className={`badge ${entry.vendor_contacted === 'Yes' ? 'bg-success' : entry.vendor_contacted === 'No' ? 'bg-danger' : 'bg-secondary'}`}>
                                      {entry.vendor_contacted || 'Unknown'}
                                    </span>
                                    {entry.vendor_contacted === 'Yes' && entry.vendor_contact_date && (
                                      <div><small className="text-muted">Date: {entry.vendor_contact_date}</small></div>
                                    )}
                                  </div>
                                )
                              )}
                            </td>
                            <td>
                              {editingEntry === entry.id ? (
                                <div>
                                  <select
                                    className="form-select form-select-sm mb-2"
                                    value={editForm.compensatory_controls_provided}
                                    onChange={(e) => handleEditFormChange('compensatory_controls_provided', e.target.value)}
                                    disabled={editForm.deployed_in_ke === 'No'}
                                  >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                  {showEstTimeField[entry.id] && editForm.deployed_in_ke !== 'No' && (
                                    <div>
                                      <select
                                        className="form-select form-select-sm mb-2"
                                        value={editForm.estimated_time_option}
                                        onChange={(e) => handleEditFormChange('estimated_time_option', e.target.value)}
                                      >
                                        <option value="Not Applicable">Not Applicable</option>
                                        <option value="Date">Date</option>
                                      </select>
                                      {editForm.estimated_time_option === 'Date' && (
                                        <input
                                          type="date"
                                          className="form-control form-control-sm"
                                          value={editForm.estimated_completion_date}
                                          onChange={(e) => handleEditFormChange('estimated_completion_date', e.target.value)}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                entry.deployed_in_ke === 'No' ? (
                                  <span className="text-muted">N/A</span>
                                ) : (
                                  <div>
                                    <span className={`badge ${entry.compensatory_controls_provided === 'Yes' ? 'bg-success' : entry.compensatory_controls_provided === 'No' ? 'bg-danger' : 'bg-secondary'}`}>
                                      {entry.compensatory_controls_provided || 'Unknown'}
                                    </span>
                                    {entry.compensatory_controls_provided === 'Yes' && entry.estimated_completion_date && (
                                      <div><small className="text-muted">Date: {entry.estimated_completion_date}</small></div>
                                    )}
                                  </div>
                                )
                              )}
                            </td>
                            <td>
                              {entry.month && entry.year ? (
                                <small>{entry.month} {entry.year}</small>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                {editingEntry === entry.id ? (
                                  <>
                                    <button
                                      className="btn btn-success btn-sm"
                                      title="Save"
                                      onClick={handleSaveEdit}
                                    >
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      title="Cancel"
                                      onClick={handleCancelEdit}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      title="View Details"
                                      onClick={() => handleViewEntry(entry.id)}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    {canEditEntry() && (
                                      <button
                                        className="btn btn-outline-warning btn-sm"
                                        title="Edit"
                                        onClick={() => handleEdit(entry)}
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                    )}
                                    {currentUser?.role === 'admin' && (
                                      <button
                                        className="btn btn-outline-danger btn-sm"
                                        title="Delete (Admin Only)"
                                        onClick={() => handleDelete(entry.id)}
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav className="mt-4">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => paginate(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No entries found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search terms' : 'Upload a sheet to get started'}
                  </p>
                  {!searchTerm && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/upload')}
                    >
                      <i className="fas fa-upload me-2"></i>Upload Sheet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Entry Modal */}
      {showViewModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block' }} 
          tabIndex="-1"
          onClick={handleCloseViewModal}
        >
          <div className="modal-backdrop fade show"></div>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye me-2"></i>Entry Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseViewModal}
                ></button>
              </div>
              <div className="modal-body">
                {modalLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : viewingEntry ? (
                  <div className="row">
                    {/* Basic Information */}
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-info-circle me-2"></i>Basic Information
                      </h6>
                      <div className="mb-3">
                        <label className="form-label fw-bold">OEM/Vendor:</label>
                        <p className="mb-1">{viewingEntry.oem_vendor || 'N/A'}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Source:</label>
                        <p className="mb-1">{viewingEntry.source || 'N/A'}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Risk Level:</label>
                        <p className="mb-1">
                          <span className={`badge ${
                            viewingEntry.risk_level === 'Critical' ? 'bg-danger' :
                            viewingEntry.risk_level === 'High' ? 'bg-warning' :
                            viewingEntry.risk_level === 'Medium' ? 'bg-info' :
                            viewingEntry.risk_level === 'Low' ? 'bg-success' : 'bg-secondary'
                          }`}>
                            {viewingEntry.risk_level || 'Unknown'}
                          </span>
                        </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">CVE:</label>
                        <p className="mb-1">
                          {viewingEntry.cve ? (
                            <code className="bg-light p-1 rounded">{viewingEntry.cve}</code>
                          ) : 'N/A'}
                        </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Product Name:</label>
                        <p className="mb-1">{viewingEntry.product_name || 'N/A'}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Product Category:</label>
                        <p className="mb-1">{viewingEntry.product_category || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Status & Deployment */}
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-tasks me-2"></i>Status & Deployment
                      </h6>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Deployed in KE:</label>
                        <p className="mb-1">
                          <span className={`badge ${
                            viewingEntry.deployed_in_ke === 'Yes' ? 'bg-success' :
                            viewingEntry.deployed_in_ke === 'No' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {viewingEntry.deployed_in_ke || 'Unknown'}
                          </span>
                        </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Est. Release Date:</label>
                        <p className="mb-1">{viewingEntry.patching_est_release_date || 'Not Applicable'}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Implementation Date:</label>
                        <p className="mb-1">{viewingEntry.implementation_date || 'Not Applicable'}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Vendor Contacted:</label>
                        <p className="mb-1">
                          <span className={`badge ${
                            viewingEntry.vendor_contacted === 'Yes' ? 'bg-success' :
                            viewingEntry.vendor_contacted === 'No' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {viewingEntry.vendor_contacted || 'Unknown'}
                          </span>
                        </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Compensatory Controls:</label>
                        <p className="mb-1">{viewingEntry.compensatory_controls_provided || 'N/A'}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Current Status:</label>
                        <p className="mb-1">{viewingEntry.current_status || 'N/A'}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Location:</label>
                        <p className="mb-1">{viewingEntry.location || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="col-12">
                      <hr />
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-calendar me-2"></i>Dates & Timeline
                      </h6>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label fw-bold">Date:</label>
                            <p className="mb-1">{viewingEntry.date || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label fw-bold">Implementation Date:</label>
                            <p className="mb-1">{viewingEntry.implementation_date || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label fw-bold">Resolution Date:</label>
                            <p className="mb-1">{viewingEntry.resolution_date || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <h6 className="text-primary mb-3 mt-4">
                        <i className="fas fa-file-alt me-2"></i>Sheet Information
                      </h6>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label fw-bold">Sheet Title:</label>
                            <p className="mb-1">{viewingEntry.sheet_title || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label fw-bold">Month/Year:</label>
                            <p className="mb-1">{viewingEntry.sheet_month || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label fw-bold">File Name:</label>
                            <p className="mb-1">{viewingEntry.sheet_file || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Failed to load entry details.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseViewModal}
                >
                  <i className="fas fa-times me-2"></i>Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryList;
