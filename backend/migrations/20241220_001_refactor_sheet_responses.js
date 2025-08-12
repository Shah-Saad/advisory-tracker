/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // First, add the foreign key to sheet_entries (if it doesn't exist)
    // Note: original_entry_id might already exist, so we'll handle this carefully
    if (!knex.schema.hasColumn('sheet_responses', 'original_entry_id')) {
      table.integer('original_entry_id').unsigned();
      table.foreign('original_entry_id').references('id').inTable('sheet_entries').onDelete('CASCADE');
    }
    
    // Remove redundant fields that are already in sheet_entries
    // These fields are duplicated and should be retrieved via join instead
    table.dropColumn('product_name');
    table.dropColumn('vendor_name');
    table.dropColumn('oem_vendor');
    table.dropColumn('cve');
    table.dropColumn('source');
    table.dropColumn('risk_level');
    table.dropColumn('site');
    table.dropColumn('date');
    
    // Keep only the fields that teams actually modify:
    // - team_sheet_id, original_entry_id (FK to sheet_entries)
    // - status, current_status, deployed_in_ke
    // - vendor_contacted, vendor_contact_date
    // - patching_est_release_date, implementation_date, estimated_completion_date
    // - compensatory_controls_provided, compensatory_controls_details
    // - estimated_time, comments, updated_by
    // - created_at, updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // Remove the foreign key
    table.dropForeign(['original_entry_id']);
    table.dropColumn('original_entry_id');
    
    // Add back the redundant fields (for rollback purposes)
    table.string('product_name', 255);
    table.string('vendor_name', 255);
    table.string('oem_vendor', 255);
    table.string('cve', 255);
    table.string('source', 255);
    table.string('risk_level', 255);
    table.string('site', 255);
    table.string('date', 255);
  });
};
