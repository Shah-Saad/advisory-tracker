const XLSX = require('xlsx');

// Debug script to examine Excel file structure for hyperlinks
const filePath = 'C:\\Users\\CS Intern-4\\Documents\\advisory_tracker\\advisory tracking sheet.xlsx';

try {
  console.log('Reading Excel file:', filePath);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('Sheet name:', sheetName);
  
  // Find Source column
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = jsonData[0] || [];
  const sourceColumnIndex = headers.findIndex(header => 
    header && header.toLowerCase().includes('source')
  );
  
  console.log('Headers:', headers);
  console.log('Source column index:', sourceColumnIndex);
  
  if (sourceColumnIndex >= 0) {
    console.log('\nChecking ALL rows for hyperlinks in Source column:');
    
    // Check up to row 100
    for (let row = 1; row <= 100; row++) {
      const cellAddress = XLSX.utils.encode_cell({ c: sourceColumnIndex, r: row });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.l) {
        console.log(`Row ${row + 1} (${cellAddress}):`, {
          value: cell.v,
          hyperlink: cell.l.Target
        });
      }
    }
  }
  
  // Also check if any cells have hyperlinks at all
  console.log('\nScanning ALL cells for hyperlinks:');
  const cellAddresses = Object.keys(worksheet).filter(key => key.match(/^[A-Z]+\d+$/));
  let hyperlinkCount = 0;
  
  cellAddresses.forEach(address => {
    const cell = worksheet[address];
    if (cell && cell.l) {
      hyperlinkCount++;
      console.log(`Found hyperlink at ${address}:`, {
        value: cell.v,
        link: cell.l.Target
      });
    }
  });
  
  console.log(`\nTotal hyperlinks found: ${hyperlinkCount}`);
  
} catch (error) {
  console.error('Error reading Excel file:', error);
}
