/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheets', function(table) {
    table.dropColumn('file_type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheets', function(table) {
    table.string('file_type').notNullable(); // e.g., 'xlsx', 'csv'
  });
};

