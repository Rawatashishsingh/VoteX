const fs = require('fs');

// 1. Update database.js
let db = fs.readFileSync('database.js', 'utf8');

db = db.replace(
  'logo_url TEXT',
  'logo_url TEXT,\n  crimes INTEGER DEFAULT 0,\n  controversies_count INTEGER DEFAULT 0,\n  rupee_weakening INTEGER DEFAULT 0,\n  rape_cases INTEGER DEFAULT 0,\n  frauds INTEGER DEFAULT 0,\n  court_cases INTEGER DEFAULT 0'
);

db = db.replace(
  'photo_url TEXT',
  'photo_url TEXT,\n  crimes INTEGER DEFAULT 0,\n  controversies_count INTEGER DEFAULT 0,\n  rupee_weakening INTEGER DEFAULT 0,\n  rape_cases INTEGER DEFAULT 0,\n  frauds INTEGER DEFAULT 0,\n  court_cases INTEGER DEFAULT 0'
);

// Apply migration if table already exists. We'll just drop them in database.js seed for simplicity, 
// since this is a dev DB, but to be safe, I'll add ALTER TABLE statements to server.js on startup.

fs.writeFileSync('database.js', db);

// 2. Update server.js
let server = fs.readFileSync('server.js', 'utf8');

// Add ALTER TABLE logic right after DB connect
const alterLogic = `
const addCols = (table) => {
  ['crimes', 'controversies_count', 'rupee_weakening', 'rape_cases', 'frauds', 'court_cases'].forEach(col => {
    db.run(\`ALTER TABLE \${table} ADD COLUMN \${col} INTEGER DEFAULT 0\`, (err) => {
      // Ignore if column exists
    });
  });
};
addCols('Parties');
addCols('Candidates');
`;
server = server.replace("console.log('Connected to the SQLite database.');", "console.log('Connected to the SQLite database.');\n" + alterLogic);

// Parties POST
server = server.replace(
  'INSERT INTO Parties (name, acronym, manifesto, past_work, controversies, logo_url) VALUES (?,?,?,?,?,?)',
  'INSERT INTO Parties (name, acronym, manifesto, past_work, controversies, logo_url, crimes, controversies_count, rupee_weakening, rape_cases, frauds, court_cases) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
);
server = server.replace(
  '[data.name, data.acronym, data.manifesto, data.past_work, data.controversies, data.logo_url]',
  '[data.name, data.acronym, data.manifesto, data.past_work, data.controversies, data.logo_url, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0]'
);

// Parties PUT
server = server.replace(
  'UPDATE Parties SET name = ?, acronym = ?, manifesto = ?, past_work = ?, controversies = ?, logo_url = ? WHERE id = ?',
  'UPDATE Parties SET name = ?, acronym = ?, manifesto = ?, past_work = ?, controversies = ?, logo_url = ?, crimes = ?, controversies_count = ?, rupee_weakening = ?, rape_cases = ?, frauds = ?, court_cases = ? WHERE id = ?'
);
server = server.replace(
  '[data.name, data.acronym, data.manifesto, data.past_work, data.controversies, data.logo_url, req.params.id]',
  '[data.name, data.acronym, data.manifesto, data.past_work, data.controversies, data.logo_url, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, req.params.id]'
);

// Candidates POST
server = server.replace(
  'INSERT INTO Candidates (name, party_id, state, district, position, bio, wealth_estimation, past_work, photo_url) VALUES (?,?,?,?,?,?,?,?,?)',
  'INSERT INTO Candidates (name, party_id, state, district, position, bio, wealth_estimation, past_work, photo_url, crimes, controversies_count, rupee_weakening, rape_cases, frauds, court_cases) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
);
server = server.replace(
  '[data.name, data.party_id||null, data.state, data.district, data.position, data.bio, data.wealth_estimation, data.past_work, data.photo_url]',
  '[data.name, data.party_id||null, data.state, data.district, data.position, data.bio, data.wealth_estimation, data.past_work, data.photo_url, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0]'
);

// Candidates PUT
server = server.replace(
  'UPDATE Candidates SET name = ?, party_id = ?, state = ?, district = ?, position = ?, bio = ?, wealth_estimation = ?, past_work = ?, photo_url = ? WHERE id = ?',
  'UPDATE Candidates SET name = ?, party_id = ?, state = ?, district = ?, position = ?, bio = ?, wealth_estimation = ?, past_work = ?, photo_url = ?, crimes = ?, controversies_count = ?, rupee_weakening = ?, rape_cases = ?, frauds = ?, court_cases = ? WHERE id = ?'
);
server = server.replace(
  '[data.name, data.party_id||null, data.state, data.district, data.position, data.bio, data.wealth_estimation, data.past_work, data.photo_url, req.params.id]',
  '[data.name, data.party_id||null, data.state, data.district, data.position, data.bio, data.wealth_estimation, data.past_work, data.photo_url, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, req.params.id]'
);

fs.writeFileSync('server.js', server);
