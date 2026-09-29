/**
 * Grocery Choice Customer App - API Client
 * REST client connecting to Spring Boot backend.
 */

import { APP_CONFIG } from '@/constants/config';
import { storageService } from '@/storage/storage';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = APP_CONFIG.API_BASE_URL.replace(/\/+$/, '');
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>)
  };

  const token = await storageService.getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const timeoutMs = options.timeoutMs || 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `Server responded with status ${res.status}`;
      let errorData: any = null;

      try {
        errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const text = await res.text();
        if (text) errorMessage = text;
      }

      throw new ApiError(errorMessage, res.status, errorData);
    }

    if (res.status === 204) {
      return null as T;
    }

    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your internet connection.', 408);
    }

    if (err.message && err.message.toLowerCase().includes('network request failed')) {
      throw new ApiError(
        'Unable to connect to Grocery Choice server. Please check your internet.',
        0
      );
    }

    throw new ApiError(err.message || 'An unexpected error occurred.', 500);
  }
}
