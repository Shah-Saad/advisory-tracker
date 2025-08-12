import React, { useState, useEffect } from 'react';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for SSE notifications
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/sse`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'file_uploaded' || data.type === 'entry_updated' || data.type === 'team_response_updated') {
        const notification = {
          id: Date.now() + Math.random(),
          type: data.type,
          message: getNotificationMessage(data),
          timestamp: new Date().toISOString(),
          user: data.updatedBy?.name || data.uploadedBy?.name || 'Unknown User',
          team: data.updatedBy?.team || data.uploadedBy?.team || 'Unknown Team',
          severity: getSeverity(data.type)
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
        setIsVisible(true);
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 8000);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getNotificationMessage = (data) => {
    switch (data.type) {
      case 'file_uploaded':
        return `New file uploaded: ${data.fileName || 'Unknown file'}`;
      case 'entry_updated':
        return `Entry updated: ${data.entryId || 'Unknown entry'}`;
      case 'team_response_updated':
        return `Team response updated: ${data.responseId || 'Unknown response'}`;
      default:
        return 'System update';
    }
  };

  const getSeverity = (type) => {
    switch (type) {
      case 'file_uploaded':
        return 'info';
      case 'entry_updated':
        return 'warning';
      case 'team_response_updated':
        return 'success';
      default:
        return 'info';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="admin-notifications">
      <div className="notifications-header">
        <h6 className="mb-0">
          <i className="fas fa-bell text-warning me-2"></i>
          Recent Activity ({notifications.length})
        </h6>
        <button 
          className="btn btn-sm btn-outline-secondary" 
          onClick={clearNotifications}
          title="Clear all notifications"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item notification-${notification.severity}`}
          >
            <div className="notification-content">
              <div className="notification-message">
                <strong>{notification.message}</strong>
              </div>
              <div className="notification-details">
                <small className="text-muted">
                  <i className="fas fa-user me-1"></i>
                  {notification.user} ({notification.team})
                </small>
                <small className="text-muted ms-2">
                  <i className="fas fa-clock me-1"></i>
                  {formatTime(notification.timestamp)}
                </small>
              </div>
            </div>
            <button 
              className="btn btn-sm btn-link text-muted p-0"
              onClick={() => removeNotification(notification.id)}
              title="Dismiss notification"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotifications;
