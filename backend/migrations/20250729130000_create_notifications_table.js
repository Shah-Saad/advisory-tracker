exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('admin_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // 'entry_update', 'welcome', etc.
    table.string('title').notNullable();
    table.text('message');
    table.integer('entry_id').references('id').inTable('sheet_entries').onDelete('CASCADE');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('read_at');
    
    // Add indexes
    table.index(['admin_id', 'is_read']);
    table.index(['created_at']);
    table.index(['type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};
