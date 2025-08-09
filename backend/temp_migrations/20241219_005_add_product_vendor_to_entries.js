exports.up = function(knex) {
  return knex.schema.table('sheet_entries', (table) => {
    // Add additional fields that weren't in the initial table creation
    table.decimal('product_price', 10, 2); // Price at time of entry
    table.json('technical_specs'); // Technical specifications as JSON
  });
};

exports.down = function(knex) {
  return knex.schema.table('sheet_entries', (table) => {
    table.dropColumn('product_price');
    table.dropColumn('technical_specs');
  });
};
