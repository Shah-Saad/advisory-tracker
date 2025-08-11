const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Diagnostic script to identify why product names are missing in CISA advisory reports
 * Usage: node scripts/debug-cisa-product-names.js [advisory-url]
 */

async function debugCISAProductNames(advisoryUrl) {
  try {
    console.log('🔍 Starting CISA product name debugging...');
    console.log(`📁 Analyzing advisory: ${advisoryUrl}`);

    // Fetch the advisory page
    const response = await axios.get(advisoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    console.log('✅ Successfully loaded advisory page');

    // Analyze the current extraction logic
    console.log('\n🔍 Current Product Name Extraction Logic:');
    
    // Check for Equipment in <li> tags with <strong>Equipment</strong>
    let foundEquipment = false;
    $('li').each((index, li) => {
      const html = $(li).html() || '';
      const text = $(li).text().trim();
      
      if (/<strong>\s*Equipment\s*<\/strong>\s*:/i.test(html)) {
        foundEquipment = true;
        console.log(`✅ Found Equipment in <li> tag ${index + 1}:`);
        console.log(`   HTML: ${html}`);
        console.log(`   Text: ${text}`);
        
        const match = text.match(/^Equipment\s*:\s*(.+)$/i);
        if (match) {
          console.log(`   ✅ Extracted product name: "${match[1].trim()}"`);
        } else {
          console.log(`   ❌ Failed to extract product name from text`);
        }
      }
    });

    if (!foundEquipment) {
      console.log('❌ No Equipment found in <li> tags with <strong>Equipment</strong>');
    }

    // Look for alternative product name patterns
    console.log('\n🔍 Searching for Alternative Product Name Patterns:');
    
    // Check for any mentions of "Product", "Equipment", "System", "Device", etc.
    const productKeywords = ['product', 'equipment', 'system', 'device', 'software', 'hardware', 'platform'];
    const foundKeywords = new Set();
    
    $('p, li, div, h1, h2, h3, h4, h5, h6').each((index, element) => {
      const text = $(element).text().trim();
      const html = $(element).html() || '';
      
      productKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          foundKeywords.add(keyword);
          
          // Look for patterns like "Product: X", "Equipment: Y", etc.
          const patterns = [
            new RegExp(`${keyword}\\s*:?\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${keyword}\\s*name\\s*:?\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${keyword}\\s*information\\s*:?\\s*([^\\n\\r]+)`, 'i')
          ];
          
          patterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match && match[1].trim().length > 2) {
              console.log(`✅ Found potential product info with "${keyword}":`);
              console.log(`   Context: ${text.substring(0, 200)}...`);
              console.log(`   Extracted: "${match[1].trim()}"`);
            }
          });
        }
      });
    });

    console.log(`\n📊 Found keywords: ${Array.from(foundKeywords).join(', ')}`);

    // Check for vendor information
    console.log('\n🔍 Vendor Information Analysis:');
    
    // Current vendor extraction logic
    let vendor = '';
    $('h2').each((_, h) => {
      const txt = $(h).text().trim().toLowerCase();
      if (!vendor && txt === 'vendor') {
        const li = $(h).nextAll('.l-page-section__content').first().find('li').first();
        if (li && li.length) {
          vendor = li.text().trim();
          console.log(`✅ Found vendor in h2 section: "${vendor}"`);
        }
      }
    });
    
    if (!vendor) {
      $('li').each((_, li) => {
        const text = $(li).text().trim();
        const m = text.match(/^Vendor\s*:\s*(.+)$/i);
        if (!vendor && m) {
          vendor = m[1].trim();
          console.log(`✅ Found vendor in li tag: "${vendor}"`);
        }
      });
    }

    if (!vendor) {
      console.log('❌ No vendor information found');
    }

    // Look for any structured data or JSON-LD
    console.log('\n🔍 Checking for Structured Data:');
    $('script[type="application/ld+json"]').each((index, script) => {
      try {
        const jsonData = JSON.parse($(script).html());
        console.log(`✅ Found JSON-LD script ${index + 1}:`, JSON.stringify(jsonData, null, 2).substring(0, 500) + '...');
      } catch (e) {
        console.log(`⚠️ Invalid JSON in script ${index + 1}`);
      }
    });

    // Check for meta tags
    console.log('\n🔍 Checking Meta Tags:');
    $('meta[name*="product"], meta[name*="equipment"], meta[property*="product"], meta[property*="equipment"]').each((index, meta) => {
      const name = $(meta).attr('name') || $(meta).attr('property');
      const content = $(meta).attr('content');
      console.log(`✅ Found product-related meta tag: ${name} = "${content}"`);
    });

    // Look for any tables that might contain product information
    console.log('\n🔍 Checking Tables for Product Information:');
    $('table').each((tableIndex, table) => {
      const $table = $(table);
      const rows = $table.find('tr');
      
      if (rows.length > 0) {
        console.log(`📋 Table ${tableIndex + 1} has ${rows.length} rows`);
        
        // Check first few rows for product-related headers
        rows.slice(0, 3).each((rowIndex, row) => {
          const $row = $(row);
          const cells = $row.find('td, th');
          
          cells.each((cellIndex, cell) => {
            const cellText = $(cell).text().trim().toLowerCase();
            if (productKeywords.some(keyword => cellText.includes(keyword))) {
              console.log(`   Row ${rowIndex + 1}, Cell ${cellIndex + 1}: "${$(cell).text().trim()}"`);
            }
          });
        });
      }
    });

    // Summary
    console.log('\n📈 Summary:');
    console.log(`- Equipment found with current logic: ${foundEquipment ? 'Yes' : 'No'}`);
    console.log(`- Keywords found: ${Array.from(foundKeywords).join(', ')}`);
    console.log(`- Vendor found: ${vendor ? 'Yes' : 'No'}`);
    
    if (!foundEquipment) {
      console.log('\n💡 Recommendations:');
      console.log('1. The current logic only looks for "Equipment" in <li> tags with <strong>Equipment</strong>');
      console.log('2. Consider expanding to look for other product-related keywords');
      console.log('3. Check for different HTML structures (tables, divs, etc.)');
      console.log('4. Look for product information in the advisory title or summary');
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  const advisoryUrl = process.argv[2];
  if (!advisoryUrl) {
    console.error('❌ Please provide a CISA advisory URL as an argument');
    console.log('Usage: node scripts/debug-cisa-product-names.js <advisory-url>');
    console.log('Example: node scripts/debug-cisa-product-names.js https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-xxx');
    process.exit(1);
  }

  debugCISAProductNames(advisoryUrl);
}

module.exports = { debugCISAProductNames };
