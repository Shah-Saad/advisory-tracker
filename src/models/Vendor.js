const BaseModel = require('./BaseModel');

class Vendor extends BaseModel {
  static tableName = 'vendors';

  static async findByName(name) {
    return this.findOneBy({ name });
  }

  static async findByEmail(email) {
    return this.findOneBy({ email });
  }

  static async findActiveVendors() {
    return this.findBy({ status: 'active' });
  }

  static async searchByName(searchTerm) {
    const db = require('../config/db');
    return db(this.tableName)
      .where('name', 'ilike', `%${searchTerm}%`)
      .orWhere('company', 'ilike', `%${searchTerm}%`);
  }
}

module.exports = Vendor;
