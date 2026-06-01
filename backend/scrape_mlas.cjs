/**
 * VoteX - MLA Data Scraper & Importer
 * Source: MyNeta.info (ADR India) — data originates from ECI affidavit archive
 * Scrapes sitting MLA winners from the most recent state assembly elections
 */
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'votex.db'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// State elections on myneta.info — slug => { state name, election year }
const STATE_ELECTIONS = [
  { slug: 'UttarPradesh2022', state: 'Uttar Pradesh', seats: 403 },
  { slug: 'Maharashtra2024', state: 'Maharashtra', seats: 288 },
  { slug: 'WestBengal2021', state: 'West Bengal', seats: 294 },
  { slug: 'Bihar2020', state: 'Bihar', seats: 243 },
  { slug: 'MadhyaPradesh2023', state: 'Madhya Pradesh', seats: 230 },
  { slug: 'Rajasthan2023', state: 'Rajasthan', seats: 200 },
  { slug: 'Karnataka2023', state: 'Karnataka', seats: 224 },
  { slug: 'TamilNadu2021', state: 'Tamil Nadu', seats: 234 },
  { slug: 'AndhraPradesh2024', state: 'Andhra Pradesh', seats: 175 },
  { slug: 'Telangana2023', state: 'Telangana', seats: 119 },
  { slug: 'Gujarat2022', state: 'Gujarat', seats: 182 },
  { slug: 'Punjab2022', state: 'Punjab', seats: 117 },
  { slug: 'Haryana2024', state: 'Haryana', seats: 90 },
  { slug: 'Delhi2020', state: 'Delhi', seats: 70 },
  { slug: 'Odisha2024', state: 'Odisha', seats: 147 },
  { slug: 'Jharkhand2024', state: 'Jharkhand', seats: 81 },
  { slug: 'Chhattisgarh2023', state: 'Chhattisgarh', seats: 90 },
  { slug: 'Assam2021', state: 'Assam', seats: 126 },
  { slug: 'Kerala2021', state: 'Kerala', seats: 140 },
  { slug: 'HimachalPradesh2022', state: 'Himachal Pradesh', seats: 68 },
  { slug: 'Uttarakhand2022', state: 'Uttarakhand', seats: 70 },
  { slug: 'Goa2022', state: 'Goa', seats: 40 },
  { slug: 'Manipur2022', state: 'Manipur', seats: 60 },
  { slug: 'Meghalaya2023', state: 'Meghalaya', seats: 60 },
  { slug: 'Nagaland2023', state: 'Nagaland', seats: 60 },
  { slug: 'Tripura2023', state: 'Tripura', seats: 60 },
  { slug: 'Mizoram2023', state: 'Mizoram', seats: 40 },
  { slug: 'Sikkim2024', state: 'Sikkim', seats: 32 },
  { slug: 'ArunachalPradesh2024', state: 'Arunachal Pradesh', seats: 60 },
  { slug: 'JammuKashmir2024', state: 'Jammu and Kashmir', seats: 90 },
];

async function fetchMLAsForState(stateInfo) {
  const url = `https://myneta.info/${stateInfo.slug}/index.php?action=show_winners&sort=candidate&order=asc`;
  console.log(`  Fetching: ${url}`);
  
  try {
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const $ = cheerio.load(resp.data);
    const mlas = [];

    // myneta winners table has rows with candidate data
    $('table tr').each((i, row) => {
      if (i === 0) return; // skip header
      const cells = $(row).find('td');
      if (cells.length < 5) return;

      const name = $(cells[1]).text().trim();
      const constituency = $(cells[2]).text().trim();
      const party = $(cells[3]).text().trim();
      const totalAssets = $(cells[4]).text().trim();
      const criminalCases = parseInt($(cells[5]).text().trim()) || 0;

      if (name && name.length > 2 && party && party.length > 0) {
        mlas.push({
          name,
          constituency,
          party,
          totalAssets,
          criminalCases,
          state: stateInfo.state,
        });
      }
    });

    return mlas;
  } catch (err) {
    console.log(`  ⚠️ Failed ${stateInfo.state}: ${err.message}`);
    return [];
  }
}

