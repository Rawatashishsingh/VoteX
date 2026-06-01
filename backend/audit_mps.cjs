const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');
db.get("SELECT name, state, district, crimes, wealth_estimation, bio FROM Candidates WHERE position='MP' LIMIT 1", [], (e, r) => {
  console.log('Sample MP:', JSON.stringify(r, null, 2));
  db.all("SELECT COUNT(*) as total, COUNT(CASE WHEN crimes > 0 THEN 1 END) as with_crimes, COUNT(CASE WHEN wealth_estimation IS NOT NULL AND wealth_estimation != '' THEN 1 END) as with_wealth FROM Candidates WHERE position='MP'", [], (e2, r2) => {
    console.log('MP stats:', r2);
    db.all("SELECT state, COUNT(*) as n FROM Candidates WHERE position='MP' GROUP BY state ORDER BY n DESC LIMIT 5", [], (e3, r3) => {
      console.log('Top states:', r3);
      db.close();
    });
  });
});
