const db = require('../src/config/db');
const FileProcessingService = require('../src/services/FileProcessingService');
const path = require('path');

/**
 * Diagnostic script to identify why product names are missing during scraping
 * Usage: node scripts/debug-product-names.js [file-path]
 */

async function debugProductNames(filePath) {
  try {
    console.log('🔍 Starting product name debugging...');
    console.log(`📁 Processing file: ${filePath}`);
    
    // Process the file
    const fileExtension = path.extname(filePath).toLowerCase();
    const processedData = await FileProcessingService.processSheetFile(filePath, fileExtension);
    
    console.log('\n📊 File Processing Results:');
    console.log(`Headers found: ${processedData.headers.length}`);
    console.log(`Rows processed: ${processedData.rows.length}`);
    console.log('Headers:', processedData.headers);
    
    // Analyze headers for product name variations
    console.log('\n🔍 Analyzing headers for product name variations...');
    const productNameHeaders = processedData.headers.filter(header => 
      header && header.toLowerCase().includes('product') || 
      header && header.toLowerCase().includes('name')
    );
    
    console.log('Potential product name headers:', productNameHeaders);
    
    // Check first few rows for data quality
    console.log('\n📋 Analyzing first 5 rows for data quality...');
    for (let i = 0; i < Math.min(5, processedData.rows.length); i++) {
      const row = processedData.rows[i];
      console.log(`\nRow ${i + 1}:`);
      
      if (typeof row === 'object' && !Array.isArray(row)) {
        // Object format
        Object.keys(row).forEach(key => {
          const value = row[key];
          if (key.toLowerCase().includes('product') || key.toLowerCase().includes('name')) {
            console.log(`  ${key}: "${value}" (${typeof value})`);
          }
        });
      } else {
        // Array format
        processedData.headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          if (header && (header.toLowerCase().includes('product') || header.toLowerCase().includes('name'))) {
            console.log(`  ${header}: "${value}" (${typeof value})`);
          }
        });
      }
    }
    
    // Check for empty or null product names
    console.log('\n🚨 Checking for missing product names...');
    let missingProductNames = 0;
    let totalRows = 0;
    
    for (let i = 0; i < processedData.rows.length; i++) {
      const row = processedData.rows[i];
      totalRows++;
      
      let hasProductName = false;
      
      if (typeof row === 'object' && !Array.isArray(row)) {
        // Object format
        Object.keys(row).forEach(key => {
          const value = row[key];
          if (key.toLowerCase().includes('product') || key.toLowerCase().includes('name')) {
            if (value && String(value).trim() !== '') {
              hasProductName = true;
            }
          }
        });
      } else {
        // Array format
        processedData.headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          if (header && (header.toLowerCase().includes('product') || header.toLowerCase().includes('name'))) {
            if (value && String(value).trim() !== '') {
              hasProductName = true;
            }
          }
        });
      }
      
      if (!hasProductName) {
        missingProductNames++;
        if (missingProductNames <= 10) { // Show first 10 missing rows
          console.log(`  Row ${i + 1}: Missing product name`);
        }
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`  Total rows: ${totalRows}`);
    console.log(`  Rows with missing product names: ${missingProductNames}`);
    console.log(`  Percentage missing: ${((missingProductNames / totalRows) * 100).toFixed(2)}%`);
    
    // Check database for existing entries without product names
    console.log('\n🗄️ Checking database for entries without product names...');
    const entriesWithoutProductNames = await db('sheet_entries')
      .whereNull('product_name')
      .orWhere('product_name', '')
      .count('* as count')
      .first();
    
    console.log(`Database entries without product names: ${entriesWithoutProductNames.count}`);
    
    // Get sample entries without product names
    const sampleEntries = await db('sheet_entries')
      .whereNull('product_name')
      .orWhere('product_name', '')
      .limit(5)
      .select('id', 'product_name', 'oem_vendor', 'source', 'created_at');
    
    if (sampleEntries.length > 0) {
      console.log('Sample entries without product names:');
      sampleEntries.forEach(entry => {
        console.log(`  ID ${entry.id}: product_name="${entry.product_name}", vendor="${entry.oem_vendor}", source="${entry.source}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await db.destroy();
  }
}

// Run the script if called directly
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('❌ Please provide a file path as an argument');
    console.log('Usage: node scripts/debug-product-names.js <file-path>');
    process.exit(1);
  }
  
  debugProductNames(filePath);
}

module.exports = { debugProductNames };
