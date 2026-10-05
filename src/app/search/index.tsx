/**
 * Grocery Choice Customer App - Search Screen
 * Premium, production-quality quick-commerce search.
 * Fast, debounced, responsive, mobile-first design.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Keyboard,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { APP_CONFIG } from '@/constants/config';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product } from '@/types';
import { productsApi } from '@/api/products';
import { storage, storageService } from '@/storage/storage';
import { useCart } from '@/services/cartContext';
import { formatCurrency } from '@/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate exact 2-column card width with 16px screen padding and 12px gap
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 12) / 2);

const POPULAR_SUGGESTIONS = [
  { name: 'Fresh Milk', emoji: '🥛' },
  { name: 'Brown Bread', emoji: '🍞' },
  { name: 'Farm Eggs', emoji: '🥚' },
  { name: 'Bananas', emoji: '🍌' },
  { name: 'Amul Butter', emoji: '🧈' },
  { name: 'Potato Chips', emoji: '🥨' },
  { name: 'Aashirvaad Atta', emoji: '🌾' },
  { name: 'Maggi Noodles', emoji: '🍜' },
  { name: 'Cold Drinks', emoji: '🧃' },
  { name: 'Filter Coffee', emoji: '☕' },
  { name: 'Fresh Curd', emoji: '🥣' },
  { name: 'Paneer', emoji: '🧀' }
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const { itemCount, subtotal } = useCart();

  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(
    params.categoryId ? Number(params.categoryId) : undefined
  );
  const [activeCategoryName, setActiveCategoryName] = useState<string | undefined>(
    params.categoryName || undefined
  );

  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTimeoutRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  // Load recent searches on mount
  useEffect(() => {
    async function loadRecent() {
      try {
        const recents = await storageService.getRecentSearches();
        if (recents && Array.isArray(recents)) {
          setRecentSearches(recents);
        }
      } catch {
        // Fallback
      }
    }
    loadRecent();
  }, []);

  // Execute search API request
  const executeSearch = useCallback(async (searchTerm: string, catId?: number) => {
    const clean = searchTerm.trim();
    if (!clean && !catId) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      let items: Product[] = [];
      if (catId && !clean) {
        items = await productsApi.getByCategory(catId);
      } else if (clean) {
        items = await productsApi.search(clean);
        if (catId) {
          items = items.filter((p) => p.categoryId === catId);
        }
        // Save to recents
        if (clean.length >= 2) {
          await storageService.addRecentSearch(clean);
          const updated = await storageService.getRecentSearches();
          if (updated) setRecentSearches(updated);
        }
      }
      setResults(items);
    } catch (err: any) {
      setError(err.message || 'Unable to load search results');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Preload category if opened with category filter
  useEffect(() => {
    if (params.categoryId) {
      const catId = Number(params.categoryId);
      setActiveCategoryId(catId);
      setActiveCategoryName(params.categoryName);
      executeSearch('', catId);
    }
  }, [params.categoryId, params.categoryName, executeSearch]);

  // Debounced input change
  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim() && !activeCategoryId) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(text, activeCategoryId);
    }, 300);
  };

  const handleSelectTerm = (term: string) => {
    setQuery(term);
    Keyboard.dismiss();
    executeSearch(term, activeCategoryId);
  };

  const handleClear = () => {
    setQuery('');
    if (activeCategoryId) {
      executeSearch('', activeCategoryId);
    } else {
      setResults([]);
      setHasSearched(false);
    }
    inputRef.current?.focus();
  };

  const handleClearCategoryFilter = () => {
    setActiveCategoryId(undefined);
    setActiveCategoryName(undefined);
    if (query.trim()) {
      executeSearch(query, undefined);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const handleClearRecentSearches = async () => {
    try {
      await storage.remove(APP_CONFIG.STORAGE_KEYS.RECENT_SEARCHES);
      setRecentSearches([]);
    } catch {
      setRecentSearches([]);
    }
  };

  // Free delivery calculation for floating cart
  const freeDeliveryThreshold = APP_CONFIG.FREE_DELIVERY_THRESHOLD;
  const isFreeDeliveryUnlocked = subtotal >= freeDeliveryThreshold;
  const amountRemaining = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* ================================================== */}
      {/* 1. TOP SEARCH INPUT HEADER                         */}
      {/* ================================================== */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Search Input Box */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleQueryChange}
            placeholder={
              activeCategoryName
                ? `Search in ${activeCategoryName}...`
                : 'Search milk, bread, fruits, snacks...'
            }
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus={!params.categoryId}
            returnKeyType="search"
            onSubmitEditing={() => executeSearch(query, activeCategoryId)}
            accessibilityRole="search"
            accessibilityLabel="Search input field"
          />

          {query.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.micPill}>
              <Text style={styles.micIcon}>🎙️</Text>
            </View>
          )}
        </View>
      </View>

      {/* Category Filter Pill Bar (when category is selected) */}
      {activeCategoryName && (
        <View style={styles.categoryFilterBar}>
          <View style={styles.categoryFilterPill}>
            <Text style={styles.categoryFilterText}>
              In Category: <Text style={{ fontWeight: typography.weights.extrabold }}>{activeCategoryName}</Text>
            </Text>
            <TouchableOpacity
              onPress={handleClearCategoryFilter}
              style={styles.categoryFilterClear}
              accessibilityRole="button"
              accessibilityLabel="Clear category filter"
            >
              <Text style={styles.categoryFilterClearText}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================================================== */}
      {/* 2. MAIN SCROLL CONTENT                             */}
      {/* ================================================== */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: itemCount > 0 ? 100 : 32 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State: 2-column Skeleton Cards */}
        {isLoading ? (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>Searching fresh catalog...</Text>
            <View style={styles.grid}>
              {[1, 2, 3, 4].map((key) => (
                <View
                  key={key}
                  style={[styles.skeletonCard, { width: CARD_WIDTH }]}
                >
                  <View style={styles.skeletonImageArea} />
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: '60%' }]} />
                </View>
              ))}
            </View>
          </View>
        ) : error ? (
          /* Error State with Retry Button */
          <View style={styles.errorBox}>
            <EmptyState
              icon="⚠️"
              title="Couldn't load search results"
              description={error}
              actionLabel="Try Again"
              onAction={() => executeSearch(query, activeCategoryId)}
            />
          </View>
        ) : hasSearched && results.length === 0 ? (
          /* Empty Search State */
          <View style={styles.emptyBox}>
            <EmptyState
              icon="🔎"
              title="No matches found"
              description={`We couldn't find any items matching "${query}". Check for spelling or search for popular grocery essentials.`}
              actionLabel="Clear Search"
              onAction={handleClear}
            />
          </View>
        ) : hasSearched ? (
          /* 3. Product Results Grid */
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsCount}>
                {results.length} {results.length === 1 ? 'product found' : 'products found'}
              </Text>
              <Text style={styles.slaHint}>⚡ 10–15 MINS DELIVERY</Text>
            </View>

            <View style={styles.grid}>
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  style={{ width: CARD_WIDTH, marginBottom: spacing.md }}
                />
              ))}
            </View>
          </View>
        ) : (
          /* 4. Default State: Recent Searches + Popular Suggestions */
          <View>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sectionIcon}>⏱</Text>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClearRecentSearches}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all recent searches"
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.chipsRow}>
                  {recentSearches.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.75}
                      onPress={() => handleSelectTerm(item)}
                      style={styles.recentChip}
                      accessibilityRole="button"
                      accessibilityLabel={`Search for ${item}`}
                    >
                      <Text style={styles.recentChipText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Suggestions */}
            <View style={styles.popularSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sectionIcon}>🔥</Text>
                  <Text style={styles.sectionTitle}>Popular Searches</Text>
                </View>
              </View>

              <View style={styles.popularGrid}>
                {POPULAR_SUGGESTIONS.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.75}
                    onPress={() => handleSelectTerm(item.name)}
                    style={styles.popularCard}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${item.name}`}
                  >
                    <View style={styles.popularCardLeft}>
                      <Text style={styles.popularEmoji}>{item.emoji}</Text>
                      <Text style={styles.popularCardText}>{item.name}</Text>
                    </View>
                    <Text style={styles.popularArrow}>↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================================================== */}
      {/* 5. FLOATING CART CTA (when cart has items)         */}
      {/* ================================================== */}
      {itemCount > 0 && (
        <View style={styles.floatingCartContainer} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => router.push('/cart')}
            style={styles.floatingCart}
            accessibilityRole="button"
            accessibilityLabel={`View Cart, ${itemCount} items, total ${formatCurrency(subtotal)}`}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartBadgeCircle}>
                <Text style={styles.cartBadgeCount}>{itemCount}</Text>
              </View>
              <View>
                <Text style={styles.floatingCartItemsText}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}  •  {formatCurrency(subtotal)}
                </Text>
                <Text style={styles.floatingCartSubtext}>
                  {isFreeDeliveryUnlocked
                    ? '🎉 Free delivery applied'
                    : `Add ₹${amountRemaining} for free delivery`}
                </Text>
              </View>
            </View>

            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartActionText}>View Cart</Text>
              <Text style={styles.floatingCartArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },

  /* 1. Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border
  },
  backArrow: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    marginTop: -2
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.sm + 2,
    height: 44
  },
  searchIcon: {
    fontSize: 15,
    marginRight: spacing.xs
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.sm + 1,
    color: colors.textPrimary,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {})
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearIcon: {
    fontSize: 11,
    color: '#334155',
    fontWeight: typography.weights.bold
  },
  micPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  micIcon: {
    fontSize: 11
  },

  /* Category Filter Pill Bar */
  categoryFilterBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0'
  },
  categoryFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  categoryFilterText: {
    fontSize: typography.sizes.xs,
    color: '#065F46',
    fontWeight: typography.weights.medium
  },
  categoryFilterClear: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  categoryFilterClearText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#059669'
  },

  /* Main Content */
  content: {
    backgroundColor: colors.background,
    padding: spacing.md
  },

  /* Sections */
  recentSection: {
    marginBottom: spacing.lg
  },
  popularSection: {
    marginBottom: spacing.lg
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  sectionIcon: {
    fontSize: 15
  },
  sectionTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  clearAllText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary
  },

  /* Recent Chips */
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  recentChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    ...shadows.sm
  },
  recentChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary
  },

  /* Popular Suggestions Grid */
  popularGrid: {
    gap: spacing.xs
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    ...shadows.sm
  },
  popularCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  popularEmoji: {
    fontSize: 18
  },
  popularCardText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary
  },
  popularArrow: {
    fontSize: 14,
    color: colors.textMuted
  },

  /* Results Grid */
  resultsSection: {
    marginTop: spacing.xs
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  resultsCount: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary
  },
  slaHint: {
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  /* Skeletons */
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  skeletonImageArea: {
    height: 120,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.sm,
    marginBottom: spacing.xs
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 6
  },

  /* Empty & Error */
  emptyBox: {
    paddingVertical: spacing.xl
  },
  errorBox: {
    paddingVertical: spacing.xl
  },

  /* Floating Cart CTA */
  floatingCartContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 99
  },
  floatingCart: {
    backgroundColor: '#059669',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#10B981',
    ...shadows.lg
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  cartBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartBadgeCount: {
    color: '#FFFFFF',
    fontWeight: typography.weights.extrabold,
    fontSize: 12
  },
  floatingCartItemsText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold
  },
  floatingCartSubtext: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: typography.weights.medium
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: 4
  },
  floatingCartActionText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold
  },
  floatingCartArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weights.bold
  }
});
