const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test user sheet access
async function testUserSheetAccess() {
  try {
    console.log('🔍 Testing user sheet access...\n');
    
    // First test admin login
    console.log('1. Testing admin login...');
    const adminLogin = await axios.post(`${BASE_URL}/users/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');
    
    // Test user login (saad - Generation team member)
    console.log('\n2. Testing user login (saad)...');
    const userLogin = await axios.post(`${BASE_URL}/users/login`, {
      username: 'saad',
      password: 'password'
    });
    
    const userToken = userLogin.data.token;
    console.log('✅ User login successful');
    console.log('User data:', userLogin.data.user);
    
    // Test user accessing their team sheets
    console.log('\n3. Testing /sheets/my-team endpoint...');
    try {
      const userSheets = await axios.get(`${BASE_URL}/sheets/my-team`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✅ User sheets API successful');
      console.log('Sheets found:', userSheets.data.length);
      if (userSheets.data.length > 0) {
        console.log('First sheet:', userSheets.data[0]);
      }
    } catch (error) {
      console.log('❌ User sheets API failed:', error.response?.data || error.message);
    }
    
    // Test admin accessing team status summary
    console.log('\n4. Testing admin team status summary...');
    try {
      const teamStatusSummary = await axios.get(`${BASE_URL}/sheets/team-status-summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Team status summary successful');
      console.log('Sheets found:', teamStatusSummary.data.length);
    } catch (error) {
      console.log('❌ Team status summary failed:', error.response?.data || error.message);
    }
    
    // Test admin accessing specific team data
    console.log('\n5. Testing admin team data endpoint...');
    try {
      const teamData = await axios.get(`${BASE_URL}/sheets/69/team-data/generation`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Team data API successful');
      console.log('Team data summary:', {
        sheet: teamData.data.sheet?.title,
        response_count: teamData.data.response_count,
        completion_percentage: teamData.data.completion_percentage,
        assignment_status: teamData.data.assignment?.status
      });
    } catch (error) {
      console.log('❌ Team data API failed:', error.response?.data || error.message);
    }
    
    // Test frontend endpoints used by components
    console.log('\n6. Testing sheet by teams endpoint...');
    try {
      const sheetByTeams = await axios.get(`${BASE_URL}/sheets/69/team-views`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Sheet by teams successful');
      console.log('Team versions found:', sheetByTeams.data.team_versions?.length || 0);
    } catch (error) {
      console.log('❌ Sheet by teams failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUserSheetAccess();
