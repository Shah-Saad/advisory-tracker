const axios = require('axios');

async function testSubmitSheet() {
  try {
    console.log('🧪 Testing Sheet Submission...\n');

    // Step 1: Login with correct credentials
    console.log('1️⃣ Logging in with correct credentials...');
    const loginResponse = await axios.post('http://localhost:3000/api/users/login', {
      email: 'saad@advisorytracker.com',
      password: '123456'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get user info to check team_id
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

    // Step 4: Get team sheet data
    console.log('\n4️⃣ Getting team sheet data...');
    const teamSheetResponse = await axios.get(`http://localhost:3000/api/sheets/${testSheet.id}/team-id/${user.team_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teamSheetData = teamSheetResponse.data;
    console.log('✅ Team sheet data received');
    console.log('📊 Assignment status:', teamSheetData.sheet?.assignment_status);
    console.log('📊 Responses count:', teamSheetData.responses?.length || 0);

    // Step 5: Check what entries exist for this sheet
    console.log('\n5️⃣ Checking sheet entries...');
    try {
      const entriesResponse = await axios.get(`http://localhost:3000/api/sheet-entries/sheet/${testSheet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const entries = entriesResponse.data;
      console.log(`✅ Found ${entries.length} sheet entries`);
      console.log('📊 Entry IDs:', entries.map(e => e.id).slice(0, 10)); // Show first 10 IDs
      
      if (entries.length === 0) {
        console.log('❌ No sheet entries found');
        return;
      }
    } catch (entriesError) {
      console.log('❌ Failed to get sheet entries:', entriesError.response?.data || entriesError.message);
      return;
    }

    // Step 6: Prepare mock responses for submission using actual entry IDs
    console.log('\n6️⃣ Preparing mock responses...');
    const mockResponses = {};
    
    // Get the first few entries to use their IDs
    const entriesResponse = await axios.get(`http://localhost:3000/api/sheet-entries/sheet/${testSheet.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const entries = entriesResponse.data;
    
    // Use the first 3 entries
    entries.slice(0, 3).forEach(entry => {
      mockResponses[entry.id] = {
        current_status: 'In Progress',
        comments: 'Test submission',
        deployed_in_ke: 'Y',
        vendor_contacted: 'Y',
        vendor_contact_date: '2025-01-15',
        compensatory_controls_provided: 'Y',
        compensatory_controls_details: 'Test controls',
        site: 'Test Site',
        patching_est_release_date: '2025-02-01',
        implementation_date: '2025-02-15'
      };
    });
    console.log(`📝 Prepared ${Object.keys(mockResponses).length} mock responses`);
    console.log('📊 Using entry IDs:', Object.keys(mockResponses));

    // Step 7: Test sheet submission
    console.log('\n7️⃣ Testing sheet submission...');
    try {
      const submitResponse = await axios.post(`http://localhost:3000/api/sheets/${testSheet.id}/submit`, {
        responses: mockResponses
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Sheet submission successful!');
      console.log('📊 Response:', submitResponse.data);
    } catch (submitError) {
      console.log('❌ Sheet submission failed:');
      console.log('📊 Error status:', submitError.response?.status);
      console.log('📊 Error data:', submitError.response?.data);
      console.log('📊 Error message:', submitError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSubmitSheet();
