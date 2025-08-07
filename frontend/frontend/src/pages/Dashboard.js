import React, { useEffect, useState } from 'react';
import sheetService from '../services/sheetService';

const Dashboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sheetService.getAllEntries();
      setEntries(data.entries || data);
    } catch (err) {
      setError(err.message || 'Failed to fetch entries');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <h2>Sheet Entries</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              {/* Add more columns as needed */}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.name}</td>
                {/* Add more columns as needed */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard; 