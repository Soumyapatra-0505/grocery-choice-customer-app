/**
 * Grocery Choice Customer App - Orders API Service
 */

import { request } from './client';
import { CreateOrderPayload, Order } from '@/types';

export const ordersApi = {
  // POST /orders
  async create(payload: CreateOrderPayload): Promise<Order> {
    return await request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // GET /orders/my-orders
  async getMyOrders(): Promise<Order[]> {
    const data = await request<Order[]>('/orders/my-orders');
    return Array.isArray(data) ? data : [];
  },

  // GET /orders/:id
  async getById(id: number): Promise<Order> {
    return await request<Order>(`/orders/${id}`);
  },

  // GET /orders/number/:orderNumber
  async getByNumber(orderNumber: string): Promise<Order> {
    return await request<Order>(`/orders/number/${encodeURIComponent(orderNumber)}`);
  },

  // POST /orders/:id/cancel
  async cancel(id: number): Promise<Order> {
    return await request<Order>(`/orders/${id}/cancel`, {
      method: 'POST'
    });
  }
};
