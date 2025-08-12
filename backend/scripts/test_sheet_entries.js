const axios = require('axios');

async function testSheetEntries() {
  try {
    console.log('🧪 Testing Sheet Entries...\n');

    // Step 1: Login as a regular user
    console.log('1️⃣ Logging in as regular user...');
    let token;
    try {
      const loginResponse = await axios.post('http://localhost:3000/api/users/login', {
        email: 'saad@advisorytracker.com',
        password: '123456'
      });
      token = loginResponse.data.token;
      console.log('✅ Login successful\n');
    } catch (loginError) {
      console.log('❌ Login failed:');
      console.log('📊 Error status:', loginError.response?.status);
      console.log('📊 Error data:', loginError.response?.data);
      console.log('📊 Error message:', loginError.message);
      
      // Try alternative credentials
      console.log('\n🔄 Trying alternative credentials...');
      try {
        const loginResponse2 = await axios.post('http://localhost:3000/api/users/login', {
          email: 'pasha@advisorytracker.com',
          password: '123456'
        });
        token = loginResponse2.data.token;
        console.log('✅ Login successful with alternative credentials\n');
      } catch (loginError2) {
        console.log('❌ Alternative login also failed:');
        console.log('📊 Error:', loginError2.response?.data || loginError2.message);
        return;
      }
    }

    // Step 2: Get user info
    console.log('2️⃣ Getting user info...');
    const userResponse = await axios.get('http://localhost:3000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const user = userResponse.data;
    console.log('✅ User info:', {
      id: user.id,
      email: user.email,
      team_id: user.team_id,
      role: user.role
    });

    // Step 3: Get team sheets
    console.log('\n3️⃣ Getting team sheets...');
    const sheetsResponse = await axios.get('http://localhost:3000/api/sheets/my-team', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sheets = sheetsResponse.data;
    console.log(`✅ Found ${sheets.length} team sheets`);
    
    if (sheets.length === 0) {
      console.log('❌ No sheets found for team');
      return;
    }

    const testSheet = sheets[0];
    console.log(`📋 Using sheet: ${testSheet.title} (ID: ${testSheet.id})`);

    // Step 4: Get sheet entries directly
    console.log('\n4️⃣ Getting sheet entries directly...');
    try {
      const entriesResponse = await axios.get(`http://localhost:3000/api/sheet-entries/sheet/${testSheet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const entries = entriesResponse.data;
      console.log(`✅ Found ${entries.length} sheet entries`);
      
      if (entries.length > 0) {
        console.log('📊 First few entries:');
        entries.slice(0, 3).forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Vendor: ${entry.oem_vendor}`);
        });
      } else {
        console.log('❌ No sheet entries found');
      }
    } catch (entriesError) {
      console.log('❌ Failed to get sheet entries:', entriesError.response?.data || entriesError.message);
    }

    // Step 5: Get team sheet data
    console.log('\n5️⃣ Getting team sheet data...');
    try {
      const teamSheetResponse = await axios.get(`http://localhost:3000/api/sheets/${testSheet.id}/team-id/${user.team_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const teamSheetData = teamSheetResponse.data;
      console.log('✅ Team sheet data received');
      console.log('📊 Assignment status:', teamSheetData.sheet?.assignment_status);
      console.log('📊 Sheet status:', teamSheetData.sheet?.status);
      console.log('📊 Responses count:', teamSheetData.responses?.length || 0);
      console.log('📊 Entries count:', teamSheetData.entries?.length || 0);
      
      if (teamSheetData.entries && teamSheetData.entries.length > 0) {
        console.log('📊 First few entries from team sheet data:');
        teamSheetData.entries.slice(0, 3).forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Vendor: ${entry.oem_vendor}`);
        });
      }
    } catch (teamSheetError) {
      console.log('❌ Failed to get team sheet data:', teamSheetError.response?.data || teamSheetError.message);
    }

    // Step 6: Check if entries are assigned to the user's team
    console.log('\n6️⃣ Checking entry team assignments...');
    try {
      const db = require('../src/config/db');
      const teamEntries = await db('sheet_entries')
        .where('sheet_id', testSheet.id)
        .where('assigned_team', user.team_id)
        .select('*');
      
      console.log(`✅ Found ${teamEntries.length} entries for user's team (${user.team_id})`);
      
      if (teamEntries.length > 0) {
        console.log('📊 First few team entries:');
        teamEntries.slice(0, 3).forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}, Product: ${entry.product_name}, Assigned Team: ${entry.assigned_team}`);
        });
      } else {
        console.log('❌ No entries assigned to user\'s team');
      }
      
      // Check all team assignments for this sheet
      const allTeamEntries = await db('sheet_entries')
        .where('sheet_id', testSheet.id)
        .whereNotNull('assigned_team')
        .select('*');
      
      const uniqueTeams = [...new Set(allTeamEntries.map(e => e.assigned_team))];
      console.log(`📊 All team assignments for this sheet: ${uniqueTeams.join(', ')}`);
      
    } catch (dbError) {
      console.log('❌ Failed to check database:', dbError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSheetEntries();
