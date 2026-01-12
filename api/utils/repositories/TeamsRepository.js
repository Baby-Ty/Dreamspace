/**
 * TeamsRepository
 * Handles team relationship and coaching assignment operations
 */

const BaseRepository = require('./BaseRepository');
const { generateTeamId } = require('../idGenerator');

class TeamsRepository extends BaseRepository {
  /**
   * Get team for a coach/manager
   * @param {string} managerId - Manager ID
   * @returns {Promise<object|null>} Team document or null if not found
   */
  async getTeamByManager(managerId) {
    const container = this.getContainer('teams');
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: managerId }
      ]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources.length > 0 ? resources[0] : null;
  }

  /**
   * Upsert team
   * @param {string} managerId - Manager ID (current coach)
   * @param {object} teamData - Team data (should include stable teamId if updating existing team)
   * @returns {Promise<object>} Saved team document
   */
  async upsertTeam(managerId, teamData) {
    const container = this.getContainer('teams');
    // Use existing teamId if provided, otherwise generate a short unique teamId
    // This ensures teamId persists across coach changes
    const teamId = teamData.teamId || teamData.id || generateTeamId(); // e.g., "team_a1b2c3"
    const document = {
      id: teamId,           // Document ID = teamId
      teamId: teamId,       // Stable team identifier - NEVER changes
      managerId: managerId, // Current coach - CAN change
      type: 'team_relationship',
      ...teamData,
      lastModified: new Date().toISOString()
    };
    const { resource } = await container.items.upsert(document);
    return resource;
  }
}

module.exports = TeamsRepository;
