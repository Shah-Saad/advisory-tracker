/**
 * Migration to remove redundant fields from sheet_entries and sheet_responses tables
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', function(table) {
      // Remove redundant fields from sheet_entries
      table.dropColumn('product_code');
      table.dropColumn('product_category');
      table.dropColumn('resolution_date');
      table.dropColumn('oem_vendor'); // Keep only vendor_name
    })
    .alterTable('sheet_responses', function(table) {
      // Remove redundant fields from sheet_responses
      table.dropColumn('product_code');
      table.dropColumn('product_category');
      table.dropColumn('oem_vendor'); // Keep only vendor_name
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', function(table) {
      // Restore fields to sheet_entries
      table.string('product_code', 255);
      table.string('product_category', 255);
      table.date('resolution_date');
      table.string('oem_vendor', 255);
    })
    .alterTable('sheet_responses', function(table) {
      // Restore fields to sheet_responses
      table.string('product_code', 255);
      table.string('product_category', 255);
      table.string('oem_vendor', 255);
    });
};
