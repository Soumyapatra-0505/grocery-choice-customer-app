/**
 * Grocery Choice Customer App - Orders API Service
 */

import { request } from './client';
import type { CreateOrderPayload, Order } from '../types';
import { normalizeOrder } from '../utils/formatters';

export { normalizeOrder };

export const ordersApi = {
  // POST /orders
  async create(payload: CreateOrderPayload): Promise<Order> {
    const data = await request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return normalizeOrder(data);
  },

  // GET /orders/my-orders
  async getMyOrders(): Promise<Order[]> {
    const data = await request<Order[]>('/orders/my-orders');
    return Array.isArray(data) ? data.map(normalizeOrder) : [];
  },

  // GET /orders/:id
  async getById(id: number): Promise<Order> {
    const data = await request<Order>(`/orders/${id}`);
    return normalizeOrder(data);
  },

  // GET /orders/number/:orderNumber
  async getByNumber(orderNumber: string): Promise<Order> {
    const data = await request<Order>(`/orders/number/${encodeURIComponent(orderNumber)}`);
    return normalizeOrder(data);
  },

  // POST /orders/:id/cancel
  async cancel(id: number): Promise<Order> {
    const data = await request<Order>(`/orders/${id}/cancel`, {
      method: 'POST'
    });
    return normalizeOrder(data);
  }
};
