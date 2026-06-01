const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');

// Check distinct states for MPs
db.all("SELECT DISTINCT state, COUNT(*) as n FROM Candidates WHERE position='MP' AND is_current_ruler=1 GROUP BY state ORDER BY state", [], (e, rows) => {
  console.log('MP states in DB:');
  rows.forEach(r => console.log(`  "${r.state}": ${r.n}`));

  // Check sample MP from Delhi
  db.all("SELECT name, state, district, is_current_ruler FROM Candidates WHERE position='MP' AND state LIKE '%Delhi%' LIMIT 5", [], (e2, r2) => {
    console.log('\nDelhi MPs:');
    r2.forEach(r => console.log(`  ${r.name} | ${r.state} | ${r.district} | ruler=${r.is_current_ruler}`));

    // Check MetricsChart usage
    db.get("SELECT name, crimes, court_cases, rupee_weakening, rape_cases, frauds, economic_downfall, controversies_count FROM Candidates WHERE position='MP' LIMIT 1", [], (e3, r3) => {
      console.log('\nSample MP metrics:', JSON.stringify(r3, null, 2));
      db.close();
    });
  });
});
