exports.up = function(knex) {
  return knex.schema
    .createTable('vendors', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('company').notNullable();
      table.string('email').unique().notNullable();
      table.string('phone');
      table.string('website');
      table.text('address');
      table.enum('status', ['active', 'inactive']).defaultTo('active');
      table.text('description');
      table.timestamps(true, true);
    })
    .createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('code').unique(); // Product code/SKU
      table.text('description');
      table.enum('category', [
        'Distribution Equipment',
        'Transmission Equipment',
        'Generation Equipment',
        'Protection Systems',
        'Monitoring Systems',
        'Software',
        'Other'
      ]).defaultTo('Other');
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('SET NULL');
      table.enum('status', ['active', 'inactive', 'discontinued']).defaultTo('active');
      table.decimal('price', 10, 2);
      table.string('unit'); // Unit of measurement
      table.json('specifications'); // Technical specifications as JSON
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('products')
    .dropTableIfExists('vendors');
};
