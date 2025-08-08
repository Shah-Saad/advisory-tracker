const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Store active SSE connections
const sseClients = new Map();

/**
 * @route GET /api/sse/subscribe
 * @desc Subscribe to server-sent events for real-time updates
 * @access Private (All authenticated users)
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

    // Allow all authenticated users to subscribe to SSE for real-time sync
    console.log(`✅ SSE subscription for user: ${user.email} (${user.role})`);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const clientId = `user_${user.id}_${Date.now()}`;
    
    // Check if this user already has a connection and close the old one
    const existingConnections = Array.from(sseClients.entries()).filter(([id, client]) => 
      client.userId === user.id
    );
    
    if (existingConnections.length > 0) {
      console.log(`🔄 Closing ${existingConnections.length} existing connections for user ${user.id}`);
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
      teamId: user.team_id,
      connectedAt: new Date()
    });

    console.log(`📡 SSE Client connected: ${clientId} (${sseClients.size} total clients)`);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Successfully connected to real-time updates',
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
 * Send update to all connected SSE clients (admins and relevant team members)
 * @param {Object} data - Data to send to clients
 * @param {string} eventType - Type of event (optional)
 * @param {number} targetTeamId - Optional team ID to filter recipients
 */
function broadcastToAdmins(data, eventType = 'update', targetTeamId = null) {
  const message = JSON.stringify({
    type: eventType,
    data: data,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Broadcasting SSE message to clients: ${eventType}${targetTeamId ? ` (team ${targetTeamId})` : ' (all)'}`);

  let broadcastCount = 0;

  // Send to all connected clients (admins see everything, team members see relevant updates)
  sseClients.forEach((client, clientId) => {
    try {
      // Send to admins regardless of team
      if (client.userRole === 'admin') {
        client.response.write(`data: ${message}\n\n`);
        broadcastCount++;
      }
      // Send to team members if no specific team filter or if it matches their team
      else if (!targetTeamId || client.teamId === targetTeamId) {
        client.response.write(`data: ${message}\n\n`);
        broadcastCount++;
      }
    } catch (error) {
      console.error(`❌ Error sending SSE message to client ${clientId}:`, error);
      // Remove broken connections
      sseClients.delete(clientId);
    }
  });

  console.log(`📤 SSE message sent to ${broadcastCount}/${sseClients.size} clients`);
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
      teamId: client.teamId,
      connectedAt: client.connectedAt
    }))
  };
}

module.exports = { 
  router, 
  broadcastToAdmins, 
  getSSEStats 
};
