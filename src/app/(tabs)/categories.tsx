/**
 * Grocery Choice Customer App - Categories Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { Header } from '@/components/ui/Header';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCategories } from '@/hooks/useCategories';
import { APP_CONFIG } from '@/constants/config';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, isLoading, error, refresh } = useCategories();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: any) => {
    router.push({
      pathname: '/search',
      params: { categoryId: String(category.id), categoryName: category.name }
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Header title="All Categories" subtitle="Fresh essentials delivered in minutes" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading && !refreshing ? (
          <LoadingIndicator label="Loading categories..." />
        ) : error ? (
          <EmptyState
            icon="⚠️"
            title="Failed to load categories"
            description={error}
            actionLabel="Retry"
            onAction={handleRefresh}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No categories found"
            description="Categories will appear here once configured."
            actionLabel="Refresh"
            onAction={handleRefresh}
          />
        ) : (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(cat)}
                style={styles.card}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: cat.imageUrl || APP_CONFIG.FALLBACK_PRODUCT_IMAGE }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.infoWrapper}>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {cat.name}
                  </Text>
                  <Text style={styles.itemCountText}>Explore Items →</Text>
                </View>
              </TouchableOpacity>
            ))}
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
  content: {
    backgroundColor: colors.background,
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm
  },
  imageWrapper: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surfaceHover
  },
  image: {
    width: '100%',
    height: '100%'
  },
  infoWrapper: {
    padding: spacing.sm,
    justifyContent: 'center'
  },
  categoryName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 18,
    minHeight: 36
  },
  itemCountText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs
  }
});
