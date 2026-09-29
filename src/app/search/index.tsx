/**
 * Grocery Choice Customer App - Search Screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { ProductCard } from '@/components/ui/ProductCard';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product } from '@/types';
import { productsApi } from '@/api/products';
import { storageService } from '@/storage/storage';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTimeoutRef = useRef<any>(null);

  // Load recent searches
  useEffect(() => {
    async function loadRecent() {
      const recents = await storageService.getRecentSearches();
      if (recents && Array.isArray(recents)) {
        setRecentSearches(recents);
      }
    }
    loadRecent();
  }, []);

  // Category filter preload
  useEffect(() => {
    if (params.categoryId) {
      setIsLoading(true);
      productsApi
        .getByCategory(Number(params.categoryId))
        .then((items) => {
          setResults(items);
          setHasSearched(true);
        })
        .finally(() => setIsLoading(false));
    }
  }, [params.categoryId]);

  const handleSearchChange = (text: string) => {
    setQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      if (!params.categoryId) {
        setResults([]);
        setHasSearched(false);
      }
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const found = await productsApi.search(text.trim());
        setResults(found);
        await storageService.addRecentSearch(text.trim());
        const updated = await storageService.getRecentSearches();
        if (updated) setRecentSearches(updated);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    handleSearchChange(term);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Top Search Input Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={handleSearchChange}
            placeholder={
              params.categoryName
                ? `Search within ${params.categoryName}...`
                : 'Search milk, bread, snacks, vegetables...'
            }
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus={!params.categoryId}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recent Searches Pills (when query is empty and not category filtered) */}
        {!hasSearched && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.chipsRow}>
              {recentSearches.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleRecentClick(item)}
                  style={styles.recentChip}
                >
                  <Text style={styles.recentChipIcon}>⏱</Text>
                  <Text style={styles.recentChipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <LoadingIndicator label="Searching catalog..." />
        ) : hasSearched && results.length === 0 ? (
          <EmptyState
            icon="🔎"
            title="No matches found"
            description={`We couldn't find anything matching "${query}". Try searching for another item or category.`}
            actionLabel="Clear Search"
            onAction={handleClear}
          />
        ) : hasSearched ? (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'item' : 'items'} found
            </Text>
            <View style={styles.grid}>
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.hintsSection}>
            <Text style={styles.hintHeader}>Popular Suggestions</Text>
            {['Fresh Milk', 'Brown Bread', 'Amul Butter', 'Bananas', 'Potato Chips', 'Paneer'].map(
              (item, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => handleRecentClick(item)}
                  style={styles.suggestionRow}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                  <Text style={styles.suggestionArrow}>↗</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs
  },
  backArrow: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 42
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.xs
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.textPrimary
  },
  clearButton: {
    padding: 4
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textMuted
  },
  content: {
    backgroundColor: colors.background,
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  recentSection: {
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs
  },
  recentChipIcon: {
    fontSize: 12,
    marginRight: 4
  },
  recentChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary
  },
  resultsSection: {
    marginTop: spacing.xs
  },
  resultsCount: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  hintsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm
  },
  hintHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  suggestionText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary
  },
  suggestionArrow: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted
  }
});
