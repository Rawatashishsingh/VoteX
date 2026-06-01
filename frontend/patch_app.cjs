const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Fix jsPDF import
code = code.replace("import jsPDF from 'jspdf';", "import { jsPDF } from 'jspdf';");

// 2. AdminParties Logo URL
code = code.replace(
  "const [controversies, setControversies] = useState(p ? p.controversies : '');",
  "const [controversies, setControversies] = useState(p ? p.controversies : '');\n  const [logoUrl, setLogoUrl] = useState(p ? (p.logo_url||'') : '');"
);
code = code.replace(
  "acronym, manifesto, past_work: pastWork, controversies })",
  "acronym, manifesto, past_work: pastWork, controversies, logo_url: logoUrl })"
);
code = code.replace(
  '<div><label className="block text-sm font-semibold mb-1">Controversies</label><textarea value={controversies} onChange={e=>setControversies(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2"></textarea></div>',
  '<div><label className="block text-sm font-semibold mb-1">Controversies</label><textarea value={controversies} onChange={e=>setControversies(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2"></textarea></div>\n          <div><label className="block text-sm font-semibold mb-1">Logo URL</label><input type="text" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" placeholder="https://example.com/logo.png" /></div>'
);
code = code.replace(
  '<div className="text-xl font-black">{p.acronym}</div>',
  '{p.logo_url ? <img src={p.logo_url} alt={p.acronym} className="w-12 h-12 object-contain" /> : <div className="text-xl font-black">{p.acronym}</div>}'
);

// 3. AdminCandidates Photo URL
code = code.replace(
  "const [pastWork, setPastWork] = useState(c ? c.past_work : '');",
  "const [pastWork, setPastWork] = useState(c ? c.past_work : '');\n  const [photoUrl, setPhotoUrl] = useState(c ? (c.photo_url||'') : '');"
);
code = code.replace(
  "position, bio, wealth_estimation: wealth, past_work: pastWork })",
  "position, bio, wealth_estimation: wealth, past_work: pastWork, photo_url: photoUrl })"
);
code = code.replace(
  '<div><label className="block text-sm font-semibold mb-1">Past Work</label><textarea value={pastWork} onChange={e=>setPastWork(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2" required></textarea></div>',
  '<div><label className="block text-sm font-semibold mb-1">Past Work</label><textarea value={pastWork} onChange={e=>setPastWork(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2" required></textarea></div>\n          <div><label className="block text-sm font-semibold mb-1">Photo URL</label><input type="text" value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" placeholder="https://example.com/photo.png" /></div>'
);

// 4. PartyPoll UI
code = code.replace(
  '<div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center font-black text-xl mb-4 shadow-md">{p.acronym}</div>',
  '{p.logo_url ? <img src={p.logo_url} alt={p.name} className="w-16 h-16 rounded-full object-contain bg-gray-50 p-1 mb-4 shadow-md border border-gray-100" /> : <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center font-black text-xl mb-4 shadow-md">{p.acronym}</div>}'
);

// 5. CandidatePoll UI
// We want to add cand.photo_url and cand.party_logo.
code = code.replace(
  '<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><User size={24} className="text-gray-400"/></div>',
  '{cand.photo_url ? <img src={cand.photo_url} alt={cand.name} className="w-16 h-16 rounded-full object-cover mb-4 shadow-sm" /> : <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><User size={24} className="text-gray-400"/></div>}'
);
code = code.replace(
  '<div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{cand.party_name || \'Independent\'}</div>',
  '<div className="flex items-center gap-2 mb-1 justify-center">{cand.party_logo && <img src={cand.party_logo} alt={cand.party_name} className="w-4 h-4 object-contain" />}<div className="text-xs font-bold uppercase tracking-widest text-gray-500">{cand.party_name || \'Independent\'}</div></div>'
);

