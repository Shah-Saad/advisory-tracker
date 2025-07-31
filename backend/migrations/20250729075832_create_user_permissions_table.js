/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.hasTable('user_permissions').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('user_permissions', function(table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.string('permission', 100).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.unique(['user_id', 'permission']);
      });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_permissions');
};
