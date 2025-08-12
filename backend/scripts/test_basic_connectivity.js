const axios = require('axios');

async function testBasicConnectivity() {
  try {
    console.log('🧪 Testing Basic Server Connectivity...\n');

    // Test different ports
    const ports = [3000, 3001, 5000, 8000];
    
    for (const port of ports) {
      console.log(`🔗 Testing port ${port}...`);
      try {
        const response = await axios.get(`http://localhost:${port}/api/auth/login`, {
          timeout: 2000
        });
        console.log(`✅ Port ${port} is responding!`);
        console.log(`   Status: ${response.status}`);
        return port;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`❌ Port ${port} - Connection refused`);
        } else if (error.code === 'ENOTFOUND') {
          console.log(`❌ Port ${port} - Not found`);
        } else {
          console.log(`❌ Port ${port} - ${error.message}`);
        }
      }
    }

    console.log('\n❌ No working port found. Please check if the server is running.');
    
    // Test if server is running on any port
    console.log('\n🔍 Checking if server is running...');
    try {
      const response = await axios.get('http://localhost:3000', {
        timeout: 2000
      });
      console.log('✅ Server is running on port 3000 but API routes might be different');
    } catch (error) {
      console.log('❌ Server not responding on port 3000');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicConnectivity();
