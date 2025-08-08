const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Get dashboard statistics for admin
router.get('/stats', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    // Get vendor statistics from sheet entries
    const vendorStats = await db('sheet_entries')
      .select('oem_vendor')
      .whereNotNull('oem_vendor')
      .andWhere('oem_vendor', '!=', '')
      .groupBy('oem_vendor')
      .count('* as count');

    // Get product statistics from sheet entries
    const productStats = await db('sheet_entries')
      .select('product_name')
      .whereNotNull('product_name')
      .andWhere('product_name', '!=', '')
      .groupBy('product_name')
      .count('* as count');

    // Get risk level statistics
    const riskStats = await db('sheet_entries')
      .select('risk_level')
      .whereNotNull('risk_level')
      .andWhere('risk_level', '!=', '')
      .groupBy('risk_level')
      .count('* as count');

    // Get status statistics
    const statusStats = await db('sheet_entries')
      .select('status')
      .whereNotNull('status')
      .andWhere('status', '!=', '')
      .groupBy('status')
      .count('* as count');

    // Get sheet statistics
    const sheetStats = await db('sheets')
      .select('status')
      .groupBy('status')
      .count('* as count');

    // Calculate totals
    const totalVendors = vendorStats.length;
    const totalProducts = productStats.length;
    const totalEntries = await db('sheet_entries').count('* as count').first();
    const totalSheets = await db('sheets').count('* as count').first();

    // Get top vendors by entry count
    const topVendors = vendorStats
      .sort((a, b) => parseInt(b.count) - parseInt(a.count))
      .slice(0, 10);

    // Get top products by entry count
    const topProducts = productStats
      .sort((a, b) => parseInt(b.count) - parseInt(a.count))
      .slice(0, 10);

    res.json({
      summary: {
        totalVendors,
        totalProducts,
        totalEntries: parseInt(totalEntries.count),
        totalSheets: parseInt(totalSheets.count)
      },
      vendors: {
        total: totalVendors,
        top: topVendors.map(v => ({
          name: v.oem_vendor,
          entries: parseInt(v.count)
        }))
      },
      products: {
        total: totalProducts,
        top: topProducts.map(p => ({
          name: p.product_name,
          entries: parseInt(p.count)
        }))
      },
      risks: riskStats.map(r => ({
        level: r.risk_level,
        count: parseInt(r.count)
      })),
      statuses: statusStats.map(s => ({
        status: s.status,
        count: parseInt(s.count)
      })),
      sheets: sheetStats.map(s => ({
        status: s.status,
        count: parseInt(s.count)
      }))
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      details: error.message 
    });
  }
});

// Get vendor details with products
router.get('/vendors/:vendorName', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { vendorName } = req.params;
    
    const vendorEntries = await db('sheet_entries')
      .select('product_name', 'risk_level', 'status', 'cve')
      .where('oem_vendor', vendorName)
      .whereNotNull('product_name')
      .andWhere('product_name', '!=', '');

    const products = {};
    vendorEntries.forEach(entry => {
      if (!products[entry.product_name]) {
        products[entry.product_name] = {
          name: entry.product_name,
          entries: 0,
          risks: {},
          statuses: {}
        };
      }
      
      products[entry.product_name].entries++;
      
      if (entry.risk_level) {
        products[entry.product_name].risks[entry.risk_level] = 
          (products[entry.product_name].risks[entry.risk_level] || 0) + 1;
      }
      
      if (entry.status) {
        products[entry.product_name].statuses[entry.status] = 
          (products[entry.product_name].statuses[entry.status] || 0) + 1;
      }
    });

    res.json({
      vendor: vendorName,
      totalEntries: vendorEntries.length,
      products: Object.values(products)
    });

  } catch (error) {
    console.error('Error fetching vendor details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vendor details',
      details: error.message 
    });
  }
});

module.exports = router;
