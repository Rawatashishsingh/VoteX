const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');
if (!c.includes('/api/results')) {
  const injection = `
app.get('/api/results', (req, res) => {
  db.all('SELECT p.id, p.name, p.acronym, p.logo_url, COUNT(v.id) as total_votes FROM Parties p LEFT JOIN PartyVotes v ON p.id = v.party_id GROUP BY p.id', (err, partyRows) => {
    db.all('SELECT c.id, c.name, c.state, c.district, p.name as party_name, COUNT(v.id) as total_votes FROM Candidates c LEFT JOIN Parties p ON c.party_id = p.id LEFT JOIN CandidateVotes v ON c.id = v.candidate_id GROUP BY c.id', (err2, candidateRows) => {
      res.json({ parties: partyRows || [], candidates: candidateRows || [] });
    });
  });
});
`;
  c = c.replace("app.post('/api/inquiries'", injection + "\napp.post('/api/inquiries'");
  fs.writeFileSync('server.js', c);
}
