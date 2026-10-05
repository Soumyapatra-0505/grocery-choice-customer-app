/**
 * Grocery Choice Customer App - Customer Address API Service
 */

import { request } from './client';
import { Address } from '@/types';
import { normalizeAddress } from '@/utils/formatters';

function toBackendAddressRequest(payload: Partial<Address>) {
  const rawStreet = payload.street || '';
  const parts = rawStreet.includes(',') ? rawStreet.split(',') : [rawStreet];
  const addressLine1 =
    payload.addressLine1 ||
    parts[0]?.trim() ||
    rawStreet.trim() ||
    'Address Line 1';
  const addressLine2 =
    payload.addressLine2 !== undefined
      ? payload.addressLine2
      : parts.length > 1
      ? parts.slice(1).join(',').trim()
      : '';
  const postalCode = payload.postalCode || payload.pincode || '751024';

  return {
    addressLine1,
    addressLine2: addressLine2 || '',
    city: payload.city || 'Bhubaneswar',
    state: payload.state || 'Odisha',
    postalCode,
    landmark: payload.landmark || '',
    isDefault: Boolean(payload.isDefault)
  };
}

export const addressApi = {
  // GET /addresses
  async getAll(): Promise<Address[]> {
    const data = await request<Address[]>('/addresses');
    return Array.isArray(data) ? data.map(normalizeAddress) : [];
  },

  // GET /addresses/:id
  async getById(id: number): Promise<Address> {
    const data = await request<Address>(`/addresses/${id}`);
    return normalizeAddress(data);
  },

  // POST /addresses
  async create(payload: Partial<Address>): Promise<Address> {
    const body = toBackendAddressRequest(payload);
    const data = await request<Address>('/addresses', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return normalizeAddress({ ...payload, ...data });
  },

  // PUT /addresses/:id
  async update(id: number, payload: Partial<Address>): Promise<Address> {
    const body = toBackendAddressRequest(payload);
    const data = await request<Address>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return normalizeAddress({ ...payload, ...data });
  },

  // DELETE /addresses/:id
  async delete(id: number): Promise<void> {
    return await request<void>(`/addresses/${id}`, {
      method: 'DELETE'
    });
  },

  // PATCH /addresses/:id/default
  async setDefault(id: number): Promise<Address> {
    const data = await request<Address>(`/addresses/${id}/default`, {
      method: 'PATCH'
    });
    return normalizeAddress(data);
  }
};
