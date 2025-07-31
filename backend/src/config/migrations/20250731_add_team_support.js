/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('users', function (table) {
      table.string('team').nullable();
      table.index('team');
    })
    .alterTable('sheet_entries', function (table) {
      table.string('assigned_team').nullable();
      table.index('assigned_team');
    })
    .alterTable('sheets', function (table) {
      table.json('distributed_to_teams').nullable();
    })
    .raw(`
      INSERT INTO teams (name, description, created_at, updated_at) VALUES
      ('generation', 'Generation team for operational workflow', NOW(), NOW()),
      ('distribution', 'Distribution team for operational workflow', NOW(), NOW()),
      ('transmission', 'Transmission team for operational workflow', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('users', function (table) {
      table.dropColumn('team');
    })
    .alterTable('sheet_entries', function (table) {
      table.dropColumn('assigned_team');
    })
    .alterTable('sheets', function (table) {
      table.dropColumn('distributed_to_teams');
    })
    .raw(`
      DELETE FROM teams WHERE name IN ('generation', 'distribution', 'transmission')
    `);
};
