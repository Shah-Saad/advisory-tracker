const XLSX = require('xlsx');

// Debug the Excel processing to see what's happening with source column detection
const filePath = 'C:\\Users\\CS Intern-4\\Documents\\advisory_tracker\\backend\\uploads\\2025-08\\1754302736332_advisory_tracking_sheet.xlsx';

try {
  console.log('🔍 Debugging source column detection...');
  
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON with header extraction
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  const headers = jsonData[0];
  console.log('📋 Headers:', headers);
  
  // Find source column index
  const sourceColumnIndex = headers.findIndex(header => 
    header && (
      header.toLowerCase().includes('source') || 
      header.toLowerCase() === 'cisa'
    )
  );
  
  console.log('🎯 Source column index:', sourceColumnIndex);
  console.log('🎯 Source column name:', sourceColumnIndex >= 0 ? headers[sourceColumnIndex] : 'NOT FOUND');
  
  // Show mergeable column detection
  const mergeableColumns = [
    'OEM/Vendor', 
    'Vendor Name', 
    'Product Category',
    'Risk Level'
  ];
  
  const mergeColumnIndices = [];
  mergeableColumns.forEach(colName => {
    const index = headers.findIndex(header => 
      header && header.toLowerCase().includes(colName.toLowerCase())
    );
    if (index >= 0) {
      mergeColumnIndices.push(index);
      console.log(`📌 Found mergeable column: ${colName} at index ${index}`);
    }
  });
  
  // Check first 3 columns logic
  console.log('\n🔍 First 3 columns analysis:');
  [0, 1, 2].forEach(idx => {
    if (idx < headers.length) {
      const alreadyInMerge = mergeColumnIndices.includes(idx);
      const isSourceColumn = idx === sourceColumnIndex;
      const willBeAdded = !alreadyInMerge && !isSourceColumn;
      
      console.log(`  Column ${idx} (${headers[idx]}): alreadyInMerge=${alreadyInMerge}, isSourceColumn=${isSourceColumn}, willBeAdded=${willBeAdded}`);
      
      if (willBeAdded) {
        mergeColumnIndices.push(idx);
      }
    }
  });
  
  console.log('\n📊 Final merge column indices:', mergeColumnIndices);
  console.log('📊 Final merge column names:', mergeColumnIndices.map(idx => headers[idx]));
  
  // Check if Source is properly excluded
  const sourceExcluded = !mergeColumnIndices.includes(sourceColumnIndex);
  console.log('\n✅ Source column properly excluded from merging:', sourceExcluded);
  
} catch (error) {
  console.error('❌ Error:', error);
}
