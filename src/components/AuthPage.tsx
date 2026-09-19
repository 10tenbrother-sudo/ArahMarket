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
  RefreshCw,
  Send,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { api, setAuthToken } from '../lib/api';
import { User } from '../types';

interface AuthPageProps {
  mode: 'login' | 'register' | 'verify-email';
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
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);

  // Resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Direct Token verification state (from /verify-email?token=...)
  const [tokenVerifying, setTokenVerifying] = useState(false);
  const [tokenVerifySuccess, setTokenVerifySuccess] = useState<string | null>(null);
  const [tokenVerifyError, setTokenVerifyError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  // Check for verification token in query parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const verifiedParam = urlParams.get('verified');

    if (verifiedParam === 'true' || verifiedParam === '1') {
      setTokenVerifySuccess('Email Anda telah berhasil diverifikasi. Silakan masuk dengan akun Anda.');
    }

    if (token) {
      setTokenVerifying(true);
      setError(null);
      api.verifyEmail(token)
        .then((res) => {
          setTokenVerifySuccess('Verifikasi email berhasil! Membuka terminal trading...');
          setAuthToken(res.token);
          setTimeout(() => {
            onSuccess(res.user, res.token);
          }, 1200);
        })
        .catch((err: any) => {
          setTokenVerifyError(err.message || 'Token verifikasi tidak valid atau telah kedaluwarsa.');
        })
        .finally(() => {
          setTokenVerifying(false);
        });
    }
  }, [onSuccess]);

  // Clear states when switching modes
  useEffect(() => {
    setError(null);
    setErrorCode(null);
    setResendStatus(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setResendStatus(null);

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Silakan isi nama atau handle trading Anda.');
        }
        const res = await api.register({
          email: email.trim(),
          password,
          name: name.trim(),
        });

        // User is in pending_verification status
        setRegisteredEmail(email.trim());
        setVerificationPending(true);
        if (res.verificationUrl) {
          setSimulatedUrl(res.verificationUrl);
        }
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        setAuthToken(res.token);
        onSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Otentikasi gagal. Silakan periksa kembali kredensial Anda.');
      if (err.code) {
        setErrorCode(err.code);
      }
      if (err.email) {
        setRegisteredEmail(err.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (targetEmail?: string) => {
    const emailToUse = targetEmail || registeredEmail || email;
    if (!emailToUse.trim()) {
      setError('Silakan masukkan alamat email terlebih dahulu.');
      return;
    }

    setResendLoading(true);
    setResendStatus(null);
    try {
      const res = await api.resendVerification(emailToUse.trim());
      setResendStatus(res.message || 'Tautan verifikasi baru berhasil dikirim ke email Anda.');
      if (res.verificationUrl) {
        setSimulatedUrl(res.verificationUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setResendLoading(false);
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
          id="back-home-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-xs">
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
            ARAHMARKET <span className="text-cyan-400">TERMINAL</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>VERIFIED ENCRYPTED ACCESS</span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

          {/* STATE 1: Token Verifying in Progress */}
          {tokenVerifying && (
            <div className="text-center py-8 space-y-4 font-mono">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700/80 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Memvalidasi Tautan Aktivasi...</h2>
              <p className="text-xs text-slate-400 font-sans">
                Mohon tunggu sejenak, sistem sedang mengonfirmasi keaslian token verifikasi akun Anda.
              </p>
            </div>
          )}

          {/* STATE 2: Token Verification Success Banner */}
          {tokenVerifySuccess && !tokenVerifying && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600/80 text-emerald-300 text-xs space-y-2 font-sans">
              <div className="flex items-center gap-2 font-semibold text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verifikasi Berhasil</span>
              </div>
              <p>{tokenVerifySuccess}</p>
            </div>
          )}

          {/* STATE 3: Token Verification Error Banner */}
          {tokenVerifyError && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-300 text-xs space-y-3 font-sans">
              <div className="flex items-center gap-2 font-semibold text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Gagal Memverifikasi Akun</span>
              </div>
              <p>{tokenVerifyError}</p>
              <button
                type="button"
                onClick={() => {
                  setTokenVerifyError(null);
                  onNavigate('/login');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono font-medium transition cursor-pointer"
              >
                <span>Masuk ke Halaman Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* STATE 4: Email Verification Pending View (After Successful Registration) */}
          {verificationPending ? (
            <div className="space-y-6">
              {/* Icon & Title */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/90 border border-cyan-600/60 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-lg shadow-cyan-950/60 relative">
                  <Mail className="w-7 h-7" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Clock className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </span>
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                  Verifikasi Email Anda
                </h1>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Kami telah mengirimkan tautan aktivasi ke:
                </p>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold">
                  {registeredEmail}
                </div>
              </div>

              {/* Policy Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-slate-400 text-xs space-y-2 font-sans">
                <div className="flex items-center gap-2 text-slate-300 font-medium font-mono text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Kebijakan Anti-Email Bodong</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Untuk mencegah penggunaan bot dan email palsu, status akun Anda berada dalam tahap{' '}
                  <span className="text-amber-300 font-mono font-semibold">pending_verification</span>. Akun hanya dapat digunakan setelah Anda mengklik tautan di email.
                </p>
              </div>

              {/* Resend Status Message */}
              {resendStatus && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/80 text-emerald-300 text-xs flex items-center gap-2 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {/* Dev Simulation Helper */}
              {simulatedUrl && (
                <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-700/60 text-cyan-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      Mode Simulasi / Development Testing
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    SMTP server belum dikonfigurasi di .env. Anda dapat langsung menguji aktivasi akun melalui tautan berikut:
                  </p>
                  <a
                    href={simulatedUrl}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition text-center"
                    id="dev-verify-link"
                  >
                    <span>Aktivasi Akun Sekarang</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={() => handleResendVerification()}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  id="resend-verification-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  <span>{resendLoading ? 'Mengirim Ulang...' : 'Kirim Ulang Email Verifikasi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationPending(false);
                    onNavigate('/login');
                  }}
                  className="w-full py-2 rounded-lg text-slate-400 hover:text-slate-200 font-mono text-xs transition cursor-pointer text-center"
                >
                  Sudah verifikasi? Masuk ke Akun
                </button>
              </div>
            </div>
          ) : (
            /* STATE 5: Standard Login / Register Form */
            <>
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                  {isRegister ? 'Daftar Akun Trader' : 'Otentikasi Terminal'}
                </h1>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {isRegister
                    ? 'Daftarkan akun Anda untuk memonitor sentimen makro, matriks kekuatan G8, dan watchlist real-time.'
                    : 'Masuk untuk mengakses ruang kerja intelijen makro dan telemetri pasar.'}
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
                  id="tab-login"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
                    isRegister
                      ? 'bg-slate-900 text-cyan-300 shadow-xs border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="tab-register"
                >
                  Buat Akun
                </button>
              </div>

              {/* Error Message with Email Verification Resend Option */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs space-y-2.5 font-sans">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span className="leading-relaxed">{error}</span>
                  </div>

                  {/* If user is not verified or already registered without verification */}
                  {(errorCode === 'EMAIL_NOT_VERIFIED' || errorCode === 'ALREADY_REGISTERED_UNVERIFIED') && (
                    <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-rose-300/80 font-mono">Belum menerima email?</span>
                      <button
                        type="button"
                        onClick={() => handleResendVerification(email || registeredEmail)}
                        disabled={resendLoading}
                        className="px-2.5 py-1 rounded bg-rose-900/50 hover:bg-rose-900/90 text-rose-200 text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                        id="unverified-resend-btn"
                      >
                        <Send className="w-3 h-3" />
                        <span>{resendLoading ? 'Mengirim...' : 'Kirim Ulang'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Resend Status Message */}
              {resendStatus && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/80 text-emerald-300 text-xs flex items-center gap-2 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                {isRegister && (
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 text-[11px] font-semibold">
                      Nama Lengkap / Trading Desk Handle
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="contoh: Alexander Vance"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                        id="auth-name-input"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-slate-300 text-[11px] font-semibold">
                    Alamat Email (Wajib Aktif)
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
                      id="auth-email-input"
                    />
                  </div>
                  {isRegister && (
                    <p className="text-[10px] text-slate-500 font-sans">
                      * Tautan verifikasi akun akan dikirimkan ke email ini.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 text-[11px] font-semibold">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                      id="auth-password-input"
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
                    <span>Memproses otentikasi...</span>
                  ) : (
                    <>
                      <span>{isRegister ? 'Daftar & Kirim Tautan Verifikasi' : 'Masuk ke Terminal'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer note */}
              <div className="text-center text-[11px] text-slate-400 font-sans pt-2 border-t border-slate-850">
                {isRegister ? (
                  <p>
                    Sudah memiliki akun terverifikasi?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      Masuk
                    </button>
                  </p>
                ) : (
                  <p>
                    Belum memiliki akun terminal?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/register')}
                      className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      Daftar akun baru
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom Disclaimer */}
      <footer className="py-4 text-center text-[10px] text-slate-600 font-mono border-t border-slate-900">
        ARAHMARKET INTELLIGENCE TERMINAL • SECURE ENCRYPTED VERIFICATION GATEWAY
      </footer>
    </div>
  );
};
