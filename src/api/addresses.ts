/**
 * Grocery Choice Customer App - Customer Address API Service
 */

import { request } from './client';
import { Address } from '@/types';

export const addressApi = {
  // GET /addresses
  async getAll(): Promise<Address[]> {
    const data = await request<Address[]>('/addresses');
    return Array.isArray(data) ? data : [];
  },

  // GET /addresses/:id
  async getById(id: number): Promise<Address> {
    return await request<Address>(`/addresses/${id}`);
  },

  // POST /addresses
  async create(payload: Partial<Address>): Promise<Address> {
    return await request<Address>('/addresses', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // PUT /addresses/:id
  async update(id: number, payload: Partial<Address>): Promise<Address> {
    return await request<Address>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  // DELETE /addresses/:id
  async delete(id: number): Promise<void> {
    return await request<void>(`/addresses/${id}`, {
      method: 'DELETE'
    });
  },

  // PATCH /addresses/:id/default
  async setDefault(id: number): Promise<Address> {
    return await request<Address>(`/addresses/${id}/default`, {
      method: 'PATCH'
    });
  }
};
