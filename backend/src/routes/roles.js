const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { auth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');

// All role routes require authentication and manage_roles permission
router.use(auth);
router.use(requirePermission('manage_roles'));

// Role CRUD operations
router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Role-Permission management
router.get('/:id/permissions', roleController.getRolePermissions);
router.post('/:roleId/permissions/:permissionId', roleController.assignPermissionToRole);
router.delete('/:roleId/permissions/:permissionId', roleController.removePermissionFromRole);

module.exports = router;
