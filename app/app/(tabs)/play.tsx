import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FlashCard } from '../../components/FlashCard';
import { flashcards } from '../../data/flashcards';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlayScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [hasScrolled, setHasScrolled] = useState(false);
  const hintOpacity = useRef(new Animated.Value(1)).current;

  // Calculate card height (screen height minus header, top safe area, and bottom tab bar)
  // Header is ~44px, tab bar is ~80px (including bottom safe area)
  const headerHeight = 44;
  const tabBarHeight = 80;
  const cardHeight = SCREEN_HEIGHT - insets.top - headerHeight - tabBarHeight;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasScrolled && event.nativeEvent.contentOffset.y > 10) {
      setHasScrolled(true);
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCardTap = (cardId: string) => {
    setRevealedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Play</Text>
      </View>

      {/* Swipeable Cards */}
      <ScrollView
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardHeight}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {flashcards.map((card) => (
          <View key={card.id} style={[styles.cardContainer, { height: cardHeight }]}>
            <FlashCard
              card={card}
              isRevealed={revealedCards.has(card.id)}
              onTap={() => handleCardTap(card.id)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Swipe hint */}
      <Animated.View style={[styles.swipeHint, { opacity: hintOpacity }]}>
        <Text style={[styles.swipeHintText, { color: colors.textMuted }]}>
          Swipe up for next card
        </Text>
      </Animated.View>
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
  scrollContent: {
    paddingBottom: 0,
  },
  cardContainer: {
    width: '100%',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
