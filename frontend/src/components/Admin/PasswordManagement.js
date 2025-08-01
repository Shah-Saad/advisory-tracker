import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaKey, FaUser, FaSearch, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';

const PasswordManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState({});
  const [showAdminPasswordForm, setShowAdminPasswordForm] = useState(false);
  const [adminPasswordForm, setAdminPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showAdminPasswords, setShowAdminPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [adminPasswordLoading, setAdminPasswordLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out admin users from the reset list
        const nonAdminUsers = data.filter(user => user.role_name !== 'Admin');
        setUsers(nonAdminUsers);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to reset ${username}'s password to "123456"?`)) {
      return;
    }

    setResetLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/password/reset/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success(`${username}'s password has been reset to "123456"`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error resetting password');
    } finally {
      setResetLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const toggleAdminPasswordVisibility = (field) => {
    setShowAdminPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAdminPasswordChange = (e) => {
    setAdminPasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const submitAdminPasswordChange = async (e) => {
    e.preventDefault();
    
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (adminPasswordForm.newPassword.length < 8) {
      toast.error('Admin password must be at least 8 characters');
      return;
    }

    if (adminPasswordForm.currentPassword === adminPasswordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setAdminPasswordLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/password/admin-change', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: adminPasswordForm.currentPassword,
          newPassword: adminPasswordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Admin password changed successfully');
        setAdminPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowAdminPasswordForm(false);
      } else {
        toast.error(data.error || 'Failed to change admin password');
      }
    } catch (error) {
      console.error('Error changing admin password:', error);
      toast.error('An error occurred while changing password');
    } finally {
      setAdminPasswordLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="text-primary">
              <FaKey className="me-2" />
              Password Management
            </h4>
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowAdminPasswordForm(!showAdminPasswordForm)}
            >
              <FaLock className="me-2" />
              Change Admin Password
            </button>
          </div>

          {/* Admin Password Change Form */}
          {showAdminPasswordForm && (
            <div className="card mb-4 shadow-sm">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <FaLock className="me-2" />
                  Change Admin Password
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={submitAdminPasswordChange}>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="adminCurrentPassword" className="form-label">
                        Current Password *
                      </label>
                      <div className="input-group">
                        <input
                          type={showAdminPasswords.current ? "text" : "password"}
                          className="form-control"
                          id="adminCurrentPassword"
                          name="currentPassword"
                          value={adminPasswordForm.currentPassword}
                          onChange={handleAdminPasswordChange}
                          required
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => toggleAdminPasswordVisibility('current')}
                        >
                          {showAdminPasswords.current ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="adminNewPassword" className="form-label">
                        New Password *
                      </label>
                      <div className="input-group">
                        <input
                          type={showAdminPasswords.new ? "text" : "password"}
                          className="form-control"
                          id="adminNewPassword"
                          name="newPassword"
                          value={adminPasswordForm.newPassword}
                          onChange={handleAdminPasswordChange}
                          required
                          minLength={8}
                          placeholder="Min 8 characters"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => toggleAdminPasswordVisibility('new')}
                        >
                          {showAdminPasswords.new ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="adminConfirmPassword" className="form-label">
                        Confirm Password *
                      </label>
                      <div className="input-group">
                        <input
                          type={showAdminPasswords.confirm ? "text" : "password"}
                          className="form-control"
                          id="adminConfirmPassword"
                          name="confirmPassword"
                          value={adminPasswordForm.confirmPassword}
                          onChange={handleAdminPasswordChange}
                          required
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => toggleAdminPasswordVisibility('confirm')}
                        >
                          {showAdminPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAdminPasswordForm(false);
                        setAdminPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      disabled={adminPasswordLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-warning"
                      disabled={adminPasswordLoading}
                    >
                      {adminPasswordLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User Password Reset Section */}
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Reset User Passwords
              </h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search users by username or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <button
                    className="btn btn-outline-info"
                    onClick={fetchUsers}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                      </>
                    ) : (
                      'Refresh Users'
                    )}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Team</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            {searchTerm ? 'No users found matching your search' : 'No users available'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => (
                          <tr key={user.id}>
                            <td>
                              <strong>{user.username}</strong>
                            </td>
                            <td>
                              {user.first_name} {user.last_name}
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                {user.role_name}
                              </span>
                            </td>
                            <td>
                              {user.team_name || 'No Team'}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => resetUserPassword(user.id, user.username)}
                                disabled={resetLoading[user.id]}
                                title={`Reset ${user.username}'s password to "123456"`}
                              >
                                {resetLoading[user.id] ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Resetting...
                                  </>
                                ) : (
                                  <>
                                    <FaKey className="me-1" />
                                    Reset Password
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredUsers.length > 0 && (
                <div className="mt-3 text-muted small">
                  <strong>Note:</strong> Resetting a user's password will set it to "123456". 
                  The user should change this password upon their next login for security.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordManagement;
