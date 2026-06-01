/**
 * Enrich MLA records:
 * 1. Fix wealth_estimation to show proper ₹X Cr format
 * 2. Generate proper bio from existing fields
 * 3. Generate proper past_work from position/state/district
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'votex.db'));

db.all(
  "SELECT id, name, state, district, wealth_estimation, crimes, party_id FROM Candidates WHERE position='MLA'",
  [],
  (err, rows) => {
    if (err) { console.error(err); return; }
    console.log(`Enriching ${rows.length} MLA records...`);

    const batchSize = 50;
    let idx = 0;
    let updated = 0;

    function processBatch() {
      const batch = rows.slice(idx, idx + batchSize);
      if (batch.length === 0) {
        console.log(`\n✅ Done! Updated ${updated} MLAs`);
        db.close();
        return;
      }
      idx += batchSize;

      let done = 0;
      batch.forEach(mla => {
        // Fix wealth formatting
        let wealth = mla.wealth_estimation;
        if (wealth && !isNaN(parseFloat(wealth))) {
          const val = parseFloat(wealth);
          if (val >= 100) {
            wealth = `₹${val.toFixed(0)} Cr (declared in election affidavit)`;
          } else if (val > 0) {
            wealth = `₹${val.toFixed(2)} Cr (declared in election affidavit)`;
          } else {
            wealth = 'N/A';
          }
        }

        // Generate better bio
        const bio = `Sitting MLA of ${mla.state} Legislative Assembly from ${mla.district} constituency. Elected in the most recent state assembly election. ${mla.crimes > 0 ? `Declared ${mla.crimes} criminal case(s) in election affidavit as filed with ECI.` : 'No criminal cases declared in election affidavit.'} Declared assets: ${wealth || 'N/A'}.`;

        // Generate past_work
        const pastWork = `Member of the ${mla.state} Legislative Assembly, representing ${mla.district} constituency. Active participant in state legislature proceedings and local governance.`;

        db.run(
          "UPDATE Candidates SET wealth_estimation=?, bio=?, past_work=? WHERE id=?",
          [wealth, bio, pastWork, mla.id],
          function(e) {
            if (!e) updated++;
            done++;
            if (done === batch.length) {
              process.stdout.write(`\r  Processed: ${idx}/${rows.length}...`);
              processBatch();
            }
          }
        );
      });
    }

    processBatch();
  }
);
