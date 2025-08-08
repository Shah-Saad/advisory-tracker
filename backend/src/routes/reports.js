const express = require('express');
const router = express.Router();
const ReportingService = require('../services/ReportingService');
const { auth } = require('../middlewares/auth');

/**
 * @route GET /api/reports/monthly
 * @desc Generate monthly active entries report
 * @access Private (Admin only)
 */
router.get('/monthly', auth, async (req, res) => {
  try {
    // Only admins can access reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin access required.' 
      });
    }

    const { month } = req.query; // Format: YYYY-MM
    const report = await ReportingService.generateMonthlyActiveEntriesReport(month, req.user.id);

    res.json({
      success: true,
      message: 'Monthly report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate monthly report', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/reports/patching-progress
 * @desc Get current patching progress summary
 * @access Private (Admin only)
 */
router.get('/patching-progress', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin access required.' 
      });
    }

    const summary = await ReportingService.getPatchingProgressSummary();

    res.json({
      success: true,
      message: 'Patching progress summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    console.error('Error getting patching progress:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get patching progress summary', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/reports/team-performance
 * @desc Get team performance summary
 * @access Private (Admin only)
 */
router.get('/team-performance', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin access required.' 
      });
    }

    const summary = await ReportingService.getTeamPerformanceSummary();

    res.json({
      success: true,
      message: 'Team performance summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    console.error('Error getting team performance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get team performance summary', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/reports/dashboard-stats
 * @desc Get real-time dashboard statistics for active entries
 * @access Private (Admin only)
 */
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin access required.' 
      });
    }

    // Get comprehensive stats for the dashboard
    const patchingProgress = await ReportingService.getPatchingProgressSummary();
    const teamPerformance = await ReportingService.getTeamPerformanceSummary();

    const dashboardStats = {
      patching_summary: patchingProgress,
      team_performance: teamPerformance,
      last_updated: new Date()
    };

    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: dashboardStats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get dashboard statistics', 
      error: error.message 
    });
  }
});

module.exports = router;
