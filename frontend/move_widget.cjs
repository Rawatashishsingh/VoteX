const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
c = c.replace('<div className="flex items-center gap-4">', '<div className="flex items-center gap-4">\n          <div id="google_translate_element" className="mr-4"></div>');
fs.writeFileSync('src/App.jsx', c);
