const express = require('express');
const router = express.Router();
const knex = require('../config/db');
const { auth } = require('../middlewares/auth');

// Middleware to check if user is from generation team
const checkGenerationTeam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await knex('users')
      .join('teams', 'users.team_id', 'teams.id')
      .select('teams.name as team_name')
      .where('users.id', userId)
      .first();
    
    if (!user || !user.team_name.toLowerCase().includes('generation')) {
      return res.status(403).json({ 
        error: 'Access denied. This endpoint is only available to generation team members.' 
      });
    }
    
    req.userTeam = user.team_name;
    next();
  } catch (error) {
    console.error('Error checking generation team access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to derive vendor from product name
const deriveVendorFromProduct = (productName) => {
  if (!productName) return null;
  
  const productLower = productName.toLowerCase();
  
  // Common vendor patterns in product names
  const vendorPatterns = {
    'Siemens': ['sinec', 'scalance', 'simatic', 'wincc', 'siplus', 'sitop', 'teamcenter'],
    'Schneider Electric': ['schneider', 'modicon', 'wonderware'],
    'Rockwell Automation': ['controllogix', 'guardlogix', 'compactlogix', 'allen-bradley'],
    'Emerson': ['ovation', 'deltav', 'pacsystem', 'pac system'],
    'Motorola Solutions': ['vigilant', 'motorola'],
    'Johnson Controls': ['johnson controls'],
    'AVEVA': ['aveva'],
    'Westermo': ['westermo'],
    'Fuji Electric': ['fuji electric', 'tellus'],
    'Yokogawa': ['yokogawa', 'fast/tools'],
    'marKoni': ['markoni']
  };
  
  for (const [vendor, patterns] of Object.entries(vendorPatterns)) {
    if (patterns.some(pattern => productLower.includes(pattern))) {
      return vendor;
    }
  }
  
  return null;
};

// Get entries for generation team with view modes
router.get('/entries', auth, checkGenerationTeam, async (req, res) => {
  try {
    const { view_mode = 'all_entries', site, status, user_id } = req.query;
    const currentUserId = req.user.id;
    
    let query = knex('sheet_entries as se')
      .leftJoin('sheets as s', 'se.sheet_id', 's.id')
      .leftJoin('users as u', 'se.assigned_to', 'u.id')
      .leftJoin('teams as t', 'u.team_id', 't.id')
      .leftJoin('vendors as v', 'se.vendor_id', 'v.id')
      .leftJoin('products as p', 'se.product_id', 'p.id')
      .select(
        'se.*',
        's.title as sheet_title',
        's.status as sheet_status',
        'u.id as assigned_to_user_id',
        'u.first_name as assigned_to_first_name',
        'u.last_name as assigned_to_last_name',
        'u.site as assigned_to_site',
        't.name as assigned_to_team_name',
        'v.name as vendor_table_name',
        'p.name as product_table_name'
      );
    
    // Apply view mode filters
    switch (view_mode) {
      case 'my_entries':
        query = query.where('se.assigned_to', currentUserId);
        break;
      case 'all_entries':
        // Show all available entries
        break;
      case 'by_vulnerability':
        // Group by vulnerability - for now treat as all entries
        break;
      case 'team_overview':
        // Show team perspective - all generation team entries
        query = query.where('t.name', 'like', '%generation%');
        break;
    }
    
    // Apply additional filters
    if (site && site !== 'all') {
      query = query.where('se.site', site);
    }
    
    if (status && status !== 'all') {
      switch (status) {
        case 'available':
          query = query.whereNull('se.assigned_to');
          break;
        case 'claimed':
          query = query.where('se.assigned_to', currentUserId);
          break;
        case 'assigned':
          query = query.whereNotNull('se.assigned_to').where('se.assigned_to', '!=', currentUserId);
          break;
        case 'pending_patch':
          query = query.where('se.progress_status', 'awaiting_patch');
          break;
        case 'patched':
          query = query.where('se.progress_status', 'patched');
          break;
      }
    }
    
    const entries = await query.orderBy('se.created_at', 'desc');
    
    // Format the response
    const formattedEntries = entries.map(entry => {
      // Determine the best vendor name to use
      const vendorName = entry.vendor_table_name || entry.oem_vendor || deriveVendorFromProduct(entry.product_name);
      
      return {
        ...entry,
        oem_vendor: vendorName, // Override with best available vendor name
        assigned_to_name: entry.assigned_to_first_name && entry.assigned_to_last_name 
          ? `${entry.assigned_to_first_name} ${entry.assigned_to_last_name}`
          : null
      };
    });
    
    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching generation entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Claim an entry for a user (creates user copy)
router.post('/entries/:entryId/claim', auth, checkGenerationTeam, async (req, res) => {
  try {
    const { entryId } = req.params;
    const { user_id } = req.body;
    const claimingUserId = user_id || req.user.id;
    
    // Start transaction
    await knex.transaction(async (trx) => {
      // Check if entry exists and is not already claimed
      const originalEntry = await trx('sheet_entries')
        .where('id', entryId)
        .first();
      
      if (!originalEntry) {
        throw new Error('Entry not found');
      }
      
      if (originalEntry.assigned_to) {
        throw new Error('Entry is already claimed by another user');
      }
      
      // Get user info
      const user = await trx('users')
        .where('id', claimingUserId)
        .first();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update the entry to assign it to the user
      await trx('sheet_entries')
        .where('id', entryId)
        .update({
          assigned_to: claimingUserId,
          assigned_at: new Date(),
          progress_status: 'investigating',
          last_updated: new Date()
        });
      
      // Log the claiming action
      await trx('entry_logs').insert({
        entry_id: entryId,
        user_id: claimingUserId,
        action: 'claimed',
        details: `Entry claimed by ${user.first_name} ${user.last_name} for site: ${user.site}`,
        created_at: new Date()
      }).catch(() => {
        // If entry_logs table doesn't exist, silently continue
        console.log('Entry logs table not available');
      });
    });
    
    res.json({ 
      message: 'Entry claimed successfully',
      entry_id: entryId,
      assigned_to: claimingUserId
    });
  } catch (error) {
    console.error('Error claiming entry:', error);
    res.status(400).json({ error: error.message || 'Failed to claim entry' });
  }
});

// Release an entry (remove user assignment)
router.post('/entries/:entryId/release', auth, checkGenerationTeam, async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.id;
    
    // Start transaction
    await knex.transaction(async (trx) => {
      // Check if entry exists and is claimed by the user
      const entry = await trx('sheet_entries')
        .where('id', entryId)
        .where('assigned_to', userId)
        .first();
      
      if (!entry) {
        throw new Error('Entry not found or not claimed by you');
      }
      
      // Release the entry
      await trx('sheet_entries')
        .where('id', entryId)
        .update({
          assigned_to: null,
          assigned_at: null,
          progress_status: null,
          progress_notes: null,
          last_updated: new Date()
        });
      
      // Log the release action
      await trx('entry_logs').insert({
        entry_id: entryId,
        user_id: userId,
        action: 'released',
        details: 'Entry released and made available for others to claim',
        created_at: new Date()
      }).catch(() => {
        console.log('Entry logs table not available');
      });
    });
    
    res.json({ 
      message: 'Entry released successfully',
      entry_id: entryId
    });
  } catch (error) {
    console.error('Error releasing entry:', error);
    res.status(400).json({ error: error.message || 'Failed to release entry' });
  }
});

// Update progress on an entry
router.put('/entries/:entryId/progress', auth, checkGenerationTeam, async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.id;
    const { 
      progress_status, 
      progress_notes, 
      estimated_completion_date,
      patching_est_release_date,
      patching_status 
    } = req.body;
    
    // Check if entry exists and is claimed by the user
    const entry = await knex('sheet_entries')
      .where('id', entryId)
      .where('assigned_to', userId)
      .first();
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found or not claimed by you' });
    }
    
    // Prepare update data
    const updateData = {
      last_updated: new Date()
    };
    
    if (progress_status) updateData.progress_status = progress_status;
    if (progress_notes) updateData.progress_notes = progress_notes;
    if (estimated_completion_date) updateData.estimated_completion_date = estimated_completion_date;
    if (patching_est_release_date) updateData.patching_est_release_date = patching_est_release_date;
    if (patching_status) updateData.patching_status = patching_status;
    
    // Update the entry
    await knex('sheet_entries')
      .where('id', entryId)
      .update(updateData);
    
    // Log the progress update
    await knex('entry_logs').insert({
      entry_id: entryId,
      user_id: userId,
      action: 'progress_updated',
      details: `Progress updated: ${progress_status || 'status unchanged'} - ${progress_notes || 'no notes'}`,
      created_at: new Date()
    }).catch(() => {
      console.log('Entry logs table not available');
    });
    
    res.json({ 
      message: 'Progress updated successfully',
      entry_id: entryId,
      updates: updateData
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Mark entry as patched and close it
router.post('/entries/:entryId/mark-patched', auth, checkGenerationTeam, async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.id;
    const { patch_notes, patch_version, patch_date } = req.body;
    
    // Start transaction
    await knex.transaction(async (trx) => {
      // Check if entry exists and is claimed by the user
      const entry = await trx('sheet_entries')
        .where('id', entryId)
        .where('assigned_to', userId)
        .first();
      
      if (!entry) {
        throw new Error('Entry not found or not claimed by you');
      }
      
      // Mark as patched
      await trx('sheet_entries')
        .where('id', entryId)
        .update({
          progress_status: 'patched',
          patching_status: 'completed',
          patched_date: patch_date || new Date(),
          patch_version: patch_version,
          patch_notes: patch_notes,
          status: 'completed',
          completed_at: new Date(),
          last_updated: new Date()
        });
      
      // Log the patching action
      await trx('entry_logs').insert({
        entry_id: entryId,
        user_id: userId,
        action: 'marked_patched',
        details: `Entry marked as patched and closed. Notes: ${patch_notes || 'No notes provided'}`,
        created_at: new Date()
      }).catch(() => {
        console.log('Entry logs table not available');
      });
      
      // Create admin notification
      await trx('notifications').insert({
        user_id: null, // Admin notification
        type: 'vulnerability_patched',
        title: 'Vulnerability Patched',
        message: `Entry "${entry.product_name}" has been marked as patched by user.`,
        data: JSON.stringify({
          entry_id: entryId,
          product_name: entry.product_name,
          cve: entry.cve,
          patched_by: userId
        }),
        created_at: new Date()
      }).catch(() => {
        console.log('Notifications table not available');
      });
    });
    
    res.json({ 
      message: 'Entry marked as patched successfully',
      entry_id: entryId
    });
  } catch (error) {
    console.error('Error marking entry as patched:', error);
    res.status(400).json({ error: error.message || 'Failed to mark entry as patched' });
  }
});

// Get all instances of a vulnerability across sites
router.get('/vulnerabilities/:vulnerabilityId/group', auth, checkGenerationTeam, async (req, res) => {
  try {
    const { vulnerabilityId } = req.params;
    
    // Find the original entry to get vulnerability details
    const originalEntry = await knex('sheet_entries')
      .where('id', vulnerabilityId)
      .first();
    
    if (!originalEntry) {
      return res.status(404).json({ error: 'Vulnerability not found' });
    }
    
    // Find all entries with the same CVE or product/vulnerability signature
    const relatedEntries = await knex('sheet_entries as se')
      .leftJoin('users as u', 'se.assigned_to', 'u.id')
      .leftJoin('teams as t', 'u.team_id', 't.id')
      .leftJoin('vendors as v', 'se.vendor_id', 'v.id')
      .leftJoin('products as p', 'se.product_id', 'p.id')
      .select(
        'se.*',
        'u.first_name as assigned_to_first_name',
        'u.last_name as assigned_to_last_name',
        'u.site as assigned_to_site',
        't.name as assigned_to_team_name',
        'v.name as vendor_table_name',
        'p.name as product_table_name'
      )
      .where(function() {
        if (originalEntry.cve) {
          this.where('se.cve', originalEntry.cve);
        } else {
          this.where('se.product_name', originalEntry.product_name)
              .where('se.oem_vendor', originalEntry.oem_vendor);
        }
      })
      .orderBy('se.site')
      .orderBy('se.assigned_at');
    
    // Group by site
    const groupedBySite = relatedEntries.reduce((acc, entry) => {
      const site = entry.site || entry.assigned_to_site || 'Unknown Site';
      if (!acc[site]) {
        acc[site] = [];
      }
      
      // Derive vendor name for this entry
      const vendorName = entry.vendor_table_name || entry.oem_vendor || deriveVendorFromProduct(entry.product_name);
      
      acc[site].push({
        ...entry,
        oem_vendor: vendorName, // Override with best available vendor name
        assigned_to_name: entry.assigned_to_first_name && entry.assigned_to_last_name 
          ? `${entry.assigned_to_first_name} ${entry.assigned_to_last_name}`
          : null
      });
      return acc;
    }, {});
    
    // Also derive vendor for the original entry
    const originalVendorName = deriveVendorFromProduct(originalEntry.product_name);
    
    res.json({
      vulnerability: {
        cve: originalEntry.cve,
        product_name: originalEntry.product_name,
        oem_vendor: originalEntry.oem_vendor || originalVendorName,
        risk_level: originalEntry.risk_level
      },
      total_instances: relatedEntries.length,
      sites: Object.keys(groupedBySite).length,
      entries_by_site: groupedBySite,
      all_entries: relatedEntries.map(entry => {
        const vendorName = entry.vendor_table_name || entry.oem_vendor || deriveVendorFromProduct(entry.product_name);
        return {
          ...entry,
          oem_vendor: vendorName,
          assigned_to_name: entry.assigned_to_first_name && entry.assigned_to_last_name 
            ? `${entry.assigned_to_first_name} ${entry.assigned_to_last_name}`
            : null
        };
      })
    });
  } catch (error) {
    console.error('Error fetching vulnerability group:', error);
    res.status(500).json({ error: 'Failed to fetch vulnerability group' });
  }
});

module.exports = router;
