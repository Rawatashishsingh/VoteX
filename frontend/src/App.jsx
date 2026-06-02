import { useState, useEffect, useRef } from 'react';
import { User, CheckCircle2, TrendingUp, Filter, MapPin, Building, Activity, FileText, ArrowLeft, Shield, Trash2, Plus, Eye, EyeOff, BarChart2, MessageSquare, Clock, Users as UsersIcon, Settings, Download, BookOpen, Edit2, X, Upload, Star, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'https://votex-backend-u00f.onrender.com/api';


// ── Helpers ──────────────────────────────────────────────────────────────────
function VoteXLogo({ size = 'md' }) {
  const s = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl', xl: 'text-8xl' };
  return (
    <span className={`${s[size]} font-black tracking-tighter leading-none select-none`}>
      <span className="text-black">Vote</span><span className="text-[#ef3446]">X</span>
    </span>
  );
}

// Image upload helper - tries file upload, falls back to URL
function ImageUpload({ value, onChange, label, placeholder }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API.replace('/api','')}/api/upload`, { method: 'POST', body: fd });
      const d = await res.json();
      if (d.url) onChange(d.url);
    } catch (err) { alert('Upload failed. Please use a URL instead.'); }
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none text-sm"
          placeholder={placeholder || 'https://... or upload →'} />
        <button type="button" onClick={() => fileRef.current.click()}
          className="flex items-center gap-1 px-3 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shrink-0">
          {uploading ? '...' : <><Upload size={14}/> Upload</>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && <img src={value} className="mt-2 h-16 w-16 object-contain rounded-lg border border-gray-200" onError={e => e.target.style.display='none'} />}
    </div>
  );
}

// Metrics chart
function MetricsChart({ data, color = '#ef4444' }) {
  const chartData = [
    { name: 'Crimes', value: data.crimes || 0 },
    { name: 'Controversies', value: data.controversies_count || 0 },
    { name: 'Rupee Weak', value: data.rupee_weakening || 0 },
    { name: 'Rape Cases', value: data.rape_cases || 0 },
    { name: 'Frauds', value: data.frauds || 0 },
    { name: 'Court Cases', value: data.court_cases || 0 },
    { name: 'Eco. Downfall', value: data.economic_downfall || 0 },
  ].filter(d => d.value > 0);

  if (chartData.length === 0) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
      <AlertTriangle size={16}/> No metrics data added yet. Admin can update this.
    </div>
  );

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 12 }} cursor={{ fill: '#f8f8f8' }} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('home');
  const [voterId, setVoterId] = useState('');
  const [voterName, setVoterName] = useState('');
  const [authed, setAuthed] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const [adminUsername, setAdminUsername] = useState(null);
  const [adminClick, setAdminClick] = useState(0);

  const handleFooterClick = () => {
    const next = adminClick + 1;
    setAdminClick(next);
    if (next >= 5) { setShowAdmin(true); setAdminClick(0); }
  };

  if (showAdmin && !adminToken) return <AdminLogin onLogin={(token, role, username) => { setAdminToken(token); setAdminRole(role); setAdminUsername(username); }} onClose={() => setShowAdmin(false)} />;
  if (showAdmin && adminToken) return <AdminPanel adminToken={adminToken} adminRole={adminRole} adminUsername={adminUsername} onClose={() => { setShowAdmin(false); setAdminToken(null); setAdminRole(null); setAdminUsername(null); }} />;

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="cursor-pointer" onClick={() => setTab('home')}><VoteXLogo size="md" /></div>
          {authed && (
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {['home', ...(hasVoted ? [] : ['parties', 'candidates']), 'facts', 'results', 'ruling', 'contact'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-2 rounded-md text-sm font-semibold capitalize whitespace-nowrap transition-all ${tab === t ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}>
                  {t === 'ruling' ? 'Current Rulers' : t}
                </button>
              ))}
            </div>
          )}
          <div id="google_translate_element" className="shrink-0"></div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {!authed ? (
          <div className="relative flex justify-center items-center min-h-[75vh] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06]">
              <span className="font-black tracking-tighter text-black leading-none" style={{fontSize:'18vw'}}>Vote</span>
              <span className="font-black tracking-tighter text-[#ef3446] leading-none" style={{fontSize:'18vw'}}>X</span>
            </div>
            <div className="max-w-md w-full z-10 bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-3xl p-10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.2)]">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-3xl font-bold">Welcome to</h2>
                  <VoteXLogo size="lg" />
                </div>
                <p className="text-gray-500 text-sm">Enter your Voter ID to access the polls</p>
              </div>
              <form onSubmit={e => {
                e.preventDefault();
                if (!/^[A-Z]{3}[0-9]{7}$/.test(voterId)) {
                  setLoginError('Invalid Voter ID format. Must be 3 uppercase letters followed by 7 digits (e.g. ABC1234567).');
                  return;
                }
                setLoginError('');
                setAuthed(true);
              }} className="space-y-5">
                {loginError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{loginError}</div>}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input value={voterName} onChange={e => setVoterName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:ring-2 focus:ring-black outline-none"
                    placeholder="Enter your full name" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Voter ID Number (EPIC)</label>
                  <input value={voterId} onChange={e => setVoterId(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:ring-2 focus:ring-black outline-none uppercase"
                    placeholder="ABC1234567" required />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-800 transition-all shadow-lg">
                  Access Voting Platform →
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div>
            {tab === 'home' && <HomeView setTab={setTab} hasVoted={hasVoted} />}
            {tab === 'parties' && !hasVoted && <PartyPoll voterId={voterId} voterName={voterName} setHasVoted={setHasVoted} setTab={setTab} />}
            {tab === 'candidates' && !hasVoted && <CandidatePoll voterId={voterId} voterName={voterName} setHasVoted={setHasVoted} setTab={setTab} />}
            {tab === 'facts' && <FactsView />}
            {tab === 'results' && <ResultsView />}
            {tab === 'ruling' && <RulingView />}
            {tab === 'contact' && <ContactView />}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400 cursor-pointer select-none" onClick={handleFooterClick}>
        <strong className="text-black">VoteX</strong> · India's Public Opinion Platform · Not affiliated with any government body
      </footer>
    </div>
  );
}

// ── Home View ─────────────────────────────────────────────────────────────────
function HomeView({ setTab, hasVoted }) {
  return (
    <div className="space-y-14">
      <div className="text-center py-16">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">India's Public Opinion Platform</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-none">The Pulse of<br />Democracy</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          VoteX is a private public polling platform. Express support for national parties and local candidates.
          See real-time nationwide sentiment. Not affiliated with any government body.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => setTab(hasVoted ? 'results' : 'parties')} className="px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors shadow-lg">
            🇮🇳 National Party Poll
          </button>
          <button onClick={() => setTab(hasVoted ? 'results' : 'candidates')} className="px-8 py-4 bg-white text-black font-bold rounded-full border border-gray-300 hover:bg-gray-50 transition-colors">
            🏛️ State & Local Candidates
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Activity />, title: 'Live Results', desc: 'Real-time vote counts across all parties and candidates.', t: 'results' },
          { icon: <FileText />, title: 'Party Manifestos & Facts', desc: 'Full dossier: crimes, controversies, economic data, former PMs and more.', t: 'facts' },
          { icon: <User />, title: 'Know Your Candidate', desc: 'Wealth, history, background and allegations of candidates in your district.', t: 'candidates' },
          { icon: <Shield />, title: 'Current Rulers', desc: 'Who is currently ruling your state and district.', t: 'ruling' },
          { icon: <TrendingUp />, title: 'Election Statistics', desc: 'National polling trends and party standings at a glance.', t: 'results' },
          { icon: <MessageSquare />, title: 'Contact Us', desc: 'Reach out for inquiries, partnerships and business deals.', t: 'contact' },
        ].map(c => (
          <div key={c.t + c.title} onClick={() => setTab(c.t)} className="bg-white border border-gray-200 p-7 rounded-2xl hover:border-black hover:shadow-lg cursor-pointer group transition-all">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-all">{c.icon}</div>
            <h3 className="text-xl font-bold mb-2">{c.title}</h3>
            <p className="text-gray-500 text-sm">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Polls ─────────────────────────────────────────────────────────────────────
function PartyPoll({ voterId, voterName, setHasVoted, setTab }) {
  const [parties, setParties] = useState([]);
  const [status, setStatus] = useState('');
  const [voted, setVoted] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);

  useEffect(() => { fetch(`${API}/parties`).then(r => r.json()).then(setParties); }, []);

  const handleVote = async (party) => {
    const res = await fetch(`${API}/vote/party`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ party_id: party.id, voter_token: voterId, voter_name: voterName }) });
    const d = await res.json();
    if (d.success) {
      setStatus('Vote recorded!'); setVoted(party.id);
      setTimeout(() => { setHasVoted(true); setTab('results'); }, 2000);
    } else {
      setStatus(d.error || 'Error.');
      if (d.error?.includes('already')) { setHasVoted(true); setTimeout(() => setTab('results'), 2000); }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight mb-2">National Party Poll</h2>
        <p className="text-gray-500">Select the party you support at the national level. Click a party name to view details.</p>
      </div>
      {status && <div className={`p-4 rounded-xl flex items-center justify-center gap-2 font-semibold ${status.includes('Error') || status.includes('already') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-gray-100 border border-gray-300 text-black'}`}><CheckCircle2 size={18}/> {status}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {parties.map(p => (
          <div key={p.id} className={`border rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:shadow-md ${voted === p.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
            {p.logo_url ? (
              <img src={p.logo_url} className="w-16 h-16 object-contain mb-3 rounded-full border border-gray-100" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            ) : null}
            <div className={`w-16 h-16 rounded-full bg-black text-white flex items-center justify-center font-black text-base mb-3 shadow-md ${p.logo_url ? 'hidden' : ''}`}>{p.acronym?.substring(0, 4)}</div>
            <h3 className="font-bold text-base mb-1 cursor-pointer hover:underline" onClick={() => setSelectedParty(p)}>{p.name}</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{p.manifesto}</p>
            <button onClick={() => handleVote(p)} disabled={voted !== null}
              className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm">
              {voted === p.id ? '✅ Voted' : `Vote for ${p.acronym}`}
            </button>
          </div>
        ))}
      </div>

      {/* Party Detail Modal */}
      {selectedParty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedParty(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedParty(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              {selectedParty.logo_url && <img src={selectedParty.logo_url} className="w-20 h-20 object-contain rounded-xl border border-gray-100" />}
              <div>
                <h3 className="text-2xl font-black">{selectedParty.name}</h3>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedParty.acronym}</span>
              </div>
            </div>
            <div className="space-y-5">
              {selectedParty.former_pm && <div><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Former Prime Ministers</h4><p className="font-semibold text-gray-800">{selectedParty.former_pm}</p></div>}
              <div><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Manifesto & Vision</h4><p className="text-gray-700 leading-relaxed text-sm">{selectedParty.manifesto || 'No manifesto available.'}</p></div>
              <div><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Key Past Work</h4><p className="text-gray-700 leading-relaxed text-sm">{selectedParty.past_work || 'No records.'}</p></div>
              <div><h4 className="text-xs font-black uppercase tracking-widest text-red-400 mb-1">Controversies</h4><p className="text-gray-700 leading-relaxed text-sm">{selectedParty.controversies || 'None listed.'}</p></div>
              <div><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Metrics & Allegations</h4><MetricsChart data={selectedParty} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidatePoll({ voterId, voterName, setHasVoted, setTab }) {
  const [locations, setLocations] = useState([]);
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [position, setPosition] = useState('MP');
  const [candidates, setCandidates] = useState([]);
  const [status, setStatus] = useState('');
  const [voted, setVoted] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => { fetch(`${API}/locations`).then(r => r.json()).then(setLocations); }, []);

  const states = [...new Set(locations.map(l => l.state))].sort();
  const districts = [...new Set(locations.filter(l => l.state === state).map(l => l.district))].sort();

  useEffect(() => {
    if (state && district && position) {
      fetch(`${API}/candidates?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&position=${position}`)
        .then(r => r.json()).then(setCandidates);
    } else setCandidates([]);
  }, [state, district, position]);

  const handleVote = async (cand) => {
    const res = await fetch(`${API}/vote/candidate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidate_id: cand.id, voter_token: voterId, voter_name: voterName }) });
    const d = await res.json();
    if (d.success) {
      setStatus('Vote recorded!'); setVoted(cand.id);
      setTimeout(() => { setHasVoted(true); setTab('results'); }, 2000);
    } else {
      setStatus(d.error || 'Error.');
      if (d.error?.includes('already')) { setHasVoted(true); setTimeout(() => setTab('results'), 2000); }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight mb-2">State & Local Candidate Poll</h2>
        <p className="text-gray-500">Filter by state, district and position. Click a candidate's name to view their full dossier.</p>
      </div>
      <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-wrap gap-4 shadow-sm">
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1"><MapPin size={13}/> State</label>
          <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black outline-none focus:ring-2 focus:ring-black">
            <option value="">Select State / UT</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1"><Building size={13}/> District</label>
          <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!state} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black outline-none disabled:opacity-40 focus:ring-2 focus:ring-black">
            <option value="">Select District</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1"><Filter size={13}/> Position</label>
          <select value={position} onChange={e => setPosition(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-black outline-none focus:ring-2 focus:ring-black">
            <option value="MP">Member of Parliament (MP)</option>
            <option value="MLA">Member of Legislative Assembly (MLA)</option>
          </select>
        </div>
      </div>
      {status && <div className={`p-4 rounded-xl flex items-center justify-center gap-2 font-semibold ${status.includes('Error') || status.includes('already') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-gray-100 border border-gray-300 text-black'}`}><CheckCircle2 size={18}/> {status}</div>}
      {state && district ? (
        candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map(c => (
              <div key={c.id} className={`border rounded-2xl p-5 flex flex-col transition-all hover:shadow-md ${voted === c.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {c.photo_url ? <img src={c.photo_url} className="w-14 h-14 rounded-full object-cover border border-gray-200" /> : <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200"><User size={22}/></div>}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold leading-tight cursor-pointer hover:underline" onClick={() => setSelectedCandidate(c)}>{c.name}</h3>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {c.party_logo && <img src={c.party_logo} className="w-4 h-4 object-contain" />}
                      <span className="text-xs font-bold px-2 py-0.5 bg-black text-white rounded-full">{c.party_acronym || 'IND'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{c.position}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3 flex-1">
                  {c.wealth_estimation && <p><span className="font-semibold text-gray-700">Wealth:</span> {c.wealth_estimation}</p>}
                  {c.bio && <p className="line-clamp-2 mt-1">{c.bio}</p>}
                </div>
                <button onClick={() => handleVote(c)} disabled={voted !== null}
                  className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                  {voted === c.id ? '✅ Voted' : `Vote for ${c.name}`}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500">No candidates found. Admin can add candidates for this region.</div>
        )
      ) : (
        <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500">Select a State and District to view candidates.</div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedCandidate(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
              {selectedCandidate.photo_url ? <img src={selectedCandidate.photo_url} className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-100" /> : <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"><User size={40} className="text-gray-400"/></div>}
              <div>
                <h3 className="text-2xl font-black">{selectedCandidate.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {selectedCandidate.party_logo && <img src={selectedCandidate.party_logo} className="w-5 h-5 object-contain" />}
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-xs">{selectedCandidate.party_name || 'Independent'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><div className="text-xs font-bold text-gray-400 uppercase mb-1">Region</div><div className="font-semibold text-sm">{selectedCandidate.district}, {selectedCandidate.state}</div></div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><div className="text-xs font-bold text-gray-400 uppercase mb-1">Position</div><div className="font-semibold text-sm">{selectedCandidate.position}</div></div>
              {selectedCandidate.wealth_estimation && <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2"><div className="text-xs font-bold text-gray-400 uppercase mb-1">Declared Wealth</div><div className="font-semibold text-sm">{selectedCandidate.wealth_estimation}</div></div>}
            </div>
            <div className="space-y-5">
              {selectedCandidate.bio && <div><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Biography</h4><p className="text-gray-700 text-sm leading-relaxed">{selectedCandidate.bio}</p></div>}
              {selectedCandidate.past_work && <div><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Past Work</h4><p className="text-gray-700 text-sm leading-relaxed">{selectedCandidate.past_work}</p></div>}
              <div><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Metrics & Allegations</h4><MetricsChart data={selectedCandidate} color="#000000" /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Facts View ────────────────────────────────────────────────────────────────
function FactsView() {
  const [parties, setParties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/parties`).then(r => r.json()).then(data => {
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
                  className={`p-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 ${selected?.id === p.id ? 'bg-black text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}>
                  {p.logo_url
                    ? <img src={p.logo_url} className={`w-7 h-7 object-contain rounded-full shrink-0 ${selected?.id === p.id ? 'bg-white p-0.5' : ''}`} onError={e => e.target.style.display='none'} />
                    : <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${selected?.id === p.id ? 'bg-white/20' : 'bg-gray-100'}`}>{(p.acronym||'').substring(0,3)}</div>
                  }
                  <div className="min-w-0">
                    <div className="truncate">{p.name}</div>
                    <div className={`text-xs ${selected?.id === p.id ? 'text-gray-300' : 'text-gray-400'}`}>{p.acronym}</div>
                  </div>
                  {hasData(p) && <div className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${selected?.id === p.id ? 'bg-green-300' : 'bg-green-500'}`} title="Has data"/>}
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
                      <div key={m.label} className={`border rounded-2xl p-4 text-center ${metricColor(m.val, m.max)}`}>
                        <div className="text-lg mb-1">{m.icon}</div>
                        <div className="text-2xl font-black">{m.val}{m.suffix||''}</div>
                        <div className="text-xs font-bold mt-1 opacity-80">{m.label}</div>
                        {/* mini bar */}
                        <div className="w-full bg-white/60 rounded-full h-1.5 mt-2">
                          <div className="h-1.5 rounded-full bg-current opacity-50 transition-all" style={{width: `${Math.min(100,(m.val/m.max)*100)}%`}}></div>
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

// ── Results View ──────────────────────────────────────────────────────────────
function ResultsView() {
  const [data, setData] = useState({ parties: [], candidates: [] });
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch(`${API}/locations`).then(r => r.json()).then(setLocations);
    fetch(`${API}/results`).then(r => r.json()).then(setData);
    const interval = setInterval(() => fetch(`${API}/results`).then(r => r.json()).then(setData), 10000);
    return () => clearInterval(interval);
  }, []);

  const states = [...new Set(locations.map(l => l.state))].sort();
  const districts = [...new Set(locations.filter(l => l.state === state).map(l => l.district))].sort();
  const filteredCandidates = data.candidates.filter(c => c.state === state && c.district === district).sort((a, b) => b.total_votes - a.total_votes);
  const maxPartyVotes = Math.max(1, ...data.parties.map(x => x.total_votes));

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight mb-2">Live Election Results</h2>
        <p className="text-gray-500">Real-time vote counts across the nation. Auto-refreshes every 10 seconds.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-black mb-6">🇮🇳 National Party Standings</h3>
        <div className="space-y-4">
          {data.parties.sort((a, b) => b.total_votes - a.total_votes).map((p, i) => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="text-sm font-black text-gray-400 w-5">{i + 1}</div>
              {p.logo_url ? <img src={p.logo_url} className="w-10 h-10 object-contain rounded-full border border-gray-100 shrink-0" /> : <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs shrink-0">{p.acronym}</div>}
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm">{p.name} <span className="text-gray-400 font-normal">({p.acronym})</span></span>
                  <span className="font-black text-sm">{p.total_votes} votes</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-black h-2.5 rounded-full transition-all duration-500" style={{ width: `${(p.total_votes / maxPartyVotes) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ))}
          {data.parties.length === 0 && <p className="text-gray-400 text-center py-8">No votes recorded yet.</p>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-black mb-6">🏛️ Local Constituency Results</h3>
        <div className="flex gap-4 mb-8">
          <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none font-semibold text-sm">
            <option value="">Select State</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!state} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none font-semibold disabled:opacity-50 text-sm">
            <option value="">Select District</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {state && district ? (
          <div className="space-y-3">
            {filteredCandidates.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50">
                <div className="text-sm font-black text-gray-400 w-5">{i + 1}</div>
                {c.photo_url ? <img src={c.photo_url} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" /> : <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0"><User size={16}/></div>}
                <div className="flex-1">
                  <div className="font-black">{c.name}</div>
                  <div className="text-sm font-bold text-gray-500">{c.party_name || 'Independent'}</div>
                </div>
                <div className="text-2xl font-black">{c.total_votes}</div>
              </div>
            ))}
            {filteredCandidates.length === 0 && <p className="text-gray-400 text-center py-8">No candidates found for this region.</p>}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10">Select a State and District to view local results.</div>
        )}
      </div>
    </div>
  );
}

// ── Ruling Candidates ─────────────────────────────────────────────────────────
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
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPartyClass(c.party_acronym)}`}>{c.party_acronym || 'IND'}</span>
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
        <button key={p} onClick={() => go(p)} className={`w-9 h-9 rounded-lg text-sm font-bold ${p===page?'bg-black text-white':'border border-gray-300 hover:bg-gray-50'}`}>{p}</button>
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
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPartyClass(selected.party_acronym)}`}>{selected.party_acronym || 'IND'}</span>
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
          <div className={`p-3 rounded-xl border col-span-2 ${selected.crimes > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`text-xs font-bold uppercase mb-1 ${selected.crimes > 0 ? 'text-red-400' : 'text-gray-400'}`}>⚖️ Criminal Cases (Self-Declared to ECI)</div>
            <div className={`font-black text-lg ${selected.crimes > 0 ? 'text-red-600' : 'text-gray-500'}`}>{selected.crimes || 0} Cases</div>
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
  const mpTimer                     = useRef(null);

  // ── MLA ────────────────────────────────────────────────────────────────────
  const [mlaStates, setMlaStates]   = useState([]);
  const [mlaState, setMlaState]     = useState('');
  const [mlaSearch, setMlaSearch]   = useState('');
  const [mlaAllData, setMlaAllData] = useState([]);
  const [mlas, setMlas]             = useState([]);
  const [mlaLoading, setMlaLoading] = useState(false);
  const [mlaPage, setMlaPage]       = useState(1);
  const mlaTimer                    = useRef(null);

  // Load state lists on mount
  useEffect(() => {
    fetch(`${API}/ruling-states`).then(r => r.json()).then(setMpStates).catch(() => {});
    fetch(`${API}/mla-states`).then(r => r.json()).then(setMlaStates).catch(() => {});
  }, []);

  // MP: load all when state changes
  useEffect(() => {
    setMpSearch(''); setMpPage(1);
    if (!mpState) { setMpAllData([]); setMps([]); return; }
    setMpLoading(true);
    fetch(`${API}/ruling?state=${encodeURIComponent(mpState)}`)
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
      fetch(`${API}/ruling?search=${encodeURIComponent(val)}`)
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
    fetch(`${API}/mlas?state=${encodeURIComponent(mlaState)}`)
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
      fetch(`${API}/mlas?search=${encodeURIComponent(val)}`)
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
      ? `Filter within ${curState}...`
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
      ? `${label} — ${curState}`
      : `${label} Search Results`;

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
            {curSearch ? `No ${label} found for "${curSearch}"` : `No ${label} found.`}
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
          className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${!isMLA ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
          🇮🇳 MPs <span className="font-normal text-xs">({totalMP})</span>
        </button>
        <button onClick={() => setMode('MLA')}
          className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${isMLA ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
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

function ContactView() {
  const [form, setForm] = useState({ name: '', contact_number: '', message: '' });
  const [msg, setMsg] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/inquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await res.json();
    if (d.success) { setMsg('Thank you! We will get back to you soon.'); setForm({ name: '', contact_number: '', message: '' }); }
    else setMsg(d.error || 'Error sending message.');
  };
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-black mb-2 text-center">Contact VoteX</h2>
      <p className="text-gray-500 mb-8 text-center">For partnerships, business inquiries, and media requests.</p>
      {msg && <div className="p-4 bg-gray-100 rounded-xl mb-6 font-semibold">{msg}</div>}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <div><label className="block text-sm font-semibold mb-1">Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 outline-none" required /></div>
        <div><label className="block text-sm font-semibold mb-1">Phone / Email</label><input value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 outline-none" required /></div>
        <div><label className="block text-sm font-semibold mb-1">Message</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 outline-none resize-none"></textarea></div>
        <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800">Send Message</button>
      </form>
    </div>
  );
}

// ── Admin Login ───────────────────────────────────────────────────────────────
function AdminLogin({ onLogin, onClose }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [showPass, setShowPass] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: pass }) });
      const data = await res.json();
      if (data.token) onLogin(data.token, data.role, data.username);
      else setErr(data.error || 'Login failed');
    } catch (e) { setErr('Connection error - make sure backend is running'); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>
        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6"><Shield size={32}/></div>
        <h2 className="text-3xl font-black mb-2 tracking-tight">Admin Portal</h2>
        <p className="text-gray-500 mb-8 font-medium">Enter your credentials to access the control panel.</p>
        {err && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold text-sm">{err}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div><label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Username</label><input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black font-semibold" placeholder="admin" required /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black font-semibold pr-12" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
          </div>
          <button type="submit" className="w-full bg-black text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-colors mt-4 text-lg shadow-lg">Secure Login →</button>
        </form>
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ adminToken, adminRole, adminUsername, onClose }) {
  const [tab, setTab] = useState('dashboard');
  const headers = { 'Content-Type': 'application/json', 'x-admin-token': adminToken };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', roles: ['MAIN_ADMIN', 'PA', 'OFFICE_STAFF'] },
    { id: 'voters', label: 'Voter Data', roles: ['MAIN_ADMIN', 'PA', 'OFFICE_STAFF'] },
    { id: 'candidates', label: 'Candidates', roles: ['MAIN_ADMIN', 'PA', 'OFFICE_STAFF'] },
    { id: 'parties', label: 'Parties', roles: ['MAIN_ADMIN', 'PA', 'OFFICE_STAFF'] },
    { id: 'requests', label: 'Pending Approvals', roles: ['MAIN_ADMIN'] },
    { id: 'inquiries', label: 'Inquiries', roles: ['MAIN_ADMIN', 'PA'] },
    { id: 'staff', label: 'Manage Staff', roles: ['MAIN_ADMIN'] },
    { id: 'settings', label: 'Settings', roles: ['MAIN_ADMIN', 'PA', 'OFFICE_STAFF'] }
  ];

  const visibleTabs = tabs.filter(t => t.roles.includes(adminRole));

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <nav className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Shield size={20}/>
          <span className="font-black text-lg"><span className="text-white">Vote</span><span className="text-[#ef3446]">X</span> Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div id="google_translate_element" style={{background:'transparent'}}></div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold">{adminUsername}</div>
            <div className="text-xs text-gray-400">{(adminRole || '').replace(/_/g, ' ')}</div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">Exit</button>
        </div>
      </nav>
      <div className="flex flex-1">
        <aside className="w-56 bg-white border-r border-gray-200 p-4 shrink-0 overflow-y-auto">
          <div className="space-y-1">
            {visibleTabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold capitalize transition-all ${tab === t.id ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {tab === 'dashboard' && <AdminDashboard headers={headers} />}
            {tab === 'voters' && <AdminVoters headers={headers} role={adminRole} />}
            {tab === 'candidates' && <AdminCandidates headers={headers} role={adminRole} />}
            {tab === 'parties' && <AdminParties headers={headers} role={adminRole} />}
            {tab === 'requests' && <AdminRequests headers={headers} />}
            {tab === 'inquiries' && <AdminInquiries headers={headers} />}
            {tab === 'staff' && <AdminStaff headers={headers} />}
            {tab === 'settings' && <AdminSettings headers={headers} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminDashboard({ headers }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { fetch(`${API}/admin/stats`, { headers }).then(r => r.json()).then(setStats); }, []);
  if (!stats) return <div className="text-gray-400">Loading...</div>;
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black">Dashboard Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Parties', val: stats.total_parties }, { label: 'Total Candidates', val: stats.total_candidates }, { label: 'Party Votes', val: stats.total_party_votes }, { label: 'Candidate Votes', val: stats.total_candidate_votes }].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
            <div className="text-3xl font-black mb-1">{s.val.toLocaleString()}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>
      {stats.top_parties?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h3 className="font-black text-xl mb-6">Top Parties by Votes</h3>
          <div className="space-y-3">
            {stats.top_parties.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-black text-gray-400 w-6">{i + 1}</span>
                <span className="font-bold flex-1">{p.name}</span>
                <span className="font-black">{p.votes}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminVoters({ headers, role }) {
  const [data, setData] = useState(null);
  const load = () => fetch(`${API}/admin/voters`, { headers }).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, []);

  const handleDelete = async (token) => {
    if (!confirm('Delete this voter and all their votes permanently?')) return;
    await fetch(`${API}/admin/voters/${token}`, { method: 'DELETE', headers });
    load();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); doc.text('Vote', 14, 22);
    doc.setTextColor(239, 52, 70); doc.text('X', 33, 22);
    doc.setFontSize(11); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal');
    doc.text('Voter Database Export (Confidential - Main Admin Only)', 14, 30);
    doc.setFontSize(9); doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 36);

    const allVoters = [
      ...(data.party_voters || []).map(v => ({ type: 'Party', name: v.voter_name, id: v.voter_token, selection: v.party_name, time: v.timestamp })),
      ...(data.candidate_voters || []).map(v => ({ type: 'Candidate', name: v.voter_name, id: v.voter_token, selection: v.candidate_name, time: v.timestamp }))
    ];

    doc.autoTable({
      startY: 42,
      head: [['Voter Name', 'Voter ID (EPIC)', 'Vote Type', 'Voted For', 'Date/Time']],
      body: allVoters.map(v => [v.name, v.id, v.type, v.selection, new Date(v.time).toLocaleString('en-IN')]),
      headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 1: { font: 'courier' } }
    });
    doc.save('VoteX_Voter_List_Confidential.pdf');
  };

  if (!data) return <div className="text-gray-400">Loading...</div>;
  const isMainAdmin = role === 'MAIN_ADMIN';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">Voter Data</h2>
        {isMainAdmin && (
          <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors text-sm">
            <Download size={16}/> Download PDF
          </button>
        )}
      </div>
      {!isMainAdmin && <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-semibold">🔒 Voter names are hidden. Only the Main Admin can see names and download the voter list.</div>}

      {[{ title: 'Party Voters', voters: data.party_voters || [], cols: ['Voter Name', 'Voter ID', 'Party Voted', 'Time'], row: (v) => [v.voter_name, v.voter_token, `${v.party_name} (${v.acronym})`, new Date(v.timestamp).toLocaleString('en-IN')] },
        { title: 'Candidate Voters', voters: data.candidate_voters || [], cols: ['Voter Name', 'Voter ID', 'Candidate', 'Time'], row: (v) => [v.voter_name, v.voter_token, v.candidate_name, new Date(v.timestamp).toLocaleString('en-IN')] }
      ].map(section => (
        <div key={section.title}>
          <h3 className="font-bold text-lg mb-3">{section.title} ({section.voters.length})</h3>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{section.cols.map(c => <th key={c} className="text-left px-5 py-3 font-bold text-gray-500 text-xs uppercase">{c}</th>)}
                    {isMainAdmin && <th className="text-right px-5 py-3 font-bold text-gray-500 text-xs uppercase">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {section.voters.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No votes yet.</td></tr>}
                  {section.voters.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {section.row(v).map((cell, j) => <td key={j} className={`px-5 py-3 ${j === 1 ? 'font-mono text-xs' : ''}`}>{cell}</td>)}
                      {isMainAdmin && <td className="px-5 py-3 text-right"><button onClick={() => handleDelete(v.voter_token)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Delete</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Metrics input fields component
function MetricsInputs({ form, setForm }) {
  const fields = [
    { key: 'crimes', label: 'Crimes' },
    { key: 'controversies_count', label: 'Controversies Count' },
    { key: 'rupee_weakening', label: 'Rupee Weakening (scale 1-100)' },
    { key: 'rape_cases', label: 'Rape Cases' },
    { key: 'frauds', label: 'Frauds' },
    { key: 'court_cases', label: 'Court Cases' },
    { key: 'economic_downfall', label: 'Economic Downfall (scale 1-100)' },
  ];
  return (
    <div>
      <h4 className="font-black text-base mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> Crime & Economic Metrics</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold mb-1 text-gray-600">{f.label}</label>
            <input type="number" min="0" value={form[f.key] || 0} onChange={e => setForm({ ...form, [f.key]: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 outline-none text-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCandidates({ headers, role }) {
  const emptyForm = { name: '', party_id: '', state: '', district: '', position: 'MP', bio: '', wealth_estimation: '', past_work: '', photo_url: '', crimes: 0, controversies_count: 0, rupee_weakening: 0, rape_cases: 0, frauds: 0, court_cases: 0, economic_downfall: 0, is_current_ruler: 0 };
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('');

  const load = () => {
    fetch(`${API}/admin/candidates`, { headers }).then(r => r.json()).then(setCandidates);
    fetch(`${API}/parties`).then(r => r.json()).then(setParties);
    fetch(`${API}/locations`).then(r => r.json()).then(setLocations);
  };
  useEffect(load, []);

  const states = [...new Set(locations.map(l => l.state))].sort();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId ? `${API}/admin/candidates/${editId}` : `${API}/admin/candidates`;
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    const d = await res.json();
    setMsg(d.message || d.error);
    if (d.success) { load(); setForm(emptyForm); setEditId(null); }
  };

  const handleEdit = (c) => {
    setForm({ name: c.name, party_id: c.party_id || '', state: c.state, district: c.district, position: c.position, bio: c.bio || '', wealth_estimation: c.wealth_estimation || '', past_work: c.past_work || '', photo_url: c.photo_url || '', crimes: c.crimes || 0, controversies_count: c.controversies_count || 0, rupee_weakening: c.rupee_weakening || 0, rape_cases: c.rape_cases || 0, frauds: c.frauds || 0, court_cases: c.court_cases || 0, economic_downfall: c.economic_downfall || 0, is_current_ruler: c.is_current_ruler || 0 });
    setEditId(c.id);
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this candidate permanently?')) return;
    const res = await fetch(`${API}/admin/candidates/${id}`, { method: 'DELETE', headers });
    const d = await res.json();
    setMsg(d.message || d.error);
    load();
  };

  const filtered = filter ? candidates.filter(c => c.state === filter) : candidates;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black">{editId ? '✏️ Edit Candidate' : 'Manage Candidates'}</h2>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="font-black text-xl mb-6 flex items-center gap-2">
          <Plus size={20}/> {editId ? 'Editing Candidate' : (role === 'MAIN_ADMIN' ? 'Add Candidate Directly' : 'Propose New Candidate')}
          {editId && <button onClick={() => { setEditId(null); setForm(emptyForm); setMsg(''); }} className="ml-auto text-sm text-gray-500 hover:text-black font-semibold">Cancel Edit</button>}
        </h3>
        {msg && <div className={`p-4 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2 ${msg.includes('Error') || msg.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}><CheckCircle2 size={16}/> {msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold mb-1">Full Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" required/></div>
            <div><label className="block text-sm font-semibold mb-1">Party</label><select value={form.party_id} onChange={e => setForm({...form, party_id: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none"><option value="">Independent</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold mb-1">State/UT *</label>
              <input list="states-list" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" placeholder="E.g. Delhi" required/>
              <datalist id="states-list">{states.map(s => <option key={s} value={s}/>)}</datalist>
            </div>
            <div><label className="block text-sm font-semibold mb-1">District *</label><input value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" required/></div>
            <div><label className="block text-sm font-semibold mb-1">Position *</label><select value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none"><option value="MP">MP</option><option value="MLA">MLA</option><option value="CM">Chief Minister</option><option value="PM">Prime Minister</option></select></div>
            <div><label className="block text-sm font-semibold mb-1">Wealth Estimation</label><input value={form.wealth_estimation} onChange={e => setForm({...form, wealth_estimation: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" placeholder="₹5.5 Crore"/></div>
          </div>
          <div><label className="block text-sm font-semibold mb-1">Biography</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2"/></div>
          <div><label className="block text-sm font-semibold mb-1">Past Work</label><textarea value={form.past_work} onChange={e => setForm({...form, past_work: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2"/></div>
          <ImageUpload value={form.photo_url} onChange={v => setForm({...form, photo_url: v})} label="Candidate Photo" />
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <input type="checkbox" id="is_current_ruler" checked={!!form.is_current_ruler} onChange={e => setForm({...form, is_current_ruler: e.target.checked ? 1 : 0})} className="w-5 h-5 accent-black"/>
            <label htmlFor="is_current_ruler" className="text-sm font-bold text-blue-900">Mark as Currently Ruling (shows in 'Current Rulers' section)</label>
          </div>
          <div className="border border-gray-200 rounded-2xl p-5"><MetricsInputs form={form} setForm={setForm} /></div>
          <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800">
            {editId ? 'Update Candidate' : (role === 'MAIN_ADMIN' ? 'Add Candidate' : 'Submit for Approval')}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-3">
          <h3 className="font-bold text-lg">Candidate List ({candidates.length})</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-semibold outline-none">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="border border-gray-200 rounded-2xl p-5 relative group">
                <div className="flex items-start gap-3">
                  {c.photo_url ? <img src={c.photo_url} className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" /> : <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0"><User size={18}/></div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base">{c.name}</div>
                    <div className="text-sm font-semibold text-gray-500">{c.party_acronym || 'IND'} · {c.position}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.state} · {c.district}</div>
                    {c.is_current_ruler === 1 && <span className="inline-block mt-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Current Ruler</span>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(c)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black"><Edit2 size={12}/> Edit</button>
                  {role === 'MAIN_ADMIN' && <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-600 ml-auto"><Trash2 size={12}/> Delete</button>}
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No candidates found.</div>}
        </div>
      </div>
    </div>
  );
}

function AdminParties({ headers, role }) {
  const emptyForm = { name: '', acronym: '', manifesto: '', past_work: '', controversies: '', logo_url: '', former_pm: '', crimes: 0, controversies_count: 0, rupee_weakening: 0, rape_cases: 0, frauds: 0, court_cases: 0, economic_downfall: 0 };
  const [parties, setParties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => fetch(`${API}/parties`).then(r => r.json()).then(setParties);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId ? `${API}/admin/parties/${editId}` : `${API}/admin/parties`;
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    const d = await res.json();
    setMsg(d.message || d.error);
    if (d.success) { load(); setForm(emptyForm); setEditId(null); }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, acronym: p.acronym, manifesto: p.manifesto || '', past_work: p.past_work || '', controversies: p.controversies || '', logo_url: p.logo_url || '', former_pm: p.former_pm || '', crimes: p.crimes || 0, controversies_count: p.controversies_count || 0, rupee_weakening: p.rupee_weakening || 0, rape_cases: p.rape_cases || 0, frauds: p.frauds || 0, court_cases: p.court_cases || 0, economic_downfall: p.economic_downfall || 0 });
    setEditId(p.id);
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this party permanently?')) return;
    const res = await fetch(`${API}/admin/parties/${id}`, { method: 'DELETE', headers });
    const d = await res.json();
    setMsg(d.message || d.error);
    load();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black">{editId ? '✏️ Edit Party' : 'Manage Parties'}</h2>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="font-black text-xl mb-6 flex items-center gap-2">
          <Plus size={20}/> {editId ? 'Editing Party' : (role === 'MAIN_ADMIN' ? 'Add Party Directly' : 'Propose New Party')}
          {editId && <button onClick={() => { setEditId(null); setForm(emptyForm); setMsg(''); }} className="ml-auto text-sm text-gray-500 hover:text-black font-semibold">Cancel Edit</button>}
        </h3>
        {msg && <div className={`p-4 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2 ${msg.includes('Error') || msg.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}><CheckCircle2 size={16}/> {msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold mb-1">Party Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" required/></div>
            <div><label className="block text-sm font-semibold mb-1">Acronym *</label><input value={form.acronym} onChange={e => setForm({...form, acronym: e.target.value.toUpperCase()})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" required/></div>
          </div>
          <div><label className="block text-sm font-semibold mb-1">Former Prime Ministers (from this party)</label><input value={form.former_pm} onChange={e => setForm({...form, former_pm: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. Atal Bihari Vajpayee (1999-2004), Narendra Modi (2014-)"/></div>
          <div><label className="block text-sm font-semibold mb-1">Manifesto & Vision</label><textarea value={form.manifesto} onChange={e => setForm({...form, manifesto: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="3"/></div>
          <div><label className="block text-sm font-semibold mb-1">Key Past Work</label><textarea value={form.past_work} onChange={e => setForm({...form, past_work: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2"/></div>
          <div><label className="block text-sm font-semibold mb-1">Controversies</label><textarea value={form.controversies} onChange={e => setForm({...form, controversies: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" rows="2"/></div>
          <ImageUpload value={form.logo_url} onChange={v => setForm({...form, logo_url: v})} label="Party Logo / Symbol" />
          <div className="border border-gray-200 rounded-2xl p-5"><MetricsInputs form={form} setForm={setForm} /></div>
          <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800">
            {editId ? 'Update Party' : (role === 'MAIN_ADMIN' ? 'Add Party' : 'Submit for Approval')}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parties.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-3xl p-6 relative group shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              {p.logo_url ? <img src={p.logo_url} className="w-14 h-14 object-contain border border-gray-100 rounded-xl" /> : <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">{p.acronym?.substring(0, 4)}</div>}
              <div><h4 className="font-bold text-lg">{p.name}</h4><span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{p.acronym}</span></div>
            </div>
            {p.former_pm && <p className="text-xs text-gray-500 mb-2"><span className="font-bold">Former PMs:</span> {p.former_pm}</p>}
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(p)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black"><Edit2 size={12}/> Edit</button>
              {role === 'MAIN_ADMIN' && <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-600 ml-auto"><Trash2 size={12}/> Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminRequests({ headers }) {
  const [reqs, setReqs] = useState([]);
  const load = () => fetch(`${API}/admin/requests`, { headers }).then(r => r.json()).then(setReqs);
  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    await fetch(`${API}/admin/requests/${id}/${action}`, { method: 'POST', headers });
    load();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black">Pending Approvals</h2>
      {reqs.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl text-gray-400">No pending requests from staff.</div>
      ) : (
        <div className="space-y-4">
          {reqs.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${r.action_type === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.action_type}</span>
                  <span className="font-semibold text-gray-600">{r.target_table}</span>
                </div>
                <p className="text-sm text-gray-500">Requested by <strong className="text-black">{r.requested_by}</strong> at {new Date(r.timestamp).toLocaleString()}</p>
                <div className="mt-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-gray-600 break-all max-w-xl">{r.new_data?.substring(0, 200)}...</div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => handleAction(r.id, 'reject')} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold border border-gray-300 text-gray-600 hover:bg-gray-50">Reject</button>
                <button onClick={() => handleAction(r.id, 'approve')} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold bg-black text-white hover:bg-gray-800">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminInquiries({ headers }) {
  const [inquiries, setInquiries] = useState([]);
  useEffect(() => { fetch(`${API}/admin/inquiries`, { headers }).then(r => r.json()).then(setInquiries); }, []);
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black">Business Inquiries</h2>
      {inquiries.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl text-gray-400">No inquiries yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {inquiries.map(i => (
            <div key={i.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div><h4 className="font-bold text-lg">{i.name}</h4><div className="text-sm text-gray-500 font-mono mt-1">{i.contact_number}</div></div>
                <div className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12}/> {new Date(i.timestamp).toLocaleDateString()}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm border border-gray-100 whitespace-pre-wrap">{i.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminStaff({ headers }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'OFFICE_STAFF' });
  const [msg, setMsg] = useState('');

  const load = () => fetch(`${API}/admin/users`, { headers }).then(r => r.json()).then(setStaff);
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/admin/users`, { method: 'POST', headers, body: JSON.stringify(form) });
    const d = await res.json();
    if (d.success) { setMsg('Staff account created successfully.'); load(); setForm({ username: '', password: '', role: 'OFFICE_STAFF' }); }
    else setMsg(d.error);
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers });
    load();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black">Manage Branch Staff</h2>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="font-black text-xl mb-6 flex items-center gap-2"><UsersIcon size={20}/> Add New Staff / Office Account</h3>
        {msg && <div className="p-4 rounded-xl text-sm mb-6 font-semibold bg-gray-100 text-black">{msg}</div>}
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold mb-1">Username</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" placeholder="delhi_office" required/></div>
            <div><label className="block text-sm font-semibold mb-1">Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" required/></div>
            <div><label className="block text-sm font-semibold mb-1">Role</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none"><option value="OFFICE_STAFF">Office Staff (Changes need approval)</option><option value="PA">Personal Assistant (Full view access)</option></select></div>
          </div>
          <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800">Create Account</button>
        </form>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {staff.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-5 relative group shadow-sm">
            {s.role !== 'MAIN_ADMIN' && <button onClick={() => handleRemove(s.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-3"><User size={18}/></div>
            <div className="font-bold text-lg">{s.username}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">{(s.role || '').replace(/_/g, ' ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSettings({ headers }) {
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const handleChange = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/admin/password`, { method: 'PUT', headers, body: JSON.stringify({ password: pass }) });
    if ((await res.json()).success) { setMsg('Password updated successfully!'); setPass(''); }
    else setMsg('Error updating password.');
  };
  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-3xl font-black">Account Settings</h2>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <h3 className="font-black text-xl mb-6 flex items-center gap-2"><Settings size={20}/> Change Password</h3>
        {msg && <div className="p-4 rounded-xl text-sm mb-6 font-semibold bg-gray-100 text-black">{msg}</div>}
        <form onSubmit={handleChange} className="space-y-4">
          <div><label className="block text-sm font-semibold mb-1">New Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 outline-none" required minLength={6}/></div>
          <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800">Update Password</button>
        </form>
      </div>
    </div>
  );
}
