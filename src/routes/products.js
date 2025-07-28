const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');

// All product routes require authentication
router.use(auth);

// General product routes
router.get('/', productController.getAllProducts);
router.get('/active', productController.getActiveProducts);
router.get('/search', productController.searchProducts);
router.post('/', productController.createProduct);

// Products by category or vendor
router.get('/vendor/:vendorId', productController.getProductsByVendorId);
router.get('/category/:category', productController.getProductsByCategory);

// Specific product routes
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
