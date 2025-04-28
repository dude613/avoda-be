import { PrismaClient, TeamMemberRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Define all system permissions
  const permissions = [
    // Timer permissions
    { 
      name: 'CREATE_TIMER', 
      description: 'Permission to create a timer',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'READ_TIMER', 
      description: 'Permission to view timers',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'READ_TIMER_OTHERS', 
      description: 'Permission to view other timers',
      roles: [TeamMemberRole.admin]
    },
    { 
      name: 'UPDATE_TIMER', 
      description: 'Permission to update a timer',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'DELETE_TIMER', 
      description: 'Permission to delete a timer',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'UPDATE_TIMER_OTHERS', 
      description: 'Permission to update other users\' timers',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'DELETE_TIMER_OTHERS', 
      description: 'Permission to delete other users\' timers',
      roles: [TeamMemberRole.admin]
    },
    { 
      name: 'DELETE_TIMER_NOTE', 
      description: 'Permission to delete timer notes',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    
    // Client permissions
    { 
      name: 'CREATE_CLIENT', 
      description: 'Permission to create a client',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'READ_CLIENT', 
      description: 'Permission to view clients',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'UPDATE_CLIENT', 
      description: 'Permission to update a client',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'DELETE_CLIENT', 
      description: 'Permission to delete a client',
      roles: [TeamMemberRole.admin]
    },
    
    // Project permissions
    { 
      name: 'CREATE_PROJECT', 
      description: 'Permission to create a project',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'READ_PROJECT', 
      description: 'Permission to view projects',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'UPDATE_PROJECT', 
      description: 'Permission to update a project',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'DELETE_PROJECT', 
      description: 'Permission to delete a project',
      roles: [TeamMemberRole.admin]
    },
    
    // Task permissions
    { 
      name: 'CREATE_TASK', 
      description: 'Permission to create a task',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'READ_TASK', 
      description: 'Permission to view tasks',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'UPDATE_TASK', 
      description: 'Permission to update a task',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'DELETE_TASK', 
      description: 'Permission to delete a task',
      roles: [TeamMemberRole.admin]
    },
    
    // Team member permissions
    { 
      name: 'CREATE_TEAM_MEMBER', 
      description: 'Permission to create a team member',
      roles: [TeamMemberRole.admin]
    },
    { 
      name: 'READ_TEAM_MEMBER', 
      description: 'Permission to view team members',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'UPDATE_TEAM_MEMBER', 
      description: 'Permission to update a team member',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'DELETE_TEAM_MEMBER', 
      description: 'Permission to delete a team member',
      roles: [TeamMemberRole.admin]
    },
    
    // Organization permissions
    { 
      name: 'READ_ORGANIZATION', 
      description: 'Permission to view organization details',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager, TeamMemberRole.employee]
    },
    { 
      name: 'UPDATE_ORGANIZATION', 
      description: 'Permission to update organization details',
      roles: [TeamMemberRole.admin]
    },
    
    // Report permissions
    { 
      name: 'VIEW_REPORTS', 
      description: 'Permission to view reports',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    { 
      name: 'EXPORT_REPORTS', 
      description: 'Permission to export reports',
      roles: [TeamMemberRole.admin, TeamMemberRole.manager]
    },
    
    // Settings permissions
    { 
      name: 'MANAGE_SETTINGS', 
      description: 'Permission to manage application settings',
      roles: [TeamMemberRole.admin]
    },
    
    // Permission management
    { 
      name: 'MANAGE_PERMISSIONS', 
      description: 'Permission to manage role permissions',
      roles: [TeamMemberRole.admin]
    }
  ];

  // Create or update all permissions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        roles: permission.roles
      },
      create: {
        name: permission.name,
        description: permission.description,
        roles: permission.roles
      },
    });
  }

  console.log('Created all system permissions with default role assignments');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });