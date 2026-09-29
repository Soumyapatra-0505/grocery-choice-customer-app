/**
 * Grocery Choice Customer App - Products API Service
 */

import { request } from './client';
import { Product } from '@/types';
import { APP_CONFIG } from '@/constants/config';
import { calculateDiscount } from '@/utils/formatters';

export function normalizeProduct(raw: any): Product {
  if (!raw) {
    throw new Error('Invalid product data');
  }

  const stockQuantity =
    raw.stockQuantity !== undefined && raw.stockQuantity !== null
      ? Number(raw.stockQuantity)
      : 0;

  const isAvailable = raw.active !== false && stockQuantity > 0;
  const mrp = raw.mrp !== undefined && raw.mrp !== null ? Number(raw.mrp) : 0;
  const sellingPrice =
    raw.sellingPrice !== undefined && raw.sellingPrice !== null ? Number(raw.sellingPrice) : mrp;

  const discountPercentage = calculateDiscount(mrp, sellingPrice);

  const categoryId =
    raw.categoryId !== undefined && raw.categoryId !== null
      ? Number(raw.categoryId)
      : typeof raw.category === 'object' && raw.category?.id !== undefined
      ? Number(raw.category.id)
      : 0;

  const rawCatName =
    typeof raw.category === 'object' && raw.category?.name
      ? raw.category.name
      : raw.categoryName || (typeof raw.category === 'string' ? raw.category : 'General');

  const categoryName = rawCatName || 'General';
  const categorySlug =
    raw.categorySlug ||
    categoryName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-');

  return {
    id: Number(raw.id),
    name: raw.name || 'Unnamed Item',
    description: raw.description || '',
    sku: raw.sku || '',
    categoryId,
    categoryName,
    categorySlug,
    unit: raw.unit || '1 pc',
    mrp,
    sellingPrice,
    discountPercentage,
    stockQuantity,
    inStock: isAvailable,
    active: raw.active !== false,
    imageUrl: raw.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE,
    rating: raw.rating || 4.8,
    reviewCount: raw.reviewCount || 42,
    isPopular: discountPercentage > 0 || raw.isPopular === true
  };
}

export const productsApi = {
  // GET /products
  async getAll(): Promise<Product[]> {
    const data = await request<any[]>('/products');
    return (Array.isArray(data) ? data : []).map(normalizeProduct);
  },

  // GET /products/:id
  async getById(id: number): Promise<Product> {
    const data = await request<any>(`/products/${id}`);
    return normalizeProduct(data);
  },

  // GET /products/category/:categoryId
  async getByCategory(categoryId: number): Promise<Product[]> {
    const data = await request<any[]>(`/products/category/${categoryId}`);
    return (Array.isArray(data) ? data : []).map(normalizeProduct);
  },

  // GET /products/search?query=:query
  async search(query: string): Promise<Product[]> {
    if (!query || !query.trim()) return [];
    const data = await request<any[]>(`/products/search?query=${encodeURIComponent(query.trim())}`);
    return (Array.isArray(data) ? data : []).map(normalizeProduct);
  }
};
