exports.up = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    // Check if site column exists first
    table.string('site').defaultTo(null);
    // vendor_contact_date already exists
    // est_time will be mapped to estimated_time which already exists
  });
};

exports.down = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    table.dropColumn('site');
  });
};
