/**
 * Grocery Choice Customer App - Categories API Service
 */

import { request } from './client';
import { Category } from '@/types';
import { APP_CONFIG } from '@/constants/config';

export function normalizeCategory(raw: any): Category {
  if (!raw) {
    throw new Error('Invalid category data');
  }

  const name = raw.name || 'Category';
  const slug =
    raw.slug ||
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-');

  return {
    id: Number(raw.id),
    name,
    description: raw.description || '',
    imageUrl: raw.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE,
    active: raw.active !== false,
    slug,
    itemCount: raw.itemCount || 'Fresh items'
  };
}

export const categoriesApi = {
  // GET /categories
  async getAll(): Promise<Category[]> {
    const data = await request<any[]>('/categories');
    return (Array.isArray(data) ? data : []).map(normalizeCategory);
  },

  // GET /categories/:id
  async getById(id: number): Promise<Category> {
    const data = await request<any>(`/categories/${id}`);
    return normalizeCategory(data);
  }
};