// 6. ResultsView
const resultsViewImpl = `
function ResultsView() {
  const [data, setData] = useState({ parties: [], candidates: [] });
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch(\`\${API}/locations\`).then(r => r.json()).then(setLocations);
    fetch(\`\${API}/results\`).then(r => r.json()).then(setData);
  }, []);

  const states = [...new Set(locations.map(l => l.state))].sort();
  const districts = [...new Set(locations.filter(l => l.state === state).map(l => l.district))].sort();

  const filteredCandidates = data.candidates.filter(c => c.state === state && c.district === district).sort((a,b) => b.total_votes - a.total_votes);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight mb-2">Live Election Results</h2>
        <p className="text-gray-500">Real-time vote counts across the nation.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-black mb-6">National Party Standings</h3>
        <div className="space-y-4">
          {data.parties.sort((a,b) => b.total_votes - a.total_votes).map(p => (
            <div key={p.id} className="flex items-center gap-4">
              {p.logo_url ? <img src={p.logo_url} className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs">{p.acronym}</div>}
              <div className="flex-1">
                <div className="flex justify-between mb-1"><span className="font-bold">{p.name}</span><span className="font-black">{p.total_votes} votes</span></div>
                <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-black h-3 rounded-full" style={{width: \`\${Math.min(100, (p.total_votes / Math.max(1, ...data.parties.map(x=>x.total_votes))) * 100)}%\`}}></div></div>
              </div>
            </div>
          ))}
          {data.parties.length === 0 && <p className="text-gray-400">No votes recorded yet.</p>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-black mb-6">Local Constituency Results</h3>
        <div className="flex gap-4 mb-8">
          <select value={state} onChange={e=>{setState(e.target.value);setDistrict('');}} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none font-semibold">
            <option value="">Select State</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={district} onChange={e=>setDistrict(e.target.value)} disabled={!state} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none font-semibold disabled:opacity-50">
            <option value="">Select District</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        
        {state && district ? (
          <div className="space-y-4">
            {filteredCandidates.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50">
                <div>
                  <div className="font-black text-lg">{c.name}</div>
                  <div className="text-sm font-bold text-gray-500 uppercase">{c.party_name || 'Independent'}</div>
                </div>
                <div className="text-2xl font-black">{c.total_votes}</div>
              </div>
            ))}
            {filteredCandidates.length === 0 && <p className="text-gray-400">No candidates found for this region.</p>}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10">Select a State and District to view local results.</div>
        )}
      </div>
    </div>
  );
}
`;
code = code.replace(
  /function ResultsView\(\) \{[\s\S]*?return \([\s\S]*?\);\n\}/,
  resultsViewImpl
);

// 7. FactsView
const factsViewImpl = `
function FactsView() {
  const [parties, setParties] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(\`\${API}/parties\`).then(r => r.json()).then(setParties);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black tracking-tight mb-2">Political Dossier</h2>
        <p className="text-gray-500">Know your parties before you vote. Read their manifestos and past controversies.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 flex flex-col gap-2">
          {parties.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} className={\`p-4 text-left rounded-2xl font-bold transition-all flex items-center gap-3 \${selected?.id === p.id ? 'bg-black text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'}\`}>
              {p.logo_url && <img src={p.logo_url} className="w-8 h-8 object-contain bg-white rounded-full p-0.5" />}
              {p.name}
            </button>
          ))}
        </div>
        <div className="w-full md:w-2/3">
          {selected ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                {selected.logo_url && <img src={selected.logo_url} className="w-16 h-16 object-contain" />}
                <div>
                  <h3 className="text-2xl font-black">{selected.name}</h3>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selected.acronym}</span>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Manifesto & Vision</h4>
                  <p className="text-gray-800 leading-relaxed font-medium">{selected.manifesto || 'No manifesto available.'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Key Past Work</h4>
                  <p className="text-gray-800 leading-relaxed font-medium">{selected.past_work || 'No records available.'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-2">Controversies</h4>
                  <p className="text-gray-800 leading-relaxed font-medium">{selected.controversies || 'No major controversies listed.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center"><BookOpen size={24} /></div>
              <p className="font-semibold">Select a party to view their complete dossier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
code = code.replace(
  /function FactsView\(\) \{[\s\S]*?return \([\s\S]*?\);\n\}/,
  factsViewImpl
);

fs.writeFileSync('src/App.jsx', code);
