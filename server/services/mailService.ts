/**
 * Mailer Service using NodeMailer
 * Sends transactional emails including Account Email Verification links.
 * Automatically switches between live SMTP (e.g. Gmail / Brevo / SendGrid)
 * and secure dev mode logging when SMTP credentials are not yet specified.
 */

import nodemailer, { Transporter } from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  verificationUrl: string;
  devMode: boolean;
  error?: string;
}

export interface SentEmailLog {
  to: string;
  name: string;
  subject: string;
  verificationUrl: string;
  token: string;
  sentAt: string;
}

class MailService {
  private transporter: Transporter | null = null;
  private isConfiguredState = false;
  private lastSentEmail: SentEmailLog | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    const host = process.env.SMTP_HOST || (user?.includes('@gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (user && pass && host) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
        });
        this.isConfiguredState = true;
        console.log(`[MailService] Transporter connected to SMTP server (${host}:${port}) for user ${user}`);
      } catch (err) {
        console.error('[MailService] Failed to initialize SMTP transporter:', err);
        this.transporter = null;
        this.isConfiguredState = false;
      }
    } else {
      this.isConfiguredState = false;
      console.log(
        '[MailService] SMTP_USER & SMTP_PASS not set in environment. Running in development simulation mode. ' +
        'Verification links will be logged to console and returned in dev responses.'
      );
    }
  }

  public isConfigured(): boolean {
    return this.isConfiguredState && this.transporter !== null;
  }

  public getLastSentEmail(): SentEmailLog | null {
    return this.lastSentEmail;
  }

  /**
   * Generates the verification link and sends the verification email.
   */
  public async sendVerificationEmail(
    toEmail: string,
    name: string,
    token: string,
    baseUrl: string
  ): Promise<EmailSendResult> {
    // Standardize base URL
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const verificationUrl = `${cleanBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    // Save in in-memory debug log
    this.lastSentEmail = {
      to: toEmail,
      name,
      subject: 'Aktivasi Akun ArahMarket • Verifikasi Email Anda',
      verificationUrl,
      token,
      sentAt: new Date().toISOString(),
    };

    const fromAddress =
      process.env.MAIL_FROM ||
      (process.env.SMTP_USER ? `"ArahMarket Terminal" <${process.env.SMTP_USER}>` : '"ArahMarket Terminal" <noreply@arahmarket.com>');

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email ArahMarket</title>
  <style>
    body { margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .wrapper { max-width: 560px; margin: 40px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { padding: 32px 32px 24px; border-bottom: 1px solid #1e293b; text-align: center; background: linear-gradient(180deg, #0f172a 0%, #080e1e 100%); }
    .logo-badge { display: inline-block; background-color: #0891b2; color: #020617; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px; letter-spacing: 1px; font-family: monospace; }
    .title { font-size: 20px; font-weight: 700; margin: 16px 0 6px; color: #f1f5f9; font-family: monospace; }
    .subtitle { font-size: 13px; color: #94a3b8; margin: 0; }
    .content { padding: 32px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    .user-greeting { font-size: 16px; font-weight: 600; color: #f8fafc; margin-bottom: 12px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #06b6d4; color: #020617 !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 14px 0 rgba(6, 182, 212, 0.39); }
    .link-box { background-color: #020617; border: 1px solid #334155; border-radius: 8px; padding: 12px; word-break: break-all; font-family: monospace; font-size: 11px; color: #38bdf8; margin-top: 16px; }
    .notice { font-size: 12px; color: #64748b; margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e293b; }
    .footer { padding: 24px 32px; background-color: #080e1e; font-size: 11px; color: #475569; text-align: center; font-family: monospace; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">NEXUS • ARAHMARKET</div>
      <h1 class="title">Verifikasi Akun Trading Anda</h1>
      <p class="subtitle">Satu langkah lagi untuk membuka akses Institutional Macro Surveillance</p>
    </div>
    <div class="content">
      <div class="user-greeting">Halo ${name || 'Trader'},</div>
      <p>Terima kasih telah mendaftar di <strong>ArahMarket Terminal</strong>. Untuk menjaga keamanan platform dan memastikan keabsahan akun pengguna, silakan lakukan konfirmasi alamat email Anda.</p>
      
      <div class="btn-container">
        <a href="${verificationUrl}" target="_blank" class="btn">AKTIFKAN AKUN SAYA</a>
      </div>

      <p style="font-size: 12px; color: #94a3b8;">Atau salin dan tempelkan tautan aktivasi berikut langsung ke peramban (browser) Anda:</p>
      <div class="link-box">${verificationUrl}</div>

      <div class="notice">
        <p style="margin: 0 0 6px;">⏱ <strong>Masa Berlaku:</strong> Tautan ini hanya berlaku selama <strong>24 jam</strong>.</p>
        <p style="margin: 0;">🛡 <em>Jika Anda tidak pernah mendaftar di ArahMarket, silakan abaikan pesan ini. Akun yang tidak diverifikasi akan dihapus secara otomatis.</em></p>
      </div>
    </div>
    <div class="footer">
      ARAHMARKET INTELLIGENCE TERMINAL • SECURE VERIFICATION GATEWAY
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Halo ${name || 'Trader'},

Terima kasih telah mendaftar di ArahMarket Terminal.
Silakan klik tautan berikut untuk memverifikasi email dan mengaktifkan akun Anda:

${verificationUrl}

Tautan ini berlaku selama 24 jam.
Jika Anda tidak merasa mendaftar di ArahMarket, abaikan email ini.

Salam,
Tim ArahMarket
    `.trim();

    // If live SMTP is ready, send real email
    if (this.transporter && this.isConfiguredState) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: 'Aktivasi Akun ArahMarket • Verifikasi Email Anda',
          text: textContent,
          html: htmlContent,
        });

        console.log(`[MailService] Email sent successfully to ${toEmail}. MessageId: ${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
          verificationUrl,
          devMode: false,
        };
      } catch (err: any) {
        console.error(`[MailService] Failed to deliver email to ${toEmail}:`, err);
        return {
          success: false,
          verificationUrl,
          devMode: false,
          error: err.message || 'Gagal mengirim email via SMTP server.',
        };
      }
    }

    // Dev mode / Fallback: print prominently to server console
    console.log('\n' + '='.repeat(70));
    console.log(`[MailService DEV SIMULATION] Verification Email to: ${toEmail} (${name})`);
    console.log(`[MailService DEV SIMULATION] Verification URL:`);
    console.log(`  >>> ${verificationUrl}`);
    console.log('='.repeat(70) + '\n');

    return {
      success: true,
      verificationUrl,
      devMode: true,
    };
  }
}

export const mailService = new MailService();
