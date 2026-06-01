const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');

const exactFixes = [
  { name: 'Birla, Shri Om', crimes: 0, wealth: '₹8 Crore (declared 2024 affidavit)' },
  { name: 'Malini, Smt. Hema', crimes: 0, wealth: '₹97 Crore (declared 2024 affidavit)' },
  { name: 'Agrawal, Shri Damodar', crimes: 3, wealth: '₹12 Crore (declared 2024 affidavit)' },
];

let idx = 0;
function next() {
  if (idx >= exactFixes.length) {
    db.get(
      "SELECT COUNT(*) as total, COUNT(CASE WHEN crimes > 0 THEN 1 END) as with_crimes, SUM(crimes) as total_cases FROM Candidates WHERE position='MP'",
      [], (e, r) => {
        console.log(`\n✅ Final: ${r.total} MPs | ${r.with_crimes} with criminal cases | ${r.total_cases} total cases declared`);
        db.close();
      }
    );
    return;
  }
  const f = exactFixes[idx++];
  const bio = `MP (18th Lok Sabha 2024). Declared assets: ${f.wealth}. ${f.crimes > 0 ? `Declared ${f.crimes} criminal case(s) in election affidavit.` : 'No criminal cases declared.'} Source: ADR/MyNeta.info (ECI affidavit archive).`;
  db.run(
    "UPDATE Candidates SET crimes=?, court_cases=?, wealth_estimation=?, bio=? WHERE position='MP' AND name=?",
    [f.crimes, f.crimes, f.wealth, bio, f.name],
    function(e) { console.log(`[${f.name}]: ${this.changes} rows`); next(); }
  );
}
next();
