const { generateTeamId } = require('../utils/idGenerator');
const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'admin'
}, async (context, req, { provider }) => {
  const { oldCoachId, newCoachId, teamName, demoteOption = 'unassigned', assignToTeamId } = req.body;

  if (!oldCoachId) {
    throw { status: 400, message: 'Old coach ID is required' };
  }

  // For disband-team option, newCoachId can be null
  if (demoteOption !== 'disband-team' && !newCoachId) {
    throw { status: 400, message: 'New coach ID is required unless disbanding team' };
  }

  if (newCoachId && oldCoachId === newCoachId) {
    throw { status: 400, message: 'Old coach and new coach cannot be the same' };
  }

  const usersContainer = provider.getContainer('users');
  const teamsContainer = provider.getContainer('teams');

  context.log(`${demoteOption === 'disband-team' ? 'Disbanding' : 'Replacing'} team for coach ${oldCoachId}${newCoachId ? ` with ${newCoachId}` : ''}`);

  // Find the old coach's team
  const oldTeamQuery = {
    query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
    parameters: [
      { name: '@type', value: 'team_relationship' },
      { name: '@managerId', value: oldCoachId }
    ]
  };

  const { resources: oldTeams } = await teamsContainer.items.query(oldTeamQuery).fetchAll();
  
  if (oldTeams.length === 0) {
    throw { status: 404, message: 'Old coach team not found', details: oldCoachId };
  }

  const oldTeam = oldTeams[0];

  // SPECIAL CASE: Disband team - move everyone to unassigned
  if (demoteOption === 'disband-team') {
    context.log(`Disbanding team: ${oldTeam.teamName} with ${oldTeam.teamMembers.length} members`);
    
    // Get old coach user profile
    const oldCoachQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: oldCoachId }]
    };
    const { resources: oldCoaches } = await usersContainer.items.query(oldCoachQuery).fetchAll();
    
    if (oldCoaches.length > 0) {
      const oldCoachUser = oldCoaches[0];
      // Demote coach to user and clear assignments
      const updatedOldCoach = {
        ...oldCoachUser,
        role: 'user',
        isCoach: false,
        assignedCoachId: null,
        assignedTeamName: null,
        demotedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      await usersContainer.item(oldCoachUser.id, oldCoachUser.userId).replace(updatedOldCoach);
      context.log(`Demoted coach ${oldCoachId} to user`);
    }
    
    // Move all team members to unassigned
    for (const memberId of oldTeam.teamMembers) {
      const memberQuery = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: memberId }]
      };
      const { resources: members } = await usersContainer.items.query(memberQuery).fetchAll();
      
      if (members.length > 0) {
        const member = members[0];
        const updatedMember = {
          ...member,
          assignedCoachId: null,
          assignedTeamName: null,
          lastModified: new Date().toISOString()
        };
        await usersContainer.item(member.id, member.userId).replace(updatedMember);
        context.log(`Moved member ${memberId} to unassigned`);
      }
    }
    
    // Delete the team
    await teamsContainer.item(oldTeam.id, oldTeam.managerId).delete();
    context.log(`Deleted team ${oldTeam.id}`);
    
    return {
      success: true,
      message: 'Team disbanded successfully',
      disbandedTeam: oldTeam.teamName,
      membersUnassigned: oldTeam.teamMembers.length + 1, // +1 for coach
      timestamp: new Date().toISOString()
    };
  }

  // Check if new coach already has a team
  const newTeamQuery = {
    query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
    parameters: [
      { name: '@type', value: 'team_relationship' },
      { name: '@managerId', value: newCoachId }
    ]
  };

  const { resources: newTeams } = await teamsContainer.items.query(newTeamQuery).fetchAll();
  
  // Verify new coach exists and get their profile
  const newCoachQuery = {
    query: 'SELECT * FROM c WHERE c.userId = @userId',
    parameters: [
      { name: '@userId', value: newCoachId }
    ]
  };

  const { resources: newCoaches } = await usersContainer.items.query(newCoachQuery).fetchAll();
  
  if (newCoaches.length === 0) {
    throw { status: 404, message: 'New coach not found', details: newCoachId };
  }

  const newCoach = newCoaches[0];

  // If new coach already has a team, we'll merge the teams
  let mergedTeamMembers = [...oldTeam.teamMembers];
  let teamToDelete = null;
  
  if (newTeams.length > 0) {
    const existingNewTeam = newTeams[0];
    // Merge team members (avoid duplicates)
    const existingMembers = new Set(existingNewTeam.teamMembers);
    mergedTeamMembers = [
      ...existingNewTeam.teamMembers,
      ...oldTeam.teamMembers.filter(member => !existingMembers.has(member))
    ];
    teamToDelete = existingNewTeam; // We'll delete the new coach's old team
  }

  // Preserve stable teamId - if old team doesn't have one (legacy), generate one
  // This ensures meeting attendance and other team-linked data persists across coach changes
  const stableTeamId = oldTeam.teamId || generateTeamId(); // e.g., "team_a1b2c3"
  
  // Create the new team structure - PRESERVE teamId and teamName
  const updatedTeam = {
    ...oldTeam,
    id: stableTeamId,           // Document ID = teamId
    teamId: stableTeamId,       // Stable team identifier - NEVER changes
    managerId: newCoachId,      // New coach's ID - this is what changes
    // Preserve existing teamName unless explicitly provided in request
    teamName: teamName || oldTeam.teamName || `${newCoach.name || 'New Coach'}'s Team`,
    teamMembers: mergedTeamMembers,
    lastModified: new Date().toISOString(),
    coachReplaced: {
      oldCoachId: oldCoachId,
      newCoachId: newCoachId,
      previousTeamName: oldTeam.teamName,
      replacedAt: new Date().toISOString(),
      replacedBy: 'system'
    }
  };

  // Delete the old team
  await teamsContainer.item(oldTeam.id, oldTeam.managerId).delete();

  // If new coach had an existing team, delete that too (we merged it)
  if (teamToDelete) {
    await teamsContainer.item(teamToDelete.id, teamToDelete.managerId).delete();
  }

  // Create the new team with the new coach
  await teamsContainer.items.create(updatedTeam);

  // Handle old coach demotion/assignment
  const oldCoachTeamsQuery = {
    query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
    parameters: [
      { name: '@type', value: 'team_relationship' },
      { name: '@managerId', value: oldCoachId }
    ]
  };
  
  const { resources: remainingOldCoachTeams } = await teamsContainer.items.query(oldCoachTeamsQuery).fetchAll();
  
  if (remainingOldCoachTeams.length === 0) {
    // Old coach has no more teams, handle according to demoteOption
    const oldCoachUserQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [
        { name: '@userId', value: oldCoachId }
      ]
    };

    const { resources: oldCoachUsers } = await usersContainer.items.query(oldCoachUserQuery).fetchAll();
    
    if (oldCoachUsers.length > 0) {
      const oldCoachUser = oldCoachUsers[0];
      
      if (demoteOption === 'assign-to-team' && assignToTeamId) {
        // Assign old coach to another team
        const assignToTeamQuery = {
          query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
          parameters: [
            { name: '@type', value: 'team_relationship' },
            { name: '@managerId', value: assignToTeamId }
          ]
        };

        const { resources: assignToTeams } = await teamsContainer.items.query(assignToTeamQuery).fetchAll();
        
        if (assignToTeams.length > 0) {
          const targetTeam = assignToTeams[0];
          
          // Add old coach to the target team
          if (!targetTeam.teamMembers.includes(oldCoachId)) {
            const updatedTargetTeam = {
              ...targetTeam,
              teamMembers: [...targetTeam.teamMembers, oldCoachId],
              lastModified: new Date().toISOString()
            };
            await teamsContainer.item(targetTeam.id, targetTeam.managerId).replace(updatedTargetTeam);
          }

          // Update old coach user record
          const updatedOldCoachUser = {
            ...oldCoachUser,
            role: 'user',
            isCoach: false,
            assignedCoachId: assignToTeamId,
            assignedTeamName: targetTeam.teamName,
            demotedAt: new Date().toISOString(),
            reassignedAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          };
          await usersContainer.item(oldCoachUser.id, oldCoachUser.userId).replace(updatedOldCoachUser);
        }
      } else {
        // Default: Move to unassigned
        const updatedOldCoachUser = {
          ...oldCoachUser,
          role: 'user',
          isCoach: false,
          assignedCoachId: null,
          assignedTeamName: null,
          demotedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        await usersContainer.item(oldCoachUser.id, oldCoachUser.userId).replace(updatedOldCoachUser);
      }
    }
  }

  // Update new coach role to 'coach'
  const updatedNewCoachUser = {
    ...newCoach,
    role: 'coach',
    isCoach: true,
    promotedAt: newCoach.promotedAt || new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
  await usersContainer.item(newCoach.id, newCoach.userId).replace(updatedNewCoachUser);

  // Update all team members' assignment info
  for (const memberId of updatedTeam.teamMembers) {
    const memberQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [
        { name: '@userId', value: memberId }
      ]
    };

    const { resources: members } = await usersContainer.items.query(memberQuery).fetchAll();
    
    if (members.length > 0) {
      const member = members[0];
      const updatedMember = {
        ...member,
        assignedCoachId: newCoachId,
        assignedTeamName: updatedTeam.teamName,
        reassignedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      await usersContainer.item(member.id, member.userId).replace(updatedMember);
    }
  }

  context.log(`Successfully replaced coach ${oldCoachId} with ${newCoachId} for ${updatedTeam.teamMembers.length} team members`);

  return {
    success: true,
    message: 'Coach successfully replaced',
    oldCoachId: oldCoachId,
    newCoachId: newCoachId,
    teamId: updatedTeam.teamId,  // Stable team ID preserved across coach changes
    teamName: updatedTeam.teamName,
    teamSize: updatedTeam.teamMembers.length,
    replacedAt: updatedTeam.coachReplaced.replacedAt,
    mergedTeams: !!teamToDelete,
    timestamp: new Date().toISOString()
  };
});
