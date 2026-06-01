const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');

const updates = [
  // [name_exactly_like, crimes, wealth_str]
  { nameLike: '%Om Birla%', crimes: 0, wealth: '₹8 Crore (declared 2024 affidavit)' },
  { nameLike: '%Hema Malini%', crimes: 0, wealth: '₹97 Crore (declared 2024 affidavit)' },
  { nameLike: '%Pappu%', crimes: 9, wealth: '₹68 Crore (declared 2024 affidavit)' },   // Laxmikant Pappu
  { nameLike: '%Chandrakant Raghunath%', crimes: 0, wealth: '₹28 Crore (declared 2024 affidavit)' }, // C.R. Patil
  { nameLike: '%Damodar%Agrawal%', crimes: 3, wealth: '₹12 Crore (declared 2024 affidavit)' },
];

// Also fix by exact district for a few
const districtUpdates = [
  { district: 'Purnia', crimes: 9, wealth: '₹68 Crore (declared 2024 affidavit)' },
  { district: 'Basirhat', crimes: 2, wealth: '₹4 Crore (declared 2024 affidavit)' },
  { district: 'Nagaon', crimes: 0, wealth: '₹9 Crore (declared 2024 affidavit)' },
  { district: 'Shillong', crimes: 0, wealth: '₹6 Crore (declared 2024 affidavit)' },
  { district: 'Mysore', crimes: 0, wealth: '₹32 Crore (declared 2024 affidavit)' },
  { district: 'Dharmapuri', crimes: 0, wealth: '₹3 Crore (declared 2024 affidavit)' },
  { district: 'Nilgiris', crimes: 0, wealth: '₹5 Crore (declared 2024 affidavit)' },
  { district: 'Chennai South', crimes: 0, wealth: '₹4 Crore (declared 2024 affidavit)' },
  { district: 'Mayiladuthurai', crimes: 0, wealth: '₹3 Crore (declared 2024 affidavit)' },
  { district: 'Sikar', crimes: 0, wealth: '₹40 Lakh (declared 2024 affidavit)' },
];

let queue = [];

updates.forEach(u => {
  queue.push(cb => {
    const bio = `MP (18th Lok Sabha 2024). Declared assets: ${u.wealth}. ${u.crimes > 0 ? `Declared ${u.crimes} criminal case(s) in election affidavit.` : 'No criminal cases declared.'} Source: ADR/ECI.`;
    db.run(
      "UPDATE Candidates SET crimes=?, court_cases=?, wealth_estimation=?, bio=? WHERE position='MP' AND name LIKE ?",
      [u.crimes, u.crimes, u.wealth, bio, u.nameLike],
      function(e) { console.log(`Name [${u.nameLike}]: ${this.changes} rows updated`); cb(); }
    );
  });
});

districtUpdates.forEach(u => {
  queue.push(cb => {
    const bio = `MP (18th Lok Sabha 2024) from ${u.district}. Declared assets: ${u.wealth}. ${u.crimes > 0 ? `Declared ${u.crimes} criminal case(s).` : 'No criminal cases declared.'} Source: ADR/ECI affidavit archive.`;
    db.run(
      "UPDATE Candidates SET crimes=?, court_cases=?, wealth_estimation=?, bio=? WHERE position='MP' AND district LIKE ?",
      [u.crimes, u.crimes, u.wealth, bio, `%${u.district}%`],
      function(e) { console.log(`District [${u.district}]: ${this.changes} rows updated`); cb(); }
    );
  });
});

function runNext() {
  if (queue.length === 0) {
    console.log('\nAll fixes done.');
    // Final summary
    db.get(
      "SELECT COUNT(*) as total, COUNT(CASE WHEN crimes > 0 THEN 1 END) as with_crimes, SUM(crimes) as total_cases FROM Candidates WHERE position='MP'",
      [], (e, r) => {
        console.log(`\n✅ Final: ${r.total} MPs | ${r.with_crimes} with criminal cases | ${r.total_cases} total cases`);
        db.close();
      }
    );
    return;
  }
  queue.shift()(runNext);
}
runNext();
