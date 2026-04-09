import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApiHost } from '../../context/ApiHostContext';
import { fetchDiscover } from '../../api/courses';
import { DiscoverItem } from '../../types/discover';
import { FormattedText } from '../../components/ContentRenderer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { apiHost } = useApiHost();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchDiscover(apiHost);
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const batch = shuffled.map(item => ({ ...item, id: `${item.id}-${Date.now()}-${Math.random()}` }));
      setItems(prev => [...prev, ...batch]);
    } catch {
      // silently ignore — user can keep scrolling existing items
    } finally {
      setLoadingMore(false);
    }
  }, [apiHost, loadingMore]);

  React.useEffect(() => {
    setLoading(true);
    loadItems();
  }, [loadItems]);

  useFocusEffect(useCallback(() => {
    if (error || items.length === 0) {
      setLoading(true);
      loadItems();
    }
  }, [error, items.length, loadItems]));

  const handleVerticalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
    if (index >= 0 && index < items.length) {
      setActiveItemIndex(index);
      // Trigger load when one item away from the end
      if (index >= items.length - 2) {
        loadMore();
      }
    }
  };

  const bgColor = items[activeItemIndex]?.color ?? colors.primary;

  if (loading) {
    return (
      <View style={[styles.fullScreen, styles.centered, { backgroundColor: colors.primary }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || items.length === 0) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.primary }]}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{error ?? 'Nothing to discover yet'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.fullScreen, { backgroundColor: bgColor }]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.fullScreen}
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onMomentumScrollEnd={handleVerticalScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadItems(); }}
            tintColor="#fff"
          />
        }
      >
        {items.map((item) => (
          <DiscoverItemPage key={item.id} item={item} insetBottom={insets.bottom} />
        ))}
        {loadingMore && (
          <View style={styles.loadMoreIndicator}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Per-item full-screen page ────────────────────────────────────────────────

interface DiscoverItemPageProps {
  item: DiscoverItem;
  insetBottom: number;
}

function DiscoverItemPage({ item, insetBottom }: DiscoverItemPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = item.slides.length;

  const handleHorizontalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  return (
    <View style={[styles.page, { height: SCREEN_HEIGHT, backgroundColor: item.color }]}>
      {/* Horizontal slide scroll */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleHorizontalScroll}
        scrollEventThrottle={16}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalContent}
      >
        {item.slides.map((slide) => (
          <View key={slide.id} style={[styles.slideOuter, { width: SCREEN_WIDTH }]}>
            <View style={[styles.slideInner, { paddingBottom: insetBottom + 48 }]}>
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={[styles.didYouKnowLabel, { color: item.color }]}>
                    Did you know
                  </Text>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <View style={styles.divider} />
                  {slide.blocks.map((block, i) => {
                    if (block.type === 'text') {
                      return (
                        <FormattedText key={i} style={styles.bodyText} accentColor={item.color}>
                          {block.content}
                        </FormattedText>
                      );
                    }
                    if (block.type === 'table') {
                      return (
                        <DiscoverTable key={i} headers={block.headers} rows={block.rows} color={item.color} />
                      );
                    }
                    return null;
                  })}
                </View>
              </View>
              {/* Dot indicators sit in normal flow just below the card */}
              {totalSlides > 1 && (
                <View style={styles.dotsRow}>
                  {item.slides.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === currentSlide ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function DiscoverTable({ headers, rows, color }: { headers: string[]; rows: string[][]; color: string }) {
  return (
    <View style={[tableStyles.table, { borderColor: color + '40' }]}>
      <View style={[tableStyles.headerRow, { backgroundColor: color }]}>
        {headers.map((h, i) => (
          <Text key={i} style={tableStyles.headerCell}>{h}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={[tableStyles.row, { backgroundColor: ri % 2 === 0 ? color + '10' : '#FFFFFF', borderColor: color + '30' }]}>
          {row.map((cell, ci) => (
            <Text key={ci} style={[tableStyles.cell, { color: '#111827' }]}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const tableStyles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
  },
  headerCell: {
    flex: 1,
    padding: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  cell: {
    flex: 1,
    padding: 8,
    fontSize: 11,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {},
  horizontalScroll: {
    flex: 1,
  },
  horizontalContent: {
    // no extra padding — each slide is exactly SCREEN_WIDTH
  },
  slideOuter: {
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
  },
  slideInner: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    height: SCREEN_HEIGHT * 0.7,
  },
  cardContent: {
    padding: 28,
    flex: 1,
  },
  didYouKnowLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 30,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#374151',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,1)',
    width: 18,
    borderRadius: 3,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadMoreIndicator: {
    height: SCREEN_HEIGHT * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
