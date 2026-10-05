/**
 * Grocery Choice Customer App - Payments API Service
 * Secure client for Spring Boot Razorpay payment endpoints.
 */

import { request } from './client';
import {
  RazorpayOrderResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse
} from '@/types';

export const paymentsApi = {
  /**
   * POST /payments/create-order
   * Initiates a Razorpay Test Order for the given internal order ID.
   * Total paise amount is authoritatively calculated on server.
   */
  async createOrder(orderId: number): Promise<RazorpayOrderResponse> {
    return await request<RazorpayOrderResponse>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
  },

  /**
   * POST /payments/verify
   * Verifies Razorpay payment signature server-side.
   * Updates PaymentStatus to PAID upon valid cryptographic verification.
   */
  async verifyPayment(
    payload: PaymentVerificationRequest
  ): Promise<PaymentVerificationResponse> {
    return await request<PaymentVerificationResponse>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId: payload.orderId,
        razorpay_order_id: payload.razorpayOrderId,
        razorpay_payment_id: payload.razorpayPaymentId,
        razorpay_signature: payload.razorpaySignature
      })
    });
  },

  /**
   * POST /payments/fail
   * Records payment failure or user cancellation for an order on the backend.
   */
  async recordFailure(orderId: number): Promise<PaymentVerificationResponse> {
    return await request<PaymentVerificationResponse>('/payments/fail', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
  }
};
