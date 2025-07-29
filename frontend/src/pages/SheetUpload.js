import React, { useRef, useState } from 'react';
import sheetService from '../services/sheetService';

const SheetUpload = () => {
  const fileInputRef = useRef();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    const file = fileInputRef.current.files[0];
    if (!file) {
      setError('Please select a file to upload.');
      setLoading(false);
      return;
    }
    try {
      await sheetService.uploadSheet(file);
      setMessage('File uploaded successfully!');
      fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message || 'Upload failed');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <h2>Upload Sheet</h2>
      <form onSubmit={handleUpload}>
        <input type="file" ref={fileInputRef} className="form-control mb-2" />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {message && <div className="alert alert-success mt-2">{message}</div>}
      {error && <div className="alert alert-danger mt-2">{error}</div>}
    </div>
  );
};

export default SheetUpload; 