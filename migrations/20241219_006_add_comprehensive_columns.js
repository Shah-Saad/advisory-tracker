exports.up = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', (table) => {
      // OEM/Vendor information
      table.string('oem_vendor'); // OEM/Vendor column
      table.string('source'); // Source column
      
      // Risk and security related
      table.string('risk_level'); // Risk Level column
      table.string('cve'); // CVE column
      
      // Deployment and distribution
      table.string('distribution_site'); // Distribution Site column
      
      // Vendor interaction
      table.enum('vendor_contacted', ['Y', 'N', 'Yes', 'No']).defaultTo('N'); // Vendor Contacted Y/N
      table.date('vendor_contact_date'); // Date when vendor was contacted
      
      // Patching information
      table.date('patching_est_release_date'); // Patching Est. Release Date
      table.date('implementation_date'); // Implementation Date
      
      // Controls and mitigation
      table.enum('compensatory_controls_provided', ['Y', 'N', 'Yes', 'No']).defaultTo('N'); // Compensatory Controls Provided Y/N
      table.string('compensatory_controls_details'); // Details of compensatory controls
      
      // Time estimation
      table.string('estimated_time'); // Est. Time column
      
      // Comments and status
      table.text('comments'); // Comments column (separate from notes)
      table.string('current_status'); // Current status (separate from deployment status)
      
      // Additional tracking fields
      table.string('priority_level'); // Priority level (Critical, High, Medium, Low)
      table.string('affected_systems'); // Systems affected
      table.string('mitigation_steps'); // Steps taken for mitigation
      table.date('resolution_date'); // Date when issue was resolved
      table.string('resolution_status'); // Status of resolution
      
      // Compliance and reporting
      table.boolean('compliance_required').defaultTo(false); // Whether compliance reporting is required
      table.string('compliance_framework'); // Framework (e.g., ISO 27001, NIST)
      table.date('compliance_deadline'); // Compliance deadline
      
      // Testing and validation
      table.boolean('testing_completed').defaultTo(false); // Whether testing is completed
      table.date('testing_date'); // Date testing was completed
      table.text('testing_results'); // Results of testing
      
      // Approval workflow
      table.string('approval_status'); // Approval status
      table.string('approved_by'); // Who approved the changes
      table.date('approval_date'); // Date of approval
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('sheet_entries', (table) => {
      // Drop all added columns
      table.dropColumn('oem_vendor');
      table.dropColumn('source');
      table.dropColumn('risk_level');
      table.dropColumn('cve');
      table.dropColumn('distribution_site');
      table.dropColumn('vendor_contacted');
      table.dropColumn('vendor_contact_date');
      table.dropColumn('patching_est_release_date');
      table.dropColumn('implementation_date');
      table.dropColumn('compensatory_controls_provided');
      table.dropColumn('compensatory_controls_details');
      table.dropColumn('estimated_time');
      table.dropColumn('comments');
      table.dropColumn('current_status');
      table.dropColumn('priority_level');
      table.dropColumn('affected_systems');
      table.dropColumn('mitigation_steps');
      table.dropColumn('resolution_date');
      table.dropColumn('resolution_status');
      table.dropColumn('compliance_required');
      table.dropColumn('compliance_framework');
      table.dropColumn('compliance_deadline');
      table.dropColumn('testing_completed');
      table.dropColumn('testing_date');
      table.dropColumn('testing_results');
      table.dropColumn('approval_status');
      table.dropColumn('approved_by');
      table.dropColumn('approval_date');
    });
};
