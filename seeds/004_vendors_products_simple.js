exports.seed = async function(knex) {
  // Clear existing entries
  await knex('products').del();
  await knex('vendors').del();
  
  // Insert vendors (simplified - only name and email)
  await knex('vendors').insert([
    {
      id: 1,
      name: 'Kenya Power & Lighting Company',
      email: 'procurement@kplc.co.ke'
    },
    {
      id: 2,
      name: 'Schneider Electric Kenya',
      email: 'info.kenya@schneider-electric.com'
    },
    {
      id: 3,
      name: 'Siemens Kenya',
      email: 'info.kenya@siemens.com'
    },
    {
      id: 4,
      name: 'ABB Kenya',
      email: 'contact@ke.abb.com'
    },
    {
      id: 5,
      name: 'GE Kenya',
      email: 'info@ge.com'
    }
  ]);

  // Insert products (simplified - only name and vendor_id)
  await knex('products').insert([
    {
      id: 1,
      name: 'MV Switchgear Panel',
      vendor_id: 1
    },
    {
      id: 2,
      name: 'Power Transformer 33/11kV',
      vendor_id: 2
    },
    {
      id: 3,
      name: 'Protection Relay System',
      vendor_id: 3
    },
    {
      id: 4,
      name: 'SCADA Control System',
      vendor_id: 4
    },
    {
      id: 5,
      name: 'Gas Turbine Generator',
      vendor_id: 5
    },
    {
      id: 6,
      name: 'Smart Meter System',
      vendor_id: 1
    },
    {
      id: 7,
      name: 'Underground Cable 11kV',
      vendor_id: 2
    },
    {
      id: 8,
      name: 'Energy Management Software',
      vendor_id: 3
    }
  ]);

  console.log('✅ Vendors and Products seeded successfully with simplified schema');
};
