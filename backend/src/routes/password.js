const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const db = require('../config/db');

/**
 * @route PUT /api/password/change
 * @desc Allow users to change their own password
 * @access Private
 */
router.put('/change', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    // Get current user data
    const user = await db('users')
      .select('password_hash')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await db('users')
      .where('id', userId)
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * @route PUT /api/password/reset/:userId
 * @desc Allow admin to reset user password to default
 * @access Admin only
 */
router.put('/reset/:userId', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const defaultPassword = '123456';

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    // Check if user exists
    const user = await db('users')
      .select('id', 'username', 'email')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash default password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, saltRounds);

    // Update password in database
    await db('users')
      .where('id', userId)
      .update({
        password_hash: defaultPasswordHash,
        updated_at: new Date()
      });

    console.log(`Admin ${req.user.username} reset password for user ${user.username}`);

    res.json({ 
      message: `Password reset successfully for user: ${user.username}`,
      defaultPassword: defaultPassword
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * @route PUT /api/password/admin-change
 * @desc Allow admin to change their own password
 * @access Admin only
 */
router.put('/admin-change', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Admin password must be at least 8 characters long' 
      });
    }

    // Get current admin data
    const admin = await db('users')
      .select('users.password_hash', 'users.username')
      .join('roles', 'users.role_id', 'roles.id')
      .where('users.id', adminId)
      .where('roles.name', 'admin')
      .first();

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await db('users')
      .where('id', adminId)
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    console.log(`Admin ${admin.username} changed their password`);

    res.json({ message: 'Admin password changed successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ error: 'Failed to change admin password' });
  }
});

module.exports = router;
