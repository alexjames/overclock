import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutChangeEvent } from 'react-native';
import { Flashcard } from '../types/flashcard';

function darken(hex: string, amount = 0.15): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface FlashCardProps {
  card: Flashcard;
  color: string;
  isRevealed: boolean;
  onTap: () => void;
}

export function FlashCard({ card, color, isRevealed, onTap }: FlashCardProps) {
  const coverOpacity = useRef(new Animated.Value(1)).current;
  const [answerLayout, setAnswerLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    Animated.timing(coverOpacity, {
      toValue: isRevealed ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRevealed]);

  const onAnswerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setAnswerLayout({ width, height });
  };

  const renderContent = () => {
    if (card.type === 'tap_reveal') {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.question}>{card.question}</Text>
          <View style={styles.answerWrapper}>
            <View style={styles.answerContainer} onLayout={onAnswerLayout}>
              <Text style={styles.answer}>{card.answer}</Text>
            </View>
            <Animated.View
              style={[
                styles.answerCover,
                {
                  opacity: coverOpacity,
                  width: answerLayout.width || '100%',
                  height: answerLayout.height || '100%',
                },
              ]}
              pointerEvents={isRevealed ? 'none' : 'auto'}
            />
          </View>
        </View>
      );
    }

    // Fill in the blank - use flexWrap to position text parts
    if (card.type === 'fill_blank') {
      const parts = card.question.split('_____');
      return (
        <View style={styles.contentContainer}>
          <View style={styles.fillBlankRow}>
            <Text style={styles.fillBlankText}>{parts[0]}</Text>
            <View style={styles.blankAnswerWrapper}>
              <Text
                style={styles.revealedWord}
                onLayout={onAnswerLayout}
              >
                {card.answer}
              </Text>
              <Animated.View
                style={[
                  styles.inlineCover,
                  {
                    opacity: coverOpacity,
                  },
                ]}
                pointerEvents={isRevealed ? 'none' : 'auto'}
              />
            </View>
            <Text style={styles.fillBlankText}>{parts[1]}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }]}
      onPress={onTap}
      activeOpacity={0.95}
    >
      <View style={[styles.categoryTag, { backgroundColor: color, borderColor: darken(color) }]}>
        <Text style={styles.categoryTagText}>{card.category}</Text>
      </View>
      {renderContent()}
      {!isRevealed && <Text style={styles.tapHintBottom}>Tap to reveal</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  categoryTag: {
    position: 'absolute',
    top: 24,
    right: 24,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 1,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 34,
  },
  answerWrapper: {
    marginTop: 32,
    position: 'relative',
  },
  answerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
  },
  answer: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  answerCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#6B7280',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillBlankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillBlankText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 34,
  },
  blankAnswerWrapper: {
    position: 'relative',
    marginHorizontal: 4,
  },
  revealedWord: {
    color: '#8B5CF6',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 34,
  },
  inlineCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#6B7280',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankCoverText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tapHint: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tapHintBottom: {
    position: 'absolute',
    bottom: 48,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
