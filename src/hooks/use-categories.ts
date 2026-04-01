'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@/types';

// Module-level cache so all components share one fetch per page load
let cache: Category[] | null = null;
let pending: Promise<Category[]> | null = null;

function fetchCategories(): Promise<Category[]> {
  if (!pending) {
    pending = fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        cache = d.categories ?? [];
        return cache!;
      });
  }
  return pending;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setCategories(cache);
      setLoading(false);
      return;
    }
    fetchCategories().then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  return { categories, loading };
}

export function invalidateCategoryCache() {
  cache = null;
  pending = null;
}
