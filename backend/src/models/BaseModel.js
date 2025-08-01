const db = require('../config/db');

class BaseModel {
  static get tableName() {
    throw new Error('tableName must be defined in child class');
  }

  static async findById(id) {
    return db(this.tableName).where('id', id).first();
  }

  static async create(data) {
    const [result] = await db(this.tableName).insert(data).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return this.findById(id);
  }

  static async update(id, data) {
    await db(this.tableName).where('id', id).update(data);
    return this.findById(id);
  }

  static async delete(id) {
    return db(this.tableName).where('id', id).del();
  }

  static async findAll() {
    return db(this.tableName).select('*');
  }

  static async findBy(criteria) {
    return db(this.tableName).where(criteria);
  }

  static async findOneBy(criteria) {
    return db(this.tableName).where(criteria).first();
  }

  static async count() {
    const result = await db(this.tableName).count('* as count').first();
    return parseInt(result.count);
  }

  static async exists(id) {
    const result = await db(this.tableName).where('id', id).first();
    return !!result;
  }
}

module.exports = BaseModel;
