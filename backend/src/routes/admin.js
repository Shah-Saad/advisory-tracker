
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const UserManagementService = require('../services/UserManagementService');
const SheetEntryService = require('../services/SheetEntryService');
const TeamService = require('../services/TeamService');
const CISAService = require('../services/CISAService');

// Middleware to ensure only admins can access these routes
router.use(requireAuth);
router.use(requireRole(['admin']));

// Get all users
router.get('/users', async (req, res) => {
  try {
    // Prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const users = await UserManagementService.getAllUsers();
    console.log('API: Returning users with team data:', users.map(u => ({ username: u.username, team: u.team })));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role, team } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Map frontend role names to backend role names
    const roleMapping = {
      'user': 'team_member',
      'manager': 'team_lead',
      'admin': 'admin'
    };
    
    // Map frontend team names to backend team names
    const teamMapping = {
      'generation': 'Generation',
      'distribution': 'Distribution', 
      'transmission': 'Transmission'
    };

    const userData = {
      username,
      email,
      password,
      first_name,
      last_name,
      role: roleMapping[role] || 'team_member',
      team: team ? (teamMapping[team.toLowerCase()] || team) : undefined // Include team assignment with mapping
    };

    const newUser = await UserManagementService.createUser(userData, req.user.id);
    res.status(201).json({ 
      message: 'User created successfully', 
      user: { ...newUser, password: undefined } // Don't return password
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    await UserManagementService.updateUserStatus(id, isActive);
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated this way
    delete updateData.password;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const updatedUser = await UserManagementService.updateUser(id, updateData);
    res.json({ 
      message: 'User updated successfully', 
      user: { ...updatedUser, password: undefined } 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await UserManagementService.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user permissions
router.get('/users/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = await UserManagementService.getUserPermissions(id);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// Update user permissions
router.put('/users/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    await UserManagementService.updateUserPermissions(id, permissions);
    res.json({ message: 'User permissions updated successfully' });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

// Team Management Routes

// Get all operational teams
router.get('/teams/operational', async (req, res) => {
  try {
    const teams = TeamService.getOperationalTeams();
    res.json(teams);
  } catch (error) {
    console.error('Error getting operational teams:', error);
    res.status(500).json({ error: 'Failed to get operational teams' });
  }
});

// Get team statistics for admin monitoring
router.get('/teams/stats', async (req, res) => {
  try {
    const teamStats = await SheetEntryService.getAllTeamStats();
    res.json(teamStats);
  } catch (error) {
    console.error('Error getting team statistics:', error);
    res.status(500).json({ error: 'Failed to get team statistics' });
  }
});

// Distribute existing sheet to all operational teams
router.post('/sheets/:sheetId/distribute-to-teams', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const distributedBy = req.user.id;

    console.log(`Admin ${req.user.username} is distributing sheet ${sheetId} to operational teams`);

    const result = await SheetEntryService.distributeSheetToTeams(parseInt(sheetId), distributedBy);
    
    res.json({
      message: 'Sheet successfully distributed to all operational teams',
      result
    });
  } catch (error) {
    console.error('Error distributing sheet to teams:', error);
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    else if (error.message.includes('No entries found')) statusCode = 400;
    res.status(statusCode).json({ error: error.message });
  }
});

// Assign sheet to specific users
router.post('/sheets/:sheetId/assign-to-users', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { userIds } = req.body;
    const assignedBy = req.user.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    console.log(`Admin ${req.user.username} is assigning sheet ${sheetId} to users:`, userIds);

    const result = await UserManagementService.assignSheetToUsers(parseInt(sheetId), userIds, assignedBy);
    
    res.json({
      message: `Sheet successfully assigned to ${userIds.length} users`,
      result
    });
  } catch (error) {
    console.error('Error assigning sheet to users:', error);
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    else if (error.message.includes('No valid users')) statusCode = 400;
    res.status(statusCode).json({ error: error.message });
  }
});

// Get entries for admin monitoring across all teams
router.get('/teams/monitoring', async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      vendor: req.query.vendor,
      deployed_in_ke: req.query.deployed_in_ke
    };

    const teamData = await SheetEntryService.getEntriesForAdminMonitoring(filters);
    res.json(teamData);
  } catch (error) {
    console.error('Error getting entries for admin monitoring:', error);
    res.status(500).json({ error: 'Failed to get entries for admin monitoring' });
  }
});

// Get entries for a specific team (admin view)
router.get('/teams/:teamName/entries', async (req, res) => {
  try {
    const { teamName } = req.params;
    
    const filters = {
      search: req.query.search,
      status: req.query.status,
      vendor: req.query.vendor,
      deployed_in_ke: req.query.deployed_in_ke,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'id',
      sortOrder: req.query.sortOrder || 'asc'
    };

    const entries = await SheetEntryService.getEntriesByTeam(teamName, filters);
    res.json(entries);
  } catch (error) {
    console.error(`Error getting entries for team ${req.params.teamName}:`, error);
    res.status(500).json({ error: `Failed to get entries for team ${req.params.teamName}` });
  }
});

// Update user team assignment
router.patch('/users/:id/team', async (req, res) => {
  try {
    const { id } = req.params;
    const { team } = req.body;
    
    const operationalTeams = ['generation', 'distribution', 'transmission'];
    if (team && !operationalTeams.includes(team)) {
      return res.status(400).json({ 
        error: `Invalid team. Must be one of: ${operationalTeams.join(', ')}` 
      });
    }

    const updateData = { team: team || null };
    const updatedUser = await UserManagementService.updateUser(id, updateData);
    
    res.json({ 
      message: 'User team assignment updated successfully', 
      user: { ...updatedUser, password: undefined } 
    });
  } catch (error) {
    console.error('Error updating user team:', error);
    res.status(500).json({ error: 'Failed to update user team assignment' });
  }
});

// Generate CISA Advisory Excel Report
router.post('/generate-cisa-report', async (req, res) => {
  try {
    const { month, year } = req.body;
    
    // Validate inputs
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Month and year are required' 
      });
    }
    
    if (month < 1 || month > 12) {
      return res.status(400).json({ 
        error: 'Month must be between 1 and 12' 
      });
    }
    
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ 
        error: 'Please provide a valid year' 
      });
    }
    
    console.log(`🔄 Admin ${req.user.email} requested CISA report for ${month}/${year}`);
    
    // Generate the report
    const report = await CISAService.generateMonthlyReport(month, year);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.setHeader('Content-Length', report.buffer.length);
    
    console.log(`✅ CISA report generated: ${report.filename} (${report.count} advisories)`);
    
    // Send the Excel file
    res.send(report.buffer);
    
  } catch (error) {
    console.error('Error generating CISA report:', error);
    res.status(500).json({ 
      error: 'Failed to generate CISA report',
      message: error.message 
    });
  }
});

