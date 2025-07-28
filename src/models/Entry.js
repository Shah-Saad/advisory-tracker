const db = require('../config/db');

const Entry = {
  create: (entry) => db('entries').insert(entry).returning('*'),
  all: () => db('entries'),
  byTeam: (team_id) => db('entries').where({ team_id }),
  anyYesResponses: () => db('entries').where('any_yes', true),
};

module.exports = Entry;