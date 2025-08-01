const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  static tableName = 'products';

  static async findByVendorId(vendorId) {
    return this.findBy({ vendor_id: vendorId });
  }

  static async searchByName(searchTerm) {
    const db = require('../config/db');
    return db(this.tableName)
      .where('name', 'ilike', `%${searchTerm}%`);
  }

  static async findWithVendor(productId) {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .select(
        'products.*',
        'vendors.name as vendor_name'
      )
      .where('products.id', productId)
      .first();
  }

  static async getAllWithVendors() {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .select(
        'products.*',
        'vendors.name as vendor_name'
      );
  }

  static async findActiveProducts() {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .select(
        'products.*',
        'vendors.name as vendor_name'
      )
      .where('products.is_active', true);
  }

  static async findByCategory(category) {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .select(
        'products.*',
        'vendors.name as vendor_name'
      )
      .where('products.category', category);
  }
}

module.exports = Product;
