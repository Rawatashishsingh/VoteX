const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, initializeDB } = require('./database');

const app = express();
const PORT = 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

initializeDB();

// Add new columns if they don't exist (migration safe)
const migrate = () => {
  const cols = [
    'logo_url TEXT', 'crimes INTEGER DEFAULT 0', 'controversies_count INTEGER DEFAULT 0',
    'rupee_weakening INTEGER DEFAULT 0', 'rape_cases INTEGER DEFAULT 0',
    'frauds INTEGER DEFAULT 0', 'court_cases INTEGER DEFAULT 0',
    'economic_downfall INTEGER DEFAULT 0', 'former_pm TEXT'
  ];
  cols.forEach(c => {
    const col = c.split(' ')[0];
    db.run(`ALTER TABLE Parties ADD COLUMN ${c}`, () => {});
  });
  const candCols = [
    'photo_url TEXT', 'crimes INTEGER DEFAULT 0', 'controversies_count INTEGER DEFAULT 0',
    'rupee_weakening INTEGER DEFAULT 0', 'rape_cases INTEGER DEFAULT 0',
    'frauds INTEGER DEFAULT 0', 'court_cases INTEGER DEFAULT 0',
    'is_current_ruler INTEGER DEFAULT 0'
  ];
  candCols.forEach(c => {
    db.run(`ALTER TABLE Candidates ADD COLUMN ${c}`, () => {});
  });
};
setTimeout(migrate, 500);

// ── File Upload ──────────────────────────────────────────────────────────────
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  });
});

// ── Public Routes ──────────────────────────────────────────────────────────

