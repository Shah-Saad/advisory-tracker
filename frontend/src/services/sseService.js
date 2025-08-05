// SSE Service for real-time updates
class SSEService {
  constructor() {
    this.eventSource = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.listeners = new Map();
  }

  // Connect to SSE endpoint
  connect() {
    // Don't create multiple connections
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      console.log('SSE already connected or connecting');
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
      
      console.log('Connecting to SSE:', sseUrl);
      this.eventSource = new EventSource(sseUrl);
      
      this.eventSource.onopen = (event) => {
        console.log('SSE connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.emit('connected', { timestamp: new Date() });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE message received:', data);
          
          // Emit the event to registered listeners
          this.emit(data.type, data);
          
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
          
          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay);
          
          // Exponential backoff
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        } else {
          console.error('Max reconnection attempts reached');
          this.emit('maxReconnectAttemptsReached');
        }
      };

    } catch (error) {
      console.error('Error creating SSE connection:', error);
    }
  }

  // Disconnect from SSE
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
    console.log('SSE connection closed');
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
