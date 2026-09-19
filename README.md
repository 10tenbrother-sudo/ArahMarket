# ArahMarket — Panduan Arsitektur Integrasi Payment Gateway (Midtrans Indonesia)

Dokumen ini menjelaskan rancangan arsitektur resmi untuk mengintegrasikan payment gateway Indonesia (**Midtrans Snap & Core API**) ke dalam sistem langganan dan entitlement ArahMarket. Panduan ini berfokus pada **QRIS**, **Mandiri Bill Payment / Virtual Account (E-Channel)**, bank transfer lokal (BCA, BNI, BRI), serta **verifikasi keamanan webhook berbasis kriptografi SHA-512** di backend.

---

## 1. Arsitektur & Prinsip Keamanan Utama

Dalam platform intelijen pasar dan trading terminal ArahMarket, tier langganan menentukan akses data dan kuota:
- **`FREE`**: Polling interval reguler, watchlist maksimal 5 simbol, kuota 2x AI Gemini/hari.
- **`PRO`**: Stream sub-detik (<100ms) via SSE, watchlist hingga 50 simbol, kuota 50x AI Gemini/hari, analisis kausal berita instan.
- **`INSTITUTIONAL`**: Dedicated gateway SLA, watchlist 500 simbol, kuota 500x AI Gemini/hari, scraping channel kustom Telegram, dan telemetri admin.

### ⚠️ Aturan Emas Keamanan (Security Principle)
> **JANGAN PERNAH mengizinkan klien (browser) mengubah atau meng-upgrade plan user secara langsung.**  
> Endpoint dev testing `POST /api/users/subscription` wajib dinonaktifkan di mode production. **Hanya webhook resmi dari Midtrans yang telah diverifikasi tanda tangan keamanannya (Signature Key SHA-512) di server backend yang berhak menaikkan tier langganan user.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT / BROWSER                                │
│                       (src/components/SubscriptionPlans.tsx)                 │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ 1. Pilih Paket (PRO / INSTITUTIONAL)
                                        │    POST /api/payments/midtrans/charge
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND EXPRESS SERVER                             │
│                  (server/routes/midtransPaymentRoutes.ts)                   │
└───────────────────┬───────────────────────────────────▲─────────────────────┘
                    │                                   │
                    │ 2. Request Snap Token / VA        │ 4. Webhook Notifikasi HTTP POST
                    │    (Metadata: userId, plan, durasi)│    POST /api/webhooks/midtrans
                    ▼                                   │    (Validasi Signature SHA-512)
┌───────────────────────────────────────────────────────┴─────────────────────┐
│                         MIDTRANS PAYMENT GATEWAY                            │
│                 (QRIS, Mandiri Bill Payment / VA, BCA, dsb)                 │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ 3. Tampilkan UI Bayar (Snap Popup/VA)
                                        │    User transfer via Livin' Mandiri
                                        │    atau scan QRIS via e-Wallet/BCA
                                        ▼
```

---

## 2. Pemetaan Paket & Konversi IDR (Rupiah)

Harga paket ArahMarket disesuaikan ke mata uang Rupiah (IDR):

| Tier Plan | Siklus Bulanan (Monthly) | Siklus Tahunan (Annual) | Limit Watchlist | Kuota AI Gemini |
| :--- | :--- | :--- | :---: | :---: |
| **FREE** | Rp 0 | Rp 0 | 5 Simbol | 2x / hari |
| **PRO** | Rp 499.000 / bulan | Rp 4.788.000 / tahun (Rp 399rb/bln) | 50 Simbol | 50x / hari |
| **INSTITUTIONAL** | Rp 1.999.000 / bulan | Rp 19.080.000 / tahun (Rp 1.59jt/bln) | 500 Simbol | 500x / hari |

---

## 3. Ekstensi Skema Database

Tambahkan kolom pelacakan pembayaran pada interface `User` di `server/types.ts` dan tabel/koleksi di `server/db/database.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: 'FREE' | 'PRO' | 'INSTITUTIONAL';
  subscription_status?: 'active' | 'pending' | 'expired' | 'canceled';
  subscription_expires_at?: string; // ISO 8601 string
  
  // Data Pembayaran Midtrans
  last_order_id?: string;           // e.g. "ORDER-usr_123-1726748900"
  payment_method?: string;          // e.g. "qris", "echannel" (Mandiri Bill), "bank_transfer"
  billing_cycle?: 'monthly' | 'annual';
}
```

---

## 4. Variabel Lingkungan (`.env.example`)

Daftarkan variabel lingkungan berikut:

```bash
# Midtrans Credentials (bisa diisi Sandbox atau Production)
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxxxxxxxxxxxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxxxxxxxxxxxxxx"
MIDTRANS_IS_PRODUCTION="false"

# URL Publik Aplikasi untuk Callback
APP_URL="http://localhost:3000"
```

---

## 5. Implementasi Backend Midtrans

### Langkah A: Inisialisasi Klien Midtrans (`server/payments/midtransClient.ts`)

Gunakan *lazy initialization* agar backend tidak crash saat boot jika kunci belum diset di tahap dev:

```typescript
import midtransClient from 'midtrans-client';

