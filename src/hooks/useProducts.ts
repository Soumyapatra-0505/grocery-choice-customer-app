/**
 * Grocery Choice Customer App - useProducts Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { productsApi } from '@/api/products';

export function useProducts(categoryId?: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Product[] = [];
      if (categoryId) {
        data = await productsApi.getByCategory(categoryId);
      } else {
        data = await productsApi.getAll();
      }
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    refresh: fetchProducts
  };
}