async function getOrCreateParty(partyName, partyMap) {
  const key = partyName.toLowerCase().trim();
  if (partyMap[key]) return partyMap[key];

  return new Promise((resolve) => {
    db.run(
      'INSERT OR IGNORE INTO Parties (name, acronym, manifesto, past_work, controversies) VALUES (?,?,?,?,?)',
      [partyName, partyName.substring(0, 6).toUpperCase(), '', '', ''],
      function(err) {
        if (err || this.lastID === 0) {
          db.get('SELECT id FROM Parties WHERE name = ?', [partyName], (e, r) => {
            const id = r?.id || null;
            partyMap[key] = id;
            resolve(id);
          });
        } else {
          partyMap[key] = this.lastID;
          resolve(this.lastID);
        }
      }
    );
  });
}

async function insertMLA(mla, partyId) {
  return new Promise((resolve) => {
    const bio = `Sitting MLA of ${mla.state} Legislative Assembly. Constituency: ${mla.constituency}. Declared assets: ${mla.totalAssets || 'N/A'}.`;
    const pastWork = `Member of Legislative Assembly from ${mla.constituency}, ${mla.state}.`;

    db.run(
      `INSERT INTO Candidates (name, party_id, state, district, position, bio, past_work, wealth_estimation, crimes, is_current_ruler, controversies_count, frauds, court_cases, rupee_weakening, rape_cases, economic_downfall)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        mla.name, partyId, mla.state, mla.constituency,
        'MLA', bio, pastWork,
        mla.totalAssets || 'N/A',
        mla.criminalCases,
        1, // is_current_ruler
        0, 0, mla.criminalCases, 0, 0, 0
      ],
      function(err) {
        if (err && !err.message.includes('UNIQUE')) {
          // ignore duplicate errors
        }
        resolve();
      }
    );
  });
}

async function main() {
  console.log('🏛️ VoteX MLA Importer — Starting...\n');

  // Load existing parties
  const existingParties = await new Promise(r =>
    db.all('SELECT id, name FROM Parties', [], (e, rows) => r(rows || []))
  );
  const partyMap = {};
  existingParties.forEach(p => { partyMap[p.name.toLowerCase()] = p.id; });

  // Clear existing MLA data
  await new Promise(r => db.run("DELETE FROM Candidates WHERE position='MLA'", [], r));
  console.log('Cleared old MLA data.\n');

  let totalInserted = 0;
  let statesSuccess = 0;
  let statesFailed = [];

  for (const stateInfo of STATE_ELECTIONS) {
    process.stdout.write(`\n📍 ${stateInfo.state} (${stateInfo.seats} seats): `);
    
    const mlas = await fetchMLAsForState(stateInfo);

    if (mlas.length === 0) {
      console.log(`❌ No data fetched`);
      statesFailed.push(stateInfo.state);
      await sleep(500);
      continue;
    }

    console.log(`✓ Got ${mlas.length} MLAs`);
    statesSuccess++;

    for (const mla of mlas) {
      const partyId = await getOrCreateParty(mla.party, partyMap);
      await insertMLA(mla, partyId);
      totalInserted++;
    }

    await sleep(800); // be polite to the server
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ IMPORT COMPLETE`);
  console.log(`   States successful: ${statesSuccess}/${STATE_ELECTIONS.length}`);
  console.log(`   Total MLAs imported: ${totalInserted}`);
  if (statesFailed.length > 0) {
    console.log(`   Failed states: ${statesFailed.join(', ')}`);
    console.log(`   → Run fallback_mlas.cjs to add these from built-in data`);
  }

  // Verify
  db.get('SELECT COUNT(*) as c FROM Candidates WHERE position="MLA"', [], (e, r) => {
    console.log(`\n📊 Total MLAs in DB: ${r.c}`);
    db.all('SELECT state, COUNT(*) as n FROM Candidates WHERE position="MLA" GROUP BY state ORDER BY n DESC LIMIT 10', [], (e2, rows) => {
      console.log('\nTop 10 states by MLA count:');
      rows.forEach(r => console.log(`  ${r.state}: ${r.n}`));
      db.close();
    });
  });
}

main().catch(console.error);
