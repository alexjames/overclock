import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useApiHost } from '../../context/ApiHostContext';
import { FlashCard } from '../../components/FlashCard';
import { fetchFlashcards } from '../../api/courses';
import { Flashcard } from '../../types/flashcard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReviseScreen() {
  const { colors } = useTheme();
  const { apiHost } = useApiHost();
  const insets = useSafeAreaInsets();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [hasScrolled, setHasScrolled] = useState(false);
  const hintOpacity = useRef(new Animated.Value(1)).current;

  const headerHeight = 44;
  const tabBarHeight = 80;
  const cardHeight = SCREEN_HEIGHT - insets.top - headerHeight - tabBarHeight;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFlashcards(apiHost)
      .then(setFlashcards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [apiHost]);

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Revise</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Revise</Text>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load flashcards</Text>
          <Text style={[styles.errorDetail, { color: colors.textMuted }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Revise</Text>
      </View>

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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  cardContainer: {
    width: '100%',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
