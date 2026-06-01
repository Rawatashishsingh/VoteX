const fs = require('fs');

// 1. Fix Mojibake
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(/Y-\? National Party Poll/g, '🇮🇳 National Party Poll');
code = code.replace(/Y\' State & Local Candidates/g, '🏛️ State & Local Candidates');

// 2. Add Recharts components for RadarChart / BarChart
if (!code.includes('RadarChart')) {
  code = code.replace(
    /import { BarChart[\s\S]*?} from 'recharts';/,
    "import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';"
  );
}

// 3. Admin Parties & Candidates Inputs
const partyMetricsInputs = `
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold mb-1">Crimes</label><input type="number" value={crimes} onChange={e=>setCrimes(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" /></div>
            <div><label className="block text-sm font-semibold mb-1">Controversies Count</label><input type="number" value={controversiesCount} onChange={e=>setControversiesCount(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" /></div>
            <div><label className="block text-sm font-semibold mb-1">Rupee Weakening (%)</label><input type="number" value={rupeeWeakening} onChange={e=>setRupeeWeakening(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" /></div>
            <div><label className="block text-sm font-semibold mb-1">Rape Cases</label><input type="number" value={rapeCases} onChange={e=>setRapeCases(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" /></div>
            <div><label className="block text-sm font-semibold mb-1">Frauds</label><input type="number" value={frauds} onChange={e=>setFrauds(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" /></div>
            <div><label className="block text-sm font-semibold mb-1">Court Cases</label><input type="number" value={courtCases} onChange={e=>setCourtCases(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" /></div>
          </div>
`;

// Add state hooks for AdminParties
code = code.replace(
  "const [logoUrl, setLogoUrl] = useState(p ? (p.logo_url||'') : '');",
  "const [logoUrl, setLogoUrl] = useState(p ? (p.logo_url||'') : '');\n  const [crimes, setCrimes] = useState(p ? p.crimes : 0);\n  const [controversiesCount, setControversiesCount] = useState(p ? p.controversies_count : 0);\n  const [rupeeWeakening, setRupeeWeakening] = useState(p ? p.rupee_weakening : 0);\n  const [rapeCases, setRapeCases] = useState(p ? p.rape_cases : 0);\n  const [frauds, setFrauds] = useState(p ? p.frauds : 0);\n  const [courtCases, setCourtCases] = useState(p ? p.court_cases : 0);"
);
code = code.replace(
  "acronym, manifesto, past_work: pastWork, controversies, logo_url: logoUrl })",
  "acronym, manifesto, past_work: pastWork, controversies, logo_url: logoUrl, crimes, controversies_count: controversiesCount, rupee_weakening: rupeeWeakening, rape_cases: rapeCases, frauds, court_cases: courtCases })"
);
code = code.replace(
  /<div><label className="block text-sm font-semibold mb-1">Logo URL<\/label>[\s\S]*?<\/div>/,
  '$&\n' + partyMetricsInputs
);

// Add state hooks for AdminCandidates
code = code.replace(
  "const [photoUrl, setPhotoUrl] = useState(c ? (c.photo_url||'') : '');",
  "const [photoUrl, setPhotoUrl] = useState(c ? (c.photo_url||'') : '');\n  const [crimes, setCrimes] = useState(c ? c.crimes : 0);\n  const [controversiesCount, setControversiesCount] = useState(c ? c.controversies_count : 0);\n  const [rupeeWeakening, setRupeeWeakening] = useState(c ? c.rupee_weakening : 0);\n  const [rapeCases, setRapeCases] = useState(c ? c.rape_cases : 0);\n  const [frauds, setFrauds] = useState(c ? c.frauds : 0);\n  const [courtCases, setCourtCases] = useState(c ? c.court_cases : 0);"
);
code = code.replace(
  "position, bio, wealth_estimation: wealth, past_work: pastWork, photo_url: photoUrl })",
  "position, bio, wealth_estimation: wealth, past_work: pastWork, photo_url: photoUrl, crimes, controversies_count: controversiesCount, rupee_weakening: rupeeWeakening, rape_cases: rapeCases, frauds, court_cases: courtCases })"
);
code = code.replace(
  /<div><label className="block text-sm font-semibold mb-1">Photo URL<\/label>[\s\S]*?<\/div>/,
  '$&\n' + partyMetricsInputs
);

// 4. Update FactsView with RadarChart
const factsChartCode = `
                  <h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-2">Controversies</h4>
                  <p className="text-gray-800 leading-relaxed font-medium">{selected.controversies || 'No major controversies listed.'}</p>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Metrics & Allegations</h4>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Crimes', value: selected.crimes || 0 },
                        { name: 'Controversies', value: selected.controversies_count || 0 },
                        { name: 'Rupee Weakening', value: selected.rupee_weakening || 0 },
                        { name: 'Rape Cases', value: selected.rape_cases || 0 },
                        { name: 'Frauds', value: selected.frauds || 0 },
                        { name: 'Court Cases', value: selected.court_cases || 0 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
`;
code = code.replace(
  /<h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-2">Controversies<\/h4>[\s\S]*?<\/div>/,
  factsChartCode
);

// 5. Update CandidatePoll to have detailed view Modal
const candidateDetailModal = `
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedCandidate(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-6 mb-8">
              {selectedCandidate.photo_url ? <img src={selectedCandidate.photo_url} className="w-24 h-24 rounded-full object-cover shadow-sm" /> : <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200"><User size={40} className="text-gray-400"/></div>}
              <div>
                <h3 className="text-3xl font-black">{selectedCandidate.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {selectedCandidate.party_logo && <img src={selectedCandidate.party_logo} className="w-5 h-5 object-contain" />}
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">{selectedCandidate.party_name || 'Independent'}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Region</div>
                <div className="font-semibold">{selectedCandidate.district}, {selectedCandidate.state}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Position</div>
                <div className="font-semibold">{selectedCandidate.position}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Wealth</div>
                <div className="font-semibold">{selectedCandidate.wealth_estimation || 'Not Disclosed'}</div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Biography</h4>
                <p className="text-gray-800 leading-relaxed font-medium">{selectedCandidate.bio || 'No biography available.'}</p>
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Past Work</h4>
                <p className="text-gray-800 leading-relaxed font-medium">{selectedCandidate.past_work || 'No past work listed.'}</p>
              </div>
              
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Metrics & Allegations</h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Crimes', value: selectedCandidate.crimes || 0 },
                      { name: 'Controversies', value: selectedCandidate.controversies_count || 0 },
                      { name: 'Rupee Weak', value: selectedCandidate.rupee_weakening || 0 },
                      { name: 'Rape Cases', value: selectedCandidate.rape_cases || 0 },
                      { name: 'Frauds', value: selectedCandidate.frauds || 0 },
                      { name: 'Court Cases', value: selectedCandidate.court_cases || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 11, fill: '#666'}} axisLine={false} tickLine={false} interval={0} />
                      <YAxis tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="value" fill="#000000" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;

// Inject into CandidatePoll
code = code.replace(
  "const [voted, setVoted] = useState(null);",
  "const [voted, setVoted] = useState(null);\n  const [selectedCandidate, setSelectedCandidate] = useState(null);"
);
code = code.replace(
  "className={`border rounded-2xl p-5 flex flex-col transition-all hover:shadow-md ${voted === c.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}`}>",
  "className={`border rounded-2xl p-5 flex flex-col transition-all hover:shadow-md cursor-pointer ${voted === c.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}`} onClick={(e) => { if (e.target.tagName !== 'BUTTON') setSelectedCandidate(c); }}>"
);
code = code.replace(
  "        <div className=\"text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500\">Select a State and District to view candidates.</div>\n      )}\n    </div>",
  "        <div className=\"text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500\">Select a State and District to view candidates.</div>\n      )}\n" + candidateDetailModal + "\n    </div>"
);

fs.writeFileSync('src/App.jsx', code);

// 6. Update index.html for Google Translate
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('translate.google.com')) {
  html = html.replace(
    '</head>',
    '  <style>body { top: 0 !important; } .skiptranslate iframe { display: none !important; } .goog-te-banner-frame { display: none !important; }</style>\n  </head>'
  );
  html = html.replace(
    '</body>',
    '  <div id="google_translate_element" style="display:none;"></div>\n  <script type="text/javascript">\n    function googleTranslateElementInit() {\n      new google.translate.TranslateElement({pageLanguage: "en", autoDisplay: false}, "google_translate_element");\n    }\n  </script>\n  <script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>\n</body>'
  );
  fs.writeFileSync('index.html', html);
}
