/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheet_entries', function(table) {
    // Add conditional fields
    table.string('site'); // Shows when deployed_in_ke = 'Yes'
    table.date('vendor_contact_date'); // Shows when vendor_contacted = 'Yes'
    table.string('est_time'); // Shows when compensatory_controls_provided = 'Yes'
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheet_entries', function(table) {
    table.dropColumn('site');
    table.dropColumn('vendor_contact_date');
    table.dropColumn('est_time');
  });
};
