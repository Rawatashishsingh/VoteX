const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');
db.all("SELECT name FROM Candidates WHERE name LIKE '%Lalu%' OR name LIKE '%Irani%' OR name LIKE '%Smriti%'", [], (e, r) => {
  console.log('Found:', r);
  db.all("SELECT name FROM Candidates WHERE name LIKE '%Prasad%'", [], (e2, r2) => {
    console.log('Prasad:', r2);
    db.all("PRAGMA table_info(Candidates)", [], (e3, r3) => {
      console.log('Columns:', r3.map(c => c.name));
      db.close();
    });
  });
});
