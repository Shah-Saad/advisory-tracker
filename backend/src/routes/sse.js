const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Store active SSE connections
const sseClients = new Map();

/**
 * @route GET /api/sse/subscribe
 * @desc Subscribe to server-sent events for real-time updates
 * @access Private (Admin only)
 */
router.get('/subscribe', (req, res) => {
  // Get token from query parameter since EventSource doesn't support custom headers
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = decoded;

    // Only allow admin users to subscribe to SSE
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const clientId = `admin_${user.id}_${Date.now()}`;
    
    // Check if this user already has a connection and close the old one
    const existingConnections = Array.from(sseClients.entries()).filter(([id, client]) => 
      client.userId === user.id
    );
    
    if (existingConnections.length > 0) {
      console.log(`Closing ${existingConnections.length} existing connections for user ${user.id}`);
      existingConnections.forEach(([existingId, existingClient]) => {
        try {
          existingClient.response.end();
        } catch (e) {
          // Connection might already be closed
        }
        sseClients.delete(existingId);
      });
    }
    
    // Store the client connection
    sseClients.set(clientId, {
      response: res,
      userId: user.id,
      userRole: user.role,
      connectedAt: new Date()
    });

    console.log(`SSE Client connected: ${clientId} (${sseClients.size} total clients)`);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Successfully connected to live updates',
      clientId: clientId,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      if (sseClients.has(clientId)) {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnection
    req.on('close', () => {
      console.log(`SSE Client disconnected: ${clientId}`);
      sseClients.delete(clientId);
      clearInterval(heartbeat);
    });

    req.on('error', (err) => {
      console.error(`SSE Client error for ${clientId}:`, err);
      sseClients.delete(clientId);
      clearInterval(heartbeat);
    });

  } catch (error) {
    console.error('SSE authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

/**
 * Send update to all connected SSE clients
 * @param {Object} data - Data to send to clients
 * @param {string} eventType - Type of event (optional)
 */
function broadcastToAdmins(data, eventType = 'update') {
  const message = JSON.stringify({
    type: eventType,
    data: data,
    timestamp: new Date().toISOString()
  });

  console.log(`Broadcasting SSE message to ${sseClients.size} clients:`, eventType);

  // Send to all connected admin clients
  sseClients.forEach((client, clientId) => {
    try {
      client.response.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error(`Error sending SSE message to client ${clientId}:`, error);
      // Remove broken connections
      sseClients.delete(clientId);
    }
  });
}

/**
 * Get current SSE client statistics
 */
function getSSEStats() {
  return {
    totalClients: sseClients.size,
    clients: Array.from(sseClients.entries()).map(([clientId, client]) => ({
      clientId,
      userId: client.userId,
      userRole: client.userRole,
      connectedAt: client.connectedAt
    }))
  };
}

module.exports = { 
  router, 
  broadcastToAdmins, 
  getSSEStats 
};
