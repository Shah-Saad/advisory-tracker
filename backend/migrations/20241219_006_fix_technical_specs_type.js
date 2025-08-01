exports.up = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', (table) => {
      table.dropColumn('technical_specs');
    })
    .then(() => {
      return knex.schema.alterTable('sheet_entries', (table) => {
        table.text('technical_specs');
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', (table) => {
      table.dropColumn('technical_specs');
    })
    .then(() => {
      return knex.schema.alterTable('sheet_entries', (table) => {
        table.json('technical_specs');
      });
    });
};
