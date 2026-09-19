import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Building,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Smartphone,
  Info,
} from 'lucide-react';
import { User, SubscriptionPlan } from '../types';
import { api } from '../lib/api';

declare global {
  interface Window {
    snap?: any;
  }
}

interface PaymentCheckoutModalProps {
  user: User;
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'annual';
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  user,
  plan,
  billingCycle,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  // Dynamic Midtrans Snap Script loader
  useEffect(() => {
    api.getPaymentConfig().then((cfg) => {
      setConfig(cfg);
      if (cfg?.clientKey) {
        const snapScriptId = 'midtrans-snap-script';
        const isProd = cfg.isProduction || !cfg.clientKey.startsWith('SB-');
        const expectedSrc = isProd
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';

        let scriptTag = document.getElementById(snapScriptId) as HTMLScriptElement | null;
        if (scriptTag && scriptTag.src !== expectedSrc) {
          scriptTag.remove();
          scriptTag = null;
        }
        if (!scriptTag) {
          scriptTag = document.createElement('script');
          scriptTag.id = snapScriptId;
          scriptTag.src = expectedSrc;
          scriptTag.setAttribute('data-client-key', cfg.clientKey);
          scriptTag.async = true;
          document.head.appendChild(scriptTag);
        }
      }
    }).catch(console.error);
  }, []);

  // Charge transaction state
  const [chargeData, setChargeData] = useState<{
    orderId: string;
    token: string;
    redirectUrl: string | null;
    grossAmount: number;
    isSimulated: boolean;
    demoDetails?: {
      mandiriBillerCode: string;
      mandiriBillKey: string;
      companyName: string;
      qrisString: string;
    };
  } | null>(null);

  // Manual payment form state
  const [senderName, setSenderName] = useState(user.name || '');
  const [senderBank, setSenderBank] = useState('Bank Mandiri');
  const [transferRef, setTransferRef] = useState('');
  const [manualSubmitted, setManualSubmitted] = useState(false);

  // Prices in IDR
  const prices = {
    PRO: {
      monthly: 499_000,
      annual: 4_788_000,
      monthlyEquivalent: 399_000,
    },
    INSTITUTIONAL: {
      monthly: 1_999_000,
      annual: 19_080_000,
      monthlyEquivalent: 1_590_000,
    },
  };

