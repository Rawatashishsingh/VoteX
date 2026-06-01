const fs = require('fs');

let code = fs.readFileSync('App_Current.txt', 'utf8');

const patchScript = fs.readFileSync('patch_app.cjs', 'utf8');
const resultsViewImpl = patchScript.match(/const resultsViewImpl = `([\s\S]*?)`;/)[1];

const adminLoginImpl = `
function AdminLogin({ onLogin, onClose }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: pass }) });
      const data = await res.json();
      if (data.token) onLogin(data.token, data.role, data.username);
      else setErr(data.error || 'Login failed');
    } catch (e) { setErr('Connection error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black">X</button>
        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6">Admin</div>
        <h2 className="text-3xl font-black mb-2 tracking-tight">Admin Portal</h2>
        <p className="text-gray-500 mb-8 font-medium">Enter your credentials to access the control panel.</p>
        {err && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold flex items-center gap-2">{err}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Username</label>
            <input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black font-semibold" placeholder="admin" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Password</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black font-semibold" placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full bg-black text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-colors mt-4 text-lg shadow-lg hover:shadow-xl">Secure Login</button>
        </form>
      </div>
    </div>
  );
}
`;

code = code.replace(/function AdminPanel/, resultsViewImpl + '\n' + adminLoginImpl + '\nfunction AdminPanel');
fs.writeFileSync('src/App.jsx', code);
