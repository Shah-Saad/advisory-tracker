const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { auth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');

// All permission routes require authentication and manage_permissions permission
router.use(auth);
router.use(requirePermission('manage_permissions'));

// Permission CRUD operations
router.get('/', permissionController.getAllPermissions);
router.get('/category/:category', permissionController.getPermissionsByCategory);
router.get('/:id', permissionController.getPermissionById);
router.post('/', permissionController.createPermission);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

module.exports = router;
