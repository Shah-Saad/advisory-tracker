/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing entries
  await knex('role_permissions').del();
  await knex('permissions').del();
  await knex('roles').del();

  // Insert default roles
  const roles = await knex('roles').insert([
    { name: 'admin', description: 'System administrator with full access', is_active: true },
    { name: 'team_lead', description: 'Team leader with team management permissions', is_active: true },
    { name: 'team_member', description: 'Regular team member with basic permissions', is_active: true }
  ]).returning(['id', 'name']);

  // Insert default permissions
  const permissions = await knex('permissions').insert([
    // User management permissions
    { name: 'create_users', description: 'Create new users', resource: 'users', action: 'create' },
    { name: 'read_users', description: 'View user information', resource: 'users', action: 'read' },
    { name: 'update_users', description: 'Update user information', resource: 'users', action: 'update' },
    { name: 'delete_users', description: 'Delete users', resource: 'users', action: 'delete' },
    
    // Role management permissions
    { name: 'create_roles', description: 'Create new roles', resource: 'roles', action: 'create' },
    { name: 'read_roles', description: 'View role information', resource: 'roles', action: 'read' },
    { name: 'update_roles', description: 'Update role information', resource: 'roles', action: 'update' },
    { name: 'delete_roles', description: 'Delete roles', resource: 'roles', action: 'delete' },
    
    // Team management permissions
    { name: 'create_teams', description: 'Create new teams', resource: 'teams', action: 'create' },
    { name: 'read_teams', description: 'View team information', resource: 'teams', action: 'read' },
    { name: 'update_teams', description: 'Update team information', resource: 'teams', action: 'update' },
    { name: 'delete_teams', description: 'Delete teams', resource: 'teams', action: 'delete' },
    { name: 'manage_team_members', description: 'Add/remove team members', resource: 'teams', action: 'manage_members' },
    
    // Sheet management permissions
    { name: 'create_sheets', description: 'Create and upload new sheets', resource: 'sheets', action: 'create' },
    { name: 'read_sheets', description: 'View sheet information', resource: 'sheets', action: 'read' },
    { name: 'update_sheets', description: 'Update sheet information', resource: 'sheets', action: 'update' },
    { name: 'delete_sheets', description: 'Delete sheets', resource: 'sheets', action: 'delete' },
    { name: 'distribute_sheets', description: 'Distribute sheets to teams', resource: 'sheets', action: 'distribute' },
    { name: 'fill_sheets', description: 'Fill out assigned sheets', resource: 'sheets', action: 'fill' },
    { name: 'export_sheet_data', description: 'Export sheet response data', resource: 'sheets', action: 'export' },
    { name: 'filter_sheet_data', description: 'Filter and analyze sheet response data', resource: 'sheets', action: 'filter' },
    { name: 'view_monthly_summary', description: 'View monthly sheet summaries', resource: 'sheets', action: 'view_summary' }
  ]).returning(['id', 'name']);

  // Create permission maps for easier lookup
  const roleMap = roles.reduce((acc, role) => {
    acc[role.name] = role.id;
    return acc;
  }, {});

  const permissionMap = permissions.reduce((acc, permission) => {
    acc[permission.name] = permission.id;
    return acc;
  }, {});

  // Insert role-permission mappings
  const rolePermissions = [];

  // Admin gets all permissions
  const adminPermissions = Object.values(permissionMap);
  adminPermissions.forEach(permissionId => {
    rolePermissions.push({
      role_id: roleMap.admin,
      permission_id: permissionId
    });
  });

  // Team lead gets team and sheet management permissions
  const teamLeadPermissions = [
    'read_users', 'read_teams', 'update_teams', 'manage_team_members',
    'read_sheets', 'fill_sheets', 'export_sheet_data', 'filter_sheet_data', 'view_monthly_summary'
  ];
  teamLeadPermissions.forEach(permissionName => {
    rolePermissions.push({
      role_id: roleMap.team_lead,
      permission_id: permissionMap[permissionName]
    });
  });

  // Team member gets basic permissions
  const teamMemberPermissions = [
    'read_users', 'read_teams', 'read_sheets', 'fill_sheets'
  ];
  teamMemberPermissions.forEach(permissionName => {
    rolePermissions.push({
      role_id: roleMap.team_member,
      permission_id: permissionMap[permissionName]
    });
  });

  await knex('role_permissions').insert(rolePermissions);
};
