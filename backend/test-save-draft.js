const axios = require('axios');

const testSaveDraft = async () => {
  try {
    // Get admin token (let's test with admin first)
    console.log('🔐 Logging in as admin...');
    const loginRes = await axios.post('http://localhost:3000/api/users/login', {
      email: 'admin@advisorytracker.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 50) + '...');

    // Get sheet entries directly
    console.log('📋 Fetching sheet entries...');
    const entriesRes = await axios.get('http://localhost:3000/api/sheet-entries', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const entries = entriesRes.data;
    console.log('✅ Got', entries.length, 'entries');

    if (entries.length > 0) {
      const entryId = entries[0].id;
      console.log('🧪 Testing save draft for entry:', entryId);
      console.log('📝 Original entry data:', {
        id: entries[0].id,
        notes: entries[0].notes,
        status: entries[0].status,
        risk_level: entries[0].risk_level || entries[0].original_risk_level
      });

      // Try to update entry
      const updateData = {
        notes: 'Test update from script - ' + new Date().toISOString(),
        status: 'in_progress',
        risk_level: 'Medium'
      };
      console.log('📤 Sending update data:', updateData);

      const updateRes = await axios.put('http://localhost:3000/api/sheet-entries/' + entryId, updateData, {
        headers: { Authorization: 'Bearer ' + token }
      });

      console.log('✅ Save draft successful:', updateRes.data);
    } else {
      console.log('❌ No entries found to test');
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('🔢 Status Code:', error.response.status);
      console.error('📋 Response Headers:', error.response.headers);
    }
    if (error.response?.data) {
      console.error('📄 Full Error Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

testSaveDraft();
