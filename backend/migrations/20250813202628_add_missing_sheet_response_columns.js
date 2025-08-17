/**
 * Migration to add missing columns to sheet_responses table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // Add team-modifiable fields that are missing
    table.integer('original_entry_id').unsigned();
    table.string('current_status', 255);
    table.string('deployed_in_ke', 255);
    table.text('vendor_contacted').defaultTo('N');
    table.date('vendor_contact_date');
    table.date('patching_est_release_date');
    table.date('implementation_date');
    table.date('estimated_completion_date');
    table.text('compensatory_controls_provided').defaultTo('N');
    table.string('compensatory_controls_details', 255);
    table.string('estimated_time', 255);
    table.text('comments');
    table.integer('updated_by').unsigned();
    table.string('site', 255);
  }).then(function() {
    // Add foreign key constraints separately
    return knex.schema.alterTable('sheet_responses', function(table) {
      table.foreign('original_entry_id').references('id').inTable('sheet_entries').onDelete('CASCADE');
      table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sheet_responses', function(table) {
    // Remove the added columns
    return knex.schema.hasColumn('sheet_responses', 'original_entry_id').then(function(exists) {
      if (exists) {
        table.dropForeign(['original_entry_id']);
        table.dropColumn('original_entry_id');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'updated_by');
    }).then(function(exists) {
      if (exists) {
        table.dropForeign(['updated_by']);
        table.dropColumn('updated_by');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'current_status');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('current_status');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'deployed_in_ke');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('deployed_in_ke');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'vendor_contacted');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('vendor_contacted');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'vendor_contact_date');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('vendor_contact_date');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'patching_est_release_date');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('patching_est_release_date');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'implementation_date');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('implementation_date');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'estimated_completion_date');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('estimated_completion_date');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'compensatory_controls_provided');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('compensatory_controls_provided');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'compensatory_controls_details');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('compensatory_controls_details');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'estimated_time');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('estimated_time');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'comments');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('comments');
      }
    }).then(function() {
      return knex.schema.hasColumn('sheet_responses', 'site');
    }).then(function(exists) {
      if (exists) {
        table.dropColumn('site');
      }
    });
  });
};
