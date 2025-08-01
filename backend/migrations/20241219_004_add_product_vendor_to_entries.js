exports.up = function(knex) {
  return knex.schema.table('sheet_entries', (table) => {
    // Add foreign key relationships to products and vendors
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL');
    table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('SET NULL');
    
    // Add additional fields for better tracking
    table.string('product_code'); // Product SKU/Code for quick reference
    table.string('vendor_name'); // Vendor name for quick reference (denormalized for reporting)
    table.decimal('product_price', 10, 2); // Price at time of entry
    table.string('product_category'); // Category at time of entry
    table.json('technical_specs'); // Technical specifications as JSON
  });
};

exports.down = function(knex) {
  return knex.schema.table('sheet_entries', (table) => {
    table.dropColumn('product_id');
    table.dropColumn('vendor_id');
    table.dropColumn('product_code');
    table.dropColumn('vendor_name');
    table.dropColumn('product_price');
    table.dropColumn('product_category');
    table.dropColumn('technical_specs');
  });
};
