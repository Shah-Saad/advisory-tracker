const db = require('../src/config/db');

async function testAdminRole() {
  try {
    console.log('🧪 Testing Admin Role...\n');

    // Step 1: Check admin user directly
    console.log('1️⃣ Checking admin user...');
    const adminUser = await db('users')
      .select('users.*', 'roles.name as role_name')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.email', 'admin@advisorytracker.com')
      .first();
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   - ID: ${adminUser.id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role ID: ${adminUser.role_id}`);
      console.log(`   - Role Name: ${adminUser.role_name}`);
      console.log(`   - Is Active: ${adminUser.is_active}`);
    } else {
      console.log('❌ Admin user not found');
    }

    // Step 2: Check all users with roles
    console.log('\n2️⃣ Checking all users with roles...');
    const allUsers = await db('users')
      .select('users.id', 'users.email', 'users.role_id', 'roles.name as role_name')
      .leftJoin('roles', 'users.role_id', 'roles.id');
    
    console.log(`✅ Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`   - ${user.email}: Role ID ${user.role_id} (${user.role_name})`);
    });

    // Step 3: Check roles table
    console.log('\n3️⃣ Checking roles table...');
    const roles = await db('roles').select('*');
    console.log(`✅ Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`   - ID: ${role.id}, Name: ${role.name}`);
    });

    // Step 4: Check if admin role exists
    console.log('\n4️⃣ Checking for admin role...');
    const adminRole = await db('roles').where('name', 'admin').first();
    if (adminRole) {
      console.log(`✅ Admin role found: ID ${adminRole.id}`);
    } else {
      console.log('❌ Admin role not found');
    }

    // Step 5: Update admin user role if needed
    if (adminUser && adminRole && adminUser.role_id !== adminRole.id) {
      console.log('\n5️⃣ Updating admin user role...');
      await db('users')
        .where('id', adminUser.id)
        .update({ role_id: adminRole.id });
      console.log('✅ Admin user role updated');
    } else if (adminUser && adminRole) {
      console.log('\n5️⃣ Admin user already has correct role');
    } else {
      console.log('\n5️⃣ Cannot update admin user role - missing user or role');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testAdminRole();

