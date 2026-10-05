/**
 * Grocery Choice Customer App - Payment Service Abstraction
 * Handles Razorpay checkout initialization, test-mode simulation,
 * server-side verification, duplicate submission locks, and status polling.
 */

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { paymentsApi } from '@/api/payments';
import { ordersApi } from '@/api/orders';
import { APP_CONFIG } from '@/constants/config';
import {
  Order,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  RazorpayOrderResponse
} from '@/types';

// In-flight payment lock map to guard against duplicate payment attempts
const activePaymentLocks = new Set<number>();

export const paymentService = {
  /**
   * Acquires a mutex lock for an order ID.
   * Returns true if lock was acquired, false if payment is already in flight.
   */
  acquireLock(orderId: number): boolean {
    if (activePaymentLocks.has(orderId)) {
      return false;
    }
    activePaymentLocks.add(orderId);
    return true;
  },

  /**
   * Releases mutex lock for an order ID.
   */
  releaseLock(orderId: number): void {
    activePaymentLocks.delete(orderId);
  },

  /**
   * Checks if an order payment is currently locked.
   */
  isLocked(orderId: number): boolean {
    return activePaymentLocks.has(orderId);
  },

  /**
   * Safely loads Razorpay Checkout SDK on web platform.
   */
  loadRazorpayScript(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      return Promise.resolve(false);
    }

    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      return Promise.resolve(true);
    }

    if (typeof document === 'undefined') {
      return Promise.resolve(false);
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      if ((window as any).Razorpay) {
        return Promise.resolve(true);
      }
      return new Promise((resolve) => {
        existing.addEventListener('load', () => resolve(Boolean((window as any).Razorpay)), {
          once: true
        });
        existing.addEventListener('error', () => resolve(false), { once: true });
      });
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(Boolean((window as any).Razorpay));
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Initiates payment order on backend (POST /api/payments/create-order).
   */
  async createPaymentOrder(orderId: number): Promise<RazorpayOrderResponse> {
    return await paymentsApi.createOrder(orderId);
  },

  /**
   * Opens Razorpay checkout safely from Android and iOS using expo-web-browser
   * via the dedicated customer-web payment bridge.
   * Return scheme: grocerychoice://payment/verify
   * Returns parsed redirect parameters on success, handles browser dismissal, and safely manages locks.
   */
  async launchHostedCheckout(
    orderId: number,
    options?: {
      checkoutUrl?: string;
      webBaseUrl?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
    }
  ): Promise<{
    type: 'SUCCESS' | 'CANCELLED' | 'UNAVAILABLE' | 'ERROR';
    url?: string;
    params?: {
      orderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    error?: string;
  }> {
    // 1. Acquire mutex lock against duplicate payment attempts
    if (!this.acquireLock(orderId)) {
      return {
        type: 'ERROR',
        error: 'Payment transaction is already in progress for this order.'
      };
    }

    try {
      // 2. Obtain Razorpay Order and public key from backend
      const rzpOrder = await this.createPaymentOrder(orderId);
      if (!rzpOrder || !rzpOrder.razorpayOrderId) {
        throw new Error('Failed to create Razorpay payment order on server.');
      }

      // 3. Resolve customer-web payment bridge URL
      const returnUrl = Linking.createURL('payment/verify', { scheme: 'grocerychoice' });
      let checkoutUrl =
        options?.checkoutUrl ||
        (rzpOrder as any).checkoutUrl ||
        (rzpOrder as any).checkout_url ||
        (rzpOrder as any).paymentUrl ||
        (rzpOrder as any).payment_url ||
        (rzpOrder as any).short_url;

      if (!checkoutUrl) {
        // Build URL for the dedicated customer-web payment bridge
        const webBaseUrl = options?.webBaseUrl || APP_CONFIG.CUSTOMER_WEB_URL;
        if (webBaseUrl && rzpOrder.razorpayKeyId) {
          const queryParams: Record<string, string> = {
            orderId: String(orderId),
            razorpay_order_id: rzpOrder.razorpayOrderId,
            key: rzpOrder.razorpayKeyId,
            amount: String(rzpOrder.amount),
            currency: rzpOrder.currency || 'INR',
            return_url: returnUrl
          };
          if (options?.customerName) queryParams.name = options.customerName;
          if (options?.customerEmail) queryParams.email = options.customerEmail;
          if (options?.customerPhone) queryParams.contact = options.customerPhone;

          const queryString = Object.entries(queryParams)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');

          checkoutUrl = `${webBaseUrl.replace(/\/+$/, '')}/payment/bridge?${queryString}`;
        }
      }

      if (!checkoutUrl) {
        return {
          type: 'UNAVAILABLE',
          error:
            'Payment bridge URL could not be resolved from configuration or backend response.'
        };
      }

      // 4. Open in-app browser session on Android/iOS via expo-web-browser
      const authResult = await WebBrowser.openAuthSessionAsync(
        checkoutUrl,
        returnUrl
      );

      if (authResult.type === 'success' && authResult.url) {
        const parsed = Linking.parse(authResult.url);
        const queryParams = (parsed.queryParams || {}) as Record<string, string>;

        // Check if user cancelled inside bridge (e.g. status=CANCELLED or status=FAILED)
        if (queryParams.status === 'CANCELLED') {
          try {
            await this.recordFailure(orderId);
          } catch {
            // Ignore failure logging notice
          }
          return { type: 'CANCELLED' };
        }

        if (queryParams.status === 'FAILED') {
          try {
            await this.recordFailure(orderId);
          } catch {
            // Ignore failure logging notice
          }
          return {
            type: 'ERROR',
            error: queryParams.errorMessage || 'Payment was declined by issuing bank.'
          };
        }

        return {
          type: 'SUCCESS',
          url: authResult.url,
          params: {
            orderId: String(orderId),
            razorpay_order_id:
              queryParams.razorpay_order_id || queryParams.razorpayOrderId,
            razorpay_payment_id:
              queryParams.razorpay_payment_id || queryParams.razorpayPaymentId,
            razorpay_signature:
              queryParams.razorpay_signature || queryParams.razorpaySignature
          }
        };
      } else {
        // User dismissed or cancelled the browser session
        try {
          await this.recordFailure(orderId);
        } catch {
          // Ignore failure logging notice
        }
        return { type: 'CANCELLED' };
      }
    } catch (err: any) {
      return {
        type: 'ERROR',
        error: err.message || 'Payment gateway launch encountered an error.'
      };
    } finally {
      this.releaseLock(orderId);
    }
  },

  /**
   * Verifies signature on backend (POST /api/payments/verify).
   */
  async verifyPayment(
    payload: PaymentVerificationRequest
  ): Promise<PaymentVerificationResponse> {
    return await paymentsApi.verifyPayment(payload);
  },

  /**
   * Records failure or cancellation on backend (POST /api/payments/fail).
   */
  async recordFailure(orderId: number): Promise<PaymentVerificationResponse> {
    return await paymentsApi.recordFailure(orderId);
  },

  /**
   * Polls order status to handle network drop or async webhook verification.
   */
  async pollOrderStatus(
    orderId: number,
    maxAttempts = 5,
    intervalMs = 3000
  ): Promise<Order | null> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const order = await ordersApi.getById(orderId);
        if (order && (order.paymentStatus === 'PAID' || order.paymentStatus === 'FAILED')) {
          return order;
        }
      } catch {
        // Continue polling
      }
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    try {
      return await ordersApi.getById(orderId);
    } catch {
      return null;
    }
  }
};
