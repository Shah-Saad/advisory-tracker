/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('edited_entries_tracking', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('sheet_id').notNullable().references('id').inTable('sheets').onDelete('CASCADE');
    table.integer('entry_id').notNullable().references('id').inTable('sheet_entries').onDelete('CASCADE');
    table.integer('response_id').references('id').inTable('sheet_responses').onDelete('CASCADE');
    table.timestamp('first_edited_at').defaultTo(knex.fn.now());
    table.timestamp('last_edited_at').defaultTo(knex.fn.now());
    table.integer('edit_count').defaultTo(1);
    
    // Composite unique constraint to prevent duplicate tracking
    table.unique(['user_id', 'sheet_id', 'entry_id']);
    
    // Indexes for better performance
    table.index(['user_id', 'sheet_id']);
    table.index(['sheet_id', 'entry_id']);
    table.index(['user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('edited_entries_tracking');
};

