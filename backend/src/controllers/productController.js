const ProductService = require('../services/ProductService');

const productController = {
  // Get all products
  async getAllProducts(req, res) {
    try {
      const products = await ProductService.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get active products only
  async getActiveProducts(req, res) {
    try {
      const products = await ProductService.getActiveProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      res.json(product);
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get products by vendor ID
  async getProductsByVendorId(req, res) {
    try {
      const { vendorId } = req.params;
      const products = await ProductService.getProductsByVendorId(vendorId);
      res.json(products);
    } catch (error) {
      const statusCode = error.message === 'Vendor not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const products = await ProductService.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Search products
  async searchProducts(req, res) {
    try {
      const { q } = req.query;
      const products = await ProductService.searchProducts(q);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new product
  async createProduct(req, res) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      const statusCode = error.message === 'Vendor not found' ? 400 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Update product
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Product not found') statusCode = 404;
      else if (error.message === 'Vendor not found') statusCode = 400;
      res.status(statusCode).json({ error: error.message });
    }
  },

  // Delete product
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }
};

module.exports = productController;
