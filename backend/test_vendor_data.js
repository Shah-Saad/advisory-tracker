const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./advisory_tracker.db');

// Test the vendor data in the newly uploaded sheet
db.all(`
SELECT 
  se.id, 
  se.oem_vendor,
  se.vendor_name,
  se.vendor_id,
  se.product_name
FROM sheet_entries se
WHERE se.sheet_id = 73
LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('Query error:', err);
    return;
  }
  console.log('First 10 entries with vendor data:');
  rows.forEach(row => {
    console.log(`ID: ${row.id}, OEM/Vendor: '${row.oem_vendor}', Vendor Name: '${row.vendor_name}', Product: '${row.product_name}'`);
  });
  db.close();
});
