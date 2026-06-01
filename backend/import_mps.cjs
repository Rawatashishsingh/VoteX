const XLSX = require('xlsx');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'votex.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { console.error('DB error:', err.message); process.exit(1); }
  console.log('Connected to database.');
});

const wb = XLSX.readFile(path.join(__dirname, '..', 'Sitting Members.xlsx'));
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

console.log(`Found ${rows.length} MPs in xlsx.`);

db.all('SELECT id, name FROM Parties', [], (err, existingParties) => {
  if (err) { console.error(err); process.exit(1); }

  const partyMap = {};
  existingParties.forEach(p => { partyMap[p.name.toLowerCase()] = p.id; });

  const xlsxParties = [...new Set(rows.map(r => r['Party Name']))].filter(Boolean);
  const missingParties = xlsxParties.filter(p => !partyMap[p.toLowerCase()]);

  console.log(`Need to add ${missingParties.length} new parties...`);

  let partyDone = 0;
  if (missingParties.length === 0) {
    importCandidates(partyMap);
    return;
  }

  missingParties.forEach(pName => {
    const words = pName.split(/\s+/).filter(Boolean);
    const acronym = words.map(w => w[0]).join('').toUpperCase().substring(0, 6);
    db.run(
      'INSERT OR IGNORE INTO Parties (name, acronym, manifesto, past_work, controversies, logo_url) VALUES (?,?,?,?,?,?)',
      [pName, acronym, '', '', '', null],
      function(insertErr) {
        if (!insertErr && this.lastID) partyMap[pName.toLowerCase()] = this.lastID;
        partyDone++;
        if (partyDone === missingParties.length) {
          // Re-fetch all parties for updated IDs
          db.all('SELECT id, name FROM Parties', [], (e2, allParties) => {
            const finalMap = {};
            allParties.forEach(p => { finalMap[p.name.toLowerCase()] = p.id; });
            importCandidates(finalMap);
          });
        }
      }
    );
  });
});

function importCandidates(partyMap) {
  // Remove old imports first
  db.run("DELETE FROM Candidates WHERE bio LIKE '%Lok Sabha Terms%'", [], (delErr) => {
    console.log('Cleared old MP imports.');

    const rows_data = XLSX.utils.sheet_to_json(
      XLSX.readFile(path.join(__dirname, '..', 'Sitting Members.xlsx')).Sheets['Sheet1'],
      { defval: '' }
    );

    let inserted = 0, skipped = 0, done = 0;
    const total = rows_data.length;

    rows_data.forEach(row => {
      const name = (row['Name of Member'] || '').trim();
      const partyName = (row['Party Name'] || '').trim();
      const constituency = (row['Constituency '] || row['Constituency'] || '').trim();
      const state = (row['State'] || '').trim();
      const terms = (row['Lok Sabha Terms'] || '').toString().trim();

      if (!name || !state) {
        skipped++;
        done++;
        if (done === total) finish(inserted, skipped);
        return;
      }

      const partyId = partyMap[partyName.toLowerCase()] || null;
      const district = constituency || state;
      const bio = `Lok Sabha Terms: ${terms}. Constituency: ${constituency || 'N/A'}.`;
      const pastWork = `Member of Parliament from ${constituency}, ${state}. Lok Sabha Terms: ${terms}.`;

      // Use exact column names from schema
      db.run(
        `INSERT INTO Candidates 
         (name, party_id, state, district, position, bio, past_work, wealth_estimation, photo_url, is_current_ruler, crimes, controversies_count, rupee_weakening, rape_cases, frauds, court_cases) 
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [name, partyId, state, district, 'MP', bio, pastWork, 'N/A', null, 1, 0, 0, 0, 0, 0, 0],
        function(err) {
          if (err) {
            console.error('Insert error:', err.message, '| Row:', name);
            skipped++;
          } else {
            inserted++;
          }
          done++;
          if (done === total) finish(inserted, skipped);
        }
      );
    });
  });
}

function finish(inserted, skipped) {
  console.log(`\n✅ Import complete!`);
  console.log(`   ✓ Inserted: ${inserted} MPs`);
  console.log(`   ✗ Skipped:  ${skipped}`);
  console.log(`\nAll MPs marked as is_current_ruler=1 — visible in 'Current Rulers' section by state!`);
  db.close();
}
