const s = require('sqlite3').verbose();
const db = new s.Database('votex.db');
db.all(
  "SELECT name, district, state FROM Candidates WHERE position='MP' AND (name LIKE '%Patil%' OR name LIKE '%Hema%' OR name LIKE '%Birla%' OR name LIKE '%Pappu%' OR name LIKE '%Nurul%' OR name LIKE '%Ricky%' OR name LIKE '%Pradyut%' OR name LIKE '%Damodar%') LIMIT 20",
  [], (e, r) => {
    r.forEach(x => console.log(x.name, '|', x.district, '|', x.state));
    db.close();
  }
);
