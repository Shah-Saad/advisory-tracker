/**
 * Migration to create entry logs table for tracking generation team actions
 */

exports.up = function(knex) {
  return knex.schema.createTable('entry_logs', function(table) {
    table.increments('id').primary();
    table.integer('entry_id').unsigned().notNullable();
    table.foreign('entry_id').references('id').inTable('sheet_entries').onDelete('CASCADE');
    
    table.integer('user_id').unsigned().nullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('action').notNullable(); // claimed, released, progress_updated, marked_patched
    table.text('details').nullable();
    table.json('metadata').nullable(); // Additional structured data
    
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['entry_id']);
    table.index(['user_id']);
    table.index(['action']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('entry_logs');
};
