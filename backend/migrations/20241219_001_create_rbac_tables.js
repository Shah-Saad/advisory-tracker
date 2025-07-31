/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create roles table
    .createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create permissions table
    .createTable('permissions', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
      table.string('resource').notNullable(); // e.g., 'users', 'teams', 'sheets'
      table.string('action').notNullable(); // e.g., 'create', 'read', 'update', 'delete'
      table.timestamps(true, true);
    })
    
    // Create role_permissions junction table
    .createTable('role_permissions', function(table) {
      table.increments('id').primary();
      table.integer('role_id').unsigned().notNullable();
      table.integer('permission_id').unsigned().notNullable();
      table.timestamps(true, true);
      
      table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
      table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
      table.unique(['role_id', 'permission_id']);
    })
    
    // Create users table
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('username').notNullable().unique();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.integer('role_id').unsigned();
      table.integer('team_id').unsigned();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login');
      table.timestamps(true, true);
      
      table.foreign('role_id').references('id').inTable('roles').onDelete('SET NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('role_permissions')
    .dropTableIfExists('permissions')
    .dropTableIfExists('roles');
};