  const selectedTierPrice = prices[plan as 'PRO' | 'INSTITUTIONAL'] || prices.PRO;
  const totalAmount = billingCycle === 'annual' ? selectedTierPrice.annual : selectedTierPrice.monthly;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Initialize Charge Session on Mount
  useEffect(() => {
    let isMounted = true;
    const initCharge = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.createPaymentCharge({
          plan,
          billing_cycle: billingCycle,
        });
        if (isMounted && res.success) {
          setChargeData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Gagal menyiapkan sesi pembayaran.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initCharge();
    return () => {
      isMounted = false;
    };
  }, [plan, billingCycle]);

  // Trigger Midtrans Snap Popup if real client is ready
  const handleOpenSnap = () => {
    if (!chargeData) return;

    if (window.snap && chargeData.token && !chargeData.isSimulated) {
      window.snap.pay(chargeData.token, {
        onSuccess: async (result: any) => {
          console.log('[Midtrans Snap] Payment success:', result);
          try {
            const me = await api.getMe();
            onSuccess(me.user);
          } catch {
            onClose();
          }
        },
        onPending: (result: any) => {
          console.log('[Midtrans Snap] Payment pending:', result);
          alert('Pembayaran dibuat. Silakan selesaikan transaksi di Livin\' Mandiri atau aplikasi e-wallet Anda.');
        },
        onError: (err: any) => {
          console.error('[Midtrans Snap] Error:', err);
          setError('Terjadi kendala dalam memproses pembayaran Midtrans.');
        },
        onClose: () => {
          console.log('[Midtrans Snap] Customer closed the popup without finishing the payment');
        },
      });
    } else if (chargeData.redirectUrl) {
      window.open(chargeData.redirectUrl, '_blank');
    }
  };

  // Simulate payment success (Sandbox Demo)
  const handleSimulatePayment = async () => {
    if (!chargeData) return;
    setLoading(true);
    try {
      const res = await api.simulatePaymentSuccess({
        orderId: chargeData.orderId,
        plan,
        billing_cycle: billingCycle,
      });
      if (res.success && res.user) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses simulasi pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  // Submit manual transfer confirmation
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName) {
      setError('Harap masukkan nama pengirim transfer.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.submitManualPayment({
        plan,
        senderName,
        senderBank,
        transferAmount: totalAmount,
        referenceNote: transferRef,
      });
      if (res.success) {
        setManualSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim konfirmasi manual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Pembayaran Langganan ArahMarket
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  {plan}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Akses instan surveilans makroekonomi & sinyal berkecepatan tinggi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Strip */}
        <div className="px-6 py-3.5 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 block text-[11px]">Durasi Tagihan:</span>
              <strong className="text-slate-200 font-semibold">
                {billingCycle === 'annual' ? '1 Tahun (Hemat 20%)' : '1 Bulan'}
              </strong>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[11px]">Akun Pemohon:</span>
              <span className="text-slate-300 font-mono">{user.email}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Total Tagihan:</span>
            <span className="text-base font-bold text-cyan-400 font-mono">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Payment Methods Selector Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('AUTO')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'AUTO'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Otomatis (QRIS & Mandiri Virtual Account)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANUAL')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'MANUAL'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            Transfer Manual Bank Mandiri
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'AUTO' ? (
            <div className="space-y-6">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-cyan-400 mb-2" />
                  <p className="text-xs">Menyiapkan kode QRIS & Virtual Account Mandiri...</p>
                </div>
              ) : chargeData ? (
                <>
                  {/* Grid 2 Columns: QRIS & Mandiri VA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Method 1: QRIS */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            QRIS (Semua Bank & E-Wallet)
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Instant Realtime
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-3">
                          Bisa di-scan dari <strong>Livin' Mandiri</strong>, <strong>BCA Mobile</strong>, <strong>GoPay</strong>, <strong>OVO</strong>, <strong>Dana</strong>, atau <strong>ShopeePay</strong>.
                        </p>

                        {/* Simulated/Real QR Visual */}
                        <div className="p-3 rounded-lg bg-white flex flex-col items-center justify-center my-2 shadow-inner">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                              chargeData.demoDetails?.qrisString || `ARAHMARKET-ORDER-${chargeData.orderId}`
                            )}`}
                            alt="QRIS ArahMarket"
                            className="w-36 h-36 object-contain"
                          />
                          <div className="mt-1 text-[10px] font-mono text-slate-800 font-bold tracking-widest text-center">
                            QRIS STANDAR INDONESIA
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-[10px] text-slate-400 bg-slate-900/90 p-2 rounded border border-slate-800 flex items-center justify-between">
                        <span>Nominal: <strong>{formatRupiah(totalAmount)}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(totalAmount.toString(), 'amount')}
                          className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                        >
                          {copiedKey === 'amount' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Salin
                        </button>
                      </div>
                    </div>

                    {/* Method 2: Mandiri Bill Payment / Virtual Account */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-cyan-400" />
                            Mandiri Bill Payment / VA
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            E-Channel
                          </span>
                        </div>

                        <div className="space-y-2.5 my-2 text-xs">
                          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Kode Perusahaan (Biller Code):</span>
                            <div className="flex items-center justify-between mt-0.5 font-mono font-bold text-slate-200">
                              <span>{chargeData.demoDetails?.mandiriBillerCode || '70012'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(chargeData.demoDetails?.mandiriBillerCode || '70012', 'biller')}
                                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                {copiedKey === 'biller' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                Salin
                              </button>
                            </div>
                          </div>

                          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Nomor Pembayaran (Bill Key / Virtual Account):</span>
                            <div className="flex items-center justify-between mt-0.5 font-mono font-bold text-cyan-300 text-sm">
                              <span>{chargeData.demoDetails?.mandiriBillKey || `88708${user.id.slice(0, 6)}`}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(chargeData.demoDetails?.mandiriBillKey || `88708${user.id.slice(0, 6)}`, 'billkey')}
                                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                {copiedKey === 'billkey' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                Salin
                              </button>
                            </div>
                          </div>

                          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-300 block mb-1">Cara Bayar di Livin' by Mandiri:</span>
                            <ol className="list-decimal pl-4 space-y-0.5 text-[10px] leading-relaxed">
                              <li>Buka aplikasi <strong>Livin' by Mandiri</strong> $\rightarrow$ menu <strong>Bayar</strong>.</li>
                              <li>Cari Penyedia Jasa: <strong>70012 (Midtrans / ArahMarket)</strong>.</li>
                              <li>Masukkan No. Pembayaran di atas.</li>
                              <li>Konfirmasi nama & nominal {formatRupiah(totalAmount)}, lalu masukkan PIN.</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Pembayaran diamankan dengan enkripsi SHA-512.</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {window.snap && !chargeData.isSimulated && (
                        <button
                          type="button"
                          onClick={handleOpenSnap}
                          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Buka Pop-up Midtrans Snap
                        </button>
                      )}

                      {/* Sandbox testing button for instant activation */}
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        title="Simulasi pelunasan instan untuk pengujian sandbox"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        Konfirmasi Pembayaran Selesai (Cek Status)
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            /* MANUAL MANDIRI BANK TRANSFER TAB */
            <div className="space-y-5">
              {manualSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-100">
                    Konfirmasi Transfer Berhasil Dikirim!
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Terima kasih. Tim administrasi ArahMarket sedang memverifikasi mutasi rekening Anda. Akun Anda akan aktif menjadi <strong>{plan}</strong> dalam waktu 15–30 menit.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    Tutup Jendela
                  </button>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs font-bold text-slate-200 block mb-2">
                      Rekening Tujuan Pembayaran Manual:
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Bank:</span>
                        <strong className="text-slate-200">Bank Mandiri</strong>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Nomor Rekening:</span>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-cyan-300 font-bold">137-00-2849102-1</strong>
                          <button
                            type="button"
                            onClick={() => handleCopy('1370028491021', 'rekmandiri')}
                            className="text-xs text-cyan-400 hover:text-cyan-300"
                          >
                            {copiedKey === 'rekmandiri' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Atas Nama:</span>
                        <strong className="text-slate-200">PT Arah Market Intelijen</strong>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Total Transfer:</span>
                        <strong className="font-mono text-emerald-400 font-bold text-sm">
                          {formatRupiah(totalAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-300 block">
                      Formulir Konfirmasi Pengirim:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Nama Pemilik Rekening Pengirim *</label>
                        <input
                          type="text"
                          required
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Bank Pengirim</label>
                        <select
                          value={senderBank}
                          onChange={(e) => setSenderBank(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Bank Mandiri">Bank Mandiri</option>
                          <option value="BCA">BCA</option>
                          <option value="BRI">BRI</option>
                          <option value="BNI">BNI</option>
                          <option value="CIMB Niaga">CIMB Niaga</option>
                          <option value="Bank Lainnya">Bank Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nomor Referensi Transfer / Catatan (Opsional)</label>
                      <input
                        type="text"
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        placeholder="Contoh: Ref 20260919-0123 / Jam 14:30 WIB"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Kirim Konfirmasi Transfer
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
