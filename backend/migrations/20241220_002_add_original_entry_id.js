/**
 * Migration to add missing original_entry_id column to sheet_responses table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // Add the original_entry_id column if it doesn't exist
    if (!knex.schema.hasColumn('sheet_responses', 'original_entry_id')) {
      table.integer('original_entry_id').unsigned();
      table.foreign('original_entry_id').references('id').inTable('sheet_entries').onDelete('CASCADE');
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // Remove the foreign key and column
    table.dropForeign(['original_entry_id']);
    table.dropColumn('original_entry_id');
  });
};
