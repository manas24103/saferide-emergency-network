import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ShieldAlert, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewToken, setPreviewToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.resetTokenPreview) {
        setPreviewToken(res.data.resetTokenPreview);
      }
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
            CREDENTIAL RECOVERY
          </h1>
          <p className="text-xs text-slate-400">
            SafeRide Tactical Access Protocol
          </p>
        </div>

        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-6 shadow-xl space-y-4 text-xs">
          {message && (
            <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{message}</span>
              </div>
              {previewToken && (
                <div className="pt-2 border-t border-emerald-900/60">
                  <div className="text-[10px] text-slate-300">Development Prototype Token:</div>
                  <div className="p-1 bg-[#090e15] rounded text-cyan-300 break-all my-1 text-[11px]">
                    {previewToken}
                  </div>
                  <Link
                    to={`/reset-password?token=${previewToken}`}
                    className="inline-block px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                  >
                    Proceed to Reset Password &rarr;
                  </Link>
                </div>
              )}
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
              <label className="block text-slate-300 mb-1">
                REGISTERED OPERATOR EMAIL:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@saferide.io"
                  className="w-full bg-[#101824] border border-[#223348] rounded py-2 pl-9 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase"
            >
              {loading ? 'ISSUING TOKEN...' : 'REQUEST PASSWORD RESET TOKEN'}
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
