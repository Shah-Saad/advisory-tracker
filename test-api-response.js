// Test API response for user management
const express = require('express');
const UserManagementService = require('./src/services/UserManagementService');

async function testUserAPI() {
  try {
    console.log('🔍 Testing UserManagementService.getAllUsers()...\n');
    
    const users = await UserManagementService.getAllUsers();
    
    console.log(`📊 API Response - Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User Response Object:`);
      console.log(JSON.stringify(user, null, 2));
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error testing user API:', error);
  } finally {
    process.exit(0);
  }
}

testUserAPI();
