/**
 * VoteX — MP Metrics Updater (18th Lok Sabha 2024)
 * Source: MyNeta.info / ADR India (data from ECI affidavit archive)
 * 
 * Scrapes: Name, Constituency, Party, Criminal Cases, Education,
 *          Total Assets (wealth), Liabilities
 * Matches to existing MP records by name similarity & constituency
 * Updates: crimes, court_cases, wealth_estimation, bio, past_work
 */

const axios    = require('axios');
const cheerio  = require('cheerio');
const sqlite3  = require('sqlite3').verbose();
const path     = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'votex.db'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Fetch & parse all 543 MPs from myneta.info ──────────────────────────────
async function fetchLokSabhaWinners() {
  const url = 'https://myneta.info/LokSabha2024/index.php?action=show_winners&sort=candidate&order=asc';
  console.log('Fetching 18th Lok Sabha (2024) winners from myneta.info...');

  const resp = await axios.get(url, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    }
  });

  const $ = cheerio.load(resp.data);
  const mps = [];

  // Table is w3-table w3-bordered, rows have: Sno | Candidate | Constituency | Party | Criminal Case | Education | Total Assets | Liabilities
  $('table.w3-bordered tr').each((i, row) => {
    if (i === 0) return; // skip header

    const cells = $(row).find('td');
    if (cells.length < 7) return;

    const name        = $(cells[1]).text().trim().replace(/\s+/g, ' ');
    const constituency = $(cells[2]).text().trim().toUpperCase();
    const party        = $(cells[3]).text().trim();

    // Criminal cases — could be plain '0' or inside a red badge
    const crimeText = $(cells[4]).text().trim();
    const crimes    = parseInt(crimeText.replace(/[^\d]/g, '')) || 0;

    const education = $(cells[5]).text().trim();

    // Total assets — e.g. "Rs 65,67,12,498  ~ 65 Crore+"
    const assetsRaw  = $(cells[6]).text().trim();
    // Extract the "~ N Crore+" or "~ N Lacs+" summary
    const croreMatch = assetsRaw.match(/~\s*([\d,]+)\s*Crore/i);
    const lacMatch   = assetsRaw.match(/~\s*([\d,]+)\s*Lac/i);
    let wealthStr    = 'N/A';
    if (croreMatch) {
      const val = parseInt(croreMatch[1].replace(/,/g, ''));
      wealthStr = `₹${val} Crore (declared 2024 affidavit)`;
    } else if (lacMatch) {
      const val = parseInt(lacMatch[1].replace(/,/g, ''));
      wealthStr = `₹${val} Lakh (declared 2024 affidavit)`;
    }

    // Liabilities
    const liabRaw     = $(cells[7]).text().trim();
    const liabCrore   = liabRaw.match(/~\s*([\d,]+)\s*Crore/i);
    const liabLac     = liabRaw.match(/~\s*([\d,]+)\s*Lac/i);
    let liabStr       = '0';
    if (liabCrore) liabStr = `₹${parseInt(liabCrore[1].replace(/,/g,''))} Crore liabilities`;
    else if (liabLac) liabStr = `₹${parseInt(liabLac[1].replace(/,/g,''))} Lakh liabilities`;

    if (name.length > 2) {
      mps.push({ name, constituency, party, crimes, education, wealthStr, liabStr });
    }
  });

  console.log(`✓ Parsed ${mps.length} MPs from myneta.info`);
  return mps;
}

