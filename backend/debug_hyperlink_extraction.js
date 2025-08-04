const XLSX = require('xlsx');

// Debug hyperlink extraction from Excel file
const filePath = './uploads/2025-08/1754302736332_advisory_tracking_sheet.xlsx';

try {
  console.log('🔍 Debugging hyperlink extraction...');
  
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON with header extraction
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  const headers = jsonData[0];
  console.log('📋 Headers:', headers);
  
  // Find source column index
  const sourceColumnIndex = headers.findIndex(header => 
    header && header.toLowerCase().includes('source')
  );
  
  console.log('🎯 Source column index:', sourceColumnIndex);
  
  // Check first 10 data rows for hyperlinks
  console.log('\n🔗 Checking for hyperlinks in first 10 rows:');
  
  const dataRows = jsonData.slice(1); // Skip header
  
  for (let i = 0; i < Math.min(10, dataRows.length); i++) {
    const row = dataRows[i];
    const cellValue = row[sourceColumnIndex];
    
    // Calculate cell address (row i+1 because we skipped header, +1 more for Excel 1-based indexing)
    const cellAddress = XLSX.utils.encode_cell({ c: sourceColumnIndex, r: i + 1 }); 
    const cell = worksheet[cellAddress];
    
    console.log(`Row ${i + 2} (${cellAddress}): value="${cellValue}", hasHyperlink=${!!(cell && cell.l && cell.l.Target)}`);
    
    if (cell && cell.l && cell.l.Target) {
      console.log(`  → Hyperlink: ${cell.l.Target}`);
    }
  }
  
  // Also check the range where we expect hyperlinks (around row 5)
  console.log('\n🔗 Checking rows 4-8 specifically:');
  
  for (let rowNum = 4; rowNum <= 8; rowNum++) {
    const cellAddress = XLSX.utils.encode_cell({ c: sourceColumnIndex, r: rowNum });
    const cell = worksheet[cellAddress];
    
    console.log(`Excel row ${rowNum + 1} (${cellAddress}): hasHyperlink=${!!(cell && cell.l && cell.l.Target)}`);
    
    if (cell && cell.l && cell.l.Target) {
      console.log(`  → Hyperlink: ${cell.l.Target}`);
    }
    if (cell && cell.v) {
      console.log(`  → Cell value: ${cell.v}`);
    }
  }
  
} catch (error) {
  console.error('❌ Error:', error);
}
