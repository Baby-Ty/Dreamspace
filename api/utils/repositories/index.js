/**
 * Repository Index
 * Central export point for all Cosmos DB repositories
 */

const BaseRepository = require('./BaseRepository');
const UserRepository = require('./UserRepository');
const DreamsRepository = require('./DreamsRepository');
const ConnectsRepository = require('./ConnectsRepository');
const WeeksRepository = require('./WeeksRepository');
const ScoringRepository = require('./ScoringRepository');
const TeamsRepository = require('./TeamsRepository');
const PromptsRepository = require('./PromptsRepository');

module.exports = {
  BaseRepository,
  UserRepository,
  DreamsRepository,
  ConnectsRepository,
  WeeksRepository,
  ScoringRepository,
  TeamsRepository,
  PromptsRepository
};
