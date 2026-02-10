import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Slide, SpanningImage } from '../../types/slideshow';
import { SlideView } from './SlideView';
import { SlideshowComplete } from './SlideshowComplete';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlideshowProps {
  slides: Slide[];
  spanningImages?: SpanningImage[];
  onExit: () => void;
}

export function Slideshow({ slides, spanningImages, onExit }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Calculate content area for spanning images
  const contentTop = insets.top + 60;
  const contentBottom = insets.bottom + 50;
  const contentHeight = SCREEN_HEIGHT - contentTop - contentBottom;

  // Total items = slides + 1 completion screen
  const totalItems = slides.length + 1;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        if (index !== currentIndex && index >= 0 && index < totalItems) {
          setCurrentIndex(index);
        }
      },
    }
  );

  const progress = (currentIndex + 1) / totalItems;

  // Calculate spanning image animated style
  const getSpanningImageAnimatedStyle = (spanImg: SpanningImage) => {
    const spanSlideCount = spanImg.endSlide - spanImg.startSlide + 1;
    const totalImageWidth = SCREEN_WIDTH * spanSlideCount;
    const imageHeight = ((spanImg.height || 50) / 100) * contentHeight;
    const imageTop = contentTop + (spanImg.y / 100) * contentHeight;

    // Calculate how much to offset the image based on scroll
    // When at startSlide, show left edge; when at endSlide, show right edge
    const startOffset = spanImg.startSlide * SCREEN_WIDTH;

    // Use Animated.Value for smooth, in-sync movement
    const translateX = scrollX.interpolate({
      inputRange: [0, totalItems * SCREEN_WIDTH],
      outputRange: [startOffset, startOffset - totalItems * SCREEN_WIDTH],
      extrapolate: 'clamp',
    });

    // Fade in/out based on slide range
    const opacity = scrollX.interpolate({
      inputRange: [
        (spanImg.startSlide - 1) * SCREEN_WIDTH,
        spanImg.startSlide * SCREEN_WIDTH,
        spanImg.endSlide * SCREEN_WIDTH,
        (spanImg.endSlide + 1) * SCREEN_WIDTH,
      ],
      outputRange: [0, 1, 1, 0],
      extrapolate: 'clamp',
    });

    return {
      position: 'absolute' as const,
      top: imageTop,
      left: 0,
      width: totalImageWidth,
      height: imageHeight,
      transform: [{ translateX }],
      opacity,
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Spanning images layer - fixed position, scrolls with content */}
      {spanningImages && spanningImages.length > 0 && (
        <View style={styles.spanningImagesContainer} pointerEvents="none">
          {spanningImages.map((spanImg, index) => (
            <Animated.Image
              key={`spanning-${index}`}
              source={{ uri: spanImg.url }}
              style={getSpanningImageAnimatedStyle(spanImg)}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {/* Progress bar at top */}
      <SafeAreaView style={styles.progressBarContainer} edges={['top']}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </SafeAreaView>

      {/* Exit button - below progress bar */}
      <SafeAreaView style={styles.exitContainer} edges={['top']}>
        <TouchableOpacity onPress={onExit} style={styles.exitButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Horizontal scrolling slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <SlideView key={slide.id} slide={slide} />
        ))}
        <SlideshowComplete onExit={onExit} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  spanningImagesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  exitContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  exitButton: {
    width: 44,
    height: 44,
    marginLeft: 16,
    marginTop: 8,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
});
