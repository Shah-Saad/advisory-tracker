const axios = require('axios');

async function testUnlockSheet() {
  try {
    console.log('🧪 Testing Sheet Unlock Functionality...\n');

    // Step 1: Try different admin credentials
    const adminCredentials = [
      { email: 'admin@advisorytracker.com', password: 'admin123' },
      { email: 'admin', password: 'admin123' },
      { email: 'admin@advisorytracker.com', password: '123456' }
    ];

    let adminToken = null;
    let adminUser = null;

    for (const cred of adminCredentials) {
      console.log(`1️⃣ Trying admin login with: ${cred.email}`);
      try {
        const adminLoginResponse = await axios.post('http://localhost:3000/api/users/login', cred);
        adminToken = adminLoginResponse.data.token;
        console.log('✅ Admin login successful\n');
        break;
      } catch (loginError) {
        console.log(`❌ Login failed with ${cred.email}`);
      }
    }

    if (!adminToken) {
      console.log('❌ Could not login with any admin credentials');
      return;
    }

    // Step 2: Get admin user info
    console.log('2️⃣ Getting admin user info...');
    const adminUserResponse = await axios.get('http://localhost:3000/api/users/profile', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    adminUser = adminUserResponse.data;
    console.log('✅ Admin user info:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    // Step 3: Test unlock functionality with known completed sheet
    console.log('\n3️⃣ Testing unlock functionality with known completed sheet...');
    
    // We know from the database that:
    // - Sheet ID: 79 (Monthly Advisory Report - 2025-March)
    // - Team ID: 41 (Distribution)
    // - Status: completed
    
    const sheetId = 79;
    const teamId = 41;
    
    console.log(`📋 Testing unlock for Sheet ID: ${sheetId}, Team ID: ${teamId}`);
    
    try {
      const unlockResponse = await axios.put(`http://localhost:3000/api/admin/sheets/${sheetId}/teams/${teamId}/unlock`, {
        reason: 'Testing unlock functionality'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Sheet unlocked successfully!');
      console.log('📊 Response:', unlockResponse.data);
    } catch (unlockError) {
      console.log('❌ Sheet unlock failed:');
      console.log('📊 Error status:', unlockError.response?.status);
      console.log('📊 Error data:', unlockError.response?.data);
      console.log('📊 Error message:', unlockError.message);
      
      // Try to get more details about the error
      if (unlockError.response?.data?.error) {
        console.log('📊 Detailed error:', unlockError.response.data.error);
      }
    }

    // Step 4: Also test the team-responses unlock route
    console.log('\n4️⃣ Testing team-responses unlock route...');
    try {
      const unlockResponse2 = await axios.put(`http://localhost:3000/api/team-responses/admin/sheets/${sheetId}/teams/${teamId}/unlock`, {
        reason: 'Testing unlock functionality via team-responses route'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Sheet unlocked successfully via team-responses route!');
      console.log('📊 Response:', unlockResponse2.data);
    } catch (unlockError2) {
      console.log('❌ Team-responses unlock failed:');
      console.log('📊 Error status:', unlockError2.response?.status);
      console.log('📊 Error data:', unlockError2.response?.data);
      console.log('📊 Error message:', unlockError2.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUnlockSheet();
