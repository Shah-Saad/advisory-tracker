/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Check and add columns only if they don't exist
    return knex.schema.hasColumn('users', 'role').then(function(exists) {
      if (!exists) {
        table.string('role', 255).defaultTo('user');
      }
    }).then(function() {
      return knex.schema.hasColumn('users', 'department');
    }).then(function(exists) {
      if (!exists) {
        table.string('department', 255);
      }
    }).then(function() {
      return knex.schema.hasColumn('users', 'created_by');
    }).then(function(exists) {
      if (!exists) {
        table.integer('created_by');
      }
    }).then(function() {
      return knex.schema.hasColumn('users', 'last_login');
    }).then(function(exists) {
      if (!exists) {
        table.timestamp('last_login').defaultTo(null);
      }
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('role');
    table.dropColumn('department');
    table.dropColumn('created_by');
    table.dropColumn('last_login');
  });
};
