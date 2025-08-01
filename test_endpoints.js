const jwt = require('jsonwebtoken');

// Create admin token
const adminPayload = {
  id: 1,
  username: 'admin',
  role: 'admin'
};

const token = jwt.sign(adminPayload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

console.log('Admin Token for testing:');
console.log(token);
console.log('\nTest commands:');
console.log('1. Get team views:');
console.log(`Invoke-WebRequest -Uri "http://localhost:3000/api/sheets/1/team-views" -Method GET -Headers @{"Authorization"="Bearer ${token}"} | Select-Object -ExpandProperty Content`);
console.log('\n2. Get summary:');
console.log(`Invoke-WebRequest -Uri "http://localhost:3000/api/sheets/team-status-summary" -Method GET -Headers @{"Authorization"="Bearer ${token}"} | Select-Object -ExpandProperty Content`);
console.log('\n3. Get specific team view:');
console.log(`Invoke-WebRequest -Uri "http://localhost:3000/api/sheets/1/team/19" -Method GET -Headers @{"Authorization"="Bearer ${token}"} | Select-Object -ExpandProperty Content`);
