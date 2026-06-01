const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Find the boundaries of RulingView
const start = code.indexOf('\nfunction RulingView()');
const end   = code.indexOf('\nfunction ContactView', start);

if (start === -1 || end === -1) {
  console.error('Could not find RulingView boundaries! start:', start, 'end:', end);
  process.exit(1);
}

const newCode = `
// ── Shared card + pagination (moved outside RulingView so they don't recreate) ─
const partyColors = {
  BJP: 'bg-orange-100 text-orange-800', INC: 'bg-blue-100 text-blue-800',
  AAP: 'bg-sky-100 text-sky-800', DMK: 'bg-red-100 text-red-800',
  TMC: 'bg-green-100 text-green-800', SP: 'bg-red-100 text-red-800',
  RJD: 'bg-yellow-100 text-yellow-800', CPM: 'bg-red-800 text-white',
  TDP: 'bg-yellow-100 text-yellow-800', JDU: 'bg-green-100 text-green-800',
  AITC: 'bg-green-100 text-green-800', CPI: 'bg-red-100 text-red-700',
  BSP: 'bg-blue-100 text-blue-900', NCP: 'bg-indigo-100 text-indigo-800',
};
const getPartyClass = (a) => partyColors[a] || 'bg-gray-100 text-gray-700';

function RepCard({ c, onSelect }) {
  return (
    <div onClick={() => onSelect(c)}
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
        <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${getPartyClass(c.party_acronym)}\`}>{c.party_acronym || 'IND'}</span>
        {c.crimes > 0 && <span className="text-xs text-red-500 font-bold">⚖️ {c.crimes} cases</span>}
      </div>
      {c.wealth_estimation && c.wealth_estimation !== 'N/A' && (
        <div className="text-xs text-gray-400 mt-2 font-medium truncate">💰 {c.wealth_estimation}</div>
      )}
    </div>
  );
}

function RepPagination({ list, page, setPage, perPage }) {
  const tp = Math.ceil(list.length / perPage);
  if (tp <= 1) return null;
  const pages = [];
  const s = Math.max(1, page - 4);
  const e = Math.min(tp, s + 9);
  for (let i = s; i <= e; i++) pages.push(i);
  const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
      <button onClick={() => go(Math.max(1, page-1))} disabled={page===1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-50">← Prev</button>
      {pages.map(p => (
        <button key={p} onClick={() => go(p)} className={\`w-9 h-9 rounded-lg text-sm font-bold \${p===page?'bg-black text-white':'border border-gray-300 hover:bg-gray-50'}\`}>{p}</button>
      ))}
      <button onClick={() => go(Math.min(tp, page+1))} disabled={page===tp} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-50">Next →</button>
    </div>
  );
}

function RepModal({ selected, onClose }) {
  if (!selected) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>

        {/* Header */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          {selected.photo_url
            ? <img src={selected.photo_url} className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-100" />
            : <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><User size={40} className="text-gray-400"/></div>
          }
          <div>
            <h3 className="text-2xl font-black">{selected.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {selected.party_logo && <img src={selected.party_logo} className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />}
              <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${getPartyClass(selected.party_acronym)}\`}>{selected.party_acronym || 'IND'}</span>
              <span className="font-bold text-gray-500 text-xs">{selected.party_name || 'Independent'}</span>
            </div>
            <div className="mt-1 text-xs text-gray-400 font-semibold">{selected.position} · {selected.district}, {selected.state}</div>
          </div>
        </div>

        {/* Data grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Constituency</div>
            <div className="font-semibold text-sm">{selected.district}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">State</div>
            <div className="font-semibold text-sm">{selected.state}</div>
          </div>
          <div className={\`p-3 rounded-xl border col-span-2 \${selected.crimes > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}\`}>
            <div className={\`text-xs font-bold uppercase mb-1 \${selected.crimes > 0 ? 'text-red-400' : 'text-gray-400'}\`}>⚖️ Criminal Cases (Self-Declared to ECI)</div>
            <div className={\`font-black text-lg \${selected.crimes > 0 ? 'text-red-600' : 'text-gray-500'}\`}>{selected.crimes || 0} Cases</div>
            <div className="text-xs text-gray-400 mt-0.5">Declared in election affidavit · Case ≠ conviction</div>
          </div>
          {selected.wealth_estimation && selected.wealth_estimation !== 'N/A' && (
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 col-span-2">
              <div className="text-xs font-bold text-gray-400 uppercase mb-1">💰 Declared Assets</div>
              <div className="font-semibold text-sm">{selected.wealth_estimation}</div>
            </div>
          )}
        </div>

        {/* Bio */}
        {selected.bio && (
          <div className="mb-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">About</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{selected.bio}</p>
          </div>
        )}
        {selected.past_work && (
          <div className="mb-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Record</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{selected.past_work}</p>
          </div>
        )}

        {/* Metrics */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Metrics</h4>
          <MetricsChart data={selected} color="#000000" />
        </div>
      </div>
    </div>
  );
}

function RulingView() {
  const PER_PAGE = 24;
  const [mode, setMode]         = useState('MP');
  const [selected, setSelected] = useState(null);

  // ── MP ─────────────────────────────────────────────────────────────────────
  const [mpStates, setMpStates]     = useState([]);
  const [mpState, setMpState]       = useState('');
  const [mpSearch, setMpSearch]     = useState('');
  const [mpAllData, setMpAllData]   = useState([]);
  const [mps, setMps]               = useState([]);
  const [mpLoading, setMpLoading]   = useState(false);
  const [mpPage, setMpPage]         = useState(1);
  const mpTimer                     = React.useRef(null);

  // ── MLA ────────────────────────────────────────────────────────────────────
  const [mlaStates, setMlaStates]   = useState([]);
  const [mlaState, setMlaState]     = useState('');
  const [mlaSearch, setMlaSearch]   = useState('');
  const [mlaAllData, setMlaAllData] = useState([]);
  const [mlas, setMlas]             = useState([]);
  const [mlaLoading, setMlaLoading] = useState(false);
  const [mlaPage, setMlaPage]       = useState(1);
  const mlaTimer                    = React.useRef(null);

  // Load state lists on mount
  useEffect(() => {
    fetch(\`\${API}/ruling-states\`).then(r => r.json()).then(setMpStates).catch(() => {});
    fetch(\`\${API}/mla-states\`).then(r => r.json()).then(setMlaStates).catch(() => {});
  }, []);

  // MP: load all when state changes
  useEffect(() => {
    setMpSearch(''); setMpPage(1);
    if (!mpState) { setMpAllData([]); setMps([]); return; }
    setMpLoading(true);
    fetch(\`\${API}/ruling?state=\${encodeURIComponent(mpState)}\`)
      .then(r => r.json())
      .then(d => { setMpAllData(Array.isArray(d) ? d : []); setMps(Array.isArray(d) ? d : []); setMpLoading(false); })
      .catch(() => { setMpLoading(false); });
  }, [mpState]);

  // MP: client-side filter
  useEffect(() => {
    setMpPage(1);
    if (!mpState) return;
    if (!mpSearch.trim()) { setMps(mpAllData); return; }
    const q = mpSearch.toLowerCase();
    setMps(mpAllData.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.party_name?.toLowerCase().includes(q) ||
      c.party_acronym?.toLowerCase().includes(q)
    ));
  }, [mpSearch, mpAllData, mpState]);

  const handleMpSearch = (val) => {
    setMpSearch(val);
    if (mpState) return;
    setMpPage(1);
    clearTimeout(mpTimer.current);
    if (!val.trim()) { setMps([]); return; }
    mpTimer.current = setTimeout(() => {
      setMpLoading(true);
      fetch(\`\${API}/ruling?search=\${encodeURIComponent(val)}\`)
        .then(r => r.json())
        .then(d => { setMps(Array.isArray(d) ? d : []); setMpLoading(false); })
        .catch(() => setMpLoading(false));
    }, 400);
  };

  // MLA: load all when state changes
  useEffect(() => {
    setMlaSearch(''); setMlaPage(1);
    if (!mlaState) { setMlaAllData([]); setMlas([]); return; }
    setMlaLoading(true);
    fetch(\`\${API}/mlas?state=\${encodeURIComponent(mlaState)}\`)
      .then(r => r.json())
      .then(d => { setMlaAllData(Array.isArray(d) ? d : []); setMlas(Array.isArray(d) ? d : []); setMlaLoading(false); })
      .catch(() => { setMlaLoading(false); });
  }, [mlaState]);

  // MLA: client-side filter
  useEffect(() => {
    setMlaPage(1);
    if (!mlaState) return;
    if (!mlaSearch.trim()) { setMlas(mlaAllData); return; }
    const q = mlaSearch.toLowerCase();
    setMlas(mlaAllData.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.party_name?.toLowerCase().includes(q) ||
      c.party_acronym?.toLowerCase().includes(q)
    ));
  }, [mlaSearch, mlaAllData, mlaState]);

  const handleMlaSearch = (val) => {
    setMlaSearch(val);
    if (mlaState) return;
    setMlaPage(1);
    clearTimeout(mlaTimer.current);
    if (!val.trim()) { setMlas([]); return; }
    mlaTimer.current = setTimeout(() => {
      setMlaLoading(true);
      fetch(\`\${API}/mlas?search=\${encodeURIComponent(val)}\`)
        .then(r => r.json())
        .then(d => { setMlas(Array.isArray(d) ? d : []); setMlaLoading(false); })
        .catch(() => setMlaLoading(false));
    }, 400);
  };

  // ── Shared filter bar ─────────────────────────────────────────────────────
  const FilterBar = ({ isMLA }) => {
    const states    = isMLA ? mlaStates   : mpStates;
    const curState  = isMLA ? mlaState    : mpState;
    const setCurSt  = isMLA ? setMlaState : setMpState;
    const curSearch = isMLA ? mlaSearch   : mpSearch;
    const handleSch = isMLA ? handleMlaSearch : handleMpSearch;
    const results   = isMLA ? mlas        : mps;
    const countKey  = isMLA ? 'mla_count' : 'mp_count';
    const label     = isMLA ? 'MLA' : 'MP';
    const placeholder = curState
      ? \`Filter within \${curState}...\`
      : isMLA ? 'e.g. Yogi, BJP, Gorakhpur...' : 'e.g. Modi, BJP, Varanasi...';

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select State</label>
            <select value={curState} onChange={e => setCurSt(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-black">
              <option value="">— All States —</option>
              {states.map(s => <option key={s.state} value={s.state}>{s.state} ({s[countKey]} {label}s)</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Search {label} / Party / Constituency
              {curState && curSearch && <span className="ml-2 font-normal text-gray-400 normal-case">{results.length} results</span>}
            </label>
            <div className="relative">
              <input type="text" value={curSearch} onChange={e => handleSch(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-black" />
              {curSearch
                ? <button onClick={() => handleSch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-lg leading-none">✕</button>
                : <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
              }
            </div>
          </div>
          {(curState || curSearch) && (
            <div className="flex items-end">
              <button onClick={() => { setCurSt(''); handleSch(''); }}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Clear All</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── State grid ────────────────────────────────────────────────────────────
  const StateGrid = ({ isMLA }) => {
    const states   = isMLA ? mlaStates   : mpStates;
    const setCurSt = isMLA ? setMlaState : setMpState;
    const countKey = isMLA ? 'mla_count' : 'mp_count';
    const label    = isMLA ? 'MLAs' : 'MPs';
    const total    = states.reduce((a, s) => a + (s[countKey] || 0), 0);
    return (
      <div>
        <h3 className="font-black text-lg mb-4 text-gray-700">
          Browse by State — {isMLA ? 'State Assembly MLAs' : '18th Lok Sabha MPs'}
          <span className="text-gray-400 font-normal ml-2 text-base">({total.toLocaleString()} {label})</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {states.map(s => (
            <button key={s.state} onClick={() => setCurSt(s.state)}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-black hover:shadow-md transition-all group">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-black">{s[countKey]} {label}</div>
              <div className="font-bold text-sm leading-snug">{s.state}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Results list ──────────────────────────────────────────────────────────
  const ResultsList = ({ isMLA }) => {
    const data      = isMLA ? mlas      : mps;
    const page      = isMLA ? mlaPage   : mpPage;
    const setPage   = isMLA ? setMlaPage : setMpPage;
    const loading   = isMLA ? mlaLoading : mpLoading;
    const curState  = isMLA ? mlaState  : mpState;
    const curSearch = isMLA ? mlaSearch : mpSearch;
    const label     = isMLA ? 'MLAs'   : 'MPs';

    const visible = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const title = curState
      ? \`\${label} — \${curState}\`
      : \`\${label} Search Results\`;

    if (loading) return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-gray-400 font-semibold">Loading {label}...</div>
      </div>
    );

    return (
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-black text-lg">
            {title}
            <span className="text-gray-400 font-normal ml-2 text-base">({data.length})</span>
          </h3>
          {Math.ceil(data.length / PER_PAGE) > 1 && (
            <div className="text-sm text-gray-500 font-semibold">
              Page {page} / {Math.ceil(data.length / PER_PAGE)}
            </div>
          )}
        </div>

        {data.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl text-gray-400">
            {curSearch ? \`No \${label} found for "\${curSearch}"\` : \`No \${label} found.\`}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map(c => <RepCard key={c.id} c={c} onSelect={setSelected} />)}
            </div>
            <RepPagination list={data} page={page} setPage={setPage} perPage={PER_PAGE} />
          </>
        )}
      </div>
    );
  };

  const isMLA       = mode === 'MLA';
  const curState    = isMLA ? mlaState  : mpState;
  const curSearch   = isMLA ? mlaSearch : mpSearch;
  const totalMP     = mpStates.reduce((a, s) => a + (s.mp_count || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight mb-2">Current Representatives</h2>
        <p className="text-gray-500">Find your MP or MLA — with wealth & criminal case data from ECI affidavit records (ADR/MyNeta).</p>
      </div>

      {/* MP / MLA Toggle */}
      <div className="flex bg-gray-100 rounded-2xl p-1.5 max-w-sm mx-auto">
        <button onClick={() => setMode('MP')}
          className={\`flex-1 py-2.5 rounded-xl font-black text-sm transition-all \${!isMLA ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}>
          🇮🇳 MPs <span className="font-normal text-xs">({totalMP})</span>
        </button>
        <button onClick={() => setMode('MLA')}
          className={\`flex-1 py-2.5 rounded-xl font-black text-sm transition-all \${isMLA ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}>
          🏛️ MLAs <span className="font-normal text-xs">(3,754)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar isMLA={isMLA} />

      {/* State grid (when nothing selected) */}
      {!curState && !curSearch && <StateGrid isMLA={isMLA} />}

      {/* Results (when state or search is active) */}
      {(curState || curSearch) && <ResultsList isMLA={isMLA} />}

      {/* Detail Modal */}
      <RepModal selected={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
`;

code = code.substring(0, start) + newCode + code.substring(end);
fs.writeFileSync(filePath, code, 'utf8');
console.log('✅ RulingView rewritten! File size:', code.length, 'bytes');
console.log('Lines:', code.split('\n').length);
