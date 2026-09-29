/**
 * Grocery Choice Customer App - Auth API Service
 */

import { request } from './client';
import { User } from '@/types';

export interface VerifyOtpResponse {
  token: string;
  user: User;
  message?: string;
}

export const authApi = {
  // POST /auth/send-otp
  async sendOtp(identifier: string, purpose: string = 'LOGIN'): Promise<{ message: string }> {
    return await request<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, purpose })
    });
  },

  // POST /auth/verify-otp
  async verifyOtp(
    identifier: string,
    otp: string,
    name: string = ''
  ): Promise<VerifyOtpResponse> {
    return await request<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, name })
    });
  },

  // GET /auth/me
  async getProfile(): Promise<User> {
    return await request<User>('/auth/me');
  },

  // PUT /auth/me
  async updateProfile(profileData: Partial<User>): Promise<User> {
    return await request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // GET /auth/dev-otp/:identifier (Development mode convenience)
  async getDevOtp(identifier: string): Promise<{ otp: string }> {
    return await request<{ otp: string }>(`/auth/dev-otp/${encodeURIComponent(identifier)}`);
  }
};
