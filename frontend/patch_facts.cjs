const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// ── 1. Replace FactsView ─────────────────────────────────────────────────────
const factsStart = code.indexOf('\nfunction FactsView()');
const factsEnd = code.indexOf('\n// ── Results View', factsStart);

const newFactsView = `
function FactsView() {
  const [parties, setParties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(\`\${API}/parties\`).then(r => r.json()).then(data => {
      setParties(data);
      // Auto-select BJP as default
      const bjp = data.find(p => p.acronym === 'BJP');
      if (bjp) setSelected(bjp);
    });
  }, []);

  const hasData = (p) => p.manifesto || p.past_work || p.controversies || p.crimes > 0 || p.controversies_count > 0;
  const majorParties = parties.filter(hasData);
  const searchFiltered = search
    ? parties.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.acronym.toLowerCase().includes(search.toLowerCase()))
    : majorParties;

  const metricColor = (val, max) => {
    const pct = val / max;
    if (pct > 0.7) return 'bg-red-100 text-red-700 border-red-200';
    if (pct > 0.4) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-50 text-gray-700 border-gray-100';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">Political Dossier</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">Complete records of India's political parties — manifestos, former Prime Ministers, key achievements, controversies, crime metrics, court cases and economic data.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="sticky top-20">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search parties..."
              className="w-full mb-3 bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black" />
            <div className="flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {searchFiltered.map(p => (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={\`p-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 \${selected?.id === p.id ? 'bg-black text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'}\`}>
                  {p.logo_url
                    ? <img src={p.logo_url} className={\`w-7 h-7 object-contain rounded-full shrink-0 \${selected?.id === p.id ? 'bg-white p-0.5' : ''}\`} onError={e => e.target.style.display='none'} />
                    : <div className={\`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 \${selected?.id === p.id ? 'bg-white/20' : 'bg-gray-100'}\`}>{(p.acronym||'').substring(0,3)}</div>
                  }
                  <div className="min-w-0">
                    <div className="truncate">{p.name}</div>
                    <div className={\`text-xs \${selected?.id === p.id ? 'text-gray-300' : 'text-gray-400'}\`}>{p.acronym}</div>
                  </div>
                  {hasData(p) && <div className={\`ml-auto w-1.5 h-1.5 rounded-full shrink-0 \${selected?.id === p.id ? 'bg-green-300' : 'bg-green-500'}\`} title="Has data"/>}
                </button>
              ))}
              {searchFiltered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No parties found.</div>}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
                  {selected.logo_url
                    ? <img src={selected.logo_url} className="w-20 h-20 object-contain rounded-2xl border border-gray-100 bg-gray-50 p-1" onError={e => e.target.style.display='none'} />
                    : <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center font-black text-lg">{selected.acronym}</div>
                  }
                  <div>
                    <h3 className="text-2xl font-black leading-tight">{selected.name}</h3>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selected.acronym}</span>
                    {selected.former_pm && <div className="mt-2 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                      <Star size={11} className="inline mr-1 text-amber-500"/> PM(s): {selected.former_pm}
                    </div>}
                  </div>
                </div>

                {/* Metric badges */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-red-500"/>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Crime & Accountability Metrics</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Criminal Cases', val: selected.crimes || 0, max: 350, icon: '⚖️' },
                      { label: 'Major Frauds', val: selected.frauds || 0, max: 20, icon: '💰' },
                      { label: 'Active Court Cases', val: selected.court_cases || 0, max: 130, icon: '🏛️' },
                      { label: 'Controversies', val: selected.controversies_count || 0, max: 60, icon: '🔥' },
                      { label: 'Rupee Weakening', val: selected.rupee_weakening || 0, max: 100, icon: '📉', suffix: '/100' },
                      { label: 'Rape Cases Index', val: selected.rape_cases || 0, max: 100, icon: '⚠️', suffix: '/100' },
                      { label: 'Eco. Mismanagement', val: selected.economic_downfall || 0, max: 100, icon: '🏚️', suffix: '/100' },
                    ].map(m => (
                      <div key={m.label} className={\`border rounded-2xl p-4 text-center \${metricColor(m.val, m.max)}\`}>
                        <div className="text-lg mb-1">{m.icon}</div>
                        <div className="text-2xl font-black">{m.val}{m.suffix||''}</div>
                        <div className="text-xs font-bold mt-1 opacity-80">{m.label}</div>
                        {/* mini bar */}
                        <div className="w-full bg-white/60 rounded-full h-1.5 mt-2">
                          <div className="h-1.5 rounded-full bg-current opacity-50 transition-all" style={{width: \`\${Math.min(100,(m.val/m.max)*100)}%\`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart */}
              {(selected.crimes > 0 || selected.frauds > 0 || selected.controversies_count > 0) && (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                  <h4 className="font-black text-lg mb-5 flex items-center gap-2"><BarChart2 size={18}/> Metrics Comparison Chart</h4>
                  <MetricsChart data={selected} color="#ef4444" />
                  <p className="text-xs text-gray-400 mt-3 text-center">Data sourced from ADR India, NCRB, Election Commission & news archives</p>
                </div>
              )}

              {/* Text sections */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
                {selected.manifesto && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">📜</span>
                      Manifesto & Vision
                    </h4>
                    <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">{selected.manifesto}</p>
                  </div>
                )}
                {selected.past_work && (
                  <div className="pt-5 border-t border-gray-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs">✅</span>
                      Key Achievements & Past Work
                    </h4>
                    <ul className="space-y-2">
                      {selected.past_work.split(';').map((item, i) => item.trim() && (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                          <span className="text-green-500 mt-0.5 shrink-0">•</span>
                          {item.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.controversies && (
                  <div className="pt-5 border-t border-gray-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs">⚠️</span>
                      Controversies & Scandals
                    </h4>
                    <ul className="space-y-2">
                      {selected.controversies.split(';').map((item, i) => item.trim() && (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                          <span className="text-red-400 mt-0.5 shrink-0">•</span>
                          {item.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!selected.manifesto && !selected.past_work && !selected.controversies && (
                  <div className="text-center py-8 text-gray-400">
                    <BookOpen size={32} className="mx-auto mb-3 opacity-40"/>
                    <p className="font-semibold">No detailed information available yet for this party.</p>
                    <p className="text-sm mt-1">Admin can add information via the admin panel.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center text-gray-400 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 mb-6 rounded-full bg-gray-100 flex items-center justify-center"><BookOpen size={32}/></div>
              <p className="font-black text-lg">Select a party to view their complete dossier</p>
              <p className="text-sm mt-2">Green dot indicates parties with full data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

code = code.substring(0, factsStart) + newFactsView + code.substring(factsEnd);
fs.writeFileSync(filePath, code, 'utf8');
console.log('FactsView replaced! New size:', code.length);