app.get('/api/parties', (req, res) => {
  db.all(`SELECT p.*, (SELECT COUNT(*) FROM PartyVotes WHERE party_id = p.id) as vote_count FROM Parties p ORDER BY vote_count DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/locations', (req, res) => {
  db.all('SELECT DISTINCT state, district FROM Locations ORDER BY state, district', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/candidates', (req, res) => {
  const { state, district, position } = req.query;
  let query = `SELECT c.*, p.acronym as party_acronym, p.name as party_name, p.logo_url as party_logo
               FROM Candidates c LEFT JOIN Parties p ON c.party_id = p.id WHERE 1=1`;
  const params = [];
  if (state) { query += ' AND c.state = ?'; params.push(state); }
  if (district) { query += ' AND c.district = ?'; params.push(district); }
  if (position) { query += ' AND c.position = ?'; params.push(position); }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get all states that have ruling MPs
app.get('/api/ruling-states', (req, res) => {
  const { position } = req.query;
  const pos = position || 'MP';
  db.all(
    `SELECT c.state, COUNT(c.id) as mp_count FROM Candidates c WHERE c.is_current_ruler = 1 AND c.position = ? GROUP BY c.state ORDER BY c.state`,
    [pos],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Get all states that have MLAs
app.get('/api/mla-states', (req, res) => {
  db.all(
    `SELECT c.state, COUNT(c.id) as mla_count FROM Candidates c WHERE c.position = 'MLA' GROUP BY c.state ORDER BY c.state`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// MLAs by state and optional constituency search
app.get('/api/mlas', (req, res) => {
  const { state, search } = req.query;
  let query = `
    SELECT c.*, p.name as party_name, p.acronym as party_acronym, p.logo_url as party_logo
    FROM Candidates c LEFT JOIN Parties p ON c.party_id = p.id
    WHERE c.position = 'MLA'`;
  const params = [];
  if (state) { query += ' AND c.state = ?'; params.push(state); }
  if (search) { query += " AND (c.name LIKE ? OR c.district LIKE ? OR p.name LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY c.district, c.name';
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Ruling candidates (MPs) - supports ?state= and ?search= filters
app.get('/api/ruling', (req, res) => {
  const { state, search } = req.query;
  let query = `
    SELECT c.*, p.name as party_name, p.acronym as party_acronym, p.logo_url as party_logo,
      (SELECT COUNT(*) FROM CandidateVotes WHERE candidate_id = c.id) as vote_count
    FROM Candidates c
    LEFT JOIN Parties p ON c.party_id = p.id
    WHERE c.is_current_ruler = 1 AND c.position = 'MP'`;
  const params = [];
  if (state) { query += ' AND c.state = ?'; params.push(state); }
  if (search) { query += " AND (c.name LIKE ? OR c.district LIKE ? OR p.name LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY c.state, c.name';
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/vote/party', (req, res) => {
  const { party_id, voter_token, voter_name } = req.body;
  if (!party_id || !voter_token) return res.status(400).json({ error: 'Missing fields' });
  db.get('SELECT id FROM PartyVotes WHERE voter_token = ?', [voter_token], (err, row) => {
    if (row) return res.json({ success: false, error: 'You have already voted for a party.' });
    db.run('INSERT INTO PartyVotes (party_id, voter_token, voter_name) VALUES (?,?,?)', [party_id, voter_token, voter_name || 'Anonymous'], function(err) {
      res.json({ success: !err, error: err?.message });
    });
  });
});

app.post('/api/vote/candidate', (req, res) => {
  const { candidate_id, voter_token, voter_name } = req.body;
  if (!candidate_id || !voter_token) return res.status(400).json({ error: 'Missing fields' });
  db.get('SELECT id FROM CandidateVotes WHERE voter_token = ?', [voter_token], (err, row) => {
    if (row) return res.json({ success: false, error: 'You have already voted for a candidate.' });
    db.run('INSERT INTO CandidateVotes (candidate_id, voter_token, voter_name) VALUES (?,?,?)', [candidate_id, voter_token, voter_name || 'Anonymous'], function(err) {
      res.json({ success: !err, error: err?.message });
    });
  });
});

app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total_party_votes FROM PartyVotes', (err, pv) => {
    db.get('SELECT COUNT(*) as total_candidate_votes FROM CandidateVotes', (err2, cv) => {
      res.json({
        total_party_votes: pv?.total_party_votes || 0,
        total_candidate_votes: cv?.total_candidate_votes || 0,
      });
    });
  });
});

app.get('/api/results', (req, res) => {
  db.all('SELECT p.id, p.name, p.acronym, p.logo_url, COUNT(v.id) as total_votes FROM Parties p LEFT JOIN PartyVotes v ON p.id = v.party_id GROUP BY p.id', (err, partyRows) => {
    db.all('SELECT c.id, c.name, c.state, c.district, c.photo_url, p.name as party_name, p.logo_url as party_logo, COUNT(v.id) as total_votes FROM Candidates c LEFT JOIN Parties p ON c.party_id = p.id LEFT JOIN CandidateVotes v ON c.id = v.candidate_id GROUP BY c.id', (err2, candidateRows) => {
      res.json({ parties: partyRows || [], candidates: candidateRows || [] });
    });
  });
});

app.post('/api/inquiries', (req, res) => {
  const { name, contact_number, message } = req.body;
  if (!name || !contact_number) return res.status(400).json({ error: 'Name and contact number required' });
  db.run('INSERT INTO Inquiries (name, contact_number, message) VALUES (?,?,?)', [name, contact_number, message || ''], function(err) {
    res.json({ success: !err, error: err?.message });
  });
});

// ── Admin Auth & Middleware ──────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM Users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    res.json({ success: true, token: `VOTEX-${user.id}-${user.role}-${user.username}`, role: user.role, username: user.username });
  });
});

const adminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || !token.startsWith('VOTEX-')) return res.status(403).json({ error: 'Unauthorized' });
  const parts = token.split('-');
  req.user = { id: parts[1], role: parts[2], username: parts[3] };
  next();
};

const requireMainAdmin = (req, res, next) => {
  if (req.user.role !== 'MAIN_ADMIN') return res.status(403).json({ error: 'Requires MAIN_ADMIN role' });
  next();
};

// ── Admin Protected Routes ──────────────────────────────────────────────────

app.get('/api/admin/stats', adminAuth, (req, res) => {
  db.get('SELECT COUNT(*) as total FROM PartyVotes', (e1, pv) => {
    db.get('SELECT COUNT(*) as total FROM CandidateVotes', (e2, cv) => {
      db.get('SELECT COUNT(*) as total FROM Candidates', (e3, cands) => {
        db.get('SELECT COUNT(*) as total FROM Parties', (e4, parties) => {
          db.all(`SELECT p.name, p.acronym, COUNT(pv.id) as votes FROM Parties p LEFT JOIN PartyVotes pv ON p.id = pv.party_id GROUP BY p.id ORDER BY votes DESC LIMIT 5`, (e5, topParties) => {
            res.json({
              total_party_votes: pv?.total || 0,
              total_candidate_votes: cv?.total || 0,
              total_candidates: cands?.total || 0,
              total_parties: parties?.total || 0,
              top_parties: topParties || [],
            });
          });
        });
      });
    });
  });
});

// Manage Users (Main Admin Only)
app.get('/api/admin/users', adminAuth, requireMainAdmin, (req, res) => {
  db.all('SELECT id, username, role, created_at FROM Users', (err, rows) => res.json(rows));
});
app.post('/api/admin/users', adminAuth, requireMainAdmin, (req, res) => {
  const { username, password, role } = req.body;
  db.run('INSERT INTO Users (username, password, role) VALUES (?,?,?)', [username, password, role], function(err) {
    if (err) return res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Username taken' : err.message });
    res.json({ success: true });
  });
});
app.delete('/api/admin/users/:id', adminAuth, requireMainAdmin, (req, res) => {
  db.run('DELETE FROM Users WHERE id = ? AND role != "MAIN_ADMIN"', [req.params.id], err => res.json({ success: !err }));
});
app.put('/api/admin/users/:id/password', adminAuth, requireMainAdmin, (req, res) => {
  db.run('UPDATE Users SET password = ? WHERE id = ?', [req.body.password, req.params.id], err => res.json({ success: !err }));
});
app.put('/api/admin/password', adminAuth, (req, res) => {
  db.run('UPDATE Users SET password = ? WHERE id = ?', [req.body.password, req.user.id], err => res.json({ success: !err }));
});

// View Inquiries
app.get('/api/admin/inquiries', adminAuth, (req, res) => {
  if (req.user.role === 'OFFICE_STAFF') return res.status(403).json({ error: 'Access denied' });
  db.all('SELECT * FROM Inquiries ORDER BY timestamp DESC', (err, rows) => res.json(rows || []));
});

// Voters - MAIN_ADMIN sees names, others see [HIDDEN]
app.get('/api/admin/voters', adminAuth, (req, res) => {
  db.all(`SELECT pv.voter_token, pv.voter_name, p.name as party_name, p.acronym, pv.timestamp FROM PartyVotes pv LEFT JOIN Parties p ON pv.party_id = p.id ORDER BY pv.timestamp DESC`, (err, partyVoters) => {
    db.all(`SELECT cv.voter_token, cv.voter_name, c.name as candidate_name, c.position, c.state, c.district, cv.timestamp FROM CandidateVotes cv LEFT JOIN Candidates c ON cv.candidate_id = c.id ORDER BY cv.timestamp DESC`, (err2, candVoters) => {
      const isMain = req.user.role === 'MAIN_ADMIN';
      const pVoters = (partyVoters || []).map(v => ({...v, voter_name: isMain ? v.voter_name : '[HIDDEN]'}));
      const cVoters = (candVoters || []).map(v => ({...v, voter_name: isMain ? v.voter_name : '[HIDDEN]'}));
      res.json({ party_voters: pVoters, candidate_voters: cVoters, is_main_admin: isMain });
    });
  });
});

app.delete('/api/admin/voters/:token', adminAuth, requireMainAdmin, (req, res) => {
  db.run('DELETE FROM PartyVotes WHERE voter_token = ?', [req.params.token], () => {
    db.run('DELETE FROM CandidateVotes WHERE voter_token = ?', [req.params.token], err => res.json({ success: !err }));
  });
});

// Approval Requests
app.get('/api/admin/requests', adminAuth, requireMainAdmin, (req, res) => {
  db.all("SELECT * FROM ApprovalRequests WHERE status = 'PENDING' ORDER BY timestamp DESC", (err, rows) => res.json(rows || []));
});
app.post('/api/admin/requests/:id/approve', adminAuth, requireMainAdmin, (req, res) => {
  db.get('SELECT * FROM ApprovalRequests WHERE id = ?', [req.params.id], (err, reqData) => {
    if (!reqData || reqData.status !== 'PENDING') return res.status(400).json({ error: 'Invalid request' });
    const data = JSON.parse(reqData.new_data || '{}');
    const finish = (e) => {
      if(e) return res.status(500).json({ error: e.message });
      db.run("UPDATE ApprovalRequests SET status = 'APPROVED' WHERE id = ?", [reqData.id]);
      res.json({ success: true });
    };
    if (reqData.target_table === 'Candidates') {
      if (reqData.action_type === 'ADD') {
        db.run('INSERT INTO Candidates (name, party_id, state, district, position, bio, wealth_estimation, past_work, photo_url, crimes, controversies_count, rupee_weakening, rape_cases, frauds, court_cases, is_current_ruler) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [data.name, data.party_id||null, data.state, data.district, data.position, data.bio, data.wealth_estimation, data.past_work, data.photo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.is_current_ruler||0], finish);
      } else if (reqData.action_type === 'UPDATE') {
        db.run('UPDATE Candidates SET name=?,party_id=?,state=?,district=?,position=?,bio=?,wealth_estimation=?,past_work=?,photo_url=?,crimes=?,controversies_count=?,rupee_weakening=?,rape_cases=?,frauds=?,court_cases=?,is_current_ruler=? WHERE id=?',
          [data.name, data.party_id||null, data.state, data.district, data.position, data.bio, data.wealth_estimation, data.past_work, data.photo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.is_current_ruler||0, reqData.target_id], finish);
      } else if (reqData.action_type === 'DELETE') {
        db.run('DELETE FROM CandidateVotes WHERE candidate_id = ?', [reqData.target_id], () => {
          db.run('DELETE FROM Candidates WHERE id = ?', [reqData.target_id], finish);
        });
      }
    } else if (reqData.target_table === 'Parties') {
      if (reqData.action_type === 'ADD') {
        db.run('INSERT INTO Parties (name, acronym, manifesto, past_work, controversies, logo_url, crimes, controversies_count, rupee_weakening, rape_cases, frauds, court_cases, economic_downfall, former_pm) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [data.name, data.acronym, data.manifesto, data.past_work, data.controversies, data.logo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.economic_downfall||0, data.former_pm||''], finish);
      } else if (reqData.action_type === 'UPDATE') {
        db.run('UPDATE Parties SET name=?,acronym=?,manifesto=?,past_work=?,controversies=?,logo_url=?,crimes=?,controversies_count=?,rupee_weakening=?,rape_cases=?,frauds=?,court_cases=?,economic_downfall=?,former_pm=? WHERE id=?',
          [data.name, data.acronym, data.manifesto, data.past_work, data.controversies, data.logo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.economic_downfall||0, data.former_pm||'', reqData.target_id], finish);
      } else if (reqData.action_type === 'DELETE') {
        db.run('DELETE FROM Parties WHERE id = ?', [reqData.target_id], finish);
      }
    }
  });
});
app.post('/api/admin/requests/:id/reject', adminAuth, requireMainAdmin, (req, res) => {
  db.run("UPDATE ApprovalRequests SET status = 'REJECTED' WHERE id = ?", [req.params.id], err => res.json({ success: !err }));
});

// ── Candidate Admin Routes ──────────────────────────────────────────────────
app.get('/api/admin/candidates', adminAuth, (req, res) => {
  db.all(`SELECT c.*, p.name as party_name, p.acronym as party_acronym, p.logo_url as party_logo, (SELECT COUNT(*) FROM CandidateVotes WHERE candidate_id = c.id) as vote_count FROM Candidates c LEFT JOIN Parties p ON c.party_id = p.id ORDER BY c.state, c.district`, (err, rows) => res.json(rows || []));
});

app.post('/api/admin/candidates', adminAuth, (req, res) => {
  const data = req.body;
  if (req.user.role === 'OFFICE_STAFF') {
    db.run('INSERT INTO ApprovalRequests (action_type, target_table, target_id, new_data, requested_by) VALUES (?,?,?,?,?)',
      ['ADD', 'Candidates', null, JSON.stringify(data), req.user.username], err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Request sent to Main Admin for approval.' });
    });
  } else {
    db.run('INSERT INTO Candidates (name, party_id, state, district, position, bio, wealth_estimation, past_work, photo_url, crimes, controversies_count, rupee_weakening, rape_cases, frauds, court_cases, is_current_ruler) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [data.name, data.party_id||null, data.state, data.district, data.position, data.bio||'', data.wealth_estimation||'', data.past_work||'', data.photo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.is_current_ruler||0],
      err => res.json({ success: !err, message: err ? err.message : 'Candidate added successfully' }));
  }
});

app.put('/api/admin/candidates/:id', adminAuth, (req, res) => {
  const data = req.body;
  if (req.user.role === 'OFFICE_STAFF') {
    db.run('INSERT INTO ApprovalRequests (action_type, target_table, target_id, new_data, requested_by) VALUES (?,?,?,?,?)',
      ['UPDATE', 'Candidates', req.params.id, JSON.stringify(data), req.user.username], err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Update request sent to Main Admin for approval.' });
    });
  } else {
    db.run('UPDATE Candidates SET name=?,party_id=?,state=?,district=?,position=?,bio=?,wealth_estimation=?,past_work=?,photo_url=?,crimes=?,controversies_count=?,rupee_weakening=?,rape_cases=?,frauds=?,court_cases=?,is_current_ruler=? WHERE id=?',
      [data.name, data.party_id||null, data.state, data.district, data.position, data.bio||'', data.wealth_estimation||'', data.past_work||'', data.photo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.is_current_ruler||0, req.params.id],
      err => res.json({ success: !err, message: err ? err.message : 'Candidate updated successfully' }));
  }
});

app.delete('/api/admin/candidates/:id', adminAuth, requireMainAdmin, (req, res) => {
  db.run('DELETE FROM CandidateVotes WHERE candidate_id = ?', [req.params.id], () => {
    db.run('DELETE FROM Candidates WHERE id = ?', [req.params.id], err => res.json({ success: !err, message: err ? 'Error' : 'Deleted successfully' }));
  });
});

// ── Party Admin Routes ──────────────────────────────────────────────────────
app.post('/api/admin/parties', adminAuth, (req, res) => {
  const data = req.body;
  if (req.user.role === 'OFFICE_STAFF') {
    db.run('INSERT INTO ApprovalRequests (action_type, target_table, target_id, new_data, requested_by) VALUES (?,?,?,?,?)',
      ['ADD', 'Parties', null, JSON.stringify(data), req.user.username], err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Request sent to Main Admin for approval.' });
    });
  } else {
    db.run('INSERT INTO Parties (name, acronym, manifesto, past_work, controversies, logo_url, crimes, controversies_count, rupee_weakening, rape_cases, frauds, court_cases, economic_downfall, former_pm) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [data.name, data.acronym, data.manifesto||'', data.past_work||'', data.controversies||'', data.logo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.economic_downfall||0, data.former_pm||''],
      err => res.json({ success: !err, message: err ? err.message : 'Party added successfully' }));
  }
});

app.put('/api/admin/parties/:id', adminAuth, (req, res) => {
  const data = req.body;
  if (req.user.role === 'OFFICE_STAFF') {
    db.run('INSERT INTO ApprovalRequests (action_type, target_table, target_id, new_data, requested_by) VALUES (?,?,?,?,?)',
      ['UPDATE', 'Parties', req.params.id, JSON.stringify(data), req.user.username], err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Update request sent to Main Admin.' });
    });
  } else {
    db.run('UPDATE Parties SET name=?,acronym=?,manifesto=?,past_work=?,controversies=?,logo_url=?,crimes=?,controversies_count=?,rupee_weakening=?,rape_cases=?,frauds=?,court_cases=?,economic_downfall=?,former_pm=? WHERE id=?',
      [data.name, data.acronym, data.manifesto||'', data.past_work||'', data.controversies||'', data.logo_url||null, data.crimes||0, data.controversies_count||0, data.rupee_weakening||0, data.rape_cases||0, data.frauds||0, data.court_cases||0, data.economic_downfall||0, data.former_pm||'', req.params.id],
      err => res.json({ success: !err, message: err ? err.message : 'Party updated successfully' }));
  }
});

app.delete('/api/admin/parties/:id', adminAuth, requireMainAdmin, (req, res) => {
  db.run('DELETE FROM Parties WHERE id = ?', [req.params.id], err => res.json({ success: !err, message: err ? 'Error' : 'Deleted successfully' }));
});

app.listen(PORT, () => console.log(`VoteX Backend running on http://localhost:${PORT}`));
