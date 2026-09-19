import { Router } from 'express';
import { requireAuth } from '../auth/authService.js';
import { PaymentController, PRICING_IDR } from '../controllers/paymentController.js';

export const paymentRouter = Router();

// Re-export PRICING_IDR for backwards compatibility
export { PRICING_IDR };

// Public payment configuration & pricing
paymentRouter.get('/config', PaymentController.getPaymentConfig);

// Initialize checkout session & generate Midtrans Snap token
// Supported at both /charge and /checkout-session for client flexibility
paymentRouter.post('/charge', requireAuth, PaymentController.createCheckoutSession);
paymentRouter.post('/checkout-session', requireAuth, PaymentController.createCheckoutSession);

// Midtrans HTTP notification webhook
paymentRouter.post('/webhook', PaymentController.handleWebhook);

// Sandbox simulation & testing routes
paymentRouter.post('/simulate-success', requireAuth, PaymentController.simulatePaymentSuccess);
paymentRouter.post('/manual-confirm', requireAuth, PaymentController.submitManualPayment);
