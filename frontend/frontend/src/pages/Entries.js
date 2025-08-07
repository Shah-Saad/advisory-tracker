import React, { useEffect, useState } from 'react';
import sheetService from '../services/sheetService';

const Entries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newEntry, setNewEntry] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editEntry, setEditEntry] = useState({});

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sheetService.getAllEntries();
      setEntries(data.entries || data); // adapt to API response
    } catch (err) {
      setError(err.message || 'Failed to fetch entries');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setNewEntry({ ...newEntry, [e.target.name]: e.target.value });
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // You may need to adjust the endpoint for adding entries
      await sheetService.addEntry(newEntry);
      setNewEntry({});
      fetchEntries();
    } catch (err) {
      setError(err.message || 'Failed to add entry');
    }
  };

  const handleEditClick = (entry) => {
    setEditingId(entry.id);
    setEditEntry(entry);
  };

  const handleEditInputChange = (e) => {
    setEditEntry({ ...editEntry, [e.target.name]: e.target.value });
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await sheetService.updateEntry(editingId, editEntry);
      setEditingId(null);
      setEditEntry({});
      fetchEntries();
    } catch (err) {
      setError(err.message || 'Failed to update entry');
    }
  };

  const handleDeleteEntry = async (id) => {
    setError('');
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await sheetService.deleteEntry(id);
      fetchEntries();
    } catch (err) {
      setError(err.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Entries</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="mb-3" onSubmit={handleAddEntry}>
        {/* Add fields as per your entry model */}
        <input
          type="text"
          name="name"
          placeholder="Entry Name"
          value={newEntry.name || ''}
          onChange={handleInputChange}
          className="form-control mb-2"
          required
        />
        {/* Add more fields as needed */}
        <button type="submit" className="btn btn-primary">Add Entry</button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              {/* Add more columns as needed */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>
                  {editingId === entry.id ? (
                    <input
                      type="text"
                      name="name"
                      value={editEntry.name || ''}
                      onChange={handleEditInputChange}
                      className="form-control"
                    />
                  ) : (
                    entry.name
                  )}
                </td>
                {/* Add more columns as needed */}
                <td>
                  {editingId === entry.id ? (
                    <>
                      <button className="btn btn-success btn-sm me-2" onClick={handleUpdateEntry}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditClick(entry)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEntry(entry.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Entries; 