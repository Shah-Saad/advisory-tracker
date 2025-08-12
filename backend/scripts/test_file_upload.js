const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFileUpload() {
  try {
    console.log('🧪 Testing File Upload Process...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/users/login', {
      email: 'admin@advisorytracker.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Create a test sheet without file upload first
    console.log('2️⃣ Creating test sheet without file...');
    try {
      const sheetResponse = await axios.post('http://localhost:3000/api/sheets', {
        title: 'Test Sheet - No File',
        description: 'Test sheet without file upload',
        month_year: '2025-01'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Test sheet created:', sheetResponse.data);
    } catch (sheetError) {
      console.log('❌ Failed to create test sheet:', sheetError.response?.data || sheetError.message);
    }

    // Step 3: Check if there are any existing files in uploads directory
    console.log('\n3️⃣ Checking uploads directory...');
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`✅ Found ${files.length} files in uploads directory:`);
      files.forEach(file => {
        console.log(`   - ${file}`);
      });
    } else {
      console.log('❌ Uploads directory does not exist');
    }

    // Step 4: Test file processing service directly
    console.log('\n4️⃣ Testing file processing service...');
    try {
      const FileProcessingService = require('../src/services/FileProcessingService');
      
      // Check if there are any Excel files in uploads
      const excelFiles = fs.readdirSync(uploadsDir).filter(file => 
        file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')
      );
      
      if (excelFiles.length > 0) {
        const testFile = path.join(uploadsDir, excelFiles[0]);
        console.log(`📁 Testing with file: ${excelFiles[0]}`);
        
        const extension = path.extname(excelFiles[0]).toLowerCase();
        const processedData = await FileProcessingService.processSheetFile(testFile, extension);
        
        console.log('✅ File processed successfully');
        console.log(`📊 Total rows: ${processedData.rows.length}`);
        console.log(`📊 Headers: ${processedData.headers.join(', ')}`);
        
        if (processedData.rows.length > 0) {
          console.log('📊 First few rows:');
          processedData.rows.slice(0, 3).forEach((row, index) => {
            console.log(`   Row ${index + 1}:`, row);
          });
        }
        
        // Test validation
        const validation = FileProcessingService.validateSheetStructure(processedData);
        console.log(`📊 Validation result: ${validation.isValid ? 'Valid' : 'Invalid'}`);
        if (!validation.isValid) {
          console.log('📊 Validation errors:', validation.errors);
        }
      } else {
        console.log('❌ No Excel files found in uploads directory');
      }
    } catch (processingError) {
      console.log('❌ File processing failed:', processingError.message);
    }

    // Step 5: Check database for sheet entries
    console.log('\n5️⃣ Checking database for sheet entries...');
    try {
      const db = require('../src/config/db');
      const sheets = await db('sheets').select('*').orderBy('created_at', 'desc').limit(5);
      console.log(`✅ Found ${sheets.length} recent sheets:`);
      
      for (const sheet of sheets) {
        console.log(`\n📋 Sheet: ${sheet.title} (ID: ${sheet.id})`);
        console.log(`   Status: ${sheet.status}`);
        console.log(`   File: ${sheet.file_name || 'No file'}`);
        console.log(`   Created: ${sheet.created_at}`);
        
        // Check entries for this sheet
        const entries = await db('sheet_entries').where('sheet_id', sheet.id).select('*');
        console.log(`   Entries: ${entries.length}`);
        
        if (entries.length > 0) {
          console.log('   First few entries:');
          entries.slice(0, 3).forEach((entry, index) => {
            console.log(`     ${index + 1}. Product: ${entry.product_name}, Vendor: ${entry.oem_vendor}`);
          });
        }
      }
    } catch (dbError) {
      console.log('❌ Database check failed:', dbError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFileUpload();
