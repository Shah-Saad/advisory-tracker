/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheet_entries', (table) => {
    // Increase CVE column length from 255 to 2000 characters
    table.string('cve', 2000).alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheet_entries', (table) => {
    // Revert CVE column length back to 255 characters
    table.string('cve', 255).alter();
  });
};
