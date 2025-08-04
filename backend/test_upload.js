const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function testUpload() {
  try {
    const filePath = path.join(__dirname, 'uploads', '2025-08', '1754293924897_advisory_tracking_sheet.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return;
    }
    
    const form = new FormData();
    form.append('sheet', fs.createReadStream(filePath));
    
    console.log('Uploading file for processing...');
    
    const response = await axios.post('http://localhost:3000/api/sheet-entries/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer ' + 'admin-token' // Mock admin token
      },
    });
    
    console.log('Upload successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

testUpload();
