import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      if (res.role === 'admin') navigate('/admin');
      if (res.role === 'tutor') navigate('/tutor');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f1] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
      `}</style>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0f172a] transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to portal
        </Link>

        <div className="flex flex-col items-center text-center">
          <img
            src="https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britannia-logo.png"
            alt="Britannia International Academy crest"
            className="h-16 w-16 bg-white rounded-full p-1.5 object-contain shadow-sm border border-slate-200"
          />
          <h2 className="font-display mt-5 text-2xl sm:text-3xl font-semibold text-[#0f172a]">
            Staff secure login
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Britannia Result Management System
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-lg">

          <form className="space-y-5" onSubmit={handleLogin}>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] text-sm transition-all"
                  placeholder="admin@britacademy.online"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] text-sm transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-md text-sm font-semibold text-white bg-[#0f172a] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f172a] disabled:opacity-70 transition-colors"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Authenticate access'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;