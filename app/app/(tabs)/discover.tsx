import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useApiHost } from '../../context/ApiHostContext';
import { fetchDiscover } from '../../api/courses';
import { DiscoverItem } from '../../types/discover';
import { DiscoverCard } from '../../components/discover/DiscoverCard';
import { DiscoverSlideViewer } from '../../components/discover/DiscoverSlideViewer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { apiHost } = useApiHost();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeItem, setActiveItem] = useState<DiscoverItem | null>(null);

  const headerHeight = 44;
  const tabBarHeight = 80;
  const cardHeight = SCREEN_HEIGHT - insets.top - headerHeight - tabBarHeight;

  const loadItems = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDiscover(apiHost);
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiHost]);

  useEffect(() => {
    setLoading(true);
    loadItems();
  }, [loadItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  // Slide viewer mode
  if (activeItem) {
    return (
      <DiscoverSlideViewer
        item={activeItem}
        onExit={() => setActiveItem(null)}
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load content</Text>
          <Text style={[styles.errorDetail, { color: colors.textMuted }]}>{error}</Text>
        </View>
      )}

      {!error && items.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nothing to discover yet</Text>
        </View>
      )}

      {!error && items.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={cardHeight}
          snapToAlignment="start"
          decelerationRate={0}
          disableIntervalMomentum
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {items.map((item) => (
            <View key={item.id} style={{ height: cardHeight }}>
              <DiscoverCard
                item={item}
                onPress={() => setActiveItem(item)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
