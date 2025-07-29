const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { auth } = require('../middlewares/auth');

// All vendor routes require authentication
router.use(auth);

// General vendor routes
router.get('/', vendorController.getAllVendors);
router.get('/active', vendorController.getActiveVendors);
router.get('/search', vendorController.searchVendors);
router.post('/', vendorController.createVendor);

// Specific vendor routes
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
