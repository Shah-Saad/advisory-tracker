import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Admin/NotificationPanel.css';

const UserNotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    checkPatchingReminders(); // Check for patching reminders on component mount
    fetchNotifications();
    fetchUnreadCount();
    detectDarkTheme();
    
    // Set up polling for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const detectDarkTheme = () => {
    // Check if the dashboard has a dark background
    const dashboardElement = document.querySelector('[style*="background: linear-gradient(135deg, #28a745"]');
    const hasDarkBackground = dashboardElement !== null;
    setIsDarkTheme(hasDarkBackground);
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/notifications', {
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
      const response = await axios.get('http://localhost:3000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const checkPatchingReminders = async (forceCheck = false) => {
    try {
      // Check if we've already run the daily check today (unless force check)
      const today = new Date().toDateString();
      const lastCheckDate = localStorage.getItem('lastPatchingReminderCheck');
      
      if (!forceCheck && lastCheckDate === today) {
        console.log('✅ Daily patching reminder check already completed today');
        return;
      }
      
      console.log(forceCheck ? '🔍 Force checking patching reminders...' : '🔍 Running daily patching reminder check...');
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/notifications/check-patching-reminders', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.checked) {
        console.log('✅ Patching reminders checked successfully');
        // Update notifications and unread count with the response data
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
        
        // Mark that we've completed the daily check (only if not force check)
        if (!forceCheck) {
          localStorage.setItem('lastPatchingReminderCheck', today);
          console.log('✅ Daily patching reminder check completed and saved');
        } else {
          console.log('✅ Force patching reminder check completed');
        }
      }
    } catch (error) {
      console.error('Error checking patching reminders:', error);
      // Don't show error to user, just log it
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the notification from the list instead of marking as read
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Use the dedicated remove-all endpoint
      await axios.put('http://localhost:3000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear all notifications from the UI
      setNotifications([]);
      setUnreadCount(0);
      
      console.log('All notifications removed successfully');
    } catch (error) {
      console.error('Error removing all notifications:', error);
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
          <div className={`notification-dropdown ${isDarkTheme ? 'dark-mode' : ''}`}>
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
                     checkPatchingReminders(); // Check for new patching reminders
                     fetchNotifications();
                     fetchUnreadCount();
                   }}
                   title="Refresh notifications and check patching reminders"
                 >
                   <i className="fas fa-sync-alt"></i>
                 </button>
                 <button 
                   className="btn btn-sm btn-link text-warning p-0 me-2"
                   onClick={() => {
                     checkPatchingReminders(true); // Force check patching reminders
                     fetchNotifications();
                     fetchUnreadCount();
                   }}
                   title="Force check patching reminders (bypass daily limit)"
                 >
                   <i className="fas fa-exclamation-triangle"></i>
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
                    className={`notification-item p-3 border-bottom ${
                      notification.type === 'patching_reminder' 
                        ? 'bg-warning bg-opacity-10 border-warning' 
                        : !notification.read_at 
                          ? 'bg-light' 
                          : ''
                    }`}
                  >
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-2">
                        {notification.type === 'patching_reminder' ? (
                          <div className="text-warning">
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '0.9rem' }}></i>
                          </div>
                        ) : (
                          <div className={`rounded-circle d-flex align-items-center justify-content-center ${!notification.read_at ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '8px', height: '8px' }}>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className={`mb-1 fw-bold ${notification.type === 'patching_reminder' ? 'text-warning' : ''}`} style={{ fontSize: '0.9rem' }}>
                            {notification.title}
                          </h6>
                          <small className="text-muted">
                            {formatTimeAgo(notification.created_at)}
                          </small>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '0.8rem' }}>
                          {notification.message}
                        </p>
                        
                        {/* Entry Details */}
                        {notification.data && (
                          <div className="entry-details mb-2">
                            <div className="d-flex flex-column gap-1">
                              {/* Patching Reminder Specific Details */}
                              {notification.type === 'patching_reminder' && (
                                <>
                                  {notification.data.product_name && (
                                    <div className="d-flex">
                                      <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Product:</strong>
                                      <span className="text-warning fw-bold" style={{ fontSize: '0.75rem' }}>
                                        {notification.data.product_name}
                                      </span>
                                    </div>
                                  )}
                                  {notification.data.vendor && (
                                    <div className="d-flex">
                                      <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Vendor:</strong>
                                      <span className="text-info" style={{ fontSize: '0.75rem' }}>
                                        {notification.data.vendor}
                                      </span>
                                    </div>
                                  )}
                                  {notification.data.patching_date && (
                                    <div className="d-flex">
                                      <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Due Date:</strong>
                                      <span className="text-danger fw-bold" style={{ fontSize: '0.75rem' }}>
                                        {new Date(notification.data.patching_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {notification.data.current_status && (
                                    <div className="d-flex">
                                      <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Status:</strong>
                                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                        {notification.data.current_status}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* Regular Notification Details */}
                              {notification.type !== 'patching_reminder' && (
                                <>
                                  {notification.data.sheet_title && (
                                    <div className="d-flex">
                                      <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Sheet:</strong>
                                      <span className="text-primary" style={{ fontSize: '0.75rem' }}>
                                        {notification.data.sheet_title}
                                      </span>
                                    </div>
                                  )}
                                  {notification.data.team_name && (
                                    <div className="d-flex">
                                      <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Team:</strong>
                                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        {notification.data.team_name}
                                      </span>
                                    </div>
                                  )}
                                  {notification.data.action && (
                                    <div className="d-flex">
                                      <strong className="text-dark me-2" style={{ fontSize: '0.75rem', minWidth: '60px' }}>Action:</strong>
                                      <span className="text-info" style={{ fontSize: '0.75rem' }}>
                                        {notification.data.action}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <div>
                            {notification.data && notification.data.sheet_id && (
                              <button
                                className={`btn btn-sm me-2 ${
                                  notification.type === 'patching_reminder' 
                                    ? 'btn-warning' 
                                    : 'btn-outline-primary'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  
                                  if (notification.type === 'patching_reminder') {
                                    // For patching reminders, navigate with entry highlighting
                                    const url = `/team-sheets/${notification.data.sheet_id}?highlight_entry=${notification.data.entry_id}`;
                                    window.open(url, '_blank');
                                  } else {
                                    // For regular notifications, navigate normally
                                    const url = `/team-sheets/${notification.data.sheet_id}`;
                                    window.open(url, '_blank');
                                  }
                                }}
                                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                              >
                                <i className={`fas ${notification.type === 'patching_reminder' ? 'fa-exclamation-triangle' : 'fa-eye'} me-1`}></i>
                                {notification.type === 'patching_reminder' ? 'View Entry' : 'View Sheet'}
                              </button>
                            )}
                          </div>
                          <div>
                            {!notification.read_at && (
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
          className="notification-overlay" 
          onClick={() => setShowPanel(false)}
        ></div>
      )}
    </div>
  );
};

export default UserNotificationPanel;