let snapInstance: any = null;
let coreInstance: any = null;

export function getMidtransSnap() {
  if (!snapInstance) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error('[Midtrans] MIDTRANS_SERVER_KEY belum dikonfigurasi di environment variable.');
    }
    snapInstance = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }
  return snapInstance;
}

export function getMidtransCore() {
  if (!coreInstance) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error('[Midtrans] MIDTRANS_SERVER_KEY belum dikonfigurasi di environment variable.');
    }
    coreInstance = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }
  return coreInstance;
}
```

---

### Langkah B: Pembuatan Sesi Pembayaran Snap (`POST /api/payments/midtrans/charge`)

Endpoint ini dipanggil oleh user yang sudah login saat mengklik tombol upgrade:

```typescript
import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/authService.js';
import { getMidtransSnap } from '../payments/midtransClient.js';
import { db } from '../db/database.js';

export const midtransRouter = Router();

midtransRouter.post('/charge', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { plan, billing_cycle = 'monthly' } = req.body;

    if (!['PRO', 'INSTITUTIONAL'].includes(plan)) {
      return res.status(400).json({ error: 'Hanya paket PRO atau INSTITUTIONAL yang memerlukan pembayaran.' });
    }

    // Kalkulasi nominal IDR
    const prices: Record<string, { monthly: number; annual: number }> = {
      PRO: { monthly: 499_000, annual: 4_788_000 },
      INSTITUTIONAL: { monthly: 1_999_000, annual: 19_080_000 },
    };

    const grossAmount = billing_cycle === 'annual' ? prices[plan].annual : prices[plan].monthly;
    const orderId = `ARAH-${user.id.slice(0, 8)}-${Date.now()}`;

    // Parameter Transaksi Midtrans
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      item_details: [
        {
          id: `PLAN-${plan}-${billing_cycle.toUpperCase()}`,
          price: grossAmount,
          quantity: 1,
          name: `ArahMarket ${plan} Plan (${billing_cycle === 'annual' ? '1 Tahun' : '1 Bulan'})`,
        },
      ],
      // Aktifkan pembayaran favorit Indonesia: QRIS & Mandiri Bill / E-Channel
      enabled_payments: ['qris', 'echannel', 'bca_va', 'bni_va', 'bri_va', 'gopay', 'shopeepay'],
      custom_field1: user.id,
      custom_field2: plan,
      custom_field3: billing_cycle,
    };

    const snap = getMidtransSnap();
    const transaction = await snap.createTransaction(parameter);

    // Simpan order_id sementara ke data user
    db.updateUser(user.id, {
      last_order_id: orderId,
      billing_cycle,
    });

    res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
      gross_amount: grossAmount,
    });
  } catch (err: any) {
    console.error('[Midtrans Charge Error]:', err);
    res.status(500).json({ error: err.message || 'Gagal membuat tagihan Midtrans.' });
  }
});
```

---

### Langkah C: Handler Webhook Aman dengan Verifikasi SHA-512

#### Rumus Keamanan Tanda Tangan Midtrans:
Midtrans menyertakan field `signature_key` di dalam payload HTTP POST webhook. Backend **wajib** menghitung ulang hash SHA-512 dengan rumus:
$$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$

Jika hasil hash tidak sama persis dengan yang dikirimkan Midtrans, maka request **wajib ditolak (HTTP 403 Forbidden)** untuk mencegah serangan injeksi atau pemalsuan tagihan.

Implementasi (`server/routes/midtransWebhook.ts`):

```typescript
import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { db } from '../db/database.js';

export async function handleMidtransWebhook(req: Request, res: Response) {
  try {
    const notification = req.body;
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      custom_field1, // user.id
      custom_field2, // plan target ('PRO' | 'INSTITUTIONAL')
      custom_field3, // billing_cycle ('monthly' | 'annual')
    } = notification;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('[Webhook Midtrans] Server key tidak diset.');
      return res.status(500).send('Server configuration missing');
    }

    // 1. Verifikasi Keaslian Webhook dengan Kriptografi SHA-512
    const rawString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto.createHash('sha512').update(rawString).digest('hex');

    if (calculatedSignature !== signature_key) {
      console.error('[Webhook Midtrans] PERINGATAN KEAMANAN: Signature tidak valid!');
      return res.status(403).json({ error: 'Invalid cryptographic signature' });
    }

    console.log(`[Webhook Midtrans] Validated notification for ${order_id}, Status: ${transaction_status}`);

    const userId = custom_field1;
    const targetPlan = (custom_field2 as 'PRO' | 'INSTITUTIONAL') || 'PRO';
    const isAnnual = custom_field3 === 'annual';

    // 2. Evaluasi Status Pembayaran
    if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
      // Pembayaran BERHASIL (QRIS discan atau Mandiri VA dibayar)
      const durationDays = isAnnual ? 365 : 31;
      const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      if (userId) {
        db.updateUser(userId, {
          plan: targetPlan,
          subscription_status: 'active',
          subscription_expires_at: expiryDate,
          payment_method: payment_type,
        });
        console.log(`[Midtrans] SUKSES: Akun ${userId} berhasil di-upgrade ke ${targetPlan} sampai ${expiryDate}`);
      }
    } else if (transaction_status === 'expire' || transaction_status === 'cancel' || transaction_status === 'deny') {
      // Pembayaran KADALUARSA / GAGAL
      if (userId) {
        const user = db.getUserById(userId);
        if (user && user.subscription_status !== 'active') {
          db.updateUser(userId, {
            subscription_status: 'canceled',
          });
        }
      }
    }

    // Selalu kembalikan HTTP 200 ke Midtrans agar notifikasi tidak di-retry terus menerus
    res.status(200).json({ status: 'OK' });
  } catch (error: any) {
    console.error('[Midtrans Webhook Error]:', error);
    res.status(500).json({ error: error.message || 'Internal webhook error' });
  }
}
```

---

## 6. Integrasi Frontend (`src/components/SubscriptionPlans.tsx`)

### Menyisipkan Script Midtrans Snap ke HTML
Tambahkan script Snap ke `index.html` (gunakan sandbox untuk development):

```html
<!-- Midtrans Snap JS (Sandbox) -->
<script 
  type="text/javascript" 
  src="https://app.sandbox.midtrans.com/snap/snap.js" 
  data-client-key="%VITE_MIDTRANS_CLIENT_KEY%">
