import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ContentRenderer } from '../ContentRenderer';
import { DiscoverItem } from '../../types/discover';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DiscoverSlideViewerProps {
  item: DiscoverItem;
  onExit: () => void;
}

export function DiscoverSlideViewer({ item, onExit }: DiscoverSlideViewerProps) {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const totalSlides = item.slides.length;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentSlide && index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onExit} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.progress, { color: colors.textMuted }]}>
          {currentSlide + 1}/{totalSlides}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: item.color,
              width: `${((currentSlide + 1) / totalSlides) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {item.slides.map((slide) => (
          <View key={slide.id} style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
            <ScrollView
              style={styles.slideScroll}
              contentContainerStyle={styles.slideScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.slideCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.slideTitle, { color: colors.primary }]}>
                  {slide.title}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.slideBody}>
                  <ContentRenderer blocks={slide.blocks} />
                </View>
              </View>
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  progress: {
    fontSize: 14,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  progressBar: {
    height: 3,
  },
  progressFill: {
    height: '100%',
  },
  slideContainer: {
    flex: 1,
  },
  slideScroll: {
    flex: 1,
  },
  slideScrollContent: {
    padding: 12,
  },
  slideCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
  },
  slideBody: {
    padding: 24,
  },
});
