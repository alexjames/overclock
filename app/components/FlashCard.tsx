import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Flashcard } from '../types/flashcard';


interface FlashCardProps {
  card: Flashcard;
  color: string;
  isRevealed: boolean;
  onTap: () => void;
}

export function FlashCard({ card, color, isRevealed, onTap }: FlashCardProps) {
  const coverOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(coverOpacity, {
      toValue: isRevealed ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRevealed]);

  const renderContent = () => {
    if (card.type === 'tap_reveal') {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.question}>{card.question}</Text>
          <View style={styles.answerWrapper}>
            <View style={styles.answerContainer}>
              <Text style={styles.answer}>{card.answer}</Text>
              <Animated.View
                style={[styles.answerCover, { opacity: coverOpacity }]}
                pointerEvents={isRevealed ? 'none' : 'auto'}
              />
            </View>
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
              <Text style={styles.revealedWord}>
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
    alignSelf: 'stretch',
    paddingHorizontal: 32,
    paddingVertical: 48,
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
    alignItems: 'center',
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
    right: 0,
    bottom: 0,
    backgroundColor: '#6B7280',
    borderRadius: 16,
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
