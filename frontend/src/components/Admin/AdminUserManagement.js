import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaKey } from 'react-icons/fa';
import apiClient from '../../services/api';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resetLoading, setResetLoading] = useState({});
  
  // Define the three operational teams
  const operationalTeams = ['generation', 'distribution', 'transmission'];
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    team: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/users', newUser);
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'user',
        team: ''
      });
      setShowCreateForm(false);
      fetchUsers();
      toast.success('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetUserPassword = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to reset ${username}'s password to "123456"?`)) {
      return;
    }

    setResetLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const response = await apiClient.put(`/password/reset/${userId}`);
      toast.success(`${username}'s password has been reset to "123456"`);
      console.log('Password reset response:', response.data);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.delete(`/admin/users/${userId}`);
        fetchUsers();
        toast.success('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { 
        isActive: !currentStatus 
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>User Management</h2>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={fetchUsers}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh Data
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : 'Create New User'}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Create User Form */}
          {showCreateForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Create New User</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleCreateUser}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={newUser.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={newUser.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={newUser.first_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={newUser.last_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={newUser.password}
                        onChange={handleInputChange}
                        required
                        minLength="6"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        name="role"
                        value={newUser.role}
                        onChange={handleInputChange}
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-users me-2"></i>
                        Team Assignment
                      </label>
                      <select
                        className="form-select"
                        name="team"
                        value={newUser.team}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Team Assignment</option>
                        {operationalTeams.map(team => (
                          <option key={team} value={team}>
                            {team.charAt(0).toUpperCase() + team.slice(1)} Team
                          </option>
                        ))}
                      </select>
                      <div className="form-text">
                        <i className="fas fa-info-circle me-1"></i>
                        Assign user to one of the three operational teams (Generation, Distribution, Transmission)
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success">
                      Create User
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">All Users</h5>
            </div>
            <div className="card-body">
              {users.length === 0 ? (
                <p className="text-muted">No users found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Team</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{user.first_name} {user.last_name}</td>
                          <td>
                            <span className={`badge ${
                              user.role === 'admin' ? 'bg-danger' : 
                              user.role === 'manager' ? 'bg-warning' : 'bg-primary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {user.team ? (
                              <span className="badge bg-info text-white fs-6 px-2 py-1">
                                <i className="fas fa-users me-1"></i>
                                {user.team.charAt(0).toUpperCase() + user.team.slice(1)} Team
                              </span>
                            ) : (
                              <span className="text-muted fst-italic">
                                <i className="fas fa-user-slash me-1"></i>
                                No Team Assigned
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className={`btn ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                                title={user.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              {/* Only show reset password button for non-admin users */}
                              {user.role !== 'admin' && (
                                <button
                                  className="btn btn-outline-secondary"
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
                              )}
                              {/* Only show delete button for non-admin users */}
                              {user.role !== 'admin' && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Delete User"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
