const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');
db.get("SELECT name, crimes, controversies_count, economic_downfall, former_pm FROM Parties WHERE acronym='BJP'", [], (e, r) => {
  console.log('BJP:', JSON.stringify(r, null, 2));
  db.get("SELECT name, crimes, controversies_count, bio FROM Candidates WHERE name LIKE '%Modi%'", [], (e2, r2) => {
    console.log('\nModi candidate:', JSON.stringify(r2, null, 2));
    db.close();
  });
});
