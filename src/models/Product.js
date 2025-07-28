const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  static tableName = 'products';

  static async findByVendorId(vendorId) {
    return this.findBy({ vendor_id: vendorId });
  }

  static async findByCategory(category) {
    return this.findBy({ category });
  }

  static async findActiveProducts() {
    return this.findBy({ status: 'active' });
  }

  static async searchByName(searchTerm) {
    const db = require('../config/db');
    return db(this.tableName)
      .where('name', 'ilike', `%${searchTerm}%`)
      .orWhere('description', 'ilike', `%${searchTerm}%`);
  }

  static async findWithVendor(productId) {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .select(
        'products.*',
        'vendors.name as vendor_name',
        'vendors.company as vendor_company',
        'vendors.email as vendor_email'
      )
      .where('products.id', productId)
      .first();
  }

  static async findAllWithVendors() {
    const db = require('../config/db');
    return db(this.tableName)
      .leftJoin('vendors', 'products.vendor_id', 'vendors.id')
      .select(
        'products.*',
        'vendors.name as vendor_name',
        'vendors.company as vendor_company'
      );
  }
}

module.exports = Product;
