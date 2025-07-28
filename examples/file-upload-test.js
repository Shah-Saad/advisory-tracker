const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Example: Test file upload functionality
async function testFileUpload() {
    try {
        // Base URL for your API
        const baseURL = 'http://localhost:3000/api';
        
        // First, you need to login as admin to get the token
        const loginResponse = await axios.post(`${baseURL}/users/login`, {
            email: 'admin@advisorytracker.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Create form data
        const form = new FormData();
        
        // Add file (you'll need to create a sample Excel/CSV file)
        // Example Excel file path - replace with your actual file
        const filePath = path.join(__dirname, 'sample-sheet.xlsx');
        
        if (fs.existsSync(filePath)) {
            form.append('sheet_file', fs.createReadStream(filePath));
        } else {
            console.log('❌ Sample file not found. Please create a sample Excel file at:', filePath);
            return;
        }
        
        // Add other sheet data  
        const now = new Date();
        // Use next month to avoid conflicts
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const monthYear = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
        
        form.append('title', 'Monthly Advisory Sheet - ' + monthYear);
        form.append('description', 'Monthly advisory tracking sheet for teams');
        form.append('month_year', monthYear);
        
        // Upload file and create sheet
        const uploadResponse = await axios.post(`${baseURL}/sheets`, form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        
        console.log('✅ File uploaded successfully!');
        console.log('Sheet created:', uploadResponse.data);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Example of creating a sample Excel file programmatically
function createSampleExcelFile() {
    const XLSX = require('xlsx');
    const path = require('path');
    
    // Sample data structure
    const worksheetData = [
        ['product_name', 'location', 'status', 'deployed_in_ke', 'team', 'date', 'notes'],
        ['Product A', 'Nairobi', 'In Progress', 'Yes', 'Distribution', '2024-01-15', 'Testing phase'],
        ['Product B', 'Mombasa', 'Completed', 'No', 'Transmission', '2024-01-10', 'Ready for deployment'],
        ['Product C', 'Kisumu', 'Planning', 'Yes', 'General', '2024-01-20', 'Initial analysis'],
        ['Product D', 'Eldoret', 'In Progress', 'Yes', 'Distribution', '2024-01-18', 'Development ongoing']
    ];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Advisory Data');
    
    // Save file
    const filePath = path.join(__dirname, 'sample-sheet.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Sample Excel file created at:', filePath);
    return filePath;
}

// Run the example
console.log('Creating sample Excel file...');
createSampleExcelFile();

console.log('\nTesting file upload...');
testFileUpload();
