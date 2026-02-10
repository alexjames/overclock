import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SlideElement as SlideElementType, TEXT_SIZES } from '../../types/slideshow';
import { FormattedText } from '../ContentRenderer';

interface SlideElementProps {
  element: SlideElementType;
  screenWidth: number;
  contentTop: number;
  contentHeight: number;
  // For multi-page slides: coordinates use extended range (0-100*pages)
  // coordinateScale normalizes back to 0-100 range
  coordinateScale?: number;
}

export function SlideElement({
  element,
  screenWidth,
  contentTop,
  contentHeight,
  coordinateScale = 1,
}: SlideElementProps) {
  // Calculate absolute position from percentage
  // For multi-page slides, y can be 0-300 for 3 pages, so we divide by coordinateScale
  // to normalize to 0-100 range, then apply to totalContentHeight
  const absoluteLeft = (element.x / 100) * screenWidth;
  const absoluteTop = contentTop + (element.y / (100 * coordinateScale)) * contentHeight;

  if (element.type === 'text') {
    const fontSize = TEXT_SIZES[element.size || 'medium'];
    const color = element.color || '#FFFFFF';
    const lineHeight = Math.round(fontSize * 1.4);

    // Calculate max width for text wrapping (remaining space to right edge with padding)
    const padding = 16;
    const maxWidth = screenWidth - absoluteLeft - padding;

    return (
      <View
        style={[
          styles.textContainer,
          {
            position: 'absolute',
            left: absoluteLeft,
            top: absoluteTop,
            maxWidth: maxWidth,
          },
        ]}
      >
        <FormattedText style={[styles.text, { fontSize, color, lineHeight }]}>
          {element.content}
        </FormattedText>
      </View>
    );
  }

  if (element.type === 'image') {
    const imageWidth = ((element.width || 50) / 100) * screenWidth;
    const imageHeight = ((element.height || 50) / 100) * contentHeight;

    return (
      <View
        style={[
          styles.imageContainer,
          {
            position: 'absolute',
            left: absoluteLeft,
            top: absoluteTop,
          },
        ]}
      >
        <Image
          source={element.url}
          style={[
            styles.image,
            {
              width: imageWidth,
              height: imageHeight,
            },
          ]}
          contentFit="contain"
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  textContainer: {
    backgroundColor: 'transparent',
  },
  text: {
    flexWrap: 'wrap',
  },
  imageContainer: {
    backgroundColor: 'transparent',
  },
  image: {
    borderRadius: 8,
  },
});
