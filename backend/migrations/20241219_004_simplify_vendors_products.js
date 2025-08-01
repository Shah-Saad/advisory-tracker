exports.up = function(knex) {
  return knex.schema
    .alterTable('vendors', (table) => {
      // Drop all columns except name and email
      table.dropColumn('company');
      table.dropColumn('phone');
      table.dropColumn('website');
      table.dropColumn('address');
      table.dropColumn('status');
      table.dropColumn('description');
    })
    .alterTable('products', (table) => {
      // Drop all columns except name and vendor_id
      table.dropColumn('code');
      table.dropColumn('description');
      table.dropColumn('category');
      table.dropColumn('status');
      table.dropColumn('price');
      table.dropColumn('unit');
      table.dropColumn('specifications');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('vendors', (table) => {
      // Restore vendor columns
      table.string('company');
      table.string('phone');
      table.string('website');
      table.text('address');
      table.enum('status', ['active', 'inactive']).defaultTo('active');
      table.text('description');
    })
    .alterTable('products', (table) => {
      // Restore product columns
      table.string('code').unique();
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
      table.enum('status', ['active', 'inactive', 'discontinued']).defaultTo('active');
      table.decimal('price', 10, 2);
      table.string('unit');
      table.json('specifications');
    });
};
