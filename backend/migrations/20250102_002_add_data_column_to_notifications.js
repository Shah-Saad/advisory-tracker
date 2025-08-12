exports.up = function(knex) {
  return knex.schema.alterTable('notifications', function(table) {
    table.jsonb('data'); // Add data column for additional notification data
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('notifications', function(table) {
    table.dropColumn('data');
  });
};

