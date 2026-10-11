import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';

export const LoginPage = () => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@saferide.io');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setLocalError(result.message);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLocalError('');
  };

  return (
    <div className="min-h-screen bg-[#070b10] flex flex-col justify-center items-center p-4 font-mono select-none">
      {/* Background Subtle Radar Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-red-950/20 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* System Title Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-red-800 shadow-xl shadow-red-950/60 mb-2">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">
            SafeRide Emergency Network
          </h1>
          <p className="text-xs text-slate-400 tracking-widest uppercase">
            TACTICAL COCKPIT // MISSION CONTROL AUTHENTICATION
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-6 shadow-2xl shadow-black/80 space-y-4">
          <div className="border-b border-[#1b2838] pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              OPERATOR ACCESS PROTOCOL
            </span>
            <span className="text-[10px] text-slate-500">v2.4-PROD</span>
          </div>

          {(localError || authError) && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                OPERATOR EMAIL / STATION CREDENTIAL:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@saferide.io"
                  className="w-full bg-[#101824] border border-[#223348] rounded py-2 pl-9 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-300 font-semibold">ACCESS KEY / PASSWORD:</label>
                <Link
                  to="/forgot-password"
                  className="text-cyan-400 hover:underline text-[11px]"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#101824] border border-[#223348] rounded py-2 pl-9 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all border border-red-600/40 active:scale-95"
            >
              <span>{loading ? 'AUTHENTICATING TOKEN...' : 'ENGAGE MISSION CONTROL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* System Default Credentials Quick-Fill */}
          <div className="pt-3 border-t border-[#182332] space-y-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider text-center">
              SYSTEM CREDENTIALS (CLICK TO AUTO-FILL):
            </div>
            <button
              type="button"
              onClick={() => fillCredentials('admin@saferide.io', 'Password@123')}
              className="w-full p-2.5 rounded bg-[#131d2a] hover:bg-[#1a293c] border border-[#1e2f44] text-cyan-300 transition-colors flex items-center justify-between px-3 cursor-pointer group"
            >
              <div className="text-left flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 group-hover:text-red-300">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-200 group-hover:text-cyan-400 transition-colors">
                    Super Admin <span className="text-[10px] text-slate-400 font-normal">(Dr. A. Vance)</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    admin@saferide.io • Mission Control
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-[#182637] border border-[#243950] text-cyan-300 font-mono font-semibold">
                Auto Fill
              </span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <div>Authorized law enforcement, dispatch operators, and fleet administrators only.</div>
          <div>All authentication attempts and GPS telemetry loops are logged to immutable audit storage.</div>
        </div>
      </div>
    </div>
  );
};
