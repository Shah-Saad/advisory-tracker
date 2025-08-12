const axios = require('axios');

async function testAdminRoute() {
  try {
    console.log('🔄 Testing admin team sheet route...');
    
    // First, get a token by logging in
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Test the admin team sheet route
    const response = await axios.get('http://localhost:3000/api/admin/team-sheets/79/distribution', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Admin route response:', response.status);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing admin route:', error.response?.data || error.message);
  }
}

testAdminRoute();
