/**
 * Migration to add missing columns to team_sheets table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('team_sheets', function(table) {
    table.integer('assigned_by').unsigned().nullable();
    table.integer('started_by').unsigned().nullable();
    table.integer('completed_by').unsigned().nullable();
    table.timestamp('started_at').nullable();
    
    // Add foreign key constraints
    table.foreign('assigned_by').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('started_by').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('completed_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('team_sheets', function(table) {
    table.dropForeign('assigned_by');
    table.dropForeign('started_by');
    table.dropForeign('completed_by');
    table.dropColumn('assigned_by');
    table.dropColumn('started_by');
    table.dropColumn('completed_by');
    table.dropColumn('started_at');
  });
};
