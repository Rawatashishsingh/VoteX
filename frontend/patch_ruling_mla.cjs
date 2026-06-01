const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let code = fs.readFileSync(filePath, 'utf8');

const start = code.indexOf('\nfunction RulingView()');
const end = code.indexOf('\nfunction ContactView', start);

if (start === -1 || end === -1) {
  console.error('Could not find RulingView boundaries!');
  process.exit(1);
}

const newRulingView = `
function RulingView() {
  const [mode, setMode] = useState('MP'); // 'MP' or 'MLA'

  // MP State
  const [mpStates, setMpStates] = useState([]);
  const [mpState, setMpState] = useState('');
  const [mpSearch, setMpSearch] = useState('');
  const [mps, setMps] = useState([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpPage, setMpPage] = useState(1);

  // MLA State
  const [mlaStates, setMlaStates] = useState([]);
  const [mlaState, setMlaState] = useState('');
  const [mlaSearch, setMlaSearch] = useState('');
  const [mlas, setMlas] = useState([]);
  const [mlaLoading, setMlaLoading] = useState(false);
  const [mlaPage, setMlaPage] = useState(1);

  // Selected for modal
  const [selected, setSelected] = useState(null);

  const PER_PAGE = 24;

  // Load MP states
  useEffect(() => {
    fetch(\`\${API}/ruling-states\`).then(r => r.json()).then(setMpStates).catch(() => {});
  }, []);

  // Load MLA states
  useEffect(() => {
    fetch(\`\${API}/mla-states\`).then(r => r.json()).then(setMlaStates).catch(() => {});
  }, []);

  // Fetch MPs when filter changes
  useEffect(() => {
    setMpPage(1);
    if (!mpState && !mpSearch) { setMps([]); return; }
    setMpLoading(true);
    const p = new URLSearchParams();
    if (mpState) p.append('state', mpState);
    if (mpSearch) p.append('search', mpSearch);
    fetch(\`\${API}/ruling?\${p}\`).then(r => r.json()).then(d => { setMps(d); setMpLoading(false); }).catch(() => setMpLoading(false));
  }, [mpState, mpSearch]);

  // Fetch MLAs when filter changes
  useEffect(() => {
    setMlaPage(1);
    if (!mlaState && !mlaSearch) { setMlas([]); return; }
    setMlaLoading(true);
    const p = new URLSearchParams();
    if (mlaState) p.append('state', mlaState);
    if (mlaSearch) p.append('search', mlaSearch);
    fetch(\`\${API}/mlas?\${p}\`).then(r => r.json()).then(d => { setMlas(d); setMlaLoading(false); }).catch(() => setMlaLoading(false));
  }, [mlaState, mlaSearch]);

  const partyColors = { BJP: 'bg-orange-100 text-orange-800', INC: 'bg-blue-100 text-blue-800', AAP: 'bg-sky-100 text-sky-800', DMK: 'bg-red-100 text-red-800', TMC: 'bg-green-100 text-green-800', SP: 'bg-red-100 text-red-800', RJD: 'bg-yellow-100 text-yellow-800', CPM: 'bg-red-800 text-white', TDP: 'bg-yellow-100 text-yellow-800', JDU: 'bg-green-100 text-green-800' };
  const getPC = (a) => partyColors[a] || 'bg-gray-100 text-gray-700';

  const paginateList = (list, page) => list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = (list) => Math.ceil(list.length / PER_PAGE);

  // Candidate card
  const CandidateCard = ({ c }) => (
    <div onClick={() => setSelected(c)}
      className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:border-black hover:shadow-md transition-all group">
      <div className="flex items-start gap-3 mb-3">
        {c.photo_url
          ? <img src={c.photo_url} className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0" />
          : <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all"><User size={18}/></div>
        }
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm leading-snug">{c.name}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{c.district}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {c.party_logo && <img src={c.party_logo} className="w-4 h-4 object-contain shrink-0" onError={e => e.target.style.display='none'} />}
        <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${getPC(c.party_acronym)}\`}>{c.party_acronym || 'IND'}</span>
        {c.crimes > 0 && <span className="text-xs text-red-500 font-bold">⚖️ {c.crimes} cases</span>}
      </div>
      {c.wealth_estimation && c.wealth_estimation !== 'N/A' && (
        <div className="text-xs text-gray-400 mt-2 font-medium truncate">💰 {c.wealth_estimation}</div>
      )}
    </div>
  );

  const Pagination = ({ list, page, setPage }) => {
    const tp = totalPages(list);
    if (tp <= 1) return null;
    const pages = [];
    const start = Math.max(1, page - 4);
    const end = Math.min(tp, start + 9);
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
        <button onClick={() => { setPage(p => Math.max(1,p-1)); window.scrollTo({top:0,behavior:'smooth'}); }} disabled={page===1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-50">← Prev</button>
        {pages.map(p => (
          <button key={p} onClick={() => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}); }}
            className={\`w-9 h-9 rounded-lg text-sm font-bold \${p===page?'bg-black text-white':'border border-gray-300 hover:bg-gray-50'}\`}>{p}</button>
        ))}
        <button onClick={() => { setPage(p => Math.min(tp,p+1)); window.scrollTo({top:0,behavior:'smooth'}); }} disabled={page===tp} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-50">Next →</button>
      </div>
    );
  };

  // ── MP VIEW ──────────────────────────────────────────────────────────────────
  const MPView = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select State</label>
            <select value={mpState} onChange={e => setMpState(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-black">
              <option value="">— All States —</option>
              {mpStates.map(s => <option key={s.state} value={s.state}>{s.state} ({s.mp_count} MPs)</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Search MP / Party / Constituency</label>
            <input type="text" value={mpSearch} onChange={e => setMpSearch(e.target.value)}
              placeholder="e.g. Modi, BJP, Varanasi..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black" />
          </div>
          {(mpState || mpSearch) && (
            <div className="flex items-end">
              <button onClick={() => { setMpState(''); setMpSearch(''); setMps([]); }} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Clear</button>
            </div>
          )}
        </div>
      </div>

      {!mpState && !mpSearch && (
        <div>
          <h3 className="font-black text-lg mb-4 text-gray-700">Browse by State — 18th Lok Sabha MPs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {mpStates.map(s => (
              <button key={s.state} onClick={() => setMpState(s.state)}
                className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-black hover:shadow-md transition-all group">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-black">{s.mp_count} MPs</div>
                <div className="font-bold text-sm leading-snug">{s.state}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {(mpState || mpSearch) && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-black text-lg">
              {mpState ? \`MPs — \${mpState}\` : 'MP Search Results'}
              <span className="text-gray-400 font-normal ml-2 text-base">({mps.length})</span>
            </h3>
            {totalPages(mps) > 1 && (
              <div className="text-sm text-gray-500 font-semibold">Page {mpPage}/{totalPages(mps)}</div>
            )}
          </div>
          {mpLoading ? <div className="text-center py-20 text-gray-400">Loading MPs...</div>
          : mps.length === 0 ? <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl text-gray-400">No MPs found.</div>
          : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginateList(mps, mpPage).map(c => <CandidateCard key={c.id} c={c} />)}
              </div>
              <Pagination list={mps} page={mpPage} setPage={setMpPage} />
            </>
          )}
        </div>
      )}
    </div>
  );

  // ── MLA VIEW ─────────────────────────────────────────────────────────────────
  const MLAView = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select State</label>
            <select value={mlaState} onChange={e => setMlaState(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-black">
              <option value="">— All States —</option>
              {mlaStates.map(s => <option key={s.state} value={s.state}>{s.state} ({s.mla_count} MLAs)</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Search MLA / Party / Constituency</label>
            <input type="text" value={mlaSearch} onChange={e => setMlaSearch(e.target.value)}
              placeholder="e.g. Yogi, BJP, Gorakhpur..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black" />
          </div>
          {(mlaState || mlaSearch) && (
            <div className="flex items-end">
              <button onClick={() => { setMlaState(''); setMlaSearch(''); setMlas([]); }} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Clear</button>
            </div>
          )}
        </div>
      </div>

      {!mlaState && !mlaSearch && (
        <div>
          <h3 className="font-black text-lg mb-4 text-gray-700">Browse by State — State Assembly MLAs (3,754 Total)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {mlaStates.map(s => (
              <button key={s.state} onClick={() => setMlaState(s.state)}
                className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-black hover:shadow-md transition-all group">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-black">{s.mla_count} MLAs</div>
                <div className="font-bold text-sm leading-snug">{s.state}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {(mlaState || mlaSearch) && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-black text-lg">
              {mlaState ? \`MLAs — \${mlaState}\` : 'MLA Search Results'}
              <span className="text-gray-400 font-normal ml-2 text-base">({mlas.length})</span>
            </h3>
            {totalPages(mlas) > 1 && (
              <div className="text-sm text-gray-500 font-semibold">Page {mlaPage}/{totalPages(mlas)}</div>
            )}
          </div>
          {mlaLoading ? <div className="text-center py-20 text-gray-400">Loading MLAs...</div>
          : mlas.length === 0 ? <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl text-gray-400">No MLAs found.</div>
          : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginateList(mlas, mlaPage).map(c => <CandidateCard key={c.id} c={c} />)}
              </div>
              <Pagination list={mlas} page={mlaPage} setPage={setMlaPage} />
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header + Toggle */}
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight mb-2">Current Representatives</h2>
        <p className="text-gray-500">Find your elected representative — MPs (Lok Sabha) and MLAs (State Assembly) — with full data from ADR/ECI affidavit records.</p>
      </div>

      <div className="flex bg-gray-100 rounded-2xl p-1.5 max-w-sm mx-auto">
        <button onClick={() => setMode('MP')}
          className={\`flex-1 py-2.5 rounded-xl font-black text-sm transition-all \${mode==='MP' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}>
          🇮🇳 MPs — Lok Sabha <span className="font-normal text-xs">({mpStates.reduce((a,s)=>a+s.mp_count,0)})</span>
        </button>
        <button onClick={() => setMode('MLA')}
          className={\`flex-1 py-2.5 rounded-xl font-black text-sm transition-all \${mode==='MLA' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}>
          🏛️ MLAs — State Assembly <span className="font-normal text-xs">(3,754)</span>
        </button>
      </div>

      {mode === 'MP' ? <MPView /> : <MLAView />}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
              {selected.photo_url
                ? <img src={selected.photo_url} className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-100" />
                : <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><User size={40} className="text-gray-400"/></div>
              }
              <div>
                <h3 className="text-2xl font-black">{selected.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {selected.party_logo && <img src={selected.party_logo} className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />}
                  <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${getPC(selected.party_acronym)}\`}>{selected.party_acronym || 'IND'}</span>
                  <span className="font-bold text-gray-500 text-xs">{selected.party_name || 'Independent'}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400 font-semibold">{selected.position} · {selected.district}, {selected.state}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Constituency</div>
                <div className="font-semibold text-sm">{selected.district}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">State</div>
                <div className="font-semibold text-sm">{selected.state}</div>
              </div>
              {selected.wealth_estimation && selected.wealth_estimation !== 'N/A' && (
                <div className="bg-green-50 p-3 rounded-xl border border-green-100 col-span-2">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Declared Assets</div>
                  <div className="font-semibold text-sm">{selected.wealth_estimation}</div>
                </div>
              )}
              {selected.crimes > 0 && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 col-span-2">
                  <div className="text-xs font-bold text-red-400 uppercase mb-1">⚖️ Criminal Cases Declared</div>
                  <div className="font-black text-red-600 text-lg">{selected.crimes} Cases</div>
                  <div className="text-xs text-gray-500 mt-1">As declared in election affidavit (self-sworn to ECI). Case ≠ conviction.</div>
                </div>
              )}
            </div>

            {selected.bio && (
              <div className="mb-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">About</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{selected.bio}</p>
              </div>
            )}
            {selected.past_work && (
              <div className="mb-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Parliamentary Record</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{selected.past_work}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Metrics</h4>
              <MetricsChart data={selected} color="#000000" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

code = code.substring(0, start) + newRulingView + code.substring(end);
fs.writeFileSync(filePath, code, 'utf8');
console.log('RulingView with MP/MLA tabs patched! Size:', code.length);
