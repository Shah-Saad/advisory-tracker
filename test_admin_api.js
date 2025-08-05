const axios = require('axios');

async function testAdminAPI() {
  try {
    console.log('🔐 Testing admin login...');
    
    // First, login as admin
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    // Set up headers with token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n📊 Testing team status summary endpoint...');
    const teamStatusResponse = await axios.get('http://localhost:3000/api/sheets/team-status-summary', { headers });
    console.log('Team Status Summary Response:');
    console.log(JSON.stringify(teamStatusResponse.data, null, 2));
    
    if (teamStatusResponse.data && teamStatusResponse.data.length > 0) {
      const firstSheet = teamStatusResponse.data[0];
      console.log(`\n🔍 Testing individual sheet view for Sheet ID: ${firstSheet.id}...`);
      
      const sheetViewResponse = await axios.get(`http://localhost:3000/api/sheets/${firstSheet.id}/team-views`, { headers });
      console.log('Sheet Team Views Response:');
      console.log(JSON.stringify(sheetViewResponse.data, null, 2));
      
      // Test the specific team data endpoint
      console.log(`\n👥 Testing team data endpoint for generation team...`);
      try {
        const teamDataResponse = await axios.get(`http://localhost:3000/api/sheets/${firstSheet.id}/team-data/generation`, { headers });
        console.log('Team Data Response:');
        console.log(JSON.stringify(teamDataResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Team data endpoint error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.response?.data || error.message);
  }
}

testAdminAPI();
