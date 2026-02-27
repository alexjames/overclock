import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useApiHost } from '../../context/ApiHostContext';
import { fetchQuizList, fetchQuiz, fetchFlashcards, QuizSummary } from '../../api/courses';
import { QuizContainer } from '../../components/quiz/QuizContainer';
import { FlashCard } from '../../components/FlashCard';
import { Question, QuizResult } from '../../types/quiz';
import { Flashcard } from '../../types/flashcard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Segment = 'quizzes' | 'flashcards';
type ScreenMode = 'list' | 'loading_quiz' | 'quiz' | 'results';

export default function PracticeScreen() {
  const { colors } = useTheme();
  const { apiHost } = useApiHost();
  const insets = useSafeAreaInsets();

  const [activeSegment, setActiveSegment] = useState<Segment>('quizzes');

  // Quiz state
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizRefreshing, setQuizRefreshing] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeQuizTitle, setActiveQuizTitle] = useState('');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Flashcard state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardLoading, setFlashcardLoading] = useState(true);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [hasScrolled, setHasScrolled] = useState(false);
  const hintOpacity = useRef(new Animated.Value(1)).current;

  const headerHeight = 44;
  const segmentHeight = 48;
  const tabBarHeight = 80;
  const cardHeight = SCREEN_HEIGHT - insets.top - headerHeight - segmentHeight - tabBarHeight;

  // Load quiz list
  const loadQuizList = useCallback(async () => {
    try {
      setQuizError(null);
      const list = await fetchQuizList(apiHost);
      setQuizzes(list);
    } catch (err: any) {
      setQuizError(err.message);
    } finally {
      setQuizLoading(false);
      setQuizRefreshing(false);
    }
  }, [apiHost]);

  // Load flashcards
  const loadFlashcards = useCallback(async () => {
    try {
      setFlashcardError(null);
      const cards = await fetchFlashcards(apiHost);
      setFlashcards(cards);
    } catch (err: any) {
      setFlashcardError(err.message);
    } finally {
      setFlashcardLoading(false);
    }
  }, [apiHost]);

  useEffect(() => {
    setQuizLoading(true);
    setFlashcardLoading(true);
    loadQuizList();
    loadFlashcards();
  }, [loadQuizList, loadFlashcards]);

  // Quiz handlers
  const handleStartQuiz = async (quiz: QuizSummary) => {
    setScreenMode('loading_quiz');
    setActiveQuizTitle(quiz.title);
    try {
      const data = await fetchQuiz(apiHost, quiz.id);
      if (data.questions && data.questions.length > 0) {
        setActiveQuestions(data.questions);
        setScreenMode('quiz');
      } else {
        setScreenMode('list');
      }
    } catch {
      setScreenMode('list');
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setScreenMode('results');
  };

  const handleQuizExit = () => {
    setScreenMode('list');
    setActiveQuestions([]);
    setQuizResult(null);
  };

  const handleQuizRefresh = () => {
    setQuizRefreshing(true);
    loadQuizList();
  };

  // Flashcard handlers
  const handleFlashcardScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  // --- Full-screen quiz mode (hides segmented control) ---
  if (screenMode === 'quiz' && activeQuestions.length > 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleQuizExit} style={styles.exitButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.quizTitle, { color: colors.text }]} numberOfLines={1}>
            {activeQuizTitle}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <QuizContainer
          questions={activeQuestions}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
        />
      </SafeAreaView>
    );
  }

  // --- Results mode ---
  if (screenMode === 'results' && quizResult) {
    const isPassing = quizResult.percentage >= 70;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.resultsContainer}>
          <View style={[styles.resultsCard, { backgroundColor: colors.card }]}>
            <View style={[styles.scoreCircle, { borderColor: isPassing ? colors.success : colors.error }]}>
              <Text style={[styles.scoreText, { color: isPassing ? colors.success : colors.error }]}>
                {quizResult.percentage}%
              </Text>
            </View>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              {isPassing ? 'Great job!' : 'Keep practicing!'}
            </Text>
            <Text style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
              You got {quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correct
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={handleQuizExit}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Loading quiz mode ---
  if (screenMode === 'loading_quiz') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Main list view with segmented control ---
  const isLoading = activeSegment === 'quizzes' ? quizLoading : flashcardLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Practice</Text>
      </View>

      {/* Segmented control */}
      <View style={styles.segmentContainer}>
        <View style={[styles.segmentPill, { backgroundColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === 'quizzes' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveSegment('quizzes')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === 'quizzes' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Quizzes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === 'flashcards' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveSegment('flashcards')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === 'flashcards' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Flashcards
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Quizzes segment */}
      {!isLoading && activeSegment === 'quizzes' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={quizRefreshing} onRefresh={handleQuizRefresh} tintColor={colors.primary} />
          }
        >
          {quizError && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.text }]}>Failed to load quizzes</Text>
              <Text style={[styles.errorDetail, { color: colors.textMuted }]}>{quizError}</Text>
            </View>
          )}

          {!quizError && quizzes.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No quizzes available</Text>
            </View>
          )}

          <View style={styles.quizList}>
            {quizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                style={[styles.quizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleStartQuiz(quiz)}
                activeOpacity={0.7}
              >
                <View style={styles.quizCardLeft}>
                  <View style={[styles.courseIcon, { backgroundColor: quiz.color }]}>
                    <Ionicons name={quiz.icon as any} size={24} color="white" />
                  </View>
                  <View style={styles.quizCardInfo}>
                    <Text style={[styles.quizCardTitle, { color: colors.text }]}>{quiz.title}</Text>
                    <Text style={[styles.quizCardSubtitle, { color: colors.textMuted }]}>
                      {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={[styles.startButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.startButtonText}>Start</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Flashcards segment */}
      {!isLoading && activeSegment === 'flashcards' && (
        <>
          {flashcardError && (
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: colors.text }]}>Failed to load flashcards</Text>
              <Text style={[styles.errorDetail, { color: colors.textMuted }]}>{flashcardError}</Text>
            </View>
          )}

          {!flashcardError && flashcards.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name="albums-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No flashcards available</Text>
            </View>
          )}

          {!flashcardError && flashcards.length > 0 && (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                snapToOffsets={flashcards.map((_, i) => i * cardHeight)}
                decelerationRate="fast"
                disableIntervalMomentum
                onScroll={handleFlashcardScroll}
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
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  segmentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  segmentPill: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  quizList: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  quizCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quizCardInfo: {
    flex: 1,
  },
  quizCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quizCardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  resultsCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '700',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 32,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomPadding: {
    height: 32,
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
