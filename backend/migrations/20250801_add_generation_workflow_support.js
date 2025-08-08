/**
 * Migration to add generation team workflow support
 * Adds columns for user assignment, progress tracking, and patching workflow
 */

exports.up = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    // User assignment fields
    table.integer('assigned_to').unsigned().nullable();
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('assigned_at').nullable();
    
    // Progress tracking
    table.string('progress_status').nullable(); // investigating, awaiting_patch, testing_patch, patched
    table.text('progress_notes').nullable();
    table.timestamp('last_updated').nullable();
    
    // Patching information
    table.string('patching_status').nullable(); // available, in_progress, completed
    table.date('patching_est_release_date').nullable();
    table.date('patched_date').nullable();
    table.string('patch_version').nullable();
    table.text('patch_notes').nullable();
    
    // Site information for generation team
    table.string('site').nullable(); // KEL-1, KEL-2, etc.
    
    // Original entry reference for user copies
    table.integer('original_entry_id').unsigned().nullable();
    table.foreign('original_entry_id').references('id').inTable('sheet_entries').onDelete('CASCADE');
    
    // Add index for better query performance
    table.index(['assigned_to']);
    table.index(['progress_status']);
    table.index(['site']);
    table.index(['original_entry_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    // Drop foreign keys first
    table.dropForeign(['assigned_to']);
    table.dropForeign(['original_entry_id']);
    
    // Drop indexes
    table.dropIndex(['assigned_to']);
    table.dropIndex(['progress_status']);
    table.dropIndex(['site']);
    table.dropIndex(['original_entry_id']);
    
    // Drop columns
    table.dropColumn('assigned_to');
    table.dropColumn('assigned_at');
    table.dropColumn('progress_status');
    table.dropColumn('progress_notes');
    table.dropColumn('last_updated');
    table.dropColumn('patching_status');
    table.dropColumn('patching_est_release_date');
    table.dropColumn('patched_date');
    table.dropColumn('patch_version');
    table.dropColumn('patch_notes');
    table.dropColumn('site');
    table.dropColumn('original_entry_id');
  });
};
