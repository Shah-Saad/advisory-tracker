exports.up = function(knex) {
  return knex.schema.createTable('sheet_responses', function(table) {
    table.increments('id').primary();
    table.integer('team_sheet_id').notNullable()
      .references('id').inTable('team_sheets').onDelete('CASCADE');
    table.integer('original_entry_id').notNullable()
      .references('id').inTable('sheet_entries').onDelete('CASCADE');
    
    // Copy all the fields from sheet_entries that teams can modify
    table.string('product_name', 255);
    table.string('location', 255);
    table.string('status', 255);
    table.string('deployed_in_ke', 255);
    table.string('team', 255);
    table.string('date', 255);
    table.text('notes');
    table.integer('row_number');
    table.integer('product_id');
    table.integer('vendor_id');
    table.string('product_code', 255);
    table.string('vendor_name', 255);
    table.decimal('product_price', 10, 2);
    table.string('product_category', 255);
    table.string('product_license_type', 255);
    table.text('technical_specifications');
    table.string('contract_start_date', 255);
    table.string('contract_end_date', 255);
    table.string('support_contact', 255);
    table.string('license_expiry_date', 255);
    table.text('installation_notes');
    table.string('last_updated_by', 255);
    table.string('approval_status', 50).defaultTo('pending');
    table.string('priority_level', 50);
    table.text('risk_assessment');
    table.string('compliance_status', 50);
    table.decimal('budget_allocated', 12, 2);
    table.decimal('actual_cost', 12, 2);
    table.string('procurement_method', 100);
    table.text('vendor_evaluation');
    table.string('implementation_phase', 100);
    table.date('estimated_completion_date');
    table.string('project_manager', 255);
    table.text('stakeholder_feedback');
    table.string('integration_status', 50);
    table.string('training_required', 10);
    table.string('maintenance_schedule', 255);
    table.text('performance_metrics');
    table.string('security_clearance', 50);
    table.text('environmental_impact');
    table.string('scalability_rating', 50);
    table.text('user_feedback');
    table.string('site', 255);
    
    // Tracking fields
    table.integer('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Ensure each team can only have one response per original entry
    table.unique(['team_sheet_id', 'original_entry_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sheet_responses');
};
