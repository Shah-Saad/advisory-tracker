exports.up = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    table.date('estimated_completion_date').defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    table.dropColumn('estimated_completion_date');
  });
};
