/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing entries
  await knex('teams').del();

  // Insert default teams
  await knex('teams').insert([
    {
      name: 'Distribution',
      description: 'Distribution team responsible for power distribution networks',
      is_active: true
    },
    {
      name: 'Transmission', 
      description: 'Transmission team responsible for power transmission infrastructure',
      is_active: true
    },
    {
      name: 'Generation',
      description: 'General team for cross-functional activities and administration',
      is_active: true
    }
  ]);
};
