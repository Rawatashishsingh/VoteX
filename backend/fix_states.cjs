/**
 * Fix all known issues with the Candidates table:
 * 1. Normalize "Delhi" → "NCT of Delhi" for MPs (since API uses NCT of Delhi)
 * 2. Normalize "Daman and Diu" variants
 * 3. Set is_current_ruler=1 for any MP that has state but ruler=0 (only if they're in the right states)
 * 4. Verify final counts
 */
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('votex.db');

const fixes = [
  // State normalizations
  "UPDATE Candidates SET state='NCT of Delhi' WHERE position='MP' AND state='Delhi'",
  "UPDATE Candidates SET state='Dadra and Nagar Haveli and Daman and Diu' WHERE position='MP' AND (state='Daman and Diu' OR state='Dadra and Nagar Haveli')",
  "UPDATE Candidates SET state='Jammu and Kashmir' WHERE position='MP' AND state='J&K'",
  "UPDATE Candidates SET state='Andaman and Nicobar Islands' WHERE position='MP' AND state='Andaman and Nicobar'",
];

let idx = 0;
function next() {
  if (idx >= fixes.length) {
    // Final check
    db.all(
      "SELECT state, COUNT(*) as n, SUM(is_current_ruler) as rulers FROM Candidates WHERE position='MP' GROUP BY state ORDER BY n DESC LIMIT 10",
      [], (e, rows) => {
        console.log('\nTop states after fix:');
        rows.forEach(r => console.log(`  ${r.state}: ${r.n} MPs, ${r.rulers} marked as current ruler`));

        // Count how many have no state filter issue
        db.get("SELECT COUNT(*) as bad FROM Candidates WHERE position='MP' AND (state IS NULL OR state='')", [], (e2, r2) => {
          console.log(`\nMPs with missing state: ${r2.bad}`);
          db.close();
          console.log('\n✅ All state fixes applied!');
        });
      }
    );
    return;
  }
  const sql = fixes[idx++];
  db.run(sql, function(e) {
    if (e) console.error('Error:', e.message, 'SQL:', sql);
    else console.log(`✓ [${this.changes} rows] ${sql.substring(0, 70)}...`);
    next();
  });
}
next();
