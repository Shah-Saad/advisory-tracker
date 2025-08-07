/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheet_entries', function(table) {
    table.integer('locked_by_user_id').unsigned().nullable();
    table.timestamp('locked_at').nullable();
    table.boolean('is_completed').defaultTo(false);
    table.timestamp('completed_at').nullable();
    
    table.foreign('locked_by_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.index(['locked_by_user_id']);
    table.index(['is_completed']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheet_entries', function(table) {
    table.dropForeign(['locked_by_user_id']);
    table.dropIndex(['locked_by_user_id']);
    table.dropIndex(['is_completed']);
    table.dropColumn('locked_by_user_id');
    table.dropColumn('locked_at');
    table.dropColumn('is_completed');
    table.dropColumn('completed_at');
  });
};
