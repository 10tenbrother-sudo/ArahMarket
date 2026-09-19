import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/authService.js';
import { db } from '../db/database.js';
import { sseBroker } from '../realtime/sse.js';
import {
  isMidtransConfigured,
  getSnapClient,
  verifyMidtransSignature,
} from '../payments/midtransClient.js';

// Indonesian Rupiah (IDR) Pricing tiers
export const PRICING_IDR = {
  PRO: {
    monthly: 499_000,
    annual: 4_788_000, // Rp 399.000 / bln (hemat 20%)
  },
  INSTITUTIONAL: {
    monthly: 1_999_000,
    annual: 19_080_000, // Rp 1.590.000 / bln (hemat 20%)
  },
};

/**
 * PaymentController: Manages checkout session creation, Midtrans Snap integration,
 * and lifecycle updates for subscription plans.
 */
export class PaymentController {
  /**
   * GET /api/payments/config
   * Public configuration for payment options, supported methods, and pricing.
   */
  public static async getPaymentConfig(req: Request, res: Response): Promise<void> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
      (clientKey ? !clientKey.startsWith('SB-') : serverKey ? !serverKey.startsWith('SB-') : false);

    res.json({
      isConfigured: isMidtransConfigured(),
      clientKey,
      isProduction,
      currency: 'IDR',
      pricing: PRICING_IDR,
      manualBank: {
        bank: 'Bank Mandiri',
        billerCode: '70012',
        companyName: 'ArahMarket Intelijen',
        accountNumber: '137-00-2849102-1',
        accountName: 'PT Arah Market Intelijen',
        qrisMerchantName: 'ArahMarket Terminal (QRIS Standar Indonesia)',
      },
    });
  }

  /**
   * POST /api/payments/charge (or /checkout-session)
   * Integrates with Midtrans Snap to create a secure payment session.
   * Explicitly maps:
   *  1. User ID (custom_field1 and customer metadata)
   *  2. Selected Plan (custom_field2, item details, and description)
   *  3. Order ID (transaction_details.order_id & database persistence)
   */
  public static async createCheckoutSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Authentication required to create a checkout session.' });
        return;
      }

      const { plan, billing_cycle = 'monthly' } = req.body;

      // 1. Validate requested tier
      if (!plan || !['PRO', 'INSTITUTIONAL'].includes(plan)) {
        res.status(400).json({ error: 'Invalid subscription plan selected. Choose PRO or INSTITUTIONAL.' });
        return;
      }

      const cycle = billing_cycle === 'annual' ? 'annual' : 'monthly';
      const tierPricing = PRICING_IDR[plan as 'PRO' | 'INSTITUTIONAL'];
      const grossAmount = cycle === 'annual' ? tierPricing.annual : tierPricing.monthly;

      // 2. Generate unique traceable Order ID tied to user ID
      const userPrefix = user.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const orderId = `ARAH-${userPrefix}-${Date.now()}`;
      const planLabel = `ArahMarket ${plan} (${cycle === 'annual' ? '1 Tahun' : '1 Bulan'})`;

      // 3. Persist pending order association directly to database before Snap token generation
      db.updateUser(user.id, {
        last_order_id: orderId,
        billing_cycle: cycle,
        subscription_status: 'pending',
      });

      console.log(`[PaymentController] Initializing checkout session. User: ${user.id} (${user.email}), Plan: ${plan}, Order: ${orderId}, Amount: Rp ${grossAmount}`);

      // 4. If Midtrans credentials are configured, request Snap token from Midtrans API
      if (isMidtransConfigured()) {
        const snap = getSnapClient();

        // Exact mapping required for secure Midtrans checkout
        const snapParameter = {
          transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
          },
          customer_details: {
            first_name: user.name || 'Trader',
            email: user.email,
          },
          item_details: [
            {
              id: `PLAN-${plan}-${cycle.toUpperCase()}`,
              price: grossAmount,
              quantity: 1,
              name: planLabel,
            },
          ],
          // Enable Indonesian payment channels (QRIS & Mandiri Bill Payment / VA prioritized)
          enabled_payments: [
            'qris',
            'gopay',
            'shopeepay',
            'echannel', // Mandiri Bill Payment
            'bca_va',
            'bni_va',
            'bri_va',
            'permata_va',
            'other_va',
          ],
          echannel: {
            bill_info1: 'Pembayaran:',
            bill_info2: planLabel,
          },
          // Custom fields passed through to Webhooks for tamper-proof identification
          custom_field1: user.id,
          custom_field2: plan,
          custom_field3: cycle,
        };

        const transaction = await snap.createTransaction(snapParameter);

        res.json({
          success: true,
          orderId,
          token: transaction.token,
          redirectUrl: transaction.redirect_url,
          grossAmount,
          currency: 'IDR',
          plan,
          billingCycle: cycle,
          isSimulated: false,
        });
        return;
      }

      // 5. Fallback Sandbox Simulation if live server keys are not yet provided
      // Allows zero-failure interactive UI preview with demonstration QRIS and Mandiri Bill codes
      const simulatedBillKey = `88708${Math.floor(10000000 + Math.random() * 90000000)}`;

      res.json({
        success: true,
        orderId,
        token: `demo-snap-token-${Date.now()}`,
        redirectUrl: null,
        grossAmount,
        currency: 'IDR',
        plan,
        billingCycle: cycle,
        isSimulated: true,
        demoDetails: {
          mandiriBillerCode: '70012',
          mandiriBillKey: simulatedBillKey,
          companyName: 'ArahMarket Intelijen',
          qrisString: `00020101021226590014ID.LINKAJA.WWW01189360000201100000000215${orderId}51440014ID.CO.QRIS.WWW0215ID10200238491020303UMI520458125303360540${grossAmount}5802ID5919ARAHMARKET TERMINAL6007JAKARTA61051219062070703A016304D16F`,
        },
      });
    } catch (err: any) {
      console.error('[PaymentController] Error creating checkout session:', err);
      res.status(500).json({
        error: err.message || 'Failed to create Midtrans checkout session.',
      });
    }
  }

  /**
   * POST /api/payments/webhook
   * Official Midtrans webhook notification processor with SHA-512 cryptographic verification.
   */
  public static async handleWebhook(req: Request, res: Response): Promise<void> {
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
        custom_field2, // plan ('PRO' | 'INSTITUTIONAL')
        custom_field3, // billing_cycle ('monthly' | 'annual')
      } = notification;

      console.log(`[PaymentController] Webhook notification received for Order: ${order_id}, Status: ${transaction_status}, Payment Type: ${payment_type}`);

      // Verify SHA-512 signature if keys are configured
      if (isMidtransConfigured()) {
        if (!signature_key) {
          res.status(403).json({ error: 'Missing signature_key in webhook notification.' });
          return;
        }

        const isValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
        if (!isValid) {
          console.warn(`[PaymentController] Webhook REJECTED: Invalid SHA-512 signature for order ${order_id}`);
          res.status(403).json({ error: 'Invalid cryptographic signature' });
          return;
        }
      }

      // Map user by custom_field1 or order ID
      let user = custom_field1 ? db.getUserById(custom_field1) : undefined;
      if (!user && order_id) {
        user = db.getAllUsers().find((u) => u.last_order_id === order_id);
      }

      const targetPlan = (custom_field2 as 'PRO' | 'INSTITUTIONAL') || (order_id.includes('INST') ? 'INSTITUTIONAL' : 'PRO');
      const isAnnual = custom_field3 === 'annual';

      if (
        transaction_status === 'settlement' ||
        (transaction_status === 'capture' && fraud_status === 'accept')
      ) {
        const durationDays = isAnnual ? 365 : 31;
        const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        if (user) {
          db.updateUser(user.id, {
            plan: targetPlan,
            subscription_status: 'active',
            subscription_expires_at: expiryDate,
            payment_method: payment_type || 'midtrans',
          });

          console.log(`[PaymentController] User ${user.id} upgraded to ${targetPlan} until ${expiryDate}`);

          sseBroker.broadcast('user_plan_updated', {
            userId: user.id,
            plan: targetPlan,
            status: 'active',
            expiresAt: expiryDate,
          });
        }
      } else if (
        transaction_status === 'expire' ||
        transaction_status === 'cancel' ||
        transaction_status === 'deny'
      ) {
        if (user && user.subscription_status === 'pending') {
          db.updateUser(user.id, {
            subscription_status: 'none',
          });
        }
      }

      res.status(200).json({ status: 'OK' });
    } catch (err: any) {
      console.error('[PaymentController] Webhook handling error:', err);
      res.status(500).json({ error: err.message || 'Internal webhook error' });
    }
  }

  /**
   * POST /api/payments/simulate-success
   * Allows sandbox simulation of payment settlement.
   */
  public static async simulatePaymentSuccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { orderId, plan = 'PRO', billing_cycle = 'monthly' } = req.body;

      const isAnnual = billing_cycle === 'annual';
      const durationDays = isAnnual ? 365 : 31;
      const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const targetPlan = plan === 'INSTITUTIONAL' ? 'INSTITUTIONAL' : 'PRO';

      const updatedUser = db.updateUser(user.id, {
        plan: targetPlan,
        subscription_status: 'active',
        subscription_expires_at: expiryDate,
        payment_method: 'midtrans_sandbox',
        last_order_id: orderId || `SIM-${Date.now()}`,
      });

      sseBroker.broadcast('user_plan_updated', {
        userId: user.id,
        plan: targetPlan,
        status: 'active',
        expiresAt: expiryDate,
      });

      res.json({
        success: true,
        message: `Simulasi pembayaran berhasil! Akun Anda aktif di paket ${targetPlan}.`,
        user: updatedUser,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/payments/manual-confirm
   * Records manual bank transfer receipt for administrative verification.
   */
  public static async submitManualPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { plan, senderName, senderBank, transferAmount, referenceNote } = req.body;

      if (!senderName || !transferAmount) {
        res.status(400).json({ error: 'Nama pengirim dan nominal transfer wajib diisi.' });
        return;
      }

      db.updateUser(user.id, {
        subscription_status: 'pending',
        payment_method: `manual_${senderBank || 'bank_transfer'}`,
      });

      console.log(`[PaymentController] Manual payment submitted: User ${user.email}, Plan: ${plan}, Amount: ${transferAmount}, Note: ${referenceNote}`);

      res.json({
        success: true,
        message: 'Konfirmasi transfer diterima. Tim admin akan memverifikasi mutasi dalam 15-30 menit.',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
