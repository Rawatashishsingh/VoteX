const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');
db.all("SELECT state, COUNT(*) as n FROM Candidates WHERE position='MLA' GROUP BY state ORDER BY n DESC", [], (e, rows) => {
  console.log('MLAs by state:');
  rows.forEach(r => console.log(`  ${r.state}: ${r.n}`));
  db.get("SELECT COUNT(*) as total FROM Candidates WHERE position='MLA'", [], (e, r) => {
    console.log('\nTotal MLAs:', r.total);
    db.get("SELECT name, district, state, wealth_estimation, crimes FROM Candidates WHERE position='MLA' AND state='Uttar Pradesh' LIMIT 1", [], (e2, r2) => {
      console.log('\nSample UP MLA:', r2);
      db.close();
    });
  });
});
