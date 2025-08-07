const axios = require('axios');

async function testEntryCompletion() {
  try {
    // First, lock the entry as a user
    console.log('Step 1: Locking entry 6028...');
    const lockResponse = await axios.post('http://localhost:3000/api/entry-locking/lock', {
      entryId: 6028,
      userId: 1
    });
    console.log('Lock response:', lockResponse.data);

    // Sample entry data with boolean values (like frontend sends)
    const testData = {
      deployed_in_ke: false,
      vendor_contacted: true,
      compensatory_controls_provided: false,
      site: "Test Site",
      patching: "Available",
      comments: "Test completion",
      current_status: "in_progress"
    };

    console.log('Step 2: Sending test data for completion:', testData);
    
    // Try to complete the entry
    const response = await axios.post('http://localhost:3000/api/entry-locking/complete/6028', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        userId: 1
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
    console.log('Full error:', error.response || error);
  }
}

testEntryCompletion();
