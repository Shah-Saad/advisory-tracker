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
}

module.exports = Product;
