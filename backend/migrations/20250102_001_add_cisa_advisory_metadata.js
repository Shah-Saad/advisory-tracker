/**
 * Migration: Add CISA advisory metadata to sheet_entries table
 * This allows individual CISA advisories to be tracked and responded to
 */

exports.up = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    // CISA advisory metadata
    table.string('advisory_id').nullable().comment('CISA advisory ID (e.g., ICSA-25-001)');
    table.string('advisory_title').nullable().comment('CISA advisory title');
    table.string('advisory_link').nullable().comment('CISA advisory URL');
    table.date('advisory_date').nullable().comment('CISA advisory publication date');
    table.string('advisory_type').nullable().comment('CISA advisory type (ICS Advisory, etc.)');
    
    // Add index for efficient querying
    table.index(['advisory_id'], 'idx_sheet_entries_advisory_id');
    table.index(['advisory_date'], 'idx_sheet_entries_advisory_date');
  });
};

exports.down = function(knex) {
  return knex.schema.table('sheet_entries', function(table) {
    table.dropIndex(['advisory_id'], 'idx_sheet_entries_advisory_id');
    table.dropIndex(['advisory_date'], 'idx_sheet_entries_advisory_date');
    
    table.dropColumn('advisory_id');
    table.dropColumn('advisory_title');
    table.dropColumn('advisory_link');
    table.dropColumn('advisory_date');
    table.dropColumn('advisory_type');
  });
};
