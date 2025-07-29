import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
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
      const response = await axios.get('/api/notifications/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
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
        await axios.put(`/api/notifications/${notification.id}/read`, {}, {
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
              <h6 className="mb-0 fw-bold">Notifications</h6>
              <div>
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
                    style={{ cursor: 'pointer' }}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
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
                        <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                          {notification.message}
                        </p>
                        {notification.entry_id && (
                          <small className="text-primary">
                            Entry ID: {notification.entry_id}
                          </small>
                        )}
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
