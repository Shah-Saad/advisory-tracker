const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

class ProductService {
  static async getAllProducts() {
    return await Product.findAllWithVendors();
  }

  static async getActiveProducts() {
    return await Product.findActiveProducts();
  }

  static async getProductById(id) {
    const product = await Product.findWithVendor(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  static async getProductsByVendorId(vendorId) {
    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    return await Product.findByVendorId(vendorId);
  }

  static async getProductsByCategory(category) {
    return await Product.findByCategory(category);
  }

  static async searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return await this.getAllProducts();
    }
    return await Product.searchByName(searchTerm.trim());
  }

  static async createProduct(productData) {
    // Verify vendor exists if vendor_id is provided
    if (productData.vendor_id) {
      const vendor = await Vendor.findById(productData.vendor_id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
    }

    return await Product.create(productData);
  }

  static async updateProduct(id, productData) {
    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Verify vendor exists if vendor_id is being updated
    if (productData.vendor_id && productData.vendor_id !== existingProduct.vendor_id) {
      const vendor = await Vendor.findById(productData.vendor_id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
    }

    return await Product.update(id, productData);
  }

  static async deleteProduct(id) {
    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // TODO: Check if product is being used in any sheets before deletion
    // You might want to soft delete instead of hard delete

    return await Product.delete(id);
  }
}

module.exports = ProductService;
