/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sheet_entries', function(table) {
    table.increments('id').primary();
    table.integer('sheet_id').unsigned();
    table.string('product_name', 255);
    table.string('status', 255);
    table.string('deployed_in_ke', 255);
    table.string('team', 255);
    table.string('date', 255);
    table.timestamps(true, true);
    table.integer('product_id').unsigned();
    table.integer('vendor_id').unsigned();
    table.string('product_code', 255);
    table.string('vendor_name', 255);
    table.string('product_category', 255);
    table.string('oem_vendor', 255);
    table.string('source', 255);
    table.string('risk_level', 255);
    table.string('cve', 255);
    table.string('distribution_site', 255);
    table.text('vendor_contacted').defaultTo('N');
    table.date('vendor_contact_date');
    table.date('patching_est_release_date');
    table.date('implementation_date');
    table.text('compensatory_controls_provided').defaultTo('N');
    table.string('compensatory_controls_details', 255);
    table.string('estimated_time', 255);
    table.text('comments');
    table.string('current_status', 255);
    table.date('resolution_date');
    table.text('patching');
    table.string('site', 255);
    table.date('estimated_completion_date');
    table.string('assigned_team', 255);
    table.integer('assigned_to').unsigned();
    table.timestamp('selected_at');
    table.integer('locked_by_user_id').unsigned();
    table.timestamp('locked_at');
    table.boolean('is_completed').defaultTo(false);
    table.timestamp('completed_at');
    
    // Foreign key constraints
    table.foreign('sheet_id').references('id').inTable('sheets').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('SET NULL');
    table.foreign('vendor_id').references('id').inTable('vendors').onDelete('SET NULL');
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('locked_by_user_id').references('id').inTable('users').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sheet_entries');
};
