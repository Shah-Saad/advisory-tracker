const bcrypt = require('bcrypt');
const db = require('./backend/src/config/db');

async function resetUserPasswords() {
  try {
    // Set password to 'password' for test users
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Update saad and abc users
    await db('users').where('username', 'saad').update({ password_hash: hashedPassword });
    await db('users').where('username', 'abc').update({ password_hash: hashedPassword });
    
    console.log('✅ Updated passwords for saad and abc users to "password"');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  }
}

resetUserPasswords();
