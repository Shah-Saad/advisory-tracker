exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.string('role').defaultTo('user');
    table.string('department');
    table.boolean('is_active').defaultTo(true);
    table.integer('created_by').unsigned();
    table.timestamp('last_login');
    
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('role');
    table.dropColumn('department');
    table.dropColumn('is_active');
    table.dropColumn('created_by');
    table.dropColumn('last_login');
  });
};
