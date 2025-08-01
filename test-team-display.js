// Quick test script to verify team data in database
const db = require('./src/config/db');

async function testTeamData() {
  try {
    console.log('🔍 Testing team data in database...\n');
    
    // Query all users with their team information
    const users = await db('users')
      .select(
        'id',
        'username', 
        'email',
        'first_name',
        'last_name',
        'role',
        'team',
        'is_active'
      )
      .orderBy('created_at', 'desc');
    
    console.log(`📊 Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Team: ${user.team || 'No team assigned'}`);
      console.log(`   Active: ${user.is_active}`);
      console.log('   ---');
    });
    
    // Summary of team assignments
    const teamCounts = users.reduce((acc, user) => {
      const team = user.team || 'No Team';
      acc[team] = (acc[team] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Team Distribution:');
    Object.entries(teamCounts).forEach(([team, count]) => {
      console.log(`   ${team}: ${count} user(s)`);
    });
    
  } catch (error) {
    console.error('❌ Error testing team data:', error);
  } finally {
    process.exit(0);
  }
}

testTeamData();
