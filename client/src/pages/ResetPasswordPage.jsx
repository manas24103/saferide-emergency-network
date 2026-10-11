import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b10] flex flex-col justify-center items-center p-4 font-mono select-none">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-slate-100 uppercase tracking-wider">
            RESET OPERATOR ACCESS KEY
          </h1>
          <p className="text-xs text-slate-400">
            Define a secure replacement password
          </p>
        </div>

        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-6 shadow-xl space-y-4 text-xs">
          {message && (
            <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{message} (Redirecting to login...)</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-300 mb-1">RESET AUTHORIZATION TOKEN:</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Hexadecimal token string"
                className="w-full bg-[#101824] border border-[#223348] rounded py-2 px-3 text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">NEW ACCESS KEY / PASSWORD:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#101824] border border-[#223348] rounded py-2 pl-9 pr-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">CONFIRM NEW PASSWORD:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-[#101824] border border-[#223348] rounded py-2 pl-9 pr-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
            >
              {loading ? 'COMMITTING SECURITY UPDATE...' : 'UPDATE PASSWORD & RE-LOCK'}
            </button>
          </form>

          <div className="pt-3 border-t border-[#182332] text-center">
            <Link
              to="/login"
              className="text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login Protocol</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
