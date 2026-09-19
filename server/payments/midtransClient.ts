import crypto from 'node:crypto';
import midtransClient from 'midtrans-client';

let snapInstance: any = null;
let coreInstance: any = null;

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_SERVER_KEY.trim().length > 0);
}

export function getSnapClient(): any {
  if (!snapInstance) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error('[Midtrans] MIDTRANS_SERVER_KEY is not configured in environment variables.');
    }
    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
      (serverKey ? !serverKey.startsWith('SB-') : false);

    snapInstance = new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }
  return snapInstance;
}

export function getCoreApiClient(): any {
  if (!coreInstance) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error('[Midtrans] MIDTRANS_SERVER_KEY is not configured in environment variables.');
    }
    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
      (serverKey ? !serverKey.startsWith('SB-') : false);

    coreInstance = new midtransClient.CoreApi({
      isProduction,
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }
  return coreInstance;
}

/**
 * Validates Midtrans SHA-512 notification signature key
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) return false;

  // Midtrans gross_amount may include .00 or not, normalize if needed
  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const calculatedSignature = crypto.createHash('sha512').update(rawString).digest('hex');

  return calculatedSignature.toLowerCase() === signatureKey.toLowerCase();
}
