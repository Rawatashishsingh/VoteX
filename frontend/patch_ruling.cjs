const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let code = fs.readFileSync(filePath, 'utf8');

const startMarker = 'function RulingView() {';
const nextFuncMarker = '\nfunction ContactView()';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(nextFuncMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers!');
  process.exit(1);
}

const newRulingView = `function RulingView() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [search, setSearch] = useState('');
  const [ruling, setRuling] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRuler, setSelectedRuler] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;

  useEffect(() => {
    fetch(\`\${API}/ruling-states\`).then(r => r.json()).then(setStates);
  }, []);

  useEffect(() => {
    setPage(1);
    if (!selectedState && !search) { setRuling([]); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedState) params.append('state', selectedState);
    if (search) params.append('search', search);
    fetch(\`\${API}/ruling?\${params}\`).then(r => r.json()).then(d => { setRuling(d); setLoading(false); });
  }, [selectedState, search]);

  const paginated = ruling.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(ruling.length / PER_PAGE);

  const partyColors = { BJP: 'bg-orange-100 text-orange-800', INC: 'bg-blue-100 text-blue-800', AAP: 'bg-sky-100 text-sky-800', DMK: 'bg-red-100 text-red-800', TMC: 'bg-green-100 text-green-800', SP: 'bg-red-100 text-red-800' };
  const getPartyColor = (acronym) => partyColors[acronym] || 'bg-gray-100 text-gray-800';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black tracking-tight mb-2">Current Members of Parliament</h2>
        <p className="text-gray-500">All sitting MPs of the 18th Lok Sabha. Select a state to browse your representatives.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select State</label>
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-black">
              <option value="">All States</option>
              {states.map(s => (
                <option key={s.state} value={s.state}>{s.state} ({s.mp_count} MPs)</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Search MP / Party / Constituency</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="e.g. Modi, BJP, Varanasi..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black" />
          </div>
          {(selectedState || search) && (
            <div className="flex items-end">
              <button onClick={() => { setSelectedState(''); setSearch(''); setRuling([]); }}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {!selectedState && !search && (
        <div>
          <h3 className="font-black text-lg mb-4 text-gray-700">Browse by State</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {states.map(s => (
              <button key={s.state} onClick={() => setSelectedState(s.state)}
                className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-black hover:shadow-md transition-all group">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-black">{s.mp_count} MPs</div>
                <div className="font-bold text-sm leading-snug">{s.state}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {(selectedState || search) && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-black text-lg">
              {selectedState ? \`MPs from \${selectedState}\` : 'Search results'}
              <span className="text-gray-400 font-normal ml-2 text-base">({ruling.length} found)</span>
            </h3>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-semibold">Prev</button>
                <span className="font-semibold text-gray-500">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-semibold">Next</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading MPs...</div>
          ) : ruling.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl text-gray-400">No MPs found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map(c => (
                <div key={c.id} onClick={() => setSelectedRuler(c)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-black hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    {c.photo_url ? (
                      <img src={c.photo_url} className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all">
                        <User size={20}/>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm leading-snug">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{c.district}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.party_logo && <img src={c.party_logo} className="w-4 h-4 object-contain shrink-0" />}
                    <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${getPartyColor(c.party_acronym)}\`}>
                      {c.party_acronym || 'IND'}
                    </span>
                  </div>
                  {c.bio && c.bio.includes('Lok Sabha Terms:') && (
                    <div className="mt-2 text-xs text-gray-400 font-semibold">
                      Terms: {c.bio.match(/Lok Sabha Terms: ([^.]+)/)?.[1] || ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const p = page <= 5 ? i + 1 : page - 4 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}); }}
                    className={\`w-9 h-9 rounded-lg text-sm font-bold transition-all \${p === page ? 'bg-black text-white' : 'border border-gray-300 hover:bg-gray-50'}\`}>
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedRuler && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRuler(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedRuler(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
              {selectedRuler.photo_url ? (
                <img src={selectedRuler.photo_url} className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-100" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><User size={40} className="text-gray-400"/></div>
              )}
              <div>
                <h3 className="text-2xl font-black">{selectedRuler.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {selectedRuler.party_logo && <img src={selectedRuler.party_logo} className="w-5 h-5 object-contain" />}
                  <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${getPartyColor(selectedRuler.party_acronym)}\`}>{selectedRuler.party_acronym || 'IND'}</span>
                  <span className="font-bold text-gray-500 text-xs">{selectedRuler.party_name || 'Independent'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Constituency</div>
                <div className="font-semibold text-sm">{selectedRuler.district}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">State</div>
                <div className="font-semibold text-sm">{selectedRuler.state}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Lok Sabha Terms</div>
                <div className="font-semibold text-sm">{selectedRuler.bio?.match(/Lok Sabha Terms: ([^.]+)/)?.[1] || 'N/A'}</div>
              </div>
            </div>
            {selectedRuler.past_work && (
              <div className="mb-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Parliamentary Record</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{selectedRuler.past_work}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Metrics & Allegations</h4>
              <MetricsChart data={selectedRuler} color="#000000" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

code = code.substring(0, startIdx) + newRulingView + code.substring(endIdx);
fs.writeFileSync(filePath, code, 'utf8');
console.log('RulingView patched successfully!');
console.log('New code length:', code.length);
