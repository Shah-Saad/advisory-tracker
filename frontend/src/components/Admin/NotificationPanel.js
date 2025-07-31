import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  // Debug: Log token and user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('NotificationPanel Debug:');
    console.log('Token exists:', !!token);
    console.log('User:', user ? JSON.parse(user) : 'No user');
    console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'No token');
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Set up polling for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched notifications:', response.data);
      setNotifications(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/notifications/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched stats:', response.data);
      setUnreadCount(response.data.data.unread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await axios.put(`http://localhost:3000/api/notifications/${notification.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-panel">
      {/* Notification Bell Icon */}
      <div className="position-relative">
        <button
          className="btn btn-outline-secondary position-relative"
          onClick={() => setShowPanel(!showPanel)}
          title="Notifications"
        >
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown Panel */}
        {showPanel && (
          <div className="notification-dropdown position-absolute top-100 end-0 mt-2 bg-white border rounded shadow-lg" style={{ width: '350px', maxHeight: '400px', zIndex: 1050 }}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-bell me-2"></i>
                Notifications
                {unreadCount > 0 && (
                  <span className="badge bg-danger ms-2">{unreadCount}</span>
                )}
              </h6>
              <div>
                <button 
                  className="btn btn-sm btn-link text-info p-0 me-2"
                  onClick={() => {
                    fetchNotifications();
                    fetchUnreadCount();
                  }}
                  title="Refresh notifications"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
                {unreadCount > 0 && (
                  <button 
                    className="btn btn-sm btn-link text-primary p-0 me-2"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-link text-secondary p-0"
                  onClick={() => setShowPanel(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Notification Summary */}
            {notifications.length > 0 && (
              <div className="p-2 bg-light border-bottom">
                <div className="row text-center">
                  <div className="col-4">
                    <small className="text-muted d-block">Total</small>
                    <strong>{notifications.length}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Unread</small>
                    <strong className="text-danger">{unreadCount}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Today</small>
                    <strong className="text-info">
                      {notifications.filter(n => {
                        const today = new Date().toDateString();
                        const notifDate = new Date(n.created_at).toDateString();
                        return today === notifDate;
                      }).length}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center p-3 text-danger">
                  <i className="fas fa-exclamation-triangle"></i>
                  <br />
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <br />
                  No notifications yet
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`notification-item p-3 border-bottom ${!notification.is_read ? 'bg-light' : ''}`}
                  >
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-2">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${!notification.is_read ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '8px', height: '8px' }}>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>
                            {notification.title}
                          </h6>
                          <small className="text-muted">
                            {formatTimeAgo(notification.created_at)}
                          </small>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '0.8rem' }}>
                          <strong>{notification.user_username}</strong> {notification.message}
                        </p>
                        
                        {/* Entry Details */}
                        {notification.entry_id && (
                          <div className="entry-details mb-2">
                            <div className="d-flex flex-column gap-1">
                              {notification.product_name && (
                                <div className="d-flex">
                                  <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Product:</strong>
                                  <span className="text-primary" style={{ fontSize: '0.75rem' }}>
                                    {notification.product_name}
                                  </span>
                                </div>
                              )}
                              {notification.oem_vendor && (
                                <div className="d-flex">
                                  <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Vendor:</strong>
                                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {notification.oem_vendor}
                                  </span>
                                </div>
                              )}
                              {notification.risk_level && (
                                <div className="d-flex">
                                  <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Risk:</strong>
                                  <span className={`badge badge-sm ${
                                    notification.risk_level === 'Critical' ? 'bg-danger' :
                                    notification.risk_level === 'High' ? 'bg-warning' :
                                    notification.risk_level === 'Medium' ? 'bg-info' : 'bg-success'
                                  }`} style={{ fontSize: '0.65rem' }}>
                                    {notification.risk_level}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <div>
                            {notification.entry_id && (
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to entries page with filter for this entry
                                  window.open(`/entries?highlight=${notification.entry_id}`, '_blank');
                                }}
                                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                              >
                                <i className="fas fa-eye me-1"></i>
                                View Entry
                              </button>
                            )}
                          </div>
                          <div>
                            {!notification.is_read && (
                              <button
                                className="btn btn-sm btn-link text-primary p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                style={{ fontSize: '0.7rem' }}
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="text-center p-2 border-top">
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchNotifications}
                >
                  <i className="fas fa-sync-alt me-1"></i>
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay to close panel when clicking outside */}
      {showPanel && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          style={{ zIndex: 1040 }}
          onClick={() => setShowPanel(false)}
        ></div>
      )}
    </div>
  );
};

export default NotificationPanel;
