import React, { useState, useEffect } from 'react';
import {
  Layers,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api, setAuthToken } from '../lib/api';
import { User } from '../types';

interface AuthPageProps {
  mode: 'login' | 'register';
  onNavigate: (to: string) => void;
  onSuccess: (user: User, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  onNavigate,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  // Clear error when switching mode
  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Please provide your name or trading handle.');
        }
        const res = await api.register({
          email: email.trim(),
          password,
          name: name.trim(),
        });
        setAuthToken(res.token);
        onSuccess(res.user, res.token);
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        setAuthToken(res.token);
        onSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoTrader = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({
        email: 'trader@marketintel.pro',
        password: 'Trader123!',
      });
      setAuthToken(res.token);
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({
        email: 'admin@marketintel.pro',
        password: 'Admin123!@#',
      });
      setAuthToken(res.token);
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-sm z-10">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-6 h-6 rounded bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-xs">
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
            NEXUS <span className="text-cyan-400">TERMINAL</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
          SECURE 256-BIT ENCRYPTION
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
              {isRegister ? 'Create Trader Account' : 'Terminal Authentication'}
            </h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {isRegister
                ? 'Register your account to access real-time market surveillance, G8 currency matrix, and cloud watchlists.'
                : 'Sign in to access your institutional macro workspace and live telemetry.'}
            </p>
          </div>

          {/* Mode Tabs (Sign In vs Register) */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
                !isRegister
                  ? 'bg-slate-900 text-cyan-300 shadow-xs border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
                isRegister
                  ? 'bg-slate-900 text-cyan-300 shadow-xs border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick 1-Click Demo Evaluation Buttons */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Fast Evaluation Access</span>
              <span className="text-cyan-400 flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3" /> 1-CLICK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={handleQuickDemoTrader}
                disabled={loading}
                className="p-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 transition text-left cursor-pointer disabled:opacity-50"
              >
                <div className="font-bold text-[11px]">Pro Trader</div>
                <div className="text-[9px] text-slate-400 truncate">trader@marketintel.pro</div>
              </button>
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 transition text-left cursor-pointer disabled:opacity-50"
              >
                <div className="font-bold text-[11px]">Desk Admin</div>
                <div className="text-[9px] text-slate-400 truncate">admin@marketintel.pro</div>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Or Enter Credentials
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-[11px] font-semibold">
                  Full Name / Trading Desk Handle
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alexander Vance"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-slate-300 text-[11px] font-semibold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@firm.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 text-[11px] font-semibold">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
              id="auth-submit-btn"
            >
              {loading ? (
                <span>Authenticating with terminal...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account & Open Terminal' : 'Sign In to Terminal'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400 font-sans pt-2 border-t border-slate-850">
            {isRegister ? (
              <p>
                Already have terminal access?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Need a new trading desk account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  Create one for free
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Disclaimer */}
      <footer className="py-4 text-center text-[10px] text-slate-600 font-mono border-t border-slate-900">
        NEXUS TERMINAL ENCRYPTED AUTHORIZATION GATEWAY • PORT 3000
      </footer>
    </div>
  );
};
