/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create teams table
    .createTable('teams', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Update users table to add team_id foreign key
    .alterTable('users', function(table) {
      table.foreign('team_id').references('id').inTable('teams').onDelete('SET NULL');
    })
    
    // Create sheets table
    .createTable('sheets', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.string('file_name').notNullable();
      table.string('file_path').notNullable();
      table.string('file_type').notNullable(); // e.g., 'xlsx', 'csv'
      table.date('month_year').notNullable(); // The month this sheet is for
      table.integer('uploaded_by').unsigned().notNullable();
      table.enum('status', ['draft', 'distributed', 'in_progress', 'completed']).defaultTo('draft');
      table.timestamp('distributed_at');
      table.timestamp('due_date');
      table.timestamps(true, true);
      
      table.foreign('uploaded_by').references('id').inTable('users').onDelete('CASCADE');
    })
    
    // Create team_sheets table (tracks which teams are assigned to which sheets)
    .createTable('team_sheets', function(table) {
      table.increments('id').primary();
      table.integer('sheet_id').unsigned().notNullable();
      table.integer('team_id').unsigned().notNullable();
      table.enum('status', ['assigned', 'in_progress', 'completed']).defaultTo('assigned');
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.timestamps(true, true);
      
      table.foreign('sheet_id').references('id').inTable('sheets').onDelete('CASCADE');
      table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');
      table.unique(['sheet_id', 'team_id']);
    })
    
    // Create sheet_responses table (stores the filled data from teams)
    .createTable('sheet_responses', function(table) {
      table.increments('id').primary();
      table.integer('team_sheet_id').unsigned().notNullable();
      table.integer('submitted_by').unsigned().notNullable();
      table.jsonb('response_data'); // JSON data containing the filled form data
      table.string('response_file_name');
      table.string('response_file_path');
      table.enum('status', ['draft', 'submitted']).defaultTo('draft');
      table.timestamp('submitted_at');
      table.timestamps(true, true);
      
      table.foreign('team_sheet_id').references('id').inTable('team_sheets').onDelete('CASCADE');
      table.foreign('submitted_by').references('id').inTable('users').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('sheet_responses')
    .dropTableIfExists('team_sheets')
    .dropTableIfExists('sheets')
    .alterTable('users', function(table) {
      table.dropForeign(['team_id']);
    })
    .dropTableIfExists('teams');
};
