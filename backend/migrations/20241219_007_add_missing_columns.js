exports.up = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', (table) => {
      table.decimal('budget_allocated', 15, 2);
      table.string('maintenance_schedule');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', (table) => {
      table.dropColumn('budget_allocated');
      table.dropColumn('maintenance_schedule');
    });
};