</script>
```

### Membuka Modal Pembayaran di Komponen
Saat tombol *"Pilih Paket"* ditekan:

```typescript
declare global {
  interface Window {
    snap?: any;
  }
}

const handlePayWithMidtrans = async (plan: 'PRO' | 'INSTITUTIONAL') => {
  if (!user) {
    onOpenAuth();
    return;
  }

  setLoading(true);
  try {
    const res = await api.createMidtransCharge({
      plan,
      billing_cycle: billingCycle,
    });

    if (window.snap && res.token) {
      // Munculkan popup resmi Snap (User langsung bisa pilih QRIS / Mandiri Bill)
      window.snap.pay(res.token, {
        onSuccess: async (result: any) => {
          console.log('Pembayaran Sukses:', result);
          // Refresh profil user dan watchlist
          const me = await api.getMe();
          onPlanUpdated(me.user);
          alert('Pembayaran berhasil! Paket akun Anda telah aktif.');
        },
        onPending: (result: any) => {
          console.log('Menunggu Pembayaran:', result);
          alert('Silakan selesaikan pembayaran melalui QRIS atau Virtual Account Anda.');
        },
        onError: (err: any) => {
          console.error('Pembayaran Gagal:', err);
          alert('Terjadi kendala dalam proses pembayaran.');
        },
        onClose: () => {
          console.log('User menutup popup tanpa menyelesaikan pembayaran.');
        },
      });
    } else if (res.redirect_url) {
      window.location.href = res.redirect_url;
    }
  } catch (err: any) {
    alert(err.message || 'Gagal memulai pembayaran.');
  } finally {
    setLoading(false);
  }
};
```

---

## 7. Instruksi Spesifik untuk Pengguna Virtual Account Mandiri & QRIS

1. **Pengguna QRIS:**
   - Pop-up Snap akan menampilkan kode QRIS dinamis.
   - Pengguna membuka aplikasi e-wallet (GoPay, OVO, Dana, ShopeePay) atau m-Banking apa saja (BCA, Livin' Mandiri, BRImo, CIMB).
   - Scan QR, masukkan PIN, dan dalam **1–3 detik** Midtrans mengirimkan webhook ke server ArahMarket. Akun langsung aktif seketika.

2. **Pengguna Mandiri Virtual Account (E-Channel):**
   - Pop-up Snap menghasilkan **Kode Perusahaan (Company Code: `70012` dsb)** dan **Nomor Bill (Nomor Pembayaran 12-16 digit)**.
   - Cara bayar di aplikasi **Livin' by Mandiri**:
     1. Buka Livin' by Mandiri $\rightarrow$ Menu **Bayar**.
     2. Pilih Penyedia Jasa / Cari Merchant: **Midtrans** / **ArahMarket**.
     3. Masukkan Kode Pembayaran.
     4. Konfirmasi nama dan nominal, lalu masukkan PIN.
   - Selesai! Webhook `echannel` otomatis memvalidasi pelunasan ke server.

---

## 8. Checklist Keamanan Produksi

- [x] **Enkripsi Signature SHA-512**: Verifikasi `signature_key` wajib diterapkan sebelum memperbarui data di database.
- [x] **Kerahasiaan Server Key**: Simpan `MIDTRANS_SERVER_KEY` secara ketat di environment variable server; jangan pernah memberi prefix `VITE_` atau mengirimkannya ke browser.
- [x] **Protokol HTTPS**: Endpoint notifikasi webhook di dashboard Midtrans wajib menggunakan URL aman (`https://your-domain.com/api/webhooks/midtrans`).
- [x] **Idempotensi Transaksi**: Cek status transaksi saat ini di database agar tidak terjadi perpanjangan durasi ganda bila Midtrans mengirimkan notifikasi ulang.
