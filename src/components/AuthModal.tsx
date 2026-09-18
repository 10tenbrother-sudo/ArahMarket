import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, CheckCircle } from 'lucide-react';
import { api, setAuthToken } from '../lib/api';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register({ email, password, name });
        setAuthToken(res.token);
        onSuccess(res.user);
      } else {
        const res = await api.login({ email, password });
        setAuthToken(res.token);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    try {
      setLoading(true);
      const res = await api.login({ email: 'admin@marketintel.pro', password: 'admin_password_2026' });
      setAuthToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoTrader = async () => {
    try {
      setLoading(true);
      const res = await api.login({ email: 'trader@marketintel.pro', password: 'trader_password_2026' });
      setAuthToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800/80 flex items-center justify-center mx-auto mb-2 text-cyan-400">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
            {isRegister ? 'Create Trader Account' : 'Terminal Authentication'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Access private watchlist, alerts, and administrative commands
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-mono mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          {isRegister && (
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 pl-8 outline-none focus:border-cyan-500"
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@marketintel.pro"
                required
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 pl-8 outline-none focus:border-cyan-500"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 pl-8 outline-none focus:border-cyan-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="text-[10px] text-slate-500 block mb-1.5 uppercase">Quick Access:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickDemoAdmin}
              className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 text-center transition cursor-pointer"
            >
              Demo Admin
            </button>
            <button
              onClick={handleQuickDemoTrader}
              className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-center transition cursor-pointer"
            >
              Demo Trader
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-cyan-400 hover:underline cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
