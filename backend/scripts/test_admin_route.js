const axios = require('axios');

async function testAdminRoute() {
  try {
    console.log('🧪 Testing Admin Team Sheet View Route...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const adminLoginResponse = await axios.post('http://localhost:3000/api/users/login', {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Get sheets
    console.log('2️⃣ Getting sheets...');
    const sheetsResponse = await axios.get('http://localhost:3000/api/sheets', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sheets = sheetsResponse.data;
    console.log(`✅ Found ${sheets.length} sheets`);
    
    if (sheets.length === 0) {
      console.log('❌ No sheets found. Please create a sheet first.');
      return;
    }

    const testSheet = sheets[0];
    console.log(`📋 Using sheet: ${testSheet.title} (ID: ${testSheet.id})\n`);

    // Step 3: Test the specific admin route that's failing
    console.log('3️⃣ Testing admin team sheet view route...');
    console.log(`🔗 Testing URL: /api/admin/team-sheets/${testSheet.id}/distribution`);
    
    try {
      const adminViewResponse = await axios.get(`http://localhost:3000/api/admin/team-sheets/${testSheet.id}/distribution`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Admin route response successful!');
      console.log('📊 Response status:', adminViewResponse.status);
      console.log('📊 Response data keys:', Object.keys(adminViewResponse.data));
      console.log('📊 Assignment status:', adminViewResponse.data.assignment_status);
      console.log('📊 Team name:', adminViewResponse.data.team_name);
      console.log('📊 Responses count:', adminViewResponse.data.responses?.length || 0);
      
      // Check if risk levels are present
      if (adminViewResponse.data.responses && adminViewResponse.data.responses.length > 0) {
        const firstResponse = adminViewResponse.data.responses[0];
        console.log('📊 First response risk level:', firstResponse.original_risk_level);
        console.log('📊 First response product name:', firstResponse.product_name);
      }
      
    } catch (routeError) {
      console.error('❌ Admin route failed:');
      console.error('   Status:', routeError.response?.status);
      console.error('   Error:', routeError.response?.data?.error || routeError.message);
      console.error('   Full response:', routeError.response?.data);
    }

    // Step 4: Test with different team names
    console.log('\n4️⃣ Testing with different team names...');
    const teamNames = ['distribution', 'transmission', 'generation'];
    
    for (const teamName of teamNames) {
      console.log(`\n🔗 Testing team: ${teamName}`);
      try {
        const teamResponse = await axios.get(`http://localhost:3000/api/admin/team-sheets/${testSheet.id}/${teamName}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ ${teamName} route successful - Status: ${teamResponse.status}`);
      } catch (teamError) {
        console.error(`❌ ${teamName} route failed:`, teamError.response?.data?.error || teamError.message);
      }
    }

    console.log('\n🎉 Admin route testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAdminRoute();
