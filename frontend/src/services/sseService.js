// SSE Service for real-time updates
class SSEService {
  constructor() {
    this.eventSource = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // Start with 3 seconds for more stability
    this.listeners = new Map();
    this.reconnectTimer = null;
  }

  // Connect to SSE endpoint
  connect() {
    // Don't create multiple connections
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }

    if (this.eventSource && this.eventSource.readyState === EventSource.CONNECTING) {
      console.log('SSE already connecting, waiting...');
      return;
    }

    if (this.eventSource) {
      this.disconnect();
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found, cannot connect to SSE');
      return;
    }

    try {
      // Create EventSource with auth header (note: EventSource doesn't support custom headers directly)
      // We'll include the token as a query parameter
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const sseUrl = `${baseUrl}/sse/subscribe?token=${encodeURIComponent(token)}`;
      
      console.log('SSEService: Connecting to SSE:', sseUrl);
      this.eventSource = new EventSource(sseUrl);
      
      this.eventSource.onopen = (event) => {
        console.log('SSEService: Connection established successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 3000; // Reset to 3 seconds
        this.emit('connected', { timestamp: new Date() });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSEService: Message received:', data);
          
          // Emit the event to registered listeners
          this.emit(data.type, data);
          
        } catch (error) {
          console.error('SSEService: Error parsing message:', error);
        }
      };

      this.eventSource.onerror = (event) => {
        console.error('SSEService: Connection error:', event);
        this.isConnected = false;
        
        // Close the current connection to clean up
        if (this.eventSource.readyState !== EventSource.CLOSED) {
          this.eventSource.close();
        }
        
        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`SSEService: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
          
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, this.reconnectDelay);
          
          // Exponential backoff up to 30 seconds
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
        } else {
          console.error('SSEService: Max reconnection attempts reached');
          this.emit('maxReconnectAttemptsReached');
        }
      };

    } catch (error) {
      console.error('SSEService: Error creating connection:', error);
    }
  }

  // Disconnect from SSE
  disconnect() {
    // Clear any pending reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
    console.log('SSEService: Connection closed');
  }

  // Add event listener
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
  }

  // Remove event listener
  removeEventListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  // Emit event to listeners
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in SSE event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.eventSource ? this.eventSource.readyState : null
    };
  }
}

// Create singleton instance
const sseService = new SSEService();

export default sseService;