// Get CISA Advisory Preview (without generating file)
router.post('/preview-cisa-advisories', async (req, res) => {
  try {
    const { month, year, page: rawPage, pageSize: rawPageSize } = req.body;
    const page = Math.max(parseInt(rawPage || 1, 10), 1);
    const pageSize = Math.min(Math.max(parseInt(rawPageSize || 10, 10), 1), 100);
    
    // Validate inputs
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Month and year are required' 
      });
    }
    
    if (month < 1 || month > 12) {
      return res.status(400).json({ 
        error: 'Month must be between 1 and 12' 
      });
    }
    
    console.log(`👀 Admin ${req.user.email} requested CISA advisory preview for ${month}/${year}`);
    
    // Just scrape the advisories without generating Excel
    const advisories = await CISAService.scrapeAdvisories(month, year);

    const totalFound = advisories.length;
    const totalPages = Math.max(Math.ceil(totalFound / pageSize), 1);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageItems = advisories.slice(startIndex, endIndex);

    res.json({
      month: CISAService.getMonthName(month),
      year,
      count: pageItems.length,
      totalFound,
      page,
      pageSize,
      totalPages,
      advisories: pageItems
    });
    
  } catch (error) {
    console.error('Error previewing CISA advisories:', error);
    res.status(500).json({ 
      error: 'Failed to preview CISA advisories',
      message: error.message 
    });
  }
});

module.exports = router;