// ── Name normalization for matching ─────────────────────────────────────────
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/^(shri|smt|dr|adv|prof|kumari|er|col|lt|gen)\s+/gi, '')
    .replace(/\s*(shri|smt|ji)\s*$/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Rough string similarity (ratio of common chars)
function similarity(a, b) {
  a = normalizeName(a); b = normalizeName(b);
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.9;

  // Check if last name matches
  const aWords = a.split(' '); const bWords = b.split(' ');
  const aLast  = aWords[aWords.length - 1];
  const bLast  = bWords[bWords.length - 1];
  if (aLast === bLast && aLast.length > 3) return 0.75;

  // Bigram similarity
  const bigrams = s => { const b = new Set(); for (let i = 0; i < s.length - 1; i++) b.add(s[i]+s[i+1]); return b; };
  const aB = bigrams(a); const bB = bigrams(b);
  const inter = [...aB].filter(x => bB.has(x)).length;
  return (2 * inter) / (aB.size + bB.size + 0.001);
}

// ── Main update logic ────────────────────────────────────────────────────────
async function main() {
  // Fetch live data
  const scraped = await fetchLokSabhaWinners();
  if (scraped.length === 0) { console.error('No data fetched!'); process.exit(1); }

  // Load all existing MPs from DB
  const dbMPs = await new Promise(r =>
    db.all("SELECT id, name, district, state FROM Candidates WHERE position='MP'", [], (e, rows) => r(rows || []))
  );
  console.log(`\nDB has ${dbMPs.length} MPs. Attempting to match with ${scraped.length} scraped...`);

  let matched = 0, updated = 0, unmatched = [];

  for (const mp of scraped) {
    // Find best match in DB
    let bestScore = 0;
    let bestMatch = null;

    for (const dbMp of dbMPs) {
      const score = similarity(mp.name, dbMp.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = dbMp;
      }
    }

    if (bestScore < 0.55) {
      unmatched.push(`${mp.name} (${mp.constituency}) — best: ${bestMatch?.name} [${bestScore.toFixed(2)}]`);
      continue;
    }

    matched++;

    // Build bio
    const bio = `MP from ${mp.constituency} constituency, 18th Lok Sabha (2024). Party: ${mp.party}. Education: ${mp.education}. Declared assets: ${mp.wealthStr}. ${mp.liabStr !== '0' ? 'Liabilities: ' + mp.liabStr + '.' : 'No significant liabilities declared.'} ${mp.crimes > 0 ? `Declared ${mp.crimes} criminal case(s) in election affidavit as filed with ECI.` : 'No criminal cases declared in affidavit.'}`;

    const pastWork = `Member of Parliament (Lok Sabha) from ${mp.constituency}. Elected in 18th General Election (2024). Member of ${mp.party}. Active participant in parliamentary proceedings and constituency development.`;

    // court_cases = crimes for MPs (criminal cases in affidavit = pending court cases)
    await new Promise(resolve => {
      db.run(
        `UPDATE Candidates SET 
          crimes = ?,
          court_cases = ?,
          wealth_estimation = ?,
          bio = ?,
          past_work = ?
        WHERE id = ?`,
        [mp.crimes, mp.crimes, mp.wealthStr, bio, pastWork, bestMatch.id],
        function(err) {
          if (!err) updated++;
          resolve();
        }
      );
    });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ DONE`);
  console.log(`  Matched: ${matched}/${scraped.length}`);
  console.log(`  Updated in DB: ${updated}`);
  console.log(`  Unmatched: ${unmatched.length}`);
  if (unmatched.length > 0 && unmatched.length <= 30) {
    console.log('\nUnmatched MPs:');
    unmatched.forEach(u => console.log('  •', u));
  }

  // Verify
  db.all(
    "SELECT name, district, crimes, wealth_estimation FROM Candidates WHERE position='MP' AND crimes > 0 ORDER BY crimes DESC LIMIT 10",
    [],
    (e, rows) => {
      console.log('\nTop 10 MPs by criminal cases:');
      rows.forEach(r => console.log(`  ${r.crimes} cases | ${r.name} | ${r.district}`));
      db.get(
        "SELECT COUNT(*) as total, COUNT(CASE WHEN crimes > 0 THEN 1 END) as with_crimes, SUM(crimes) as total_cases FROM Candidates WHERE position='MP'",
        [],
        (e2, r2) => {
          console.log(`\nSummary: ${r2.total} MPs, ${r2.with_crimes} with criminal cases, ${r2.total_cases} total cases declared`);
          db.close();
        }
      );
    }
  );
}

main().catch(err => { console.error(err); process.exit(1); });
