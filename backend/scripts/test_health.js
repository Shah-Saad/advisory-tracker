const axios = require('axios');

async function testHealth() {
  try {
    console.log('🧪 Testing Server Health...\n');

    // Test health endpoint
    console.log('🔗 Testing health endpoint...');
    try {
      const response = await axios.get('http://localhost:3000/health', {
        timeout: 5000
      });
      console.log('✅ Health check successful!');
      console.log('📊 Status:', response.status);
      console.log('📊 Data:', response.data);
      
      // Now test the auth endpoint
      console.log('\n🔗 Testing auth endpoint...');
      try {
        const authResponse = await axios.get('http://localhost:3000/api/auth/login', {
          timeout: 5000
        });
        console.log('✅ Auth endpoint responding!');
        console.log('📊 Status:', authResponse.status);
      } catch (authError) {
        console.log('❌ Auth endpoint error:', authError.response?.status, authError.response?.data?.error);
      }
      
    } catch (healthError) {
      console.log('❌ Health check failed:', healthError.message);
      
      // Try different ports
      const ports = [3000, 3001, 5000, 8000];
      for (const port of ports) {
        try {
          const response = await axios.get(`http://localhost:${port}/health`, {
            timeout: 2000
          });
          console.log(`✅ Server found on port ${port}!`);
          console.log('📊 Status:', response.status);
          console.log('📊 Data:', response.data);
          break;
        } catch (error) {
          console.log(`❌ Port ${port} not responding`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHealth();
