import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Slide } from '../../types/slideshow';
import { SlideElement } from './SlideElement';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlideViewProps {
  slide: Slide;
}

export function SlideView({ slide }: SlideViewProps) {
  const insets = useSafeAreaInsets();

  // Calculate content area excluding safe areas and UI elements
  const contentTop = insets.top + 60; // Extra space for exit button
  const contentBottom = insets.bottom + 50; // Extra space for progress dots
  const contentHeight = SCREEN_HEIGHT - contentTop - contentBottom;

  const verticalPages = slide.verticalPages || 1;
  const hasVerticalScroll = verticalPages > 1;

  // Total height for vertical scrolling (contentHeight * number of pages)
  const totalContentHeight = contentHeight * verticalPages;

  // Separate images and text elements - render images first (behind text)
  const imageElements = slide.elements.filter((el) => el.type === 'image');
  const textElements = slide.elements.filter((el) => el.type === 'text');

  // For multi-page slides, coordinates use extended range:
  // y: 0-100 = page 1, 100-200 = page 2, 200-300 = page 3, etc.
  // We normalize by dividing by verticalPages to get 0-100 range for totalContentHeight
  const coordinateScale = verticalPages;

  const renderElements = () => (
    <>
      {/* Render images first (behind) */}
      {imageElements.map((element, index) => (
        <SlideElement
          key={`${slide.id}-img-${index}`}
          element={element}
          screenWidth={SCREEN_WIDTH}
          contentTop={contentTop}
          contentHeight={totalContentHeight}
          coordinateScale={coordinateScale}
        />
      ))}
      {/* Render text on top */}
      {textElements.map((element, index) => (
        <SlideElement
          key={`${slide.id}-txt-${index}`}
          element={element}
          screenWidth={SCREEN_WIDTH}
          contentTop={contentTop}
          contentHeight={totalContentHeight}
          coordinateScale={coordinateScale}
        />
      ))}
    </>
  );

  // If slide has vertical pages, wrap in a vertical ScrollView
  if (hasVerticalScroll) {
    return (
      <View style={styles.container}>
        <ScrollView
          pagingEnabled
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          style={styles.verticalScroll}
          contentContainerStyle={{
            height: SCREEN_HEIGHT * verticalPages,
          }}
          nestedScrollEnabled
        >
          <View style={{ height: SCREEN_HEIGHT * verticalPages }}>
            {renderElements()}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Single page slide - no vertical scroll
  return (
    <View style={styles.container}>
      {renderElements()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
  },
  verticalScroll: {
    flex: 1,
  },
});
