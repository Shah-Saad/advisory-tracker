/**
 * Migration to add site column to sheet_responses table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // Add the site column if it doesn't exist
    if (!knex.schema.hasColumn('sheet_responses', 'site')) {
      table.string('site', 255);
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // Remove the site column
    table.dropColumn('site');
  });
};
