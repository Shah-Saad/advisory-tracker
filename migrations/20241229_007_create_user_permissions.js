exports.up = function(knex) {
  return knex.schema.createTable('user_permissions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('permission').notNullable();
    table.integer('granted_by').unsigned();
    table.timestamp('granted_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('granted_by').references('id').inTable('users').onDelete('SET NULL');
    table.unique(['user_id', 'permission']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_permissions');
};
